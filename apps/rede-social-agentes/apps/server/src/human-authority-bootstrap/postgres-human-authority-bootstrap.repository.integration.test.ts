import { randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { BootstrapDatabaseService } from './bootstrap-database.service.js';
import { PostgresHumanAuthorityBootstrapRepository } from './postgres-human-authority-bootstrap.repository.js';

const databaseUrl = process.env.DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;

describeWithDatabase('PostgresHumanAuthorityBootstrapRepository integration', () => {
  it('recovers an expired VERIFYING lease and finalizes only with the replacement claim', async () => {
    const database = new BootstrapDatabaseService(databaseUrl!);
    const repository = new PostgresHumanAuthorityBootstrapRepository(database);
    const intentRef = randomUUID();
    const now = new Date();
    const subjectFingerprint = 'a'.repeat(64);
    try {
      const reserved = await repository.reserveIntent(
        {
          intentRef,
          target: 'STAGING',
          state: 'PENDING',
          subjectFingerprint,
          sealedBinding: 'sealed-test-binding',
          expiresAt: new Date(now.getTime() + 600_000),
          createdAt: now,
        },
        now,
      );
      expect(reserved.status).toBe('CREATED');

      const firstClaimRef = randomUUID();
      const first = await repository.claimIntent({
        intentRef,
        claimRef: firstClaimRef,
        principalFingerprint: 'b'.repeat(64),
        claimExpiresAt: new Date(now.getTime() + 1_000),
        now,
      });
      expect(first?.state).toBe('APPLYING');
      await expect(
        repository.markVerifying({
          intentRef,
          claimRef: firstClaimRef,
          providerMutationDigest: 'c'.repeat(64),
          now: new Date(now.getTime() + 500),
        }),
      ).resolves.toBe(true);

      const secondClaimRef = randomUUID();
      const recovered = await repository.claimIntent({
        intentRef,
        claimRef: secondClaimRef,
        principalFingerprint: 'b'.repeat(64),
        claimExpiresAt: new Date(now.getTime() + 302_000),
        now: new Date(now.getTime() + 2_000),
      });
      expect(recovered).toMatchObject({ state: 'VERIFYING', claimRef: secondClaimRef });

      await expect(
        repository.finalizeIntent({
          intentRef,
          claimRef: firstClaimRef,
          outcome: 'BOUND',
          receiptDigest: 'd'.repeat(64),
          now: new Date(now.getTime() + 2_100),
        }),
      ).resolves.toBe(false);
      await expect(
        repository.finalizeIntent({
          intentRef,
          claimRef: secondClaimRef,
          outcome: 'BOUND',
          receiptDigest: 'd'.repeat(64),
          now: new Date(now.getTime() + 2_100),
        }),
      ).resolves.toBe(true);

      const state = await database.query<{ state: string }>(
        'select "state" from "human_authority_binding_intents" where "intent_ref" = $1',
        [intentRef],
      );
      expect(state.rows[0]?.state).toBe('BOUND');

      const audit = await database.query<{ event_type: string; actor_type: string }>(
        `select "event_type", "actor_type" from "audit_events"
         where "aggregate_type" = $1 and "aggregate_id" = $2
         order by "occurred_at", "event_type"`,
        ['HUMAN_AUTHORITY_BOOTSTRAP', intentRef],
      );
      expect(audit.rows).toEqual([
        { event_type: 'HUMAN_AUTHORITY_BINDING_INTENT_CREATED', actor_type: 'HUMAN' },
        { event_type: 'HUMAN_AUTHORITY_BINDING_INTENT_CLAIMED', actor_type: 'SYSTEM' },
        { event_type: 'HUMAN_AUTHORITY_BINDING_PROVIDER_APPLIED', actor_type: 'SYSTEM' },
        { event_type: 'HUMAN_AUTHORITY_BINDING_INTENT_CLAIMED', actor_type: 'SYSTEM' },
        { event_type: 'HUMAN_AUTHORITY_BINDING_BOUND', actor_type: 'SYSTEM' },
      ]);
    } finally {
      await database.query(
        'delete from "audit_events" where "aggregate_type" = $1 and "aggregate_id" = $2',
        ['HUMAN_AUTHORITY_BOOTSTRAP', intentRef],
      );
      await database.query(
        'delete from "human_authority_binding_intents" where "intent_ref" = $1',
        [intentRef],
      );
      await database.onModuleDestroy();
    }
  });
});
