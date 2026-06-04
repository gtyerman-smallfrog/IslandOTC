/**
 * Island API proxy — optional, zero-dependency Node server.
 *
 * Why this exists: a static browser page can technically call the Island API
 * with fetch(), but two things get in the way for real/live use:
 *   1. CORS — the Island Management Console host won't return the headers a
 *      browser needs to read cross-origin responses.
 *   2. Key safety — an API key embedded in client JS is visible to everyone.
 *
 * This proxy solves both: it holds the API key server-side (from an env var),
 * forwards `/api/v1/*` to your Island host, and adds permissive CORS headers so
 * the dashboard can talk to it. Point the dashboard's "API base URL" at this
 * server (e.g. http://localhost:8787) and set mode = live.
 *
 * Run:
 *   ISLAND_BASE_URL=https://your-tenant.island.io \
 *   ISLAND_API_KEY=sk_live_xxx \
 *   ISLAND_AUTH_HEADER=x-api-key \
 *   node proxy/server.js
 *
 * No npm install required — uses only Node's built-in `http`/`https` (Node 18+).
 */
const http = require('http');
const https = require('https');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 8787);
const ISLAND_BASE_URL = process.env.ISLAND_BASE_URL || '';
const ISLAND_API_KEY = process.env.ISLAND_API_KEY || '';
const AUTH_SCHEME = (process.env.ISLAND_AUTH_SCHEME || 'header').toLowerCase(); // 'header' | 'bearer'
const AUTH_HEADER = process.env.ISLAND_AUTH_HEADER || 'x-api-key';
// Restrict which browser origins may use the proxy ('*' for any during local dev).
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || '*';

if (!ISLAND_BASE_URL) {
  console.error('Set ISLAND_BASE_URL (e.g. https://your-tenant.island.io)');
  process.exit(1);
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOW_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key, Authorization');
}

const server = http.createServer((req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  if (req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, upstream: ISLAND_BASE_URL }));
  }

  // Only proxy the API surface.
  if (!req.url.startsWith('/api/')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Not found. Proxy serves /api/* only.' }));
  }

  const target = new URL(req.url, ISLAND_BASE_URL);
  const headers = { Accept: 'application/json' };
  if (ISLAND_API_KEY) {
    if (AUTH_SCHEME === 'bearer') headers['Authorization'] = `Bearer ${ISLAND_API_KEY}`;
    else headers[AUTH_HEADER] = ISLAND_API_KEY;
  }

  const upstream = https.request(target, { method: 'GET', headers }, (up) => {
    res.writeHead(up.statusCode || 502, {
      'Content-Type': up.headers['content-type'] || 'application/json',
      'Access-Control-Allow-Origin': ALLOW_ORIGIN,
    });
    up.pipe(res);
  });
  upstream.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Upstream request failed', detail: err.message }));
  });
  upstream.end();
});

server.listen(PORT, () => {
  console.log(`Island proxy on http://localhost:${PORT}  ->  ${ISLAND_BASE_URL}`);
  console.log(`Auth: ${AUTH_SCHEME === 'bearer' ? 'Authorization: Bearer ***' : AUTH_HEADER + ': ***'}`);
});
