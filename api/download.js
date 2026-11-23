/* Alpha Pulse web downloader — download relay redirect.
   The browser cannot call the resolver's /download itself (it needs no
   token any more, but the resolver host must stay out of the page), so
   this function validates the signed relay link and hands the browser
   straight to the resolver, which streams the file with
   Content-Disposition: attachment. The signature is an HMAC issued only
   by token-gated /resolve, so only links the resolver itself issued work. */

const RESOLVER_BASE =
  process.env.RESOLVER_BASE_URL || "http://141.145.150.182:8080";

const hits = new Map();
function rateOk(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 60000);
  if (list.length >= 20) return false;
  list.push(now);
  hits.set(ip, list);
  return true;
}

export default function handler(req, res) {
  const q = req.query || {};
  const u = String(q.u || "");
  const s = String(q.s || "");
  const f = String(q.f || "");
  let ok = false;
  try {
    const parsed = new URL(u);
    ok =
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      /^[0-9a-f]{32}$/.test(s) &&
      u.length <= 4000;
  } catch {
    ok = false;
  }
  if (!ok) {
    res.status(400).setHeader("Content-Type", "text/plain");
    res.send("That download link is not valid. Go back and press Download again.");
    return;
  }
  const ip =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    (req.socket && req.socket.remoteAddress) ||
    "unknown";
  if (!rateOk(ip)) {
    res.status(429).setHeader("Content-Type", "text/plain");
    res.send("Too many downloads at once — wait a minute and try again.");
    return;
  }
  const target =
    RESOLVER_BASE +
    "/download?u=" +
    encodeURIComponent(u) +
    "&s=" +
    encodeURIComponent(s) +
    (f ? "&f=" + encodeURIComponent(f) : "");
  res.writeHead(302, { Location: target });
  res.end();
}
