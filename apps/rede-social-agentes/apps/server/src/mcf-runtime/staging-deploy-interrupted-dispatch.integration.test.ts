import { randomUUID } from 'node:crypto';

import type { McfSkillDefinition } from '@rsa/contracts';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { DatabaseService } from '../database.service.js';
import { ExternalActionLedger } from './external-action-ledger.js';
import type { ExternalActionRequest } from './external-action.contracts.js';
import type { GitHubActionsStagingDeployAdapter } from './github-staging-deploy.adapter.js';
import { PostgresMcfRuntimeRepository } from './postgres-mcf-runtime.repository.js';
import type { SkillExecutor } from './skill-executor.js';
import type { SkillRegistryLoader } from './skill-registry.loader.js';
import { StagingDeployReconciliationService } from './staging-deploy-reconciliation.service.js';

const REPOSITORY = 'leon337/multiagent-collaboration-framework';
const RELEASE_SHA = 'b'.repeat(40);
const PREVIOUS_SHA = 'a'.repeat(40);

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
  requiredEvidence: ['deployment receipt', 'health/version', 'health/ready'],
  acceptanceCriteria: ['staging deployment evidence is reconciled'],
  failureModes: [],
  fallback: 'Mestre',
  handoffTo: 'Mestre',
};

function missionContract() {
  return JSON.stringify({
    title: 'Gate D interrupted dispatch recovery',
    objective: 'Recover a staging callback after the server stops after dispatch.',
    expectedOutcome: 'Durable attempt metadata materializes the missing pending phase.',
    scope: ['Gate D callback reconciliation'],
    outOfScope: ['real provider write'],
    acceptanceCriteria: ['missing phase can be recovered fail-closed'],
    riskClass: 'C',
    selectedAgents: ['Gabriel', 'Mestre'],
    selectedSkills: ['MCF-DEPLOY-VALIDATE'],
    sourceOfTruth: ['MCF-RUNTIME-006-GATE-D'],
  });
}

function externalRequest(
  missionId: string,
  phaseId: string,
  idempotencyKey: string,
): ExternalActionRequest {
  return {
    skill,
    agentId: 'Gabriel',
    inputs: {
      authorizedScope: true,
      repository: REPOSITORY,
      artifact_or_commit: RELEASE_SHA,
      target_environment: 'staging',
      idempotency_key: idempotencyKey,
    },
    tool: { provider: 'github', operation: 'deploy-staging', resource: REPOSITORY },
    context: { missionId, phaseId, expectedMissionVersion: 1 },
  };
}

describe('Gate D interrupted staging dispatch callback recovery', () => {
  let database: DatabaseService;
  let repository: PostgresMcfRuntimeRepository;
  let ledger: ExternalActionLedger;

  beforeAll(() => {
    database = new DatabaseService();
    repository = new PostgresMcfRuntimeRepository(database);
    ledger = new ExternalActionLedger(database);
  });

  afterAll(async () => {
    await database.onModuleDestroy();
  });

  it('materializes a missing phase and converts EXECUTING to UNKNOWN before provider reconciliation', async () => {
    const missionId = randomUUID();
    const phaseId = randomUUID();
    const idempotencyKey = `mcf-gate-d-crash-${randomUUID()}`;
    const now = new Date();

    const registry = {
      load: vi.fn(async () => skill),
    } as unknown as SkillRegistryLoader;
    const executor = { execute: vi.fn() } as unknown as SkillExecutor;
    const reconcile = vi.fn(async () => {
      throw new Error('stop after durable crash recovery');
    });
    const adapter = { reconcile } as unknown as GitHubActionsStagingDeployAdapter;
    const service = new StagingDeployReconciliationService(
      repository,
      executor,
      registry,
      ledger,
      adapter,
      database,
    );

    try {
      await database.query(
        `insert into "mcf_missions" (
          "id", "contract", "state", "current_phase_id", "current_agent_id",
          "version", "created_at", "updated_at"
        ) values ($1, $2::jsonb, 'EXECUTING', null, 'Gabriel', 1, $3, $3)`,
        [missionId, missionContract(), now],
      );

      const attemptId = await ledger.reserve(
        externalRequest(missionId, phaseId, idempotencyKey),
        'github-actions-staging-deploy-v1',
      );
      await ledger.recordExecuting(attemptId);
      await ledger.recordReconciliationPrepared(attemptId, {
        previousSha: PREVIOUS_SHA,
        releaseSha: RELEASE_SHA,
        idempotencyKey,
        repository: REPOSITORY,
        reconciliationEligible: true,
      });

      expect(await repository.findPhase(missionId, phaseId)).toBeNull();

      await expect(
        service.accept({
          missionId,
          phaseId,
          requestId: idempotencyKey,
          releaseSha: RELEASE_SHA,
          workflowRunId: '4242',
          repository: REPOSITORY,
          completedAt: '2026-08-10T18:00:00Z',
          stagingRuntimeUrl: 'https://staging.example.invalid',
        }),
      ).rejects.toThrow('stop after durable crash recovery');

      expect(reconcile).toHaveBeenCalledTimes(1);

      const phase = await repository.findPhase(missionId, phaseId);
      expect(phase).toMatchObject({
        id: phaseId,
        missionId,
        skillId: 'MCF-DEPLOY-VALIDATE',
        agentId: 'Gabriel',
        state: 'RECOVERING',
        inputs: {
          authorizedScope: true,
          repository: REPOSITORY,
          artifact_or_commit: RELEASE_SHA,
          target_environment: 'staging',
          idempotency_key: idempotencyKey,
        },
      });
      expect(phase?.expectedEvidence).toEqual(skill.requiredEvidence);

      const mission = await repository.findMission(missionId);
      expect(mission).toMatchObject({
        state: 'RECOVERING',
        currentPhaseId: phaseId,
        currentAgentId: 'Gabriel',
        version: 2,
      });

      const attempt = await database.query<{
        status: string;
        activeAttemptId: string | null;
      }>(
        `select
           a."status",
           m."active_external_attempt_id" as "activeAttemptId"
         from "mcf_external_action_attempts" a
         join "mcf_missions" m on m."id" = a."mission_id"
         where a."attempt_id" = $1`,
        [attemptId],
      );
      expect(attempt.rows[0]).toEqual({ status: 'UNKNOWN', activeAttemptId: attemptId });
    } finally {
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
