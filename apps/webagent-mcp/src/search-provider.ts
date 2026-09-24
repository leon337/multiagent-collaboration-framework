import type { ExecutionEnvelope } from './contracts.js';
import { executeEnvelope, OperationError } from './execution.js';
import type { FetchLike } from './fetch-provider.js';

export type SearchRequest = {
  query: string;
  limit?: number;
};

export type SearchResult = {
  title: string;
  url: string;
  snippet: string;
  source?: string;
};

export type SearchData = {
  query: string;
  results: SearchResult[];
};

export interface SearchProvider {
  search(request: SearchRequest): Promise<ExecutionEnvelope<SearchData>>;
}

function normalizeRequest(request: SearchRequest): { query: string; limit: number } {
  const query = request.query.trim();
  const limit = request.limit ?? 5;

  if (query.length < 1 || query.length > 500) {
    throw new OperationError('INVALID_ARGUMENT', 'query must contain between 1 and 500 characters');
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
    throw new OperationError('INVALID_ARGUMENT', 'limit must be an integer between 1 and 20');
  }
  return { query, limit };
}

export class LocalSearchProvider implements SearchProvider {
  async search(request: SearchRequest): Promise<ExecutionEnvelope<SearchData>> {
    return executeEnvelope(
      'web_search',
      async () => {
        const { query } = normalizeRequest(request);
        return { query, results: [] };
      },
      {
        errorCode: 'INVALID_ARGUMENT',
        evidence: [
          {
            kind: 'runtime',
            ref: 'search-provider:local-empty',
            detail: 'No external search provider configured',
          },
        ],
      },
    );
  }
}

type SearxngResult = {
  title?: unknown;
  url?: unknown;
  content?: unknown;
  engine?: unknown;
};

function parseResult(raw: SearxngResult): SearchResult | null {
  if (typeof raw.title !== 'string' || typeof raw.url !== 'string') return null;

  let url: URL;
  try {
    url = new URL(raw.url);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

  return {
    title: raw.title,
    url: url.toString(),
    snippet: typeof raw.content === 'string' ? raw.content : '',
    source: typeof raw.engine === 'string' ? raw.engine : undefined,
  };
}

export class SearxngSearchProvider implements SearchProvider {
  private readonly baseUrl: URL;

  constructor(
    baseUrl: string,
    private readonly fetchImpl: FetchLike = globalThis.fetch,
  ) {
    let parsed: URL;
    try {
      parsed = new URL(baseUrl);
    } catch {
      throw new OperationError('INVALID_ARGUMENT', 'WEBAGENT_SEARXNG_URL must be an absolute URL');
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new OperationError('INVALID_ARGUMENT', 'SearXNG URL must use HTTP or HTTPS');
    }
    if (parsed.username || parsed.password) {
      throw new OperationError('INVALID_ARGUMENT', 'SearXNG URL must not embed credentials');
    }
    if (!parsed.pathname.endsWith('/')) parsed.pathname += '/';
    this.baseUrl = parsed;
  }

  async search(request: SearchRequest): Promise<ExecutionEnvelope<SearchData>> {
    return executeEnvelope(
      'web_search',
      async () => {
        const { query, limit } = normalizeRequest(request);
        const endpoint = new URL('search', this.baseUrl);
        endpoint.searchParams.set('q', query);
        endpoint.searchParams.set('format', 'json');

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8_000);
        let response: Response;
        try {
          response = await this.fetchImpl(endpoint, {
            signal: controller.signal,
            headers: { accept: 'application/json' },
          });
        } catch (error) {
          if (controller.signal.aborted) {
            throw new OperationError('SEARCH_TIMEOUT', 'SearXNG search exceeded 8000ms');
          }
          if (error instanceof OperationError) throw error;
          throw new OperationError('SEARCH_FAILED', error instanceof Error ? error.message : 'SearXNG request failed');
        } finally {
          clearTimeout(timeout);
        }

        if (!response.ok) {
          throw new OperationError('SEARCH_FAILED', `SearXNG returned HTTP ${response.status}`);
        }

        let payload: unknown;
        try {
          payload = await response.json();
        } catch {
          throw new OperationError('SEARCH_FAILED', 'SearXNG returned invalid JSON');
        }

        const rawResults =
          payload && typeof payload === 'object' && Array.isArray((payload as { results?: unknown }).results)
            ? ((payload as { results: SearxngResult[] }).results)
            : [];

        const results = rawResults
          .map(parseResult)
          .filter((result): result is SearchResult => result !== null)
          .slice(0, limit);

        return { query, results };
      },
      {
        errorCode: 'SEARCH_FAILED',
        evidence: [
          {
            kind: 'source',
            ref: 'search-provider:searxng',
            detail: this.baseUrl.origin,
          },
        ],
      },
    );
  }
}

export function createDefaultSearchProvider(env: NodeJS.ProcessEnv = process.env): SearchProvider {
  const baseUrl = env.WEBAGENT_SEARXNG_URL?.trim();
  return baseUrl ? new SearxngSearchProvider(baseUrl) : new LocalSearchProvider();
}
