import { randomUUID } from 'node:crypto';

import type { McfSkillDefinition } from '@rsa/contracts';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { DatabaseService } from '../database.service.js';
import { EvidenceValidator } from './evidence-validator.js';
import { McfMissionVersionConflictError } from './mcf-runtime.errors.js';
import type {
  McfEventInput,
  McfMissionRecord,
  McfPhaseRecord,
  McfRuntimeRepository,
} from './mcf-runtime.repository.js';
import { MissionRuntimeService } from './mission-runtime.service.js';
import { OrderedMcfRuntimeRepository } from './ordered-mcf-runtime.repository.js';
import { PermissionEngine } from './permission-engine.js';
import { PostgresMcfRuntimeRepository } from './postgres-mcf-runtime.repository.js';
import { SkillExecutor } from './skill-executor.js';
import type { SkillRegistryLoader } from './skill-registry.loader.js';

const ciRepository = 'leon337/multiagent-collaboration-framework';
const ciCommitSha = 'a'.repeat(40);

const ciSkill: McfSkillDefinition = {
  skillId: 'MCF-RUN-TESTS',
  name: 'Executar validação e testes',
  version: '1.0.0',
  purpose: 'Consultar e validar CI sem fabricar sucesso.',
  ownerAgents: ['Renato'],
  requiredInputs: ['acceptance_criteria', 'test_target'],
  allowedTools: ['GitHub'],
  forbiddenTools: ['fabricated_pass'],
  permissionProfile: 'SCOPED_WRITE',
  executionSteps: ['consultar_ci', 'coletar_evidencia'],
  requiredEvidence: ['commands_or_workflows', 'passed', 'failed', 'logs'],
  acceptanceCriteria: ['all_critical_tests_pass'],
  failureModes: ['environment_unavailable'],
  fallback: 'Registrar bloqueio verificável.',
  handoffTo: 'Emily',
};

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
  let repository: McfRuntimeRepository;

  beforeAll(() => {
    database = new DatabaseService();
    const postgresRepository = new PostgresMcfRuntimeRepository(database);
    repository = new OrderedMcfRuntimeRepository(database, postgresRepository);
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
      const storedReceipt = await database.query<{ count: number }>(
        'select count(*)::int as "count" from "mcf_tool_receipts" where "receipt_id" = $1',
        [receipt.receiptId],
      );
      expect(storedReceipt.rows[0]?.count).toBe(1);

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

  it('persists one valid query-ci receipt across concurrent consumption and later replay', async () => {
    const registry = {
      load: async () => ciSkill,
    } as unknown as SkillRegistryLoader;
    const evidence = new EvidenceValidator();
    const executor = new SkillExecutor(registry, new PermissionEngine(), evidence);
    const runtime = new MissionRuntimeService(repository, executor, registry, evidence);
    const mission = await runtime.createMission({
      contract: {
        title: 'Concurrent external receipt integration',
        objective: 'Persist the same signed query-ci receipt at most once.',
        expectedOutcome: 'One valid receipt, one completed phase and one mission version advance.',
        scope: ['runtime', 'receipt-ledger'],
        outOfScope: ['external writes'],
        acceptanceCriteria: ['duplicate receipt consumption is never valid twice'],
        riskClass: 'B',
        selectedAgents: ['Renato', 'Emily'],
        selectedSkills: [ciSkill.skillId],
        sourceOfTruth: ['skills/registry.yaml'],
      },
    });
    const missionId = mission.id;
    const phaseId = randomUUID();
    const workflowRunId = '44';
    const workflowUrl = `https://github.com/${ciRepository}/actions/runs/${workflowRunId}`;
    const receipt = evidence.createTrustedReceipt({
      provider: 'github-actions',
      operation: 'query-ci',
      resource: ciRepository,
      externalId: workflowRunId,
      commitSha: ciCommitSha,
      status: 'SUCCEEDED',
      observedAt: new Date().toISOString(),
      metadata: {
        adapterId: 'github-ci-query-read-only-v1',
        skillId: ciSkill.skillId,
        skillVersion: ciSkill.version,
        agentId: 'Renato',
        missionId,
        phaseId,
        expectedMissionVersion: mission.version,
        requestedSha: ciCommitSha,
        verifiedSha: ciCommitSha,
        repository: ciRepository,
        workflowFilter: null,
        readOnly: true,
        conclusion: 'SUCCESS',
        workflowRunCount: 1,
        jobCount: 0,
        checkSuiteCount: 0,
        checkRunCount: 0,
        workflowRuns: [
          {
            id: workflowRunId,
            name: 'Foundation',
            path: '.github/workflows/foundation.yml',
            status: 'completed',
            conclusion: 'success',
            headSha: ciCommitSha,
            url: workflowUrl,
          },
        ],
        jobs: [],
        checkSuites: [],
        checkRuns: [],
        evidenceUrls: [`https://github.com/${ciRepository}/commit/${ciCommitSha}`, workflowUrl],
        requiredPermissions: ['metadata:read', 'contents:read', 'actions:read', 'checks:read'],
        queryBudget: {
          apiRequestCount: 5,
          jobCount: 0,
          stepCount: 0,
          checkSuiteCount: 0,
          checkRunCount: 0,
          limits: {
            apiRequests: 250,
            jobs: 5_000,
            steps: 20_000,
            checkSuites: 1_000,
            checkRuns: 1_000,
            evidenceUrls: 7_000,
          },
        },
      },
    });
    const request = {
      phaseId,
      skillId: ciSkill.skillId,
      agentId: 'Renato',
      inputs: {
        acceptance_criteria: ['all_critical_tests_pass'],
        test_target: ciCommitSha,
        repository: ciRepository,
      },
      tool: {
        provider: 'github-actions',
        operation: 'query-ci',
        resource: ciRepository,
        externalReceipt: receipt,
      },
      expectedMissionVersion: mission.version,
    };

    const persistExecution = repository.persistExecution.bind(repository);
    let persistCallCount = 0;
    let releasePersistBarrier: () => void = () => undefined;
    let rejectPersistBarrier: (reason: Error) => void = () => undefined;
    const bothExecutionsAtPersistence = new Promise<void>((resolve, reject) => {
      releasePersistBarrier = resolve;
      rejectPersistBarrier = reject;
    });
    const persistBarrierTimeout = setTimeout(
      () => rejectPersistBarrier(new Error('both executions did not reach persistExecution')),
      5_000,
    );
    const persistSpy = vi
      .spyOn(repository, 'persistExecution')
      .mockImplementation(async (input) => {
        persistCallCount += 1;
        if (persistCallCount === 2) {
          clearTimeout(persistBarrierTimeout);
          releasePersistBarrier();
        }
        await bothExecutionsAtPersistence;
        return persistExecution(input);
      });

    try {
      const attempts = await Promise.allSettled([
        runtime.executePhase(missionId, request),
        runtime.executePhase(missionId, request),
      ]);
      const fulfilled = attempts.filter(
        (
          attempt,
        ): attempt is PromiseFulfilledResult<Awaited<ReturnType<typeof runtime.executePhase>>> =>
          attempt.status === 'fulfilled',
      );
      const rejected = attempts.filter(
        (attempt): attempt is PromiseRejectedResult => attempt.status === 'rejected',
      );

      // Both consumers crossed signature/domain validation and reached persistExecution. The
      // mission-version CAS is the earliest unavoidable repository barrier, so the losing
      // transaction must stop before a second receipt insert instead of yielding VALID again.
      expect(persistCallCount).toBe(2);
      expect(fulfilled).toHaveLength(1);
      expect(fulfilled[0]?.value).toMatchObject({
        evidenceStatus: 'VALID',
        phaseState: 'COMPLETED',
        mission: { version: mission.version + 1, state: 'EXECUTING' },
        receipt: { receiptId: receipt.receiptId },
      });
      expect(rejected).toHaveLength(1);
      expect(rejected[0]?.reason).toBeInstanceOf(McfMissionVersionConflictError);

      await expect(runtime.executePhase(missionId, request)).rejects.toBeInstanceOf(
        McfMissionVersionConflictError,
      );
      expect(persistCallCount).toBe(3);

      const storedReceipts = await database.query<{
        receiptId: string;
        validationStatus: string;
      }>(
        `select "receipt_id" as "receiptId", "validation_status" as "validationStatus"
         from "mcf_tool_receipts"
         where "receipt_id" = $1`,
        [receipt.receiptId],
      );
      expect(storedReceipts.rows).toEqual([
        { receiptId: receipt.receiptId, validationStatus: 'VALID' },
      ]);

      const persistedMission = await repository.findMission(missionId);
      expect(persistedMission).toMatchObject({
        id: missionId,
        currentPhaseId: phaseId,
        currentAgentId: 'Emily',
        state: 'EXECUTING',
        version: mission.version + 1,
      });
      expect(await repository.findPhase(missionId, phaseId)).toMatchObject({
        state: 'COMPLETED',
      });

      const events = await repository.listEvents(missionId);
      expect(events.filter((entry) => entry.eventType === 'EVIDENCE_VALIDATED')).toHaveLength(1);
      expect(events.filter((entry) => entry.eventType === 'PHASE_COMPLETED')).toHaveLength(1);
      expect(events.filter((entry) => entry.eventType === 'TOOL_RECEIPT_RECORDED')).toHaveLength(1);
    } finally {
      clearTimeout(persistBarrierTimeout);
      releasePersistBarrier();
      persistSpy.mockRestore();
      await database.query('delete from "mcf_missions" where "id" = $1', [missionId]);
    }
  });
});
