import { describe, expect, it, vi } from 'vitest';
import { requestGithubActionsOidcToken } from './github-actions-oidc.js';

function response(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('GitHub Actions OIDC token request', () => {
  it('requests the configured audience using the ephemeral runner request token', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(response(200, { value: 'signed-oidc' }));
    const token = await requestGithubActionsOidcToken(
      'https://actions.example/id-token?x=1',
      'ephemeral-request-token',
      'mcf-human-authority-bootstrap',
      fetchImpl,
    );
    expect(token).toBe('signed-oidc');
    expect(String(fetchImpl.mock.calls[0]?.[0])).toContain(
      'audience=mcf-human-authority-bootstrap',
    );
    expect(fetchImpl.mock.calls[0]?.[1]?.headers).toEqual(
      expect.objectContaining({ authorization: 'Bearer ephemeral-request-token' }),
    );
  });

  it('fails closed when the runner does not return a token', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(response(200, {}));
    await expect(
      requestGithubActionsOidcToken('https://actions.example/id-token', 'token', 'aud', fetchImpl),
    ).rejects.toThrow();
  });
});
