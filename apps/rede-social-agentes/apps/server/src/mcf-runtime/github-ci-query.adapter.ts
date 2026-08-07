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

interface GitHubCheckSuite {
  id: number;
  head_sha: string;
  status: string;
  conclusion: string | null;
  url: string;
  app?:
    | {
        id: number;
        name: string;
        slug: string | null;
      }
    | null
    | undefined;
  latest_check_runs_count?: number | undefined;
}

interface GitHubCheckSuitesResponse {
  total_count: number;
  check_suites: GitHubCheckSuite[];
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

interface QueryBudgetSnapshot {
  apiRequestCount: number;
  jobCount: number;
  stepCount: number;
  checkSuiteCount: number;
  checkRunCount: number;
  limits: {
    apiRequests: number;
    jobs: number;
    steps: number;
    checkSuites: number;
    checkRuns: number;
    evidenceUrls: number;
  };
}

export const GITHUB_CI_QUERY_TIMEOUT_MS = 5 * 60_000;
export const GITHUB_CI_QUERY_MAX_API_REQUESTS = 250;
export const GITHUB_CI_QUERY_MAX_TOTAL_JOBS = 5_000;
export const GITHUB_CI_QUERY_MAX_TOTAL_STEPS = 20_000;
export const GITHUB_CI_QUERY_MAX_TOTAL_CHECK_SUITES = 1_000;
export const GITHUB_CI_QUERY_MAX_TOTAL_CHECK_RUNS = 1_000;
export const GITHUB_CI_QUERY_MAX_EVIDENCE_URLS = 7_000;

const MAX_PAGES = 10;
const MAX_WORKFLOW_RUNS_WITH_JOBS = 100;
const PAGE_SIZE = 100;
const MAX_PAGINATED_ITEMS = MAX_PAGES * PAGE_SIZE;

const ACTIVE_STATUSES = new Set(['queued', 'in_progress', 'pending', 'waiting', 'requested']);
const FAILURE_CONCLUSIONS = new Set([
  'failure',
  'timed_out',
  'action_required',
  'startup_failure',
  'stale',
]);
const NON_PASSING_TERMINAL_CONCLUSIONS = new Set(['cancelled', 'neutral', 'skipped']);

if (GITHUB_CI_QUERY_TIMEOUT_MS >= EXTERNAL_ACTION_LEASE_MS) {
  throw new Error('GitHub CI query timeout must remain shorter than the external action lease');
}

function adapterError(
  code: ConstructorParameters<typeof ExternalActionAdapterError>[0],
  message: string,
  retryable = false,
  statusCode: number | null = null,
): never {
  throw new ExternalActionAdapterError(code, message, retryable, statusCode);
}

function invalidResponse(message: string): never {
  return adapterError('INVALID_RESPONSE', message, false);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) {
    return invalidResponse(`GitHub API returned invalid ${label}`);
  }
  return value;
}

function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    return invalidResponse(`GitHub API returned invalid ${label}`);
  }
  return value;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return invalidResponse(`GitHub API returned invalid ${label}`);
  }
  return value;
}

function requireNullableString(value: unknown, label: string): string | null {
  if (value === null) return null;
  return requireString(value, label);
}

function requireOptionalNullableString(value: unknown, label: string): string | null | undefined {
  if (value === undefined) return undefined;
  return requireNullableString(value, label);
}

function requireInteger(value: unknown, label: string, minimum = 0): number {
  if (!Number.isInteger(value) || (value as number) < minimum) {
    return invalidResponse(`GitHub API returned invalid ${label}`);
  }
  return value as number;
}

function requireTimestamp(value: unknown, label: string): string {
  const timestamp = requireString(value, label);
  if (Number.isNaN(Date.parse(timestamp))) {
    return invalidResponse(`GitHub API returned invalid ${label}`);
  }
  return timestamp;
}

function requireNullableTimestamp(value: unknown, label: string): string | null {
  if (value === null) return null;
  return requireTimestamp(value, label);
}

function containsAsciiControlOrSpace(value: string): boolean {
  return [...value].some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 0x20 || codePoint === 0x7f;
  });
}

function requireExactSha(value: unknown, label: string): string {
  const sha = requireString(value, label).toLowerCase();
  if (!/^[a-f0-9]{40}$/u.test(sha)) {
    return invalidResponse(`GitHub API returned invalid ${label}`);
  }
  return sha;
}

function requireGitHubHtmlUrl(value: unknown, label: string): string {
  const url = requireString(value, label);
  if (
    url !== url.trim() ||
    containsAsciiControlOrSpace(url) ||
    !url.startsWith('https://github.com/') ||
    url.includes('?') ||
    url.includes('#')
  ) {
    return invalidResponse(`GitHub API returned invalid ${label}`);
  }
  try {
    const parsed = new URL(url);
    if (
      parsed.protocol !== 'https:' ||
      parsed.hostname !== 'github.com' ||
      parsed.username.length > 0 ||
      parsed.password.length > 0 ||
      parsed.port.length > 0
    ) {
      return invalidResponse(`GitHub API returned invalid ${label}`);
    }
  } catch {
    return invalidResponse(`GitHub API returned invalid ${label}`);
  }
  return url;
}

function requireNullableGitHubHtmlUrl(value: unknown, label: string): string | null {
  if (value === null) return null;
  return requireGitHubHtmlUrl(value, label);
}

function requireGitHubApiUrl(value: unknown, label: string): string {
  const url = requireString(value, label);
  if (
    url !== url.trim() ||
    containsAsciiControlOrSpace(url) ||
    !url.startsWith('https://api.github.com/repos/') ||
    url.includes('?') ||
    url.includes('#')
  ) {
    return invalidResponse(`GitHub API returned invalid ${label}`);
  }
  try {
    const parsed = new URL(url);
    if (
      parsed.protocol !== 'https:' ||
      parsed.hostname !== 'api.github.com' ||
      parsed.username.length > 0 ||
      parsed.password.length > 0 ||
      parsed.port.length > 0
    ) {
      return invalidResponse(`GitHub API returned invalid ${label}`);
    }
  } catch {
    return invalidResponse(`GitHub API returned invalid ${label}`);
  }
  return url;
}

function parseCommitResponse(value: unknown): GitHubCommitResponse {
  const record = requireRecord(value, 'commit response');
  return {
    sha: requireExactSha(record.sha, 'commit sha'),
    html_url: requireGitHubHtmlUrl(record.html_url, 'commit html_url'),
  };
}

function parseWorkflowRun(value: unknown): GitHubWorkflowRun {
  const record = requireRecord(value, 'workflow run');
  return {
    id: requireInteger(record.id, 'workflow run id', 1),
    name: requireNullableString(record.name, 'workflow run name'),
    path: requireString(record.path, 'workflow run path'),
    workflow_id: requireInteger(record.workflow_id, 'workflow id', 1),
    run_number: requireInteger(record.run_number, 'workflow run number', 1),
    event: requireString(record.event, 'workflow event'),
    status: requireString(record.status, 'workflow status'),
    conclusion: requireNullableString(record.conclusion, 'workflow conclusion'),
    head_sha: requireExactSha(record.head_sha, 'workflow head_sha'),
    html_url: requireGitHubHtmlUrl(record.html_url, 'workflow html_url'),
    created_at: requireTimestamp(record.created_at, 'workflow created_at'),
    updated_at: requireTimestamp(record.updated_at, 'workflow updated_at'),
  };
}

function parseWorkflowRunsResponse(value: unknown): GitHubWorkflowRunsResponse {
  const record = requireRecord(value, 'workflow runs response');
  const workflowRuns = requireArray(record.workflow_runs, 'workflow_runs').map(parseWorkflowRun);
  const totalCount = requireInteger(record.total_count, 'workflow total_count');
  if (totalCount < workflowRuns.length) {
    return invalidResponse('GitHub workflow total_count is smaller than workflow_runs length');
  }
  return { total_count: totalCount, workflow_runs: workflowRuns };
}

function parseJobStep(value: unknown): GitHubJobStep {
  const record = requireRecord(value, 'job step');
  return {
    number: requireInteger(record.number, 'job step number', 1),
    name: requireString(record.name, 'job step name'),
    status: requireString(record.status, 'job step status'),
    conclusion: requireNullableString(record.conclusion, 'job step conclusion'),
  };
}

function parseWorkflowJob(value: unknown): GitHubWorkflowJob {
  const record = requireRecord(value, 'workflow job');
  const steps =
    record.steps === undefined
      ? undefined
      : requireArray(record.steps, 'workflow job steps').map(parseJobStep);
  return {
    id: requireInteger(record.id, 'workflow job id', 1),
    name: requireString(record.name, 'workflow job name'),
    status: requireString(record.status, 'workflow job status'),
    conclusion: requireNullableString(record.conclusion, 'workflow job conclusion'),
    html_url: requireGitHubHtmlUrl(record.html_url, 'workflow job html_url'),
    started_at: requireNullableTimestamp(record.started_at, 'workflow job started_at'),
    completed_at: requireNullableTimestamp(record.completed_at, 'workflow job completed_at'),
    steps,
  };
}

function parseWorkflowJobsResponse(value: unknown): GitHubWorkflowJobsResponse {
  const record = requireRecord(value, 'workflow jobs response');
  const jobs = requireArray(record.jobs, 'workflow jobs').map(parseWorkflowJob);
  const totalCount = requireInteger(record.total_count, 'workflow jobs total_count');
  if (totalCount < jobs.length) {
    return invalidResponse('GitHub jobs total_count is smaller than jobs length');
  }
  return { total_count: totalCount, jobs };
}

function parseCheckRun(value: unknown): GitHubCheckRun {
  const record = requireRecord(value, 'check run');
  let app: GitHubCheckRun['app'];
  if (record.app === undefined) {
    app = undefined;
  } else if (record.app === null) {
    app = null;
  } else {
    const appRecord = requireRecord(record.app, 'check run app');
    const name = requireOptionalNullableString(appRecord.name, 'check run app name');
    app = name === undefined || name === null ? {} : { name };
  }
  return {
    id: requireInteger(record.id, 'check run id', 1),
    name: requireString(record.name, 'check run name'),
    status: requireString(record.status, 'check run status'),
    conclusion: requireNullableString(record.conclusion, 'check run conclusion'),
    html_url: requireNullableGitHubHtmlUrl(record.html_url, 'check run html_url'),
    started_at: requireNullableTimestamp(record.started_at, 'check run started_at'),
    completed_at: requireNullableTimestamp(record.completed_at, 'check run completed_at'),
    app,
  };
}

function parseCheckRunsResponse(value: unknown): GitHubCheckRunsResponse {
  const record = requireRecord(value, 'check runs response');
  const checkRuns = requireArray(record.check_runs, 'check_runs').map(parseCheckRun);
  const totalCount = requireInteger(record.total_count, 'check runs total_count');
  if (totalCount < checkRuns.length) {
    return invalidResponse('GitHub check-runs total_count is smaller than check_runs length');
  }
  return { total_count: totalCount, check_runs: checkRuns };
}

function parseCheckSuite(value: unknown): GitHubCheckSuite {
  const record = requireRecord(value, 'check suite');
  let app: GitHubCheckSuite['app'];
  if (record.app === undefined) {
    app = undefined;
  } else if (record.app === null) {
    app = null;
  } else {
    const appRecord = requireRecord(record.app, 'check suite app');
    app = {
      id: requireInteger(appRecord.id, 'check suite app id', 1),
      name: requireString(appRecord.name, 'check suite app name'),
      slug: requireOptionalNullableString(appRecord.slug, 'check suite app slug') ?? null,
    };
  }

  return {
    id: requireInteger(record.id, 'check suite id', 1),
    head_sha: requireExactSha(record.head_sha, 'check suite head_sha'),
    status: requireString(record.status, 'check suite status'),
    conclusion: requireNullableString(record.conclusion, 'check suite conclusion'),
    url: requireGitHubApiUrl(record.url, 'check suite url'),
    app,
    latest_check_runs_count:
      record.latest_check_runs_count === undefined
        ? undefined
        : requireInteger(record.latest_check_runs_count, 'check suite latest_check_runs_count'),
  };
}

function parseCheckSuitesResponse(value: unknown): GitHubCheckSuitesResponse {
  const record = requireRecord(value, 'check suites response');
  const checkSuites = requireArray(record.check_suites, 'check_suites').map(parseCheckSuite);
  const totalCount = requireInteger(record.total_count, 'check suites total_count');
  if (totalCount < checkSuites.length) {
    return invalidResponse('GitHub check-suites total_count is smaller than check_suites length');
  }
  return { total_count: totalCount, check_suites: checkSuites };
}

function repositoryFromValue(value: string): string | null {
  if (value !== value.trim() || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u.test(value)) {
    return null;
  }

  const parts = value.split('/');
  if (parts.length !== 2) return null;
  const owner = parts[0];
  const repository = parts[1];
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
  if (value !== value.trim()) return null;
  const normalized = value.toLowerCase();
  return /^[a-f0-9]{40}$/u.test(normalized) ? normalized : null;
}

function resolveTarget(request: ExternalActionRequest): QueryTarget {
  const declaredRepository = repositoryFromValue(request.tool.resource);
  if (!declaredRepository) {
    return adapterError(
      'UNSUPPORTED_TARGET',
      'GitHub CI query requires tool.resource in owner/name format',
    );
  }

  const repositoryInput = request.inputs.repository;
  if (repositoryInput !== undefined) {
    if (typeof repositoryInput !== 'string') {
      return adapterError(
        'INVALID_CONTEXT',
        'GitHub repository input must be a string when provided',
      );
    }
    const inputRepository = repositoryFromValue(repositoryInput);
    if (!inputRepository) {
      return adapterError(
        'UNSUPPORTED_TARGET',
        'GitHub CI query requires repository in owner/name format',
      );
    }
    if (inputRepository.toLowerCase() !== declaredRepository.toLowerCase()) {
      return adapterError(
        'INVALID_CONTEXT',
        'GitHub repository input must match the declared tool resource',
      );
    }
  }

  const commitSha = exactCommitSha(request.inputs.test_target);
  if (!commitSha) {
    return adapterError(
      'UNSUPPORTED_TARGET',
      'GitHub CI query requires test_target as an exact 40-character commit SHA',
    );
  }

  const workflowInput = request.inputs.workflow;
  if (workflowInput !== undefined && typeof workflowInput !== 'string') {
    return adapterError('INVALID_CONTEXT', 'GitHub workflow filter must be a string when provided');
  }
  const workflowFilter =
    typeof workflowInput === 'string' && workflowInput.trim().length > 0
      ? workflowInput.trim()
      : null;

  return { repository: declaredRepository, commitSha, workflowFilter };
}

function resolveReceiptDomain(request: ExternalActionRequest) {
  const context = request.context;
  if (!context) {
    return adapterError(
      'INVALID_CONTEXT',
      'GitHub CI query requires a governed mission execution context',
    );
  }

  const stringFields: Array<[string, unknown]> = [
    ['skillId', request.skill.skillId],
    ['skillVersion', request.skill.version],
    ['agentId', request.agentId],
    ['missionId', context.missionId],
    ['phaseId', context.phaseId],
  ];
  if (
    stringFields.some(
      ([, value]) => typeof value !== 'string' || value.length === 0 || value !== value.trim(),
    ) ||
    !Number.isInteger(context.expectedMissionVersion) ||
    context.expectedMissionVersion < 1
  ) {
    return adapterError('INVALID_CONTEXT', 'GitHub CI query received an invalid receipt domain');
  }

  return {
    skillId: request.skill.skillId,
    skillVersion: request.skill.version,
    agentId: request.agentId,
    missionId: context.missionId,
    phaseId: context.phaseId,
    expectedMissionVersion: context.expectedMissionVersion,
  };
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

function normalizeObservation(observation: CiObservation): CiConclusion {
  const status = observation.status.trim().toLowerCase();
  const conclusion = (observation.conclusion ?? '').trim().toLowerCase();

  if (status === 'completed') {
    if (!conclusion) {
      return invalidResponse('Completed CI evidence requires a terminal conclusion');
    }
    if (conclusion === 'success') return 'SUCCESS';
    if (FAILURE_CONCLUSIONS.has(conclusion)) return 'FAILURE';
    if (NON_PASSING_TERMINAL_CONCLUSIONS.has(conclusion)) return 'CANCELLED';
    return invalidResponse(`Unsupported GitHub CI conclusion: ${conclusion}`);
  }

  if (!ACTIVE_STATUSES.has(status)) {
    return invalidResponse(`Unsupported GitHub CI status: ${status}`);
  }
  if (conclusion) {
    return invalidResponse('Active CI evidence must not contain a terminal conclusion');
  }
  return 'IN_PROGRESS';
}

function aggregateConclusion(observations: CiObservation[]): CiConclusion {
  if (observations.length === 0) {
    return adapterError(
      'TARGET_NOT_FOUND',
      'No CI workflow, job, check suite, or check run evidence was found for the exact commit SHA',
    );
  }

  const normalized = observations.map(normalizeObservation);
  if (normalized.includes('FAILURE')) return 'FAILURE';
  if (normalized.includes('CANCELLED')) return 'CANCELLED';
  if (normalized.includes('IN_PROGRESS')) return 'IN_PROGRESS';
  if (normalized.every((item) => item === 'SUCCESS')) return 'SUCCESS';

  return invalidResponse('GitHub CI evidence could not be normalized deterministically');
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

function compactCheckSuite(suite: GitHubCheckSuite) {
  return {
    id: String(suite.id),
    headSha: suite.head_sha,
    status: suite.status,
    conclusion: suite.conclusion,
    url: suite.url,
    app: suite.app
      ? {
          id: String(suite.app.id),
          name: suite.app.name,
          slug: suite.app.slug,
        }
      : null,
    latestCheckRunsCount: suite.latest_check_runs_count ?? null,
  };
}

export class QueryBudget {
  private apiRequestCount = 0;
  private jobCount = 0;
  private stepCount = 0;
  private checkSuiteCount = 0;
  private checkRunCount = 0;

  consumeRequest(): void {
    this.apiRequestCount += 1;
    if (this.apiRequestCount > GITHUB_CI_QUERY_MAX_API_REQUESTS) {
      invalidResponse(
        `GitHub CI query exceeded the ${GITHUB_CI_QUERY_MAX_API_REQUESTS}-request budget`,
      );
    }
  }

  consumeJobs(jobs: GitHubWorkflowJob[]): void {
    this.jobCount += jobs.length;
    this.stepCount += jobs.reduce((total, job) => total + (job.steps?.length ?? 0), 0);
    if (this.jobCount > GITHUB_CI_QUERY_MAX_TOTAL_JOBS) {
      invalidResponse(`GitHub CI query exceeded the ${GITHUB_CI_QUERY_MAX_TOTAL_JOBS}-job budget`);
    }
    if (this.stepCount > GITHUB_CI_QUERY_MAX_TOTAL_STEPS) {
      invalidResponse(
        `GitHub CI query exceeded the ${GITHUB_CI_QUERY_MAX_TOTAL_STEPS}-step budget`,
      );
    }
  }

  consumeCheckRuns(checkRuns: GitHubCheckRun[]): void {
    this.checkRunCount += checkRuns.length;
    if (this.checkRunCount > GITHUB_CI_QUERY_MAX_TOTAL_CHECK_RUNS) {
      invalidResponse(
        `GitHub CI query exceeded the ${GITHUB_CI_QUERY_MAX_TOTAL_CHECK_RUNS}-check budget`,
      );
    }
  }

  consumeCheckSuites(checkSuites: GitHubCheckSuite[]): void {
    this.checkSuiteCount += checkSuites.length;
    if (this.checkSuiteCount > GITHUB_CI_QUERY_MAX_TOTAL_CHECK_SUITES) {
      invalidResponse(
        `GitHub CI query exceeded the ${GITHUB_CI_QUERY_MAX_TOTAL_CHECK_SUITES}-check-suite budget`,
      );
    }
  }

  assertEvidenceUrlCount(count: number): void {
    if (count > GITHUB_CI_QUERY_MAX_EVIDENCE_URLS) {
      invalidResponse(
        `GitHub CI query exceeded the ${GITHUB_CI_QUERY_MAX_EVIDENCE_URLS}-URL evidence budget`,
      );
    }
  }

  snapshot(): QueryBudgetSnapshot {
    return {
      apiRequestCount: this.apiRequestCount,
      jobCount: this.jobCount,
      stepCount: this.stepCount,
      checkSuiteCount: this.checkSuiteCount,
      checkRunCount: this.checkRunCount,
      limits: {
        apiRequests: GITHUB_CI_QUERY_MAX_API_REQUESTS,
        jobs: GITHUB_CI_QUERY_MAX_TOTAL_JOBS,
        steps: GITHUB_CI_QUERY_MAX_TOTAL_STEPS,
        checkSuites: GITHUB_CI_QUERY_MAX_TOTAL_CHECK_SUITES,
        checkRuns: GITHUB_CI_QUERY_MAX_TOTAL_CHECK_RUNS,
        evidenceUrls: GITHUB_CI_QUERY_MAX_EVIDENCE_URLS,
      },
    };
  }
}

interface PaginationState {
  expectedTotal: number | null;
  rawCollected: number;
}

function consumePaginationPage(
  state: PaginationState,
  totalCount: number,
  pageItemCount: number,
  page: number,
  label: string,
): boolean {
  if (pageItemCount > PAGE_SIZE) {
    return invalidResponse(`GitHub ${label} page exceeds the requested ${PAGE_SIZE}-item size`);
  }

  if (state.expectedTotal === null) {
    state.expectedTotal = totalCount;
    if (totalCount > MAX_PAGINATED_ITEMS) {
      return invalidResponse(
        `GitHub ${label} list exceeds the supported ${MAX_PAGINATED_ITEMS}-item query limit`,
      );
    }
  } else if (totalCount !== state.expectedTotal) {
    return invalidResponse(`GitHub ${label} total_count changed during pagination`);
  }

  state.rawCollected += pageItemCount;
  if (state.rawCollected > state.expectedTotal) {
    return invalidResponse(`GitHub ${label} item count exceeds total_count`);
  }
  if (state.rawCollected === state.expectedTotal) return true;

  if (pageItemCount < PAGE_SIZE) {
    return invalidResponse(`GitHub ${label} pagination ended before total_count was collected`);
  }
  if (page === MAX_PAGES) {
    return invalidResponse(
      `GitHub ${label} list exceeds the supported ${MAX_PAGINATED_ITEMS}-item query limit`,
    );
  }
  return false;
}

function adapterTimeout(): never {
  return adapterError('ADAPTER_TIMEOUT', 'GitHub CI query exceeded its execution deadline', true);
}

async function responseErrorText(response: Response, signal: AbortSignal): Promise<string> {
  try {
    const body = (await response.text()).slice(0, 1_024).toLowerCase();
    if (signal.aborted) return adapterTimeout();
    return body;
  } catch {
    if (signal.aborted) return adapterTimeout();
    return '';
  }
}

export class GitHubCiReadClient {
  constructor(
    private readonly fetcher: FetchLike = globalThis.fetch,
    private readonly token: string | undefined = process.env.MCF_GITHUB_TOKEN ??
      process.env.GITHUB_TOKEN,
  ) {}

  async getJson(path: string, deadlineAt: number): Promise<unknown> {
    if (!path.startsWith('/repos/') || path.includes('://') || path.includes('..')) {
      return adapterError('INVALID_CONTEXT', 'GitHub CI query attempted an unsafe API path');
    }

    const remainingMilliseconds = deadlineAt - Date.now();
    if (remainingMilliseconds <= 0) {
      return adapterTimeout();
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
          return adapterTimeout();
        }
        return adapterError(
          'NETWORK_FAILURE',
          error instanceof Error ? error.message : 'GitHub network request failed',
          true,
        );
      }

      if (!response.ok) {
        const remaining = response.headers.get('x-ratelimit-remaining');
        const retryAfter = response.headers.get('retry-after');
        const body = await responseErrorText(response, controller.signal);
        const bodySignalsRateLimit =
          body.includes('rate limit') ||
          body.includes('secondary rate') ||
          body.includes('abuse detection');
        const rateLimited =
          response.status === 429 ||
          (response.status === 403 &&
            (remaining === '0' || retryAfter !== null || bodySignalsRateLimit));

        if (rateLimited) {
          return adapterError(
            'RATE_LIMITED',
            'GitHub API rate limit was reached',
            true,
            response.status,
          );
        }
        if (response.status === 401 || response.status === 403) {
          return adapterError(
            'AUTHENTICATION_REQUIRED',
            'GitHub authentication or repository permission is required',
            false,
            response.status,
          );
        }
        if (response.status === 404 || response.status === 422) {
          return adapterError(
            'TARGET_NOT_FOUND',
            'GitHub CI target was not found',
            false,
            response.status,
          );
        }
        return adapterError(
          'INVALID_RESPONSE',
          `GitHub API returned HTTP ${response.status}`,
          response.status >= 500,
          response.status,
        );
      }

      try {
        const payload: unknown = await response.json();
        if (controller.signal.aborted) return adapterTimeout();
        return payload;
      } catch {
        if (controller.signal.aborted) return adapterTimeout();
        return adapterError(
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
    const receiptDomain = resolveReceiptDomain(request);
    const target = resolveTarget(request);
    const budget = new QueryBudget();

    const queryJson = async <T>(path: string, parser: (value: unknown) => T): Promise<T> => {
      budget.consumeRequest();
      return parser(await this.client.getJson(path, deadlineAt));
    };

    const commit = await queryJson(
      `/repos/${target.repository}/commits/${target.commitSha}`,
      parseCommitResponse,
    );
    if (commit.sha !== target.commitSha) {
      return adapterError(
        'INVALID_RESPONSE',
        'GitHub resolved a commit different from the exact requested SHA',
      );
    }

    const workflowRunMap = new Map<number, GitHubWorkflowRun>();
    const rawWorkflowRunIds = new Set<number>();
    const workflowPagination: PaginationState = { expectedTotal: null, rawCollected: 0 };
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const result = await queryJson(
        `/repos/${target.repository}/actions/runs?head_sha=${target.commitSha}&per_page=${PAGE_SIZE}&page=${page}`,
        parseWorkflowRunsResponse,
      );
      const paginationComplete = consumePaginationPage(
        workflowPagination,
        result.total_count,
        result.workflow_runs.length,
        page,
        'workflow run',
      );
      if (result.workflow_runs.some((run) => run.head_sha !== target.commitSha)) {
        return adapterError(
          'INVALID_RESPONSE',
          'GitHub returned a workflow run not bound to the exact requested SHA',
        );
      }
      for (const run of result.workflow_runs) {
        if (rawWorkflowRunIds.has(run.id)) {
          return adapterError(
            'INVALID_RESPONSE',
            `GitHub returned duplicate workflow run ${run.id}`,
          );
        }
        rawWorkflowRunIds.add(run.id);
      }
      for (const run of result.workflow_runs.filter((item) =>
        workflowMatches(item, target.workflowFilter),
      )) {
        const existing = workflowRunMap.get(run.id);
        if (existing && JSON.stringify(existing) !== JSON.stringify(run)) {
          return adapterError(
            'INVALID_RESPONSE',
            `GitHub returned conflicting data for workflow run ${run.id}`,
          );
        }
        workflowRunMap.set(run.id, run);
      }
      if (paginationComplete) break;
    }
    const workflowRuns = [...workflowRunMap.values()];

    if (workflowRuns.length > MAX_WORKFLOW_RUNS_WITH_JOBS) {
      return adapterError(
        'INVALID_RESPONSE',
        `GitHub returned more than ${MAX_WORKFLOW_RUNS_WITH_JOBS} matching workflow runs`,
      );
    }
    if (target.workflowFilter && workflowRuns.length === 0) {
      return adapterError(
        'TARGET_NOT_FOUND',
        'No workflow run matched the requested workflow filter and exact commit SHA',
      );
    }

    const jobs: Array<{ workflowRunId: number; job: GitHubWorkflowJob }> = [];
    const jobIds = new Set<number>();
    for (const run of workflowRuns) {
      const jobPagination: PaginationState = { expectedTotal: null, rawCollected: 0 };
      for (let page = 1; page <= MAX_PAGES; page += 1) {
        const result = await queryJson(
          `/repos/${target.repository}/actions/runs/${run.id}/jobs?filter=latest&per_page=${PAGE_SIZE}&page=${page}`,
          parseWorkflowJobsResponse,
        );
        const paginationComplete = consumePaginationPage(
          jobPagination,
          result.total_count,
          result.jobs.length,
          page,
          `job for workflow run ${run.id}`,
        );
        budget.consumeJobs(result.jobs);
        for (const job of result.jobs) {
          if (jobIds.has(job.id)) {
            return adapterError(
              'INVALID_RESPONSE',
              `GitHub returned duplicate workflow job ${job.id}`,
            );
          }
          jobIds.add(job.id);
          jobs.push({ workflowRunId: run.id, job });
        }
        if (paginationComplete) break;
      }
    }

    const checkRunMap = new Map<number, GitHubCheckRun>();
    const checkRunPagination: PaginationState = { expectedTotal: null, rawCollected: 0 };
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const result = await queryJson(
        `/repos/${target.repository}/commits/${target.commitSha}/check-runs?per_page=${PAGE_SIZE}&page=${page}`,
        parseCheckRunsResponse,
      );
      const paginationComplete = consumePaginationPage(
        checkRunPagination,
        result.total_count,
        result.check_runs.length,
        page,
        'check run',
      );
      budget.consumeCheckRuns(result.check_runs);
      for (const checkRun of result.check_runs) {
        const existing = checkRunMap.get(checkRun.id);
        if (existing) {
          return adapterError(
            'INVALID_RESPONSE',
            `GitHub returned duplicate check run ${checkRun.id}`,
          );
        }
        checkRunMap.set(checkRun.id, checkRun);
      }
      if (paginationComplete) break;
    }
    const checkRuns = [...checkRunMap.values()];

    const checkSuiteMap = new Map<number, GitHubCheckSuite>();
    const checkSuitePagination: PaginationState = { expectedTotal: null, rawCollected: 0 };
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const result = await queryJson(
        `/repos/${target.repository}/commits/${target.commitSha}/check-suites?per_page=${PAGE_SIZE}&page=${page}`,
        parseCheckSuitesResponse,
      );
      const paginationComplete = consumePaginationPage(
        checkSuitePagination,
        result.total_count,
        result.check_suites.length,
        page,
        'check suite',
      );
      budget.consumeCheckSuites(result.check_suites);
      for (const checkSuite of result.check_suites) {
        if (checkSuite.head_sha !== target.commitSha) {
          return adapterError(
            'INVALID_RESPONSE',
            'GitHub returned a check suite not bound to the exact requested SHA',
          );
        }
        const expectedPath = `/repos/${target.repository}/check-suites/${checkSuite.id}`;
        if (new URL(checkSuite.url).pathname.toLowerCase() !== expectedPath.toLowerCase()) {
          return adapterError(
            'INVALID_RESPONSE',
            `GitHub returned an invalid URL for check suite ${checkSuite.id}`,
          );
        }
        const existing = checkSuiteMap.get(checkSuite.id);
        if (existing) {
          if (JSON.stringify(existing) !== JSON.stringify(checkSuite)) {
            return adapterError(
              'INVALID_RESPONSE',
              `GitHub returned conflicting data for check suite ${checkSuite.id}`,
            );
          }
          return adapterError(
            'INVALID_RESPONSE',
            `GitHub returned duplicate check suite ${checkSuite.id}`,
          );
        }
        checkSuiteMap.set(checkSuite.id, checkSuite);
      }
      if (paginationComplete) break;
    }
    const checkSuites = [...checkSuiteMap.values()];

    const workflowObservations = workflowRuns.map((run) => ({
      status: run.status,
      conclusion: run.conclusion,
    }));
    const jobObservations = jobs.map(({ job }) => ({
      status: job.status,
      conclusion: job.conclusion,
    }));
    const checkObservations = checkRuns.map((run) => ({
      status: run.status,
      conclusion: run.conclusion,
    }));
    const checkSuiteObservations = checkSuites.map((suite) => ({
      status: suite.status,
      conclusion: suite.conclusion,
    }));
    const conclusion = aggregateConclusion([
      ...workflowObservations,
      ...jobObservations,
      ...checkSuiteObservations,
      ...checkObservations,
    ]);

    const latestRun = [...workflowRuns].sort((left, right) =>
      right.updated_at.localeCompare(left.updated_at),
    )[0];
    const externalId = latestRun
      ? String(latestRun.id)
      : checkSuites[0]
        ? `suite:${checkSuites[0].id}`
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
    budget.assertEvidenceUrlCount(evidenceUrls.length);

    const metadata = {
      adapterId: this.adapterId,
      repository: target.repository,
      requestedSha: target.commitSha,
      verifiedSha: commit.sha,
      conclusion,
      readOnly: true,
      ...receiptDomain,
      requiredPermissions: ['metadata:read', 'contents:read', 'actions:read', 'checks:read'],
      workflowFilter: target.workflowFilter,
      workflowRunCount: workflowRuns.length,
      jobCount: jobs.length,
      checkSuiteCount: checkSuites.length,
      checkRunCount: checkRuns.length,
      workflowRuns: workflowRuns.map(compactRun),
      jobs: jobs.map(({ workflowRunId, job }) => compactJob(job, workflowRunId)),
      checkSuites: checkSuites.map(compactCheckSuite),
      checkRuns: checkRuns.map(compactCheck),
      evidenceUrls,
      queryBudget: budget.snapshot(),
    };

    return this.evidence.createTrustedReceipt({
      provider: 'github-actions',
      operation: canonicalizeToolValue(request.tool.operation),
      resource: target.repository,
      externalId,
      commitSha: target.commitSha,
      status: 'SUCCEEDED',
      observedAt: new Date().toISOString(),
      metadata,
    });
  }
}
