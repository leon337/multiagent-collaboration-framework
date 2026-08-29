import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { RenderAuthorityBindingClient } from './render-authority-binding.client.js';

const accountId = randomUUID();
const otherAccountId = randomUUID();

function response(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('RenderAuthorityBindingClient', () => {
  it('fails closed without PUT when the binding is absent because Render exposes no atomic create/CAS contract', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(response(404));
    const client = new RenderAuthorityBindingClient(fetchImpl, 'srv-staging', 'render-key');

    await expect(client.reconcile(accountId)).resolves.toMatchObject({
      outcome: 'RECONCILIATION_REQUIRED',
      mutated: false,
      reason: 'PROVIDER_ATOMIC_CREATE_UNAVAILABLE',
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls.some(([, init]) => init?.method === 'PUT')).toBe(false);
  });

  it('treats the same existing binding as an idempotent read-only reconciliation', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        response(200, { key: 'RESERVED_HUMAN_AUTHORITY_ACCOUNT_ID', value: accountId }),
      );
    const client = new RenderAuthorityBindingClient(fetchImpl, 'srv-staging', 'render-key');

    await expect(client.reconcile(accountId)).resolves.toMatchObject({
      outcome: 'ALREADY_BOUND',
      mutated: false,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('fails closed without mutation when a different binding already exists', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      response(200, {
        key: 'RESERVED_HUMAN_AUTHORITY_ACCOUNT_ID',
        value: otherAccountId,
      }),
    );
    const client = new RenderAuthorityBindingClient(fetchImpl, 'srv-staging', 'render-key');

    await expect(client.reconcile(accountId)).resolves.toMatchObject({
      outcome: 'CONFLICT',
      mutated: false,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls.some(([, init]) => init?.method === 'PUT')).toBe(false);
  });
});
