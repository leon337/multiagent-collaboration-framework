import http from 'node:http';

export function createBootstrapServer(verifyToken) {
  if (typeof verifyToken !== 'string' || verifyToken.length < 32) throw Error('meta_verify_token_missing');
  return http.createServer((req, res) => {
    res.setHeader('cache-control', 'no-store');
    res.setHeader('x-content-type-options', 'nosniff');
    let url;
    try {
      if (String(req.url || '').length > 1500) throw Error('invalid_path');
      url = new URL(req.url || '/', 'http://localhost');
    } catch {
      res.writeHead(400).end();
      return;
    }
    // Funnel may strip the public mount prefix. No other route is published.
    if (url.pathname !== '/' && url.pathname !== '/webhook') {
      res.writeHead(404).end();
      return;
    }
    if (req.method !== 'GET') {
      res.writeHead(503, { 'content-type': 'text/plain' }).end('not_configured');
      return;
    }
    if (url.searchParams.get('hub.mode') !== 'subscribe' ||
        url.searchParams.get('hub.verify_token') !== verifyToken ||
        !/^\d{1,250}$/.test(url.searchParams.get('hub.challenge') || '')) {
      res.writeHead(403).end();
      return;
    }
    res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
    res.end(url.searchParams.get('hub.challenge'));
  });
}
