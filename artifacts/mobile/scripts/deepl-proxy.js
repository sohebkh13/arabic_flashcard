// Simple CORS proxy for DeepL API — needed for web browser mode only.
// Native (Expo Go / Android) doesn't need this.
const http = require("http");
const https = require("https");

const PORT = 3099;
const DEEPL_HOST = "api-free.deepl.com";

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Only proxy /v2/* paths
  if (!req.url.startsWith("/v2/")) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    const options = {
      hostname: DEEPL_HOST,
      port: 443,
      path: req.url,
      method: req.method,
      headers: {
        "Content-Type": req.headers["content-type"] || "application/json",
        Authorization: req.headers["authorization"] || "",
      },
    };

    const proxy = https.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxy.on("error", (err) => {
      res.writeHead(502);
      res.end(`Proxy error: ${err.message}`);
    });

    if (body) proxy.write(body);
    proxy.end();
  });
});

server.listen(PORT, () => {
  console.log(`DeepL CORS proxy running on http://localhost:${PORT}`);
});
