import { describe, expect, it } from 'vitest';
import { HttpFetchProvider } from '../src/fetch-provider.js';

describe('HttpFetchProvider', () => {
  it('rejects non-http protocols', async () => {
    const provider = new HttpFetchProvider(async () => new Response('unused'));
    const result = await provider.fetch({ url: 'ftp://example.com/file.txt' });

    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe('INVALID_URL');
  });

  it('rejects embedded URL credentials', async () => {
    const provider = new HttpFetchProvider(async () => new Response('unused'));
    const result = await provider.fetch({ url: 'https://user:secret@example.com/' });

    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe('INVALID_URL');
  });

  it('returns normalized bounded text and response metadata', async () => {
    const provider = new HttpFetchProvider(async () =>
      new Response('line1\r\nline2', {
        status: 200,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      }),
    );

    const result = await provider.fetch({ url: 'https://example.com/a', maxBytes: 100 });

    expect(result.ok).toBe(true);
    expect(result.data).toMatchObject({
      url: 'https://example.com/a',
      status: 200,
      contentType: 'text/plain; charset=utf-8',
      text: 'line1\nline2',
      truncated: false,
    });
  });

  it('truncates response bodies at maxBytes', async () => {
    const provider = new HttpFetchProvider(async () => new Response('abcdefgh'));
    const result = await provider.fetch({ url: 'https://example.com/', maxBytes: 5 });

    expect(result.ok).toBe(true);
    expect(result.data?.text).toBe('abcde');
    expect(result.data?.truncated).toBe(true);
  });

  it('maps provider failures to FETCH_FAILED without stack leakage', async () => {
    const provider = new HttpFetchProvider(async () => {
      throw new Error('network offline');
    });

    const result = await provider.fetch({ url: 'https://example.com/' });

    expect(result.ok).toBe(false);
    expect(result.error).toEqual({ code: 'FETCH_FAILED', message: 'network offline' });
    expect(JSON.stringify(result.error)).not.toContain('stack');
  });
});
