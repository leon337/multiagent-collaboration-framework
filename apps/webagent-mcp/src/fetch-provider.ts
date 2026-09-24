import type { ExecutionEnvelope } from './contracts.js';
import { type EgressPolicy, PublicEgressPolicy } from './egress-policy.js';
import { executeEnvelope, OperationError } from './execution.js';
import { createPinnedFetch } from './pinned-fetch.js';

export type FetchRequest = {
  url: string;
  maxBytes?: number;
};

export type FetchData = {
  url: string;
  status: number;
  contentType: string;
  text: string;
  truncated: boolean;
};

export interface FetchProvider {
  fetch(request: FetchRequest): Promise<ExecutionEnvelope<FetchData>>;
}

export type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

const DEFAULT_MAX_BYTES = 250_000;
const MAX_MAX_BYTES = 1_000_000;
const TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 5;

function parseHttpUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new OperationError('INVALID_URL', 'url must be an absolute HTTP or HTTPS URL');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new OperationError('INVALID_URL', 'only http and https URLs are allowed');
  }
  if (url.username || url.password) {
    throw new OperationError('INVALID_URL', 'embedded URL credentials are not allowed');
  }
  return url;
}

function isRedirect(status: number): boolean {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}

async function readBoundedBody(response: Response, maxBytes: number): Promise<{ bytes: Uint8Array; truncated: boolean }> {
  if (!response.body) return { bytes: new Uint8Array(), truncated: false };

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  let truncated = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    const remaining = maxBytes - total;
    if (remaining <= 0) {
      truncated = true;
      await reader.cancel();
      break;
    }

    if (value.byteLength > remaining) {
      chunks.push(value.subarray(0, remaining));
      total += remaining;
      truncated = true;
      await reader.cancel();
      break;
    }

    chunks.push(value);
    total += value.byteLength;

    if (total === maxBytes) {
      const next = await reader.read();
      if (!next.done) {
        truncated = true;
        await reader.cancel();
      }
      break;
    }
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { bytes, truncated };
}

export class HttpFetchProvider implements FetchProvider {
  constructor(
    private readonly fetchImpl: FetchLike = createPinnedFetch(),
    private readonly egressPolicy: EgressPolicy = new PublicEgressPolicy(),
  ) {}

  async fetch(request: FetchRequest): Promise<ExecutionEnvelope<FetchData>> {
    const sourceRef = request.url;

    return executeEnvelope(
      'web_fetch',
      async () => {
        let currentUrl = parseHttpUrl(request.url);
        const maxBytes = request.maxBytes ?? DEFAULT_MAX_BYTES;
        if (!Number.isInteger(maxBytes) || maxBytes < 1 || maxBytes > MAX_MAX_BYTES) {
          throw new OperationError('INVALID_ARGUMENT', `maxBytes must be an integer between 1 and ${MAX_MAX_BYTES}`);
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

        try {
          let response: Response | undefined;

          for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
            await this.egressPolicy.assertAllowed(currentUrl);

            try {
              response = await this.fetchImpl(currentUrl, {
                signal: controller.signal,
                redirect: 'manual',
              });
            } catch (error) {
              if (controller.signal.aborted) {
                throw new OperationError('FETCH_TIMEOUT', `fetch exceeded ${TIMEOUT_MS}ms`);
              }
              if (error instanceof OperationError) throw error;
              throw new OperationError('FETCH_FAILED', error instanceof Error ? error.message : 'fetch failed');
            }

            if (!isRedirect(response.status)) break;

            const location = response.headers.get('location');
            if (!location) break;
            if (redirects === MAX_REDIRECTS) {
              throw new OperationError('TOO_MANY_REDIRECTS', `fetch exceeded ${MAX_REDIRECTS} redirects`);
            }

            currentUrl = parseHttpUrl(new URL(location, currentUrl).toString());
          }

          if (!response) throw new OperationError('FETCH_FAILED', 'fetch returned no response');

          const { bytes, truncated } = await readBoundedBody(response, maxBytes);
          const text = new TextDecoder('utf-8').decode(bytes).replace(/\r\n/g, '\n');

          return {
            url: currentUrl.toString(),
            status: response.status,
            contentType: response.headers.get('content-type') ?? '',
            text,
            truncated,
          };
        } finally {
          clearTimeout(timeout);
        }
      },
      {
        evidence: [{ kind: 'source', ref: sourceRef }],
        errorCode: 'FETCH_FAILED',
      },
    );
  }
}
