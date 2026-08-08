import type { McfSkillDefinition, McfToolReceipt } from '@rsa/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdapterRegistry } from './adapter-registry.js';
import { EvidenceValidator } from './evidence-validator.js';
import { ExternalActionDispatcher } from './external-action-dispatcher.js';
import type { ExternalActionLedger } from './external-action-ledger.js';
import {
  GITHUB_CI_QUERY_MAX_API_REQUESTS,
  GITHUB_CI_QUERY_MAX_EVIDENCE_URLS,
  GITHUB_CI_QUERY_MAX_TOTAL_CHECK_RUNS,
  GITHUB_CI_QUERY_MAX_TOTAL_CHECK_SUITES,
  GITHUB_CI_QUERY_MAX_TOTAL_JOBS,
  GITHUB_CI_QUERY_MAX_TOTAL_STEPS,
  GitHubCiQueryAdapter,
  GitHubCiReadClient,
  QueryBudget,
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
    context: {
      missionId: 'mission-a2',
      phaseId: 'phase-run-tests',
      expectedMissionVersion: 5,
    },
  };
}

function verificationContext() {
  const currentRequest = request();
  return {
    agentId: currentRequest.agentId,
    executionContext: currentRequest.context,
  };
}

function commitPayload(sha = commitSha) {
  return {
    sha,
    html_url: `https://github.com/${repository}/commit/${sha}`,
  };
}

function workflowRun(
  input: {
    id?: number;
    status?: string;
    conclusion?: string | null;
    headSha?: string;
    name?: string;
    path?: string;
  } = {},
) {
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

function workflowJob(
  input: {
    id?: number;
    runId?: number;
    headSha?: string;
    status?: string;
    conclusion?: string | null;
    steps?: number;
  } = {},
) {
  const id = input.id ?? 55;
  const steps = input.steps ?? 1;
  return {
    id,
    run_id: input.runId ?? 44,
    head_sha: input.headSha ?? commitSha,
    name: `job-${id}`,
    status: input.status ?? 'completed',
    conclusion: input.conclusion === undefined ? 'success' : input.conclusion,
    html_url: `https://github.com/${repository}/actions/runs/44/job/${id}`,
    started_at: '2026-08-06T11:00:10Z',
    completed_at: (input.status ?? 'completed') === 'completed' ? '2026-08-06T11:01:50Z' : null,
    steps: Array.from({ length: steps }, (_, index) => ({
      number: index + 1,
      name: `step-${index + 1}`,
      status: input.status ?? 'completed',
      conclusion: input.conclusion === undefined ? 'success' : input.conclusion,
    })),
  };
}

function checkRun(
  input: {
    id?: number;
    headSha?: string;
    status?: string;
    conclusion?: string | null;
  } = {},
) {
  const id = input.id ?? 66;
  return {
    id,
    head_sha: input.headSha ?? commitSha,
    name: `check-${id}`,
    status: input.status ?? 'completed',
    conclusion: input.conclusion === undefined ? 'success' : input.conclusion,
    html_url: `https://github.com/${repository}/runs/${id}`,
    started_at: '2026-08-06T11:00:10Z',
    completed_at: (input.status ?? 'completed') === 'completed' ? '2026-08-06T11:01:50Z' : null,
    app: { name: 'GitHub Actions' },
  };
}

function checkSuite(
  input: {
    id?: number;
    status?: string;
    conclusion?: string | null;
    headSha?: string;
    latestCheckRunsCount?: number;
    url?: string;
  } = {},
) {
  const id = input.id ?? 77;
  return {
    id,
    head_sha: input.headSha ?? commitSha,
    status: input.status ?? 'completed',
    conclusion: input.conclusion === undefined ? 'success' : input.conclusion,
    url: input.url ?? `https://api.github.com/repos/${repository}/check-suites/${id}`,
    app: {
      id: 1,
      name: 'GitHub Actions',
      slug: 'github-actions',
    },
    latest_check_runs_count: input.latestCheckRunsCount ?? 1,
  };
}

function json(payload: unknown, status = 200, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(payload), {
    status,
    ...(headers ? { headers } : {}),
  });
}

function standardFetcher(
  input: {
    workflowRuns?: ReturnType<typeof workflowRun>[];
    jobs?: unknown[];
    checkRuns?: unknown[];
    checkSuites?: ReturnType<typeof checkSuite>[];
    commit?: ReturnType<typeof commitPayload>;
  } = {},
) {
  const runs = input.workflowRuns ?? [workflowRun()];
  const jobs = input.jobs ?? [workflowJob()];
  const checks = input.checkRuns ?? [checkRun()];
  const suites = input.checkSuites ?? [checkSuite()];
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
    if (url.includes('/check-suites?')) {
      return json({ total_count: suites.length, check_suites: suites });
    }
    return json({}, 404);
  });
}

function checkSuitePaginationFetcher(payloadForPage: (page: number) => unknown) {
  return vi.fn(async (url: string) => {
    if (url.endsWith(`/commits/${commitSha}`)) return json(commitPayload());
    if (url.includes('/actions/runs?')) {
      return json({ total_count: 1, workflow_runs: [workflowRun()] });
    }
    if (url.includes('/actions/runs/44/jobs')) {
      return json({ total_count: 1, jobs: [workflowJob()] });
    }
    if (url.includes('/check-runs?')) {
      return json({ total_count: 0, check_runs: [] });
    }
    if (url.includes('/check-suites?')) {
      const page = Number(new URL(url).searchParams.get('page'));
      return json(payloadForPage(page));
    }
    return json({}, 404);
  });
}

function adapterFrom(
  fetcher: NonNullable<ConstructorParameters<typeof GitHubCiReadClient>[0]>,
): GitHubCiQueryAdapter {
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
  it('queries workflow runs, jobs, check runs and check suites by exact SHA using GET only', async () => {
    const fetcher = standardFetcher();
    const evidence = new EvidenceValidator();
    const adapter = new GitHubCiQueryAdapter(evidence, new GitHubCiReadClient(fetcher, undefined));

    const receipt = await adapter.execute(request());

    evidence.verifyForSkill(
      receipt,
      request().tool,
      skill,
      request().inputs,
      verificationContext(),
    );
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
        skillId: 'MCF-RUN-TESTS',
        skillVersion: '1.0.0',
        agentId: 'Renato',
        missionId: 'mission-a2',
        phaseId: 'phase-run-tests',
        expectedMissionVersion: 5,
        requiredPermissions: ['metadata:read', 'contents:read', 'actions:read', 'checks:read'],
        workflowRunCount: 1,
        jobCount: 1,
        checkSuiteCount: 1,
        checkRunCount: 1,
        checkSuites: [
          {
            id: '77',
            headSha: commitSha,
            url: `https://api.github.com/repos/${repository}/check-suites/77`,
            app: { id: '1', name: 'GitHub Actions', slug: 'github-actions' },
            latestCheckRunsCount: 1,
          },
        ],
        jobs: [
          {
            id: '55',
            runId: '44',
            workflowRunId: '44',
            headSha: commitSha,
          },
        ],
        checkRuns: [
          {
            id: '66',
            headSha: commitSha,
          },
        ],
        queryBudget: {
          checkSuiteCount: 1,
          limits: { checkSuites: GITHUB_CI_QUERY_MAX_TOTAL_CHECK_SUITES },
        },
      },
    });
    expect(receipt.signature).toMatch(/^[a-f0-9]{64}$/u);
    expect(fetcher).toHaveBeenCalledTimes(5);
  });

  it('rejects a query without governed mission context before any request', async () => {
    const fetcher = standardFetcher();
    const contextlessRequest = { ...request(), context: undefined };

    await expect(adapterFrom(fetcher).execute(contextlessRequest)).rejects.toMatchObject({
      code: 'INVALID_CONTEXT',
    });
    expect(fetcher).not.toHaveBeenCalled();
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

  it('rejects a workflow job without provider-native run_id', async () => {
    const jobWithoutRunId: Record<string, unknown> = { ...workflowJob() };
    delete jobWithoutRunId.run_id;

    await expect(
      adapterFrom(standardFetcher({ jobs: [jobWithoutRunId] })).execute(request()),
    ).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });

  it('rejects a workflow job whose provider-native run_id differs from its workflow run', async () => {
    await expect(
      adapterFrom(standardFetcher({ jobs: [workflowJob({ runId: 45 })] })).execute(request()),
    ).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });

  it('rejects a workflow job without provider-native head_sha', async () => {
    const jobWithoutHeadSha: Record<string, unknown> = { ...workflowJob() };
    delete jobWithoutHeadSha.head_sha;

    await expect(
      adapterFrom(standardFetcher({ jobs: [jobWithoutHeadSha] })).execute(request()),
    ).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });

  it('rejects a workflow job whose provider-native head_sha differs from the target', async () => {
    await expect(
      adapterFrom(standardFetcher({ jobs: [workflowJob({ headSha: otherSha })] })).execute(
        request(),
      ),
    ).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });

  it('rejects a check run without provider-native head_sha', async () => {
    const checkRunWithoutHeadSha: Record<string, unknown> = { ...checkRun() };
    delete checkRunWithoutHeadSha.head_sha;

    await expect(
      adapterFrom(standardFetcher({ checkRuns: [checkRunWithoutHeadSha] })).execute(request()),
    ).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });

  it('rejects a check run whose provider-native head_sha differs from the target', async () => {
    await expect(
      adapterFrom(standardFetcher({ checkRuns: [checkRun({ headSha: otherSha })] })).execute(
        request(),
      ),
    ).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });

  it('rejects a successful check-run-only response bound to a different SHA', async () => {
    await expect(
      adapterFrom(
        standardFetcher({
          workflowRuns: [],
          jobs: [],
          checkSuites: [],
          checkRuns: [checkRun({ headSha: otherSha, conclusion: 'success' })],
        }),
      ).execute(request()),
    ).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
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

  it('returns IN_PROGRESS for a queued check suite even when all other evidence succeeds', async () => {
    const receipt = await adapterFrom(
      standardFetcher({
        checkRuns: [],
        checkSuites: [checkSuite({ status: 'queued', conclusion: null, latestCheckRunsCount: 0 })],
      }),
    ).execute(request());

    expect(receipt.metadata.conclusion).toBe('IN_PROGRESS');
  });

  it('keeps a failed check suite authoritative when all other evidence succeeds', async () => {
    const receipt = await adapterFrom(
      standardFetcher({
        checkSuites: [checkSuite({ conclusion: 'failure' })],
      }),
    ).execute(request());

    expect(receipt.metadata.conclusion).toBe('FAILURE');
  });

  it('rejects a check suite bound to a different head SHA', async () => {
    await expect(
      adapterFrom(standardFetcher({ checkSuites: [checkSuite({ headSha: otherSha })] })).execute(
        request(),
      ),
    ).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });

  it('fails closed for an unknown check-suite conclusion', async () => {
    await expect(
      adapterFrom(
        standardFetcher({ checkSuites: [checkSuite({ conclusion: 'mystery' })] }),
      ).execute(request()),
    ).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });

  it('rejects truncated check-suite pagination', async () => {
    const fetcher = checkSuitePaginationFetcher(() => ({
      total_count: 2,
      check_suites: [checkSuite()],
    }));

    await expect(adapterFrom(fetcher).execute(request())).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });

  it('rejects check-suite total_count changes between pages', async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) => checkSuite({ id: index + 1 }));
    const fetcher = checkSuitePaginationFetcher((page) =>
      page === 1
        ? { total_count: 101, check_suites: firstPage }
        : { total_count: 102, check_suites: [checkSuite({ id: 101 })] },
    );

    await expect(adapterFrom(fetcher).execute(request())).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });

  it('rejects duplicate or conflicting check-suite IDs across pages', async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) => checkSuite({ id: index + 1 }));
    const duplicateFetcher = checkSuitePaginationFetcher((page) =>
      page === 1
        ? { total_count: 101, check_suites: firstPage }
        : { total_count: 101, check_suites: [checkSuite({ id: 1 })] },
    );
    const conflictingFetcher = checkSuitePaginationFetcher((page) =>
      page === 1
        ? { total_count: 101, check_suites: firstPage }
        : {
            total_count: 101,
            check_suites: [checkSuite({ id: 1, conclusion: 'failure' })],
          },
    );

    await expect(adapterFrom(duplicateFetcher).execute(request())).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
    await expect(adapterFrom(conflictingFetcher).execute(request())).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });

  it('rejects a non-canonical check-suite API URL', async () => {
    await expect(
      adapterFrom(
        standardFetcher({
          checkSuites: [
            checkSuite({ url: `https://api.github.com/repos/${repository}/check-suites/999` }),
          ],
        }),
      ).execute(request()),
    ).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
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
    await expect(adapter.execute(request({ test_target: ` ${commitSha} ` }))).rejects.toMatchObject(
      { code: 'UNSUPPORTED_TARGET' },
    );
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

  it('accepts only canonical owner/name resources and rejects credential-bearing URLs', async () => {
    const fetcher = vi.fn(async () => json({}, 500));
    const credentialRequest = request();
    credentialRequest.tool.resource = `https://TOKEN@github.com/${repository}`;

    await expect(adapterFrom(fetcher).execute(credentialRequest)).rejects.toMatchObject({
      code: 'UNSUPPORTED_TARGET',
    });
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
          checkSuites: [],
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
    [
      403,
      { 'x-ratelimit-remaining': '4999', 'x-ratelimit-reset': '1786104000' },
      'AUTHENTICATION_REQUIRED',
      false,
    ],
    [403, { 'retry-after': '60' }, 'RATE_LIMITED', true],
    [404, {}, 'TARGET_NOT_FOUND', false],
    [422, {}, 'TARGET_NOT_FOUND', false],
    [429, {}, 'RATE_LIMITED', true],
    [500, {}, 'INVALID_RESPONSE', true],
  ] as const)(
    'normalizes HTTP %s to %s',
    async (status, headers, expectedCode, expectedRetryable) => {
      const fetcher = vi.fn(
        async () =>
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

  it('classifies an abort during successful body parsing as a retryable timeout', async () => {
    vi.useFakeTimers();
    try {
      const fetcher = vi.fn(async (_url: string, init?: RequestInit) => {
        const response = json({});
        vi.spyOn(response, 'json').mockImplementation(
          () =>
            new Promise<unknown>((_resolve, reject) => {
              init?.signal?.addEventListener('abort', () => reject(new Error('aborted')), {
                once: true,
              });
            }),
        );
        return response;
      });
      const pending = new GitHubCiReadClient(fetcher, undefined).getJson(
        `/repos/${repository}/commits/${commitSha}`,
        Date.now() + 1_000,
      );
      const assertion = expect(pending).rejects.toMatchObject({
        code: 'ADAPTER_TIMEOUT',
        retryable: true,
      });

      await vi.advanceTimersByTimeAsync(1_001);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });

  it('classifies an abort while reading an error body as a retryable timeout', async () => {
    vi.useFakeTimers();
    try {
      const fetcher = vi.fn(async (_url: string, init?: RequestInit) => {
        const response = json({ message: 'forbidden' }, 403);
        vi.spyOn(response, 'text').mockImplementation(
          () =>
            new Promise<string>((_resolve, reject) => {
              init?.signal?.addEventListener('abort', () => reject(new Error('aborted')), {
                once: true,
              });
            }),
        );
        return response;
      });
      const pending = new GitHubCiReadClient(fetcher, undefined).getJson(
        `/repos/${repository}/commits/${commitSha}`,
        Date.now() + 1_000,
      );
      const assertion = expect(pending).rejects.toMatchObject({
        code: 'ADAPTER_TIMEOUT',
        retryable: true,
      });

      await vi.advanceTimersByTimeAsync(1_001);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });

  it('paginates workflow runs and applies the filter without resolving refs', async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) =>
      workflowRun({
        id: index + 1,
        name: index === 43 ? 'CI' : `other-${index + 1}`,
        path:
          index === 43 ? '.github/workflows/ci.yml' : `.github/workflows/other-${index + 1}.yml`,
      }),
    );
    const fetcher = vi.fn(async (url: string) => {
      const page = new URL(url).searchParams.get('page');
      if (url.endsWith(`/commits/${commitSha}`)) return json(commitPayload());
      if (url.includes('/actions/runs?') && page === '1') {
        return json({ total_count: 101, workflow_runs: firstPage });
      }
      if (url.includes('/actions/runs?') && page === '2') {
        return json({
          total_count: 101,
          workflow_runs: [
            workflowRun({
              id: 101,
              name: 'other-101',
              path: '.github/workflows/other-101.yml',
            }),
          ],
        });
      }
      if (url.includes('/actions/runs/44/jobs')) {
        return json({ total_count: 1, jobs: [workflowJob()] });
      }
      if (url.includes('/check-runs?')) {
        return json({ total_count: 1, check_runs: [checkRun()] });
      }
      if (url.includes('/check-suites?')) {
        return json({ total_count: 1, check_suites: [checkSuite()] });
      }
      return json({}, 404);
    });

    const receipt = await adapterFrom(fetcher).execute(
      request({ workflow: '.github/workflows/ci.yml' }),
    );

    expect(receipt.metadata.workflowRunCount).toBe(1);
    expect(fetcher.mock.calls.some(([url]) => String(url).includes('page=2'))).toBe(true);
  });

  it('rejects a short workflow page before the advertised total is collected', async () => {
    const fetcher = vi.fn(async (url: string) => {
      if (url.endsWith(`/commits/${commitSha}`)) return json(commitPayload());
      if (url.includes('/actions/runs?')) {
        return json({ total_count: 2, workflow_runs: [workflowRun()] });
      }
      return json({}, 404);
    });

    await expect(adapterFrom(fetcher).execute(request())).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });

  it('rejects an empty workflow page before the advertised total is collected', async () => {
    const fetcher = vi.fn(async (url: string) => {
      if (url.endsWith(`/commits/${commitSha}`)) return json(commitPayload());
      if (url.includes('/actions/runs?')) {
        return json({ total_count: 1, workflow_runs: [] });
      }
      return json({}, 404);
    });

    await expect(adapterFrom(fetcher).execute(request())).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });

  it('rejects workflow total_count changes between pages', async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) => workflowRun({ id: index + 1 }));
    const fetcher = vi.fn(async (url: string) => {
      const page = new URL(url).searchParams.get('page');
      if (url.endsWith(`/commits/${commitSha}`)) return json(commitPayload());
      if (url.includes('/actions/runs?') && page === '1') {
        return json({ total_count: 101, workflow_runs: firstPage });
      }
      if (url.includes('/actions/runs?') && page === '2') {
        return json({ total_count: 102, workflow_runs: [workflowRun({ id: 101 })] });
      }
      return json({}, 404);
    });

    await expect(adapterFrom(fetcher).execute(request())).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });

  it('rejects duplicate raw workflow IDs across pages before applying the local filter', async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) =>
      workflowRun({
        id: index + 1,
        name: index === 43 ? 'CI' : `other-${index + 1}`,
      }),
    );
    const fetcher = vi.fn(async (url: string) => {
      const page = new URL(url).searchParams.get('page');
      if (url.endsWith(`/commits/${commitSha}`)) return json(commitPayload());
      if (url.includes('/actions/runs?') && page === '1') {
        return json({ total_count: 101, workflow_runs: firstPage });
      }
      if (url.includes('/actions/runs?') && page === '2') {
        return json({ total_count: 101, workflow_runs: [workflowRun({ id: 1 })] });
      }
      if (url.includes('/actions/runs/44/jobs')) {
        return json({ total_count: 1, jobs: [workflowJob()] });
      }
      if (url.includes('/check-runs?')) {
        return json({ total_count: 1, check_runs: [checkRun()] });
      }
      return json({}, 404);
    });

    await expect(adapterFrom(fetcher).execute(request({ workflow: 'CI' }))).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });

  it('rejects workflow pagination that collects more items than total_count', async () => {
    const fetcher = vi.fn(async (url: string) => {
      const page = new URL(url).searchParams.get('page');
      if (url.endsWith(`/commits/${commitSha}`)) return json(commitPayload());
      if (url.includes('/actions/runs?') && page === '1') {
        return json({
          total_count: 150,
          workflow_runs: Array.from({ length: 100 }, (_, index) => workflowRun({ id: index + 1 })),
        });
      }
      if (url.includes('/actions/runs?') && page === '2') {
        return json({
          total_count: 150,
          workflow_runs: Array.from({ length: 51 }, (_, index) => workflowRun({ id: index + 101 })),
        });
      }
      return json({}, 404);
    });

    await expect(adapterFrom(fetcher).execute(request())).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });

  it('rejects advertised workflow totals above the supported pagination limit', async () => {
    const fetcher = vi.fn(async (url: string) => {
      if (url.endsWith(`/commits/${commitSha}`)) return json(commitPayload());
      if (url.includes('/actions/runs?')) {
        return json({
          total_count: 1_001,
          workflow_runs: Array.from({ length: 100 }, (_, index) => workflowRun({ id: index + 1 })),
        });
      }
      return json({}, 404);
    });

    await expect(adapterFrom(fetcher).execute(request())).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });

  it('rejects truncated job pagination', async () => {
    const fetcher = vi.fn(async (url: string) => {
      if (url.endsWith(`/commits/${commitSha}`)) return json(commitPayload());
      if (url.includes('/actions/runs?')) {
        return json({ total_count: 1, workflow_runs: [workflowRun()] });
      }
      if (url.includes('/actions/runs/44/jobs')) {
        return json({ total_count: 2, jobs: [workflowJob()] });
      }
      return json({}, 404);
    });

    await expect(adapterFrom(fetcher).execute(request())).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });

  it('rejects job total_count changes between pages', async () => {
    const fetcher = vi.fn(async (url: string) => {
      const page = new URL(url).searchParams.get('page');
      if (url.endsWith(`/commits/${commitSha}`)) return json(commitPayload());
      if (url.includes('/actions/runs?')) {
        return json({ total_count: 1, workflow_runs: [workflowRun()] });
      }
      if (url.includes('/actions/runs/44/jobs') && page === '1') {
        return json({
          total_count: 101,
          jobs: Array.from({ length: 100 }, (_, index) => workflowJob({ id: index + 1_000 })),
        });
      }
      if (url.includes('/actions/runs/44/jobs') && page === '2') {
        return json({ total_count: 102, jobs: [workflowJob({ id: 1_100 })] });
      }
      return json({}, 404);
    });

    await expect(adapterFrom(fetcher).execute(request())).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });

  it('rejects truncated check-run pagination', async () => {
    const fetcher = vi.fn(async (url: string) => {
      if (url.endsWith(`/commits/${commitSha}`)) return json(commitPayload());
      if (url.includes('/actions/runs?')) {
        return json({ total_count: 0, workflow_runs: [] });
      }
      if (url.includes('/check-runs?')) {
        return json({ total_count: 2, check_runs: [checkRun()] });
      }
      return json({}, 404);
    });

    await expect(adapterFrom(fetcher).execute(request())).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });

  it('rejects check-run total_count changes between pages', async () => {
    const fetcher = vi.fn(async (url: string) => {
      const page = new URL(url).searchParams.get('page');
      if (url.endsWith(`/commits/${commitSha}`)) return json(commitPayload());
      if (url.includes('/actions/runs?')) {
        return json({ total_count: 0, workflow_runs: [] });
      }
      if (url.includes('/check-runs?') && page === '1') {
        return json({
          total_count: 101,
          check_runs: Array.from({ length: 100 }, (_, index) => checkRun({ id: index + 1_000 })),
        });
      }
      if (url.includes('/check-runs?') && page === '2') {
        return json({ total_count: 102, check_runs: [checkRun({ id: 1_100 })] });
      }
      return json({}, 404);
    });

    await expect(adapterFrom(fetcher).execute(request())).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });

  it('rejects duplicate check-run IDs across pages', async () => {
    const fetcher = vi.fn(async (url: string) => {
      const page = new URL(url).searchParams.get('page');
      if (url.endsWith(`/commits/${commitSha}`)) return json(commitPayload());
      if (url.includes('/actions/runs?')) {
        return json({ total_count: 0, workflow_runs: [] });
      }
      if (url.includes('/check-runs?') && page === '1') {
        return json({
          total_count: 101,
          check_runs: Array.from({ length: 100 }, (_, index) => checkRun({ id: index + 1 })),
        });
      }
      if (url.includes('/check-runs?') && page === '2') {
        return json({ total_count: 101, check_runs: [checkRun({ id: 1 })] });
      }
      return json({}, 404);
    });

    await expect(adapterFrom(fetcher).execute(request())).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });

  it('fails when a workflow filter has no exact match', async () => {
    await expect(
      adapterFrom(standardFetcher()).execute(request({ workflow: 'missing.yml' })),
    ).rejects.toMatchObject({ code: 'TARGET_NOT_FOUND' });
  });

  it('enforces the API request budget directly', () => {
    const budget = new QueryBudget();
    for (let count = 0; count < GITHUB_CI_QUERY_MAX_API_REQUESTS; count += 1) {
      budget.consumeRequest();
    }

    expect(() => budget.consumeRequest()).toThrow(/request budget/u);
  });

  it('enforces the global job budget directly', () => {
    const budget = new QueryBudget();
    const jobs = Array.from({ length: GITHUB_CI_QUERY_MAX_TOTAL_JOBS + 1 }, (_, index) =>
      workflowJob({ id: index + 1, steps: 0 }),
    );

    expect(() => budget.consumeJobs(jobs)).toThrow(/job budget/u);
  });

  it('enforces the global step budget directly', () => {
    const budget = new QueryBudget();

    expect(() =>
      budget.consumeJobs([workflowJob({ id: 1, steps: GITHUB_CI_QUERY_MAX_TOTAL_STEPS + 1 })]),
    ).toThrow(/step budget/u);
  });

  it('enforces the global check-run budget directly', () => {
    const budget = new QueryBudget();
    const checks = Array.from({ length: GITHUB_CI_QUERY_MAX_TOTAL_CHECK_RUNS + 1 }, (_, index) =>
      checkRun({ id: index + 1 }),
    );

    expect(() => budget.consumeCheckRuns(checks)).toThrow(/check budget/u);
  });

  it('enforces the global check-suite budget directly', () => {
    const budget = new QueryBudget();
    const suites = Array.from({ length: GITHUB_CI_QUERY_MAX_TOTAL_CHECK_SUITES + 1 }, (_, index) =>
      checkSuite({ id: index + 1 }),
    );

    expect(() => budget.consumeCheckSuites(suites)).toThrow(/check-suite budget/u);
  });

  it('enforces the evidence URL budget directly', () => {
    const budget = new QueryBudget();

    expect(() => budget.assertEvidenceUrlCount(GITHUB_CI_QUERY_MAX_EVIDENCE_URLS + 1)).toThrow(
      /URL evidence budget/u,
    );
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
    expect(() =>
      evidence.verifyForSkill(
        wrongCount,
        request().tool,
        skill,
        request().inputs,
        verificationContext(),
      ),
    ).toThrow(/counts must match/u);

    const wrongUrl = resign(evidence, receipt, {
      ...receipt.metadata,
      evidenceUrls: ['https://example.com/fake'],
    });
    expect(() =>
      evidence.verifyForSkill(
        wrongUrl,
        request().tool,
        skill,
        request().inputs,
        verificationContext(),
      ),
    ).toThrow(/invalid evidence URL/u);

    const wrongConclusion = resign(evidence, receipt, {
      ...receipt.metadata,
      conclusion: 'FAILURE',
    });
    expect(() =>
      evidence.verifyForSkill(
        wrongConclusion,
        request().tool,
        skill,
        request().inputs,
        verificationContext(),
      ),
    ).toThrow(/inconsistent/u);
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
