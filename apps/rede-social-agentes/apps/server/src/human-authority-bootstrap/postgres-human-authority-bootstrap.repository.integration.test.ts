import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { BootstrapDatabaseService } from './bootstrap-database.service.js';
import { PostgresHumanAuthorityBootstrapRepository } from './postgres-human-authority-bootstrap.repository.js';

const databaseUrl = process.env.DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;
const fingerprint = (c: string) => c.repeat(64);

async function cleanup(database: BootstrapDatabaseService, intentRef: string) {
  await database.query(
    'delete from "audit_events" where "aggregate_type" = $1 and "aggregate_id" = $2',
    ['HUMAN_AUTHORITY_BOOTSTRAP', intentRef],
  );
  await database.query('delete from "human_authority_binding_intents" where "intent_ref" = $1', [
    intentRef,
  ]);
}

describeWithDatabase('PostgresHumanAuthorityBootstrapRepository integration', () => {
  it('recovers expired APPLYING and VERIFYING leases without replaying terminal work', async () => {
    const database = new BootstrapDatabaseService(databaseUrl!);
    const repository = new PostgresHumanAuthorityBootstrapRepository(database);
    const intentRef = randomUUID();
    const now = new Date();
    try {
      await repository.reserveIntent(
        {
          intentRef,
          target: 'STAGING',
          state: 'PENDING',
          subjectFingerprint: fingerprint('a'),
          sealedBinding: 'sealed-test-binding',
          expiresAt: new Date(now.getTime() + 600_000),
          createdAt: now,
        },
        now,
      );
      const c1 = randomUUID();
      expect(
        (
          await repository.claimIntent({
            intentRef,
            claimRef: c1,
            principalFingerprint: fingerprint('b'),
            claimExpiresAt: new Date(now.getTime() + 1000),
            now,
          })
        )?.state,
      ).toBe('APPLYING');
      const c2 = randomUUID();
      const applying = await repository.claimIntent({
        intentRef,
        claimRef: c2,
        principalFingerprint: fingerprint('b'),
        claimExpiresAt: new Date(now.getTime() + 3000),
        now: new Date(now.getTime() + 2000),
      });
      expect(applying).toMatchObject({ state: 'APPLYING', claimRef: c2 });
      expect(
        await repository.markProviderApplied({
          intentRef,
          claimRef: c2,
          providerMutationDigest: fingerprint('c'),
          now: new Date(now.getTime() + 2200),
        }),
      ).toBe(true);
      expect(
        await repository.markVerifying({
          intentRef,
          claimRef: c2,
          now: new Date(now.getTime() + 2300),
        }),
      ).toBe(true);
      const c3 = randomUUID();
      const verifying = await repository.claimIntent({
        intentRef,
        claimRef: c3,
        principalFingerprint: fingerprint('b'),
        claimExpiresAt: new Date(now.getTime() + 7000),
        now: new Date(now.getTime() + 4000),
      });
      expect(verifying).toMatchObject({ state: 'VERIFYING', claimRef: c3 });
    } finally {
      await cleanup(database, intentRef);
      await database.onModuleDestroy();
    }
  });

  it('expires an intent fail-closed and records SYSTEM audit before rejecting a new claim', async () => {
    const database = new BootstrapDatabaseService(databaseUrl!);
    const repository = new PostgresHumanAuthorityBootstrapRepository(database);
    const intentRef = randomUUID();
    const now = new Date();
    try {
      await repository.reserveIntent(
        {
          intentRef,
          target: 'STAGING',
          state: 'PENDING',
          subjectFingerprint: fingerprint('d'),
          sealedBinding: 'sealed-test-binding',
          expiresAt: new Date(now.getTime() + 1000),
          createdAt: now,
        },
        now,
      );
      const claimed = await repository.claimIntent({
        intentRef,
        claimRef: randomUUID(),
        principalFingerprint: fingerprint('e'),
        claimExpiresAt: new Date(now.getTime() + 500),
        now,
      });
      expect(claimed?.state).toBe('APPLYING');
      const rejected = await repository.claimIntent({
        intentRef,
        claimRef: randomUUID(),
        principalFingerprint: fingerprint('e'),
        claimExpiresAt: new Date(now.getTime() + 3000),
        now: new Date(now.getTime() + 1500),
      });
      expect(rejected).toBeNull();
      const state = await database.query<{ state: string; failure_code: string }>(
        'select "state","failure_code" from "human_authority_binding_intents" where "intent_ref"=$1',
        [intentRef],
      );
      expect(state.rows[0]).toMatchObject({ state: 'FAILED', failure_code: 'INTENT_EXPIRED' });
      const audit = await database.query<{ event_type: string; actor_type: string }>(
        `select "event_type","actor_type" from "audit_events" where "aggregate_type"=$1 and "aggregate_id"=$2 order by "occurred_at","event_type"`,
        ['HUMAN_AUTHORITY_BOOTSTRAP', intentRef],
      );
      expect(audit.rows).toContainEqual({
        event_type: 'HUMAN_AUTHORITY_BINDING_INTENT_EXPIRED',
        actor_type: 'SYSTEM',
      });
    } finally {
      await cleanup(database, intentRef);
      await database.onModuleDestroy();
    }
  });

  it('stops at RUNTIME_VERIFIED because BOUND has no transition in this PR', async () => {
    const database = new BootstrapDatabaseService(databaseUrl!);
    const repository = new PostgresHumanAuthorityBootstrapRepository(database);
    const intentRef = randomUUID();
    const now = new Date();
    const claimRef = randomUUID();
    try {
      await repository.reserveIntent(
        {
          intentRef,
          target: 'STAGING',
          state: 'PENDING',
          subjectFingerprint: fingerprint('f'),
          sealedBinding: 'sealed-test-binding',
          expiresAt: new Date(now.getTime() + 600_000),
          createdAt: now,
        },
        now,
      );
      await repository.claimIntent({
        intentRef,
        claimRef,
        principalFingerprint: fingerprint('1'),
        claimExpiresAt: new Date(now.getTime() + 300_000),
        now,
      });
      expect(
        await repository.markProviderApplied({
          intentRef,
          claimRef,
          providerMutationDigest: fingerprint('2'),
          now: new Date(now.getTime() + 100),
        }),
      ).toBe(true);
      expect(
        await repository.markVerifying({ intentRef, claimRef, now: new Date(now.getTime() + 200) }),
      ).toBe(true);
      expect(
        await repository.markRuntimeVerified({
          intentRef,
          claimRef,
          runtimeEvidenceDigest: fingerprint('5'),
          now: new Date(now.getTime() + 400),
        }),
      ).toBe(true);
      const unsafe = repository as unknown as {
        finalizeIntent(input: Record<string, unknown>): Promise<boolean>;
      };
      expect(
        await unsafe.finalizeIntent({
          intentRef,
          claimRef,
          outcome: 'BOUND',
          receiptDigest: fingerprint('3'),
          now: new Date(now.getTime() + 600),
        }),
      ).toBe(false);
      const state = await database.query<{ state: string; runtime_evidence_digest: string }>(
        'select "state","runtime_evidence_digest" from "human_authority_binding_intents" where "intent_ref"=$1',
        [intentRef],
      );
      expect(state.rows[0]).toMatchObject({
        state: 'RUNTIME_VERIFIED',
        runtime_evidence_digest: fingerprint('5'),
      });
    } finally {
      await cleanup(database, intentRef);
      await database.onModuleDestroy();
    }
  });
});
