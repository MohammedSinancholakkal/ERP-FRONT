// api/proxy/[...path].js
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
    const { path } = req.query; // array from [...path]
    const targetBase = (process.env.RAILWAY_API || "").replace(/\/$/, "");
    if (!targetBase) {
      return res.status(500).json({ error: "RAILWAY_API not configured" });
    }

    const targetPath = Array.isArray(path) ? path.join("/") : path || "";
    const targetUrl = `${targetBase}/${targetPath}`;

    // Clone headers and remove some hop-by-hop headers
    const forwardedHeaders = { ...req.headers };
    delete forwardedHeaders.host;
    delete forwardedHeaders["x-vercel-id"];
    // ensure host is target host
    forwardedHeaders["host"] = (new URL(targetUrl)).host;

    const fetchOptions = {
      method: req.method,
      headers: forwardedHeaders,
      redirect: "manual",
    };

    // Forward raw body (works for JSON, form-data, binary)
    if (req.method !== "GET" && req.method !== "HEAD") {
      const raw = await getRawBody(req);
      if (raw && raw.length) {
        fetchOptions.body = raw;
      }
    }

    const upstream = await fetch(targetUrl, fetchOptions);

    // Pass status
    res.status(upstream.status);

    // Forward selected headers (content-type most important, set-cookie if present)
    const contentType = upstream.headers.get("content-type");
    if (contentType) res.setHeader("Content-Type", contentType);

    const setCookie = upstream.headers.raw()["set-cookie"];
    if (setCookie) {
      // forward cookies from upstream to client
      // note: cookie domain will be your frontend domain (Vercel)
      res.setHeader("Set-Cookie", setCookie);
    }

    // forward other headers if you need (CORS typically not needed since browser talks to Vercel)
    const text = await upstream.text();
    return res.send(text);
  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(502).json({ error: "Proxy failed", details: err.message });
  }
}

