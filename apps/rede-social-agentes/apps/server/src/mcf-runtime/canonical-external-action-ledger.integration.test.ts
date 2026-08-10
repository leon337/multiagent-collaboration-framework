import { randomUUID } from 'node:crypto';

import type { McfSkillDefinition } from '@rsa/contracts';
import type { DatabaseRow } from '@rsa/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DatabaseService } from '../database.service.js';
import { CanonicalExternalActionLedger } from './canonical-external-action-ledger.js';
import type { ExternalActionRequest } from './external-action.contracts.js';

const REPOSITORY = 'leon337/multiagent-collaboration-framework';
const RELEASE_SHA = 'c'.repeat(40);
const STAGING_URL = 'https://staging.example';

const skill: McfSkillDefinition = {
  skillId: 'MCF-DEPLOY-VALIDATE',
  name: 'Deploy Validate',
  version: '1.0.0',
  purpose: 'verified staging deployment',
  ownerAgents: ['Gabriel'],
  requiredInputs: ['artifact_or_commit', 'target_environment'],
  allowedTools: ['GitHub', 'Render'],
  forbiddenTools: ['public_production_without_gate'],
  permissionProfile: 'SCOPED_WRITE',
  executionSteps: [],
  requiredEvidence: [],
  acceptanceCriteria: [],
  failureModes: [],
  fallback: 'Mestre',
  handoffTo: 'Mestre',
};

interface AttemptRow extends DatabaseRow {
  provider: string;
  operation: string;
  resource: string;
  fingerprint: string | null;
}

interface EventRow extends DatabaseRow {
  payload: unknown;
}

function missionContract(title: string) {
  return JSON.stringify({
    title,
    objective: 'Prove canonical Gate D reservation and durable staging origin binding.',
    expectedOutcome: 'Aliases converge to one durable request identity.',
    scope: ['Gate D durable reservation'],
    outOfScope: ['real provider write'],
    acceptanceCriteria: ['canonical attempt identity', 'origin bound before adapter execution'],
    riskClass: 'C',
    selectedAgents: ['Gabriel', 'Mestre'],
    selectedSkills: ['MCF-DEPLOY-VALIDATE'],
    sourceOfTruth: ['MCF-RUNTIME-006-GATE-D'],
  });
}

function request(
  missionId: string,
  phaseId: string,
  idempotencyKey: string,
  provider: string,
  operation: string,
): ExternalActionRequest {
  return {
    skill,
    agentId: 'Gabriel',
    inputs: {
      authorizedScope: true,
      repository: 'Leon337/Multiagent-Collaboration-Framework',
      artifact_or_commit: RELEASE_SHA.toUpperCase(),
      target_environment: 'STAGING',
      idempotency_key: idempotencyKey,
    },
    tool: {
      provider,
      operation,
      resource: 'Leon337/Multiagent-Collaboration-Framework',
    },
    context: { missionId, phaseId, expectedMissionVersion: 1 },
  };
}

async function insertMissions(database: DatabaseService, missionA: string, missionB: string) {
  const now = new Date();
  await database.query(
    `insert into "mcf_missions" (
      "id", "contract", "state", "current_phase_id", "current_agent_id",
      "version", "created_at", "updated_at"
    ) values
      ($1, $2::jsonb, 'EXECUTING', null, 'Gabriel', 1, $5, $5),
      ($3, $4::jsonb, 'EXECUTING', null, 'Gabriel', 1, $5, $5)`,
    [missionA, missionContract('alias request'), missionB, missionContract('canonical retry'), now],
  );
}

async function cleanup(database: DatabaseService, missionIds: string[]) {
  await database.query(`delete from "mcf_tool_receipts" where "mission_id" = any($1::text[])`, [
    missionIds,
  ]);
  await database.query(`delete from "mcf_handoffs" where "mission_id" = any($1::text[])`, [
    missionIds,
  ]);
  await database.query(`delete from "mcf_phases" where "mission_id" = any($1::text[])`, [
    missionIds,
  ]);
  await database.query(
    `delete from "mcf_external_action_attempts" where "mission_id" = any($1::text[])`,
    [missionIds],
  );
  await database.query(`delete from "mcf_events" where "mission_id" = any($1::text[])`, [
    missionIds,
  ]);
  await database.query(`delete from "mcf_missions" where "id" = any($1::text[])`, [missionIds]);
}

describe('Gate D canonical external action ledger', () => {
  let database: DatabaseService;
  let ledger: CanonicalExternalActionLedger;

  beforeAll(() => {
    database = new DatabaseService();
    ledger = new CanonicalExternalActionLedger(database, 'https://STAGING.example/');
  });

  afterAll(async () => {
    await database.onModuleDestroy();
  });

  it('canonicalizes aliases, binds staging origin durably, and preserves retry identity', async () => {
    const missionA = randomUUID();
    const missionB = randomUUID();
    const phaseA = randomUUID();
    const phaseB = randomUUID();
    const idempotencyKey = `mcf-gate-d-alias-${randomUUID()}`;

    try {
      await insertMissions(database, missionA, missionB);
      const firstAttempt = await ledger.reserve(
        request(missionA, phaseA, idempotencyKey, 'github-actions', 'deploy_staging'),
        'github-actions-staging-deploy-v1',
      );

      const persisted = await database.query<AttemptRow>(
        `select
          "provider", "operation", "resource",
          "idempotency_fingerprint" as "fingerprint"
         from "mcf_external_action_attempts"
         where "attempt_id" = $1`,
        [firstAttempt],
      );
      expect(persisted.rows[0]).toMatchObject({
        provider: 'github',
        operation: 'deploy-staging',
        resource: REPOSITORY,
      });
      expect(persisted.rows[0]?.fingerprint).toMatch(/^[a-f0-9]{64}$/u);

      const origin = await database.query<EventRow>(
        `select "payload"
         from "mcf_events"
         where "idempotency_key" = $1`,
        [`external-action:${firstAttempt}:staging-origin-bound`],
      );
      expect(origin.rows).toHaveLength(1);
      expect(origin.rows[0]?.payload).toMatchObject({
        kind: 'STAGING_ORIGIN_BOUND',
        attemptId: firstAttempt,
        provider: 'github',
        operation: 'deploy-staging',
        repository: REPOSITORY,
        idempotencyKey,
        stagingRuntimeUrl: STAGING_URL,
        stagingOriginBound: true,
      });

      const loadable = await ledger.loadStagingDeployReconciliationAttempt(
        missionA,
        phaseA,
        idempotencyKey,
      );
      expect(loadable?.attemptId).toBe(firstAttempt);

      await ledger.recordExecuting(firstAttempt);
      await ledger.recordFailed(firstAttempt, {
        code: 'LEDGER_FAILURE',
        message: 'definitive pre-write failure',
        retryable: true,
        statusCode: null,
      });

      const retryAttempt = await ledger.reserve(
        request(missionB, phaseB, idempotencyKey, 'github', 'deploy-staging'),
        'github-actions-staging-deploy-v1',
      );
      expect(retryAttempt).not.toBe(firstAttempt);

      const fingerprints = await database.query<AttemptRow>(
        `select
          "provider", "operation", "resource",
          "idempotency_fingerprint" as "fingerprint"
         from "mcf_external_action_attempts"
         where "attempt_id" = any($1::text[])
         order by "created_at" asc`,
        [[firstAttempt, retryAttempt]],
      );
      expect(fingerprints.rows).toHaveLength(2);
      expect(fingerprints.rows[0]?.fingerprint).toBe(fingerprints.rows[1]?.fingerprint);
    } finally {
      await cleanup(database, [missionA, missionB]);
    }
  });
});
