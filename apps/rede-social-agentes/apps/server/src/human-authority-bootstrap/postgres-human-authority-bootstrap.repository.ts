import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import type { DatabaseRow, DatabaseTransaction } from '@rsa/database';

import { BootstrapDatabaseService } from './bootstrap-database.service.js';
import type {
  HumanAuthorityBootstrapIntentRecord,
  HumanAuthorityBootstrapRepository,
  HumanAuthorityBootstrapState,
  HumanAuthorityBootstrapTarget,
} from './human-authority-bootstrap.service.js';

interface IntentRow extends DatabaseRow {
  intent_ref: string;
  target: HumanAuthorityBootstrapTarget;
  state: HumanAuthorityBootstrapState;
  subject_fingerprint: string;
  sealed_binding: string;
  expires_at: Date;
  claim_ref: string | null;
  claim_expires_at: Date | null;
  created_at: Date;
}

function mapIntent(row: IntentRow): HumanAuthorityBootstrapIntentRecord {
  return {
    intentRef: row.intent_ref,
    target: row.target,
    state: row.state,
    subjectFingerprint: row.subject_fingerprint,
    sealedBinding: row.sealed_binding,
    expiresAt: row.expires_at,
    claimRef: row.claim_ref,
    claimExpiresAt: row.claim_expires_at,
    createdAt: row.created_at,
  };
}

async function audit(
  client: DatabaseTransaction,
  actorType: 'HUMAN' | 'SYSTEM',
  eventType: string,
  intentRef: string,
  payload: Record<string, unknown>,
): Promise<void> {
  await client.query(
    `insert into "audit_events" (
      "id", "actor_id", "actor_type", "event_type", "aggregate_type",
      "aggregate_id", "correlation_id", "payload"
    ) values ($1, null, $2, $3, 'HUMAN_AUTHORITY_BOOTSTRAP', $4, $4, $5::jsonb)`,
    [randomUUID(), actorType, eventType, intentRef, JSON.stringify(payload)],
  );
}

@Injectable()
export class PostgresHumanAuthorityBootstrapRepository implements HumanAuthorityBootstrapRepository {
  constructor(
    @Inject(BootstrapDatabaseService) private readonly database: BootstrapDatabaseService,
  ) {}

  async reserveIntent(candidate: HumanAuthorityBootstrapIntentRecord, now: Date) {
    return this.database.transaction(async (client) => {
      await client.query(`select pg_advisory_xact_lock(hashtext($1))`, [
        `human-authority-bootstrap:${candidate.target}`,
      ]);
      await client.query(
        `update "human_authority_binding_intents"
         set "state" = 'FAILED', "failure_code" = 'INTENT_EXPIRED', "updated_at" = $2
         where "target" = $1
           and "state" in ('PENDING', 'APPLYING', 'VERIFYING')
           and "expires_at" <= $2`,
        [candidate.target, now],
      );

      const active = await client.query<IntentRow>(
        `select * from "human_authority_binding_intents"
         where "target" = $1 and "state" in ('PENDING', 'APPLYING', 'VERIFYING')
         order by "created_at" desc limit 1 for update`,
        [candidate.target],
      );
      const existing = active.rows[0];
      if (existing) {
        return {
          status:
            existing.subject_fingerprint === candidate.subjectFingerprint
              ? ('REUSED' as const)
              : ('CONFLICT' as const),
          intent: mapIntent(existing),
        };
      }

      const inserted = await client.query<IntentRow>(
        `insert into "human_authority_binding_intents" (
          "intent_ref", "target", "state", "subject_fingerprint", "sealed_binding",
          "expires_at", "created_at", "updated_at"
        ) values ($1, $2, 'PENDING', $3, $4, $5, $6, $6)
        returning *`,
        [
          candidate.intentRef,
          candidate.target,
          candidate.subjectFingerprint,
          candidate.sealedBinding,
          candidate.expiresAt,
          candidate.createdAt,
        ],
      );
      const row = inserted.rows[0];
      if (!row) throw new Error('Authority-binding intent insert returned no row.');
      await audit(client, 'HUMAN', 'HUMAN_AUTHORITY_BINDING_INTENT_CREATED', candidate.intentRef, {
        target: candidate.target,
        state: 'PENDING',
        identityDisclosed: false,
      });
      return { status: 'CREATED' as const, intent: mapIntent(row) };
    });
  }

  async claimIntent(input: {
    intentRef: string;
    claimRef: string;
    principalFingerprint: string;
    claimExpiresAt: Date;
    now: Date;
  }): Promise<HumanAuthorityBootstrapIntentRecord | null> {
    return this.database.transaction(async (client) => {
      const selected = await client.query<IntentRow>(
        `select * from "human_authority_binding_intents" where "intent_ref" = $1 for update`,
        [input.intentRef],
      );
      const current = selected.rows[0];
      if (!current || current.expires_at <= input.now) return null;
      const reclaimable =
        current.state === 'PENDING' ||
        ((current.state === 'APPLYING' || current.state === 'VERIFYING') &&
          current.claim_expires_at !== null &&
          current.claim_expires_at <= input.now);
      if (!reclaimable) return null;

      const nextState = current.state === 'PENDING' ? 'APPLYING' : current.state;
      const updated = await client.query<IntentRow>(
        `update "human_authority_binding_intents"
         set "state" = $2, "claim_ref" = $3, "claim_expires_at" = $4,
             "principal_fingerprint" = $5, "updated_at" = $6
         where "intent_ref" = $1 returning *`,
        [
          input.intentRef,
          nextState,
          input.claimRef,
          input.claimExpiresAt,
          input.principalFingerprint,
          input.now,
        ],
      );
      const row = updated.rows[0];
      if (!row) return null;
      await audit(client, 'SYSTEM', 'HUMAN_AUTHORITY_BINDING_INTENT_CLAIMED', input.intentRef, {
        target: row.target,
        state: row.state,
        recoveredLease: current.state !== 'PENDING',
      });
      return mapIntent(row);
    });
  }

  async markVerifying(input: {
    intentRef: string;
    claimRef: string;
    providerMutationDigest: string;
    now: Date;
  }): Promise<boolean> {
    return this.database.transaction(async (client) => {
      const result = await client.query<IntentRow>(
        `update "human_authority_binding_intents"
         set "state" = 'VERIFYING', "provider_mutation_digest" = $3, "updated_at" = $4
         where "intent_ref" = $1 and "claim_ref" = $2 and "state" = 'APPLYING'
           and "claim_expires_at" > $4 returning *`,
        [input.intentRef, input.claimRef, input.providerMutationDigest, input.now],
      );
      const row = result.rows[0];
      if (!row) return false;
      await audit(client, 'SYSTEM', 'HUMAN_AUTHORITY_BINDING_PROVIDER_APPLIED', input.intentRef, {
        target: row.target,
        state: 'VERIFYING',
        providerMutationDigest: input.providerMutationDigest,
      });
      return true;
    });
  }

  async finalizeIntent(input: {
    intentRef: string;
    claimRef: string;
    outcome: 'BOUND' | 'CONFLICT' | 'FAILED';
    receiptDigest: string;
    now: Date;
  }): Promise<boolean> {
    return this.database.transaction(async (client) => {
      const result = await client.query<IntentRow>(
        `update "human_authority_binding_intents"
         set "state" = $3, "receipt_digest" = $4, "claim_ref" = null,
             "claim_expires_at" = null, "updated_at" = $5
         where "intent_ref" = $1 and "claim_ref" = $2
           and "claim_expires_at" > $5
           and (("state" = 'VERIFYING' and $3 = 'BOUND')
             or ("state" in ('APPLYING', 'VERIFYING') and $3 in ('CONFLICT', 'FAILED')))
         returning *`,
        [input.intentRef, input.claimRef, input.outcome, input.receiptDigest, input.now],
      );
      const row = result.rows[0];
      if (!row) return false;
      await audit(client, 'SYSTEM', `HUMAN_AUTHORITY_BINDING_${input.outcome}`, input.intentRef, {
        target: row.target,
        state: input.outcome,
        receiptDigest: input.receiptDigest,
        identityDisclosed: false,
      });
      return true;
    });
  }
}
