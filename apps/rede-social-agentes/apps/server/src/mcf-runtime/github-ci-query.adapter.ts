import type { McfToolReceipt } from '@rsa/contracts';

import type { EvidenceValidator } from './evidence-validator.js';
import {
  ExternalActionAdapterError,
  type ExternalActionAdapter,
  type ExternalActionRequest,
} from './external-action.contracts.js';
import { EXTERNAL_ACTION_LEASE_MS } from './external-action-reservation.js';
import { canonicalizeProvider, canonicalizeToolValue } from './permission-engine.js';

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

type CiConclusion = 'SUCCESS' | 'FAILURE' | 'CANCELLED' | 'IN_PROGRESS';
type McfReceiptStatus = 'SUCCEEDED' | 'FAILED' | 'PARTIAL';

interface GitHubCommitResponse {
  sha: string;
  html_url: string;
}

interface GitHubWorkflowRun {
  id: number;
  name: string | null;
  path: string;
  workflow_id: number;
  run_number: number;
  event: string;
  status: string;
  conclusion: string | null;
  head_sha: string;
  html_url: string;
  created_at: string;
  updated_at: string;
}

interface GitHubWorkflowRunsResponse {
  total_count: number;
  workflow_runs: GitHubWorkflowRun[];
}

interface GitHubJobStep {
  number: number;
  name: string;
  status: string;
  conclusion: string | null;
}

interface GitHubWorkflowJob {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  html_url: string;
  started_at: string | null;
  completed_at: string | null;
  steps?: GitHubJobStep[] | undefined;
}

interface GitHubWorkflowJobsResponse {
  total_count: number;
  jobs: GitHubWorkflowJob[];
}

interface GitHubCheckRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  html_url: string | null;
  started_at: string | null;
  completed_at: string | null;
  app?: { name?: string | undefined } | null | undefined;
}

interface GitHubCheckRunsResponse {
  total_count: number;
  check_runs: GitHubCheckRun[];
}

interface CiObservation {
  status: string;
  conclusion: string | null;
}

interface QueryTarget {
  repository: string;
  commitSha: string;
  workflowFilter: string | null;
}

export const GITHUB_CI_QUERY_TIMEOUT_MS = 5 * 60_000;
const MAX_PAGES = 10;
const MAX_WORKFLOW_RUNS_WITH_JOBS = 100;

if (GITHUB_CI_QUERY_TIMEOUT_MS >= EXTERNAL_ACTION_LEASE_MS) {
  throw new Error('GitHub CI query timeout must remain shorter than the external action lease');
}

function repositoryFromValue(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  let path = trimmed;
  if (/^https?:\/\//u.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.hostname.toLowerCase() !== 'github.com') return null;
      path = parsed.pathname;
    } catch {
      return null;
    }
  }

  const parts = path
    .replace(/^github:/u, '')
    .replace(/^\/+|\/+$/gu, '')
    .split('/');
  if (parts.length < 2) return null;
  const owner = parts[0];
  const repository = parts[1]?.replace(/\.git$/u, '');
  if (
    !owner ||
    !repository ||
    !/^[A-Za-z0-9_.-]+$/u.test(owner) ||
    !/^[A-Za-z0-9_.-]+$/u.test(repository)
  ) {
    return null;
  }
  return `${owner}/${repository}`;
}

function exactCommitSha(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return /^[a-f0-9]{40}$/u.test(normalized) ? normalized : null;
}

function resolveTarget(request: ExternalActionRequest): QueryTarget {
  const declaredRepository = repositoryFromValue(request.tool.resource);
  if (!declaredRepository) {
    throw new ExternalActionAdapterError(
      'UNSUPPORTED_TARGET',
      'GitHub CI query requires tool.resource in owner/name format',
      false,
    );
  }

  const repositoryInput = request.inputs.repository;
  if (repositoryInput !== undefined) {
    if (typeof repositoryInput !== 'string') {
      throw new ExternalActionAdapterError(
        'INVALID_CONTEXT',
        'GitHub repository input must be a string when provided',
        false,
      );
    }
    const inputRepository = repositoryFromValue(repositoryInput);
    if (!inputRepository) {
      throw new ExternalActionAdapterError(
        'UNSUPPORTED_TARGET',
        'GitHub CI query requires repository in owner/name format',
        false,
      );
    }
    if (inputRepository.toLowerCase() !== declaredRepository.toLowerCase()) {
      throw new ExternalActionAdapterError(
        'INVALID_CONTEXT',
        'GitHub repository input must match the declared tool resource',
        false,
      );
    }
  }

  const commitSha = exactCommitSha(request.inputs.test_target);
  if (!commitSha) {
    throw new ExternalActionAdapterError(
      'UNSUPPORTED_TARGET',
      'GitHub CI query requires test_target as an exact 40-character commit SHA',
      false,
    );
  }

  const workflowInput = request.inputs.workflow;
  if (workflowInput !== undefined && typeof workflowInput !== 'string') {
    throw new ExternalActionAdapterError(
      'INVALID_CONTEXT',
      'GitHub workflow filter must be a string when provided',
      false,
    );
  }
  const workflowFilter =
    typeof workflowInput === 'string' && workflowInput.trim().length > 0
      ? workflowInput.trim()
      : null;

  return { repository: declaredRepository, commitSha, workflowFilter };
}

function workflowMatches(run: GitHubWorkflowRun, filter: string | null): boolean {
  if (!filter) return true;
  const normalized = filter.trim().toLowerCase();
  return (
    String(run.workflow_id) === normalized ||
    (run.name ?? '').toLowerCase() === normalized ||
    run.path.toLowerCase() === normalized ||
    run.path.toLowerCase().endsWith(`/${normalized}`)
  );
}

function isActive(observation: CiObservation): boolean {
  const status = observation.status.trim().toLowerCase();
  return status !== 'completed' || observation.conclusion === null;
}

function normalizeConclusion(value: string | null): string {
  return (value ?? '').trim().toLowerCase();
}

function aggregateConclusion(observations: CiObservation[]): CiConclusion {
  if (observations.length === 0) {
    throw new ExternalActionAdapterError(
      'TARGET_NOT_FOUND',
      'No CI workflow, job, or check evidence was found for the exact commit SHA',
      false,
    );
  }

  if (observations.some(isActive)) return 'IN_PROGRESS';

  const conclusions = observations.map((item) => normalizeConclusion(item.conclusion));
  const failureConclusions = new Set([
    'failure',
    'timed_out',
    'action_required',
    'startup_failure',
    'stale',
  ]);
  if (conclusions.some((conclusion) => failureConclusions.has(conclusion))) return 'FAILURE';
  if (conclusions.some((conclusion) => conclusion === 'cancelled')) return 'CANCELLED';
  if (conclusions.some((conclusion) => conclusion === 'success')) return 'SUCCESS';

  return 'CANCELLED';
}

function receiptStatusForConclusion(_conclusion: CiConclusion): McfReceiptStatus {
  // The receipt proves that the read-only query completed. CI state is carried separately in metadata.
  return 'SUCCEEDED';
}

function compactRun(run: GitHubWorkflowRun) {
  return {
    id: String(run.id),
    workflowId: String(run.workflow_id),
    name: run.name,
    path: run.path,
    runNumber: run.run_number,
    event: run.event,
    status: run.status,
    conclusion: run.conclusion,
    headSha: run.head_sha,
    url: run.html_url,
    createdAt: run.created_at,
    updatedAt: run.updated_at,
  };
}

function compactJob(job: GitHubWorkflowJob, workflowRunId: number) {
  return {
    id: String(job.id),
    workflowRunId: String(workflowRunId),
    name: job.name,
    status: job.status,
    conclusion: job.conclusion,
    url: job.html_url,
    startedAt: job.started_at,
    completedAt: job.completed_at,
    steps: (job.steps ?? []).map((step) => ({
      number: step.number,
      name: step.name,
      status: step.status,
      conclusion: step.conclusion,
    })),
  };
}

function compactCheck(run: GitHubCheckRun) {
  return {
    id: String(run.id),
    name: run.name,
    app: run.app?.name ?? null,
    status: run.status,
    conclusion: run.conclusion,
    url: run.html_url,
    startedAt: run.started_at,
    completedAt: run.completed_at,
  };
}

export class GitHubCiReadClient {
  constructor(
    private readonly fetcher: FetchLike = globalThis.fetch,
    private readonly token: string | undefined = process.env.MCF_GITHUB_TOKEN ??
      process.env.GITHUB_TOKEN,
  ) {}

  async getJson<T>(path: string, deadlineAt: number): Promise<T> {
    const remainingMilliseconds = deadlineAt - Date.now();
    if (remainingMilliseconds <= 0) {
      throw new ExternalActionAdapterError(
        'ADAPTER_TIMEOUT',
        'GitHub CI query exceeded its execution deadline',
        true,
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), remainingMilliseconds);
    try {
      let response: Response;
      try {
        response = await this.fetcher(`https://api.github.com${path}`, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'mcf-runtime-ci-query-adapter',
            ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
          },
        });
      } catch (error) {
        if (controller.signal.aborted) {
          throw new ExternalActionAdapterError(
            'ADAPTER_TIMEOUT',
            'GitHub CI query exceeded its execution deadline',
            true,
          );
        }
        throw new ExternalActionAdapterError(
          'NETWORK_FAILURE',
          error instanceof Error ? error.message : 'GitHub network request failed',
          true,
        );
      }

      if (!response.ok) {
        const remaining = response.headers.get('x-ratelimit-remaining');
        if (response.status === 429 || (response.status === 403 && remaining === '0')) {
          throw new ExternalActionAdapterError(
            'RATE_LIMITED',
            'GitHub API rate limit was reached',
            true,
            response.status,
          );
        }
        if (response.status === 401 || response.status === 403) {
          throw new ExternalActionAdapterError(
            'AUTHENTICATION_REQUIRED',
            'GitHub authentication or repository permission is required',
            false,
            response.status,
          );
        }
        if (response.status === 404 || response.status === 422) {
          throw new ExternalActionAdapterError(
            'TARGET_NOT_FOUND',
            'GitHub CI target was not found',
            false,
            response.status,
          );
        }
        throw new ExternalActionAdapterError(
          'INVALID_RESPONSE',
          `GitHub API returned HTTP ${response.status}`,
          response.status >= 500,
          response.status,
        );
      }

      try {
        return (await response.json()) as T;
      } catch {
        throw new ExternalActionAdapterError(
          'INVALID_RESPONSE',
          'GitHub API returned invalid JSON',
          false,
          response.status,
        );
      }
    } finally {
      clearTimeout(timeout);
    }
  }
}

export class GitHubCiQueryAdapter implements ExternalActionAdapter {
  readonly adapterId = 'github-ci-query-read-only-v1';

  constructor(
    private readonly evidence: EvidenceValidator,
    private readonly client: GitHubCiReadClient = new GitHubCiReadClient(),
  ) {}

  supports(request: ExternalActionRequest): boolean {
    return (
      request.skill.skillId === 'MCF-RUN-TESTS' &&
      canonicalizeProvider(request.tool.provider) === 'github' &&
      canonicalizeToolValue(request.tool.operation) === 'query-ci'
    );
  }

  async execute(request: ExternalActionRequest): Promise<McfToolReceipt> {
    const deadlineAt = Date.now() + GITHUB_CI_QUERY_TIMEOUT_MS;
    const target = resolveTarget(request);
    const commit = await this.client.getJson<GitHubCommitResponse>(
      `/repos/${target.repository}/commits/${target.commitSha}`,
      deadlineAt,
    );
    if (commit.sha.toLowerCase() !== target.commitSha) {
      throw new ExternalActionAdapterError(
        'INVALID_RESPONSE',
        'GitHub resolved a commit different from the exact requested SHA',
        false,
      );
    }

    const workflowRuns: GitHubWorkflowRun[] = [];
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const result = await this.client.getJson<GitHubWorkflowRunsResponse>(
        `/repos/${target.repository}/actions/runs?head_sha=${target.commitSha}&per_page=100&page=${page}`,
        deadlineAt,
      );
      const batch = result.workflow_runs.filter(
        (run) =>
          run.head_sha.toLowerCase() === target.commitSha &&
          workflowMatches(run, target.workflowFilter),
      );
      workflowRuns.push(...batch);
      if (result.workflow_runs.length < 100) break;
      if (page === MAX_PAGES) {
        throw new ExternalActionAdapterError(
          'INVALID_RESPONSE',
          'GitHub workflow run list exceeds the supported 1000-run query limit',
          false,
        );
      }
    }

    if (workflowRuns.length > MAX_WORKFLOW_RUNS_WITH_JOBS) {
      throw new ExternalActionAdapterError(
        'INVALID_RESPONSE',
        `GitHub returned more than ${MAX_WORKFLOW_RUNS_WITH_JOBS} matching workflow runs`,
        false,
      );
    }

    if (target.workflowFilter && workflowRuns.length === 0) {
      throw new ExternalActionAdapterError(
        'TARGET_NOT_FOUND',
        'No workflow run matched the requested workflow filter and exact commit SHA',
        false,
      );
    }

    const jobs: Array<{ workflowRunId: number; job: GitHubWorkflowJob }> = [];
    for (const run of workflowRuns) {
      for (let page = 1; page <= MAX_PAGES; page += 1) {
        const result = await this.client.getJson<GitHubWorkflowJobsResponse>(
          `/repos/${target.repository}/actions/runs/${run.id}/jobs?filter=latest&per_page=100&page=${page}`,
          deadlineAt,
        );
        jobs.push(...result.jobs.map((job) => ({ workflowRunId: run.id, job })));
        if (result.jobs.length < 100) break;
        if (page === MAX_PAGES) {
          throw new ExternalActionAdapterError(
            'INVALID_RESPONSE',
            `GitHub job list for workflow run ${run.id} exceeds the supported 1000-job limit`,
            false,
          );
        }
      }
    }

    const checkRuns: GitHubCheckRun[] = [];
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const result = await this.client.getJson<GitHubCheckRunsResponse>(
        `/repos/${target.repository}/commits/${target.commitSha}/check-runs?per_page=100&page=${page}`,
        deadlineAt,
      );
      checkRuns.push(...result.check_runs);
      if (result.check_runs.length < 100) break;
      if (page === MAX_PAGES) {
        throw new ExternalActionAdapterError(
          'INVALID_RESPONSE',
          'GitHub check run list exceeds the supported 1000-check query limit',
          false,
        );
      }
    }

    const jobObservations = jobs.map(({ job }) => ({
      status: job.status,
      conclusion: job.conclusion,
    }));
    const runObservations = workflowRuns
      .filter((run) => !jobs.some((entry) => entry.workflowRunId === run.id))
      .map((run) => ({ status: run.status, conclusion: run.conclusion }));
    const checkObservations = checkRuns.map((run) => ({
      status: run.status,
      conclusion: run.conclusion,
    }));
    const conclusion = aggregateConclusion([
      ...jobObservations,
      ...runObservations,
      ...checkObservations,
    ]);

    const latestRun = [...workflowRuns].sort((left, right) =>
      right.updated_at.localeCompare(left.updated_at),
    )[0];
    const externalId = latestRun
      ? String(latestRun.id)
      : checkRuns[0]
        ? `check:${checkRuns[0].id}`
        : target.commitSha;
    const evidenceUrls = Array.from(
      new Set([
        commit.html_url,
        ...workflowRuns.map((run) => run.html_url),
        ...jobs.map(({ job }) => job.html_url),
        ...checkRuns.flatMap((run) => (run.html_url ? [run.html_url] : [])),
      ]),
    );

    const metadata = {
      adapterId: this.adapterId,
      repository: target.repository,
      requestedSha: target.commitSha,
      verifiedSha: commit.sha.toLowerCase(),
      conclusion,
      readOnly: true,
      requiredPermissions: ['metadata:read', 'actions:read', 'checks:read'],
      workflowFilter: target.workflowFilter,
      workflowRunCount: workflowRuns.length,
      jobCount: jobs.length,
      checkRunCount: checkRuns.length,
      workflowRuns: workflowRuns.map(compactRun),
      jobs: jobs.map(({ workflowRunId, job }) => compactJob(job, workflowRunId)),
      checkRuns: checkRuns.map(compactCheck),
      evidenceUrls,
    };

    return this.evidence.createTrustedReceipt({
      provider: 'github-actions',
      operation: canonicalizeToolValue(request.tool.operation),
      resource: request.tool.resource,
      externalId,
      commitSha: target.commitSha,
      status: receiptStatusForConclusion(conclusion),
      observedAt: new Date().toISOString(),
      metadata,
    });
  }
}
