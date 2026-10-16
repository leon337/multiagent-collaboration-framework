import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_ROOT = path.resolve(fileURLToPath(new URL('.', import.meta.url)));
const HOST = '127.0.0.1';

const MIME_TYPES = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
]);

function resolveRequestPath(requestUrl) {
  let pathname;

  try {
    pathname = decodeURIComponent(new URL(requestUrl ?? '/', 'http://localhost').pathname);
  } catch {
    return { status: 400 };
  }

  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const filePath = path.resolve(APP_ROOT, relativePath);
  const insideRoot =
    filePath === APP_ROOT || filePath.startsWith(`${APP_ROOT}${path.sep}`);

  if (!insideRoot) {
    return { status: 403 };
  }

  return { status: 200, filePath };
}

const server = createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end('Method Not Allowed');
    return;
  }

  const resolved = resolveRequestPath(request.url);
  if (resolved.status !== 200) {
    response.writeHead(resolved.status, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(resolved.status === 403 ? 'Forbidden' : 'Bad Request');
    return;
  }

  try {
    const content = await readFile(resolved.filePath);
    const extension = path.extname(resolved.filePath).toLowerCase();
    const contentType = MIME_TYPES.get(extension) ?? 'application/octet-stream';

    response.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });

    if (request.method === 'HEAD') {
      response.end();
      return;
    }

    response.end(content);
  } catch (error) {
    if (error?.code === 'ENOENT' || error?.code === 'EISDIR') {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not Found');
      return;
    }

    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Internal Server Error');
  }
});

const requestedPort = Number.parseInt(process.argv[2] ?? '4173', 10);
const port = Number.isInteger(requestedPort) && requestedPort >= 0 ? requestedPort : 4173;

server.listen(port, HOST, () => {
  const address = server.address();
  const activePort = typeof address === 'object' && address ? address.port : port;
  console.log(`MCF_WORLD_WEB_URL=http://${HOST}:${activePort}`);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
