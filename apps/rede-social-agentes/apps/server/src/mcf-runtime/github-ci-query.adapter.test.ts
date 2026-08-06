import type { McfSkillDefinition, McfToolReceipt } from '@rsa/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdapterRegistry } from './adapter-registry.js';
import { EvidenceValidator } from './evidence-validator.js';
import { ExternalActionDispatcher } from './external-action-dispatcher.js';
import type { ExternalActionLedger } from './external-action-ledger.js';
import {
  GitHubCiQueryAdapter,
  GitHubCiReadClient,
} from './github-ci-query.adapter.js';
import { PermissionEngine } from './permission-engine.js';

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

const repository = 'leon337/multiagent-collaboration-framework';
const commitSha = 'a'.repeat(40);
const otherSha = 'b'.repeat(40);

beforeEach(() => {
  process.env.DATABASE_URL = 'postgresql://rsa:rsa@127.0.0.1:5432/rsa';
  process.env.MCF_RECEIPT_SECRET = 'test-only-mcf-receipt-secret-0000000001';
});

function request(inputs: Record<string, unknown> = {}) {
  return {
    skill,
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
    },
  };
}

function commitPayload(sha = commitSha) {
  return {
    sha,
    html_url: `https://github.com/${repository}/commit/${sha}`,
  };
}

function workflowRun(input: {
  id?: number;
  status?: string;
  conclusion?: string | null;
  headSha?: string;
  name?: string;
  path?: string;
} = {}) {
  const id = input.id ?? 44;
  return {
    id,
    name: input.name ?? 'CI',
    path: input.path ?? '.github/workflows/ci.yml',
    workflow_id: 12,
    run_number: id,
    event: 'pull_request',
    status: input.status ?? 'completed',
    conclusion: input.conclusion === undefined ? 'success' : input.conclusion,
    head_sha: input.headSha ?? commitSha,
    html_url: `https://github.com/${repository}/actions/runs/${id}`,
    created_at: '2026-08-06T11:00:00Z',
    updated_at: '2026-08-06T11:02:00Z',
  };
}

function workflowJob(input: {
  id?: number;
  status?: string;
  conclusion?: string | null;
  steps?: number;
} = {}) {
  const id = input.id ?? 55;
  const steps = input.steps ?? 1;
  return {
    id,
    name: `job-${id}`,
    status: input.status ?? 'completed',
    conclusion: input.conclusion === undefined ? 'success' : input.conclusion,
    html_url: `https://github.com/${repository}/actions/runs/44/job/${id}`,
    started_at: '2026-08-06T11:00:10Z',
    completed_at:
      (input.status ?? 'completed') === 'completed' ? '2026-08-06T11:01:50Z' : null,
    steps: Array.from({ length: steps }, (_, index) => ({
      number: index + 1,
      name: `step-${index + 1}`,
      status: input.status ?? 'completed',
      conclusion: input.conclusion === undefined ? 'success' : input.conclusion,
    })),
  };
}

function checkRun(input: {
  id?: number;
  status?: string;
  conclusion?: string | null;
} = {}) {
  const id = input.id ?? 66;
  return {
    id,
    name: `check-${id}`,
    status: input.status ?? 'completed',
    conclusion: input.conclusion === undefined ? 'success' : input.conclusion,
    html_url: `https://github.com/${repository}/runs/${id}`,
    started_at: '2026-08-06T11:00:10Z',
    completed_at:
      (input.status ?? 'completed') === 'completed' ? '2026-08-06T11:01:50Z' : null,
    app: { name: 'GitHub Actions' },
  };
}

function json(payload: unknown, status = 200, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(payload), {
    status,
    ...(headers ? { headers } : {}),
  });
}

function standardFetcher(input: {
  workflowRuns?: ReturnType<typeof workflowRun>[];
  jobs?: ReturnType<typeof workflowJob>[];
  checkRuns?: ReturnType<typeof checkRun>[];
  commit?: ReturnType<typeof commitPayload>;
} = {}) {
  const runs = input.workflowRuns ?? [workflowRun()];
  const jobs = input.jobs ?? [workflowJob()];
  const checks = input.checkRuns ?? [checkRun()];
  return vi.fn(async (url: string, init?: RequestInit) => {
    expect(init?.method).toBe('GET');
    if (url.endsWith(`/commits/${commitSha}`)) {
      return json(input.commit ?? commitPayload());
    }
    if (url.includes('/actions/runs?')) {
      return json({ total_count: runs.length, workflow_runs: runs });
    }
    if (url.includes('/actions/runs/44/jobs')) {
      return json({ total_count: jobs.length, jobs });
    }
    if (url.includes('/check-runs?')) {
      return json({ total_count: checks.length, check_runs: checks });
    }
    return json({}, 404);
  });
}

function adapterFrom(fetcher: ReturnType<typeof vi.fn>): GitHubCiQueryAdapter {
  return new GitHubCiQueryAdapter(
    new EvidenceValidator(),
    new GitHubCiReadClient(fetcher, undefined),
  );
}

function resign(
  evidence: EvidenceValidator,
  receipt: McfToolReceipt,
  metadata: Record<string, unknown>,
): McfToolReceipt {
  return evidence.createTrustedReceipt({
    provider: receipt.provider,
    operation: receipt.operation,
    resource: receipt.resource,
    externalId: receipt.externalId,
    commitSha: receipt.commitSha,
    status: receipt.status,
    observedAt: receipt.observedAt,
    metadata,
  });
}

describe('GitHubCiQueryAdapter', () => {
  it('queries workflow runs, jobs and checks by exact SHA using GET only', async () => {
    const fetcher = standardFetcher();
    const evidence = new EvidenceValidator();
    const adapter = new GitHubCiQueryAdapter(
      evidence,
      new GitHubCiReadClient(fetcher, undefined),
    );

    const receipt = await adapter.execute(request());

    evidence.verifyForSkill(receipt, request().tool, skill);
    expect(receipt).toMatchObject({
      provider: 'github-actions',
      operation: 'query-ci',
      resource: repository,
      externalId: '44',
      commitSha,
      status: 'SUCCEEDED',
      metadata: {
        adapterId: 'github-ci-query-read-only-v1',
        requestedSha: commitSha,
        verifiedSha: commitSha,
        conclusion: 'SUCCESS',
        readOnly: true,
        workflowRunCount: 1,
        jobCount: 1,
        checkRunCount: 1,
      },
    });
    expect(receipt.signature).toMatch(/^[a-f0-9]{64}$/u);
    expect(fetcher).toHaveBeenCalledTimes(4);
  });

  it('keeps workflow failure authoritative when jobs and checks report success', async () => {
    const receipt = await adapterFrom(
      standardFetcher({
        workflowRuns: [workflowRun({ conclusion: 'failure' })],
        jobs: [workflowJob({ conclusion: 'success' })],
        checkRuns: [checkRun({ conclusion: 'success' })],
      }),
    ).execute(request());

    expect(receipt.metadata.conclusion).toBe('FAILURE');
  });

  it('keeps workflow cancellation authoritative when jobs and checks report success', async () => {
    const receipt = await adapterFrom(
      standardFetcher({
        workflowRuns: [workflowRun({ conclusion: 'cancelled' })],
        jobs: [workflowJob({ conclusion: 'success' })],
        checkRuns: [checkRun({ conclusion: 'success' })],
      }),
    ).execute(request());

    expect(receipt.metadata.conclusion).toBe('CANCELLED');
  });

  it.each(['neutral', 'skipped'] as const)(
    'maps known non-passing terminal conclusion %s to CANCELLED',
    async (providerConclusion) => {
      const receipt = await adapterFrom(
        standardFetcher({
          workflowRuns: [],
          jobs: [],
          checkRuns: [checkRun({ conclusion: providerConclusion })],
        }),
      ).execute(request());

      expect(receipt.metadata.conclusion).toBe('CANCELLED');
    },
  );

  it('fails closed when an unknown conclusion is mixed with success', async () => {
    await expect(
      adapterFrom(
        standardFetcher({
          workflowRuns: [],
          jobs: [],
          checkRuns: [
            checkRun({ id: 66, conclusion: 'success' }),
            checkRun({ id: 67, conclusion: 'mystery' }),
          ],
        }),
      ).execute(request()),
    ).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });

  it('returns IN_PROGRESS when success is mixed with active evidence', async () => {
    const receipt = await adapterFrom(
      standardFetcher({
        workflowRuns: [],
        jobs: [],
        checkRuns: [
          checkRun({ id: 66, conclusion: 'success' }),
          checkRun({ id: 67, status: 'in_progress', conclusion: null }),
        ],
      }),
    ).execute(request());

    expect(receipt.metadata.conclusion).toBe('IN_PROGRESS');
  });

  it('does not hide a known failure behind active evidence', async () => {
    const receipt = await adapterFrom(
      standardFetcher({
        workflowRuns: [],
        jobs: [],
        checkRuns: [
          checkRun({ id: 66, conclusion: 'failure' }),
          checkRun({ id: 67, status: 'in_progress', conclusion: null }),
        ],
      }),
    ).execute(request());

    expect(receipt.metadata.conclusion).toBe('FAILURE');
  });

  it('rejects short, symbolic or missing commit references before any request', async () => {
    const fetcher = vi.fn(async () => json({}, 500));
    const adapter = adapterFrom(fetcher);

    await expect(adapter.execute(request({ test_target: 'main' }))).rejects.toMatchObject({
      code: 'UNSUPPORTED_TARGET',
    });
    await expect(
      adapter.execute(request({ test_target: commitSha.slice(0, 12) })),
    ).rejects.toMatchObject({ code: 'UNSUPPORTED_TARGET' });
    await expect(adapter.execute(request({ test_target: undefined }))).rejects.toMatchObject({
      code: 'UNSUPPORTED_TARGET',
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('rejects repository mismatch before any request', async () => {
    const fetcher = vi.fn(async () => json({}, 500));

    await expect(
      adapterFrom(fetcher).execute(request({ repository: 'another/repository' })),
    ).rejects.toMatchObject({ code: 'INVALID_CONTEXT' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('rejects a commit response that resolves to a different SHA', async () => {
    await expect(
      adapterFrom(standardFetcher({ commit: commitPayload(otherSha) })).execute(request()),
    ).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });

  it('fails closed when the exact SHA has no CI evidence', async () => {
    await expect(
      adapterFrom(
        standardFetcher({
          workflowRuns: [],
          jobs: [],
          checkRuns: [],
        }),
      ).execute(request()),
    ).rejects.toMatchObject({ code: 'TARGET_NOT_FOUND' });
  });

  it('rejects structurally invalid successful responses', async () => {
    const fetcher = vi.fn(async (url: string) => {
      if (url.endsWith(`/commits/${commitSha}`)) return json(commitPayload());
      if (url.includes('/actions/runs?')) {
        return json({ total_count: 1, workflow_runs: null });
      }
      return json({}, 404);
    });

    await expect(adapterFrom(fetcher).execute(request())).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });

  it('rejects invalid JSON', async () => {
    const fetcher = vi.fn(async () => new Response('{', { status: 200 }));

    await expect(adapterFrom(fetcher).execute(request())).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });

  it.each([
    [401, {}, 'AUTHENTICATION_REQUIRED', false],
    [403, {}, 'AUTHENTICATION_REQUIRED', false],
    [403, { 'retry-after': '60' }, 'RATE_LIMITED', true],
    [404, {}, 'TARGET_NOT_FOUND', false],
    [422, {}, 'TARGET_NOT_FOUND', false],
    [429, {}, 'RATE_LIMITED', true],
    [500, {}, 'INVALID_RESPONSE', true],
  ] as const)(
    'normalizes HTTP %s to %s',
    async (status, headers, expectedCode, expectedRetryable) => {
      const fetcher = vi.fn(async () =>
        new Response(JSON.stringify({ message: 'provider error' }), {
          status,
          headers,
        }),
      );

      await expect(adapterFrom(fetcher).execute(request())).rejects.toMatchObject({
        code: expectedCode,
        retryable: expectedRetryable,
        statusCode: status,
      });
    },
  );

  it('classifies a documented secondary-rate-limit message as retryable', async () => {
    const fetcher = vi.fn(async () =>
      json({ message: 'You have exceeded a secondary rate limit.' }, 403),
    );

    await expect(adapterFrom(fetcher).execute(request())).rejects.toMatchObject({
      code: 'RATE_LIMITED',
      retryable: true,
    });
  });

  it('enforces the deadline before issuing a request', async () => {
    const fetcher = vi.fn(async () => json({}));
    const client = new GitHubCiReadClient(fetcher, undefined);

    await expect(
      client.getJson(`/repos/${repository}/commits/${commitSha}`, Date.now() - 1),
    ).rejects.toMatchObject({ code: 'ADAPTER_TIMEOUT', retryable: true });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('paginates workflow runs and applies the filter without resolving refs', async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) =>
      workflowRun({
        id: index + 1,
        name: index === 43 ? 'CI' : `other-${index + 1}`,
        path:
          index === 43
            ? '.github/workflows/ci.yml'
            : `.github/workflows/other-${index + 1}.yml`,
      }),
    );
    const fetcher = vi.fn(async (url: string) => {
      if (url.endsWith(`/commits/${commitSha}`)) return json(commitPayload());
      if (url.includes('/actions/runs?') && url.includes('page=1')) {
        return json({ total_count: 100, workflow_runs: firstPage });
      }
      if (url.includes('/actions/runs?') && url.includes('page=2')) {
        return json({ total_count: 100, workflow_runs: [] });
      }
      if (url.includes('/actions/runs/44/jobs')) {
        return json({ total_count: 1, jobs: [workflowJob()] });
      }
      if (url.includes('/check-runs?')) {
        return json({ total_count: 1, check_runs: [checkRun()] });
      }
      return json({}, 404);
    });

    const receipt = await adapterFrom(fetcher).execute(
      request({ workflow: '.github/workflows/ci.yml' }),
    );

    expect(receipt.metadata.workflowRunCount).toBe(1);
    expect(fetcher.mock.calls.some(([url]) => String(url).includes('page=2'))).toBe(true);
  });

  it('fails when a workflow filter has no exact match', async () => {
    await expect(
      adapterFrom(standardFetcher()).execute(request({ workflow: 'missing.yml' })),
    ).rejects.toMatchObject({ code: 'TARGET_NOT_FOUND' });
  });

  it('keeps CI query read-only while future execution still requires scoped authorization', () => {
    const permissions = new PermissionEngine();

    expect(() =>
      permissions.assertAllowed(skill, 'Renato', request().tool, request().inputs),
    ).not.toThrow();
    expect(() =>
      permissions.assertAllowed(
        skill,
        'Renato',
        { provider: 'github-actions', operation: 'run-ci', resource: repository },
        request().inputs,
      ),
    ).toThrow(/SCOPED_WRITE requires inputs\.authorizedScope=true/u);
  });

  it('rejects signed receipts whose counts, URLs or conclusion contradict their arrays', async () => {
    const evidence = new EvidenceValidator();
    const receipt = await new GitHubCiQueryAdapter(
      evidence,
      new GitHubCiReadClient(standardFetcher(), undefined),
    ).execute(request());

    const wrongCount = resign(evidence, receipt, {
      ...receipt.metadata,
      workflowRunCount: 2,
    });
    expect(() => evidence.verifyForSkill(wrongCount, request().tool, skill)).toThrow(
      /counts must match/u,
    );

    const wrongUrl = resign(evidence, receipt, {
      ...receipt.metadata,
      evidenceUrls: ['https://example.com/fake'],
    });
    expect(() => evidence.verifyForSkill(wrongUrl, request().tool, skill)).toThrow(
      /invalid evidence URL/u,
    );

    const wrongConclusion = resign(evidence, receipt, {
      ...receipt.metadata,
      conclusion: 'FAILURE',
    });
    expect(() => evidence.verifyForSkill(wrongConclusion, request().tool, skill)).toThrow(
      /inconsistent/u,
    );
  });

  it('dispatches the A2 adapter and records its receipt through the ledger boundary', async () => {
    const adapter = adapterFrom(standardFetcher());
    const reserve = vi.fn(async () => 'attempt-1');
    const recordExecuted = vi.fn(async () => undefined);
    const ledger = {
      reserve,
      recordExecuted,
      recordFailed: vi.fn(async () => undefined),
      recordEvidenceValidated: vi.fn(async () => undefined),
      recordEvidenceRejected: vi.fn(async () => undefined),
    } as unknown as ExternalActionLedger;
    const dispatcher = new ExternalActionDispatcher(new AdapterRegistry([adapter]), ledger);

    const result = await dispatcher.dispatch(request());

    expect(result.status).toBe('EXECUTED');
    expect(reserve).toHaveBeenCalledOnce();
    expect(recordExecuted).toHaveBeenCalledOnce();
    expect(recordExecuted).toHaveBeenCalledWith(
      'attempt-1',
      expect.objectContaining({
        provider: 'github-actions',
        operation: 'query-ci',
        commitSha,
      }),
    );
  });
});
