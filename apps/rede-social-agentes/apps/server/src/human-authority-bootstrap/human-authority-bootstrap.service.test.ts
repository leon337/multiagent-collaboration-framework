import { createHmac, randomUUID } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';

import {
  HumanAuthorityBootstrapConflictError,
  HumanAuthorityBootstrapService,
  type HumanAuthorityBootstrapRepository,
} from './human-authority-bootstrap.service.js';

const accountA = randomUUID();
const accountB = randomUUID();
const activeIntentA = randomUUID();
const activeIntentB = randomUUID();
const claimIntentRef = randomUUID();
const claimRef = randomUUID();
const now = new Date('2026-08-29T11:00:00.000Z');
const fingerprint = (accountId: string) =>
  createHmac('sha256', 'pepper').update(accountId).digest('hex');

function repository(overrides: Partial<HumanAuthorityBootstrapRepository> = {}) {
  return {
    reserveIntent: vi.fn(async (input) => ({ status: 'CREATED' as const, intent: input })),
    ...overrides,
  } as HumanAuthorityBootstrapRepository;
}

describe('HumanAuthorityBootstrapService', () => {
  it('derives the binding from the authenticated account and never returns the account id', async () => {
    const repo = repository();
    const seal = vi.fn(async () => 'sealed-binding');
    const service = new HumanAuthorityBootstrapService(repo, seal, 'pepper', 600_000);

    const result = await service.createIntent({ accountId: accountA }, { target: 'STAGING' }, now);

    expect(seal).toHaveBeenCalledWith(
      expect.objectContaining({ accountId: accountA, target: 'STAGING' }),
    );
    expect(repo.reserveIntent).toHaveBeenCalledWith(
      expect.objectContaining({ sealedBinding: 'sealed-binding' }),
      now,
    );
    expect(result).toEqual(expect.objectContaining({ state: 'PENDING', target: 'STAGING' }));
    expect(JSON.stringify(result)).not.toContain(accountA);
  });

  it('is idempotent for the same authenticated account while an intent is pending', async () => {
    const active = {
      intentRef: activeIntentA,
      target: 'STAGING' as const,
      state: 'PENDING' as const,
      subjectFingerprint: fingerprint(accountA),
      sealedBinding: 'sealed',
      expiresAt: new Date(now.getTime() + 60_000),
      createdAt: now,
    };
    const repo = repository({
      reserveIntent: vi.fn(async () => ({ status: 'REUSED' as const, intent: active })),
    });
    const service = new HumanAuthorityBootstrapService(repo, vi.fn(), 'pepper', 600_000);

    const first = await service.createIntent({ accountId: accountA }, { target: 'STAGING' }, now);
    const second = await service.createIntent({ accountId: accountA }, { target: 'STAGING' }, now);

    expect(first).toEqual(second);
    expect(repo.reserveIntent).toHaveBeenCalledTimes(2);
  });

  it('fails closed when another authenticated account already owns the active target intent', async () => {
    const active = {
      intentRef: activeIntentB,
      target: 'STAGING' as const,
      state: 'PENDING' as const,
      subjectFingerprint: fingerprint(accountA),
      sealedBinding: 'sealed',
      expiresAt: new Date(now.getTime() + 60_000),
      createdAt: now,
    };
    const repo = repository({
      reserveIntent: vi.fn(async () => ({ status: 'CONFLICT' as const, intent: active })),
    });
    const service = new HumanAuthorityBootstrapService(repo, vi.fn(), 'pepper', 600_000);

    await expect(
      service.createIntent({ accountId: accountB }, { target: 'STAGING' }, now),
    ).rejects.toBeInstanceOf(HumanAuthorityBootstrapConflictError);
    expect(repo.reserveIntent).toHaveBeenCalledTimes(1);
  });
});

it('returns only the sealed binding and a fresh claim reference to the authorized control plane', async () => {
  const repo = repository({
    claimIntent: vi.fn(async () => ({
      intentRef: claimIntentRef,
      target: 'STAGING' as const,
      state: 'APPLYING' as const,
      subjectFingerprint: fingerprint(accountA),
      sealedBinding: 'opaque-jwe',
      expiresAt: new Date(now.getTime() + 60_000),
      createdAt: now,
      claimRef: claimRef,
      claimExpiresAt: new Date(now.getTime() + 30_000),
    })),
  });
  const service = new HumanAuthorityBootstrapService(repo, vi.fn(), 'pepper', 600_000);

  const result = await service.claimIntent(claimIntentRef, 'principal-fingerprint', now);

  expect(result).toEqual(
    expect.objectContaining({
      state: 'APPLYING',
      target: 'STAGING',
      sealedBinding: 'opaque-jwe',
      claimRef: claimRef,
      identityDisclosed: false,
    }),
  );
  expect(JSON.stringify(result)).not.toContain(accountA);
});

it('rejects a stale or replayed control-plane claim', async () => {
  const repo = repository({ claimIntent: vi.fn(async () => null) });
  const service = new HumanAuthorityBootstrapService(repo, vi.fn(), 'pepper', 600_000);

  await expect(service.claimIntent(claimIntentRef, 'principal', now)).rejects.toThrow(
    'not claimable',
  );
});

it('advances only through RUNTIME_VERIFIED; BOUND remains outside this service contract', async () => {
  const markProviderApplied = vi.fn(async () => true);
  const markVerifying = vi.fn(async () => true);
  const markRuntimeVerified = vi.fn(async () => true);
  const repo = repository({ markProviderApplied, markVerifying, markRuntimeVerified });
  const service = new HumanAuthorityBootstrapService(repo, vi.fn(), 'pepper', 600_000);

  await service.markProviderApplied(claimIntentRef, 'claim', 'a'.repeat(64), now);
  await service.markVerifying(claimIntentRef, 'claim', now);
  await service.markRuntimeVerified(claimIntentRef, 'claim', 'b'.repeat(64), now);

  expect(markProviderApplied).toHaveBeenCalled();
  expect(markVerifying).toHaveBeenCalled();
  expect(markRuntimeVerified).toHaveBeenCalledWith(
    expect.objectContaining({ runtimeEvidenceDigest: 'b'.repeat(64) }),
  );
});
