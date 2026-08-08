import { createHash } from 'node:crypto';

import type { McfSkillDefinition, McfToolReceipt } from '@rsa/contracts';

import type { ExternalActionExecutionContext } from './external-action.contracts.js';
import { McfEvidenceRejectedError } from './mcf-runtime.errors.js';
import {
  canonicalizeProvider,
  canonicalizeToolValue,
  type McfToolRequest,
} from './permission-engine.js';

const SHA_40 = /^[a-f0-9]{40}$/u;
const REPOSITORY =
  /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?\/(?!\.{1,2}$)[A-Za-z0-9._-]{1,100}$/u;
const IDEMPOTENCY_KEY = /^[A-Za-z0-9][A-Za-z0-9._:-]{15,127}$/u;
const OPERATIONS = new Set(['comment-pr', 'review-pr-comment', 'update-pr-text-metadata']);

export interface GitHubPrCollaborationEvidenceContext {
  agentId: string;
  executionContext?: ExternalActionExecutionContext | undefined;
}

function reject(reason: string): never {
  throw new McfEvidenceRejectedError(reason);
}

function stringField(metadata: Record<string, unknown>, key: string): string {
  const value = metadata[key];
  if (typeof value !== 'string' || value.length === 0 || value !== value.trim()) {
    return reject(`PR collaboration evidence requires signed ${key}`);
  }
  return value;
}

function integerField(metadata: Record<string, unknown>, key: string): number {
  const value = metadata[key];
  if (!Number.isInteger(value) || (value as number) < 1) {
    return reject(`PR collaboration evidence requires positive integer ${key}`);
  }
  return value as number;
}

function inputString(inputs: Readonly<Record<string, unknown>>, key: string): string {
  const value = inputs[key];
  if (typeof value !== 'string' || value.length === 0 || value !== value.trim()) {
    return reject(`PR collaboration evidence validation requires current ${key}`);
  }
  return value;
}

function inputInteger(inputs: Readonly<Record<string, unknown>>, key: string): number {
  const value = inputs[key];
  if (!Number.isInteger(value) || (value as number) < 1) {
    return reject(`PR collaboration evidence validation requires current ${key}`);
  }
  return value as number;
}

function exactSha(value: string, label: string): string {
  const normalized = value.toLowerCase();
  if (!SHA_40.test(normalized)) return reject(`${label} must be an exact 40-character SHA`);
  return normalized;
}

function textDigest(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function metadataPatchDigest(inputs: Readonly<Record<string, unknown>>): string {
  const title = typeof inputs.title === 'string' ? inputs.title : null;
  const body = typeof inputs.body === 'string' ? inputs.body : null;
  return createHash('sha256').update(JSON.stringify({ title, body })).digest('hex');
}

function githubUrl(value: unknown, repository: string, label: string): URL {
  if (typeof value !== 'string') return reject(label);
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return reject(label);
  }
  if (
    parsed.protocol !== 'https:' ||
    parsed.hostname.toLowerCase() !== 'github.com' ||
    parsed.username ||
    parsed.password ||
    parsed.port ||
    parsed.search ||
    !parsed.pathname.toLowerCase().startsWith(`/${repository.toLowerCase()}/`)
  ) {
    return reject(label);
  }
  return parsed;
}

export function verifyGitHubPrCollaborationEvidence(
  receipt: McfToolReceipt,
  expected: McfToolRequest,
  skill: McfSkillDefinition,
  inputs: Readonly<Record<string, unknown>>,
  current: GitHubPrCollaborationEvidenceContext,
): void {
  const operation = canonicalizeToolValue(expected.operation);
  if (
    skill.skillId !== 'MCF-GIT-PR-RELEASE' ||
    canonicalizeProvider(expected.provider) !== 'github' ||
    !OPERATIONS.has(operation)
  ) {
    reject('PR collaboration evidence validator invoked for unsupported skill or operation');
  }
  if (
    canonicalizeProvider(receipt.provider) !== 'github' ||
    canonicalizeToolValue(receipt.operation) !== operation ||
    receipt.status !== 'SUCCEEDED'
  ) {
    reject('PR collaboration evidence requires a successful matching GitHub write receipt');
  }

  const context = current.executionContext;
  if (
    !context ||
    !current.agentId ||
    current.agentId !== current.agentId.trim() ||
    !context.missionId ||
    context.missionId !== context.missionId.trim() ||
    !context.phaseId ||
    context.phaseId !== context.phaseId.trim() ||
    !Number.isInteger(context.expectedMissionVersion) ||
    context.expectedMissionVersion < 1
  ) {
    reject('PR collaboration evidence requires current governed execution context');
  }

  const repository = stringField(receipt.metadata, 'repository');
  if (
    !REPOSITORY.test(repository) ||
    repository.toLowerCase() !== expected.resource.toLowerCase() ||
    repository.toLowerCase() !== inputString(inputs, 'repository').toLowerCase()
  ) {
    reject('PR collaboration evidence repository must match current resource and inputs');
  }

  const pullNumber = integerField(receipt.metadata, 'pullRequestNumber');
  if (pullNumber !== inputInteger(inputs, 'pull_request_number')) {
    reject('PR collaboration evidence pull request number must match current inputs');
  }

  const expectedHeadSha = exactSha(
    inputString(inputs, 'expected_head_sha'),
    'input expected_head_sha',
  );
  const verifiedHeadSha = exactSha(
    stringField(receipt.metadata, 'verifiedHeadSha'),
    'verifiedHeadSha',
  );
  const receiptCommitSha = receipt.commitSha
    ? exactSha(receipt.commitSha, 'receipt commitSha')
    : reject('PR collaboration evidence requires receipt commitSha');
  if (verifiedHeadSha !== expectedHeadSha || receiptCommitSha !== expectedHeadSha) {
    reject('PR collaboration evidence must bind the exact PR HEAD SHA to current inputs');
  }

  const idempotencyKey = stringField(receipt.metadata, 'idempotencyKey');
  if (
    !IDEMPOTENCY_KEY.test(idempotencyKey) ||
    idempotencyKey !== inputString(inputs, 'idempotency_key')
  ) {
    reject('PR collaboration evidence idempotency key must match the current request');
  }

  if (
    stringField(receipt.metadata, 'mutationType') !== operation ||
    stringField(receipt.metadata, 'skillId') !== skill.skillId ||
    stringField(receipt.metadata, 'skillVersion') !== skill.version ||
    stringField(receipt.metadata, 'agentId') !== current.agentId ||
    stringField(receipt.metadata, 'missionId') !== context.missionId ||
    stringField(receipt.metadata, 'phaseId') !== context.phaseId ||
    integerField(receipt.metadata, 'expectedMissionVersion') !== context.expectedMissionVersion
  ) {
    reject('PR collaboration evidence signed execution domain must match current context');
  }

  if (
    receipt.metadata.externalEffect !== 'REVERSIBLE' ||
    receipt.metadata.resultStatus !== 'SUCCEEDED' ||
    receipt.metadata.readBackVerified !== true
  ) {
    reject('PR collaboration evidence requires verified reversible external effect');
  }

  const expectedPermissions = ['metadata:read', 'pull_requests:write'];
  const permissions = receipt.metadata.requiredPermissions;
  if (
    !Array.isArray(permissions) ||
    permissions.length !== expectedPermissions.length ||
    expectedPermissions.some((permission) => !permissions.includes(permission)) ||
    new Set(permissions).size !== permissions.length
  ) {
    reject('PR collaboration evidence requires exactly the supported GitHub permissions');
  }

  const pullUrl = githubUrl(
    receipt.metadata.pullRequestUrl,
    repository,
    'PR collaboration evidence requires a valid pull request URL',
  );
  if (
    pullUrl.pathname.toLowerCase() !== `/${repository}/pull/${pullNumber}`.toLowerCase() ||
    pullUrl.search ||
    pullUrl.hash
  ) {
    reject('PR collaboration evidence pull request URL must match the target PR');
  }

  const digest = stringField(receipt.metadata, 'contentDigest');
  if (operation === 'comment-pr') {
    if (digest !== textDigest(inputString(inputs, 'comment_body'))) {
      reject('PR collaboration comment evidence digest must match current input');
    }
  } else if (operation === 'review-pr-comment') {
    if (digest !== textDigest(inputString(inputs, 'review_body'))) {
      reject('PR collaboration review evidence digest must match current input');
    }
  } else {
    if (digest !== metadataPatchDigest(inputs)) {
      reject('PR collaboration metadata evidence digest must match current title/body patch');
    }
    const title = typeof inputs.title === 'string' ? inputs.title : null;
    const body = typeof inputs.body === 'string' ? inputs.body : null;
    if (receipt.metadata.verifiedTitle !== title || receipt.metadata.verifiedBody !== body) {
      reject('PR collaboration metadata evidence must bind verified title/body values');
    }
  }

  const mutationExternalId = integerField(receipt.metadata, 'mutationExternalId');
  if (receipt.externalId !== String(mutationExternalId)) {
    reject('PR collaboration evidence externalId must match mutationExternalId');
  }
  if (operation === 'update-pr-text-metadata' && mutationExternalId !== pullNumber) {
    reject('PR collaboration metadata externalId must be the pull request number');
  }

  const mutationUrl = githubUrl(
    receipt.metadata.mutationUrl,
    repository,
    'PR collaboration evidence requires a valid mutation URL',
  );
  if (operation === 'update-pr-text-metadata') {
    if (mutationUrl.href.toLowerCase() !== pullUrl.href.toLowerCase()) {
      reject('PR collaboration metadata mutation URL must equal the pull request URL');
    }
  } else if (
    mutationUrl.pathname.toLowerCase() !== `/${repository}/pull/${pullNumber}`.toLowerCase() ||
    !mutationUrl.hash
  ) {
    reject('PR collaboration comment/review URL must belong to the target pull request');
  }

  const evidenceUrls = receipt.metadata.evidenceUrls;
  const expectedLength = operation === 'update-pr-text-metadata' ? 1 : 2;
  if (!Array.isArray(evidenceUrls) || evidenceUrls.length !== expectedLength) {
    reject('PR collaboration evidence URLs do not match the operation');
  }
  if (!evidenceUrls.includes(pullUrl.href)) {
    reject('PR collaboration evidence must include the pull request URL');
  }
  if (operation !== 'update-pr-text-metadata' && !evidenceUrls.includes(mutationUrl.href)) {
    reject('PR collaboration evidence must include the mutation URL');
  }
}
