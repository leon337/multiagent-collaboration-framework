import { readFile } from 'node:fs/promises';
import { createServer, type Server, type ServerResponse } from 'node:http';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { handleMissionCenterApi, type MissionStatusReader } from './app.js';

const defaultPublicDir = fileURLToPath(new URL('../public/', import.meta.url));

const securityHeaders: Record<string, string> = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'content-security-policy':
    "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'",
};

function contentType(path: string): string {
  switch (extname(path)) {
    case '.js':
      return 'text/javascript; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    default:
      return 'text/html; charset=utf-8';
  }
}

function respond(
  response: ServerResponse,
  status: number,
  headers: Record<string, string>,
  body: string | Buffer,
): void {
  response.writeHead(status, { ...securityHeaders, ...headers });
  response.end(body);
}

export function createMissionCenterServer(
  source: MissionStatusReader,
  publicDir = defaultPublicDir,
): Server {
  return createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    if (url.pathname === '/api/status' || url.pathname === '/healthz') {
      const result = await handleMissionCenterApi(source, {
        method: request.method ?? 'GET',
        path: url.pathname,
      });
      respond(response, result.status, result.headers, result.body);
      return;
    }

    if (request.method !== 'GET') {
      respond(
        response,
        405,
        { 'content-type': 'application/json; charset=utf-8' },
        JSON.stringify({ error: 'METHOD_NOT_ALLOWED' }),
      );
      return;
    }

    const fileName =
      url.pathname === '/'
        ? 'index.html'
        : url.pathname === '/app.js'
          ? 'app.js'
          : url.pathname === '/styles.css'
            ? 'styles.css'
            : null;
    if (!fileName) {
      respond(
        response,
        404,
        { 'content-type': 'application/json; charset=utf-8' },
        JSON.stringify({ error: 'NOT_FOUND' }),
      );
      return;
    }

    try {
      const body = await readFile(join(publicDir, fileName));
      respond(
        response,
        200,
        {
          'content-type': contentType(fileName),
          'cache-control': fileName === 'index.html' ? 'no-store' : 'public, max-age=60',
        },
        body,
      );
    } catch {
      respond(
        response,
        404,
        { 'content-type': 'application/json; charset=utf-8' },
        JSON.stringify({ error: 'STATIC_NOT_FOUND' }),
      );
    }
  });
}
