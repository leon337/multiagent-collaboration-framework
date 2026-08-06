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

function requireString(metadata: Record<string, unknown>, key: string, message: string): string {
  const value = metadata[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new McfEvidenceRejectedError(message);
  }
  return value;
}

function requireBoolean(metadata: Record<string, unknown>, key: string, message: string): boolean {
  const value = metadata[key];
  if (typeof value !== 'boolean') {
    throw new McfEvidenceRejectedError(message);
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
    throw new McfEvidenceRejectedError(message);
  }
  return value as number;
}

function requireNonEmptyArray(
  metadata: Record<string, unknown>,
  key: string,
  message: string,
): unknown[] {
  const value = metadata[key];
  if (!Array.isArray(value) || value.length === 0) {
    throw new McfEvidenceRejectedError(message);
  }
  return value;
}

function validateReviewReceipt(receipt: McfToolReceipt): void {
  if (canonicalizeProvider(receipt.provider) !== 'github' || !receipt.commitSha) {
    throw new McfEvidenceRejectedError(
      'code review evidence requires GitHub and reviewed commit SHA',
    );
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

function validatePullRequestReceipt(receipt: McfToolReceipt): void {
  if (
    canonicalizeProvider(receipt.provider) !== 'github' ||
    !receipt.externalId ||
    !receipt.commitSha
  ) {
    throw new McfEvidenceRejectedError(
      'pull request evidence requires GitHub PR id and commit SHA',
    );
  }
  const ciStatus = requireString(
    receipt.metadata,
    'ciStatus',
    'pull request evidence requires ciStatus',
  );
  if (ciStatus !== 'success') {
    throw new McfEvidenceRejectedError('pull request evidence requires successful CI');
  }
  const gateDecision = requireString(
    receipt.metadata,
    'gateDecision',
    'pull request evidence requires gateDecision',
  );
  if (gateDecision !== 'approved') {
    throw new McfEvidenceRejectedError('pull request evidence requires approved gate');
  }
  requireString(receipt.metadata, 'prState', 'pull request evidence requires prState');
}

function validateDeploymentReceipt(receipt: McfToolReceipt): void {
  const deployProviders = new Set(['render', 'vercel', 'cloudflare']);
  if (!deployProviders.has(receipt.provider) || !receipt.externalId || !receipt.commitSha) {
    throw new McfEvidenceRejectedError(
      'deployment evidence requires supported provider, deployment id and commit SHA',
    );
  }
  const deploymentStatus = requireString(
    receipt.metadata,
    'deploymentStatus',
    'deployment evidence requires deploymentStatus',
  );
  if (!['live', 'ready', 'success'].includes(deploymentStatus)) {
    throw new McfEvidenceRejectedError('deployment evidence does not prove a healthy deployment');
  }
  const smokeStatus = requireString(
    receipt.metadata,
    'smokeStatus',
    'deployment evidence requires smokeStatus',
  );
  if (!['pass', 'success'].includes(smokeStatus)) {
    throw new McfEvidenceRejectedError('deployment evidence requires a passing smoke test');
  }
  const rollbackAvailable = requireBoolean(
    receipt.metadata,
    'rollbackAvailable',
    'deployment evidence requires rollbackAvailable',
  );
  if (!rollbackAvailable) {
    throw new McfEvidenceRejectedError('deployment evidence requires rollbackAvailable=true');
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
      throw new McfEvidenceRejectedError('receipt signature is invalid');
    }

    if (receipt.payloadDigest !== digest(receipt.metadata)) {
      throw new McfEvidenceRejectedError('receipt payload digest does not match metadata');
    }

    if (
      canonicalizeProvider(receipt.provider) !== canonicalizeProvider(expected.provider) ||
      canonicalizeToolValue(receipt.operation) !==
        canonicalizeToolValue(expected.operation) ||
      receipt.resource !== expected.resource
    ) {
      throw new McfEvidenceRejectedError('receipt does not match the requested tool operation');
    }

    const observedAt = new Date(receipt.observedAt);
    if (Number.isNaN(observedAt.getTime())) {
      throw new McfEvidenceRejectedError('receipt observedAt is invalid');
    }

    const ageMilliseconds = Date.now() - observedAt.getTime();
    if (ageMilliseconds < -300_000 || ageMilliseconds > 604_800_000) {
      throw new McfEvidenceRejectedError('receipt is outside the accepted time window');
    }

    if (receipt.provider === 'github' && !receipt.externalId && !receipt.commitSha) {
      throw new McfEvidenceRejectedError('GitHub evidence requires an external id or commit SHA');
    }

    if (receipt.provider === 'github-actions') {
      if (!receipt.externalId || !receipt.commitSha) {
        throw new McfEvidenceRejectedError(
          'GitHub Actions evidence requires workflow run id and commit SHA',
        );
      }
      if (typeof receipt.metadata.conclusion !== 'string') {
        throw new McfEvidenceRejectedError('GitHub Actions evidence requires conclusion');
      }
    }
  }

  verifyForSkill(
    receipt: McfToolReceipt,
    expected: McfToolRequest,
    skill: McfSkillDefinition,
  ): void {
    this.verify(receipt, expected);

    switch (skill.skillId) {
      case 'MCF-REVIEW-CODE':
        validateReviewReceipt(receipt);
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
