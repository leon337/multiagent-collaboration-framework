import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import type { McfSkillDefinition, McfToolReceipt, McfToolReceiptStatus } from '@rsa/contracts';

import { loadRuntimeConfig } from '../config.js';
import { McfEvidenceRejectedError } from './mcf-runtime.errors.js';
import {
  canonicalizeProvider,
  canonicalizeToolValue,
  type McfToolRequest,
} from './permission-engine.js';

interface ReceiptPayload {
  receiptId: string;
  provider: string;
  operation: string;
  resource: string;
  externalId: string | null;
  commitSha: string | null;
  status: McfToolReceiptStatus;
  observedAt: string;
  payloadDigest: string;
  metadata: Record<string, unknown>;
}

type NormalizedCiConclusion = 'SUCCESS' | 'FAILURE' | 'CANCELLED' | 'IN_PROGRESS';

const ACTIVE_CI_STATUSES = new Set(['queued', 'in_progress', 'pending', 'waiting', 'requested']);
const FAILURE_CI_CONCLUSIONS = new Set([
  'failure',
  'timed_out',
  'action_required',
  'startup_failure',
  'stale',
]);
const NON_PASSING_CI_CONCLUSIONS = new Set(['cancelled', 'neutral', 'skipped']);

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, sortValue(nested)]),
    );
  }
  return value;
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function digest(value: unknown): string {
  return createHash('sha256').update(canonicalJson(value)).digest('hex');
}

function signaturePayload(receipt: McfToolReceipt): ReceiptPayload {
  return {
    receiptId: receipt.receiptId,
    provider: receipt.provider,
    operation: receipt.operation,
    resource: receipt.resource,
    externalId: receipt.externalId,
    commitSha: receipt.commitSha,
    status: receipt.status,
    observedAt: receipt.observedAt,
    payloadDigest: receipt.payloadDigest,
    metadata: receipt.metadata,
  };
}

function equalSignature(actualHex: string, expectedHex: string): boolean {
  if (!/^[a-f0-9]{64}$/u.test(actualHex) || !/^[a-f0-9]{64}$/u.test(expectedHex)) {
    return false;
  }
  return timingSafeEqual(Buffer.from(actualHex, 'hex'), Buffer.from(expectedHex, 'hex'));
}

function reject(message: string): never {
  throw new McfEvidenceRejectedError(message);
}

function requireString(metadata: Record<string, unknown>, key: string, message: string): string {
  const value = metadata[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    return reject(message);
  }
  return value;
}

function requireBoolean(metadata: Record<string, unknown>, key: string, message: string): boolean {
  const value = metadata[key];
  if (typeof value !== 'boolean') {
    return reject(message);
  }
  return value;
}

function requireNonNegativeInteger(
  metadata: Record<string, unknown>,
  key: string,
  message: string,
): number {
  const value = metadata[key];
  if (!Number.isInteger(value) || (value as number) < 0) {
    return reject(message);
  }
  return value as number;
}

function requireArray(metadata: Record<string, unknown>, key: string, message: string): unknown[] {
  const value = metadata[key];
  if (!Array.isArray(value)) {
    return reject(message);
  }
  return value;
}

function requireNonEmptyArray(
  metadata: Record<string, unknown>,
  key: string,
  message: string,
): unknown[] {
  const value = requireArray(metadata, key, message);
  if (value.length === 0) {
    return reject(message);
  }
  return value;
}

function requireRecord(value: unknown, message: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return reject(message);
  }
  return value as Record<string, unknown>;
}

function recordString(record: Record<string, unknown>, key: string, message: string): string {
  const value = record[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    return reject(message);
  }
  return value;
}

function recordNullableString(
  record: Record<string, unknown>,
  key: string,
  message: string,
): string | null {
  const value = record[key];
  if (value === null) return null;
  if (typeof value !== 'string' || value.trim().length === 0) {
    return reject(message);
  }
  return value;
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

function containsAsciiControlOrSpace(value: string): boolean {
  return [...value].some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 0x20 || codePoint === 0x7f;
  });
}

function verifiedGitHubUrl(
  value: unknown,
  repository: string,
  message: string,
  expectedPath?: string,
): string {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value !== value.trim() ||
    containsAsciiControlOrSpace(value) ||
    !value.startsWith('https://github.com/') ||
    value.includes('?') ||
    value.includes('#')
  ) {
    return reject(message);
  }
  try {
    const parsed = new URL(value);
    const repositoryPrefix = `/${repository.toLowerCase()}`;
    const pathname = parsed.pathname.toLowerCase();
    if (
      parsed.protocol !== 'https:' ||
      parsed.hostname.toLowerCase() !== 'github.com' ||
      parsed.username.length > 0 ||
      parsed.password.length > 0 ||
      parsed.port.length > 0 ||
      parsed.search.length > 0 ||
      parsed.hash.length > 0 ||
      (pathname !== repositoryPrefix && !pathname.startsWith(`${repositoryPrefix}/`)) ||
      (expectedPath !== undefined && pathname !== expectedPath.toLowerCase())
    ) {
      return reject(message);
    }
  } catch {
    return reject(message);
  }
  return value;
}

function receiptWorkflowFilter(metadata: Record<string, unknown>): string | null {
  const value = metadata.workflowFilter;
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string' || value.trim().length === 0) {
    return reject('CI query evidence contains invalid workflowFilter');
  }
  return value.trim();
}

function validateCiQueryExecutionContext(
  receipt: McfToolReceipt,
  expected: McfToolRequest,
  inputs: Readonly<Record<string, unknown>>,
): void {
  const testTarget = exactCommitSha(inputs.test_target);
  const requestedSha = exactCommitSha(receipt.metadata.requestedSha);
  const verifiedSha = exactCommitSha(receipt.metadata.verifiedSha);
  if (
    !testTarget ||
    !receipt.commitSha ||
    testTarget !== receipt.commitSha ||
    requestedSha !== testTarget ||
    verifiedSha !== testTarget
  ) {
    reject('CI query evidence must match the current exact test_target commit SHA');
  }

  const resourceRepository = repositoryFromValue(expected.resource);
  const metadataRepositoryValue = receipt.metadata.repository;
  const metadataRepository =
    typeof metadataRepositoryValue === 'string'
      ? repositoryFromValue(metadataRepositoryValue)
      : null;
  if (
    !resourceRepository ||
    !metadataRepository ||
    metadataRepository.toLowerCase() !== resourceRepository.toLowerCase()
  ) {
    reject('CI query evidence repository must match the current tool resource');
  }

  if (inputs.repository !== undefined) {
    const inputRepository =
      typeof inputs.repository === 'string' ? repositoryFromValue(inputs.repository) : null;
    if (
      !inputRepository ||
      inputRepository.toLowerCase() !== resourceRepository.toLowerCase() ||
      inputRepository.toLowerCase() !== metadataRepository.toLowerCase()
    ) {
      reject('CI query evidence repository must match the current repository input');
    }
  }

  const workflowInput = inputs.workflow;
  let currentWorkflowFilter: string | null;
  if (workflowInput === undefined) {
    currentWorkflowFilter = null;
  } else if (typeof workflowInput === 'string') {
    currentWorkflowFilter = workflowInput.trim() || null;
  } else {
    return reject('CI query workflow input must be a string when provided');
  }

  if (receiptWorkflowFilter(receipt.metadata) !== currentWorkflowFilter) {
    reject('CI query evidence workflowFilter must match the current workflow input');
  }
}

function normalizeCiObservation(
  statusValue: string,
  conclusionValue: string | null,
): NormalizedCiConclusion {
  const status = statusValue.trim().toLowerCase();
  const conclusion = (conclusionValue ?? '').trim().toLowerCase();

  if (status === 'completed') {
    if (!conclusion) {
      return reject('CI query evidence contains a completed item without conclusion');
    }
    if (conclusion === 'success') return 'SUCCESS';
    if (FAILURE_CI_CONCLUSIONS.has(conclusion)) return 'FAILURE';
    if (NON_PASSING_CI_CONCLUSIONS.has(conclusion)) return 'CANCELLED';
    return reject(`CI query evidence contains unsupported conclusion ${conclusion}`);
  }

  if (!ACTIVE_CI_STATUSES.has(status)) {
    return reject(`CI query evidence contains unsupported status ${status}`);
  }
  if (conclusion) {
    return reject('CI query evidence contains an active item with terminal conclusion');
  }
  return 'IN_PROGRESS';
}

function aggregateCiConclusion(
  observations: Array<{ status: string; conclusion: string | null }>,
): NormalizedCiConclusion {
  if (observations.length === 0) {
    return reject('CI query evidence requires at least one observed CI item');
  }
  const normalized = observations.map((item) =>
    normalizeCiObservation(item.status, item.conclusion),
  );
  if (normalized.includes('FAILURE')) return 'FAILURE';
  if (normalized.includes('CANCELLED')) return 'CANCELLED';
  if (normalized.includes('IN_PROGRESS')) return 'IN_PROGRESS';
  if (normalized.every((item) => item === 'SUCCESS')) return 'SUCCESS';
  return reject('CI query evidence has inconsistent normalized conclusions');
}

function validateReviewReceipt(receipt: McfToolReceipt): void {
  if (canonicalizeProvider(receipt.provider) !== 'github' || !receipt.commitSha) {
    reject('code review evidence requires GitHub and reviewed commit SHA');
  }
  requireNonNegativeInteger(
    receipt.metadata,
    'findingsCount',
    'code review evidence requires findingsCount',
  );
  requireString(receipt.metadata, 'verdict', 'code review evidence requires verdict');
  requireNonEmptyArray(
    receipt.metadata,
    'reviewedFiles',
    'code review evidence requires reviewedFiles',
  );
}

function validateCiQueryReceipt(
  receipt: McfToolReceipt,
  expected: McfToolRequest,
  inputs?: Readonly<Record<string, unknown>>,
): void {
  if (
    receipt.provider !== 'github-actions' ||
    !receipt.commitSha ||
    !/^[a-f0-9]{40}$/u.test(receipt.commitSha)
  ) {
    reject('CI query evidence requires GitHub Actions and an exact 40-character commit SHA');
  }
  if (receipt.status !== 'SUCCEEDED') {
    reject('CI query evidence requires a successfully executed read-only query');
  }
  if (canonicalizeToolValue(receipt.operation) !== 'query-ci') {
    reject('CI query evidence requires query-ci operation');
  }

  const readOnly = requireBoolean(
    receipt.metadata,
    'readOnly',
    'CI query evidence requires readOnly',
  );
  if (!readOnly) {
    reject('CI query evidence requires readOnly=true');
  }

  const requestedSha = requireString(
    receipt.metadata,
    'requestedSha',
    'CI query evidence requires requestedSha',
  ).toLowerCase();
  const verifiedSha = requireString(
    receipt.metadata,
    'verifiedSha',
    'CI query evidence requires verifiedSha',
  ).toLowerCase();
  if (
    !/^[a-f0-9]{40}$/u.test(requestedSha) ||
    requestedSha !== receipt.commitSha ||
    verifiedSha !== receipt.commitSha
  ) {
    reject('CI query evidence must bind requestedSha and verifiedSha to receipt commitSha');
  }

  const repository = requireString(
    receipt.metadata,
    'repository',
    'CI query evidence requires repository',
  );
  const resourceRepository = repositoryFromValue(receipt.resource);
  if (!resourceRepository || repository.toLowerCase() !== resourceRepository.toLowerCase()) {
    reject('CI query evidence repository must match the receipt resource');
  }
  receiptWorkflowFilter(receipt.metadata);
  if (!inputs) {
    reject('CI query evidence validation requires current execution inputs');
  }
  validateCiQueryExecutionContext(receipt, expected, inputs);

  const workflowRuns = requireArray(
    receipt.metadata,
    'workflowRuns',
    'CI query evidence requires workflowRuns array',
  );
  const jobs = requireArray(receipt.metadata, 'jobs', 'CI query evidence requires jobs array');
  const checkRuns = requireArray(
    receipt.metadata,
    'checkRuns',
    'CI query evidence requires checkRuns array',
  );

  const workflowRunCount = requireNonNegativeInteger(
    receipt.metadata,
    'workflowRunCount',
    'CI query evidence requires workflowRunCount',
  );
  const jobCount = requireNonNegativeInteger(
    receipt.metadata,
    'jobCount',
    'CI query evidence requires jobCount',
  );
  const checkRunCount = requireNonNegativeInteger(
    receipt.metadata,
    'checkRunCount',
    'CI query evidence requires checkRunCount',
  );
  if (
    workflowRunCount !== workflowRuns.length ||
    jobCount !== jobs.length ||
    checkRunCount !== checkRuns.length
  ) {
    reject('CI query evidence counts must match their evidence arrays');
  }
  if (workflowRunCount + jobCount + checkRunCount === 0) {
    reject('CI query evidence requires at least one observed CI item');
  }

  const evidenceUrls = requireNonEmptyArray(
    receipt.metadata,
    'evidenceUrls',
    'CI query evidence requires evidenceUrls',
  ).map((value) =>
    verifiedGitHubUrl(value, repository, 'CI query evidence contains invalid evidence URL'),
  );
  if (evidenceUrls.length > 7_000 || new Set(evidenceUrls).size !== evidenceUrls.length) {
    reject('CI query evidence URLs must be unique and within the supported budget');
  }
  const evidenceUrlSet = new Set(evidenceUrls);
  const commitPath = `/${repository}/commit/${receipt.commitSha}`;
  if (
    !evidenceUrls.some((url) => new URL(url).pathname.toLowerCase() === commitPath.toLowerCase())
  ) {
    reject('CI query evidence requires the exact commit URL');
  }

  const workflowIds = new Set<string>();
  const observations: Array<{ status: string; conclusion: string | null }> = [];

  for (const value of workflowRuns) {
    const item = requireRecord(value, 'CI query evidence contains invalid workflow run');
    const id = recordString(item, 'id', 'CI query workflow run requires id');
    const headSha = recordString(item, 'headSha', 'CI query workflow run requires headSha');
    const url = verifiedGitHubUrl(
      item.url,
      repository,
      'CI query workflow run requires a valid GitHub URL',
      `/${repository}/actions/runs/${id}`,
    );
    const status = recordString(item, 'status', 'CI query workflow run requires status');
    const conclusion = recordNullableString(
      item,
      'conclusion',
      'CI query workflow run requires conclusion',
    );
    if (headSha.toLowerCase() !== receipt.commitSha) {
      reject('CI query workflow run must be bound to receipt commitSha');
    }
    if (workflowIds.has(id)) {
      reject('CI query evidence contains duplicate workflow run id');
    }
    workflowIds.add(id);
    if (!evidenceUrlSet.has(url)) {
      reject('CI query workflow run URL must be present in evidenceUrls');
    }
    observations.push({ status, conclusion });
  }

  const jobIds = new Set<string>();
  for (const value of jobs) {
    const item = requireRecord(value, 'CI query evidence contains invalid workflow job');
    const id = recordString(item, 'id', 'CI query workflow job requires id');
    const workflowRunId = recordString(
      item,
      'workflowRunId',
      'CI query workflow job requires workflowRunId',
    );
    const url = verifiedGitHubUrl(
      item.url,
      repository,
      'CI query workflow job requires a valid GitHub URL',
      `/${repository}/actions/runs/${workflowRunId}/job/${id}`,
    );
    const status = recordString(item, 'status', 'CI query workflow job requires status');
    const conclusion = recordNullableString(
      item,
      'conclusion',
      'CI query workflow job requires conclusion',
    );
    if (!workflowIds.has(workflowRunId)) {
      reject('CI query workflow job must reference an observed workflow run');
    }
    if (jobIds.has(id)) {
      reject('CI query evidence contains duplicate workflow job id');
    }
    jobIds.add(id);
    if (!evidenceUrlSet.has(url)) {
      reject('CI query workflow job URL must be present in evidenceUrls');
    }
    observations.push({ status, conclusion });
  }

  const checkIds = new Set<string>();
  for (const value of checkRuns) {
    const item = requireRecord(value, 'CI query evidence contains invalid check run');
    const id = recordString(item, 'id', 'CI query check run requires id');
    const urlValue = item.url;
    if (urlValue !== null) {
      const url = verifiedGitHubUrl(
        urlValue,
        repository,
        'CI query check run requires a valid GitHub URL',
        `/${repository}/runs/${id}`,
      );
      if (!evidenceUrlSet.has(url)) {
        reject('CI query check run URL must be present in evidenceUrls');
      }
    }
    const status = recordString(item, 'status', 'CI query check run requires status');
    const conclusion = recordNullableString(
      item,
      'conclusion',
      'CI query check run requires conclusion',
    );
    if (checkIds.has(id)) {
      reject('CI query evidence contains duplicate check run id');
    }
    checkIds.add(id);
    observations.push({ status, conclusion });
  }

  const declaredConclusion = requireString(
    receipt.metadata,
    'conclusion',
    'CI query evidence requires conclusion',
  ) as NormalizedCiConclusion;
  if (!['SUCCESS', 'FAILURE', 'CANCELLED', 'IN_PROGRESS'].includes(declaredConclusion)) {
    reject('CI query evidence has an unsupported conclusion');
  }
  const observedConclusion = aggregateCiConclusion(observations);
  if (declaredConclusion !== observedConclusion) {
    reject('CI query evidence conclusion is inconsistent with observed CI items');
  }

  const permissions = requireNonEmptyArray(
    receipt.metadata,
    'requiredPermissions',
    'CI query evidence requires requiredPermissions',
  );
  const expectedPermissions = ['metadata:read', 'contents:read', 'actions:read', 'checks:read'];
  const observedPermissions = new Set<string>();
  for (let index = 0; index < permissions.length; index += 1) {
    const permission = permissions[index];
    if (
      typeof permission !== 'string' ||
      !expectedPermissions.includes(permission) ||
      observedPermissions.has(permission)
    ) {
      reject('CI query evidence requires exactly the supported read-only permission metadata');
    }
    observedPermissions.add(permission);
  }
  if (
    permissions.length !== expectedPermissions.length ||
    expectedPermissions.some((permission) => !observedPermissions.has(permission))
  ) {
    reject('CI query evidence requires exactly the supported read-only permission metadata');
  }
}

function validatePullRequestReceipt(receipt: McfToolReceipt): void {
  if (
    canonicalizeProvider(receipt.provider) !== 'github' ||
    !receipt.externalId ||
    !receipt.commitSha
  ) {
    reject('pull request evidence requires GitHub PR id and commit SHA');
  }
  const ciStatus = requireString(
    receipt.metadata,
    'ciStatus',
    'pull request evidence requires ciStatus',
  );
  if (ciStatus !== 'success') {
    reject('pull request evidence requires successful CI');
  }
  const gateDecision = requireString(
    receipt.metadata,
    'gateDecision',
    'pull request evidence requires gateDecision',
  );
  if (gateDecision !== 'approved') {
    reject('pull request evidence requires approved gate');
  }
  requireString(receipt.metadata, 'prState', 'pull request evidence requires prState');
}

function validateDeploymentReceipt(receipt: McfToolReceipt): void {
  const deployProviders = new Set(['render', 'vercel', 'cloudflare']);
  if (!deployProviders.has(receipt.provider) || !receipt.externalId || !receipt.commitSha) {
    reject('deployment evidence requires supported provider, deployment id and commit SHA');
  }
  const deploymentStatus = requireString(
    receipt.metadata,
    'deploymentStatus',
    'deployment evidence requires deploymentStatus',
  );
  if (!['live', 'ready', 'success'].includes(deploymentStatus)) {
    reject('deployment evidence does not prove a healthy deployment');
  }
  const smokeStatus = requireString(
    receipt.metadata,
    'smokeStatus',
    'deployment evidence requires smokeStatus',
  );
  if (!['pass', 'success'].includes(smokeStatus)) {
    reject('deployment evidence requires a passing smoke test');
  }
  const rollbackAvailable = requireBoolean(
    receipt.metadata,
    'rollbackAvailable',
    'deployment evidence requires rollbackAvailable',
  );
  if (!rollbackAvailable) {
    reject('deployment evidence requires rollbackAvailable=true');
  }
}

@Injectable()
export class EvidenceValidator {
  private readonly secret: string;

  constructor() {
    this.secret = loadRuntimeConfig().MCF_RECEIPT_SECRET;
  }

  sign(receipt: Omit<McfToolReceipt, 'signature'>): McfToolReceipt {
    const unsigned = { ...receipt, signature: '' };
    const signature = createHmac('sha256', this.secret)
      .update(canonicalJson(signaturePayload(unsigned)))
      .digest('hex');
    return { ...receipt, signature };
  }

  createInternalReceipt(
    request: McfToolRequest,
    metadata: Record<string, unknown>,
    status: McfToolReceiptStatus = 'SUCCEEDED',
  ): McfToolReceipt {
    return this.sign({
      receiptId: randomUUID(),
      provider: request.provider,
      operation: request.operation,
      resource: request.resource,
      externalId: null,
      commitSha: null,
      status,
      observedAt: new Date().toISOString(),
      payloadDigest: digest(metadata),
      metadata,
    });
  }

  createTrustedReceipt(input: {
    provider: string;
    operation: string;
    resource: string;
    externalId: string | null;
    commitSha: string | null;
    status: McfToolReceiptStatus;
    observedAt: string;
    metadata: Record<string, unknown>;
  }): McfToolReceipt {
    return this.sign({
      receiptId: randomUUID(),
      provider: input.provider,
      operation: input.operation,
      resource: input.resource,
      externalId: input.externalId,
      commitSha: input.commitSha,
      status: input.status,
      observedAt: input.observedAt,
      payloadDigest: digest(input.metadata),
      metadata: input.metadata,
    });
  }

  verify(receipt: McfToolReceipt, expected: McfToolRequest): void {
    const expectedSignature = createHmac('sha256', this.secret)
      .update(canonicalJson(signaturePayload(receipt)))
      .digest('hex');

    if (!equalSignature(receipt.signature, expectedSignature)) {
      reject('receipt signature is invalid');
    }

    if (receipt.payloadDigest !== digest(receipt.metadata)) {
      reject('receipt payload digest does not match metadata');
    }

    if (
      canonicalizeProvider(receipt.provider) !== canonicalizeProvider(expected.provider) ||
      canonicalizeToolValue(receipt.operation) !== canonicalizeToolValue(expected.operation) ||
      receipt.resource !== expected.resource
    ) {
      reject('receipt does not match the requested tool operation');
    }

    const observedAt = new Date(receipt.observedAt);
    if (Number.isNaN(observedAt.getTime())) {
      reject('receipt observedAt is invalid');
    }

    const ageMilliseconds = Date.now() - observedAt.getTime();
    if (ageMilliseconds < -300_000 || ageMilliseconds > 604_800_000) {
      reject('receipt is outside the accepted time window');
    }

    if (receipt.provider === 'github' && !receipt.externalId && !receipt.commitSha) {
      reject('GitHub evidence requires an external id or commit SHA');
    }

    if (receipt.provider === 'github-actions') {
      if (!receipt.externalId || !receipt.commitSha) {
        reject('GitHub Actions evidence requires workflow run id and commit SHA');
      }
      if (typeof receipt.metadata.conclusion !== 'string') {
        reject('GitHub Actions evidence requires conclusion');
      }
    }
  }

  verifyForSkill(
    receipt: McfToolReceipt,
    expected: McfToolRequest,
    skill: McfSkillDefinition,
    inputs?: Readonly<Record<string, unknown>>,
  ): void {
    this.verify(receipt, expected);

    switch (skill.skillId) {
      case 'MCF-REVIEW-CODE':
        validateReviewReceipt(receipt);
        break;
      case 'MCF-RUN-TESTS':
        if (canonicalizeToolValue(expected.operation) === 'query-ci') {
          validateCiQueryReceipt(receipt, expected, inputs);
        }
        break;
      case 'MCF-GIT-PR-RELEASE':
        validatePullRequestReceipt(receipt);
        break;
      case 'MCF-DEPLOY-VALIDATE':
        validateDeploymentReceipt(receipt);
        break;
      default:
        break;
    }
  }
}
