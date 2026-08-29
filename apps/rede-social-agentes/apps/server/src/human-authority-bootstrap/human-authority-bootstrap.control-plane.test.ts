import { generateKeyPair, randomUUID } from 'node:crypto';
import { promisify } from 'node:util';
import { exportJWK } from 'jose';
import { describe, expect, it, vi } from 'vitest';
import { HumanAuthorityBindingSealer } from './human-authority-bootstrap.sealer.js';
import { runHumanAuthorityBootstrapControlPlane } from './human-authority-bootstrap.control-plane.js';

const generate = promisify(generateKeyPair);
const accountId = randomUUID();
const otherAccountId = randomUUID();
const intentRef = randomUUID();
const claimRef = randomUUID();
const now = new Date('2026-08-29T12:00:00.000Z');
function response(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
async function fixture() {
  const { publicKey, privateKey } = await generate('rsa', { modulusLength: 2048 });
  const sealer = new HumanAuthorityBindingSealer(JSON.stringify(await exportJWK(publicKey)));
  const sealedBinding = await sealer.seal({
    intentRef,
    target: 'STAGING',
    accountId,
    nonce: 'n'.repeat(43),
    issuedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 600_000).toISOString(),
  });
  return { privateJwk: await exportJWK(privateKey), sealedBinding };
}
function claim(
  sealedBinding: string,
  state: 'APPLYING' | 'PROVIDER_APPLIED' | 'VERIFYING' | 'RUNTIME_VERIFIED',
) {
  return {
    intentRef,
    target: 'STAGING',
    state,
    sealedBinding,
    claimRef,
    claimExpiresAt: new Date(now.getTime() + 300_000).toISOString(),
    expiresAt: new Date(now.getTime() + 600_000).toISOString(),
    identityDisclosed: false,
  };
}
function config(privateJwk: object) {
  return {
    issuerBaseUrl: 'https://bootstrap.example.test',
    oidcToken: 'oidc-token',
    intentRef,
    privateJwkJson: JSON.stringify(privateJwk),
    renderServiceId: 'srv-staging',
    renderApiKey: 'render-key',
  };
}

describe('human authority bootstrap control plane', () => {
  it('enters RECONCILIATION_REQUIRED without PUT when the provider binding is absent', async () => {
    const { privateJwk, sealedBinding } = await fixture();
    const fetchImpl = vi.fn<typeof fetch>(async (input, init) => {
      const url = String(input);
      if (url.endsWith(`/${intentRef}/claim`))
        return response(200, claim(sealedBinding, 'APPLYING'));
      if (url.includes('api.render.com') && init?.method === 'GET') return response(404);
      if (url.endsWith(`/${intentRef}/reconciliation-required`))
        return response(200, { intentRef, state: 'RECONCILIATION_REQUIRED' });
      throw new Error(`unexpected request ${url}`);
    });
    const result = await runHumanAuthorityBootstrapControlPlane(config(privateJwk), fetchImpl, now);
    expect(result).toMatchObject({
      outcome: 'RECONCILIATION_REQUIRED',
      mutated: false,
      identityDisclosed: false,
    });
    expect(JSON.stringify(result)).not.toContain(accountId);
    expect(
      fetchImpl.mock.calls
        .filter(([url]) => String(url).includes('bootstrap.example.test'))
        .map(([, init]) => String(init?.body ?? ''))
        .join(''),
    ).not.toContain(accountId);
    expect(fetchImpl.mock.calls.some(([, init]) => init?.method === 'PUT')).toBe(false);
  });
  it('advances an existing safe binding to RUNTIME_VERIFIED without provider mutation', async () => {
    const { privateJwk, sealedBinding } = await fixture();
    const fetchImpl = vi.fn<typeof fetch>(async (input, init) => {
      const url = String(input);
      if (url.endsWith(`/${intentRef}/claim`))
        return response(200, claim(sealedBinding, 'APPLYING'));
      if (url.includes('api.render.com') && init?.method === 'GET')
        return response(200, { key: 'RESERVED_HUMAN_AUTHORITY_ACCOUNT_ID', value: accountId });
      if (url.endsWith(`/${intentRef}/provider-applied`))
        return response(200, { intentRef, state: 'PROVIDER_APPLIED' });
      if (url.endsWith(`/${intentRef}/verifying`))
        return response(200, { intentRef, state: 'VERIFYING' });
      if (url.endsWith(`/${intentRef}/runtime-verified`))
        return response(200, { intentRef, state: 'RUNTIME_VERIFIED' });
      throw new Error(`unexpected request ${url}`);
    });
    const result = await runHumanAuthorityBootstrapControlPlane(config(privateJwk), fetchImpl, now);
    expect(result).toMatchObject({ outcome: 'RUNTIME_VERIFIED', mutated: false });
    const issuerUrls = fetchImpl.mock.calls.map(([input]) => String(input));
    expect(issuerUrls.some((url) => url.endsWith(`/${intentRef}/provider-applied`))).toBe(true);
    expect(issuerUrls.some((url) => url.endsWith(`/${intentRef}/verifying`))).toBe(true);
    expect(issuerUrls.some((url) => url.endsWith(`/${intentRef}/runtime-verified`))).toBe(true);
    expect(fetchImpl.mock.calls.some(([, init]) => init?.method === 'PUT')).toBe(false);
  });
  it('resumes PROVIDER_APPLIED at verification without reapplying provider state', async () => {
    const { privateJwk, sealedBinding } = await fixture();
    const fetchImpl = vi.fn<typeof fetch>(async (input, init) => {
      const url = String(input);
      if (url.endsWith(`/${intentRef}/claim`))
        return response(200, claim(sealedBinding, 'PROVIDER_APPLIED'));
      if (url.includes('api.render.com') && init?.method === 'GET')
        return response(200, { key: 'RESERVED_HUMAN_AUTHORITY_ACCOUNT_ID', value: accountId });
      if (url.endsWith(`/${intentRef}/verifying`))
        return response(200, { intentRef, state: 'VERIFYING' });
      if (url.endsWith(`/${intentRef}/runtime-verified`))
        return response(200, { intentRef, state: 'RUNTIME_VERIFIED' });
      throw new Error(`unexpected request ${url}`);
    });
    const result = await runHumanAuthorityBootstrapControlPlane(config(privateJwk), fetchImpl, now);
    expect(result).toMatchObject({ outcome: 'RUNTIME_VERIFIED', mutated: false });
    expect(
      fetchImpl.mock.calls.some(([input]) =>
        String(input).endsWith(`/${intentRef}/provider-applied`),
      ),
    ).toBe(false);
    expect(fetchImpl.mock.calls.some(([, init]) => init?.method === 'PUT')).toBe(false);
  });
  it('safely resumes a VERIFYING claim and reaches RUNTIME_VERIFIED', async () => {
    const { privateJwk, sealedBinding } = await fixture();
    const fetchImpl = vi.fn<typeof fetch>(async (input, init) => {
      const url = String(input);
      if (url.endsWith(`/${intentRef}/claim`))
        return response(200, claim(sealedBinding, 'VERIFYING'));
      if (url.includes('api.render.com') && init?.method === 'GET')
        return response(200, { key: 'RESERVED_HUMAN_AUTHORITY_ACCOUNT_ID', value: accountId });
      if (url.endsWith(`/${intentRef}/runtime-verified`))
        return response(200, { intentRef, state: 'RUNTIME_VERIFIED' });
      throw new Error(`unexpected request ${url}`);
    });
    const result = await runHumanAuthorityBootstrapControlPlane(config(privateJwk), fetchImpl, now);
    expect(result).toMatchObject({
      outcome: 'RUNTIME_VERIFIED',
      providerOutcome: 'ALREADY_BOUND',
      mutated: false,
    });
    expect(fetchImpl.mock.calls.some(([, init]) => init?.method === 'PUT')).toBe(false);
  });
  it('finalizes conflict without overwriting a different authority', async () => {
    const { privateJwk, sealedBinding } = await fixture();
    const fetchImpl = vi.fn<typeof fetch>(async (input, init) => {
      const url = String(input);
      if (url.endsWith(`/${intentRef}/claim`))
        return response(200, claim(sealedBinding, 'APPLYING'));
      if (url.includes('api.render.com') && init?.method === 'GET')
        return response(200, {
          key: 'RESERVED_HUMAN_AUTHORITY_ACCOUNT_ID',
          value: otherAccountId,
        });
      if (url.endsWith(`/${intentRef}/result`))
        return response(200, { intentRef, state: 'CONFLICT' });
      throw new Error(`unexpected request ${url}`);
    });
    const result = await runHumanAuthorityBootstrapControlPlane(config(privateJwk), fetchImpl, now);
    expect(result).toMatchObject({ outcome: 'CONFLICT', mutated: false });
    expect(fetchImpl.mock.calls.some(([, init]) => init?.method === 'PUT')).toBe(false);
  });
});
