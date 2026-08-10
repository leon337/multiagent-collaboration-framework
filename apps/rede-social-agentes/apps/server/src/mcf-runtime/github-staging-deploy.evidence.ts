import type { McfSkillDefinition, McfToolReceipt } from '@rsa/contracts';

import type { EvidenceVerificationContext } from './evidence-validator.js';
import { McfEvidenceRejectedError } from './mcf-runtime.errors.js';
import {
  canonicalizeProvider,
  canonicalizeToolValue,
  type McfToolRequest,
} from './permission-engine.js';

const SHA_40 = /^[a-f0-9]{40}$/u;
const REPOSITORY = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u;
const WORKFLOW_PATH = '.github/workflows/mcf-runtime-staging-deploy.yml';
const ADAPTER_ID = 'github-actions-staging-deploy-v1';
const REQUIRED_PERMISSIONS = ['actions:read', 'actions:write', 'contents:read'];

function reject(message: string): never {
  throw new McfEvidenceRejectedError(message);
}

function stringValue(metadata: Record<string, unknown>, key: string, message: string): string {
  const value = metadata[key];
  if (typeof value !== 'string' || value.length === 0 || value !== value.trim()) {
    return reject(message);
  }
  return value;
}

function booleanValue(metadata: Record<string, unknown>, key: string, message: string): boolean {
  const value = metadata[key];
  if (typeof value !== 'boolean') return reject(message);
  return value;
}

function integerValue(metadata: Record<string, unknown>, key: string, message: string): number {
  const value = metadata[key];
  if (!Number.isInteger(value) || (value as number) < 1) return reject(message);
  return value as number;
}

function exactSha(value: unknown, message: string): string {
  if (typeof value !== 'string' || value !== value.trim()) return reject(message);
  const normalized = value.toLowerCase();
  if (!SHA_40.test(normalized)) return reject(message);
  return normalized;
}

function canonicalRepository(value: unknown, message: string): string {
  if (typeof value !== 'string' || value !== value.trim() || !REPOSITORY.test(value)) {
    return reject(message);
  }
  return value;
}

function verifyRunUrl(value: unknown, repository: string, runId: number): string {
  if (typeof value !== 'string' || value !== value.trim()) {
    return reject('staging deployment evidence requires canonical workflowRunUrl');
  }
  const expected = `https://github.com/${repository}/actions/runs/${runId}`;
  if (value.toLowerCase() !== expected.toLowerCase()) {
    return reject('staging deployment workflowRunUrl must match workflowRunId');
  }
  return value;
}

function verifyEvidenceUrls(
  metadata: Record<string, unknown>,
  repository: string,
  runId: number,
  releaseSha: string,
): void {
  const value = metadata.evidenceUrls;
  if (
    !Array.isArray(value) ||
    value.length !== 2 ||
    value.some((item) => typeof item !== 'string')
  ) {
    reject('staging deployment evidenceUrls must contain exactly run and commit URLs');
  }
  const expected = new Set([
    `https://github.com/${repository}/actions/runs/${runId}`.toLowerCase(),
    `https://github.com/${repository}/commit/${releaseSha}`.toLowerCase(),
  ]);
  const observed = new Set((value as string[]).map((item) => item.toLowerCase()));
  if (observed.size !== expected.size || [...expected].some((item) => !observed.has(item))) {
    reject('staging deployment evidenceUrls do not match the governed run and release');
  }
}

function verifyPermissions(metadata: Record<string, unknown>): void {
  const value = metadata.requiredPermissions;
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    reject('staging deployment evidence requires permission metadata');
  }
  const observed = new Set(value as string[]);
  if (
    observed.size !== REQUIRED_PERMISSIONS.length ||
    REQUIRED_PERMISSIONS.some((permission) => !observed.has(permission))
  ) {
    reject('staging deployment evidence permission metadata is not least-privilege expected set');
  }
}

function verifyRequestBudget(metadata: Record<string, unknown>): void {
  const value = metadata.requestBudget;
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    reject('staging deployment evidence requires requestBudget');
  }
  const record = value as Record<string, unknown>;
  if (
    !Number.isInteger(record.requests) ||
    (record.requests as number) < 1 ||
    !Number.isInteger(record.limit) ||
    (record.limit as number) < 1 ||
    (record.requests as number) > (record.limit as number)
  ) {
    reject('staging deployment evidence requestBudget is invalid');
  }
}

function verifyGovernedContext(
  receipt: McfToolReceipt,
  skill: McfSkillDefinition,
  current?: EvidenceVerificationContext,
): void {
  if (
    !current ||
    typeof current.agentId !== 'string' ||
    current.agentId.length === 0 ||
    !current.executionContext
  ) {
    reject('staging deployment evidence requires governed execution context');
  }
  const context = current.executionContext;
  if (
    stringValue(receipt.metadata, 'skillId', 'staging deployment evidence requires skillId') !==
      skill.skillId ||
    stringValue(
      receipt.metadata,
      'skillVersion',
      'staging deployment evidence requires skillVersion',
    ) !== skill.version ||
    stringValue(receipt.metadata, 'agentId', 'staging deployment evidence requires agentId') !==
      current.agentId ||
    stringValue(receipt.metadata, 'missionId', 'staging deployment evidence requires missionId') !==
      context.missionId ||
    stringValue(receipt.metadata, 'phaseId', 'staging deployment evidence requires phaseId') !==
      context.phaseId ||
    integerValue(
      receipt.metadata,
      'expectedMissionVersion',
      'staging deployment evidence requires expectedMissionVersion',
    ) !== context.expectedMissionVersion
  ) {
    reject('staging deployment evidence does not match governed execution context');
  }
}

export type StagingDeploymentOutcome = 'DEPLOYED' | 'NOOP' | 'RECOVERED';

export function stagingDeploymentOutcome(receipt: McfToolReceipt): StagingDeploymentOutcome | null {
  const value = receipt.metadata.deploymentOutcome;
  return value === 'DEPLOYED' || value === 'NOOP' || value === 'RECOVERED' ? value : null;
}

export function verifyGitHubStagingDeployEvidence(
  receipt: McfToolReceipt,
  expected: McfToolRequest,
  skill: McfSkillDefinition,
  inputs: Readonly<Record<string, unknown>>,
  current?: EvidenceVerificationContext,
): void {
  if (
    skill.skillId !== 'MCF-DEPLOY-VALIDATE' ||
    canonicalizeProvider(expected.provider) !== 'github' ||
    canonicalizeToolValue(expected.operation) !== 'deploy-staging' ||
    receipt.provider !== 'github-actions'
  ) {
    reject('staging deployment evidence is restricted to GitHub Actions MCF-DEPLOY-VALIDATE');
  }
  if (receipt.status !== 'SUCCEEDED') {
    reject('staging deployment terminal evidence must use SUCCEEDED receipt status');
  }
  if (
    stringValue(receipt.metadata, 'adapterId', 'staging deployment evidence requires adapterId') !==
      ADAPTER_ID ||
    stringValue(
      receipt.metadata,
      'adapterVersion',
      'staging deployment evidence requires adapterVersion',
    ) !== '1.0.0'
  ) {
    reject('staging deployment adapter identity is invalid');
  }

  const repository = canonicalRepository(expected.resource, 'invalid staging deployment resource');
  const metadataRepository = canonicalRepository(
    receipt.metadata.repository,
    'staging deployment evidence requires repository',
  );
  const inputRepository = canonicalRepository(
    inputs.repository,
    'staging deployment evidence requires repository input',
  );
  if (
    metadataRepository.toLowerCase() !== repository.toLowerCase() ||
    inputRepository.toLowerCase() !== repository.toLowerCase()
  ) {
    reject('staging deployment repository binding mismatch');
  }

  if (canonicalizeToolValue(String(inputs.target_environment ?? '')) !== 'staging') {
    reject('staging deployment evidence requires target_environment=staging');
  }
  const targetEnvironment = stringValue(
    receipt.metadata,
    'targetEnvironment',
    'staging deployment evidence requires targetEnvironment',
  );
  if (canonicalizeToolValue(targetEnvironment) !== 'staging') {
    reject('staging deployment evidence must prove staging target');
  }

  const releaseSha = exactSha(inputs.artifact_or_commit, 'invalid staging artifact_or_commit');
  if (
    !receipt.commitSha ||
    exactSha(receipt.commitSha, 'invalid staging receipt commit SHA') !== releaseSha ||
    exactSha(receipt.metadata.requestedSha, 'invalid staging requestedSha') !== releaseSha
  ) {
    reject('staging deployment evidence must bind to exact requested release SHA');
  }

  const idempotencyKey =
    typeof inputs.idempotency_key === 'string'
      ? inputs.idempotency_key
      : reject('missing idempotency key');
  if (
    stringValue(receipt.metadata, 'requestId', 'staging deployment evidence requires requestId') !==
      idempotencyKey ||
    stringValue(
      receipt.metadata,
      'idempotencyKey',
      'staging deployment evidence requires idempotencyKey',
    ) !== idempotencyKey
  ) {
    reject('staging deployment evidence idempotency binding mismatch');
  }

  const runId = Number(receipt.externalId);
  if (!Number.isSafeInteger(runId) || runId < 1) {
    reject('staging deployment evidence requires numeric workflow run id');
  }
  if (
    integerValue(
      receipt.metadata,
      'workflowRunId',
      'staging deployment evidence requires workflowRunId',
    ) !== runId
  ) {
    reject('staging deployment workflowRunId must match externalId');
  }
  verifyRunUrl(receipt.metadata.workflowRunUrl, repository, runId);

  const governed = current?.executionContext;
  if (!governed) reject('staging deployment workflow title requires governed execution context');
  const expectedTitle = `MCF staging deploy ${idempotencyKey} ${releaseSha} ${governed.missionId} ${governed.phaseId}`;
  if (
    stringValue(
      receipt.metadata,
      'workflowDisplayTitle',
      'staging deployment evidence requires workflowDisplayTitle',
    ) !== expectedTitle ||
    stringValue(
      receipt.metadata,
      'workflowPath',
      'staging deployment evidence requires workflowPath',
    ) !== WORKFLOW_PATH ||
    stringValue(
      receipt.metadata,
      'workflowEvent',
      'staging deployment evidence requires workflowEvent',
    ) !== 'workflow_dispatch' ||
    stringValue(
      receipt.metadata,
      'workflowStatus',
      'staging deployment evidence requires workflowStatus',
    ) !== 'completed'
  ) {
    reject('staging deployment workflow provenance is invalid');
  }

  const workflowConclusion = stringValue(
    receipt.metadata,
    'workflowConclusion',
    'staging deployment evidence requires workflowConclusion',
  );
  if (
    stringValue(
      receipt.metadata,
      'conclusion',
      'staging deployment evidence requires conclusion',
    ) !== workflowConclusion
  ) {
    reject('staging deployment conclusion aliases do not match');
  }

  if (
    stringValue(
      receipt.metadata,
      'deploymentProvider',
      'staging deployment evidence requires deploymentProvider',
    ) !== 'render' ||
    stringValue(
      receipt.metadata,
      'recoveryStrategy',
      'staging deployment evidence requires recoveryStrategy',
    ) !== 'REDEPLOY_PREVIOUS_HEALTHY_SHA' ||
    booleanValue(
      receipt.metadata,
      'nativeRollbackClaimed',
      'staging deployment evidence requires nativeRollbackClaimed',
    ) !== false ||
    booleanValue(
      receipt.metadata,
      'rollbackAvailable',
      'staging deployment evidence requires rollbackAvailable',
    ) !== true ||
    booleanValue(
      receipt.metadata,
      'stagingReady',
      'staging deployment evidence requires stagingReady',
    ) !== true ||
    integerValue(
      receipt.metadata,
      'stagingReadyStatus',
      'staging deployment evidence requires stagingReadyStatus',
    ) !== 200 ||
    stringValue(
      receipt.metadata,
      'smokeStatus',
      'staging deployment evidence requires smokeStatus',
    ) !== 'pass'
  ) {
    reject('staging deployment recovery/smoke metadata is invalid');
  }

  const previousSha = exactSha(receipt.metadata.previousSha, 'invalid staging previousSha');
  const verifiedSha = exactSha(receipt.metadata.verifiedSha, 'invalid staging verifiedSha');
  const outcome = stagingDeploymentOutcome(receipt);
  if (!outcome) reject('staging deployment evidence requires supported deploymentOutcome');

  if (outcome === 'DEPLOYED') {
    if (
      workflowConclusion !== 'success' ||
      verifiedSha !== releaseSha ||
      stringValue(
        receipt.metadata,
        'deploymentStatus',
        'staging deployment evidence requires deploymentStatus',
      ) !== 'success' ||
      stringValue(
        receipt.metadata,
        'resultStatus',
        'staging deployment evidence requires resultStatus',
      ) !== 'SUCCEEDED'
    ) {
      reject('DEPLOYED evidence does not prove exact healthy release');
    }
  } else if (outcome === 'NOOP') {
    if (
      workflowConclusion !== 'success' ||
      previousSha !== releaseSha ||
      verifiedSha !== releaseSha ||
      stringValue(
        receipt.metadata,
        'deploymentStatus',
        'staging deployment evidence requires deploymentStatus',
      ) !== 'success' ||
      stringValue(
        receipt.metadata,
        'resultStatus',
        'staging deployment evidence requires resultStatus',
      ) !== 'SUCCEEDED'
    ) {
      reject('NOOP evidence does not prove requested release was already healthy');
    }
  } else if (
    workflowConclusion !== 'failure' ||
    previousSha === releaseSha ||
    verifiedSha !== previousSha ||
    stringValue(
      receipt.metadata,
      'deploymentStatus',
      'staging deployment evidence requires deploymentStatus',
    ) !== 'recovered' ||
    stringValue(
      receipt.metadata,
      'resultStatus',
      'staging deployment evidence requires resultStatus',
    ) !== 'RECOVERED'
  ) {
    reject('RECOVERED evidence does not prove previous healthy SHA restoration');
  }

  verifyPermissions(receipt.metadata);
  verifyRequestBudget(receipt.metadata);
  verifyEvidenceUrls(receipt.metadata, repository, runId, releaseSha);
  verifyGovernedContext(receipt, skill, current);
}
