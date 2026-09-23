import { describe, expect, it } from 'vitest';
import { LocalSearchProvider } from '../src/search-provider.js';

describe('LocalSearchProvider', () => {
  it('normalizes a valid query and returns a deterministic empty baseline', async () => {
    const provider = new LocalSearchProvider();
    const result = await provider.search({ query: '  model context protocol  ', limit: 3 });

    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ query: 'model context protocol', results: [] });
    expect(result.evidence).toContainEqual({
      kind: 'runtime',
      ref: 'search-provider:local-empty',
      detail: 'No external search provider configured',
    });
  });

  it('fails closed for an empty query', async () => {
    const provider = new LocalSearchProvider();
    const result = await provider.search({ query: '   ' });

    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe('INVALID_ARGUMENT');
  });

  it.each([0, 21])('rejects out-of-range limit %s', async (limit) => {
    const provider = new LocalSearchProvider();
    const result = await provider.search({ query: 'mcp', limit });

    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe('INVALID_ARGUMENT');
  });
});
