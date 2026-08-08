import { randomUUID } from 'node:crypto';

import type { McfSkillDefinition } from '@rsa/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DatabaseService } from '../database.service.js';
import { ExternalActionLedger } from './external-action-ledger.js';

const ADAPTER_ID = 'github-pr-collaboration-write-v1';
const REPOSITORY = 'leon337/multiagent-collaboration-framework';

const skill: McfSkillDefinition = {
  skillId: 'MCF-GIT-PR-RELEASE',
  name: 'Git PR Release',
  version: '1.0.0',
  purpose: 'controlled GitHub PR collaboration',
  ownerAgents: ['Gabriel'],
  requiredInputs: [],
  allowedTools: ['github'],
  forbiddenTools: [],
  permissionProfile: 'SCOPED_WRITE',
  executionSteps: [],
  requiredEvidence: [],
  acceptanceCriteria: [],
  failureModes: [],
  fallback: 'Mestre',
  handoffTo: 'Mestre',
};

function contract(title: string) {
  return JSON.stringify({
    title,
    objective: 'Verify canonical C2 idempotency fingerprints.',
    expectedOutcome: 'Accepted aliases recover the same expired global request.',
    scope: ['C2 idempotency canonicalization'],
    outOfScope: ['real provider write'],
    acceptanceCriteria: ['canonical aliases share one logical fingerprint'],
    riskClass: 'B',
    selectedAgents: ['Gabriel'],
    selectedSkills: ['MCF-GIT-PR-RELEASE'],
    sourceOfTruth: ['MCF-RUNTIME-006-C2'],
  });
}

function request(
  missionId: string,
  phaseId: string,
  key: string,
  aliases = false,
) {
  return {
    skill,
    agentId: 'Gabriel',
    inputs: {
      authorizedScope: true,
      repository: aliases ? REPOSITORY.toUpperCase() : REPOSITORY,
      pull_request_number: 80,
      expected_head_sha: aliases ? 'A'.repeat(40) : 'a'.repeat(40),
      idempotency_key: key,
      comment_body: 'same logical checkpoint',
    },
    tool: {
      provider: aliases ? 'GitHub' : 'github',
      operation: aliases ? 'comment_pr' : 'comment-pr',
      resource: aliases ? REPOSITORY.toUpperCase() : REPOSITORY,
    },
    context: { missionId, phaseId, expectedMissionVersion: 1 },
  };
}

describe('C2 canonical idempotency fingerprint recovery', () => {
  let database: DatabaseService;
  let ledger: ExternalActionLedger;

  beforeAll(() => {
    database = new DatabaseService();
    ledger = new ExternalActionLedger(database);
  });

  afterAll(async () => {
    await database.onModuleDestroy();
  });

  it(
    'treats accepted provider/operation/repository/SHA aliases as the same expired request',
    async () => {
      const holderMission = randomUUID();
      const retryMission = randomUUID();
      const holderPhase = randomUUID();
      const retryPhase = randomUUID();
      const key = 'mcf-c2-canonical-fingerprint-0001';
      const now = new Date();

      try {
        for (const [missionId, title] of [
          [holderMission, 'C2 canonical holder'],
          [retryMission, 'C2 canonical retry'],
        ] as const) {
          await database.query(
            `insert into "mcf_missions" (
              "id", "contract", "state", "current_phase_id", "current_agent_id",
              "version", "created_at", "updated_at"
            ) values ($1, $2::jsonb, 'EXECUTING', null, 'Gabriel', 1, $3, $3)`,
            [missionId, contract(title), now],
          );
        }

        const holderAttempt = await ledger.reserve(
          request(holderMission, holderPhase, key),
          ADAPTER_ID,
        );
        await database.query(
          `update "mcf_external_action_attempts"
           set "lease_expires_at" = now() - interval '1 minute'
           where "attempt_id" = $1`,
          [holderAttempt],
        );

        const retryAttempt = await ledger.reserve(
          request(retryMission, retryPhase, key, true),
          ADAPTER_ID,
        );

        expect(retryAttempt).not.toBe(holderAttempt);
        const attempts = await database.query<{
          attemptId: string;
          status: string;
          scopeKey: string | null;
        }>(
          `select
             "attempt_id" as "attemptId",
             "status",
             "idempotency_scope_key" as "scopeKey"
           from "mcf_external_action_attempts"
           where "mission_id" = any($1::text[])
           order by "created_at"`,
          [[holderMission, retryMission]],
        );

        expect(attempts.rows.find((row) => row.attemptId === holderAttempt)).toMatchObject({
          status: 'ABANDONED',
          scopeKey: null,
        });
        expect(attempts.rows.find((row) => row.attemptId === retryAttempt)).toMatchObject({
          status: 'ALLOWED',
        });
        expect(attempts.rows.find((row) => row.attemptId === retryAttempt)?.scopeKey).toEqual(
          expect.any(String),
        );
      } finally {
        await database.query(
          `delete from "mcf_external_action_attempts" where "mission_id" = any($1::text[])`,
          [[holderMission, retryMission]],
        );
        await database.query(`delete from "mcf_events" where "mission_id" = any($1::text[])`, [
          [holderMission, retryMission],
        ]);
        await database.query(`delete from "mcf_missions" where "id" = any($1::text[])`, [
          [holderMission, retryMission],
        ]);
      }
    },
  );
});
