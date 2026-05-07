import { Router, type IRouter } from "express";

const DEEPL_API_ROOT = "https://api-free.deepl.com/v2";
const router: IRouter = Router();

async function proxyToDeepL(req: any, res: any, deeplPath: string) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const upstream = `${DEEPL_API_ROOT}/${deeplPath}`;

  try {
    let body: string | undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      const contentType = req.headers["content-type"] || "";
      if (contentType.includes("application/x-www-form-urlencoded") && req.body && typeof req.body === "object") {
        const params = new URLSearchParams();
        for (const [k, v] of Object.entries(req.body as Record<string, string>)) {
          params.append(k, String(v));
        }
        body = params.toString();
      } else if (typeof req.body === "object" && req.body !== null) {
        body = JSON.stringify(req.body);
      } else {
        body = req.body as string;
      }
    }

    const proxyRes = await fetch(upstream, {
      method: req.method,
      headers: {
        "Content-Type": req.headers["content-type"] || "application/x-www-form-urlencoded",
        Authorization: (req.headers["authorization"] as string) || "",
      },
      body,
    });

    const text = await proxyRes.text();
    res.status(proxyRes.status)
      .set("Content-Type", proxyRes.headers.get("content-type") || "application/json")
      .send(text);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "DeepL proxy error", detail: msg });
  }
}

router.options("/deepl/translate", (_req, res) => res.status(204).end());
router.post("/deepl/translate", (req, res) => proxyToDeepL(req, res, "translate"));
router.options("/deepl/languages", (_req, res) => res.status(204).end());
router.get("/deepl/languages", (req, res) => proxyToDeepL(req, res, "languages"));

export default router;
