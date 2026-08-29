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

const activeStates = [
  'PENDING',
  'APPLYING',
  'PROVIDER_APPLIED',
  'VERIFYING',
  'RUNTIME_VERIFIED',
  'RECONCILIATION_REQUIRED',
] as const;
const reclaimableStates = [
  'APPLYING',
  'PROVIDER_APPLIED',
  'VERIFYING',
  'RUNTIME_VERIFIED',
] as const;

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
    `insert into "audit_events" ("id","actor_id","actor_type","event_type","aggregate_type","aggregate_id","correlation_id","payload") values ($1,null,$2,$3,'HUMAN_AUTHORITY_BOOTSTRAP',$4,$4,$5::jsonb)`,
    [randomUUID(), actorType, eventType, intentRef, JSON.stringify(payload)],
  );
}

async function expireIntent(client: DatabaseTransaction, row: IntentRow, now: Date): Promise<void> {
  if (!activeStates.includes(row.state as (typeof activeStates)[number]) || row.expires_at > now)
    return;
  const result = await client.query<IntentRow>(
    `update "human_authority_binding_intents" set "state"='FAILED',"failure_code"='INTENT_EXPIRED',"claim_ref"=null,"claim_expires_at"=null,"updated_at"=$2 where "intent_ref"=$1 and "state"=$3 returning *`,
    [row.intent_ref, now, row.state],
  );
  if (!result.rows[0]) return;
  await audit(client, 'SYSTEM', 'HUMAN_AUTHORITY_BINDING_INTENT_EXPIRED', row.intent_ref, {
    target: row.target,
    state: 'FAILED',
    reason: 'INTENT_EXPIRED',
    identityDisclosed: false,
  });
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
      const expired = await client.query<IntentRow>(
        `select * from "human_authority_binding_intents" where "target"=$1 and "state" = any($2::text[]) and "expires_at" <= $3 for update`,
        [candidate.target, [...activeStates], now],
      );
      for (const row of expired.rows) await expireIntent(client, row, now);
      const active = await client.query<IntentRow>(
        `select * from "human_authority_binding_intents" where "target"=$1 and "state" = any($2::text[]) order by "created_at" desc limit 1 for update`,
        [candidate.target, [...activeStates]],
      );
      const existing = active.rows[0];
      if (existing)
        return {
          status:
            existing.subject_fingerprint === candidate.subjectFingerprint
              ? ('REUSED' as const)
              : ('CONFLICT' as const),
          intent: mapIntent(existing),
        };
      const inserted = await client.query<IntentRow>(
        `insert into "human_authority_binding_intents" ("intent_ref","target","state","subject_fingerprint","sealed_binding","expires_at","created_at","updated_at") values ($1,$2,'PENDING',$3,$4,$5,$6,$6) returning *`,
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
        `select * from "human_authority_binding_intents" where "intent_ref"=$1 for update`,
        [input.intentRef],
      );
      const current = selected.rows[0];
      if (!current) return null;
      if (current.expires_at <= input.now) {
        await expireIntent(client, current, input.now);
        return null;
      }
      const reclaimable =
        current.state === 'PENDING' ||
        (reclaimableStates.includes(current.state as (typeof reclaimableStates)[number]) &&
          current.claim_expires_at !== null &&
          current.claim_expires_at <= input.now);
      if (!reclaimable) return null;
      const nextState = current.state === 'PENDING' ? 'APPLYING' : current.state;
      const updated = await client.query<IntentRow>(
        `update "human_authority_binding_intents" set "state"=$2,"claim_ref"=$3,"claim_expires_at"=$4,"principal_fingerprint"=$5,"updated_at"=$6 where "intent_ref"=$1 and "expires_at">$6 returning *`,
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

  async markProviderApplied(input: {
    intentRef: string;
    claimRef: string;
    providerMutationDigest: string;
    now: Date;
  }): Promise<boolean> {
    return this.database.transaction(async (client) => {
      const r = await client.query<IntentRow>(
        `update "human_authority_binding_intents" set "state"='PROVIDER_APPLIED',"provider_mutation_digest"=$3,"updated_at"=$4 where "intent_ref"=$1 and "claim_ref"=$2 and "state"='APPLYING' and "claim_expires_at">$4 and "expires_at">$4 returning *`,
        [input.intentRef, input.claimRef, input.providerMutationDigest, input.now],
      );
      const row = r.rows[0];
      if (!row) return false;
      await audit(client, 'SYSTEM', 'HUMAN_AUTHORITY_BINDING_PROVIDER_APPLIED', input.intentRef, {
        target: row.target,
        state: 'PROVIDER_APPLIED',
        providerMutationDigest: input.providerMutationDigest,
      });
      return true;
    });
  }

  async markReconciliationRequired(input: {
    intentRef: string;
    claimRef: string;
    reconciliationDigest: string;
    reason: 'PROVIDER_ATOMIC_CREATE_UNAVAILABLE' | 'PROVIDER_STATE_DRIFT';
    now: Date;
  }): Promise<boolean> {
    return this.database.transaction(async (client) => {
      const r = await client.query<IntentRow>(
        `update "human_authority_binding_intents" set "state"='RECONCILIATION_REQUIRED',"reconciliation_digest"=$3,"failure_code"=$4,"claim_ref"=null,"claim_expires_at"=null,"updated_at"=$5 where "intent_ref"=$1 and "claim_ref"=$2 and "state" in ('APPLYING','PROVIDER_APPLIED','VERIFYING','RUNTIME_VERIFIED') and "claim_expires_at">$5 and "expires_at">$5 returning *`,
        [input.intentRef, input.claimRef, input.reconciliationDigest, input.reason, input.now],
      );
      const row = r.rows[0];
      if (!row) return false;
      await audit(
        client,
        'SYSTEM',
        'HUMAN_AUTHORITY_BINDING_RECONCILIATION_REQUIRED',
        input.intentRef,
        {
          target: row.target,
          state: 'RECONCILIATION_REQUIRED',
          reason: input.reason,
          reconciliationDigest: input.reconciliationDigest,
        },
      );
      return true;
    });
  }

  async markVerifying(input: { intentRef: string; claimRef: string; now: Date }): Promise<boolean> {
    return this.database.transaction(async (client) => {
      const r = await client.query<IntentRow>(
        `update "human_authority_binding_intents" set "state"='VERIFYING',"updated_at"=$3 where "intent_ref"=$1 and "claim_ref"=$2 and "state"='PROVIDER_APPLIED' and "claim_expires_at">$3 and "expires_at">$3 returning *`,
        [input.intentRef, input.claimRef, input.now],
      );
      const row = r.rows[0];
      if (!row) return false;
      await audit(
        client,
        'SYSTEM',
        'HUMAN_AUTHORITY_BINDING_RUNTIME_VERIFICATION_STARTED',
        input.intentRef,
        { target: row.target, state: 'VERIFYING' },
      );
      return true;
    });
  }

  async markRuntimeVerified(input: {
    intentRef: string;
    claimRef: string;
    runtimeEvidenceDigest: string;
    now: Date;
  }): Promise<boolean> {
    return this.database.transaction(async (client) => {
      const r = await client.query<IntentRow>(
        `update "human_authority_binding_intents" set "state"='RUNTIME_VERIFIED',"runtime_evidence_digest"=$3,"updated_at"=$4 where "intent_ref"=$1 and "claim_ref"=$2 and "state"='VERIFYING' and "claim_expires_at">$4 and "expires_at">$4 returning *`,
        [input.intentRef, input.claimRef, input.runtimeEvidenceDigest, input.now],
      );
      const row = r.rows[0];
      if (!row) return false;
      await audit(client, 'SYSTEM', 'HUMAN_AUTHORITY_BINDING_RUNTIME_VERIFIED', input.intentRef, {
        target: row.target,
        state: 'RUNTIME_VERIFIED',
        runtimeEvidenceDigest: input.runtimeEvidenceDigest,
      });
      return true;
    });
  }

  async finalizeIntent(input: {
    intentRef: string;
    claimRef: string;
    outcome: 'CONFLICT' | 'FAILED';
    receiptDigest: string;
    now: Date;
  }): Promise<boolean> {
    if (input.outcome !== 'CONFLICT' && input.outcome !== 'FAILED') return false;
    return this.database.transaction(async (client) => {
      const r = await client.query<IntentRow>(
        `update "human_authority_binding_intents" set "state"=$3,"receipt_digest"=$4,"claim_ref"=null,"claim_expires_at"=null,"updated_at"=$5 where "intent_ref"=$1 and "claim_ref"=$2 and "claim_expires_at">$5 and "expires_at">$5 and "state" in ('APPLYING','PROVIDER_APPLIED','VERIFYING','RUNTIME_VERIFIED') returning *`,
        [input.intentRef, input.claimRef, input.outcome, input.receiptDigest, input.now],
      );
      const row = r.rows[0];
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
