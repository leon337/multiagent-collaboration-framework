import { randomUUID } from 'node:crypto';

import type { McfSkillDefinition } from '@rsa/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DatabaseService } from '../database.service.js';
import { ExternalActionLedger } from './external-action-ledger.js';
import type { ExternalActionRequest } from './external-action.contracts.js';
import { PostgresMcfRuntimeRepository } from './postgres-mcf-runtime.repository.js';

const BASE_SHA = '1'.repeat(40);
const HEAD_SHA = '2'.repeat(40);
const KEY = 'mcf-c1-integration-idempotency-0001';

const skill: McfSkillDefinition = {
  skillId: 'MCF-GIT-PR-RELEASE',
  name: 'Git PR Release',
  version: '1.0.0',
  purpose: 'Create a controlled branch and pull request.',
  ownerAgents: ['Gabriel'],
  requiredInputs: [],
  allowedTools: ['github'],
  forbiddenTools: ['merge', 'force-push'],
  permissionProfile: 'SCOPED_WRITE',
  executionSteps: [],
  requiredEvidence: [],
  acceptanceCriteria: [],
  failureModes: [],
  fallback: 'Mestre',
  handoffTo: 'Mestre',
};

function request(
  missionId: string,
  phaseId: string,
  version: number,
  branchRef = 'feat/c1-idempotent',
): ExternalActionRequest {
  return {
    skill,
    agentId: 'Gabriel',
    inputs: {
      repository: 'leon337/multiagent-collaboration-framework',
      base_branch: 'main',
      base_sha: BASE_SHA,
      commit_sha: HEAD_SHA,
      branch_ref: branchRef,
      idempotency_key: KEY,
      change_summary: 'C1 controlled idempotency integration',
      risk_summary: 'reversible',
      authorizedScope: true,
    },
    tool: {
      provider: 'github',
      operation: 'create-branch-pr',
      resource: 'leon337/multiagent-collaboration-framework',
    },
    context: {
      missionId,
      phaseId,
      expectedMissionVersion: version,
    },
  };
}

describe('C1 idempotency reservation integration', () => {
  let database: DatabaseService;
  let ledger: ExternalActionLedger;
  let repository: PostgresMcfRuntimeRepository;

  beforeAll(() => {
    database = new DatabaseService();
    ledger = new ExternalActionLedger(database);
    repository = new PostgresMcfRuntimeRepository(database);
  });

  afterAll(async () => {
    await database.onModuleDestroy();
  });

  it('blocks concurrent callbacks, rejects key reuse with changed inputs, and permits compatible replay', async () => {
    const missionId = randomUUID();
    const phaseOne = randomUUID();
    const phaseTwo = randomUUID();
    const createdAt = new Date();

    try {
      await database.query(
        `insert into "mcf_missions" (
          "id", "contract", "state", "current_phase_id", "current_agent_id",
          "version", "created_at", "updated_at"
        ) values ($1, $2::jsonb, 'EXECUTING', null, 'Gabriel', 1, $3, $3)`,
        [
          missionId,
          JSON.stringify({
            title: 'C1 idempotency integration',
            objective: 'Prove that one key cannot drift to another controlled write.',
            expectedOutcome: 'Concurrent duplication blocked and replay input bound.',
            scope: ['C1 ledger idempotency'],
            outOfScope: ['real GitHub writes'],
            acceptanceCriteria: ['same key cannot change the write target'],
            riskClass: 'B',
            selectedAgents: ['Gabriel'],
            selectedSkills: ['MCF-GIT-PR-RELEASE'],
            sourceOfTruth: ['MCF-RUNTIME-006-C1'],
          }),
          createdAt,
        ],
      );

      const firstRequest = request(missionId, phaseOne, 1);
      const firstAttempt = await ledger.reserve(firstRequest, 'github-branch-pr-write-v1');

      await expect(ledger.reserve(firstRequest, 'github-branch-pr-write-v1')).rejects.toMatchObject(
        {
          code: 'RESERVATION_CONFLICT',
        },
      );

      await ledger.recordFailed(firstAttempt, {
        code: 'ADAPTER_FAILURE',
        message: 'controlled test terminal failure',
        retryable: false,
        statusCode: null,
      });

      await repository.persistExecution({
        missionId,
        expectedMissionVersion: 1,
        externalAttemptId: firstAttempt,
        phase: {
          id: phaseOne,
          missionId,
          skillId: skill.skillId,
          agentId: 'Gabriel',
          state: 'RECOVERING',
          cycle: 1,
          inputs: firstRequest.inputs,
          expectedEvidence: [],
          startedAt: createdAt,
          completedAt: null,
          createdAt,
          updatedAt: createdAt,
        },
        permissionProfile: skill.permissionProfile,
        missionState: 'RECOVERING',
        nextAgentId: null,
        receipt: null,
        evidenceStatus: 'INVALID',
        handoff: null,
        events: [],
      });

      await expect(
        ledger.reserve(
          request(missionId, phaseTwo, 2, 'feat/c1-different-target'),
          'github-branch-pr-write-v1',
        ),
      ).rejects.toMatchObject({
        code: 'RESERVATION_CONFLICT',
        retryable: false,
      });

      const replayAttempt = await ledger.reserve(
        request(missionId, phaseTwo, 2),
        'github-branch-pr-write-v1',
      );
      expect(replayAttempt).not.toBe(firstAttempt);

      const attempts = await database.query<{
        idempotencyKey: string | null;
        idempotencyFingerprint: string | null;
      }>(
        `select
           "idempotency_key" as "idempotencyKey",
           "idempotency_fingerprint" as "idempotencyFingerprint"
         from "mcf_external_action_attempts"
         where "mission_id" = $1 and "idempotency_key" = $2
         order by "created_at"`,
        [missionId, KEY],
      );
      expect(attempts.rows).toHaveLength(2);
      expect(attempts.rows[0]?.idempotencyFingerprint).toMatch(/^[a-f0-9]{64}$/u);
      expect(attempts.rows[1]?.idempotencyFingerprint).toBe(
        attempts.rows[0]?.idempotencyFingerprint,
      );
    } finally {
      await database.query(
        'update "mcf_missions" set "active_external_attempt_id" = null where "id" = $1',
        [missionId],
      );
      await database.query('delete from "mcf_tool_receipts" where "mission_id" = $1', [missionId]);
      await database.query('delete from "mcf_handoffs" where "mission_id" = $1', [missionId]);
      await database.query('delete from "mcf_phases" where "mission_id" = $1', [missionId]);
      await database.query('delete from "mcf_external_action_attempts" where "mission_id" = $1', [
        missionId,
      ]);
      await database.query('delete from "mcf_events" where "mission_id" = $1', [missionId]);
      await database.query('delete from "mcf_missions" where "id" = $1', [missionId]);
    }
  });
});
