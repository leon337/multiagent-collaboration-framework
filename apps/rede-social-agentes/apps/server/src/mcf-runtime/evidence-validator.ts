import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { isAbsolute, relative, sep } from 'node:path';

import { Injectable } from '@nestjs/common';
import type { McfSkillDefinition, McfToolReceipt, McfToolReceiptStatus } from '@rsa/contracts';

import { loadRuntimeConfig } from '../config.js';
import type { ExternalActionExecutionContext } from './external-action.contracts.js';
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

export interface EvidenceVerificationContext {
  agentId: string;
  executionContext?: ExternalActionExecutionContext | undefined;
}

const ACTIVE_CI_STATUSES = new Set(['queued', 'in_progress', 'pending', 'waiting', 'requested']);
const FAILURE_CI_CONCLUSIONS = new Set([
  'failure',
  'timed_out',
  'action_required',
  'startup_failure',
  'stale',
]);
const NON_PASSING_CI_CONCLUSIONS = new Set(['cancelled', 'neutral', 'skipped']);
const MAX_CI_CHECK_SUITES = 1_000;

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

function recordNullableNonNegativeInteger(
  record: Record<string, unknown>,
  key: string,
  message: string,
): number | null {
  const value = record[key];
  if (value === null) return null;
  if (!Number.isInteger(value) || (value as number) < 0) {
    return reject(message);
  }
  return value as number;
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

function verifiedGitHubApiUrl(
  value: unknown,
  repository: string,
  message: string,
  expectedPath: string,
): string {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value !== value.trim() ||
    containsAsciiControlOrSpace(value) ||
    !value.startsWith('https://api.github.com/') ||
    value.includes('?') ||
    value.includes('#')
  ) {
    return reject(message);
  }
  try {
    const parsed = new URL(value);
    if (
      parsed.protocol !== 'https:' ||
      parsed.hostname.toLowerCase() !== 'api.github.com' ||
      parsed.username.length > 0 ||
      parsed.password.length > 0 ||
      parsed.port.length > 0 ||
      parsed.search.length > 0 ||
      parsed.hash.length > 0 ||
      parsed.pathname.toLowerCase() !== expectedPath.toLowerCase() ||
      !parsed.pathname.toLowerCase().startsWith(`/repos/${repository.toLowerCase()}/`)
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

function validateCiQueryReceiptDomain(
  receipt: McfToolReceipt,
  skill: McfSkillDefinition,
  current?: EvidenceVerificationContext,
): void {
  const executionContext = current?.executionContext;
  if (
    !current ||
    typeof current.agentId !== 'string' ||
    current.agentId.length === 0 ||
    current.agentId !== current.agentId.trim() ||
    !executionContext ||
    typeof executionContext.missionId !== 'string' ||
    executionContext.missionId.length === 0 ||
    executionContext.missionId !== executionContext.missionId.trim() ||
    typeof executionContext.phaseId !== 'string' ||
    executionContext.phaseId.length === 0 ||
    executionContext.phaseId !== executionContext.phaseId.trim() ||
    !Number.isInteger(executionContext.expectedMissionVersion) ||
    executionContext.expectedMissionVersion < 1
  ) {
    reject('CI query evidence validation requires the current governed execution context');
  }

  const receiptSkillId = requireString(
    receipt.metadata,
    'skillId',
    'CI query evidence requires signed skillId',
  );
  if (receiptSkillId !== skill.skillId) {
    reject('CI query evidence skillId must match the current skill');
  }

  const receiptSkillVersion = requireString(
    receipt.metadata,
    'skillVersion',
    'CI query evidence requires signed skillVersion',
  );
  if (receiptSkillVersion !== skill.version) {
    reject('CI query evidence skillVersion must match the current skill version');
  }

  const receiptAgentId = requireString(
    receipt.metadata,
    'agentId',
    'CI query evidence requires signed agentId',
  );
  if (receiptAgentId !== current.agentId) {
    reject('CI query evidence agentId must match the current agent');
  }

  const receiptMissionId = requireString(
    receipt.metadata,
    'missionId',
    'CI query evidence requires signed missionId',
  );
  if (receiptMissionId !== executionContext.missionId) {
    reject('CI query evidence missionId must match the current mission');
  }

  const receiptPhaseId = requireString(
    receipt.metadata,
    'phaseId',
    'CI query evidence requires signed phaseId',
  );
  if (receiptPhaseId !== executionContext.phaseId) {
    reject('CI query evidence phaseId must match the current phase');
  }

  const receiptMissionVersion = requireNonNegativeInteger(
    receipt.metadata,
    'expectedMissionVersion',
    'CI query evidence requires signed expectedMissionVersion',
  );
  if (
    receiptMissionVersion < 1 ||
    receiptMissionVersion !== executionContext.expectedMissionVersion
  ) {
    reject('CI query evidence mission version must match the current expected mission version');
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
  const checkSuites = requireArray(
    receipt.metadata,
    'checkSuites',
    'CI query evidence requires checkSuites array',
  );
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
  const checkSuiteCount = requireNonNegativeInteger(
    receipt.metadata,
    'checkSuiteCount',
    'CI query evidence requires checkSuiteCount',
  );
  const checkRunCount = requireNonNegativeInteger(
    receipt.metadata,
    'checkRunCount',
    'CI query evidence requires checkRunCount',
  );
  if (
    workflowRunCount !== workflowRuns.length ||
    jobCount !== jobs.length ||
    checkSuiteCount !== checkSuites.length ||
    checkRunCount !== checkRuns.length
  ) {
    reject('CI query evidence counts must match their evidence arrays');
  }
  if (workflowRunCount + jobCount + checkSuiteCount + checkRunCount === 0) {
    reject('CI query evidence requires at least one observed CI item');
  }

  const queryBudget = requireRecord(
    receipt.metadata.queryBudget,
    'CI query evidence requires queryBudget',
  );
  const budgetCheckSuiteCount = requireNonNegativeInteger(
    queryBudget,
    'checkSuiteCount',
    'CI query evidence queryBudget requires checkSuiteCount',
  );
  const queryLimits = requireRecord(
    queryBudget.limits,
    'CI query evidence queryBudget requires limits',
  );
  const checkSuiteLimit = requireNonNegativeInteger(
    queryLimits,
    'checkSuites',
    'CI query evidence queryBudget requires checkSuites limit',
  );
  if (
    budgetCheckSuiteCount !== checkSuiteCount ||
    checkSuiteLimit !== MAX_CI_CHECK_SUITES ||
    checkSuiteCount > checkSuiteLimit
  ) {
    reject('CI query evidence check-suite budget is inconsistent');
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
    const runId = recordString(item, 'runId', 'CI query workflow job requires runId');
    const headSha = exactCommitSha(
      recordString(item, 'headSha', 'CI query workflow job requires headSha'),
    );
    const workflowRunId =
      item.workflowRunId === undefined
        ? undefined
        : recordString(
            item,
            'workflowRunId',
            'CI query workflow job requires valid workflowRunId when present',
          );
    if (workflowRunId !== undefined && workflowRunId !== runId) {
      reject('CI query workflow job runId and workflowRunId must match');
    }
    const url = verifiedGitHubUrl(
      item.url,
      repository,
      'CI query workflow job requires a valid GitHub URL',
      `/${repository}/actions/runs/${runId}/job/${id}`,
    );
    const status = recordString(item, 'status', 'CI query workflow job requires status');
    const conclusion = recordNullableString(
      item,
      'conclusion',
      'CI query workflow job requires conclusion',
    );
    if (!workflowIds.has(runId)) {
      reject('CI query workflow job must reference an observed workflow run');
    }
    if (
      headSha === null ||
      headSha !== receipt.commitSha ||
      headSha !== requestedSha ||
      headSha !== verifiedSha
    ) {
      reject(
        'CI query workflow job headSha must match the exact requested and verified commit SHA',
      );
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

  const checkSuiteIds = new Set<string>();
  for (const value of checkSuites) {
    const item = requireRecord(value, 'CI query evidence contains invalid check suite');
    const id = recordString(item, 'id', 'CI query check suite requires id');
    const headSha = recordString(item, 'headSha', 'CI query check suite requires headSha');
    verifiedGitHubApiUrl(
      item.url,
      repository,
      'CI query check suite requires a valid GitHub API URL',
      `/repos/${repository}/check-suites/${id}`,
    );
    const status = recordString(item, 'status', 'CI query check suite requires status');
    const conclusion = recordNullableString(
      item,
      'conclusion',
      'CI query check suite requires conclusion',
    );
    recordNullableNonNegativeInteger(
      item,
      'latestCheckRunsCount',
      'CI query check suite requires valid latestCheckRunsCount',
    );

    if (item.app !== null) {
      const app = requireRecord(item.app, 'CI query check suite contains invalid app');
      recordString(app, 'id', 'CI query check suite app requires id');
      recordString(app, 'name', 'CI query check suite app requires name');
      recordNullableString(app, 'slug', 'CI query check suite app requires slug');
    }

    if (headSha.toLowerCase() !== receipt.commitSha) {
      reject('CI query check suite must be bound to receipt commitSha');
    }
    if (checkSuiteIds.has(id)) {
      reject('CI query evidence contains duplicate check suite id');
    }
    checkSuiteIds.add(id);
    observations.push({ status, conclusion });
  }

  const checkIds = new Set<string>();
  for (const value of checkRuns) {
    const item = requireRecord(value, 'CI query evidence contains invalid check run');
    const id = recordString(item, 'id', 'CI query check run requires id');
    const headSha = exactCommitSha(
      recordString(item, 'headSha', 'CI query check run requires headSha'),
    );
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
    if (
      headSha === null ||
      headSha !== receipt.commitSha ||
      headSha !== requestedSha ||
      headSha !== verifiedSha
    ) {
      reject('CI query check run headSha must match the exact requested and verified commit SHA');
    }
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

function validateAstryxDiscoveryReceipt(
  receipt: McfToolReceipt,
  expected: McfToolRequest,
  inputs: Readonly<Record<string, unknown>> = {},
): void {
  const isPathWithin = (parent: string, child: string): boolean => {
    const candidate = relative(parent, child);
    return (
      candidate === '' ||
      (candidate !== '..' && !candidate.startsWith(`..${sep}`) && !isAbsolute(candidate))
    );
  };
  const operation = canonicalizeToolValue(expected.operation);
  const proposal = operation === 'draft-template-scaffold';
  const allowedOperations = [
    'list-components',
    'read-component-docs',
    'list-templates',
    'read-template-source',
    'read-template-skeleton',
    'draft-template-scaffold',
  ];
  if (
    canonicalizeProvider(receipt.provider) !== 'mcf-astryx-cli' ||
    expected.resource !== 'astryx-design-system' ||
    receipt.resource !== 'astryx-design-system' ||
    receipt.status !== 'SUCCEEDED' ||
    !allowedOperations.includes(operation)
  )
    reject(
      'Astryx evidence requires the governed provider, canonical resource and allowlisted operation',
    );

  if (
    requireString(receipt.metadata, 'adapterId', 'Astryx evidence requires adapterId') !==
    'mcf-astryx-cli-governed-v2'
  ) {
    reject('Astryx evidence was not produced by the approved governed adapter');
  }
  if (
    requireBoolean(receipt.metadata, 'readOnly', 'Astryx evidence requires readOnly') !== !proposal
  ) {
    reject('Astryx readOnly flag does not match the operation effect');
  }
  if (
    proposal &&
    (!requireBoolean(receipt.metadata, 'proposalOnly', 'Scaffold evidence requires proposalOnly') ||
      requireString(receipt.metadata, 'writeMode', 'Scaffold evidence requires writeMode') !==
        'DISPOSABLE_PROPOSAL_ONLY' ||
      !requireBoolean(
        receipt.metadata,
        'proposalWorkspaceCleaned',
        'Scaffold evidence requires cleanup proof',
      ))
  )
    reject('Astryx scaffold must be a disposable proposal with its scratch workspace cleaned');

  if (
    requireString(receipt.metadata, 'cliPackage', 'Astryx evidence requires cliPackage') !==
      '@astryxdesign/cli' ||
    requireString(receipt.metadata, 'corePackage', 'Astryx evidence requires corePackage') !==
      '@astryxdesign/core'
  )
    reject('Astryx evidence must identify the official scoped packages');

  const cliVersion = requireString(
    receipt.metadata,
    'cliVersion',
    'Astryx evidence requires cliVersion',
  );
  const coreVersion = requireString(
    receipt.metadata,
    'coreVersion',
    'Astryx evidence requires coreVersion',
  );
  const semver = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/u;
  if (
    !semver.test(cliVersion) ||
    !semver.test(coreVersion) ||
    requireString(receipt.metadata, 'cliCopy', 'Astryx evidence requires cliCopy') !== 'project'
  )
    reject('Astryx evidence must bind project-local CLI and Core versions');

  const workspace = requireString(
    receipt.metadata,
    'workspace',
    'Astryx evidence requires workspace',
  );
  const packageRoot = requireString(
    receipt.metadata,
    'cliPackageRoot',
    'Astryx evidence requires cliPackageRoot',
  );
  const cliBinary = requireString(
    receipt.metadata,
    'cliBinary',
    'Astryx evidence requires cliBinary',
  );
  const corePackageRoot = requireString(
    receipt.metadata,
    'corePackageRoot',
    'Astryx evidence requires corePackageRoot',
  );
  if (
    !isAbsolute(workspace) ||
    !isAbsolute(packageRoot) ||
    !isAbsolute(cliBinary) ||
    !isAbsolute(corePackageRoot) ||
    isPathWithin(process.cwd(), workspace) ||
    isPathWithin(workspace, process.cwd()) ||
    !isPathWithin(workspace, packageRoot) ||
    !isPathWithin(packageRoot, cliBinary) ||
    !isPathWithin(workspace, corePackageRoot) ||
    isPathWithin(packageRoot, corePackageRoot) ||
    isPathWithin(corePackageRoot, packageRoot)
  )
    reject(
      'Astryx evidence must bind workspace-local CLI and Core packages outside the runtime checkout; workspace-local CLI and Core packages are required',
    );

  const command = requireNonEmptyArray(
    receipt.metadata,
    'command',
    'Astryx evidence requires command',
  );
  if (command[0] !== process.execPath || command[1] !== cliBinary) {
    reject('Astryx evidence must execute the verified workspace-local CLI with Node');
  }

  const templateId =
    operation.startsWith('read-template') || proposal
      ? requireString(
          receipt.metadata,
          'templateId',
          'Astryx template operation requires templateId',
        )
      : undefined;
  if (templateId !== undefined && !/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/u.test(templateId)) {
    reject('Astryx templateId is invalid');
  }

  let expectedArgs: string[];
  switch (operation) {
    case 'list-components':
      expectedArgs = ['--json', 'component', '--list'];
      break;
    case 'read-component-docs': {
      const name = inputs.componentName;
      if (typeof name !== 'string' || !/^[A-Z][A-Za-z0-9]{0,63}$/u.test(name))
        reject('Astryx component documentation requires a valid componentName');
      expectedArgs = ['--json', 'component', String(name), '--detail', 'compact'];
      break;
    }
    case 'list-templates':
      expectedArgs = ['--json', 'template', '--list'];
      break;
    case 'read-template-source':
      expectedArgs = ['--json', 'template', String(templateId)];
      break;
    case 'read-template-skeleton':
      expectedArgs = ['--json', 'template', String(templateId), '--skeleton'];
      break;
    default: {
      const targetPath = requireString(
        receipt.metadata,
        'targetPath',
        'Scaffold evidence requires targetPath',
      );
      const baseCommitSha = requireString(
        receipt.metadata,
        'baseCommitSha',
        'Scaffold evidence requires baseCommitSha',
      );
      const repository = requireString(
        receipt.metadata,
        'repository',
        'Scaffold evidence requires repository',
      );
      if (
        !/^[a-f0-9]{40}$/u.test(baseCommitSha) ||
        receipt.commitSha !== baseCommitSha ||
        !/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?\/[A-Za-z0-9._-]{1,100}$/u.test(
          repository,
        ) ||
        targetPath.startsWith('/') ||
        targetPath.includes('\\') ||
        !/^[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*\.(?:tsx|jsx|ts|js)$/u.test(targetPath) ||
        targetPath.split('/').some((part) => !part || part === '.' || part === '..')
      )
        reject('Astryx scaffold target, repository or base SHA is invalid');
      const approvedPaths = receipt.metadata.approvedPaths;
      if (
        !Array.isArray(approvedPaths) ||
        approvedPaths.length === 0 ||
        approvedPaths.some(
          (entry) =>
            typeof entry !== 'string' ||
            entry.startsWith('/') ||
            entry.includes('\\') ||
            !/^[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$/u.test(entry) ||
            entry.split('/').some((part) => part === '.' || part === '..'),
        ) ||
        !approvedPaths.some(
          (scope) => targetPath === scope || targetPath.startsWith(`${String(scope)}/`),
        ) ||
        JSON.stringify(approvedPaths) !== JSON.stringify(inputs.allowed_paths)
      )
        reject('Astryx scaffold target is outside the exact approved paths');
      const proposalWorkspace = requireString(
        receipt.metadata,
        'proposalWorkspace',
        'Scaffold evidence requires proposalWorkspace',
      );
      if (
        !isAbsolute(proposalWorkspace) ||
        !isPathWithin(workspace, proposalWorkspace) ||
        proposalWorkspace === workspace
      ) {
        reject('Astryx scaffold workspace must be nested under the isolated CLI workspace');
      }
      const source = requireRecord(
        receipt.metadata.sourceArtifact,
        'Scaffold evidence requires sourceArtifact',
      );
      const diff = requireRecord(
        receipt.metadata.diffArtifact,
        'Scaffold evidence requires diffArtifact',
      );
      const sourceData = requireString(source, 'data', 'Scaffold source artifact requires data');
      const diffData = requireString(diff, 'data', 'Scaffold diff artifact requires data');
      const sourceBytes = Buffer.from(sourceData, 'base64');
      const diffBytes = Buffer.from(diffData, 'base64');
      if (
        source.encoding !== 'base64' ||
        sourceBytes.toString('base64') !== sourceData ||
        requireNonNegativeInteger(
          source,
          'byteLength',
          'Scaffold source artifact requires byteLength',
        ) !== sourceBytes.byteLength ||
        requireString(source, 'digest', 'Scaffold source artifact requires digest') !==
          createHash('sha256').update(sourceBytes).digest('hex') ||
        diff.encoding !== 'base64' ||
        diffBytes.toString('base64') !== diffData ||
        requireNonNegativeInteger(
          diff,
          'byteLength',
          'Scaffold diff artifact requires byteLength',
        ) !== diffBytes.byteLength ||
        requireString(receipt.metadata, 'diffDigest', 'Scaffold evidence requires diffDigest') !==
          createHash('sha256').update(diffBytes).digest('hex') ||
        !diffBytes.toString('utf8').startsWith(`diff --git a/${targetPath} b/${targetPath}\n`) ||
        !diffBytes.toString('utf8').includes(`+++ b/${targetPath}\n`)
      )
        reject('Astryx scaffold source/diff artifacts have invalid encoding, path or digest');
      if (
        sourceBytes.byteLength < 1 ||
        sourceBytes.byteLength > 262_144 ||
        diffBytes.byteLength > 524_288
      ) {
        reject('Astryx scaffold proposal exceeds the bounded artifact size');
      }
      const sourceText = sourceBytes.toString('utf8').replace(/\r\n/gu, '\n');
      const sourceLines = sourceText.endsWith('\n')
        ? sourceText.slice(0, -1).split('\n')
        : sourceText.split('\n');
      const expectedDiff = [
        `diff --git a/${targetPath} b/${targetPath}`,
        'new file mode 100644',
        '--- /dev/null',
        `+++ b/${targetPath}`,
        `@@ -0,0 +1,${sourceLines.length} @@`,
        ...sourceLines.map((line) => `+${line}`),
        '',
      ].join('\n');
      if (diffBytes.toString('utf8') !== expectedDiff)
        reject('Astryx scaffold diff does not represent the signed source artifact');
      expectedArgs = ['--json', 'template', String(templateId), targetPath];
      break;
    }
  }

  if (
    command.length !== expectedArgs.length + 2 ||
    expectedArgs.some((arg, index) => command[index + 2] !== arg)
  ) {
    reject('Astryx evidence command does not match the fixed operation allowlist');
  }

  const stdout = requireString(receipt.metadata, 'stdout', 'Astryx evidence requires stdout');
  const outputBytes = requireNonNegativeInteger(
    receipt.metadata,
    'outputBytes',
    'Astryx evidence requires outputBytes',
  );
  const outputDigest = requireString(
    receipt.metadata,
    'outputDigest',
    'Astryx evidence requires outputDigest',
  );
  const outputLimit = operation.includes('template') ? 262_144 : 32_768;
  if (
    outputBytes !== Buffer.byteLength(stdout, 'utf8') ||
    outputBytes > outputLimit ||
    !/^[a-f0-9]{64}$/u.test(outputDigest) ||
    outputDigest !== createHash('sha256').update(stdout).digest('hex')
  )
    reject('Astryx evidence output size or digest is invalid');

  if (
    requireNonNegativeInteger(receipt.metadata, 'exitCode', 'Astryx evidence requires exitCode') !==
    0
  ) {
    reject('Astryx evidence requires a successful CLI exit code');
  }
  const stderr = receipt.metadata.stderr;
  if (typeof stderr !== 'string' || Buffer.byteLength(stderr, 'utf8') > 2_048)
    reject('Astryx evidence stderr exceeds its bounded capture');

  let envelope: unknown;
  try {
    envelope = JSON.parse(stdout);
  } catch {
    return reject('Astryx evidence stdout is not valid JSON');
  }
  const parsedEnvelope = requireRecord(
    envelope,
    'Astryx evidence has an unsupported CLI JSON envelope',
  );
  if (parsedEnvelope.apiVersion !== 1)
    reject('Astryx evidence has an unsupported CLI JSON envelope');
  const expectedType: Record<string, string> = {
    'list-components': 'component.list',
    'read-component-docs': 'component.detail',
    'list-templates': 'template.list',
    'read-template-source': 'template.show',
    'read-template-skeleton': 'template.skeleton',
    'draft-template-scaffold': 'template.copy',
  };
  if (parsedEnvelope.type !== expectedType[operation])
    reject('Astryx evidence response type is invalid');
  const meta = requireRecord(parsedEnvelope.meta, 'Astryx evidence requires response metadata');
  const answeredBy = requireRecord(
    meta.answeredBy,
    'Astryx evidence requires answeredBy provenance',
  );
  if (
    answeredBy.cli !== cliVersion ||
    answeredBy.core !== coreVersion ||
    answeredBy.copy !== 'project'
  ) {
    reject('Astryx evidence package provenance does not match the receipt');
  }
  if (operation === 'list-components') {
    const data = requireRecord(parsedEnvelope.data, 'Astryx component list requires data');
    requireRecord(data.components, 'Astryx component list is missing its catalog');
    if (data.detail !== 'names') {
      reject('Astryx component list must use the fixed names detail level');
    }
  } else if (operation === 'read-component-docs') {
    const data = requireRecord(parsedEnvelope.data, 'Astryx component docs require data');
    if (data.name !== inputs.componentName)
      reject('Astryx component docs do not match the request');
  } else if (operation === 'read-template-source') {
    const data = requireRecord(parsedEnvelope.data, 'Astryx template source requires data');
    if (typeof data.source !== 'string' || !data.source.length)
      reject('Astryx template source is missing source text');
  } else if (operation === 'read-template-skeleton') {
    const data = requireRecord(parsedEnvelope.data, 'Astryx template skeleton requires data');
    if (Object.keys(data).length === 0) reject('Astryx template skeleton is empty');
  } else if (operation === 'list-templates') {
    const data = parsedEnvelope.data;
    if (!Array.isArray(data)) {
      const catalog = requireRecord(data, 'Astryx template list requires a catalog object');
      if (!Array.isArray(catalog.templates)) reject('Astryx template list is malformed');
    }
  } else {
    const data = requireRecord(parsedEnvelope.data, 'Astryx template copy requires data');
    if (data.filesCopied !== 1) reject('Astryx template copy must produce exactly one file');
  }
}

function validateVisualDesktopAuditReceipt(
  receipt: McfToolReceipt,
  inputs: Readonly<Record<string, unknown>> = {},
): void {
  const provider = canonicalizeProvider(receipt.provider);
  if (!['sentinelx', 'remote-desktop-commander'].includes(provider)) {
    reject('visual desktop audit evidence requires an authorized desktop adapter');
  }

  const requestedUnit = requireString(
    receipt.metadata,
    'requestedUnit',
    'visual desktop audit evidence requires requestedUnit',
  );
  if (typeof inputs.requested_unit === 'string' && requestedUnit !== inputs.requested_unit.trim()) {
    reject('visual desktop audit requestedUnit must match the current requested_unit');
  }

  const expectedSurfaceCount = requireNonNegativeInteger(
    receipt.metadata,
    'expectedSurfaceCount',
    'visual desktop audit evidence requires expectedSurfaceCount',
  );
  const actualSurfaceCount = requireNonNegativeInteger(
    receipt.metadata,
    'actualSurfaceCount',
    'visual desktop audit evidence requires actualSurfaceCount',
  );
  if (expectedSurfaceCount < 1 || actualSurfaceCount !== expectedSurfaceCount) {
    reject('visual desktop audit surface count must match the expected non-zero count');
  }
  if (
    Number.isInteger(inputs.expected_surface_count) &&
    Number(inputs.expected_surface_count) !== expectedSurfaceCount
  ) {
    reject('visual desktop audit expectedSurfaceCount must match the current request');
  }

  const rawArtifact = requireString(
    receipt.metadata,
    'rawArtifact',
    'visual desktop audit evidence requires rawArtifact',
  );
  const annotatedArtifact = requireString(
    receipt.metadata,
    'annotatedArtifact',
    'visual desktop audit evidence requires annotatedArtifact',
  );
  const verificationArtifact = requireString(
    receipt.metadata,
    'verificationArtifact',
    'visual desktop audit evidence requires verificationArtifact',
  );
  if (new Set([rawArtifact, annotatedArtifact, verificationArtifact]).size !== 3) {
    reject('visual desktop audit artifact references must be distinct');
  }

  const surfaces = requireNonEmptyArray(
    receipt.metadata,
    'surfaceInventory',
    'visual desktop audit evidence requires surfaceInventory',
  );
  if (surfaces.length !== actualSurfaceCount) {
    reject('visual desktop audit surfaceInventory must match actualSurfaceCount');
  }
  for (const surface of surfaces) {
    const item = requireRecord(
      surface,
      'visual desktop audit surfaceInventory entries must be objects',
    );
    recordString(item, 'windowId', 'visual desktop audit surface requires windowId');
    recordString(item, 'title', 'visual desktop audit surface requires title');
    recordString(item, 'label', 'visual desktop audit surface requires an observable label');
    for (const key of ['x', 'y', 'width', 'height']) {
      const value = item[key];
      if (!Number.isInteger(value) || (value as number) < 0) {
        reject(`visual desktop audit surface requires non-negative integer ${key}`);
      }
      if ((key === 'width' || key === 'height') && (value as number) === 0) {
        reject(`visual desktop audit surface requires positive ${key}`);
      }
    }
  }

  const elapsedMs = requireNonNegativeInteger(
    receipt.metadata,
    'elapsedMs',
    'visual desktop audit evidence requires elapsedMs',
  );
  if (
    Number.isInteger(inputs.time_budget_ms) &&
    Number(inputs.time_budget_ms) >= 0 &&
    elapsedMs > Number(inputs.time_budget_ms)
  ) {
    reject('visual desktop audit elapsedMs exceeds the requested time budget');
  }

  const openVerified = requireBoolean(
    receipt.metadata,
    'openVerified',
    'visual desktop audit evidence requires openVerified',
  );
  if (!openVerified) {
    reject('visual desktop audit openVerified must be true');
  }

  const criticalFailures = requireArray(
    receipt.metadata,
    'criticalFailures',
    'visual desktop audit evidence requires criticalFailures',
  );
  if (criticalFailures.length > 0) {
    reject('visual desktop audit cannot pass with criticalFailures');
  }
  requireString(
    receipt.metadata,
    'interpretationMode',
    'visual desktop audit evidence requires interpretationMode',
  );
}

function repositoryRelativeEvidencePath(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0 || value !== value.trim())
    return reject(`${label} must contain repository-relative paths`);
  if (value.startsWith('/') || value.includes('\\') || value.includes('\0'))
    return reject(`${label} contains an unsafe repository path`);
  const segments = value.split('/');
  if (segments.some((segment) => segment.length === 0 || segment === '.' || segment === '..'))
    return reject(`${label} contains an unsafe repository path`);
  return value;
}

function pathWithinApprovedScope(path: string, approvedPaths: string[]): boolean {
  return approvedPaths.some((scope) => path === scope || path.startsWith(`${scope}/`));
}

function validateCodeBuddyImplementReceipt(
  receipt: McfToolReceipt,
  expected: McfToolRequest,
  inputs: Readonly<Record<string, unknown>>,
): void {
  if (canonicalizeProvider(receipt.provider) !== 'codebuddy')
    reject('CodeBuddy implementation evidence requires provider=codebuddy');
  const commitSha = exactCommitSha(receipt.commitSha);
  const baseCommitSha = exactCommitSha(receipt.metadata.baseCommitSha);
  if (!commitSha || !baseCommitSha || commitSha !== baseCommitSha)
    reject('CodeBuddy implementation evidence requires matching exact base commit SHA');
  const resourceRepository = repositoryFromValue(expected.resource);
  const metadataValue = receipt.metadata.repository;
  const metadataRepository =
    typeof metadataValue === 'string' ? repositoryFromValue(metadataValue) : null;
  if (
    !resourceRepository ||
    !metadataRepository ||
    metadataRepository.toLowerCase() !== resourceRepository.toLowerCase()
  )
    reject('CodeBuddy implementation evidence repository must match the tool resource');
  if (
    typeof inputs.repository !== 'string' ||
    repositoryFromValue(inputs.repository)?.toLowerCase() !== resourceRepository.toLowerCase()
  )
    reject('CodeBuddy implementation evidence repository must match the current repository input');
  const changedFiles = requireNonEmptyArray(
    receipt.metadata,
    'changedFiles',
    'CodeBuddy implementation evidence requires changedFiles',
  );
  if (changedFiles.some((item) => typeof item !== 'string' || !item.trim()))
    reject('CodeBuddy implementation changedFiles must contain non-empty paths');
  const changedFileCount = requireNonNegativeInteger(
    receipt.metadata,
    'changedFileCount',
    'CodeBuddy implementation evidence requires changedFileCount',
  );
  if (changedFileCount !== changedFiles.length)
    reject('CodeBuddy implementation changedFileCount must match changedFiles');
  const normalizedChangedFiles = changedFiles.map((item) =>
    repositoryRelativeEvidencePath(item, 'CodeBuddy implementation changedFiles'),
  );
  const approvedPaths = requireNonEmptyArray(
    receipt.metadata,
    'approvedPaths',
    'CodeBuddy implementation evidence requires approvedPaths',
  ).map((item) => repositoryRelativeEvidencePath(item, 'CodeBuddy implementation approvedPaths'));
  if (new Set(approvedPaths).size !== approvedPaths.length)
    reject('CodeBuddy implementation approvedPaths must be unique');
  const requestedPaths = Array.isArray(inputs.allowed_paths)
    ? inputs.allowed_paths.map((item) =>
        repositoryRelativeEvidencePath(item, 'CodeBuddy implementation allowed_paths'),
      )
    : reject('CodeBuddy implementation evidence requires allowed_paths input');
  if (
    requestedPaths.length !== approvedPaths.length ||
    requestedPaths.some((item, index) => item !== approvedPaths[index])
  )
    reject('CodeBuddy implementation approvedPaths must match allowed_paths');
  if (normalizedChangedFiles.some((path) => !pathWithinApprovedScope(path, approvedPaths)))
    reject('CodeBuddy implementation changed files must remain inside approvedPaths');
  const proposalMetadata = receipt.metadata.scaffoldProposal;
  const proposalInput = inputs.scaffoldProposalReceipt;
  if (proposalMetadata !== undefined || proposalInput !== undefined) {
    const proposal = requireRecord(
      proposalMetadata,
      'CodeBuddy scaffold application requires scaffoldProposal evidence',
    );
    const proposalReceipt = requireRecord(
      proposalInput,
      'CodeBuddy scaffold application requires the signed proposal receipt',
    );
    const proposalReceiptMetadata = requireRecord(
      proposalReceipt.metadata,
      'CodeBuddy scaffold proposal requires metadata',
    );
    const proposalTarget = repositoryRelativeEvidencePath(
      requireString(proposal, 'targetPath', 'CodeBuddy scaffold evidence requires targetPath'),
      'CodeBuddy scaffold targetPath',
    );
    const proposalScope = requireString(
      proposal,
      'hdfApprovalSourceRef',
      'CodeBuddy scaffold evidence requires HDF approval sourceRef',
    );
    const hdf = requireRecord(
      inputs.v11AuthorizationContext,
      'CodeBuddy scaffold application requires v11AuthorizationContext',
    );
    const gate = requireRecord(
      hdf.humanGateDecision,
      'CodeBuddy scaffold application requires humanGateDecision',
    );
    if (
      proposalReceipt.receiptId !== proposal.receiptId ||
      proposalReceiptMetadata.templateId !== proposal.templateId ||
      proposalReceiptMetadata.targetPath !== proposalTarget ||
      proposalReceiptMetadata.diffDigest !== proposal.diffDigest ||
      proposalReceiptMetadata.sourceArtifact === undefined ||
      requireString(
        proposal,
        'sourceDigest',
        'CodeBuddy scaffold evidence requires sourceDigest',
      ) !==
        requireString(
          requireRecord(proposalReceiptMetadata.sourceArtifact, 'Astryx proposal sourceArtifact'),
          'digest',
          'Astryx proposal sourceArtifact requires digest',
        ) ||
      !normalizedChangedFiles.includes(proposalTarget) ||
      !pathWithinApprovedScope(proposalTarget, approvedPaths) ||
      inputs.authorizedScope !== true ||
      proposal.authorizedScope !== true ||
      proposal.approvedBy !== 'LEANDRO' ||
      gate.status !== 'APPROVED' ||
      gate.decidedBy !== 'LEANDRO' ||
      gate.sourceRef !== proposalScope
    )
      reject(
        'CodeBuddy scaffold application must bind the signed proposal, exact changed target, approved paths and LEANDRO HDF decision',
      );
  }
  for (const key of ['diffDigest', 'stdoutDigest'] as const) {
    const value = requireString(
      receipt.metadata,
      key,
      `CodeBuddy implementation evidence requires ${key}`,
    );
    if (!/^[a-f0-9]{64}$/u.test(value))
      reject(`CodeBuddy implementation ${key} must be a SHA-256 digest`);
  }
  const diffArtifact = requireRecord(
    receipt.metadata.diffArtifact,
    'CodeBuddy implementation evidence requires diffArtifact',
  );
  if (
    recordString(diffArtifact, 'encoding', 'CodeBuddy diffArtifact requires encoding') !== 'base64'
  )
    reject('CodeBuddy diffArtifact encoding must be base64');
  const diffArtifactData = recordString(
    diffArtifact,
    'data',
    'CodeBuddy diffArtifact requires data',
  );
  const diffArtifactBytes = Buffer.from(diffArtifactData, 'base64');
  if (diffArtifactBytes.toString('base64') !== diffArtifactData)
    reject('CodeBuddy diffArtifact data must be canonical base64');
  if (
    requireNonNegativeInteger(
      diffArtifact,
      'byteLength',
      'CodeBuddy diffArtifact requires byteLength',
    ) !== diffArtifactBytes.byteLength
  )
    reject('CodeBuddy diffArtifact byteLength does not match artifact bytes');
  const artifactDigest = createHash('sha256').update(diffArtifactBytes).digest('hex');
  if (artifactDigest !== receipt.metadata.diffDigest)
    reject('CodeBuddy diffDigest does not match diffArtifact bytes');
  if (
    requireBoolean(receipt.metadata, 'localOnly', 'CodeBuddy evidence requires localOnly') !== true
  )
    reject('CodeBuddy implementation evidence must be local-only');
  if (
    requireBoolean(receipt.metadata, 'committed', 'CodeBuddy evidence requires committed') !== false
  )
    reject('CodeBuddy implementation adapter must not commit');
  if (
    requireString(
      receipt.metadata,
      'executionIsolation',
      'CodeBuddy implementation evidence requires executionIsolation',
    ) !== 'DISPOSABLE_GIT_WORKTREE'
  )
    reject('CodeBuddy implementation evidence must prove disposable-worktree isolation');
  if (
    requireNonNegativeInteger(
      receipt.metadata,
      'exitCode',
      'CodeBuddy implementation evidence requires exitCode',
    ) !== 0
  )
    reject('CodeBuddy implementation evidence requires exitCode=0');
  requireNonNegativeInteger(
    receipt.metadata,
    'durationMs',
    'CodeBuddy implementation evidence requires durationMs',
  );
  const model = requireString(
    receipt.metadata,
    'model',
    'CodeBuddy implementation evidence requires model',
  );
  const configuredModel = loadRuntimeConfig().MCF_CODEBUDDY_MODEL;
  if (model !== configuredModel)
    reject('CodeBuddy implementation evidence model must match the configured model');
  const handoff = requireRecord(
    receipt.metadata.testHandoff,
    'CodeBuddy implementation evidence requires testHandoff',
  );
  if (
    recordString(handoff, 'skillId', 'CodeBuddy testHandoff requires skillId') !== 'MCF-RUN-TESTS'
  )
    reject('CodeBuddy testHandoff must target MCF-RUN-TESTS');
  if (recordString(handoff, 'status', 'CodeBuddy testHandoff requires status') !== 'PENDING')
    reject('CodeBuddy testHandoff must remain PENDING');
  if (
    recordString(handoff, 'reason', 'CodeBuddy testHandoff requires reason') !==
    'CODEBUDDY_TOOL_POLICY_EXCLUDES_TEST_EXECUTION'
  )
    reject('CodeBuddy testHandoff reason is invalid');
  requireString(
    receipt.metadata,
    'workspaceRelativeToRoot',
    'CodeBuddy implementation evidence requires workspaceRelativeToRoot',
  );
  const policy = requireArray(
    receipt.metadata,
    'toolPolicy',
    'CodeBuddy implementation evidence requires toolPolicy',
  );
  const expectedPolicy = ['Read', 'Edit', 'Glob', 'Grep'];
  if (
    policy.length !== expectedPolicy.length ||
    policy.some((item, index) => item !== expectedPolicy[index])
  )
    reject('CodeBuddy implementation toolPolicy must be exactly Read/Edit/Glob/Grep');
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

  verifyAstryxScaffoldProposal(
    receipt: McfToolReceipt,
    inputs: Readonly<Record<string, unknown>>,
  ): void {
    const expected = {
      provider: 'mcf-astryx-cli',
      operation: 'draft-template-scaffold',
      resource: 'astryx-design-system',
    };
    this.verify(receipt, expected);
    validateAstryxDiscoveryReceipt(receipt, expected, inputs);
  }

  verifyForSkill(
    receipt: McfToolReceipt,
    expected: McfToolRequest,
    skill: McfSkillDefinition,
    inputs?: Readonly<Record<string, unknown>>,
    current?: EvidenceVerificationContext,
  ): void {
    this.verify(receipt, expected);

    const operation = canonicalizeToolValue(expected.operation);
    if (operation === 'query-ci' && skill.skillId !== 'MCF-RUN-TESTS') {
      reject('query-ci evidence is restricted to MCF-RUN-TESTS');
    }
    if (operation === 'query-ci') {
      validateCiQueryReceiptDomain(receipt, skill, current);
    }

    switch (skill.skillId) {
      case 'MCF-IMPLEMENT-CHANGE':
        if (operation === 'implement-change')
          validateCodeBuddyImplementReceipt(receipt, expected, inputs ?? {});
        break;
      case 'MCF-REVIEW-CODE':
        validateReviewReceipt(receipt);
        break;
      case 'MCF-RUN-TESTS':
        if (operation === 'query-ci') {
          validateCiQueryReceipt(receipt, expected, inputs);
        }
        break;
      case 'MCF-GIT-PR-RELEASE':
        validatePullRequestReceipt(receipt);
        break;
      case 'MCF-DEPLOY-VALIDATE':
        validateDeploymentReceipt(receipt);
        break;
      case 'MCF-AUDIT-VISUAL-DESKTOP':
        validateVisualDesktopAuditReceipt(receipt, inputs);
        break;
      case 'MCF-ASTRYX-COMPONENT-DISCOVERY':
        validateAstryxDiscoveryReceipt(receipt, expected, inputs);
        break;
      default:
        break;
    }
  }
}
