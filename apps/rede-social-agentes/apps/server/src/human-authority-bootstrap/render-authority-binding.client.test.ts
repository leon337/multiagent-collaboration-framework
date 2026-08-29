import { describe, expect, it, vi } from 'vitest';
import { RenderAuthorityBindingClient } from './render-authority-binding.client.js';

const accountId = '11111111-1111-4111-8111-111111111111';

function response(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('RenderAuthorityBindingClient', () => {
  it('creates only the reserved binding when it is absent and verifies it without deploying', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response(404))
      .mockResolvedValueOnce(
        response(200, { key: 'RESERVED_HUMAN_AUTHORITY_ACCOUNT_ID', value: accountId }),
      )
      .mockResolvedValueOnce(
        response(200, { key: 'RESERVED_HUMAN_AUTHORITY_ACCOUNT_ID', value: accountId }),
      );
    const client = new RenderAuthorityBindingClient(fetchImpl, 'srv-staging', 'render-key');

    const result = await client.reconcile(accountId);

    expect(result).toMatchObject({ outcome: 'BOUND', mutated: true });
    const put = fetchImpl.mock.calls[1];
    expect(put?.[1]).toMatchObject({ method: 'PUT', body: JSON.stringify({ value: accountId }) });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(fetchImpl.mock.calls.some(([url]) => String(url).includes('/deploy'))).toBe(false);
  });

  it('treats the same existing binding as an idempotent reconciliation', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      response(200, {
        key: 'RESERVED_HUMAN_AUTHORITY_ACCOUNT_ID',
        value: accountId,
      }),
    );
    const client = new RenderAuthorityBindingClient(fetchImpl, 'srv-staging', 'render-key');

    await expect(client.reconcile(accountId)).resolves.toMatchObject({
      outcome: 'BOUND',
      mutated: false,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('fails closed without mutation when a different binding already exists', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      response(200, {
        key: 'RESERVED_HUMAN_AUTHORITY_ACCOUNT_ID',
        value: '22222222-2222-4222-8222-222222222222',
      }),
    );
    const client = new RenderAuthorityBindingClient(fetchImpl, 'srv-staging', 'render-key');

    await expect(client.reconcile(accountId)).resolves.toMatchObject({
      outcome: 'CONFLICT',
      mutated: false,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
