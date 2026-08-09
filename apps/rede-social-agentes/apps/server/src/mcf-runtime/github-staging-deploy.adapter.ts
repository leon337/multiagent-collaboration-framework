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
type SleepLike = (milliseconds: number) => Promise<void>;
type DeploymentOutcome = 'DEPLOYED' | 'NOOP' | 'RECOVERED';
type WorkflowConclusion = 'success' | 'failure' | 'cancelled' | 'timed_out' | 'action_required';

interface RequestBudget {
  requests: number;
}

interface GitHubCommitResponse {
  sha: string;
  html_url: string;
}

interface GitHubRefResponse {
  ref: string;
  object: { sha: string };
}

interface GitHubCompareResponse {
  status: string;
  merge_base_commit: { sha: string };
}

interface GitHubWorkflowRun {
  id: number;
  display_title: string;
  event: string;
  status: string;
  conclusion: string | null;
  head_branch: string | null;
  head_sha: string;
  path: string;
  html_url: string;
  created_at: string;
  updated_at: string;
}

interface GitHubWorkflowRunsResponse {
  total_count: number;
  workflow_runs: unknown[];
}

interface GitHubJobStep {
  number: number;
  name: string;
  status: string;
  conclusion: string | null;
}

interface GitHubWorkflowJob {
  id: number;
  run_id: number;
  name: string;
  status: string;
  conclusion: string | null;
  steps: GitHubJobStep[];
}

interface GitHubWorkflowJobsResponse {
  total_count: number;
  jobs: unknown[];
}

interface StagingObservation {
  commitSha: string;
  ready: boolean;
  readyStatus: number;
}

interface DeployTarget {
  repository: string;
  releaseSha: string;
  idempotencyKey: string;
  expectedRunTitle: string;
  runTitlePrefix: string;
}

export interface GitHubStagingDeployAdapterOptions {
  stagingRuntimeUrl?: string | undefined;
  timeoutMs?: number | undefined;
  pollIntervalMs?: number | undefined;
  sleepImpl?: SleepLike | undefined;
}

export const GITHUB_STAGING_DEPLOY_TIMEOUT_MS = 8 * 60_000;
export const GITHUB_STAGING_DEPLOY_POLL_INTERVAL_MS = 5_000;
const MAX_REQUESTS = 250;
const RUN_PAGE_SIZE = 100;
const MAX_RUN_PAGES = 10;
const WORKFLOW_FILE = 'mcf-runtime-staging-deploy.yml';
const WORKFLOW_PATH = `.github/workflows/${WORKFLOW_FILE}`;
const SHA_40 = /^[a-f0-9]{40}$/u;
const REPOSITORY =
  /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?\/(?!\.{1,2}$)[A-Za-z0-9._-]{1,100}$/u;
const IDEMPOTENCY_KEY = /^[A-Za-z0-9][A-Za-z0-9._:-]{15,127}$/u;
const TERMINAL_CONCLUSIONS = new Set<WorkflowConclusion>([
  'success',
  'failure',
  'cancelled',
  'timed_out',
  'action_required',
]);

if (GITHUB_STAGING_DEPLOY_TIMEOUT_MS >= EXTERNAL_ACTION_LEASE_MS) {
  throw new Error(
    'GitHub staging deploy timeout must remain shorter than the external action lease',
  );
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function requireString(inputs: Record<string, unknown>, key: string): string {
  const value = inputs[key];
  if (typeof value !== 'string' || value.length === 0 || value !== value.trim()) {
    throw new ExternalActionAdapterError(
      'INVALID_CONTEXT',
      `${key} must be a non-empty trimmed string`,
      false,
    );
  }
  return value;
}

function exactSha(value: string, label: string): string {
  const normalized = value.toLowerCase();
  if (!SHA_40.test(normalized)) {
    throw new ExternalActionAdapterError(
      'INVALID_CONTEXT',
      `${label} must be an exact 40-character SHA`,
      false,
    );
  }
  return normalized;
}

function publicHttpsBaseUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ExternalActionAdapterError(
      'INVALID_CONTEXT',
      'MCF staging runtime URL must be a valid HTTPS URL',
      false,
    );
  }
  if (
    url.protocol !== 'https:' ||
    url.username.length > 0 ||
    url.password.length > 0 ||
    url.port.length > 0 ||
    url.search.length > 0 ||
    url.hash.length > 0
  ) {
    throw new ExternalActionAdapterError(
      'INVALID_CONTEXT',
      'MCF staging runtime URL must be public HTTPS without credentials, port, query or fragment',
      false,
    );
  }
  url.pathname = url.pathname.replace(/\/+$/u, '');
  return url.href.replace(/\/$/u, '');
}

function resolveTarget(request: ExternalActionRequest): DeployTarget {
  if (!request.context) {
    throw new ExternalActionAdapterError(
      'INVALID_CONTEXT',
      'staging deploy requires governed execution context',
      false,
    );
  }
  if (!REPOSITORY.test(request.tool.resource)) {
    throw new ExternalActionAdapterError(
      'UNSUPPORTED_TARGET',
      'staging deploy requires canonical owner/repository resource',
      false,
    );
  }

  const repository = requireString(request.inputs, 'repository');
  if (
    !REPOSITORY.test(repository) ||
    repository.toLowerCase() !== request.tool.resource.toLowerCase()
  ) {
    throw new ExternalActionAdapterError(
      'INVALID_CONTEXT',
      'repository input must exactly match the canonical tool resource',
      false,
    );
  }

  const targetEnvironment = canonicalizeToolValue(
    requireString(request.inputs, 'target_environment'),
  );
  if (targetEnvironment !== 'staging') {
    throw new ExternalActionAdapterError(
      'UNSUPPORTED_TARGET',
      'this adapter supports staging only',
      false,
    );
  }

  const releaseSha = exactSha(
    requireString(request.inputs, 'artifact_or_commit'),
    'artifact_or_commit',
  );
  const idempotencyKey = requireString(request.inputs, 'idempotency_key');
  if (!IDEMPOTENCY_KEY.test(idempotencyKey)) {
    throw new ExternalActionAdapterError(
      'INVALID_CONTEXT',
      'idempotency_key must be 16-128 safe characters',
      false,
    );
  }

  return {
    repository,
    releaseSha,
    idempotencyKey,
    expectedRunTitle: `MCF staging deploy ${idempotencyKey} ${releaseSha}`,
    runTitlePrefix: `MCF staging deploy ${idempotencyKey} `,
  };
}

function requireWorkflowRun(value: unknown): GitHubWorkflowRun {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ExternalActionAdapterError(
      'INVALID_RESPONSE',
      'invalid workflow run response',
      false,
    );
  }
  const record = value as Record<string, unknown>;
  if (
    !Number.isInteger(record.id) ||
    (record.id as number) < 1 ||
    typeof record.display_title !== 'string' ||
    typeof record.event !== 'string' ||
    typeof record.status !== 'string' ||
    (record.conclusion !== null && typeof record.conclusion !== 'string') ||
    (record.head_branch !== null && typeof record.head_branch !== 'string') ||
    typeof record.head_sha !== 'string' ||
    typeof record.path !== 'string' ||
    typeof record.html_url !== 'string' ||
    typeof record.created_at !== 'string' ||
    typeof record.updated_at !== 'string'
  ) {
    throw new ExternalActionAdapterError('INVALID_RESPONSE', 'invalid workflow run fields', false);
  }
  exactSha(record.head_sha, 'workflow run head SHA');
  return record as unknown as GitHubWorkflowRun;
}

function requireWorkflowStep(value: unknown): GitHubJobStep {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ExternalActionAdapterError(
      'INVALID_RESPONSE',
      'invalid workflow step response',
      false,
    );
  }
  const record = value as Record<string, unknown>;
  if (
    !Number.isInteger(record.number) ||
    (record.number as number) < 1 ||
    typeof record.name !== 'string' ||
    typeof record.status !== 'string' ||
    (record.conclusion !== null && typeof record.conclusion !== 'string')
  ) {
    throw new ExternalActionAdapterError('INVALID_RESPONSE', 'invalid workflow step fields', false);
  }
  return record as unknown as GitHubJobStep;
}

function requireWorkflowJob(value: unknown): GitHubWorkflowJob {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ExternalActionAdapterError(
      'INVALID_RESPONSE',
      'invalid workflow job response',
      false,
    );
  }
  const record = value as Record<string, unknown>;
  if (
    !Number.isInteger(record.id) ||
    (record.id as number) < 1 ||
    !Number.isInteger(record.run_id) ||
    (record.run_id as number) < 1 ||
    typeof record.name !== 'string' ||
    typeof record.status !== 'string' ||
    (record.conclusion !== null && typeof record.conclusion !== 'string') ||
    !Array.isArray(record.steps)
  ) {
    throw new ExternalActionAdapterError('INVALID_RESPONSE', 'invalid workflow job fields', false);
  }
  return {
    id: record.id as number,
    run_id: record.run_id as number,
    name: record.name,
    status: record.status,
    conclusion: record.conclusion as string | null,
    steps: record.steps.map(requireWorkflowStep),
  };
}

function normalizedConclusion(value: string | null): WorkflowConclusion | null {
  if (value === null) return null;
  const normalized = value.trim().toLowerCase();
  return TERMINAL_CONCLUSIONS.has(normalized as WorkflowConclusion)
    ? (normalized as WorkflowConclusion)
    : null;
}

function markerOutcome(jobs: GitHubWorkflowJob[]): DeploymentOutcome | null {
  const matchingJobs = jobs.filter((candidate) => candidate.name === 'deploy-and-verify');
  if (matchingJobs.length !== 1) return null;
  const job = matchingJobs[0]!;

  const markers: Array<[DeploymentOutcome, string]> = [
    ['DEPLOYED', 'Deployment result DEPLOYED'],
    ['NOOP', 'Deployment result NOOP'],
    ['RECOVERED', 'Deployment result RECOVERED'],
  ];
  const successful = job.steps.flatMap((step) => {
    if (step.status.toLowerCase() !== 'completed' || step.conclusion?.toLowerCase() !== 'success') {
      return [];
    }
    const marker = markers.find(([, name]) => step.name === name);
    return marker ? [marker[0]] : [];
  });
  return successful.length === 1 ? successful[0]! : null;
}

export class GitHubStagingDeployClient {
  constructor(
    private readonly fetcher: FetchLike = globalThis.fetch,
    private readonly token: string | undefined = process.env.MCF_GITHUB_TOKEN ??
      process.env.GITHUB_TOKEN,
  ) {}

  private async fetchWithDeadline(
    input: string,
    init: RequestInit,
    deadlineAt: number,
    budget: RequestBudget,
  ): Promise<Response> {
    budget.requests += 1;
    if (budget.requests > MAX_REQUESTS) {
      throw new ExternalActionAdapterError(
        'INVALID_RESPONSE',
        'GitHub staging deploy request budget exceeded',
        false,
      );
    }

    const remaining = deadlineAt - Date.now();
    if (remaining <= 0) {
      throw new ExternalActionAdapterError(
        'ADAPTER_TIMEOUT',
        'GitHub staging deploy adapter exceeded its execution deadline',
        true,
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), remaining);
    try {
      try {
        return await this.fetcher(input, { ...init, signal: controller.signal });
      } catch (error) {
        if (controller.signal.aborted) {
          throw new ExternalActionAdapterError(
            'ADAPTER_TIMEOUT',
            'GitHub staging deploy adapter exceeded its execution deadline',
            true,
          );
        }
        throw new ExternalActionAdapterError(
          'NETWORK_FAILURE',
          error instanceof Error ? error.message : 'staging deploy network request failed',
          true,
        );
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  async githubJson<T>(
    method: 'GET' | 'POST',
    path: string,
    deadlineAt: number,
    budget: RequestBudget,
    body?: Record<string, unknown>,
  ): Promise<T> {
    if (!path.startsWith('/repos/') || path.includes('://')) {
      throw new ExternalActionAdapterError(
        'UNSUPPORTED_TARGET',
        'GitHub staging deploy client rejected unsupported path',
        false,
      );
    }
    const response = await this.fetchWithDeadline(
      `https://api.github.com${path}`,
      {
        method,
        headers: {
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'mcf-runtime-staging-deploy-adapter',
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      },
      deadlineAt,
      budget,
    );

    if (!response.ok) this.throwGitHubError(response);
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
  }

  async githubVoid(
    method: 'POST',
    path: string,
    deadlineAt: number,
    budget: RequestBudget,
    body: Record<string, unknown>,
  ): Promise<void> {
    const response = await this.fetchWithDeadline(
      `https://api.github.com${path}`,
      {
        method,
        headers: {
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'mcf-runtime-staging-deploy-adapter',
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        },
        body: JSON.stringify(body),
      },
      deadlineAt,
      budget,
    );
    if (!response.ok) this.throwGitHubError(response);
  }

  private throwGitHubError(response: Response): never {
    const remainingRate = response.headers.get('x-ratelimit-remaining');
    const retryAfter = response.headers.get('retry-after');
    if (
      response.status === 429 ||
      (response.status === 403 && (remainingRate === '0' || retryAfter !== null))
    ) {
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
        'GitHub Actions authentication or permission is required',
        false,
        response.status,
      );
    }
    if (response.status === 404) {
      throw new ExternalActionAdapterError(
        'TARGET_NOT_FOUND',
        'GitHub staging deploy target was not found',
        false,
        response.status,
      );
    }
    if (response.status === 409 || response.status === 422) {
      throw new ExternalActionAdapterError(
        'RESERVATION_CONFLICT',
        `GitHub rejected staging deploy request with HTTP ${response.status}`,
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

  async observeStaging(
    baseUrl: string,
    deadlineAt: number,
    budget: RequestBudget,
  ): Promise<StagingObservation> {
    const versionResponse = await this.fetchWithDeadline(
      `${baseUrl}/health/version`,
      { method: 'GET', headers: { Accept: 'application/json' } },
      deadlineAt,
      budget,
    );
    if (!versionResponse.ok) {
      throw new ExternalActionAdapterError(
        'INVALID_RESPONSE',
        `staging health/version returned HTTP ${versionResponse.status}`,
        versionResponse.status >= 500,
        versionResponse.status,
      );
    }
    let version: unknown;
    try {
      version = await versionResponse.json();
    } catch {
      throw new ExternalActionAdapterError(
        'INVALID_RESPONSE',
        'staging health/version returned invalid JSON',
        false,
      );
    }
    if (
      typeof version !== 'object' ||
      version === null ||
      Array.isArray(version) ||
      typeof (version as Record<string, unknown>).commitSha !== 'string'
    ) {
      throw new ExternalActionAdapterError(
        'INVALID_RESPONSE',
        'staging health/version did not contain commitSha',
        false,
      );
    }
    const commitSha = exactSha(
      (version as Record<string, unknown>).commitSha as string,
      'staging commitSha',
    );

    const readyResponse = await this.fetchWithDeadline(
      `${baseUrl}/health/ready`,
      { method: 'GET', headers: { Accept: 'application/json' } },
      deadlineAt,
      budget,
    );
    return {
      commitSha,
      ready: readyResponse.ok,
      readyStatus: readyResponse.status,
    };
  }
}

export class GitHubActionsStagingDeployAdapter implements ExternalActionAdapter {
  readonly adapterId = 'github-actions-staging-deploy-v1';

  private readonly stagingRuntimeUrl: string | null;
  private readonly timeoutMs: number;
  private readonly pollIntervalMs: number;
  private readonly sleepImpl: SleepLike;

  constructor(
    private readonly evidence: EvidenceValidator,
    private readonly client: GitHubStagingDeployClient = new GitHubStagingDeployClient(),
    options: GitHubStagingDeployAdapterOptions = {},
  ) {
    const configuredUrl = options.stagingRuntimeUrl ?? process.env.MCF_STAGING_RUNTIME_URL;
    this.stagingRuntimeUrl = configuredUrl ? publicHttpsBaseUrl(configuredUrl) : null;
    this.timeoutMs = options.timeoutMs ?? GITHUB_STAGING_DEPLOY_TIMEOUT_MS;
    this.pollIntervalMs = options.pollIntervalMs ?? GITHUB_STAGING_DEPLOY_POLL_INTERVAL_MS;
    this.sleepImpl = options.sleepImpl ?? sleep;

    if (
      !Number.isInteger(this.timeoutMs) ||
      this.timeoutMs < 1 ||
      this.timeoutMs >= EXTERNAL_ACTION_LEASE_MS
    ) {
      throw new Error(
        'staging deploy adapter timeout must be positive and shorter than external action lease',
      );
    }
    if (!Number.isInteger(this.pollIntervalMs) || this.pollIntervalMs < 1) {
      throw new Error('staging deploy adapter poll interval must be positive');
    }
  }

  supports(request: ExternalActionRequest): boolean {
    return (
      request.skill.skillId === 'MCF-DEPLOY-VALIDATE' &&
      canonicalizeProvider(request.tool.provider) === 'github' &&
      canonicalizeToolValue(request.tool.operation) === 'deploy-staging'
    );
  }

  private unknownReceipt(
    request: ExternalActionRequest,
    target: DeployTarget,
    before: StagingObservation | null,
    run: GitHubWorkflowRun | null,
    reason: string,
    budget: RequestBudget,
  ): McfToolReceipt {
    const context = request.context!;
    return this.evidence.createTrustedReceipt({
      provider: 'github-actions',
      operation: request.tool.operation,
      resource: request.tool.resource,
      externalId: run ? String(run.id) : null,
      commitSha: target.releaseSha,
      status: 'PARTIAL',
      observedAt: new Date().toISOString(),
      metadata: {
        adapterId: this.adapterId,
        adapterVersion: '1.0.0',
        repository: target.repository,
        workflowPath: WORKFLOW_PATH,
        requestId: target.idempotencyKey,
        idempotencyKey: target.idempotencyKey,
        requestedSha: target.releaseSha,
        previousSha: before?.commitSha ?? null,
        workflowRunId: run?.id ?? null,
        workflowRunUrl: run?.html_url ?? null,
        workflowStatus: run?.status ?? null,
        workflowConclusion: run?.conclusion ?? null,
        deploymentProvider: 'render',
        targetEnvironment: 'staging',
        deploymentOutcome: 'UNKNOWN',
        deploymentStatus: 'unknown',
        smokeStatus: 'unknown',
        stagingReady: null,
        recoveryStrategy: 'REDEPLOY_PREVIOUS_HEALTHY_SHA',
        nativeRollbackClaimed: false,
        resultStatus: 'UNKNOWN',
        unknownReason: reason,
        requestBudget: { requests: budget.requests, limit: MAX_REQUESTS },
        requiredPermissions: ['actions:read', 'actions:write', 'contents:read'],
        skillId: request.skill.skillId,
        skillVersion: request.skill.version,
        agentId: request.agentId,
        missionId: context.missionId,
        phaseId: context.phaseId,
        expectedMissionVersion: context.expectedMissionVersion,
      },
    });
  }

  private receipt(
    request: ExternalActionRequest,
    target: DeployTarget,
    before: StagingObservation,
    after: StagingObservation,
    run: GitHubWorkflowRun,
    outcome: DeploymentOutcome,
    budget: RequestBudget,
  ): McfToolReceipt {
    const context = request.context!;
    const conclusion = normalizedConclusion(run.conclusion);
    if (!conclusion) {
      throw new ExternalActionAdapterError(
        'INVALID_RESPONSE',
        'completed staging workflow lacks supported conclusion',
        false,
      );
    }

    const evidenceUrls = [
      run.html_url,
      `https://github.com/${target.repository}/commit/${target.releaseSha}`,
    ];
    return this.evidence.createTrustedReceipt({
      provider: 'github-actions',
      operation: request.tool.operation,
      resource: request.tool.resource,
      externalId: String(run.id),
      commitSha: target.releaseSha,
      status: 'SUCCEEDED',
      observedAt: new Date().toISOString(),
      metadata: {
        adapterId: this.adapterId,
        adapterVersion: '1.0.0',
        repository: target.repository,
        workflowPath: WORKFLOW_PATH,
        workflowRunId: run.id,
        workflowRunUrl: run.html_url,
        workflowDisplayTitle: run.display_title,
        workflowEvent: run.event,
        workflowStatus: run.status,
        workflowConclusion: conclusion,
        conclusion,
        requestId: target.idempotencyKey,
        idempotencyKey: target.idempotencyKey,
        requestedSha: target.releaseSha,
        previousSha: before.commitSha,
        verifiedSha: after.commitSha,
        stagingReady: after.ready,
        stagingReadyStatus: after.readyStatus,
        deploymentProvider: 'render',
        targetEnvironment: 'staging',
        deploymentOutcome: outcome,
        deploymentStatus: outcome === 'RECOVERED' ? 'recovered' : 'success',
        smokeStatus: 'pass',
        rollbackAvailable: true,
        recoveryStrategy: 'REDEPLOY_PREVIOUS_HEALTHY_SHA',
        nativeRollbackClaimed: false,
        resultStatus: outcome === 'RECOVERED' ? 'RECOVERED' : 'SUCCEEDED',
        requestBudget: { requests: budget.requests, limit: MAX_REQUESTS },
        requiredPermissions: ['actions:read', 'actions:write', 'contents:read'],
        evidenceUrls,
        skillId: request.skill.skillId,
        skillVersion: request.skill.version,
        agentId: request.agentId,
        missionId: context.missionId,
        phaseId: context.phaseId,
        expectedMissionVersion: context.expectedMissionVersion,
      },
    });
  }

  private async findRun(
    target: DeployTarget,
    deadlineAt: number,
    budget: RequestBudget,
  ): Promise<GitHubWorkflowRun | null> {
    const collected: GitHubWorkflowRun[] = [];
    let totalCount: number | null = null;

    for (let page = 1; page <= MAX_RUN_PAGES; page += 1) {
      const response = await this.client.githubJson<GitHubWorkflowRunsResponse>(
        'GET',
        `/repos/${target.repository}/actions/workflows/${WORKFLOW_FILE}/runs?event=workflow_dispatch&per_page=${RUN_PAGE_SIZE}&page=${page}`,
        deadlineAt,
        budget,
      );
      if (
        !Array.isArray(response.workflow_runs) ||
        !Number.isInteger(response.total_count) ||
        response.total_count < 0
      ) {
        throw new ExternalActionAdapterError(
          'INVALID_RESPONSE',
          'GitHub workflow runs response is invalid',
          false,
        );
      }
      if (totalCount === null) totalCount = response.total_count;
      collected.push(...response.workflow_runs.map(requireWorkflowRun));

      if (collected.length >= totalCount || response.workflow_runs.length < RUN_PAGE_SIZE) break;
      if (page === MAX_RUN_PAGES) {
        throw new ExternalActionAdapterError(
          'RESERVATION_CONFLICT',
          'workflow history exceeds the bounded reconciliation window; dispatch is blocked',
          false,
        );
      }
    }

    const sameKey = collected.filter((run) => run.display_title.startsWith(target.runTitlePrefix));
    const incompatible = sameKey.filter((run) => run.display_title !== target.expectedRunTitle);
    if (incompatible.length > 0) {
      throw new ExternalActionAdapterError(
        'RESERVATION_CONFLICT',
        'staging deploy idempotency key is already bound to a different release SHA',
        false,
      );
    }

    const matching = sameKey.filter((run) => run.display_title === target.expectedRunTitle);
    if (matching.length > 1) {
      throw new ExternalActionAdapterError(
        'RESERVATION_CONFLICT',
        'multiple workflow runs match the same staging deploy idempotency key',
        false,
      );
    }
    const run = matching[0] ?? null;
    if (!run) return null;

    if (
      run.event !== 'workflow_dispatch' ||
      run.path !== WORKFLOW_PATH ||
      run.head_branch !== 'main' ||
      run.html_url.toLowerCase() !==
        `https://github.com/${target.repository}/actions/runs/${run.id}`.toLowerCase()
    ) {
      throw new ExternalActionAdapterError(
        'RESERVATION_CONFLICT',
        'matching staging workflow run has incompatible provider provenance',
        false,
      );
    }
    return run;
  }

  private async waitForRun(
    target: DeployTarget,
    deadlineAt: number,
    budget: RequestBudget,
  ): Promise<GitHubWorkflowRun | null> {
    while (Date.now() < deadlineAt) {
      const run = await this.findRun(target, deadlineAt, budget);
      if (run) return run;
      await this.sleepImpl(this.pollIntervalMs);
    }
    return null;
  }

  private async waitForCompletion(
    target: DeployTarget,
    initial: GitHubWorkflowRun,
    deadlineAt: number,
    budget: RequestBudget,
  ): Promise<GitHubWorkflowRun | null> {
    let run = initial;
    while (Date.now() < deadlineAt) {
      if (run.status.toLowerCase() === 'completed') return run;
      await this.sleepImpl(this.pollIntervalMs);
      run = requireWorkflowRun(
        await this.client.githubJson<GitHubWorkflowRun>(
          'GET',
          `/repos/${target.repository}/actions/runs/${run.id}`,
          deadlineAt,
          budget,
        ),
      );
    }
    return null;
  }

  private async readMarkerOutcome(
    target: DeployTarget,
    runId: number,
    deadlineAt: number,
    budget: RequestBudget,
  ): Promise<DeploymentOutcome | null> {
    const response = await this.client.githubJson<GitHubWorkflowJobsResponse>(
      'GET',
      `/repos/${target.repository}/actions/runs/${runId}/jobs?per_page=100`,
      deadlineAt,
      budget,
    );
    if (
      !Array.isArray(response.jobs) ||
      !Number.isInteger(response.total_count) ||
      response.total_count !== response.jobs.length
    ) {
      throw new ExternalActionAdapterError(
        'INVALID_RESPONSE',
        'GitHub workflow jobs response is incomplete or invalid',
        false,
      );
    }
    const jobs = response.jobs.map(requireWorkflowJob);
    if (jobs.some((job) => job.run_id !== runId)) {
      throw new ExternalActionAdapterError(
        'INVALID_RESPONSE',
        'workflow jobs are not bound to the expected run id',
        false,
      );
    }
    return markerOutcome(jobs);
  }

  async execute(request: ExternalActionRequest): Promise<McfToolReceipt> {
    const target = resolveTarget(request);
    if (!this.stagingRuntimeUrl) {
      throw new ExternalActionAdapterError(
        'INVALID_CONTEXT',
        'MCF_STAGING_RUNTIME_URL is required for staging deploy verification',
        false,
      );
    }

    const deadlineAt = Date.now() + this.timeoutMs;
    const budget: RequestBudget = { requests: 0 };
    let run: GitHubWorkflowRun | null;
    try {
      run = await this.findRun(target, deadlineAt, budget);
    } catch (error) {
      if (
        error instanceof ExternalActionAdapterError &&
        error.code === 'RESERVATION_CONFLICT' &&
        error.message === 'multiple workflow runs match the same staging deploy idempotency key'
      ) {
        return this.unknownReceipt(
          request,
          target,
          null,
          null,
          'multiple correlated workflow runs make the staging deployment state ambiguous',
          budget,
        );
      }
      throw error;
    }
    const runWasExisting = run !== null;
    let before: StagingObservation;
    try {
      before = await this.client.observeStaging(this.stagingRuntimeUrl, deadlineAt, budget);
      if (!before.ready) {
        throw new ExternalActionAdapterError(
          'RESERVATION_CONFLICT',
          `staging runtime is not healthy before deploy; HTTP ${before.readyStatus}`,
          false,
        );
      }

      const mainRef = await this.client.githubJson<GitHubRefResponse>(
        'GET',
        `/repos/${target.repository}/git/ref/heads/main`,
        deadlineAt,
        budget,
      );
      if (mainRef.ref !== 'refs/heads/main') {
        throw new ExternalActionAdapterError(
          'INVALID_RESPONSE',
          'GitHub main ref response is invalid',
          false,
        );
      }
      const mainSha = exactSha(mainRef.object?.sha ?? '', 'provider main SHA');

      const commit = await this.client.githubJson<GitHubCommitResponse>(
        'GET',
        `/repos/${target.repository}/commits/${target.releaseSha}`,
        deadlineAt,
        budget,
      );
      if (
        exactSha(commit.sha, 'provider release SHA') !== target.releaseSha ||
        commit.html_url.toLowerCase() !==
          `https://github.com/${target.repository}/commit/${target.releaseSha}`.toLowerCase()
      ) {
        throw new ExternalActionAdapterError(
          'INVALID_RESPONSE',
          'GitHub did not verify the exact staging release commit',
          false,
        );
      }

      const compare = await this.client.githubJson<GitHubCompareResponse>(
        'GET',
        `/repos/${target.repository}/compare/${target.releaseSha}...${mainSha}`,
        deadlineAt,
        budget,
      );
      const mergeBase = exactSha(compare.merge_base_commit?.sha ?? '', 'provider merge-base SHA');
      if (!['ahead', 'identical'].includes(compare.status) || mergeBase !== target.releaseSha) {
        throw new ExternalActionAdapterError(
          'RESERVATION_CONFLICT',
          'staging release must be the current main commit or an ancestor of main',
          false,
        );
      }
    } catch (error) {
      if (runWasExisting) {
        return this.unknownReceipt(
          request,
          target,
          null,
          run,
          `existing correlated workflow run could not be safely reconciled during preflight: ${error instanceof Error ? error.message : 'unknown preflight error'}`,
          budget,
        );
      }
      throw error;
    }
    if (!run) {
      try {
        await this.client.githubVoid(
          'POST',
          `/repos/${target.repository}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
          deadlineAt,
          budget,
          {
            ref: 'main',
            inputs: {
              release_sha: target.releaseSha,
              request_id: target.idempotencyKey,
            },
          },
        );
      } catch (error) {
        if (!(error instanceof ExternalActionAdapterError) || !error.retryable) throw error;
      }

      try {
        run = await this.waitForRun(target, deadlineAt, budget);
      } catch (error) {
        return this.unknownReceipt(
          request,
          target,
          before,
          null,
          `workflow dispatch may have occurred but reconciliation failed: ${error instanceof Error ? error.message : 'unknown reconciliation error'}`,
          budget,
        );
      }
      if (!run) {
        return this.unknownReceipt(
          request,
          target,
          before,
          null,
          'workflow dispatch could not be correlated before adapter deadline',
          budget,
        );
      }
    }

    let completed: GitHubWorkflowRun | null;
    try {
      completed = await this.waitForCompletion(target, run, deadlineAt, budget);
    } catch (error) {
      return this.unknownReceipt(
        request,
        target,
        before,
        run,
        `workflow run could not be reconciled after external execution became possible: ${error instanceof Error ? error.message : 'unknown reconciliation error'}`,
        budget,
      );
    }
    if (!completed) {
      return this.unknownReceipt(
        request,
        target,
        before,
        run,
        'workflow run did not reach a terminal state before adapter deadline',
        budget,
      );
    }

    const conclusion = normalizedConclusion(completed.conclusion);
    if (!conclusion) {
      return this.unknownReceipt(
        request,
        target,
        before,
        completed,
        'workflow completed with unsupported conclusion',
        budget,
      );
    }

    let outcome: DeploymentOutcome | null;
    try {
      outcome = await this.readMarkerOutcome(target, completed.id, deadlineAt, budget);
    } catch (error) {
      return this.unknownReceipt(
        request,
        target,
        before,
        completed,
        `workflow result marker could not be verified: ${error instanceof Error ? error.message : 'unknown marker error'}`,
        budget,
      );
    }
    if (!outcome) {
      return this.unknownReceipt(
        request,
        target,
        before,
        completed,
        'workflow did not expose exactly one trusted deployment result marker',
        budget,
      );
    }

    let after: StagingObservation;
    try {
      after = await this.client.observeStaging(this.stagingRuntimeUrl, deadlineAt, budget);
    } catch (error) {
      return this.unknownReceipt(
        request,
        target,
        before,
        completed,
        `final staging state could not be verified: ${error instanceof Error ? error.message : 'unknown staging observation error'}`,
        budget,
      );
    }

    if (runWasExisting && outcome !== 'NOOP') {
      return this.unknownReceipt(
        request,
        target,
        before,
        completed,
        'existing workflow run was reconciled without durable proof of its original pre-deploy SHA',
        budget,
      );
    }

    if (
      (outcome === 'DEPLOYED' || outcome === 'NOOP') &&
      conclusion === 'success' &&
      after.ready &&
      after.commitSha === target.releaseSha &&
      (outcome !== 'NOOP' || before.commitSha === target.releaseSha)
    ) {
      return this.receipt(request, target, before, after, completed, outcome, budget);
    }

    if (
      outcome === 'RECOVERED' &&
      conclusion === 'failure' &&
      after.ready &&
      before.commitSha !== target.releaseSha &&
      after.commitSha === before.commitSha
    ) {
      return this.receipt(request, target, before, after, completed, outcome, budget);
    }

    return this.unknownReceipt(
      request,
      target,
      before,
      completed,
      'workflow result and final staging state are inconsistent',
      budget,
    );
  }
}
