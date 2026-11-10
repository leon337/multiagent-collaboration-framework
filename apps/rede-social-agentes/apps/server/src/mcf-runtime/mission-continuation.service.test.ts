import { describe, expect, it } from 'vitest';

import {
  McfContinuationInputError,
  MissionContinuationService,
  type CreateReadOnlyContinuation,
  type McfMissionContinuation,
  type McfMissionContinuationStore,
  type PersistReadOnlyObservation,
} from './mission-continuation.service.js';

const SHA = '0bcea848934ada8593a9ff8be86ea3a41157e546';
const OLD = 'e030b521367859f12beb18da16cbf02f47d61500';
const GOAL = 'Acompanhar release do MCF sem repetir solicitacoes humanas';
const EVIDENCE = 'a'.repeat(64);

class InMemoryStore implements McfMissionContinuationStore {
  private rows = new Map<string, McfMissionContinuation>();
  private keys = new Map<string, string>();
  async register(input: CreateReadOnlyContinuation) {
    const existing = this.keys.get(input.dedupeKey);
    if (existing) return this.rows.get(existing) as McfMissionContinuation;
    const row: McfMissionContinuation = {
      ...input,
      kind: 'RELEASE_OBSERVATION',
      state: 'DISCOVERING',
      version: 1,
      progressFingerprint: null,
      blockers: [],
      evidenceDigest: null,
      notificationCount: 0,
      gateRequestCount: 0,
      observedAt: null,
      changedAt: new Date('2026-11-09T00:00:00Z'),
      createdAt: new Date('2026-11-09T00:00:00Z'),
    };
    this.rows.set(row.id, row);
    this.keys.set(row.dedupeKey, row.id);
    return row;
  }
  async find(id: string) {
    return this.rows.get(id) ?? null;
  }
  async observe(input: PersistReadOnlyObservation) {
    const old = this.rows.get(input.id);
    if (!old) return null;
    if (old.state === 'SUPERSEDED' || old.state === 'CANCELLED') return old;
    const row: McfMissionContinuation = {
      ...old,
      state: input.state,
      blockers: [...input.blockers],
      progressFingerprint: input.progressFingerprint,
      evidenceDigest: input.evidenceDigest,
      version: old.version + 1,
      notificationCount:
        old.notificationCount +
        (input.blockers.length > 0 && old.progressFingerprint !== input.progressFingerprint
          ? 1
          : 0),
      observedAt: new Date(),
    };
    this.rows.set(row.id, row);
    return row;
  }
}

describe('MCF MissionContinuationService (read-only production boundary)', () => {
  it('creates exactly one continuation per goal + SHA + target', async () => {
    const s = new MissionContinuationService(new InMemoryStore());
    const first = await s.register({
      goal: GOAL,
      releaseSha: SHA,
      targetBindingId: 'PRODUCTION_UNBOUND',
    });
    const repeated = await s.register({
      goal: GOAL,
      releaseSha: SHA,
      targetBindingId: 'PRODUCTION_UNBOUND',
    });
    expect(repeated.id).toBe(first.id);
    expect(repeated.gateRequestCount).toBe(0);
  });

  it('100 identical blocked polls yield a single notification and zero human gates', async () => {
    const s = new MissionContinuationService(new InMemoryStore());
    const r = await s.register({
      goal: GOAL,
      releaseSha: SHA,
      targetBindingId: 'PRODUCTION_UNBOUND',
    });
    let out = r;
    for (let i = 0; i < 100; i += 1) {
      out = (await s.observe({
        continuationId: r.id,
        blockers: ['OFFICIAL_PIP_UNVERIFIED', 'MISSING_SECRETS'],
        evidenceDigest: EVIDENCE,
      })) as McfMissionContinuation;
    }
    expect(out.state).toBe('BLOCKED_EXTERNAL');
    expect(out.version).toBe(101);
    expect(out.notificationCount).toBe(1);
    expect(out.gateRequestCount).toBe(0);
  });

  it('normalized blocker order and duplicates do not create spurious progress', async () => {
    const s = new MissionContinuationService(new InMemoryStore());
    const r = await s.register({
      goal: GOAL,
      releaseSha: SHA,
      targetBindingId: 'PRODUCTION_UNBOUND',
    });
    const a = await s.observe({
      continuationId: r.id,
      blockers: ['B_TARGET', 'A_SECRET'],
      evidenceDigest: EVIDENCE,
    });
    const b = await s.observe({
      continuationId: r.id,
      blockers: ['A_SECRET', 'A_SECRET', 'B_TARGET'],
      evidenceDigest: EVIDENCE,
    });
    expect(b?.progressFingerprint).toBe(a?.progressFingerprint);
    expect(b?.notificationCount).toBe(1);
  });

  it('resume after service restart with same durable repository', async () => {
    const sharedStore = new InMemoryStore();
    const first = new MissionContinuationService(sharedStore);
    const r = await first.register({
      goal: GOAL,
      releaseSha: SHA,
      targetBindingId: 'PRODUCTION_UNBOUND',
    });
    await first.observe({
      continuationId: r.id,
      blockers: ['MISSING_SECRETS'],
      evidenceDigest: EVIDENCE,
    });
    const restarted = new MissionContinuationService(sharedStore);
    const x = await restarted.observe({
      continuationId: r.id,
      blockers: ['MISSING_SECRETS'],
      evidenceDigest: EVIDENCE,
    });
    expect(x?.notificationCount).toBe(1);
  });

  it('never synthesizes canonical authorization even when blockers disappear', async () => {
    const s = new MissionContinuationService(new InMemoryStore());
    const r = await s.register({
      goal: GOAL,
      releaseSha: SHA,
      targetBindingId: 'PRODUCTION_UNBOUND',
    });
    const ready = await s.observe({ continuationId: r.id, blockers: [], evidenceDigest: EVIDENCE });
    expect(ready?.state).toBe('WAITING_CANONICAL_GATE');
    expect(ready?.gateRequestCount).toBe(0);
  });

  it('old SHA never inherits identity or progress from new SHA', async () => {
    const s = new MissionContinuationService(new InMemoryStore());
    const old = await s.register({
      goal: GOAL,
      releaseSha: OLD,
      targetBindingId: 'PRODUCTION_UNBOUND',
    });
    await s.observe({
      continuationId: old.id,
      blockers: ['MISSING_SECRETS'],
      evidenceDigest: EVIDENCE,
    });
    const current = await s.register({
      goal: GOAL,
      releaseSha: SHA,
      targetBindingId: 'PRODUCTION_UNBOUND',
    });
    expect(current.id).not.toBe(old.id);
    expect(current.notificationCount).toBe(0);
  });

  it('rejects bad SHA, target and evidence before persistence', async () => {
    const s = new MissionContinuationService(new InMemoryStore());
    await expect(
      s.register({ goal: GOAL, releaseSha: 'bad', targetBindingId: 'TARGET' }),
    ).rejects.toBeInstanceOf(McfContinuationInputError);
    await expect(
      s.register({ goal: GOAL, releaseSha: SHA, targetBindingId: '../..' }),
    ).rejects.toBeInstanceOf(McfContinuationInputError);
    const r = await s.register({
      goal: GOAL,
      releaseSha: SHA,
      targetBindingId: 'PRODUCTION_UNBOUND',
    });
    await expect(
      s.observe({ continuationId: r.id, blockers: ['bad-code'], evidenceDigest: EVIDENCE }),
    ).rejects.toBeInstanceOf(McfContinuationInputError);
    await expect(
      s.observe({ continuationId: r.id, blockers: [], evidenceDigest: 'invalid' }),
    ).rejects.toBeInstanceOf(McfContinuationInputError);
  });

  it('prohibits creating a false gate through the continuation store', async () => {
    const s = new MissionContinuationService(new InMemoryStore());
    const r = await s.register({
      goal: GOAL,
      releaseSha: SHA,
      targetBindingId: 'PRODUCTION_UNBOUND',
    });
    const ready = await s.observe({ continuationId: r.id, blockers: [], evidenceDigest: EVIDENCE });
    expect(ready?.state).toBe('WAITING_CANONICAL_GATE');
    expect(ready?.gateRequestCount).toBe(0);
  });
});
