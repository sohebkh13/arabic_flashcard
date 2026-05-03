const DEEPL_API_ROOT = "https://api-free.deepl.com/v2";

function buildHeaders(req) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    ...(req.headers.authorization && { Authorization: req.headers.authorization }),
  };
}

function getProxyBody(req) {
  if (["GET", "HEAD"].includes(req.method)) return undefined;

  const contentType = req.headers["content-type"] || "";
  // Vercel bodyParser turns URL-encoded bodies into objects; re-serialize them.
  if (contentType.includes("application/x-www-form-urlencoded") && typeof req.body === "object" && req.body !== null) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(req.body)) {
      params.append(key, String(value));
    }
    return params.toString();
  }
  if (contentType.includes("application/json") && typeof req.body === "object" && req.body !== null) {
    return JSON.stringify(req.body);
  }
  return req.body;
}

async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, buildHeaders(req)).end();
    return;
  }

  let path = req.url.replace(/^\/api\/deepl/, "") || "/";
  const upstream = `${DEEPL_API_ROOT}${path.startsWith("/") ? "" : "/"}${path}`;

  try {
    const proxyRes = await fetch(upstream, {
      method: req.method,
      headers: {
        Authorization: req.headers.authorization || req.headers.Authorization || "",
        "Content-Type": req.headers["content-type"] || "application/json",
      },
      body: getProxyBody(req),
    });

    const body = await proxyRes.text();
    res.writeHead(proxyRes.status, {
      ...buildHeaders(req),
      "Content-Type": proxyRes.headers.get("content-type") || "application/json",
    }).end(body);
  } catch (err) {
    console.error("DeepL proxy error:", err);
    res.writeHead(500, { "Content-Type": "application/json", ...buildHeaders(req) })
      .end(JSON.stringify({ error: "Proxy error", message: err.message }));
  }
}

module.exports = handler;
module.exports.config = { api: { bodyParser: { sizeLimit: "1mb" } } };
