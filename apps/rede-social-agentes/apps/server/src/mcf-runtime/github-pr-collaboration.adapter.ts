import { createHash } from 'node:crypto';

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
type HttpMethod = 'GET' | 'POST' | 'PATCH';
type CollaborationOperation = 'comment-pr' | 'review-pr-comment' | 'update-pr-text-metadata';
type UnknownWriteStage = 'COMMENT_PR' | 'REVIEW_PR_COMMENT' | 'UPDATE_PR_TEXT_METADATA';

interface RequestBudget {
  requests: number;
}

interface GitHubPullResponse {
  number: number;
  html_url: string;
  state: string;
  title: string;
  body: string | null;
  head: { ref: string; sha: string };
  base: { ref: string; sha?: string };
}

interface GitHubIssueCommentResponse {
  id: number;
  html_url: string;
  body: string | null;
}

interface GitHubReviewResponse {
  id: number;
  html_url: string;
  body: string | null;
  state: string;
  commit_id: string;
}

interface PullCollaborationTarget {
  repository: string;
  pullNumber: number;
  expectedHeadSha: string;
  idempotencyKey: string;
  operation: CollaborationOperation;
  text: string | null;
  title: string | null;
  body: string | null;
}

export const GITHUB_PR_COLLABORATION_TIMEOUT_MS = 5 * 60_000;
const MAX_REQUESTS = 30;
const MAX_LOOKUP_PAGES = 10;
const PAGE_SIZE = 100;
const SHA_40 = /^[a-f0-9]{40}$/u;
const REPOSITORY =
  /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?\/(?!\.{1,2}$)[A-Za-z0-9._-]{1,100}$/u;
const IDEMPOTENCY_KEY = /^[A-Za-z0-9][A-Za-z0-9._:-]{15,127}$/u;
const COMMENT_LIMIT = 20_000;
const TITLE_LIMIT = 256;
const BODY_LIMIT = 65_000;
const FORBIDDEN_INPUT_KEYS = [
  'state',
  'base',
  'base_branch',
  'maintainer_can_modify',
  'merge',
  'merge_method',
  'review_event',
  'event',
];

if (GITHUB_PR_COLLABORATION_TIMEOUT_MS >= EXTERNAL_ACTION_LEASE_MS) {
  throw new Error('GitHub PR collaboration timeout must remain shorter than the external action lease');
}

function requireString(inputs: Record<string, unknown>, key: string, limit?: number): string {
  const value = inputs[key];
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value !== value.trim() ||
    (limit !== undefined && value.length > limit)
  ) {
    throw new ExternalActionAdapterError(
      'INVALID_CONTEXT',
      `${key} must be a non-empty trimmed string${limit ? ` within ${limit} characters` : ''}`,
      false,
    );
  }
  return value;
}

function optionalString(
  inputs: Record<string, unknown>,
  key: string,
  limit: number,
): string | null {
  if (inputs[key] === undefined || inputs[key] === null) return null;
  return requireString(inputs, key, limit);
}

function positiveInteger(inputs: Record<string, unknown>, key: string): number {
  const value = inputs[key];
  if (!Number.isInteger(value) || (value as number) < 1) {
    throw new ExternalActionAdapterError(
      'INVALID_CONTEXT',
      `${key} must be a positive integer`,
      false,
    );
  }
  return value as number;
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

function idempotencyMarker(key: string): string {
  return `<!-- mcf-idempotency:${key} -->`;
}

function rejectSpoofedMarker(value: string, label: string): void {
  if (value.includes('<!-- mcf-idempotency:')) {
    throw new ExternalActionAdapterError(
      'INVALID_CONTEXT',
      `${label} cannot contain an MCF idempotency marker`,
      false,
    );
  }
}

function textDigest(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function metadataPatchDigest(title: string | null, body: string | null): string {
  return createHash('sha256').update(JSON.stringify({ title, body })).digest('hex');
}

function resolveTarget(request: ExternalActionRequest): PullCollaborationTarget {
  if (!request.context) {
    throw new ExternalActionAdapterError(
      'INVALID_CONTEXT',
      'GitHub PR collaboration write requires governed execution context',
      false,
    );
  }
  if (!REPOSITORY.test(request.tool.resource)) {
    throw new ExternalActionAdapterError(
      'UNSUPPORTED_TARGET',
      'GitHub PR collaboration write requires canonical owner/repository resource',
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

  const pullNumber = positiveInteger(request.inputs, 'pull_request_number');
  const expectedHeadSha = exactSha(
    requireString(request.inputs, 'expected_head_sha'),
    'expected_head_sha',
  );
  const idempotencyKey = requireString(request.inputs, 'idempotency_key');
  if (!IDEMPOTENCY_KEY.test(idempotencyKey)) {
    throw new ExternalActionAdapterError(
      'INVALID_CONTEXT',
      'idempotency_key must be 16-128 safe characters',
      false,
    );
  }

  for (const key of FORBIDDEN_INPUT_KEYS) {
    if (request.inputs[key] !== undefined) {
      throw new ExternalActionAdapterError(
        'INVALID_CONTEXT',
        `${key} is forbidden for controlled PR collaboration writes`,
        false,
      );
    }
  }

  const operation = canonicalizeToolValue(request.tool.operation) as CollaborationOperation;
  if (!['comment-pr', 'review-pr-comment', 'update-pr-text-metadata'].includes(operation)) {
    throw new ExternalActionAdapterError(
      'UNSUPPORTED_TARGET',
      'Unsupported GitHub PR collaboration operation',
      false,
    );
  }

  let text: string | null = null;
  let title: string | null = null;
  let body: string | null = null;

  if (operation === 'comment-pr') {
    text = requireString(request.inputs, 'comment_body', COMMENT_LIMIT);
    rejectSpoofedMarker(text, 'comment_body');
  } else if (operation === 'review-pr-comment') {
    text = requireString(request.inputs, 'review_body', COMMENT_LIMIT);
    rejectSpoofedMarker(text, 'review_body');
  } else {
    title = optionalString(request.inputs, 'title', TITLE_LIMIT);
    body = optionalString(request.inputs, 'body', BODY_LIMIT);
    if (title === null && body === null) {
      throw new ExternalActionAdapterError(
        'INVALID_CONTEXT',
        'update-pr-text-metadata requires title and/or body',
        false,
      );
    }
  }

  return {
    repository,
    pullNumber,
    expectedHeadSha,
    idempotencyKey,
    operation,
    text,
    title,
    body,
  };
}

function assertPull(pull: GitHubPullResponse, target: PullCollaborationTarget): void {
  if (
    !Number.isInteger(pull.number) ||
    pull.number !== target.pullNumber ||
    typeof pull.html_url !== 'string' ||
    pull.html_url !== `https://github.com/${target.repository}/pull/${target.pullNumber}` ||
    pull.state !== 'open' ||
    typeof pull.title !== 'string' ||
    exactSha(pull.head?.sha ?? '', 'provider PR head SHA') !== target.expectedHeadSha
  ) {
    throw new ExternalActionAdapterError(
      'RESERVATION_CONFLICT',
      'GitHub pull request does not match the controlled collaboration target',
      false,
    );
  }
}

function assertComment(
  comment: GitHubIssueCommentResponse,
  target: PullCollaborationTarget,
  expectedBody: string,
): void {
  if (
    !Number.isInteger(comment.id) ||
    comment.id < 1 ||
    comment.html_url !==
      `https://github.com/${target.repository}/pull/${target.pullNumber}#issuecomment-${comment.id}` ||
    comment.body !== expectedBody
  ) {
    throw new ExternalActionAdapterError(
      'RESERVATION_CONFLICT',
      'GitHub PR comment does not match the controlled collaboration write',
      false,
    );
  }
}

function assertReview(
  review: GitHubReviewResponse,
  target: PullCollaborationTarget,
  expectedBody: string,
): void {
  if (
    !Number.isInteger(review.id) ||
    review.id < 1 ||
    typeof review.html_url !== 'string' ||
    !review.html_url.startsWith(`https://github.com/${target.repository}/pull/${target.pullNumber}#`) ||
    review.body !== expectedBody ||
    review.state !== 'COMMENTED' ||
    exactSha(review.commit_id ?? '', 'provider review commit SHA') !== target.expectedHeadSha
  ) {
    throw new ExternalActionAdapterError(
      'RESERVATION_CONFLICT',
      'GitHub PR review does not match the controlled COMMENT-only write',
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

function isAmbiguousMutationError(error: unknown): error is ExternalActionAdapterError {
  return error instanceof ExternalActionAdapterError && error.retryable;
}

export class GitHubPullCollaborationClient {
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
  ): Promise<T> {
    if (
      !path.startsWith('/repos/') ||
      path.includes('://') ||
      !['GET', 'POST', 'PATCH'].includes(method)
    ) {
      throw new ExternalActionAdapterError(
        'UNSUPPORTED_TARGET',
        'GitHub PR collaboration client rejected an unsupported request path or method',
        false,
      );
    }

    budget.requests += 1;
    if (budget.requests > MAX_REQUESTS) {
      throw new ExternalActionAdapterError(
        'INVALID_RESPONSE',
        'GitHub PR collaboration request budget exceeded',
        false,
      );
    }

    const remaining = deadlineAt - Date.now();
    if (remaining <= 0) {
      throw new ExternalActionAdapterError(
        'ADAPTER_TIMEOUT',
        'GitHub PR collaboration adapter exceeded its execution deadline',
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
            'User-Agent': 'mcf-runtime-pr-collaboration-adapter',
            ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
          },
          ...(body ? { body: JSON.stringify(body) } : {}),
        });
      } catch (error) {
        if (controller.signal.aborted) {
          throw new ExternalActionAdapterError(
            'ADAPTER_TIMEOUT',
            'GitHub PR collaboration adapter exceeded its execution deadline',
            true,
          );
        }
        throw new ExternalActionAdapterError(
          'NETWORK_FAILURE',
          error instanceof Error ? error.message : 'GitHub PR collaboration network request failed',
          true,
        );
      }

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
            'GitHub authentication or PR write permission is required',
            false,
            response.status,
          );
        }
        if (response.status === 404) {
          throw new ExternalActionAdapterError(
            'TARGET_NOT_FOUND',
            'GitHub PR collaboration target was not found',
            false,
            404,
          );
        }
        if (response.status === 409 || response.status === 422) {
          throw new ExternalActionAdapterError(
            'RESERVATION_CONFLICT',
            `GitHub rejected the controlled PR collaboration write with HTTP ${response.status}`,
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
            'GitHub PR collaboration adapter exceeded its execution deadline',
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

export class GitHubPullCollaborationAdapter implements ExternalActionAdapter {
  readonly adapterId = 'github-pr-collaboration-write-v1';

  constructor(
    private readonly evidence: EvidenceValidator,
    private readonly client: GitHubPullCollaborationClient = new GitHubPullCollaborationClient(),
  ) {}

  supports(request: ExternalActionRequest): boolean {
    const operation = canonicalizeToolValue(request.tool.operation);
    return (
      request.skill.skillId === 'MCF-GIT-PR-RELEASE' &&
      canonicalizeProvider(request.tool.provider) === 'github' &&
      ['comment-pr', 'review-pr-comment', 'update-pr-text-metadata'].includes(operation)
    );
  }

  private async readPull(
    target: PullCollaborationTarget,
    deadlineAt: number,
    budget: RequestBudget,
  ): Promise<GitHubPullResponse> {
    const pull = await this.client.requestJson<GitHubPullResponse>(
      'GET',
      `/repos/${target.repository}/pulls/${target.pullNumber}`,
      deadlineAt,
      budget,
    );
    assertPull(pull, target);
    return pull;
  }

  private unknownReceipt(
    request: ExternalActionRequest,
    target: PullCollaborationTarget,
    stage: UnknownWriteStage,
    budget: RequestBudget,
  ): McfToolReceipt {
    const context = request.context!;
    return this.evidence.createTrustedReceipt({
      provider: 'github',
      operation: request.tool.operation,
      resource: request.tool.resource,
      externalId: null,
      commitSha: target.expectedHeadSha,
      status: 'PARTIAL',
      observedAt: new Date().toISOString(),
      metadata: {
        adapterId: this.adapterId,
        adapterVersion: '1.0.0',
        repository: target.repository,
        pullRequestNumber: target.pullNumber,
        verifiedHeadSha: target.expectedHeadSha,
        idempotencyKey: target.idempotencyKey,
        mutationType: target.operation,
        externalEffect: 'REVERSIBLE',
        resultStatus: 'UNKNOWN',
        readBackVerified: false,
        unknownStage: stage,
        requestBudget: { requests: budget.requests, limit: MAX_REQUESTS },
        requiredPermissions: ['metadata:read', 'pull_requests:write'],
        skillId: request.skill.skillId,
        skillVersion: request.skill.version,
        agentId: request.agentId,
        missionId: context.missionId,
        phaseId: context.phaseId,
        expectedMissionVersion: context.expectedMissionVersion,
      },
    });
  }

  private async findComment(
    target: PullCollaborationTarget,
    expectedBody: string,
    deadlineAt: number,
    budget: RequestBudget,
  ): Promise<GitHubIssueCommentResponse | null> {
    const marker = idempotencyMarker(target.idempotencyKey);
    const matches: GitHubIssueCommentResponse[] = [];
    let complete = false;
    for (let page = 1; page <= MAX_LOOKUP_PAGES; page += 1) {
      const comments = await this.client.requestJson<GitHubIssueCommentResponse[]>(
        'GET',
        `/repos/${target.repository}/issues/${target.pullNumber}/comments?per_page=${PAGE_SIZE}&page=${page}`,
        deadlineAt,
        budget,
      );
      if (!Array.isArray(comments)) {
        throw new ExternalActionAdapterError(
          'INVALID_RESPONSE',
          'GitHub PR comment lookup did not return an array',
          false,
        );
      }
      matches.push(...comments.filter((comment) => comment.body?.includes(marker)));
      if (comments.length < PAGE_SIZE) {
        complete = true;
        break;
      }
    }
    if (!complete) {
      throw new ExternalActionAdapterError(
        'INVALID_RESPONSE',
        'GitHub PR comment lookup exceeded the bounded reconciliation window',
        false,
      );
    }
    if (matches.length > 1) {
      throw new ExternalActionAdapterError(
        'RESERVATION_CONFLICT',
        'Multiple GitHub PR comments match the same MCF idempotency key',
        false,
      );
    }
    if (!matches[0]) return null;
    assertComment(matches[0], target, expectedBody);
    return matches[0];
  }

  private async findReview(
    target: PullCollaborationTarget,
    expectedBody: string,
    deadlineAt: number,
    budget: RequestBudget,
  ): Promise<GitHubReviewResponse | null> {
    const marker = idempotencyMarker(target.idempotencyKey);
    const matches: GitHubReviewResponse[] = [];
    let complete = false;
    for (let page = 1; page <= MAX_LOOKUP_PAGES; page += 1) {
      const reviews = await this.client.requestJson<GitHubReviewResponse[]>(
        'GET',
        `/repos/${target.repository}/pulls/${target.pullNumber}/reviews?per_page=${PAGE_SIZE}&page=${page}`,
        deadlineAt,
        budget,
      );
      if (!Array.isArray(reviews)) {
        throw new ExternalActionAdapterError(
          'INVALID_RESPONSE',
          'GitHub PR review lookup did not return an array',
          false,
        );
      }
      matches.push(...reviews.filter((review) => review.body?.includes(marker)));
      if (reviews.length < PAGE_SIZE) {
        complete = true;
        break;
      }
    }
    if (!complete) {
      throw new ExternalActionAdapterError(
        'INVALID_RESPONSE',
        'GitHub PR review lookup exceeded the bounded reconciliation window',
        false,
      );
    }
    if (matches.length > 1) {
      throw new ExternalActionAdapterError(
        'RESERVATION_CONFLICT',
        'Multiple GitHub PR reviews match the same MCF idempotency key',
        false,
      );
    }
    if (!matches[0]) return null;
    assertReview(matches[0], target, expectedBody);
    return matches[0];
  }

  private receipt(
    request: ExternalActionRequest,
    target: PullCollaborationTarget,
    externalId: number,
    externalUrl: string,
    contentDigest: string,
    budget: RequestBudget,
  ): McfToolReceipt {
    const context = request.context!;
    return this.evidence.createTrustedReceipt({
      provider: 'github',
      operation: request.tool.operation,
      resource: request.tool.resource,
      externalId: String(externalId),
      commitSha: target.expectedHeadSha,
      status: 'SUCCEEDED',
      observedAt: new Date().toISOString(),
      metadata: {
        adapterId: this.adapterId,
        adapterVersion: '1.0.0',
        repository: target.repository,
        pullRequestNumber: target.pullNumber,
        pullRequestUrl: `https://github.com/${target.repository}/pull/${target.pullNumber}`,
        verifiedHeadSha: target.expectedHeadSha,
        idempotencyKey: target.idempotencyKey,
        mutationType: target.operation,
        mutationExternalId: externalId,
        mutationUrl: externalUrl,
        contentDigest,
        externalEffect: 'REVERSIBLE',
        resultStatus: 'SUCCEEDED',
        readBackVerified: true,
        requestBudget: { requests: budget.requests, limit: MAX_REQUESTS },
        requiredPermissions: ['metadata:read', 'pull_requests:write'],
        evidenceUrls: [
          `https://github.com/${target.repository}/pull/${target.pullNumber}`,
          externalUrl,
        ],
        skillId: request.skill.skillId,
        skillVersion: request.skill.version,
        agentId: request.agentId,
        missionId: context.missionId,
        phaseId: context.phaseId,
        expectedMissionVersion: context.expectedMissionVersion,
      },
    });
  }

  private metadataReceipt(
    request: ExternalActionRequest,
    target: PullCollaborationTarget,
    pull: GitHubPullResponse,
    budget: RequestBudget,
  ): McfToolReceipt {
    const context = request.context!;
    const pullUrl = `https://github.com/${target.repository}/pull/${target.pullNumber}`;
    return this.evidence.createTrustedReceipt({
      provider: 'github',
      operation: request.tool.operation,
      resource: request.tool.resource,
      externalId: String(target.pullNumber),
      commitSha: target.expectedHeadSha,
      status: 'SUCCEEDED',
      observedAt: new Date().toISOString(),
      metadata: {
        adapterId: this.adapterId,
        adapterVersion: '1.0.0',
        repository: target.repository,
        pullRequestNumber: target.pullNumber,
        pullRequestUrl: pullUrl,
        verifiedHeadSha: target.expectedHeadSha,
        idempotencyKey: target.idempotencyKey,
        mutationType: target.operation,
        mutationExternalId: target.pullNumber,
        mutationUrl: pullUrl,
        contentDigest: metadataPatchDigest(target.title, target.body),
        verifiedTitle: target.title === null ? null : pull.title,
        verifiedBody: target.body === null ? null : pull.body,
        externalEffect: 'REVERSIBLE',
        resultStatus: 'SUCCEEDED',
        readBackVerified: true,
        requestBudget: { requests: budget.requests, limit: MAX_REQUESTS },
        requiredPermissions: ['metadata:read', 'pull_requests:write'],
        evidenceUrls: [pullUrl],
        skillId: request.skill.skillId,
        skillVersion: request.skill.version,
        agentId: request.agentId,
        missionId: context.missionId,
        phaseId: context.phaseId,
        expectedMissionVersion: context.expectedMissionVersion,
      },
    });
  }

  private async executeComment(
    request: ExternalActionRequest,
    target: PullCollaborationTarget,
    deadlineAt: number,
    budget: RequestBudget,
  ): Promise<McfToolReceipt> {
    const expectedBody = `${idempotencyMarker(target.idempotencyKey)}\n\n${target.text!}`;
    let comment = await this.findComment(target, expectedBody, deadlineAt, budget);
    if (!comment) {
      try {
        await this.client.requestJson<GitHubIssueCommentResponse>(
          'POST',
          `/repos/${target.repository}/issues/${target.pullNumber}/comments`,
          deadlineAt,
          budget,
          { body: expectedBody },
        );
      } catch (error) {
        if (!shouldReconcileMutationError(error)) throw error;
        try {
          comment = await this.findComment(target, expectedBody, deadlineAt, budget);
        } catch (reconciliationError) {
          if (isAmbiguousMutationError(error) && isAmbiguousMutationError(reconciliationError)) {
            return this.unknownReceipt(request, target, 'COMMENT_PR', budget);
          }
          throw reconciliationError;
        }
        if (!comment) throw error;
      }

      try {
        comment = await this.findComment(target, expectedBody, deadlineAt, budget);
      } catch (error) {
        if (isAmbiguousMutationError(error)) {
          return this.unknownReceipt(request, target, 'COMMENT_PR', budget);
        }
        throw error;
      }
      if (!comment) return this.unknownReceipt(request, target, 'COMMENT_PR', budget);
    }

    assertComment(comment, target, expectedBody);
    return this.receipt(
      request,
      target,
      comment.id,
      comment.html_url,
      textDigest(target.text!),
      budget,
    );
  }

  private async executeReview(
    request: ExternalActionRequest,
    target: PullCollaborationTarget,
    deadlineAt: number,
    budget: RequestBudget,
  ): Promise<McfToolReceipt> {
    const expectedBody = `${idempotencyMarker(target.idempotencyKey)}\n\n${target.text!}`;
    let review = await this.findReview(target, expectedBody, deadlineAt, budget);
    if (!review) {
      try {
        await this.client.requestJson<GitHubReviewResponse>(
          'POST',
          `/repos/${target.repository}/pulls/${target.pullNumber}/reviews`,
          deadlineAt,
          budget,
          { body: expectedBody, event: 'COMMENT', commit_id: target.expectedHeadSha },
        );
      } catch (error) {
        if (!shouldReconcileMutationError(error)) throw error;
        try {
          review = await this.findReview(target, expectedBody, deadlineAt, budget);
        } catch (reconciliationError) {
          if (isAmbiguousMutationError(error) && isAmbiguousMutationError(reconciliationError)) {
            return this.unknownReceipt(request, target, 'REVIEW_PR_COMMENT', budget);
          }
          throw reconciliationError;
        }
        if (!review) throw error;
      }

      try {
        review = await this.findReview(target, expectedBody, deadlineAt, budget);
      } catch (error) {
        if (isAmbiguousMutationError(error)) {
          return this.unknownReceipt(request, target, 'REVIEW_PR_COMMENT', budget);
        }
        throw error;
      }
      if (!review) return this.unknownReceipt(request, target, 'REVIEW_PR_COMMENT', budget);
    }

    assertReview(review, target, expectedBody);
    return this.receipt(
      request,
      target,
      review.id,
      review.html_url,
      textDigest(target.text!),
      budget,
    );
  }

  private metadataMatches(pull: GitHubPullResponse, target: PullCollaborationTarget): boolean {
    return (
      (target.title === null || pull.title === target.title) &&
      (target.body === null || pull.body === target.body)
    );
  }

  private async executeMetadata(
    request: ExternalActionRequest,
    target: PullCollaborationTarget,
    deadlineAt: number,
    budget: RequestBudget,
  ): Promise<McfToolReceipt> {
    let pull = await this.readPull(target, deadlineAt, budget);
    if (!this.metadataMatches(pull, target)) {
      const patch: Record<string, unknown> = {};
      if (target.title !== null) patch.title = target.title;
      if (target.body !== null) patch.body = target.body;
      try {
        await this.client.requestJson<GitHubPullResponse>(
          'PATCH',
          `/repos/${target.repository}/pulls/${target.pullNumber}`,
          deadlineAt,
          budget,
          patch,
        );
      } catch (error) {
        if (!shouldReconcileMutationError(error)) throw error;
        try {
          pull = await this.readPull(target, deadlineAt, budget);
        } catch (reconciliationError) {
          if (isAmbiguousMutationError(error) && isAmbiguousMutationError(reconciliationError)) {
            return this.unknownReceipt(request, target, 'UPDATE_PR_TEXT_METADATA', budget);
          }
          throw reconciliationError;
        }
        if (!this.metadataMatches(pull, target)) throw error;
      }

      try {
        pull = await this.readPull(target, deadlineAt, budget);
      } catch (error) {
        if (isAmbiguousMutationError(error)) {
          return this.unknownReceipt(request, target, 'UPDATE_PR_TEXT_METADATA', budget);
        }
        throw error;
      }
      if (!this.metadataMatches(pull, target)) {
        throw new ExternalActionAdapterError(
          'RESERVATION_CONFLICT',
          'GitHub PR metadata read-back does not match the requested title/body patch',
          false,
        );
      }
    }

    return this.metadataReceipt(request, target, pull, budget);
  }

  async execute(request: ExternalActionRequest): Promise<McfToolReceipt> {
    const deadlineAt = Date.now() + GITHUB_PR_COLLABORATION_TIMEOUT_MS;
    const budget: RequestBudget = { requests: 0 };
    const target = resolveTarget(request);

    await this.readPull(target, deadlineAt, budget);

    if (target.operation === 'comment-pr') {
      return this.executeComment(request, target, deadlineAt, budget);
    }
    if (target.operation === 'review-pr-comment') {
      return this.executeReview(request, target, deadlineAt, budget);
    }
    return this.executeMetadata(request, target, deadlineAt, budget);
  }
}
