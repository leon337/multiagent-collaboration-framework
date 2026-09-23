import type { ExecutionEnvelope } from './contracts.js';
import { executeEnvelope } from './execution.js';

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

export class LocalSearchProvider implements SearchProvider {
  async search(request: SearchRequest): Promise<ExecutionEnvelope<SearchData>> {
    return executeEnvelope(
      'web_search',
      async () => {
        const query = request.query.trim();
        const limit = request.limit ?? 5;

        if (query.length < 1 || query.length > 500) {
          throw new Error('query must contain between 1 and 500 characters');
        }
        if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
          throw new Error('limit must be an integer between 1 and 20');
        }

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
