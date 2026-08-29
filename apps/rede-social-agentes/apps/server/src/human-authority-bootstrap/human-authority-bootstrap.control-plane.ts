import { createHash } from 'node:crypto';

import { compactDecrypt, importJWK, type JWK } from 'jose';
import { z } from 'zod';

import { RenderAuthorityBindingClient } from './render-authority-binding.client.js';

const claimSchema = z.object({
  intentRef: z.string().uuid(),
  target: z.literal('STAGING'),
  state: z.literal('APPLYING'),
  sealedBinding: z.string().min(20),
  claimRef: z.string().uuid(),
  claimExpiresAt: z.string().datetime({ offset: true }),
  expiresAt: z.string().datetime({ offset: true }),
  identityDisclosed: z.literal(false),
});

const bindingSchema = z.object({
  intentRef: z.string().uuid(),
  target: z.literal('STAGING'),
  accountId: z.string().uuid(),
  nonce: z.string().min(32),
  issuedAt: z.string().datetime({ offset: true }),
  expiresAt: z.string().datetime({ offset: true }),
});

export interface HumanAuthorityBootstrapControlPlaneConfig {
  issuerBaseUrl: string;
  oidcToken: string;
  intentRef: string;
  privateJwkJson: string;
  renderServiceId: string;
  renderApiKey: string;
}

function receiptDigest(input: Record<string, unknown>): string {
  return createHash('sha256').update(JSON.stringify(input)).digest('hex');
}

async function issuerPost(
  fetchImpl: typeof fetch,
  url: string,
  oidcToken: string,
  body?: Record<string, unknown>,
): Promise<unknown> {
  const response = await fetchImpl(url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${oidcToken}`,
      accept: 'application/json',
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok)
    throw new Error(`Bootstrap issuer request failed with HTTP ${response.status}.`);
  return response.json();
}

export async function runHumanAuthorityBootstrapControlPlane(
  config: HumanAuthorityBootstrapControlPlaneConfig,
  fetchImpl: typeof fetch = fetch,
  now = new Date(),
) {
  const base = config.issuerBaseUrl.replace(/\/$/u, '');
  const claim = claimSchema.parse(
    await issuerPost(
      fetchImpl,
      `${base}/v1/bootstrap/human-authority/intents/${config.intentRef}/claim`,
      config.oidcToken,
    ),
  );
  if (
    claim.intentRef !== config.intentRef ||
    new Date(claim.expiresAt) <= now ||
    new Date(claim.claimExpiresAt) <= now
  ) {
    throw new Error('Bootstrap claim is stale or does not match the requested intent.');
  }

  const privateJwk = JSON.parse(config.privateJwkJson) as JWK;
  const privateKey = await importJWK(privateJwk, 'RSA-OAEP-256');
  const { plaintext, protectedHeader } = await compactDecrypt(claim.sealedBinding, privateKey);
  if (protectedHeader.typ !== 'mcf-human-authority-binding+jwe') {
    throw new Error('Bootstrap binding JWE type is invalid.');
  }
  const binding = bindingSchema.parse(JSON.parse(new TextDecoder().decode(plaintext)));
  if (
    binding.intentRef !== claim.intentRef ||
    binding.target !== claim.target ||
    new Date(binding.expiresAt) <= now
  ) {
    throw new Error('Bootstrap binding payload does not match the active claim.');
  }

  const render = new RenderAuthorityBindingClient(
    fetchImpl,
    config.renderServiceId,
    config.renderApiKey,
  );
  const reconciliation = await render.reconcile(binding.accountId);
  const digest = receiptDigest({
    schema: 'mcf-human-authority-binding-receipt/v1',
    intentRef: claim.intentRef,
    target: claim.target,
    outcome: reconciliation.outcome,
    mutated: reconciliation.mutated,
    providerMutationDigest: reconciliation.providerMutationDigest,
  });

  if (reconciliation.outcome === 'BOUND') {
    await issuerPost(
      fetchImpl,
      `${base}/v1/bootstrap/human-authority/intents/${claim.intentRef}/verifying`,
      config.oidcToken,
      { claimRef: claim.claimRef, providerMutationDigest: reconciliation.providerMutationDigest },
    );
    return {
      intentRef: claim.intentRef,
      target: claim.target,
      outcome: 'VERIFYING' as const,
      providerOutcome: 'BOUND' as const,
      mutated: reconciliation.mutated,
      receiptDigest: digest,
      identityDisclosed: false as const,
    };
  }

  await issuerPost(
    fetchImpl,
    `${base}/v1/bootstrap/human-authority/intents/${claim.intentRef}/result`,
    config.oidcToken,
    { claimRef: claim.claimRef, outcome: 'CONFLICT', receiptDigest: digest },
  );

  return {
    intentRef: claim.intentRef,
    target: claim.target,
    outcome: 'CONFLICT' as const,
    providerOutcome: 'CONFLICT' as const,
    mutated: false,
    receiptDigest: digest,
    identityDisclosed: false as const,
  };
}
