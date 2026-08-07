import type { McfSkillDefinition, McfToolReceipt } from '@rsa/contracts';
import { beforeEach, describe, expect, it } from 'vitest';

import { EvidenceValidator } from './evidence-validator.js';
import { PermissionEngine } from './permission-engine.js';
import { SkillExecutor } from './skill-executor.js';
import type { SkillRegistryLoader } from './skill-registry.loader.js';

const repository = 'leon337/multiagent-collaboration-framework';
const otherRepository = 'leon337/other-repository';
const commitSha = 'a'.repeat(40);
const otherSha = 'b'.repeat(40);

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

type ReceiptMutation = (metadata: Record<string, unknown>) => void;

beforeEach(() => {
  process.env.DATABASE_URL = 'postgresql://rsa:rsa@127.0.0.1:5432/rsa';
  process.env.MCF_RECEIPT_SECRET = 'test-only-mcf-receipt-secret-external-context-0001';
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

function createReceipt(
  evidence: EvidenceValidator,
  input: {
    workflowFilter?: string | null | undefined;
    mutate?: ReceiptMutation | undefined;
  } = {},
): McfToolReceipt {
  const workflowUrl = `https://github.com/${repository}/actions/runs/44`;
  const jobUrl = `${workflowUrl}/job/55`;
  const checkUrl = `https://github.com/${repository}/runs/66`;
  const metadata: Record<string, unknown> = {
    adapterId: 'github-ci-query-read-only-v1',
    requestedSha: commitSha,
    verifiedSha: commitSha,
    repository,
    workflowFilter: input.workflowFilter ?? null,
    readOnly: true,
    conclusion: 'SUCCESS',
    workflowRunCount: 1,
    jobCount: 1,
    checkRunCount: 1,
    workflowRuns: [
      {
        id: '44',
        name: 'Foundation',
        path: '.github/workflows/foundation.yml',
        status: 'completed',
        conclusion: 'success',
        headSha: commitSha,
        url: workflowUrl,
      },
    ],
    jobs: [
      {
        id: '55',
        workflowRunId: '44',
        name: 'foundation',
        status: 'completed',
        conclusion: 'success',
        url: jobUrl,
      },
    ],
    checkRuns: [
      {
        id: '66',
        name: 'foundation',
        status: 'completed',
        conclusion: 'success',
        url: checkUrl,
      },
    ],
    evidenceUrls: [
      `https://github.com/${repository}/commit/${commitSha}`,
      workflowUrl,
      jobUrl,
      checkUrl,
    ],
    requiredPermissions: ['metadata:read', 'contents:read', 'actions:read', 'checks:read'],
  };
  if (input.workflowFilter === undefined && Object.hasOwn(input, 'workflowFilter')) {
    delete metadata.workflowFilter;
  }
  input.mutate?.(metadata);

  return evidence.createTrustedReceipt({
    provider: 'github-actions',
    operation: 'query-ci',
    resource: repository,
    externalId: '44',
    commitSha,
    status: 'SUCCEEDED',
    observedAt: new Date().toISOString(),
    metadata,
  });
}

async function executeReceipt(
  executor: SkillExecutor,
  receipt: McfToolReceipt,
  inputs: Record<string, unknown> = {},
) {
  return executor.execute({
    skillId: skill.skillId,
    agentId: 'Renato',
    inputs: {
      acceptance_criteria: ['all_critical_tests_pass'],
      test_target: commitSha,
      repository,
      ...inputs,
    },
    tool: {
      provider: 'github-actions',
      operation: 'query-ci',
      resource: repository,
      externalReceipt: receipt,
    },
  });
}

async function expectRejected(
  executor: SkillExecutor,
  receipt: McfToolReceipt,
  inputs: Record<string, unknown>,
  message: RegExp,
): Promise<void> {
  const result = await executeReceipt(executor, receipt, inputs);
  expect(result).toMatchObject({
    evidenceStatus: 'INVALID',
    phaseState: 'RECOVERING',
    missionState: 'RECOVERING',
    externalAction: { status: 'EXTERNAL_RECEIPT' },
  });
  expect(result.rejectionReason).toMatch(message);
}

describe('GitHub CI external receipt execution binding', () => {
  it.each([
    ['a different exact SHA', otherSha],
    ['a branch name', 'main'],
    ['a short SHA', commitSha.slice(0, 12)],
    ['a whitespace-padded SHA', ` ${commitSha} `],
  ])('rejects a valid receipt reused with %s', async (_label, testTarget) => {
    const { evidence, executor } = createExecutor();
    await expectRejected(
      executor,
      createReceipt(evidence),
      { test_target: testTarget },
      /current exact test_target/u,
    );
  });

  it('rejects a receipt whose repository differs from the current input', async () => {
    const { evidence, executor } = createExecutor();
    await expectRejected(
      executor,
      createReceipt(evidence),
      { repository: otherRepository },
      /current repository input/u,
    );
  });

  it('rejects workflow-filter substitution and a receipt filter with no current workflow', async () => {
    const first = createExecutor();
    await expectRejected(
      first.executor,
      createReceipt(first.evidence, { workflowFilter: 'foundation.yml' }),
      { workflow: 'other.yml' },
      /workflowFilter must match/u,
    );

    const second = createExecutor();
    await expectRejected(
      second.executor,
      createReceipt(second.evidence, { workflowFilter: 'foundation.yml' }),
      {},
      /workflowFilter must match/u,
    );
  });

  it.each([null, undefined])(
    'accepts an exact current context when an absent workflow is represented by %s',
    async (workflowFilter) => {
      const { evidence, executor } = createExecutor();
      const result = await executeReceipt(executor, createReceipt(evidence, { workflowFilter }), {
        test_target: commitSha.toUpperCase(),
      });
      expect(result).toMatchObject({
        evidenceStatus: 'VALID',
        phaseState: 'COMPLETED',
        missionState: 'EXECUTING',
        handoffTo: 'Emily',
      });
    },
  );

  it('rejects evidence URLs that use a sibling repository prefix', async () => {
    const { evidence, executor } = createExecutor();
    const receipt = createReceipt(evidence, {
      mutate: (metadata) => {
        const runs = metadata.workflowRuns as Array<Record<string, unknown>>;
        const siblingUrl = `https://github.com/${repository}-evil/actions/runs/44`;
        runs[0] = { ...runs[0], url: siblingUrl };
        metadata.evidenceUrls = [
          `https://github.com/${repository}/commit/${commitSha}`,
          siblingUrl,
        ];
      },
    });
    await expectRejected(executor, receipt, {}, /invalid evidence URL/u);
  });

  it.each([
    ['an explicit default port', `https://github.com:443/${repository}/commit/${commitSha}`],
    ['an empty query delimiter', `https://github.com/${repository}/commit/${commitSha}?`],
    ['an empty fragment delimiter', `https://github.com/${repository}/commit/${commitSha}#`],
    ['surrounding whitespace', ` https://github.com/${repository}/commit/${commitSha}`],
  ])('rejects a non-canonical commit URL with %s', async (_label, invalidUrl) => {
    const { evidence, executor } = createExecutor();
    const receipt = createReceipt(evidence, {
      mutate: (metadata) => {
        const urls = metadata.evidenceUrls as string[];
        urls[0] = invalidUrl;
      },
    });
    await expectRejected(executor, receipt, {}, /invalid evidence URL/u);
  });

  it.each([
    [
      'commit',
      (metadata: Record<string, unknown>) => {
        const urls = metadata.evidenceUrls as string[];
        urls[0] = `https://github.com/${repository}/tree/${commitSha}`;
      },
      /exact commit URL/u,
    ],
    [
      'workflow run',
      (metadata: Record<string, unknown>) => {
        const runs = metadata.workflowRuns as Array<Record<string, unknown>>;
        const urls = metadata.evidenceUrls as string[];
        const invalid = `https://github.com/${repository}/actions/workflows/44`;
        runs[0] = { ...runs[0], url: invalid };
        urls[1] = invalid;
      },
      /workflow run requires a valid GitHub URL/u,
    ],
    [
      'workflow job',
      (metadata: Record<string, unknown>) => {
        const jobs = metadata.jobs as Array<Record<string, unknown>>;
        const urls = metadata.evidenceUrls as string[];
        const invalid = `https://github.com/${repository}/actions/runs/45/job/55`;
        jobs[0] = { ...jobs[0], url: invalid };
        urls[2] = invalid;
      },
      /workflow job requires a valid GitHub URL/u,
    ],
    [
      'check run',
      (metadata: Record<string, unknown>) => {
        const checks = metadata.checkRuns as Array<Record<string, unknown>>;
        const urls = metadata.evidenceUrls as string[];
        const invalid = `https://github.com/${repository}/checks/runs/66`;
        checks[0] = { ...checks[0], url: invalid };
        urls[3] = invalid;
      },
      /check run requires a valid GitHub URL/u,
    ],
  ] as const)('rejects a malformed %s evidence URL', async (_label, mutate, message) => {
    const { evidence, executor } = createExecutor();
    await expectRejected(executor, createReceipt(evidence, { mutate }), {}, message);
  });

  it('requires contents:read without permitting any write scope', async () => {
    const { evidence, executor } = createExecutor();
    const receipt = createReceipt(evidence, {
      mutate: (metadata) => {
        metadata.requiredPermissions = ['metadata:read', 'actions:read', 'checks:read'];
      },
    });
    await expectRejected(executor, receipt, {}, /read-only permission metadata/u);

    const withWriteScope = createExecutor();
    const writeReceipt = createReceipt(withWriteScope.evidence, {
      mutate: (metadata) => {
        metadata.requiredPermissions = [
          'metadata:read',
          'contents:read',
          'actions:read',
          'checks:read',
          'contents:write',
        ];
      },
    });
    await expectRejected(
      withWriteScope.executor,
      writeReceipt,
      {},
      /read-only permission metadata/u,
    );

    const withSparsePermissions = createExecutor();
    const sparseReceipt = createReceipt(withSparsePermissions.evidence, {
      mutate: (metadata) => {
        const sparsePermissions = new Array<string>(4);
        sparsePermissions[1] = 'metadata:read';
        sparsePermissions[2] = 'actions:read';
        sparsePermissions[3] = 'checks:read';
        metadata.requiredPermissions = sparsePermissions;
      },
    });
    await expectRejected(
      withSparsePermissions.executor,
      sparseReceipt,
      {},
      /read-only permission metadata/u,
    );
  });

  it('requires current execution inputs for direct query-ci receipt validation', () => {
    const { evidence } = createExecutor();
    const receipt = createReceipt(evidence);

    expect(() =>
      evidence.verifyForSkill(
        receipt,
        { provider: 'github-actions', operation: 'query-ci', resource: repository },
        skill,
      ),
    ).toThrow(/current execution inputs/u);
  });
});
