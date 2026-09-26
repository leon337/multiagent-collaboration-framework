import { createHash } from 'node:crypto';
import { lookup as dnsLookup } from 'node:dns/promises';
import { request as httpsRequest } from 'node:https';
import { isIP, type LookupFunction } from 'node:net';

import type { McfToolReceipt } from '@rsa/contracts';

import type { EvidenceValidator } from './evidence-validator.js';
import {
  ExternalActionAdapterError,
  type ExternalActionAdapter,
  type ExternalActionRequest,
} from './external-action.contracts.js';
import { canonicalizeProvider, canonicalizeToolValue } from './permission-engine.js';

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_BODY_BYTES = 512 * 1024;
const MAX_REDIRECTS = 3;
const DEFAULT_MAX_MAP_URLS = 50;
const DEFAULT_MAX_COLLECT_PAGES = 5;
const MAX_COLLECT_PAGES = 10;
const MAX_RECEIPT_TEXT_BYTES = 64 * 1024;
const MAX_COLLECTION_EXCERPT_BYTES = 8 * 1024;

type AddressFamily = 4 | 6;

export interface WebTransportResponse {
  url: string;
  statusCode: number;
  contentType: string | null;
  body: string;
  byteLength: number;
  truncated: boolean;
}

export interface WebReadTransport {
  fetch(url: string): Promise<WebTransportResponse>;
}

interface ResolvedAddress {
  address: string;
  family: AddressFamily;
}

function adapterError(
  code: ConstructorParameters<typeof ExternalActionAdapterError>[0],
  message: string,
  retryable = false,
  statusCode: number | null = null,
): never {
  throw new ExternalActionAdapterError(code, message, retryable, statusCode);
}

function ipv4Number(address: string): number | null {
  const parts = address.split('.');
  if (parts.length !== 4) return null;
  const bytes = parts.map((part) => Number(part));
  if (bytes.some((byte) => !Number.isInteger(byte) || byte < 0 || byte > 255)) return null;
  return (
    ((bytes[0] ?? 0) << 24) |
    ((bytes[1] ?? 0) << 16) |
    ((bytes[2] ?? 0) << 8) |
    (bytes[3] ?? 0)
  ) >>> 0;
}

function inCidr4(value: number, network: number, prefix: number): boolean {
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (value & mask) === (network & mask);
}

export function isPublicIpAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) {
    const value = ipv4Number(address);
    if (value === null) return false;
    const blocked: Array<[string, number]> = [
      ['0.0.0.0', 8],
      ['10.0.0.0', 8],
      ['100.64.0.0', 10],
      ['127.0.0.0', 8],
      ['169.254.0.0', 16],
      ['172.16.0.0', 12],
      ['192.0.0.0', 24],
      ['192.0.2.0', 24],
      ['192.168.0.0', 16],
      ['198.18.0.0', 15],
      ['198.51.100.0', 24],
      ['203.0.113.0', 24],
      ['224.0.0.0', 4],
      ['240.0.0.0', 4],
    ];
    return !blocked.some(([network, prefix]) => {
      const numericNetwork = ipv4Number(network);
      return numericNetwork !== null && inCidr4(value, numericNetwork, prefix);
    });
  }

  if (family === 6) {
    const normalized = address.toLowerCase();
    if (
      normalized === '::' ||
      normalized === '::1' ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      /^fe[89ab]/u.test(normalized) ||
      normalized.startsWith('ff') ||
      normalized.startsWith('2001:db8:')
    ) {
      return false;
    }
    if (normalized.startsWith('::ffff:')) {
      return isPublicIpAddress(normalized.slice('::ffff:'.length));
    }
    return true;
  }

  return false;
}

export function validatePublicHttpsUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return adapterError('UNSUPPORTED_TARGET', 'web-native requires an absolute HTTPS URL');
  }

  if (
    url.protocol !== 'https:' ||
    url.username.length > 0 ||
    url.password.length > 0 ||
    (url.port.length > 0 && url.port !== '443') ||
    url.hostname.toLowerCase() === 'localhost'
  ) {
    return adapterError(
      'UNSUPPORTED_TARGET',
      'web-native permits only credential-free public HTTPS targets on port 443',
    );
  }

  const ipFamily = isIP(url.hostname);
  if (ipFamily !== 0 && !isPublicIpAddress(url.hostname)) {
    return adapterError('UNSUPPORTED_TARGET', 'web-native blocks private or reserved IP targets');
  }

  url.hash = '';
  return url;
}

async function resolvePublicAddress(hostname: string): Promise<ResolvedAddress> {
  const literalFamily = isIP(hostname);
  if (literalFamily === 4 || literalFamily === 6) {
    if (!isPublicIpAddress(hostname)) {
      return adapterError('UNSUPPORTED_TARGET', 'web-native blocks private or reserved IP targets');
    }
    return { address: hostname, family: literalFamily };
  }

  let addresses: Awaited<ReturnType<typeof dnsLookup>>;
  try {
    addresses = await dnsLookup(hostname, { all: true, verbatim: true });
  } catch {
    return adapterError('NETWORK_FAILURE', 'web-native DNS resolution failed', true);
  }

  if (!Array.isArray(addresses) || addresses.length === 0) {
    return adapterError('TARGET_NOT_FOUND', 'web-native target did not resolve', true);
  }
  if (addresses.some((entry) => !isPublicIpAddress(entry.address))) {
    return adapterError(
      'UNSUPPORTED_TARGET',
      'web-native blocks hostnames resolving to private or reserved addresses',
    );
  }

  const selected = addresses[0];
  if (!selected || (selected.family !== 4 && selected.family !== 6)) {
    return adapterError('INVALID_RESPONSE', 'web-native DNS returned an unsupported address');
  }
  return { address: selected.address, family: selected.family };
}

function statusError(statusCode: number): never {
  if (statusCode === 401 || statusCode === 403) {
    return adapterError('AUTHENTICATION_REQUIRED', 'web target requires authentication', false, statusCode);
  }
  if (statusCode === 402) {
    return adapterError('QUOTA_EXHAUSTED', 'web provider quota or payment is required', true, statusCode);
  }
  if (statusCode === 404 || statusCode === 410) {
    return adapterError('TARGET_NOT_FOUND', 'web target was not found', false, statusCode);
  }
  if (statusCode === 429) {
    return adapterError('RATE_LIMITED', 'web target rate limited the request', true, statusCode);
  }
  if (statusCode >= 500) {
    return adapterError('NETWORK_FAILURE', `web target failed with HTTP ${statusCode}`, true, statusCode);
  }
  return adapterError('INVALID_RESPONSE', `web target returned HTTP ${statusCode}`, false, statusCode);
}

function supportedContentType(value: string | null): boolean {
  if (!value) return true;
  const mediaType = value.split(';', 1)[0]?.trim().toLowerCase() ?? '';
  return (
    mediaType.startsWith('text/') ||
    ['application/json', 'application/xml', 'application/xhtml+xml'].includes(mediaType)
  );
}

export class PinnedHttpsWebTransport implements WebReadTransport {
  constructor(
    private readonly timeoutMs = DEFAULT_TIMEOUT_MS,
    private readonly maxBodyBytes = DEFAULT_MAX_BODY_BYTES,
  ) {}

  async fetch(rawUrl: string): Promise<WebTransportResponse> {
    return this.fetchRedirected(validatePublicHttpsUrl(rawUrl), 0);
  }

  private async fetchRedirected(url: URL, redirectCount: number): Promise<WebTransportResponse> {
    const resolved = await resolvePublicAddress(url.hostname);
    const pinnedLookup: LookupFunction = (_hostname, _options, callback) => {
      callback(null, resolved.address, resolved.family);
    };

    return new Promise<WebTransportResponse>((resolve, reject) => {
      const request = httpsRequest(
        url,
        {
          method: 'GET',
          headers: {
            accept: 'text/html, text/plain, application/json, application/xml;q=0.9, */*;q=0.1',
            'user-agent': 'MCF-WebNative/0.1',
          },
          lookup: pinnedLookup,
          timeout: this.timeoutMs,
        },
        (response) => {
          const statusCode = response.statusCode ?? 0;
          const location = response.headers.location;
          if (statusCode >= 300 && statusCode < 400 && location) {
            response.resume();
            if (redirectCount >= MAX_REDIRECTS) {
              reject(
                new ExternalActionAdapterError(
                  'INVALID_RESPONSE',
                  'web-native redirect limit exceeded',
                  false,
                  statusCode,
                ),
              );
              return;
            }
            let redirected: URL;
            try {
              redirected = validatePublicHttpsUrl(new URL(location, url).href);
            } catch (error) {
              reject(error);
              return;
            }
            this.fetchRedirected(redirected, redirectCount + 1).then(resolve, reject);
            return;
          }
          if (statusCode < 200 || statusCode >= 300) {
            response.resume();
            try {
              statusError(statusCode);
            } catch (error) {
              reject(error);
            }
            return;
          }

          const header = response.headers['content-type'];
          const contentType = Array.isArray(header) ? header[0] ?? null : header ?? null;
          if (!supportedContentType(contentType)) {
            response.resume();
            reject(
              new ExternalActionAdapterError(
                'UNSUPPORTED_TARGET',
                `web-native does not ingest content type ${contentType ?? 'unknown'}`,
                false,
                statusCode,
              ),
            );
            return;
          }

          const chunks: Buffer[] = [];
          let byteLength = 0;
          let truncated = false;
          response.on('data', (chunk: Buffer | string) => {
            const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            byteLength += buffer.byteLength;
            if (!truncated) {
              const accepted = Math.max(0, this.maxBodyBytes - chunks.reduce((sum, part) => sum + part.byteLength, 0));
              if (accepted > 0) chunks.push(buffer.subarray(0, accepted));
              if (byteLength > this.maxBodyBytes) truncated = true;
            }
          });
          response.on('end', () => {
            resolve({
              url: url.href,
              statusCode,
              contentType,
              body: Buffer.concat(chunks).toString('utf8'),
              byteLength,
              truncated,
            });
          });
          response.on('error', (error) => reject(error));
        },
      );

      request.on('timeout', () => {
        request.destroy(
          new ExternalActionAdapterError(
            'ADAPTER_TIMEOUT',
            'web-native request timed out',
            true,
          ),
        );
      });
      request.on('error', (error) => {
        reject(
          error instanceof ExternalActionAdapterError
            ? error
            : new ExternalActionAdapterError(
                'NETWORK_FAILURE',
                error instanceof Error ? error.message : 'web-native network failure',
                true,
              ),
        );
      });
      request.end();
    });
  }
}

function digest(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return adapterError('INVALID_CONTEXT', `${label} must be a non-empty string`);
  }
  return value.trim();
}

function boundedInteger(value: unknown, fallback: number, maximum: number, label: string): number {
  if (value === undefined) return fallback;
  if (!Number.isInteger(value) || (value as number) < 1 || (value as number) > maximum) {
    return adapterError('INVALID_CONTEXT', `${label} must be an integer between 1 and ${maximum}`);
  }
  return value as number;
}

function sameTarget(left: string, right: string): boolean {
  return validatePublicHttpsUrl(left).href === validatePublicHttpsUrl(right).href;
}

function extractSameOriginLinks(body: string, baseUrl: string, maximum: number): string[] {
  const base = validatePublicHttpsUrl(baseUrl);
  const links = new Set<string>();
  const hrefPattern = /\bhref\s*=\s*(?:"([^"]+)"|'([^']+)')/giu;
  for (const match of body.matchAll(hrefPattern)) {
    const raw = match[1] ?? match[2];
    if (!raw) continue;
    try {
      const target = validatePublicHttpsUrl(new URL(raw, base).href);
      if (target.origin !== base.origin) continue;
      links.add(target.href);
      if (links.size >= maximum) break;
    } catch {
      continue;
    }
  }
  return [...links];
}

function receiptText(response: WebTransportResponse, maximum: number): {
  text: string;
  truncated: boolean;
} {
  const encoded = Buffer.from(response.body);
  if (encoded.byteLength <= maximum) {
    return { text: response.body, truncated: response.truncated };
  }
  return {
    text: encoded.subarray(0, maximum).toString('utf8'),
    truncated: true,
  };
}

export class WebNativeReadAdapter implements ExternalActionAdapter {
  readonly adapterId = 'web-native-read-v1';

  constructor(
    private readonly evidence: EvidenceValidator,
    private readonly transport: WebReadTransport = new PinnedHttpsWebTransport(),
  ) {}

  supports(request: ExternalActionRequest): boolean {
    if (canonicalizeProvider(request.tool.provider) !== 'web-native') return false;
    const operation = canonicalizeToolValue(request.tool.operation);
    return (
      (request.skill.skillId === 'MCF-WEB-FETCH' && operation === 'fetch') ||
      (request.skill.skillId === 'MCF-WEB-MAP' && operation === 'fetch-map') ||
      (request.skill.skillId === 'MCF-WEB-COLLECT' && operation === 'fetch-collection')
    );
  }

  async execute(request: ExternalActionRequest): Promise<McfToolReceipt> {
    switch (request.skill.skillId) {
      case 'MCF-WEB-FETCH':
        return this.fetchPage(request);
      case 'MCF-WEB-MAP':
        return this.mapSite(request);
      case 'MCF-WEB-COLLECT':
        return this.collectPages(request);
      default:
        return adapterError('UNSUPPORTED_TARGET', 'web-native read adapter does not support this skill');
    }
  }

  private async fetchPage(request: ExternalActionRequest): Promise<McfToolReceipt> {
    const url = requireString(request.inputs.url, 'url');
    if (!sameTarget(url, request.tool.resource)) {
      return adapterError('INVALID_CONTEXT', 'url must match the declared tool resource');
    }
    const response = await this.transport.fetch(url);
    const content = receiptText(response, MAX_RECEIPT_TEXT_BYTES);
    return this.receipt(request, null, {
      adapterId: this.adapterId,
      readOnly: true,
      coverage: content.truncated ? 'PARTIAL' : 'COMPLETE',
      requestedUrl: validatePublicHttpsUrl(url).href,
      finalUrl: response.url,
      statusCode: response.statusCode,
      contentType: response.contentType,
      byteLength: response.byteLength,
      contentSha256: digest(response.body),
      contentText: content.text,
      truncated: content.truncated,
      limitations: content.truncated ? ['receipt_content_truncated'] : [],
    });
  }

  private async mapSite(request: ExternalActionRequest): Promise<McfToolReceipt> {
    const siteRoot = requireString(request.inputs.site_root, 'site_root');
    if (!sameTarget(siteRoot, request.tool.resource)) {
      return adapterError('INVALID_CONTEXT', 'site_root must match the declared tool resource');
    }
    const maxUrls = boundedInteger(
      request.inputs.max_urls,
      DEFAULT_MAX_MAP_URLS,
      DEFAULT_MAX_MAP_URLS,
      'max_urls',
    );
    const response = await this.transport.fetch(siteRoot);
    const discoveredUrls = extractSameOriginLinks(response.body, response.url, maxUrls);
    return this.receipt(request, null, {
      adapterId: this.adapterId,
      readOnly: true,
      coverage: 'PARTIAL',
      siteRoot: validatePublicHttpsUrl(siteRoot).href,
      finalUrl: response.url,
      discoveredUrls,
      discoveryMethods: ['root-html-links'],
      maxUrls,
      limitations: ['bounded_root_page_discovery', 'coverage_not_guaranteed_complete'],
    });
  }

  private async collectPages(request: ExternalActionRequest): Promise<McfToolReceipt> {
    const seedInput = request.inputs.seed_urls_or_site_root;
    const seeds = Array.isArray(seedInput)
      ? seedInput.map((value, index) => requireString(value, `seed_urls_or_site_root[${index}]`))
      : [requireString(seedInput, 'seed_urls_or_site_root')];
    if (seeds.length === 0) {
      return adapterError('INVALID_CONTEXT', 'at least one seed URL is required');
    }
    if (!sameTarget(seeds[0] ?? '', request.tool.resource)) {
      return adapterError('INVALID_CONTEXT', 'first seed URL must match the declared tool resource');
    }
    const maxPages = boundedInteger(
      request.inputs.max_pages,
      DEFAULT_MAX_COLLECT_PAGES,
      MAX_COLLECT_PAGES,
      'max_pages',
    );

    const queue = seeds.map((seed) => validatePublicHttpsUrl(seed).href);
    const visited = new Set<string>();
    const pages: Array<Record<string, unknown>> = [];
    const failedUrls: Array<{ url: string; code: string }> = [];

    while (queue.length > 0 && visited.size < maxPages) {
      const next = queue.shift();
      if (!next || visited.has(next)) continue;
      visited.add(next);
      try {
        const response = await this.transport.fetch(next);
        const excerpt = receiptText(response, MAX_COLLECTION_EXCERPT_BYTES);
        pages.push({
          url: next,
          finalUrl: response.url,
          statusCode: response.statusCode,
          contentType: response.contentType,
          byteLength: response.byteLength,
          contentSha256: digest(response.body),
          excerpt: excerpt.text,
          truncated: excerpt.truncated,
        });
        const root = validatePublicHttpsUrl(seeds[0] ?? next);
        for (const link of extractSameOriginLinks(response.body, response.url, maxPages * 2)) {
          if (
            validatePublicHttpsUrl(link).origin === root.origin &&
            !visited.has(link) &&
            !queue.includes(link)
          ) {
            queue.push(link);
          }
        }
      } catch (error) {
        if (!(error instanceof ExternalActionAdapterError)) throw error;
        failedUrls.push({ url: next, code: error.code });
      }
    }

    if (pages.length === 0) {
      return adapterError('NETWORK_FAILURE', 'web-native could not collect any requested page', true);
    }

    return this.receipt(request, null, {
      adapterId: this.adapterId,
      readOnly: true,
      coverage: failedUrls.length === 0 && queue.length === 0 ? 'COMPLETE' : 'PARTIAL',
      requestedSeeds: seeds,
      maxPages,
      pageCount: pages.length,
      pages,
      failedUrls,
      queuedButNotVisited: queue.length,
      limitations:
        queue.length > 0 || failedUrls.length > 0
          ? ['bounded_collection', 'partial_failures_or_remaining_queue']
          : ['bounded_collection'],
    });
  }

  private receipt(
    request: ExternalActionRequest,
    externalId: string | null,
    metadata: Record<string, unknown>,
  ): McfToolReceipt {
    return this.evidence.createTrustedReceipt({
      provider: canonicalizeProvider(request.tool.provider),
      operation: canonicalizeToolValue(request.tool.operation),
      resource: request.tool.resource,
      externalId,
      commitSha: null,
      status: 'SUCCEEDED',
      observedAt: new Date().toISOString(),
      metadata,
    });
  }
}
