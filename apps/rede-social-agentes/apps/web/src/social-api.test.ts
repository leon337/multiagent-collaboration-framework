import { afterEach, describe, expect, it, vi } from 'vitest';

import { createSocialApi, SocialApiError } from './social-api';

describe('social API client', () => {
  afterEach(() => vi.restoreAllMocks());

  it('sends authenticated feed requests to the same-origin API path', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ items: [], nextCursor: null, hasMore: false }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const api = createSocialApi('https://social.example.test/', fetcher);

    await api.listFeed('session-token');

    expect(fetcher).toHaveBeenCalledWith(
      'https://social.example.test/v1/feed?limit=20',
      expect.objectContaining({ method: 'GET', cache: 'no-store' }),
    );
    const init = fetcher.mock.calls[0]?.[1];
    expect(new Headers(init?.headers).get('authorization')).toBe('Bearer session-token');
  });

  it('sends credentials as JSON when creating a session', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          sessionId: 'session-1',
          token: 'token-1',
          expiresAt: '2030-01-01T00:00:00.000Z',
          account: {
            id: 'account-1',
            email: 'person@example.test',
            displayName: 'Pessoa',
            status: 'ACTIVE',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );
    const api = createSocialApi('https://social.example.test', fetcher);

    await api.createSession('person@example.test', 'correct-horse-battery');

    const init = fetcher.mock.calls[0]?.[1];
    expect(new Headers(init?.headers).get('content-type')).toBe('application/json');
    expect(JSON.parse(String(init?.body))).toEqual({
      email: 'person@example.test',
      password: 'correct-horse-battery',
    });
  });

  it('preserves API error codes and messages', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ code: 'INVALID_SESSION', message: 'Sessão inválida.' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const api = createSocialApi('https://social.example.test', fetcher);

    await expect(api.listFeed('expired-token')).rejects.toMatchObject({
      name: 'SocialApiError',
      status: 401,
      code: 'INVALID_SESSION',
      message: 'Sessão inválida.',
    });
    expect(SocialApiError).toBeDefined();
  });
});
