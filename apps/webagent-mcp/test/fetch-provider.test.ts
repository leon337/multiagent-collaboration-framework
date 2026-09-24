import { describe, expect, it } from 'vitest';
import { AllowAllEgressPolicy, PublicEgressPolicy } from '../src/egress-policy.js';
import { HttpFetchProvider } from '../src/fetch-provider.js';

const allowAll = new AllowAllEgressPolicy();

describe('HttpFetchProvider', () => {
  it('rejects non-http protocols', async () => {
    const provider = new HttpFetchProvider(async () => new Response('unused'), allowAll);
    const result = await provider.fetch({ url: 'ftp://example.com/file.txt' });

    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe('INVALID_URL');
  });

  it('rejects embedded URL credentials', async () => {
    const provider = new HttpFetchProvider(async () => new Response('unused'), allowAll);
    const result = await provider.fetch({ url: 'https://user:secret@example.com/' });

    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe('INVALID_URL');
  });

  it('returns normalized bounded text and response metadata', async () => {
    const provider = new HttpFetchProvider(
      async () =>
        new Response('line1\r\nline2', {
          status: 200,
          headers: { 'content-type': 'text/plain; charset=utf-8' },
        }),
      allowAll,
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
    const provider = new HttpFetchProvider(async () => new Response('abcdefgh'), allowAll);
    const result = await provider.fetch({ url: 'https://example.com/', maxBytes: 5 });

    expect(result.ok).toBe(true);
    expect(result.data?.text).toBe('abcde');
    expect(result.data?.truncated).toBe(true);
  });

  it('maps provider failures to FETCH_FAILED without stack leakage', async () => {
    const provider = new HttpFetchProvider(
      async () => {
        throw new Error('network offline');
      },
      allowAll,
    );

    const result = await provider.fetch({ url: 'https://example.com/' });

    expect(result.ok).toBe(false);
    expect(result.error).toEqual({ code: 'FETCH_FAILED', message: 'network offline' });
    expect(JSON.stringify(result.error)).not.toContain('stack');
  });

  it('validates redirect destinations before following them', async () => {
    let calls = 0;
    const provider = new HttpFetchProvider(
      async () => {
        calls += 1;
        return new Response(null, {
          status: 302,
          headers: { location: 'http://127.0.0.1/private' },
        });
      },
      new PublicEgressPolicy(async () => ['93.184.216.34']),
    );

    const result = await provider.fetch({ url: 'https://example.com/start' });

    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe('EGRESS_BLOCKED');
    expect(calls).toBe(1);
  });

  it('follows a bounded public redirect and reports the final URL', async () => {
    let calls = 0;
    const provider = new HttpFetchProvider(
      async () => {
        calls += 1;
        if (calls === 1) {
          return new Response(null, {
            status: 302,
            headers: { location: 'https://example.com/final' },
          });
        }
        return new Response('done', { status: 200 });
      },
      allowAll,
    );

    const result = await provider.fetch({ url: 'https://example.com/start' });

    expect(result.ok).toBe(true);
    expect(result.data?.url).toBe('https://example.com/final');
    expect(result.data?.text).toBe('done');
    expect(calls).toBe(2);
  });
});
