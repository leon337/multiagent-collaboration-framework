import { createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';

import {
  HumanAuthorityBootstrapConflictError,
  HumanAuthorityBootstrapService,
  type HumanAuthorityBootstrapRepository,
} from './human-authority-bootstrap.service.js';

const accountA = '11111111-1111-4111-8111-111111111111';
const accountB = '22222222-2222-4222-8222-222222222222';
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
      intentRef: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
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
      intentRef: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
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
      intentRef: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      target: 'STAGING' as const,
      state: 'APPLYING' as const,
      subjectFingerprint: fingerprint(accountA),
      sealedBinding: 'opaque-jwe',
      expiresAt: new Date(now.getTime() + 60_000),
      createdAt: now,
      claimRef: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      claimExpiresAt: new Date(now.getTime() + 30_000),
    })),
  });
  const service = new HumanAuthorityBootstrapService(repo, vi.fn(), 'pepper', 600_000);

  const result = await service.claimIntent(
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'principal-fingerprint',
    now,
  );

  expect(result).toEqual(
    expect.objectContaining({
      state: 'APPLYING',
      target: 'STAGING',
      sealedBinding: 'opaque-jwe',
      claimRef: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      identityDisclosed: false,
    }),
  );
  expect(JSON.stringify(result)).not.toContain(accountA);
});

it('rejects a stale or replayed control-plane claim', async () => {
  const repo = repository({ claimIntent: vi.fn(async () => null) });
  const service = new HumanAuthorityBootstrapService(repo, vi.fn(), 'pepper', 600_000);

  await expect(
    service.claimIntent('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'principal', now),
  ).rejects.toThrow('not claimable');
});

it('moves an applying claim to verifying before it can be finalized as bound', async () => {
  const markVerifying = vi.fn(async () => true);
  const finalizeIntent = vi.fn(async () => true);
  const repo = repository({ markVerifying, finalizeIntent });
  const service = new HumanAuthorityBootstrapService(repo, vi.fn(), 'pepper', 600_000);

  await service.markVerifying('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'claim', 'a'.repeat(64), now);
  await service.finalizeIntent(
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'claim',
    'BOUND',
    'b'.repeat(64),
    now,
  );

  expect(markVerifying).toHaveBeenCalled();
  expect(finalizeIntent).toHaveBeenCalledWith(expect.objectContaining({ outcome: 'BOUND' }));
});
