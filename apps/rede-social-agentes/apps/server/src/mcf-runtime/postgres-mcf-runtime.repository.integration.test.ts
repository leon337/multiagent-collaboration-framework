import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DatabaseService } from '../database.service.js';
import { EvidenceValidator } from './evidence-validator.js';
import { McfMissionVersionConflictError } from './mcf-runtime.errors.js';
import type { McfEventInput, McfMissionRecord, McfPhaseRecord } from './mcf-runtime.repository.js';
import { PostgresMcfRuntimeRepository } from './postgres-mcf-runtime.repository.js';

function missionEvent(
  missionId: string,
  eventType: McfEventInput['eventType'],
  idempotencyKey: string,
  phaseId: string | null = null,
): McfEventInput {
  return {
    id: randomUUID(),
    missionId,
    phaseId,
    agentId: phaseId ? 'Renato' : null,
    eventType,
    payload: { test: true },
    idempotencyKey,
    occurredAt: new Date(),
  };
}

describe('PostgresMcfRuntimeRepository integration', () => {
  let database: DatabaseService;
  let repository: PostgresMcfRuntimeRepository;

  beforeAll(() => {
    database = new DatabaseService();
    repository = new PostgresMcfRuntimeRepository(database);
  });

  afterAll(async () => {
    await database.onModuleDestroy();
  });

  it('persists and resumes a mission with optimistic locking and idempotent CI completion', async () => {
    const missionId = randomUUID();
    const phaseId = randomUUID();
    const now = new Date();
    const mission: McfMissionRecord = {
      id: missionId,
      contract: {
        title: 'Persistent runtime integration',
        objective: 'Prove persisted mission state and callback idempotency.',
        expectedOutcome: 'Mission resumes and completes from PostgreSQL.',
        scope: ['runtime'],
        outOfScope: ['public deployment'],
        acceptanceCriteria: ['CI receipt is valid'],
        riskClass: 'B',
        selectedAgents: ['Renato', 'Emily'],
        selectedSkills: ['MCF-RUN-TESTS'],
        sourceOfTruth: ['skills/registry.yaml'],
      },
      state: 'PLANNED',
      currentPhaseId: null,
      currentAgentId: null,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const created = await repository.createMission({
        mission,
        event: missionEvent(missionId, 'MISSION_CREATED', `mission:${missionId}:created`),
      });
      expect(created).toMatchObject({ id: missionId, state: 'PLANNED', version: 1 });

      const resumed = await repository.findMission(missionId);
      expect(resumed).toMatchObject({ id: missionId, version: 1 });

      const phase: McfPhaseRecord = {
        id: phaseId,
        missionId,
        skillId: 'MCF-RUN-TESTS',
        agentId: 'Renato',
        state: 'WAITING_EVIDENCE',
        cycle: 1,
        inputs: { test_target: 'pull-request' },
        expectedEvidence: ['logs', 'workflow_run_id'],
        startedAt: now,
        completedAt: null,
        createdAt: now,
        updatedAt: now,
      };

      const pending = await repository.persistExecution({
        missionId,
        expectedMissionVersion: 1,
        phase,
        permissionProfile: 'SCOPED_WRITE',
        missionState: 'WAITING_EXTERNAL',
        nextAgentId: null,
        receipt: null,
        evidenceStatus: 'PENDING',
        handoff: null,
        events: [missionEvent(missionId, 'PHASE_STARTED', `phase:${phaseId}:started`, phaseId)],
      });
      expect(pending.mission).toMatchObject({
        id: missionId,
        state: 'WAITING_EXTERNAL',
        currentPhaseId: phaseId,
        version: 2,
      });
      expect(await repository.findPhase(missionId, phaseId)).toMatchObject({
        state: 'WAITING_EVIDENCE',
      });

      await expect(
        repository.persistExecution({
          missionId,
          expectedMissionVersion: 1,
          phase: { ...phase, id: randomUUID() },
          permissionProfile: 'SCOPED_WRITE',
          missionState: 'WAITING_EXTERNAL',
          nextAgentId: null,
          receipt: null,
          evidenceStatus: 'PENDING',
          handoff: null,
          events: [],
        }),
      ).rejects.toBeInstanceOf(McfMissionVersionConflictError);

      const evidence = new EvidenceValidator();
      const receipt = evidence.createTrustedReceipt({
        provider: 'github-actions',
        operation: 'workflow-result',
        resource: 'leon337/multiagent-collaboration-framework',
        externalId: 'workflow-run-integration',
        commitSha: 'a'.repeat(40),
        status: 'SUCCEEDED',
        observedAt: new Date().toISOString(),
        metadata: { conclusion: 'success' },
      });
      const callbackKey = `ci:${receipt.externalId}:success`;
      const completion = {
        missionId,
        phaseId,
        receipt,
        evidenceStatus: 'VALID' as const,
        missionState: 'COMPLETED' as const,
        phaseState: 'COMPLETED' as const,
        nextAgentId: 'Emily',
        handoff: {
          id: randomUUID(),
          fromAgentId: 'Renato',
          toAgentId: 'Emily',
          objectiveState: { missionState: 'COMPLETED' },
          delivered: ['workflow_run_id', 'commit_sha'],
          evidenceReceiptIds: [receipt.receiptId],
          openFindings: [],
          nextAction: 'Audit the validated CI receipt',
          acceptanceForNextAction: 'Receipt and ledger remain consistent',
          createdAt: new Date(),
        },
        callbackIdempotencyKey: callbackKey,
        events: [
          missionEvent(missionId, 'CI_CALLBACK_RECEIVED', callbackKey, phaseId),
          missionEvent(missionId, 'EVIDENCE_VALIDATED', `phase:${phaseId}:evidence-valid`, phaseId),
          missionEvent(missionId, 'PHASE_COMPLETED', `phase:${phaseId}:completed`, phaseId),
          missionEvent(missionId, 'MISSION_COMPLETED', `mission:${missionId}:completed`, phaseId),
        ],
      };

      const completed = await repository.completePendingPhase(completion);
      expect(completed).toMatchObject({
        duplicate: false,
        mission: { state: 'COMPLETED', version: 3, currentAgentId: 'Emily' },
        phase: { state: 'COMPLETED' },
      });

      const duplicate = await repository.completePendingPhase(completion);
      expect(duplicate).toMatchObject({
        duplicate: true,
        mission: { state: 'COMPLETED', version: 3 },
      });

      const events = await repository.listEvents(missionId);
      expect(events.map((entry) => entry.eventType)).toEqual([
        'MISSION_CREATED',
        'PHASE_STARTED',
        'CI_CALLBACK_RECEIVED',
        'EVIDENCE_VALIDATED',
        'PHASE_COMPLETED',
        'MISSION_COMPLETED',
      ]);
      expect(new Set(events.map((entry) => entry.idempotencyKey)).size).toBe(events.length);
    } finally {
      await database.query('delete from "mcf_missions" where "id" = $1', [missionId]);
    }
  });
});
