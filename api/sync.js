// Vercel serverless function — proxies all /api/sync* requests to API_SERVER_URL.
// Set API_SERVER_URL in Vercel environment variables (e.g. https://your-api.railway.app).

const API_SERVER_URL = (process.env.API_SERVER_URL || "").replace(/\/+$/, "");

async function handler(req, res) {
  if (!API_SERVER_URL) {
    res.status(503).json({
      error: "Sync API not configured",
      hint: "Set the API_SERVER_URL environment variable in your Vercel project settings.",
    });
    return;
  }

  const upstream = `${API_SERVER_URL}${req.url}`;
  const headers = { "Content-Type": req.headers["content-type"] || "application/json" };
  if (req.headers.authorization) headers["Authorization"] = req.headers.authorization;

  const hasBody = !["GET", "HEAD"].includes(req.method) && req.body != null;

  try {
    const proxyRes = await fetch(upstream, {
      method: req.method,
      headers,
      body: hasBody ? JSON.stringify(req.body) : undefined,
    });
    const body = await proxyRes.text();
    res
      .status(proxyRes.status)
      .setHeader("Content-Type", proxyRes.headers.get("content-type") || "application/json")
      .end(body);
  } catch (err) {
    console.error("[sync proxy]", err);
    res.status(502).json({ error: "Upstream unreachable", message: err.message });
  }
}

module.exports = handler;
module.exports.config = { api: { bodyParser: { sizeLimit: "4mb" } } };
