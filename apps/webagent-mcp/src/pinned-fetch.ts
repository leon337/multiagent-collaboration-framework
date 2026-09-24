import { lookup } from 'node:dns/promises';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { isIP } from 'node:net';
import { Readable } from 'node:stream';
import { isBlockedIp, type HostResolver } from './egress-policy.js';
import { OperationError } from './execution.js';

export type ResolvedTarget = {
  hostname: string;
  address: string;
  family: 4 | 6;
};

export interface TargetResolver {
  resolve(url: URL): Promise<ResolvedTarget>;
}

const defaultResolver: HostResolver = async (hostname) => {
  const answers = await lookup(hostname, { all: true, verbatim: true });
  return answers.map((answer) => answer.address);
};

function stripIpv6Brackets(hostname: string): string {
  return hostname.startsWith('[') && hostname.endsWith(']') ? hostname.slice(1, -1) : hostname;
}

function isBlockedHostname(hostname: string): boolean {
  const normalized = stripIpv6Brackets(hostname).toLowerCase().replace(/\.$/, '');
  return (
    normalized === 'localhost' ||
    normalized.endsWith('.localhost') ||
    normalized.endsWith('.local') ||
    normalized.endsWith('.internal') ||
    normalized === 'home.arpa' ||
    normalized.endsWith('.home.arpa')
  );
}

export class PublicTargetResolver implements TargetResolver {
  constructor(private readonly resolver: HostResolver = defaultResolver) {}

  async resolve(url: URL): Promise<ResolvedTarget> {
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new OperationError('EGRESS_BLOCKED', 'pinned egress allows only HTTP and HTTPS URLs');
    }
    if (url.username || url.password) {
      throw new OperationError('EGRESS_BLOCKED', 'embedded URL credentials are blocked');
    }

    const hostname = stripIpv6Brackets(url.hostname).toLowerCase().replace(/\.$/, '');
    if (!hostname || isBlockedHostname(hostname)) {
      throw new OperationError('EGRESS_BLOCKED', `blocked hostname: ${hostname || '<empty>'}`);
    }

    const directFamily = isIP(hostname);
    if (directFamily === 4 || directFamily === 6) {
      if (isBlockedIp(hostname)) {
        throw new OperationError('EGRESS_BLOCKED', `blocked non-public IP: ${hostname}`);
      }
      return { hostname, address: hostname, family: directFamily };
    }

    let addresses: string[];
    try {
      addresses = await this.resolver(hostname);
    } catch {
      throw new OperationError('EGRESS_DNS_FAILED', `DNS resolution failed for ${hostname}`);
    }

    if (addresses.length === 0) {
      throw new OperationError('EGRESS_DNS_FAILED', `DNS resolution returned no addresses for ${hostname}`);
    }

    for (const address of addresses) {
      if (isBlockedIp(address)) {
        throw new OperationError('EGRESS_BLOCKED', `hostname ${hostname} resolved to blocked address ${address}`);
      }
    }

    const selected = addresses.find((address) => {
      const family = isIP(address);
      return family === 4 || family === 6;
    });
    if (!selected) {
      throw new OperationError('EGRESS_DNS_FAILED', `DNS resolution returned no usable address for ${hostname}`);
    }

    const family = isIP(selected);
    if (family !== 4 && family !== 6) {
      throw new OperationError('EGRESS_DNS_FAILED', `invalid resolved address for ${hostname}`);
    }

    return { hostname, address: selected, family };
  }
}

export type PinnedFetch = (input: string | URL, init?: RequestInit) => Promise<Response>;

function requestBody(body: BodyInit | null | undefined): string | Uint8Array | undefined {
  if (body == null) return undefined;
  if (typeof body === 'string') return body;
  if (body instanceof URLSearchParams) return body.toString();
  if (body instanceof ArrayBuffer) return new Uint8Array(body);
  if (ArrayBuffer.isView(body)) {
    return new Uint8Array(body.buffer, body.byteOffset, body.byteLength);
  }
  throw new OperationError('FETCH_FAILED', 'pinned fetch does not support streaming request bodies');
}

function responseHeaders(raw: import('node:http').IncomingHttpHeaders): Headers {
  const headers = new Headers();
  for (const [name, value] of Object.entries(raw)) {
    if (Array.isArray(value)) {
      for (const item of value) headers.append(name, item);
    } else if (value !== undefined) {
      headers.set(name, String(value));
    }
  }
  return headers;
}

export function createPinnedFetch(targetResolver: TargetResolver = new PublicTargetResolver()): PinnedFetch {
  return async (input, init = {}) => {
    const url = input instanceof URL ? new URL(input.toString()) : new URL(input);
    const target = await targetResolver.resolve(url);
    const body = requestBody(init.body);
    const headers = new Headers(init.headers);

    return new Promise<Response>((resolve, reject) => {
      const requester = url.protocol === 'https:' ? httpsRequest : httpRequest;
      const request = requester(
        {
          protocol: url.protocol,
          hostname: url.hostname,
          port: url.port || undefined,
          path: `${url.pathname}${url.search}`,
          method: init.method ?? 'GET',
          headers: Object.fromEntries(headers.entries()),
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
        (response) => {
          const status = response.statusCode ?? 502;
          const noBody = status === 101 || status === 204 || status === 205 || status === 304;
          const stream = noBody ? null : (Readable.toWeb(response) as ReadableStream<Uint8Array>);
          resolve(
            new Response(stream, {
              status,
              statusText: response.statusMessage ?? '',
              headers: responseHeaders(response.headers),
            }),
          );
        },
      );

      const abort = () => request.destroy(new Error('request aborted'));
      if (init.signal?.aborted) {
        abort();
      } else {
        init.signal?.addEventListener('abort', abort, { once: true });
      }

      request.once('error', reject);
      request.once('close', () => init.signal?.removeEventListener('abort', abort));

      if (body === undefined) request.end();
      else request.end(body);
    });
  };
}
