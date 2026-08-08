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
type HttpMethod = 'GET' | 'POST';

interface RequestBudget {
  requests: number;
}

interface GitHubRefResponse {
  ref: string;
  object: { sha: string; type?: string };
}

interface GitHubCommitResponse {
  sha: string;
  html_url: string;
}

interface GitHubPullResponse {
  number: number;
  html_url: string;
  state: string;
  body: string | null;
  head: { ref: string; sha: string };
  base: { ref: string; sha: string };
}

interface BranchPrTarget {
  repository: string;
  owner: string;
  baseRef: string;
  baseSha: string;
  headSha: string;
  branchRef: string;
  title: string;
  body: string;
  idempotencyKey: string;
}

export const GITHUB_BRANCH_PR_TIMEOUT_MS = 5 * 60_000;
const MAX_REQUESTS = 30;
const SHA_40 = /^[a-f0-9]{40}$/u;
const REPOSITORY =
  /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?\/(?!\.{1,2}$)[A-Za-z0-9._-]{1,100}$/u;
const SAFE_REF =
  /^(?!\/)(?!.*\.\.)(?!.*(?:^|\/)\.)(?!.*[~^:?*\[\\\s])(?!.*\/$)(?!.*\.lock$)[A-Za-z0-9._\/-]{1,200}$/u;
const IDEMPOTENCY_KEY = /^[A-Za-z0-9][A-Za-z0-9._:-]{15,127}$/u;

if (GITHUB_BRANCH_PR_TIMEOUT_MS >= EXTERNAL_ACTION_LEASE_MS) {
  throw new Error('GitHub branch/PR timeout must remain shorter than the external action lease');
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

function safeRef(value: string, label: string): string {
  if (!SAFE_REF.test(value) || value.startsWith('refs/') || value.endsWith('.')) {
    throw new ExternalActionAdapterError(
      'INVALID_CONTEXT',
      `${label} is not a supported GitHub branch ref`,
      false,
    );
  }
  return value;
}

function idempotencyMarker(key: string): string {
  return `<!-- mcf-idempotency:${key} -->`;
}

function resolveTarget(request: ExternalActionRequest): BranchPrTarget {
  if (!request.context) {
    throw new ExternalActionAdapterError(
      'INVALID_CONTEXT',
      'GitHub branch/PR write requires governed execution context',
      false,
    );
  }
  if (!REPOSITORY.test(request.tool.resource)) {
    throw new ExternalActionAdapterError(
      'UNSUPPORTED_TARGET',
      'GitHub branch/PR write requires canonical owner/repository resource',
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

  const baseRef = safeRef(requireString(request.inputs, 'base_branch'), 'base_branch');
  const baseSha = exactSha(requireString(request.inputs, 'base_sha'), 'base_sha');
  const headSha = exactSha(requireString(request.inputs, 'commit_sha'), 'commit_sha');
  const branchRef = safeRef(requireString(request.inputs, 'branch_ref'), 'branch_ref');
  if (
    branchRef.toLowerCase() === 'main' ||
    branchRef.toLowerCase() === 'master' ||
    branchRef === baseRef
  ) {
    throw new ExternalActionAdapterError(
      'INVALID_CONTEXT',
      'branch_ref must be a new non-protected branch distinct from base_branch',
      false,
    );
  }

  const idempotencyKey = requireString(request.inputs, 'idempotency_key');
  if (!IDEMPOTENCY_KEY.test(idempotencyKey)) {
    throw new ExternalActionAdapterError(
      'INVALID_CONTEXT',
      'idempotency_key must be 16-128 safe characters',
      false,
    );
  }

  const title = requireString(request.inputs, 'change_summary');
  const risk = requireString(request.inputs, 'risk_summary');
  const marker = idempotencyMarker(idempotencyKey);
  const body = `${marker}\n\n## MCF controlled change\n\n${title}\n\n### Risk\n\n${risk}`;

  return {
    repository,
    owner: repository.split('/')[0]!,
    baseRef,
    baseSha,
    headSha,
    branchRef,
    title,
    body,
    idempotencyKey,
  };
}

function encodeRef(ref: string): string {
  return ref.split('/').map(encodeURIComponent).join('/');
}

function assertRef(response: GitHubRefResponse, expectedRef: string, expectedSha: string): void {
  if (
    response.ref !== `refs/heads/${expectedRef}` ||
    exactSha(response.object?.sha ?? '', 'provider ref SHA') !== expectedSha
  ) {
    throw new ExternalActionAdapterError(
      'RESERVATION_CONFLICT',
      `GitHub branch ${expectedRef} does not match the expected SHA`,
      false,
    );
  }
}

function assertPull(pull: GitHubPullResponse, target: BranchPrTarget): void {
  if (
    !Number.isInteger(pull.number) ||
    pull.number < 1 ||
    typeof pull.html_url !== 'string' ||
    !pull.html_url.startsWith(`https://github.com/${target.repository}/pull/`) ||
    pull.head?.ref !== target.branchRef ||
    exactSha(pull.head?.sha ?? '', 'provider PR head SHA') !== target.headSha ||
    pull.base?.ref !== target.baseRef ||
    exactSha(pull.base?.sha ?? '', 'provider PR base SHA') !== target.baseSha ||
    typeof pull.body !== 'string' ||
    !pull.body.includes(idempotencyMarker(target.idempotencyKey))
  ) {
    throw new ExternalActionAdapterError(
      'RESERVATION_CONFLICT',
      'GitHub pull request does not match the controlled MCF write',
      false,
    );
  }
}

function shouldReconcileMutationError(error: unknown): error is ExternalActionAdapterError {
  return (
    error instanceof ExternalActionAdapterError &&
    (error.retryable || error.code === 'RESERVATION_CONFLICT')
  );
}

export class GitHubBranchPrClient {
  constructor(
    private readonly fetcher: FetchLike = globalThis.fetch,
    private readonly token: string | undefined = process.env.MCF_GITHUB_TOKEN ??
      process.env.GITHUB_TOKEN,
  ) {}

  async requestJson<T>(
    method: HttpMethod,
    path: string,
    deadlineAt: number,
    budget: RequestBudget,
    body?: Record<string, unknown>,
    allowNotFound = false,
  ): Promise<T | null> {
    if (!path.startsWith('/repos/') || path.includes('://') || !['GET', 'POST'].includes(method)) {
      throw new ExternalActionAdapterError(
        'UNSUPPORTED_TARGET',
        'GitHub branch/PR client rejected an unsupported request path or method',
        false,
      );
    }

    budget.requests += 1;
    if (budget.requests > MAX_REQUESTS) {
      throw new ExternalActionAdapterError(
        'INVALID_RESPONSE',
        'GitHub branch/PR request budget exceeded',
        false,
      );
    }

    const remaining = deadlineAt - Date.now();
    if (remaining <= 0) {
      throw new ExternalActionAdapterError(
        'ADAPTER_TIMEOUT',
        'GitHub branch/PR adapter exceeded its execution deadline',
        true,
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), remaining);
    try {
      let response: Response;
      try {
        response = await this.fetcher(`https://api.github.com${path}`, {
          method,
          signal: controller.signal,
          headers: {
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
            'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'mcf-runtime-branch-pr-adapter',
            ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
          },
          ...(body ? { body: JSON.stringify(body) } : {}),
        });
      } catch (error) {
        if (controller.signal.aborted) {
          throw new ExternalActionAdapterError(
            'ADAPTER_TIMEOUT',
            'GitHub branch/PR adapter exceeded its execution deadline',
            true,
          );
        }
        throw new ExternalActionAdapterError(
          'NETWORK_FAILURE',
          error instanceof Error ? error.message : 'GitHub branch/PR network request failed',
          true,
        );
      }

      if (allowNotFound && response.status === 404) return null;
      if (!response.ok) {
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
            'GitHub authentication or write permission is required',
            false,
            response.status,
          );
        }
        if (response.status === 404) {
          throw new ExternalActionAdapterError(
            'TARGET_NOT_FOUND',
            'GitHub branch/PR target was not found',
            false,
            404,
          );
        }
        if (response.status === 409 || response.status === 422) {
          throw new ExternalActionAdapterError(
            'RESERVATION_CONFLICT',
            `GitHub rejected the controlled write with HTTP ${response.status}`,
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
        if (controller.signal.aborted) {
          throw new ExternalActionAdapterError(
            'ADAPTER_TIMEOUT',
            'GitHub branch/PR adapter exceeded its execution deadline',
            true,
          );
        }
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

export class GitHubBranchPullRequestAdapter implements ExternalActionAdapter {
  readonly adapterId = 'github-branch-pr-write-v1';

  constructor(
    private readonly evidence: EvidenceValidator,
    private readonly client: GitHubBranchPrClient = new GitHubBranchPrClient(),
  ) {}

  supports(request: ExternalActionRequest): boolean {
    return (
      request.skill.skillId === 'MCF-GIT-PR-RELEASE' &&
      canonicalizeProvider(request.tool.provider) === 'github' &&
      canonicalizeToolValue(request.tool.operation) === 'create-branch-pr'
    );
  }

  private async getBranch(
    target: BranchPrTarget,
    deadlineAt: number,
    budget: RequestBudget,
  ): Promise<GitHubRefResponse | null> {
    return this.client.requestJson<GitHubRefResponse>(
      'GET',
      `/repos/${target.repository}/git/ref/heads/${encodeRef(target.branchRef)}`,
      deadlineAt,
      budget,
      undefined,
      true,
    );
  }

  private async findPull(
    target: BranchPrTarget,
    deadlineAt: number,
    budget: RequestBudget,
  ): Promise<GitHubPullResponse | null> {
    const head = encodeURIComponent(`${target.owner}:${target.branchRef}`);
    const base = encodeURIComponent(target.baseRef);
    const pulls = await this.client.requestJson<GitHubPullResponse[]>(
      'GET',
      `/repos/${target.repository}/pulls?state=all&head=${head}&base=${base}&per_page=100`,
      deadlineAt,
      budget,
    );
    if (!pulls) return null;
    if (!Array.isArray(pulls)) {
      throw new ExternalActionAdapterError(
        'INVALID_RESPONSE',
        'GitHub pull lookup did not return an array',
        false,
      );
    }

    const compatible = pulls.filter((pull) => {
      try {
        assertPull(pull, target);
        return true;
      } catch {
        return false;
      }
    });
    if (compatible.length > 1) {
      throw new ExternalActionAdapterError(
        'RESERVATION_CONFLICT',
        'Multiple GitHub pull requests match the same MCF idempotency key',
        false,
      );
    }
    if (compatible[0]) return compatible[0];
    if (pulls.length > 0) {
      throw new ExternalActionAdapterError(
        'RESERVATION_CONFLICT',
        'An incompatible pull request already exists for the requested branch/base',
        false,
      );
    }
    return null;
  }

  private receipt(
    request: ExternalActionRequest,
    target: BranchPrTarget,
    pull: GitHubPullResponse,
  ): McfToolReceipt {
    assertPull(pull, target);
    const context = request.context!;
    const metadata = {
      adapterId: this.adapterId,
      adapterVersion: '1.0.0',
      repository: target.repository,
      baseRef: target.baseRef,
      baseSha: target.baseSha,
      branchRef: target.branchRef,
      branchSha: target.headSha,
      verifiedHeadSha: target.headSha,
      verifiedBaseRef: target.baseRef,
      verifiedBaseSha: target.baseSha,
      pullRequestNumber: pull.number,
      pullRequestUrl: pull.html_url,
      pullRequestState: pull.state,
      idempotencyKey: target.idempotencyKey,
      externalEffect: 'REVERSIBLE',
      resultStatus: 'SUCCEEDED',
      readBackVerified: true,
      requestBudget: { requests: null, limit: MAX_REQUESTS },
      requiredPermissions: ['metadata:read', 'contents:write', 'pull_requests:write'],
      evidenceUrls: [
        `https://github.com/${target.repository}/commit/${target.headSha}`,
        `https://github.com/${target.repository}/tree/${encodeURIComponent(target.branchRef)}`,
        pull.html_url,
      ],
      skillId: request.skill.skillId,
      skillVersion: request.skill.version,
      agentId: request.agentId,
      missionId: context.missionId,
      phaseId: context.phaseId,
      expectedMissionVersion: context.expectedMissionVersion,
    };
    return this.evidence.createTrustedReceipt({
      provider: 'github',
      operation: request.tool.operation,
      resource: request.tool.resource,
      externalId: String(pull.number),
      commitSha: target.headSha,
      status: 'SUCCEEDED',
      observedAt: new Date().toISOString(),
      metadata,
    });
  }

  async execute(request: ExternalActionRequest): Promise<McfToolReceipt> {
    const deadlineAt = Date.now() + GITHUB_BRANCH_PR_TIMEOUT_MS;
    const budget: RequestBudget = { requests: 0 };
    const target = resolveTarget(request);

    const base = await this.client.requestJson<GitHubRefResponse>(
      'GET',
      `/repos/${target.repository}/git/ref/heads/${encodeRef(target.baseRef)}`,
      deadlineAt,
      budget,
    );
    if (!base) {
      throw new ExternalActionAdapterError('TARGET_NOT_FOUND', 'Base branch was not found', false);
    }
    assertRef(base, target.baseRef, target.baseSha);

    const commit = await this.client.requestJson<GitHubCommitResponse>(
      'GET',
      `/repos/${target.repository}/commits/${target.headSha}`,
      deadlineAt,
      budget,
    );
    if (!commit || exactSha(commit.sha, 'provider commit SHA') !== target.headSha) {
      throw new ExternalActionAdapterError(
        'INVALID_RESPONSE',
        'GitHub did not verify the exact requested head SHA',
        false,
      );
    }

    let branch = await this.getBranch(target, deadlineAt, budget);
    if (branch) {
      assertRef(branch, target.branchRef, target.headSha);
    } else {
      try {
        await this.client.requestJson<GitHubRefResponse>(
          'POST',
          `/repos/${target.repository}/git/refs`,
          deadlineAt,
          budget,
          { ref: `refs/heads/${target.branchRef}`, sha: target.headSha },
        );
      } catch (error) {
        if (!shouldReconcileMutationError(error)) throw error;
        branch = await this.getBranch(target, deadlineAt, budget);
        if (!branch) throw error;
      }

      branch = await this.getBranch(target, deadlineAt, budget);
      if (!branch) {
        throw new ExternalActionAdapterError(
          'INVALID_RESPONSE',
          'GitHub branch creation could not be verified by read-back',
          true,
        );
      }
      assertRef(branch, target.branchRef, target.headSha);
    }

    let pull = await this.findPull(target, deadlineAt, budget);
    if (!pull) {
      try {
        await this.client.requestJson<GitHubPullResponse>(
          'POST',
          `/repos/${target.repository}/pulls`,
          deadlineAt,
          budget,
          {
            title: target.title,
            head: target.branchRef,
            base: target.baseRef,
            body: target.body,
          },
        );
      } catch (error) {
        if (!shouldReconcileMutationError(error)) throw error;
        pull = await this.findPull(target, deadlineAt, budget);
        if (!pull) throw error;
      }

      pull = await this.findPull(target, deadlineAt, budget);
      if (!pull) {
        throw new ExternalActionAdapterError(
          'INVALID_RESPONSE',
          'GitHub pull request creation could not be verified by read-back',
          true,
        );
      }
    }

    assertPull(pull, target);
    const receipt = this.receipt(request, target, pull);
    receipt.metadata.requestBudget = { requests: budget.requests, limit: MAX_REQUESTS };
    return this.evidence.createTrustedReceipt({
      provider: receipt.provider,
      operation: receipt.operation,
      resource: receipt.resource,
      externalId: receipt.externalId,
      commitSha: receipt.commitSha,
      status: receipt.status,
      observedAt: receipt.observedAt,
      metadata: receipt.metadata,
    });
  }
}
