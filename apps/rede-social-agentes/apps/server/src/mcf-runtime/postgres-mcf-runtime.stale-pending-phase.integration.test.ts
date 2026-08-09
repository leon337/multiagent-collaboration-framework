import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DatabaseService } from '../database.service.js';
import { EvidenceValidator } from './evidence-validator.js';
import type { McfEventInput, McfMissionRecord, McfPhaseRecord } from './mcf-runtime.repository.js';
import { PostgresMcfRuntimeRepository } from './postgres-mcf-runtime.repository.js';

const repositoryName = 'leon337/multiagent-collaboration-framework';
const releaseSha = 'b'.repeat(40);

function event(
  missionId: string,
  phaseId: string | null,
  eventType: McfEventInput['eventType'],
  idempotencyKey: string,
): McfEventInput {
  return {
    id: randomUUID(),
    missionId,
    phaseId,
    agentId: phaseId ? 'Gabriel' : null,
    eventType,
    payload: { integration: true },
    idempotencyKey,
    occurredAt: new Date(),
  };
}

describe('PostgresMcfRuntimeRepository stale pending staging completion', () => {
  let database: DatabaseService;
  let repository: PostgresMcfRuntimeRepository;

  beforeAll(() => {
    database = new DatabaseService();
    repository = new PostgresMcfRuntimeRepository(database);
  });

  afterAll(async () => {
    await database.onModuleDestroy();
  });

  it('rejects an old UNKNOWN callback after a newer phase advances the mission', async () => {
    const missionId = randomUUID();
    const phaseId = randomUUID();
    const newerPhaseId = randomUUID();
    const attemptId = randomUUID();
    const now = new Date();
    const mission: McfMissionRecord = {
      id: missionId,
      contract: {
        title: 'Gate D stale callback integration',
        objective: 'Reject stale asynchronous staging completion.',
        expectedOutcome: 'Newer mission state is preserved.',
        scope: ['staging'],
        outOfScope: ['production'],
        acceptanceCriteria: ['stale callback rejected'],
        riskClass: 'B',
        selectedAgents: ['Gabriel', 'Mestre'],
        selectedSkills: ['MCF-DEPLOY-VALIDATE'],
        sourceOfTruth: ['issue-83'],
      },
      state: 'PLANNED',
      currentPhaseId: null,
      currentAgentId: null,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    const phase: McfPhaseRecord = {
      id: phaseId,
      missionId,
      skillId: 'MCF-DEPLOY-VALIDATE',
      agentId: 'Gabriel',
      state: 'RECOVERING',
      cycle: 1,
      inputs: {
        repository: repositoryName,
        artifact_or_commit: releaseSha,
        target_environment: 'staging',
      },
      expectedEvidence: ['deployment_id'],
      startedAt: now,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    const newerPhase: McfPhaseRecord = {
      ...phase,
      id: newerPhaseId,
      createdAt: new Date(now.getTime() + 1_000),
      updatedAt: new Date(now.getTime() + 1_000),
    };

    try {
      await repository.createMission({
        mission,
        event: event(missionId, null, 'MISSION_CREATED', `mission:${missionId}:created`),
      });
      const pending = await repository.persistExecution({
        missionId,
        expectedMissionVersion: 1,
        phase,
        permissionProfile: 'SCOPED_WRITE',
        missionState: 'RECOVERING',
        nextAgentId: null,
        receipt: null,
        evidenceStatus: 'PENDING',
        handoff: null,
        events: [event(missionId, phaseId, 'PHASE_STARTED', `phase:${phaseId}:started`)],
      });
      expect(pending.mission).toMatchObject({ version: 2, currentPhaseId: phaseId });

      await database.query(
        `insert into "mcf_external_action_attempts" (
          "attempt_id", "mission_id", "phase_id", "agent_id", "skill_id",
          "adapter_id", "provider", "operation", "resource",
          "expected_mission_version", "status", "lease_expires_at"
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'UNKNOWN', $11)`,
        [
          attemptId,
          missionId,
          phaseId,
          'Gabriel',
          'MCF-DEPLOY-VALIDATE',
          'github-actions-staging-deploy-v1',
          'github',
          'deploy-staging',
          repositoryName,
          1,
          new Date(Date.now() + 10 * 60_000),
        ],
      );

      const advanced = await repository.persistExecution({
        missionId,
        expectedMissionVersion: 2,
        phase: newerPhase,
        permissionProfile: 'SCOPED_WRITE',
        missionState: 'EXECUTING',
        nextAgentId: 'Mestre',
        receipt: null,
        evidenceStatus: 'PENDING',
        handoff: null,
        events: [
          event(missionId, newerPhaseId, 'PHASE_STARTED', `phase:${newerPhaseId}:started`),
        ],
      });
      expect(advanced.mission).toMatchObject({
        version: 3,
        currentPhaseId: newerPhaseId,
        currentAgentId: 'Mestre',
      });

      const receipt = new EvidenceValidator().createTrustedReceipt({
        provider: 'github-actions',
        operation: 'deploy-staging',
        resource: repositoryName,
        externalId: '5252',
        commitSha: releaseSha,
        status: 'SUCCEEDED',
        observedAt: new Date().toISOString(),
        metadata: { deploymentOutcome: 'DEPLOYED' },
      });

      await expect(
        repository.completePendingPhase({
          missionId,
          phaseId,
          externalAttemptId: attemptId,
          receipt,
          evidenceStatus: 'VALID',
          missionState: 'EXECUTING',
          phaseState: 'COMPLETED',
          nextAgentId: 'Mestre',
          handoff: null,
          callbackIdempotencyKey: `staging-deploy:5252:${randomUUID()}`,
          events: [],
        }),
      ).rejects.toThrow(/version conflict/u);

      const preserved = await repository.findMission(missionId);
      const oldPhase = await repository.findPhase(missionId, phaseId);
      expect(preserved).toMatchObject({
        version: 3,
        currentPhaseId: newerPhaseId,
        currentAgentId: 'Mestre',
      });
      expect(oldPhase?.state).toBe('RECOVERING');

      const receipts = await database.query<{ count: string }>(
        `select count(*)::text as "count"
         from "mcf_tool_receipts"
         where "mission_id" = $1 and "phase_id" = $2`,
        [missionId, phaseId],
      );
      expect(receipts.rows[0]?.count).toBe('0');
    } finally {
      await database.query('delete from "mcf_missions" where "id" = $1', [missionId]);
    }
  });
});
