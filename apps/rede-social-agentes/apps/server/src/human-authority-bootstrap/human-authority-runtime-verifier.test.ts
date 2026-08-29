import { describe, expect, it, vi } from 'vitest';
import { HumanAuthorityRuntimeVerifier } from './human-authority-runtime-verifier.js';

const sha = 'a7b2016cd7705f37acb949ba77de31833cf62521';
function response(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('HumanAuthorityRuntimeVerifier', () => {
  it('derives runtime evidence from exact version and readiness observations', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url.endsWith('/health/version'))
        return response(200, {
          service: 'rede-social-agentes',
          component: 'server',
          commitSha: sha,
          branch: 'feat/chat-mission-control-bridge-20260828',
          runtime: 'render',
        });
      if (url.endsWith('/health/ready'))
        return response(200, {
          status: 'ok',
          service: 'rede-social-agentes',
          component: 'server',
          timestamp: '2026-08-29T12:00:00.000Z',
        });
      throw new Error(`unexpected ${url}`);
    });
    const verifier = new HumanAuthorityRuntimeVerifier(
      'https://staging.example.test',
      sha,
      fetchImpl,
    );
    const result = await verifier.verify();
    expect(result.runtimeEvidenceDigest).toMatch(/^[a-f0-9]{64}$/u);
    expect(result).toMatchObject({
      expectedCommitSha: sha,
      observedCommitSha: sha,
      ready: true,
      runtime: 'render',
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('fails closed on the wrong runtime revision', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValueOnce(
      response(200, {
        service: 'rede-social-agentes',
        component: 'server',
        commitSha: '5c7f9832f037f374ec3fe2d4160342a5f2cf8a06',
        branch: 'main',
        runtime: 'render',
      }),
    );
    const verifier = new HumanAuthorityRuntimeVerifier(
      'https://staging.example.test',
      sha,
      fetchImpl,
    );
    await expect(verifier.verify()).rejects.toThrow('revision');
  });

  it('fails closed when readiness is not HTTP 200/ok', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        response(200, {
          service: 'rede-social-agentes',
          component: 'server',
          commitSha: sha,
          branch: 'x',
          runtime: 'render',
        }),
      )
      .mockResolvedValueOnce(response(503, { status: 'not_ready' }));
    const verifier = new HumanAuthorityRuntimeVerifier(
      'https://staging.example.test',
      sha,
      fetchImpl,
    );
    await expect(verifier.verify()).rejects.toThrow('ready');
  });
});
