import { beforeEach, describe, expect, it } from 'vitest';

import { EvidenceValidator } from './evidence-validator.js';
import { verifyGitHubPrCollaborationEvidence } from './github-pr-collaboration.evidence.js';

const HEAD_SHA = '2'.repeat(40);
const KEY = 'mcf-c2-idempotency-0001';
const REPOSITORY = 'leon337/multiagent-collaboration-framework';
const PR_NUMBER = 79;

const skill = {
  skillId: 'MCF-GIT-PR-RELEASE',
  name: 'Git PR Release',
  version: '1.0.0',
  purpose: 'controlled collaboration',
  ownerAgents: ['Gabriel'],
  requiredInputs: [],
  allowedTools: ['github'],
  forbiddenTools: [],
  permissionProfile: 'SCOPED_WRITE' as const,
  executionSteps: [],
  requiredEvidence: [],
  acceptanceCriteria: [],
  failureModes: [],
  fallback: 'Mestre',
  handoffTo: 'Mestre',
};

const context = {
  agentId: 'Gabriel',
  executionContext: {
    missionId: 'mission-c2',
    phaseId: 'phase-c2',
    expectedMissionVersion: 1,
  },
};

function tool(operation: string) {
  return { provider: 'github', operation, resource: REPOSITORY };
}

function commonInputs(overrides: Record<string, unknown>) {
  return {
    repository: REPOSITORY,
    pull_request_number: PR_NUMBER,
    expected_head_sha: HEAD_SHA,
    idempotency_key: KEY,
    ...overrides,
  };
}

function digest(value: string): string {
  const { createHash } = require('node:crypto') as typeof import('node:crypto');
  return createHash('sha256').update(value).digest('hex');
}

function metadataDigest(title: string | null, body: string | null): string {
  const { createHash } = require('node:crypto') as typeof import('node:crypto');
  return createHash('sha256').update(JSON.stringify({ title, body })).digest('hex');
}

function receipt(
  evidence: EvidenceValidator,
  operation: string,
  contentDigest: string,
  overrides: Record<string, unknown> = {},
) {
  const mutationId = operation === 'update-pr-text-metadata' ? PR_NUMBER : 101;
  const pullUrl = `https://github.com/${REPOSITORY}/pull/${PR_NUMBER}`;
  const mutationUrl =
    operation === 'update-pr-text-metadata' ? pullUrl : `${pullUrl}#issuecomment-${mutationId}`;
  return evidence.createTrustedReceipt({
    provider: 'github',
    operation,
    resource: REPOSITORY,
    externalId: String(mutationId),
    commitSha: HEAD_SHA,
    status: 'SUCCEEDED',
    observedAt: new Date().toISOString(),
    metadata: {
      adapterId: 'github-pr-collaboration-write-v1',
      adapterVersion: '1.0.0',
      repository: REPOSITORY,
      pullRequestNumber: PR_NUMBER,
      pullRequestUrl: pullUrl,
      verifiedHeadSha: HEAD_SHA,
      idempotencyKey: KEY,
      mutationType: operation,
      mutationExternalId: mutationId,
      mutationUrl,
      contentDigest,
      externalEffect: 'REVERSIBLE',
      resultStatus: 'SUCCEEDED',
      readBackVerified: true,
      requiredPermissions: ['metadata:read', 'pull_requests:write'],
      evidenceUrls: operation === 'update-pr-text-metadata' ? [pullUrl] : [pullUrl, mutationUrl],
      skillId: skill.skillId,
      skillVersion: skill.version,
      agentId: context.agentId,
      missionId: context.executionContext.missionId,
      phaseId: context.executionContext.phaseId,
      expectedMissionVersion: context.executionContext.expectedMissionVersion,
      ...overrides,
    },
  });
}

describe('verifyGitHubPrCollaborationEvidence', () => {
  beforeEach(() => {
    process.env.MCF_RECEIPT_SECRET = 'test-secret-that-is-long-enough-for-mcf-runtime';
  });

  it('accepts comment evidence bound to the current input and execution domain', () => {
    const evidence = new EvidenceValidator();
    const inputs = commonInputs({ comment_body: 'Checkpoint' });
    const current = receipt(evidence, 'comment-pr', digest('Checkpoint'));
    evidence.verify(current, tool('comment-pr'));
    expect(() =>
      verifyGitHubPrCollaborationEvidence(current, tool('comment-pr'), skill, inputs, context),
    ).not.toThrow();
  });

  it('rejects replay against another exact HEAD SHA', () => {
    const evidence = new EvidenceValidator();
    const current = receipt(evidence, 'comment-pr', digest('Checkpoint'));
    expect(() =>
      verifyGitHubPrCollaborationEvidence(
        current,
        tool('comment-pr'),
        skill,
        commonInputs({ comment_body: 'Checkpoint', expected_head_sha: '3'.repeat(40) }),
        context,
      ),
    ).toThrow(/exact PR HEAD SHA/u);
  });

  it('rejects a changed idempotency key', () => {
    const evidence = new EvidenceValidator();
    const current = receipt(evidence, 'review-pr-comment', digest('Review note'));
    expect(() =>
      verifyGitHubPrCollaborationEvidence(
        current,
        tool('review-pr-comment'),
        skill,
        commonInputs({
          review_body: 'Review note',
          idempotency_key: 'mcf-c2-idempotency-9999',
        }),
        context,
      ),
    ).toThrow(/idempotency key/u);
  });

  it('accepts metadata evidence only when verified title/body match the current patch', () => {
    const evidence = new EvidenceValidator();
    const inputs = commonInputs({ title: 'Controlled title', body: 'Controlled body' });
    const current = receipt(
      evidence,
      'update-pr-text-metadata',
      metadataDigest('Controlled title', 'Controlled body'),
      { verifiedTitle: 'Controlled title', verifiedBody: 'Controlled body' },
    );
    expect(() =>
      verifyGitHubPrCollaborationEvidence(
        current,
        tool('update-pr-text-metadata'),
        skill,
        inputs,
        context,
      ),
    ).not.toThrow();

    expect(() =>
      verifyGitHubPrCollaborationEvidence(
        current,
        tool('update-pr-text-metadata'),
        skill,
        { ...inputs, title: 'Different title' },
        context,
      ),
    ).toThrow(/digest|title\/body/u);
  });

  it('rejects execution-domain replay', () => {
    const evidence = new EvidenceValidator();
    const current = receipt(evidence, 'comment-pr', digest('Checkpoint'));
    expect(() =>
      verifyGitHubPrCollaborationEvidence(
        current,
        tool('comment-pr'),
        skill,
        commonInputs({ comment_body: 'Checkpoint' }),
        {
          ...context,
          executionContext: { ...context.executionContext, missionId: 'mission-other' },
        },
      ),
    ).toThrow(/execution domain/u);
  });
});
