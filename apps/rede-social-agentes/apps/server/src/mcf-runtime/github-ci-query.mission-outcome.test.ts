import type { McfSkillDefinition, McfToolReceipt } from '@rsa/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EvidenceValidator } from './evidence-validator.js';
import type { ExternalActionDispatcher } from './external-action-dispatcher.js';
import type {
  McfMissionRecord,
  McfRuntimeRepository,
  PersistMcfExecutionInput,
} from './mcf-runtime.repository.js';
import { MissionRuntimeService } from './mission-runtime.service.js';
import { PermissionEngine } from './permission-engine.js';
import { SkillExecutor } from './skill-executor.js';
import type { SkillRegistryLoader } from './skill-registry.loader.js';

const repositoryName = 'leon337/multiagent-collaboration-framework';
const commitSha = 'a'.repeat(40);
const missionId = '11111111-1111-4111-8111-111111111111';
const phaseId = '22222222-2222-4222-8222-222222222222';
const missionVersion = 5;

const skill: McfSkillDefinition = {
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

type CiConclusion = 'SUCCESS' | 'FAILURE' | 'CANCELLED' | 'IN_PROGRESS';

beforeEach(() => {
  process.env.DATABASE_URL = 'postgresql://rsa:rsa@127.0.0.1:5432/rsa';
  process.env.MCF_RECEIPT_SECRET = 'test-only-mcf-receipt-secret-mission-outcome-0001';
});

function observation(conclusion: CiConclusion): { status: string; conclusion: string | null } {
  switch (conclusion) {
    case 'SUCCESS':
      return { status: 'completed', conclusion: 'success' };
    case 'FAILURE':
      return { status: 'completed', conclusion: 'failure' };
    case 'CANCELLED':
      return { status: 'completed', conclusion: 'cancelled' };
    case 'IN_PROGRESS':
      return { status: 'in_progress', conclusion: null };
  }
}

function createReceipt(evidence: EvidenceValidator, conclusion: CiConclusion): McfToolReceipt {
  const workflowUrl = `https://github.com/${repositoryName}/actions/runs/44`;
  const observed = observation(conclusion);
  return evidence.createTrustedReceipt({
    provider: 'github-actions',
    operation: 'query-ci',
    resource: repositoryName,
    externalId: '44',
    commitSha,
    status: 'SUCCEEDED',
    observedAt: new Date().toISOString(),
    metadata: {
      adapterId: 'github-ci-query-read-only-v1',
      skillId: skill.skillId,
      skillVersion: skill.version,
      agentId: 'Renato',
      missionId,
      phaseId,
      expectedMissionVersion: missionVersion,
      requestedSha: commitSha,
      verifiedSha: commitSha,
      repository: repositoryName,
      workflowFilter: null,
      readOnly: true,
      conclusion,
      workflowRunCount: 1,
      jobCount: 0,
      checkSuiteCount: 0,
      checkRunCount: 0,
      workflowRuns: [
        {
          id: '44',
          name: 'Foundation',
          path: '.github/workflows/foundation.yml',
          status: observed.status,
          conclusion: observed.conclusion,
          headSha: commitSha,
          url: workflowUrl,
        },
      ],
      jobs: [],
      checkSuites: [],
      checkRuns: [],
      evidenceUrls: [`https://github.com/${repositoryName}/commit/${commitSha}`, workflowUrl],
      requiredPermissions: ['metadata:read', 'contents:read', 'actions:read', 'checks:read'],
      queryBudget: {
        apiRequestCount: 2,
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
}

function createMission(): McfMissionRecord {
  const now = new Date();
  return {
    id: missionId,
    contract: {
      title: 'CI semantic outcome',
      objective: 'Only successful CI may satisfy MCF-RUN-TESTS.',
      expectedOutcome: 'Failure, cancellation and in-progress states never false-complete.',
      scope: ['runtime', 'ci'],
      outOfScope: ['external writes'],
      acceptanceCriteria: ['all_critical_tests_pass'],
      riskClass: 'B',
      selectedAgents: ['Renato', 'Emily'],
      selectedSkills: [skill.skillId],
      sourceOfTruth: ['skills/registry.yaml'],
    },
    state: 'PLANNED',
    currentPhaseId: null,
    currentAgentId: null,
    version: missionVersion,
    createdAt: now,
    updatedAt: now,
  };
}

function createRepository(): {
  repository: McfRuntimeRepository;
  persisted: () => PersistMcfExecutionInput;
} {
  const mission = createMission();
  let captured: PersistMcfExecutionInput | null = null;
  const repository: McfRuntimeRepository = {
    createMission: async (input) => input.mission,
    findMission: async (id) => (id === missionId ? mission : null),
    findPhase: async () => null,
    persistExecution: async (input) => {
      captured = input;
      return {
        mission: {
          ...mission,
          state: input.missionState,
          currentPhaseId: input.phase.id,
          currentAgentId: input.nextAgentId,
          version: mission.version + 1,
          updatedAt: input.phase.updatedAt,
        },
        phase: input.phase,
      };
    },
    completePendingPhase: async () => {
      throw new Error('not used in semantic outcome tests');
    },
    listEvents: async () => [],
  };
  return {
    repository,
    persisted: () => {
      if (!captured) throw new Error('expected persistExecution to be called');
      return captured;
    },
  };
}

async function execute(conclusion: CiConclusion, viaDispatcher = false) {
  const evidence = new EvidenceValidator();
  const receipt = createReceipt(evidence, conclusion);
  const registry = { load: async () => skill } as unknown as SkillRegistryLoader;
  const recordEvidenceValidated = vi.fn(async () => undefined);
  const recordEvidenceRejected = vi.fn(async () => undefined);
  const dispatcher = {
    dispatch: vi.fn(async () => ({
      status: 'EXECUTED' as const,
      adapterId: 'github-ci-query-read-only-v1',
      attemptId: 'attempt-1',
      receipt,
    })),
    recordEvidenceValidated,
    recordEvidenceRejected,
  } as unknown as ExternalActionDispatcher;
  const executor = new SkillExecutor(
    registry,
    new PermissionEngine(),
    evidence,
    viaDispatcher ? dispatcher : undefined,
  );
  const fake = createRepository();
  const runtime = new MissionRuntimeService(fake.repository, executor, registry, evidence);

  const response = await runtime.executePhase(missionId, {
    phaseId,
    skillId: skill.skillId,
    agentId: 'Renato',
    expectedMissionVersion: missionVersion,
    inputs: {
      acceptance_criteria: ['all_critical_tests_pass'],
      test_target: commitSha,
      repository: repositoryName,
    },
    tool: {
      provider: 'github-actions',
      operation: 'query-ci',
      resource: repositoryName,
      ...(viaDispatcher ? {} : { externalReceipt: receipt }),
    },
  });

  return {
    response,
    persisted: fake.persisted(),
    recordEvidenceValidated,
    recordEvidenceRejected,
  };
}

function eventTypes(input: PersistMcfExecutionInput): string[] {
  return input.events.map((item) => item.eventType);
}

describe('MissionRuntime CI semantic outcome events', () => {
  it('emits validation and completion only for SUCCESS', async () => {
    const { response, persisted } = await execute('SUCCESS');
    expect(response).toMatchObject({ evidenceStatus: 'VALID', phaseState: 'COMPLETED' });
    expect(eventTypes(persisted)).toContain('EVIDENCE_VALIDATED');
    expect(eventTypes(persisted)).toContain('PHASE_COMPLETED');
  });

  it.each(['FAILURE', 'CANCELLED'] as const)(
    'rejects %s without false validation or phase completion',
    async (conclusion) => {
      const { response, persisted } = await execute(conclusion);
      expect(response).toMatchObject({ evidenceStatus: 'INVALID', phaseState: 'RECOVERING' });
      expect(eventTypes(persisted)).toContain('EVIDENCE_REJECTED');
      expect(eventTypes(persisted)).toContain('RECOVERY_STARTED');
      expect(eventTypes(persisted)).not.toContain('EVIDENCE_VALIDATED');
      expect(eventTypes(persisted)).not.toContain('PHASE_COMPLETED');
    },
  );

  it('keeps IN_PROGRESS pending without validation, rejection, recovery or completion events', async () => {
    const { response, persisted } = await execute('IN_PROGRESS');
    expect(response).toMatchObject({ evidenceStatus: 'PENDING', phaseState: 'WAITING_EVIDENCE' });
    expect(persisted.missionState).toBe('WAITING_EXTERNAL');
    expect(eventTypes(persisted)).not.toContain('EVIDENCE_VALIDATED');
    expect(eventTypes(persisted)).not.toContain('EVIDENCE_REJECTED');
    expect(eventTypes(persisted)).not.toContain('RECOVERY_STARTED');
    expect(eventTypes(persisted)).not.toContain('PHASE_COMPLETED');
  });

  it('keeps dispatcher IN_PROGRESS pending and does not mark external evidence validated or rejected', async () => {
    const { response, persisted, recordEvidenceValidated, recordEvidenceRejected } = await execute(
      'IN_PROGRESS',
      true,
    );
    expect(response).toMatchObject({ evidenceStatus: 'PENDING', phaseState: 'WAITING_EVIDENCE' });
    expect(persisted.externalAttemptId).toBe('attempt-1');
    expect(recordEvidenceValidated).not.toHaveBeenCalled();
    expect(recordEvidenceRejected).not.toHaveBeenCalled();
    expect(eventTypes(persisted)).not.toContain('EVIDENCE_VALIDATED');
    expect(eventTypes(persisted)).not.toContain('EVIDENCE_REJECTED');
    expect(eventTypes(persisted)).not.toContain('PHASE_COMPLETED');
  });
});
