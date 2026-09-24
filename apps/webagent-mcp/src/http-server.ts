import { createServer, type Server as NodeHttpServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { toNodeHandler } from '@modelcontextprotocol/node';
import { createMcpHandler } from '@modelcontextprotocol/server';
import type { BrowserRuntime } from './browser-runtime.js';
import { createDefaultBrowserRuntime, DeterministicBrowserRuntime } from './browser-runtime.js';
import type { ExecutionEnvelope } from './contracts.js';
import { executeEnvelope, OperationError } from './execution.js';
import type { FetchData, FetchProvider, FetchRequest } from './fetch-provider.js';
import { HttpFetchProvider } from './fetch-provider.js';
import type { SearchProvider } from './search-provider.js';
import { createDefaultSearchProvider } from './search-provider.js';
import { createWebAgentServer, type WebAgentDependencies } from './server.js';

export type WebAgentHttpServerOptions = {
  host?: string;
  port?: number;
  allowedHosts?: string[];
  allowedOrigins?: string[];
  openWorldEnabled?: boolean;
  dependencies?: WebAgentDependencies;
};

export type WebAgentHttpServer = {
  listen(): Promise<void>;
  close(): Promise<void>;
  address(): ReturnType<NodeHttpServer['address']>;
};

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);

class RemoteOpenWorldDisabledFetchProvider implements FetchProvider {
  async fetch(request: FetchRequest): Promise<ExecutionEnvelope<FetchData>> {
    return executeEnvelope(
      'web_fetch',
      async () => {
        throw new OperationError(
          'REMOTE_OPEN_WORLD_DISABLED',
          'remote open-world fetch is disabled until transport-level egress pinning is qualified',
        );
      },
      {
        evidence: [{ kind: 'policy', ref: 'remote-open-world:disabled', detail: request.url }],
        errorCode: 'REMOTE_OPEN_WORLD_DISABLED',
      },
    );
  }
}

function parseCsv(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : undefined;
}

function normalizeHostname(value: string): string {
  const trimmed = value.trim().toLowerCase();
  if (trimmed.startsWith('[')) {
    const end = trimmed.indexOf(']');
    return end >= 0 ? trimmed.slice(1, end) : trimmed;
  }
  const colon = trimmed.lastIndexOf(':');
  if (colon > -1 && trimmed.indexOf(':') === colon) return trimmed.slice(0, colon);
  return trimmed;
}

function normalizeAllowed(values: string[]): Set<string> {
  return new Set(values.map((value) => normalizeHostname(value)).filter(Boolean));
}

function isAllowedHost(rawHost: string | undefined, allowed: Set<string>): boolean {
  if (!rawHost) return false;
  return allowed.has(normalizeHostname(rawHost));
}

function isAllowedOrigin(rawOrigin: string | undefined, allowed: Set<string>): boolean {
  if (!rawOrigin) return true;
  if (rawOrigin === 'null') return false;
  try {
    return allowed.has(normalizeHostname(new URL(rawOrigin).hostname));
  } catch {
    return false;
  }
}

function resolvePort(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? '3000', 10);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 65_535) {
    throw new Error('PORT must be an integer between 0 and 65535');
  }
  return parsed;
}

function createSharedDependencies(
  deps: WebAgentDependencies,
  openWorldEnabled: boolean,
): {
  dependencies: Required<WebAgentDependencies>;
  ownedRuntime: BrowserRuntime | undefined;
} {
  const searchProvider: SearchProvider = deps.searchProvider ?? createDefaultSearchProvider();
  const fetchProvider: FetchProvider =
    deps.fetchProvider ?? (openWorldEnabled ? new HttpFetchProvider() : new RemoteOpenWorldDisabledFetchProvider());
  const browserRuntime: BrowserRuntime =
    deps.browserRuntime ?? (openWorldEnabled ? createDefaultBrowserRuntime() : new DeterministicBrowserRuntime());

  return {
    dependencies: { searchProvider, fetchProvider, browserRuntime },
    ownedRuntime: deps.browserRuntime ? undefined : browserRuntime,
  };
}

export function createWebAgentHttpServer(options: WebAgentHttpServerOptions = {}): WebAgentHttpServer {
  const host = options.host ?? process.env.WEBAGENT_HOST?.trim() ?? '127.0.0.1';
  const port = options.port ?? resolvePort(process.env.PORT);
  const configuredHosts =
    options.allowedHosts ??
    parseCsv(process.env.WEBAGENT_ALLOWED_HOSTS) ??
    (process.env.RENDER_EXTERNAL_HOSTNAME?.trim() ? [process.env.RENDER_EXTERNAL_HOSTNAME.trim()] : undefined);
  const configuredOrigins = options.allowedOrigins ?? parseCsv(process.env.WEBAGENT_ALLOWED_ORIGINS);

  const allowedHosts =
    configuredHosts ??
    (LOOPBACK_HOSTS.has(host)
      ? ['127.0.0.1', 'localhost', '::1']
      : (() => {
          throw new Error('WEBAGENT_ALLOWED_HOSTS is required when binding to a non-loopback host');
        })());

  const allowedOrigins = configuredOrigins ?? (LOOPBACK_HOSTS.has(host) ? ['127.0.0.1', 'localhost', '::1'] : []);
  const allowedHostSet = normalizeAllowed(allowedHosts);
  const allowedOriginSet = normalizeAllowed(allowedOrigins);
  const openWorldEnabled =
    options.openWorldEnabled ??
    (LOOPBACK_HOSTS.has(host) || process.env.WEBAGENT_REMOTE_OPEN_WORLD?.trim().toLowerCase() === 'enabled');
  const { dependencies, ownedRuntime } = createSharedDependencies(options.dependencies ?? {}, openWorldEnabled);

  const handler = createMcpHandler(() => createWebAgentServer(dependencies));
  const nodeHandler = toNodeHandler(handler, {
    onerror(error) {
      console.error('[mcf-webagent] MCP HTTP adapter error:', error instanceof Error ? error.message : String(error));
    },
  });

  const server = createServer((req, res) => {
    if (!isAllowedHost(req.headers.host, allowedHostSet)) {
      res.writeHead(403, { 'content-type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'host_not_allowed' }));
      return;
    }

    const origin = Array.isArray(req.headers.origin) ? req.headers.origin[0] : req.headers.origin;
    if (!isAllowedOrigin(origin, allowedOriginSet)) {
      res.writeHead(403, { 'content-type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'origin_not_allowed' }));
      return;
    }

    const pathname = new URL(req.url ?? '/', 'http://mcf-webagent.invalid').pathname;

    if (pathname === '/health/ready') {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405, { allow: 'GET, HEAD' });
        res.end();
        return;
      }

      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
      if (req.method === 'HEAD') {
        res.end();
        return;
      }
      res.end(
        JSON.stringify({
          status: 'ok',
          service: 'mcf-webagent',
          version: '0.3.0',
          transport: 'streamable-http',
          openWorldEnabled,
        }),
      );
      return;
    }

    if (pathname !== '/mcp') {
      res.writeHead(404, { 'content-type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'not_found' }));
      return;
    }

    void Promise.resolve(nodeHandler(req, res)).catch((error: unknown) => {
      console.error('[mcf-webagent] request error:', error instanceof Error ? error.message : String(error));
      if (!res.headersSent) res.writeHead(500);
      if (!res.writableEnded) res.end();
    });
  });

  let listening = false;
  let closing: Promise<void> | undefined;

  return {
    async listen(): Promise<void> {
      if (listening) return;
      await new Promise<void>((resolve, reject) => {
        const onError = (error: Error) => {
          server.off('listening', onListening);
          reject(error);
        };
        const onListening = () => {
          server.off('error', onError);
          listening = true;
          resolve();
        };
        server.once('error', onError);
        server.once('listening', onListening);
        server.listen(port, host);
      });
    },

    async close(): Promise<void> {
      if (closing) return closing;
      closing = (async () => {
        await handler.close();
        if (listening) {
          await new Promise<void>((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
          });
          listening = false;
        }
        await ownedRuntime?.dispose?.();
      })();
      return closing;
    },

    address() {
      return server.address();
    },
  };
}

async function runFromEnvironment(): Promise<void> {
  const app = createWebAgentHttpServer();
  await app.listen();
  const address = app.address();
  const bound =
    typeof address === 'object' && address
      ? `${address.address}:${address.port}`
      : String(address ?? 'unknown');
  console.error(`mcf-webagent MCP server running on Streamable HTTP at ${bound}/mcp`);

  const shutdown = async () => {
    await app.close();
    process.exit(0);
  };
  process.once('SIGINT', () => void shutdown());
  process.once('SIGTERM', () => void shutdown());
}

const entrypoint = process.argv[1];
if (entrypoint && import.meta.url === pathToFileURL(entrypoint).href) {
  void runFromEnvironment().catch((error: unknown) => {
    console.error('[mcf-webagent] failed to start:', error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
