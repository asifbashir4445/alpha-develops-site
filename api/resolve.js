export const maxDuration = 60;

/* Alpha Pulse web downloader — server-side proxy to the Dubai resolver.
   The browser never sees the resolver token: it lives only in the
   Vercel environment variable ALPHA_RESOLVER_TOKEN. The proxy validates
   the URL, rate-limits per client IP (the resolver itself caps the
   proxy's shared IP at 20/min), and forwards the request to the
   resolver's /resolve endpoint. */

const RESOLVER_BASE =
  process.env.RESOLVER_BASE_URL || "http://141.145.150.182:8080";
const TOKEN = process.env.ALPHA_RESOLVER_TOKEN || "";

// Tiny in-memory per-IP rate limit: 10 resolves / minute / IP.
// (Vercel serverless instances are short-lived, so this is a soft guard;
// the resolver enforces its own hard limit on the proxy's IP.)
const hits = new Map();
function rateOk(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 60000);
  if (list.length >= 10) return false;
  list.push(now);
  hits.set(ip, list);
  return true;
}

function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.json(body);
}

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
    return json(res, 405, { error: "method not allowed" });
  }
  if (!TOKEN) {
    return json(res, 503, {
      error: "not_configured",
      message:
        "The web downloader is being switched on — please try again in a little while, or use the Alpha Pulse app.",
    });
  }

  const rawUrl =
    req.method === "POST"
      ? (req.body && req.body.url) || ""
      : (req.query && req.query.url) || "";
  const url = String(rawUrl || "").trim();
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return json(res, 400, { error: "bad_url", message: "That link does not look like a web address. Paste a full video link." });
  }
  if ((parsed.protocol !== "http:" && parsed.protocol !== "https:") || !parsed.hostname || url.length > 2000) {
    return json(res, 400, { error: "bad_url", message: "That link does not look like a web address. Paste a full video link." });
  }

  const ip =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    (req.socket && req.socket.remoteAddress) ||
    "unknown";
  if (!rateOk(ip)) {
    return json(res, 429, {
      error: "rate_limited",
      message: "Too many links at once — wait a minute and try again.",
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const r = await fetch(RESOLVER_BASE + "/resolve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + TOKEN,
        "X-Forwarded-For": ip,
      },
      body: JSON.stringify({ url }),
      signal: controller.signal,
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      const msg =
        data && data.error
          ? String(data.error).slice(0, 300)
          : "The video could not be read.";
      return json(res, r.status === 429 ? 429 : 422, {
        error: "resolve_failed",
        message: msg,
      });
    }
    return json(res, 200, data);
  } catch (e) {
    return json(res, 504, {
      error: "resolve_timeout",
      message:
        "The video took too long to read — try again, or use the Alpha Pulse app.",
    });
  } finally {
    clearTimeout(timer);
  }
}
