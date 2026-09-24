import { createServer, request as httpRequest, type Server as HttpServer } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { connect as netConnect, type Socket } from 'node:net';
import { isIP } from 'node:net';
import type { Duplex } from 'node:stream';
import { PublicTargetResolver, type TargetResolver } from './pinned-fetch.js';

export type PinnedEgressProxyOptions = {
  targetResolver?: TargetResolver;
  host?: string;
  port?: number;
};

function sanitizeHeaders(headers: import('node:http').IncomingHttpHeaders, host: string) {
  const result: Record<string, string | string[]> = {};
  for (const [name, value] of Object.entries(headers)) {
    if (value === undefined) continue;
    const lower = name.toLowerCase();
    if (lower === 'proxy-connection' || lower === 'proxy-authorization' || lower === 'connection') continue;
    result[name] = value;
  }
  result.host = host;
  return result;
}

export class PinnedEgressProxy {
  private readonly targetResolver: TargetResolver;
  private readonly host: string;
  private readonly port: number;
  private readonly sockets = new Set<Socket>();
  private readonly server: HttpServer;
  private listening = false;

  constructor(options: PinnedEgressProxyOptions = {}) {
    this.targetResolver = options.targetResolver ?? new PublicTargetResolver();
    this.host = options.host ?? '127.0.0.1';
    this.port = options.port ?? 0;

    this.server = createServer((req, res) => {
      void this.forwardHttp(req, res);
    });

    this.server.on('connect', (req, clientSocket, head) => {
      void this.forwardConnect(req.url ?? '', clientSocket, head);
    });

    this.server.on('connection', (socket) => {
      this.sockets.add(socket);
      socket.once('close', () => this.sockets.delete(socket));
    });
  }

  async listen(): Promise<void> {
    if (this.listening) return;
    await new Promise<void>((resolve, reject) => {
      const onError = (error: Error) => {
        this.server.off('listening', onListening);
        reject(error);
      };
      const onListening = () => {
        this.server.off('error', onError);
        this.listening = true;
        resolve();
      };
      this.server.once('error', onError);
      this.server.once('listening', onListening);
      this.server.listen(this.port, this.host);
    });
  }

  address() {
    return this.server.address();
  }

  proxyUrl(): string {
    const address = this.server.address();
    if (!address || typeof address === 'string') throw new Error('pinned proxy is not listening');
    const host = address.family === 'IPv6' ? `[${address.address}]` : address.address;
    return `http://${host}:${address.port}`;
  }

  async close(): Promise<void> {
    for (const socket of this.sockets) socket.destroy();
    this.sockets.clear();
    if (!this.listening) return;
    await new Promise<void>((resolve) => this.server.close(() => resolve()));
    this.listening = false;
  }

  private async forwardHttp(
    req: import('node:http').IncomingMessage,
    res: import('node:http').ServerResponse,
  ): Promise<void> {
    let url: URL;
    try {
      url = new URL(req.url ?? '');
      if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('unsupported protocol');
      const target = await this.targetResolver.resolve(url);
      const requester = url.protocol === 'https:' ? httpsRequest : httpRequest;
      const upstream = requester(
        {
          protocol: url.protocol,
          hostname: url.hostname,
          port: url.port || undefined,
          path: `${url.pathname}${url.search}`,
          method: req.method,
          headers: sanitizeHeaders(req.headers, url.host),
          servername: url.protocol === 'https:' && isIP(target.hostname) === 0 ? target.hostname : undefined,
          lookup: (_hostname, options, callback) => {
            const pinnedCallback = callback as (
              error: NodeJS.ErrnoException | null,
              address: string | Array<{ address: string; family: 4 | 6 }>,
              family?: 4 | 6,
            ) => void;
            if (typeof options === 'object' && options !== null && 'all' in options && options.all) {
              pinnedCallback(null, [{ address: target.address, family: target.family }]);
            } else {
              pinnedCallback(null, target.address, target.family);
            }
          },
        },
        (upstreamResponse) => {
          res.writeHead(upstreamResponse.statusCode ?? 502, upstreamResponse.statusMessage, upstreamResponse.headers);
          upstreamResponse.pipe(res);
        },
      );
      upstream.once('error', () => {
        if (!res.headersSent) res.writeHead(502);
        res.end();
      });
      req.pipe(upstream);
    } catch {
      if (!res.headersSent) res.writeHead(403);
      res.end();
    }
  }

  private async forwardConnect(authority: string, clientSocket: Duplex, head: Buffer): Promise<void> {
    try {
      const url = new URL(`https://${authority}/`);
      const port = Number.parseInt(url.port || '443', 10);
      if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error('invalid port');
      const target = await this.targetResolver.resolve(url);

      const upstream = netConnect({ host: target.address, port });
      this.sockets.add(upstream);
      upstream.once('close', () => this.sockets.delete(upstream));
      upstream.once('error', () => clientSocket.destroy());
      upstream.once('connect', () => {
        clientSocket.write('HTTP/1.1 200 Connection Established\r\nProxy-Agent: mcf-webagent\r\n\r\n');
        if (head.length) upstream.write(head);
        clientSocket.pipe(upstream);
        upstream.pipe(clientSocket);
      });
    } catch {
      clientSocket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
    }
  }
}
