// api/proxy/[...path].js
import fetch from 'node-fetch';

async function rawBody(req) {
  return await new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  try {
    const base = process.env.RAILWAY_API;
    if (!base) {
      return res.status(500).json({ error: 'RAILWAY_API missing' });
    }

    const dynamicPath = req.query.path?.join('/') || '';
    const targetUrl = `${base}/${dynamicPath}`;

    const headers = { ...req.headers };
    delete headers.host;

    const opts = { method: req.method, headers, redirect: 'manual' };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      opts.body = await rawBody(req);
    }

    const upstream = await fetch(targetUrl, opts);

    res.status(upstream.status);
    const ctype = upstream.headers.get('content-type');
    if (ctype) res.setHeader('Content-Type', ctype);

    const text = await upstream.text();
    return res.send(text);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Proxy failed', details: e.message });
  }
}
