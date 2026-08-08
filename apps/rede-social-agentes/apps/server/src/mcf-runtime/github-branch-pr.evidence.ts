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

export interface GitHubBranchPrEvidenceContext {
  agentId: string;
  executionContext?: ExternalActionExecutionContext | undefined;
}

function reject(reason: string): never {
  throw new McfEvidenceRejectedError(reason);
}

function stringField(metadata: Record<string, unknown>, key: string): string {
  const value = metadata[key];
  if (typeof value !== 'string' || value.length === 0 || value !== value.trim()) {
    return reject(`branch/PR evidence requires signed ${key}`);
  }
  return value;
}

function integerField(metadata: Record<string, unknown>, key: string): number {
  const value = metadata[key];
  if (!Number.isInteger(value) || (value as number) < 1) {
    return reject(`branch/PR evidence requires positive integer ${key}`);
  }
  return value as number;
}

function inputString(inputs: Readonly<Record<string, unknown>>, key: string): string {
  const value = inputs[key];
  if (typeof value !== 'string' || value.length === 0 || value !== value.trim()) {
    return reject(`branch/PR evidence validation requires current ${key}`);
  }
  return value;
}

function exactSha(value: string, label: string): string {
  const normalized = value.toLowerCase();
  if (!SHA_40.test(normalized)) return reject(`${label} must be an exact 40-character SHA`);
  return normalized;
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
    parsed.hash ||
    !parsed.pathname.toLowerCase().startsWith(`/${repository.toLowerCase()}/`)
  ) {
    return reject(label);
  }
  return parsed;
}

export function verifyGitHubBranchPrEvidence(
  receipt: McfToolReceipt,
  expected: McfToolRequest,
  skill: McfSkillDefinition,
  inputs: Readonly<Record<string, unknown>>,
  current: GitHubBranchPrEvidenceContext,
): void {
  if (
    skill.skillId !== 'MCF-GIT-PR-RELEASE' ||
    canonicalizeProvider(expected.provider) !== 'github' ||
    canonicalizeToolValue(expected.operation) !== 'create-branch-pr'
  ) {
    reject('branch/PR evidence validator invoked for unsupported skill or operation');
  }
  if (
    canonicalizeProvider(receipt.provider) !== 'github' ||
    canonicalizeToolValue(receipt.operation) !== 'create-branch-pr' ||
    receipt.status !== 'SUCCEEDED'
  ) {
    reject('branch/PR evidence requires a successfully executed GitHub create-branch-pr receipt');
  }
  const commitSha = receipt.commitSha ? exactSha(receipt.commitSha, 'receipt commitSha') : null;
  if (!commitSha) reject('branch/PR evidence requires receipt commitSha');

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
    reject('branch/PR evidence requires current governed execution context');
  }

  const repository = stringField(receipt.metadata, 'repository');
  if (
    !REPOSITORY.test(repository) ||
    repository.toLowerCase() !== expected.resource.toLowerCase() ||
    repository.toLowerCase() !== inputString(inputs, 'repository').toLowerCase()
  ) {
    reject('branch/PR evidence repository must match current resource and inputs');
  }

  const baseRef = stringField(receipt.metadata, 'baseRef');
  const baseSha = exactSha(stringField(receipt.metadata, 'baseSha'), 'baseSha');
  const branchRef = stringField(receipt.metadata, 'branchRef');
  const branchSha = exactSha(stringField(receipt.metadata, 'branchSha'), 'branchSha');
  const verifiedHeadSha = exactSha(
    stringField(receipt.metadata, 'verifiedHeadSha'),
    'verifiedHeadSha',
  );
  const verifiedBaseRef = stringField(receipt.metadata, 'verifiedBaseRef');
  const verifiedBaseSha = exactSha(
    stringField(receipt.metadata, 'verifiedBaseSha'),
    'verifiedBaseSha',
  );
  const idempotencyKey = stringField(receipt.metadata, 'idempotencyKey');

  if (
    baseRef !== inputString(inputs, 'base_branch') ||
    baseSha !== exactSha(inputString(inputs, 'base_sha'), 'input base_sha') ||
    branchRef !== inputString(inputs, 'branch_ref') ||
    commitSha !== exactSha(inputString(inputs, 'commit_sha'), 'input commit_sha') ||
    branchSha !== commitSha ||
    verifiedHeadSha !== commitSha ||
    verifiedBaseRef !== baseRef ||
    verifiedBaseSha !== baseSha
  ) {
    reject('branch/PR evidence must bind base, branch and exact SHAs to current inputs');
  }
  if (
    !IDEMPOTENCY_KEY.test(idempotencyKey) ||
    idempotencyKey !== inputString(inputs, 'idempotency_key')
  ) {
    reject('branch/PR evidence idempotency key must match the current request');
  }

  if (
    stringField(receipt.metadata, 'skillId') !== skill.skillId ||
    stringField(receipt.metadata, 'skillVersion') !== skill.version ||
    stringField(receipt.metadata, 'agentId') !== current.agentId ||
    stringField(receipt.metadata, 'missionId') !== context.missionId ||
    stringField(receipt.metadata, 'phaseId') !== context.phaseId ||
    integerField(receipt.metadata, 'expectedMissionVersion') !== context.expectedMissionVersion
  ) {
    reject('branch/PR evidence signed execution domain must match the current context');
  }

  if (
    receipt.metadata.externalEffect !== 'REVERSIBLE' ||
    receipt.metadata.resultStatus !== 'SUCCEEDED' ||
    receipt.metadata.readBackVerified !== true
  ) {
    reject('branch/PR evidence requires verified reversible external effect');
  }

  const pullNumber = integerField(receipt.metadata, 'pullRequestNumber');
  if (receipt.externalId !== String(pullNumber)) {
    reject('branch/PR evidence externalId must match pull request number');
  }
  const pullUrl = githubUrl(
    receipt.metadata.pullRequestUrl,
    repository,
    'branch/PR evidence requires valid pull request URL',
  );
  if (pullUrl.pathname !== `/${repository}/pull/${pullNumber}`) {
    reject('branch/PR evidence pull request URL must match pull request number');
  }
  if (stringField(receipt.metadata, 'pullRequestState') !== 'open') {
    reject('branch/PR evidence requires an open pull request');
  }

  const permissions = receipt.metadata.requiredPermissions;
  const expectedPermissions = ['metadata:read', 'contents:write', 'pull_requests:write'];
  if (
    !Array.isArray(permissions) ||
    permissions.length !== expectedPermissions.length ||
    expectedPermissions.some((permission) => !permissions.includes(permission)) ||
    new Set(permissions).size !== permissions.length
  ) {
    reject('branch/PR evidence requires exactly the supported GitHub permission metadata');
  }

  const evidenceUrls = receipt.metadata.evidenceUrls;
  if (!Array.isArray(evidenceUrls) || evidenceUrls.length !== 3) {
    reject('branch/PR evidence requires commit, branch and pull request URLs');
  }
  const paths = evidenceUrls.map(
    (value) =>
      githubUrl(value, repository, 'branch/PR evidence contains invalid evidence URL').pathname,
  );
  if (!paths.includes(`/${repository}/commit/${commitSha}`) || !paths.includes(pullUrl.pathname)) {
    reject('branch/PR evidence must include exact commit and pull request URLs');
  }
}
