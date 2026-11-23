/* Alpha Pulse web downloader — download relay redirect.
   The browser cannot call the resolver's /download itself, so this
   function validates the signed relay link and hands the browser
   straight to the resolver, which streams the file with
   Content-Disposition: attachment. The signature is an HMAC issued only
   by token-gated /resolve, so only links the resolver itself issued
   work. The whole query string is forwarded unchanged, so both relay
   forms work: the plain media link (u + s) and the yt-dlp fetch
   (w + fmt + s), which is what gated CDNs like TikTok need. */

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
  const s = String(q.s || "");
  const hasTarget = q.u || (q.w && q.fmt);
  if (!/^[0-9a-f]{32}$/.test(s) || !hasTarget) {
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
  const raw = (req.url || "").split("?")[1] || "";
  res.writeHead(302, { Location: RESOLVER_BASE + "/download?" + raw });
  res.end();
}
