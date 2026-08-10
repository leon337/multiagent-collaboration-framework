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

describe('PostgresMcfRuntimeRepository pending staging completion', () => {
  let database: DatabaseService;
  let repository: PostgresMcfRuntimeRepository;

  beforeAll(() => {
    database = new DatabaseService();
    repository = new PostgresMcfRuntimeRepository(database);
  });

  afterAll(async () => {
    await database.onModuleDestroy();
  });

  it('atomically releases UNKNOWN reservation and reuses the persisted receipt on replay', async () => {
    const missionId = randomUUID();
    const phaseId = randomUUID();
    const attemptId = randomUUID();
    const callbackKey = `staging-deploy:4242:${randomUUID()}`;
    const now = new Date();
    const mission: McfMissionRecord = {
      id: missionId,
      contract: {
        title: 'Gate D pending completion integration',
        objective: 'Complete a reconciled staging UNKNOWN attempt atomically.',
        expectedOutcome: 'Reservation is released and one durable receipt remains.',
        scope: ['staging'],
        outOfScope: ['production'],
        acceptanceCriteria: ['atomic reservation release', 'durable receipt reuse'],
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
      expect(pending.mission.version).toBe(2);

      const leaseExpiresAt = new Date(Date.now() + 10 * 60_000);
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
          leaseExpiresAt,
        ],
      );
      await database.query(
        `update "mcf_missions"
         set "active_external_attempt_id" = $1
         where "id" = $2`,
        [attemptId, missionId],
      );

      const evidence = new EvidenceValidator();
      const firstReceipt = evidence.createTrustedReceipt({
        provider: 'github-actions',
        operation: 'deploy-staging',
        resource: repositoryName,
        externalId: '4242',
        commitSha: releaseSha,
        status: 'SUCCEEDED',
        observedAt: new Date().toISOString(),
        metadata: { deploymentOutcome: 'DEPLOYED' },
      });
      const first = await repository.completePendingPhase({
        missionId,
        phaseId,
        externalAttemptId: attemptId,
        receipt: firstReceipt,
        evidenceStatus: 'VALID',
        missionState: 'EXECUTING',
        phaseState: 'COMPLETED',
        nextAgentId: 'Mestre',
        handoff: null,
        callbackIdempotencyKey: callbackKey,
        events: [event(missionId, phaseId, 'CI_CALLBACK_RECEIVED', callbackKey)],
      });

      expect(first).toMatchObject({
        duplicate: false,
        receiptId: firstReceipt.receiptId,
        evidenceStatus: 'VALID',
        mission: { state: 'EXECUTING', currentAgentId: 'Mestre' },
        phase: { state: 'COMPLETED' },
      });
      const reservation = await database.query<{ activeExternalAttemptId: string | null }>(
        `select "active_external_attempt_id" as "activeExternalAttemptId"
         from "mcf_missions"
         where "id" = $1`,
        [missionId],
      );
      expect(reservation.rows[0]?.activeExternalAttemptId).toBeNull();

      const replayReceipt = evidence.createTrustedReceipt({
        provider: 'github-actions',
        operation: 'deploy-staging',
        resource: repositoryName,
        externalId: '4242',
        commitSha: releaseSha,
        status: 'SUCCEEDED',
        observedAt: new Date().toISOString(),
        metadata: { deploymentOutcome: 'DEPLOYED', replay: true },
      });
      expect(replayReceipt.receiptId).not.toBe(firstReceipt.receiptId);

      const replay = await repository.completePendingPhase({
        missionId,
        phaseId,
        externalAttemptId: attemptId,
        receipt: replayReceipt,
        evidenceStatus: 'VALID',
        missionState: 'EXECUTING',
        phaseState: 'COMPLETED',
        nextAgentId: 'Mestre',
        handoff: null,
        callbackIdempotencyKey: callbackKey,
        events: [],
      });
      expect(replay).toMatchObject({
        duplicate: true,
        receiptId: firstReceipt.receiptId,
        evidenceStatus: 'VALID',
      });

      const receipts = await database.query<{ receiptId: string }>(
        `select "receipt_id" as "receiptId"
         from "mcf_tool_receipts"
         where "mission_id" = $1 and "phase_id" = $2`,
        [missionId, phaseId],
      );
      expect(receipts.rows).toEqual([{ receiptId: firstReceipt.receiptId }]);
    } finally {
      await database.query('delete from "mcf_missions" where "id" = $1', [missionId]);
    }
  });
});
