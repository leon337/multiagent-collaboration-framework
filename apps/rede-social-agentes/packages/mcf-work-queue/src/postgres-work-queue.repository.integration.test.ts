import { randomUUID } from 'node:crypto';

import type { McfWorkFailure, McfWorkJobSpec, McfWorkResult } from '@rsa/contracts';
import { createDatabase, type DatabaseHandle } from '@rsa/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PostgresMcfWorkQueueRepository } from './postgres-work-queue.repository.js';
import { McfWorkDispatchConflictError, McfWorkGateConflictError } from './work-queue.errors.js';

const databaseUrl = process.env.DATABASE_URL;
const suite = databaseUrl ? describe : describe.skip;
const prefix = `queue-it-${randomUUID()}`;

function spec(suffix: string, overrides: Partial<McfWorkJobSpec> = {}): McfWorkJobSpec {
  return {
    dispatchId: `${prefix}-${suffix}`,
    objective: 'Exercise the durable PostgreSQL queue without changing the existing MCF runtime.',
    acceptanceCriteria: ['state is durable', 'the lease owner is enforced'],
    repositoryKey: 'mcf',
    baseRef: 'refs/heads/main',
    expectedBaseSha: 'a'.repeat(40),
    riskClass: 'B',
    writeScopeProfile: 'source',
    verificationProfiles: ['focused'],
    ...overrides,
  };
}

const result: McfWorkResult = {
  summary: 'The isolated queue job completed.',
  artifactPath: '/var/lib/mcf-worker/artifacts/job/result.json',
  patchDigest: 'b'.repeat(64),
  changedFiles: ['packages/example.ts'],
  verification: [
    { profile: 'focused', status: 'PASSED', exitCode: 0, outputDigest: 'c'.repeat(64) },
  ],
};

const transient: McfWorkFailure = {
  code: 'CODEX_TEMPORARY_FAILURE',
  message: 'The isolated Codex invocation failed transiently.',
  kind: 'TRANSIENT',
  retryable: true,
};

suite('PostgresMcfWorkQueueRepository integration', () => {
  let database: DatabaseHandle;
  let repository: PostgresMcfWorkQueueRepository;

  beforeAll(() => {
    database = createDatabase(databaseUrl!);
    repository = new PostgresMcfWorkQueueRepository(database);
  });

  afterAll(async () => {
    if (!database) return;
    await database.pool.query('delete from "mcf_work_jobs" where "dispatch_id" like $1', [`${prefix}%`]);
    await database.pool.end();
  });

  it('enqueues idempotently and rejects dispatch reuse with a different digest', async () => {
    const created = await repository.enqueue(spec('idempotent'));
    const duplicate = await repository.enqueue(spec('idempotent'));

    expect(duplicate.id).toBe(created.id);
    expect((await repository.get(created.id))?.specDigest).toBe(created.specDigest);
    expect(await repository.list({ repositoryKey: 'mcf', limit: 10 })).toContainEqual(
      expect.objectContaining({ id: created.id }),
    );

    await expect(
      repository.enqueue(spec('idempotent', { verificationProfiles: ['full'] })),
    ).rejects.toBeInstanceOf(McfWorkDispatchConflictError);

    await repository.cancel(created.id, 'TEST', 'Keep the integration queue isolated.', new Date());
  });

  it('binds a class C gate to the immutable job digest', async () => {
    const now = new Date('2026-08-22T12:00:00.000Z');
    const created = await repository.enqueue(spec('gate', { riskClass: 'C' }), now);
    expect(created.status).toBe('WAITING_GATE');
    expect((await repository.getGate(created.id))?.state).toBe('PENDING');

    await expect(
      repository.decideGate(created.id, {
        decision: 'APPROVE',
        specDigest: 'f'.repeat(64),
        actor: 'LEANDRO',
        reason: 'Wrong digest must fail.',
      }),
    ).rejects.toBeInstanceOf(McfWorkGateConflictError);

    const approved = await repository.decideGate(
      created.id,
      {
        decision: 'APPROVE',
        specDigest: created.specDigest,
        actor: 'LEANDRO',
        reason: 'Approved for isolated and reversible local execution.',
        expiresAt: '2026-08-22T13:00:00.000Z',
      },
      now,
    );
    expect(approved.status).toBe('QUEUED');
    expect((await repository.getGate(created.id))?.state).toBe('APPROVED');
    await repository.cancel(created.id, 'TEST', 'Keep the integration queue isolated.', now);
  });

  it('claims once under concurrency, heartbeats and completes only with the owning lease', async () => {
    const now = new Date('2026-08-22T14:00:00.000Z');
    const created = await repository.enqueue(spec('claim'), now);
    const [left, right] = await Promise.all([
      repository.claimNext('worker-left', 60_000, now),
      repository.claimNext('worker-right', 60_000, now),
    ]);
    const claims = [left, right].filter((claim) => claim?.job.id === created.id);
    expect(claims).toHaveLength(1);
    const claim = claims[0]!;

    const heartbeat = await repository.heartbeat(
      created.id,
      claim.leaseToken,
      60_000,
      new Date(now.getTime() + 10_000),
    );
    expect(heartbeat.leaseExpiresAt).toBe('2026-08-22T14:01:10.000Z');

    const completed = await repository.complete(
      created.id,
      claim.leaseToken,
      result,
      new Date(now.getTime() + 20_000),
    );
    expect(completed).toMatchObject({ status: 'SUCCEEDED', result });
  });

  it('schedules retry and moves an exhausted job to DEAD', async () => {
    const now = new Date('2026-08-22T15:00:00.000Z');
    const created = await repository.enqueue(spec('retry', { maxAttempts: 2 }), now);
    const first = await repository.claimNext('worker-retry', 60_000, now);
    expect(first?.job.id).toBe(created.id);
    const retry = await repository.fail(created.id, first!.leaseToken, transient, now);
    expect(retry.status).toBe('RETRY_WAIT');

    const second = await repository.claimNext(
      'worker-retry',
      60_000,
      new Date(Date.parse(retry.nextAttemptAt) + 1),
    );
    expect(second?.job.id).toBe(created.id);
    const dead = await repository.fail(
      created.id,
      second!.leaseToken,
      transient,
      new Date(Date.parse(retry.nextAttemptAt) + 2),
    );
    expect(dead.status).toBe('DEAD');
  });

  it('blocks authentication, resumes after operator recovery and cancels durably', async () => {
    const now = new Date('2026-08-22T16:00:00.000Z');
    const created = await repository.enqueue(spec('auth'), now);
    const claim = await repository.claimNext('worker-auth', 60_000, now);
    expect(claim?.job.id).toBe(created.id);
    const blocked = await repository.blockAuth(
      created.id,
      claim!.leaseToken,
      {
        code: 'CODEX_LOGIN_REQUIRED',
        message: 'The persisted ChatGPT session needs operator reseeding.',
        kind: 'AUTH',
        retryable: false,
      },
      now,
    );
    expect(blocked.status).toBe('BLOCKED_AUTH');
    expect(await repository.resumeBlockedAuth(new Date(now.getTime() + 1_000))).toBeGreaterThanOrEqual(1);
    const cancelled = await repository.cancel(
      created.id,
      'LEANDRO',
      'Cancel the test job after auth recovery.',
      new Date(now.getTime() + 2_000),
    );
    expect(cancelled.status).toBe('CANCELLED');
  });

  it('recovers expired leases for retry and ultimately marks exhaustion as DEAD', async () => {
    const now = new Date('2026-08-22T17:00:00.000Z');
    const created = await repository.enqueue(spec('recover', { maxAttempts: 2 }), now);
    const first = await repository.claimNext('worker-crash', 5_000, now);
    expect(first?.job.id).toBe(created.id);
    expect(await repository.recover(new Date(now.getTime() + 5_001))).toMatchObject({
      recoveredForRetry: 1,
    });

    const second = await repository.claimNext(
      'worker-crash',
      5_000,
      new Date(now.getTime() + 5_002),
    );
    expect(second?.job.id).toBe(created.id);
    expect(await repository.recover(new Date(now.getTime() + 10_003))).toMatchObject({
      movedToDead: 1,
    });
    expect((await repository.get(created.id))?.status).toBe('DEAD');
  });
});
