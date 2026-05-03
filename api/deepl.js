const DEEPL_API_ROOT = "https://api-free.deepl.com/v2";

function buildHeaders(req) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    ...(req.headers.authorization && { Authorization: req.headers.authorization }),
  };
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, buildHeaders(req)).end();
    return;
  }

  let path = req.url.replace(/^\/api\/deepl/, "") || "/";
  const upstream = `${DEEPL_API_ROOT}${path.startsWith("/") ? "" : "/"}${path}`;

  const proxyRes = await fetch(upstream, {
    method: req.method,
    headers: {
      Authorization: req.headers.authorization || req.headers.Authorization || "",
      "Content-Type": req.headers["content-type"] || "application/json",
    },
    body: ["GET", "HEAD"].includes(req.method) ? undefined : req.body,
  });

  const body = await proxyRes.text();
  res.writeHead(proxyRes.status, {
    ...buildHeaders(req),
    "Content-Type": proxyRes.headers.get("content-type") || "application/json",
  }).end(body);
}

export const config = { api: { bodyParser: { sizeLimit: "1mb" } } };
