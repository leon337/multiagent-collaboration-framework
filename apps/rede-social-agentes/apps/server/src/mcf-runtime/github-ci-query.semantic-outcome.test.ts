import type { McfSkillDefinition, McfToolReceipt } from '@rsa/contracts';
import { beforeEach, describe, expect, it } from 'vitest';

import { EvidenceValidator } from './evidence-validator.js';
import { PermissionEngine } from './permission-engine.js';
import { SkillExecutor } from './skill-executor.js';
import type { SkillRegistryLoader } from './skill-registry.loader.js';

const repository = 'leon337/multiagent-collaboration-framework';
const commitSha = 'a'.repeat(40);
const missionId = '11111111-1111-4111-8111-111111111111';
const phaseId = '22222222-2222-4222-8222-222222222222';
const executionContext = { missionId, phaseId, expectedMissionVersion: 5 };

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
  process.env.MCF_RECEIPT_SECRET = 'test-only-mcf-receipt-secret-semantic-outcome-0001';
});

function createExecutor(): { evidence: EvidenceValidator; executor: SkillExecutor } {
  const registry = {
    load: async () => skill,
  } as unknown as SkillRegistryLoader;
  const evidence = new EvidenceValidator();
  return {
    evidence,
    executor: new SkillExecutor(registry, new PermissionEngine(), evidence),
  };
}

function providerObservation(conclusion: CiConclusion): {
  status: string;
  conclusion: string | null;
} {
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
  const workflowUrl = `https://github.com/${repository}/actions/runs/44`;
  const observation = providerObservation(conclusion);

  return evidence.createTrustedReceipt({
    provider: 'github-actions',
    operation: 'query-ci',
    resource: repository,
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
      expectedMissionVersion: 5,
      requestedSha: commitSha,
      verifiedSha: commitSha,
      repository,
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
          status: observation.status,
          conclusion: observation.conclusion,
          headSha: commitSha,
          url: workflowUrl,
        },
      ],
      jobs: [],
      checkSuites: [],
      checkRuns: [],
      evidenceUrls: [`https://github.com/${repository}/commit/${commitSha}`, workflowUrl],
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

async function execute(conclusion: CiConclusion) {
  const { evidence, executor } = createExecutor();
  const receipt = createReceipt(evidence, conclusion);
  const result = await executor.execute({
    skillId: skill.skillId,
    agentId: 'Renato',
    inputs: {
      acceptance_criteria: ['all_critical_tests_pass'],
      test_target: commitSha,
      repository,
    },
    tool: {
      provider: 'github-actions',
      operation: 'query-ci',
      resource: repository,
      externalReceipt: receipt,
    },
    executionContext,
  });
  return { receipt, result };
}

describe('MCF-RUN-TESTS semantic CI acceptance', () => {
  it('accepts SUCCESS as valid completed evidence', async () => {
    const { receipt, result } = await execute('SUCCESS');
    expect(receipt.status).toBe('SUCCEEDED');
    expect(result).toMatchObject({
      evidenceStatus: 'VALID',
      phaseState: 'COMPLETED',
      missionState: 'EXECUTING',
      handoffTo: 'Emily',
      rejectionReason: null,
    });
  });

  it.each(['FAILURE', 'CANCELLED'] as const)(
    'fails closed when the observed CI conclusion is %s',
    async (conclusion) => {
      const { receipt, result } = await execute(conclusion);
      expect(receipt.status).toBe('SUCCEEDED');
      expect(result).toMatchObject({
        evidenceStatus: 'INVALID',
        phaseState: 'RECOVERING',
        missionState: 'RECOVERING',
        handoffTo: null,
      });
      expect(result.rejectionReason).toMatch(new RegExp(`CI conclusion ${conclusion}`, 'u'));
    },
  );

  it('keeps IN_PROGRESS pending without validating or rejecting the observation', async () => {
    const { receipt, result } = await execute('IN_PROGRESS');
    expect(receipt.status).toBe('SUCCEEDED');
    expect(result).toMatchObject({
      evidenceStatus: 'PENDING',
      phaseState: 'WAITING_EVIDENCE',
      missionState: 'WAITING_EXTERNAL',
      handoffTo: null,
      rejectionReason: null,
    });
  });
});
