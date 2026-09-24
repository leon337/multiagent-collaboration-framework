import { describe, expect, it } from 'vitest';
import type { FetchLike } from '../src/fetch-provider.js';
import { SearxngSearchProvider } from '../src/search-provider.js';

describe('SearxngSearchProvider', () => {
  it('queries the JSON API and maps bounded results', async () => {
    let requested = '';
    const fetchImpl: FetchLike = async (input) => {
      requested = input.toString();
      return new Response(
        JSON.stringify({
          results: [
            { title: 'Alpha', url: 'https://a.example/', content: 'First result', engine: 'duckduckgo' },
            { title: 'Beta', url: 'https://b.example/', content: 'Second result', engine: 'brave' },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    };
    const provider = new SearxngSearchProvider('https://search.example/', fetchImpl);

    const result = await provider.search({ query: '  multi agent systems  ', limit: 1 });

    expect(result.ok).toBe(true);
    expect(requested).toContain('/search?');
    expect(requested).toContain('q=multi+agent+systems');
    expect(requested).toContain('format=json');
    expect(result.data?.results).toEqual([
      {
        title: 'Alpha',
        url: 'https://a.example/',
        snippet: 'First result',
        source: 'duckduckgo',
      },
    ]);
  });

  it('returns SEARCH_FAILED for a non-success response', async () => {
    const provider = new SearxngSearchProvider(
      'https://search.example/',
      async () => new Response('unavailable', { status: 503 }),
    );

    const result = await provider.search({ query: 'test' });
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe('SEARCH_FAILED');
  });
});
