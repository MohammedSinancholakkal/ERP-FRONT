import fetch from "node-fetch";

async function getRawBody(req) {
  return await new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  try {
    const targetBase = (process.env.RAILWAY_API || "").replace(/\/$/, "");
    if (!targetBase) return res.status(500).json({ error: "RAILWAY_API not configured" });

    const partialPath = req.url.replace("/api/proxy/", "");
    const targetUrl = `${targetBase}/${partialPath}`;

    const headers = { ...req.headers };
    delete headers.host;

    const opts = { method: req.method, headers, redirect: "manual" };

    if (req.method !== "GET" && req.method !== "HEAD") {
      opts.body = await getRawBody(req);
    }

    const upstream = await fetch(targetUrl, opts);

    res.status(upstream.status);
    const ct = upstream.headers.get("content-type");
    if (ct) res.setHeader("Content-Type", ct);

    const text = await upstream.text();
    return res.send(text);

  } catch (e) {
    console.error("Proxy error:", e);
    return res.status(502).json({ error: "Proxy failed", details: e.message });
  }
}
