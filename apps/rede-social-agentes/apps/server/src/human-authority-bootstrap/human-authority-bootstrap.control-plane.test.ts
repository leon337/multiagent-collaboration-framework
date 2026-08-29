import { generateKeyPair } from 'node:crypto';
import { promisify } from 'node:util';
import { exportJWK } from 'jose';
import { describe, expect, it, vi } from 'vitest';

import { HumanAuthorityBindingSealer } from './human-authority-bootstrap.sealer.js';
import { runHumanAuthorityBootstrapControlPlane } from './human-authority-bootstrap.control-plane.js';

const generate = promisify(generateKeyPair);
const accountId = '11111111-1111-4111-8111-111111111111';
const intentRef = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const claimRef = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const now = new Date('2026-08-29T12:00:00.000Z');

function response(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

async function fixture() {
  const { publicKey, privateKey } = await generate('rsa', { modulusLength: 2048 });
  const publicJwk = await exportJWK(publicKey);
  const privateJwk = await exportJWK(privateKey);
  const sealer = new HumanAuthorityBindingSealer(JSON.stringify(publicJwk));
  const sealedBinding = await sealer.seal({
    intentRef,
    target: 'STAGING',
    accountId,
    nonce: 'n'.repeat(43),
    issuedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 600_000).toISOString(),
  });
  return { privateJwk, sealedBinding };
}

describe('human authority bootstrap control plane', () => {
  it('applies the provider binding but remains VERIFYING until runtime evidence exists', async () => {
    const { privateJwk, sealedBinding } = await fixture();
    const fetchImpl: ReturnType<typeof vi.fn<typeof fetch>> = vi.fn<typeof fetch>(
      async (input, init): Promise<Response> => {
        const url = String(input);
        if (url.endsWith(`/${intentRef}/claim`))
          return response(200, {
            intentRef,
            target: 'STAGING',
            state: 'APPLYING',
            sealedBinding,
            claimRef,
            claimExpiresAt: new Date(now.getTime() + 300_000).toISOString(),
            expiresAt: new Date(now.getTime() + 600_000).toISOString(),
            identityDisclosed: false,
          });
        if (url.includes('api.render.com') && init?.method === 'GET') {
          const count = fetchImpl.mock.calls.filter(
            ([called, calledInit]) =>
              String(called).includes('api.render.com') && calledInit?.method === 'GET',
          ).length;
          return count === 1
            ? response(404)
            : response(200, { key: 'RESERVED_HUMAN_AUTHORITY_ACCOUNT_ID', value: accountId });
        }
        if (url.includes('api.render.com') && init?.method === 'PUT')
          return response(200, { key: 'RESERVED_HUMAN_AUTHORITY_ACCOUNT_ID', value: accountId });
        if (url.endsWith(`/${intentRef}/verifying`))
          return response(200, { intentRef, state: 'VERIFYING' });
        throw new Error(`unexpected request ${url}`);
      },
    );

    const result = await runHumanAuthorityBootstrapControlPlane(
      {
        issuerBaseUrl: 'https://bootstrap.example.test',
        oidcToken: 'oidc-token',
        intentRef,
        privateJwkJson: JSON.stringify(privateJwk),
        renderServiceId: 'srv-staging',
        renderApiKey: 'render-key',
      },
      fetchImpl,
      now,
    );

    expect(result).toMatchObject({
      intentRef,
      outcome: 'VERIFYING',
      mutated: true,
      identityDisclosed: false,
    });
    expect(JSON.stringify(result)).not.toContain(accountId);
    expect(
      fetchImpl.mock.calls.some((call) => String(call[0]).endsWith(`/${intentRef}/result`)),
    ).toBe(false);
  });

  it('finalizes conflict without overwriting an existing different authority', async () => {
    const { privateJwk, sealedBinding } = await fixture();
    const fetchImpl: ReturnType<typeof vi.fn<typeof fetch>> = vi.fn<typeof fetch>(
      async (input, init): Promise<Response> => {
        const url = String(input);
        if (url.endsWith(`/${intentRef}/claim`))
          return response(200, {
            intentRef,
            target: 'STAGING',
            state: 'APPLYING',
            sealedBinding,
            claimRef,
            claimExpiresAt: new Date(now.getTime() + 300_000).toISOString(),
            expiresAt: new Date(now.getTime() + 600_000).toISOString(),
            identityDisclosed: false,
          });
        if (url.includes('api.render.com') && init?.method === 'GET')
          return response(200, {
            key: 'RESERVED_HUMAN_AUTHORITY_ACCOUNT_ID',
            value: '22222222-2222-4222-8222-222222222222',
          });
        if (url.endsWith(`/${intentRef}/result`))
          return response(200, { intentRef, state: 'CONFLICT' });
        throw new Error(`unexpected request ${url}`);
      },
    );

    const result = await runHumanAuthorityBootstrapControlPlane(
      {
        issuerBaseUrl: 'https://bootstrap.example.test',
        oidcToken: 'oidc-token',
        intentRef,
        privateJwkJson: JSON.stringify(privateJwk),
        renderServiceId: 'srv-staging',
        renderApiKey: 'render-key',
      },
      fetchImpl,
      now,
    );

    expect(result).toMatchObject({ outcome: 'CONFLICT', mutated: false });
    expect(fetchImpl.mock.calls.some(([, init]) => init?.method === 'PUT')).toBe(false);
  });
});
