import { createHash } from 'node:crypto';

import { beforeEach, describe, expect, it } from 'vitest';

import { EvidenceValidator } from './evidence-validator.js';
import { verifyGitHubPrCollaborationEvidence } from './github-pr-collaboration.evidence.js';

const HEAD_SHA = '2'.repeat(40);
const KEY = 'mcf-c2-idempotency-url-binding-0001';
const REPOSITORY = 'leon337/multiagent-collaboration-framework';
const PR_NUMBER = 79;
const MUTATION_ID = 202;

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
    missionId: 'mission-c2-url-binding',
    phaseId: 'phase-c2-url-binding',
    expectedMissionVersion: 1,
  },
};

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function tool(operation: 'comment-pr' | 'review-pr-comment') {
  return { provider: 'github', operation, resource: REPOSITORY };
}

function inputs(operation: 'comment-pr' | 'review-pr-comment') {
  return {
    repository: REPOSITORY,
    pull_request_number: PR_NUMBER,
    expected_head_sha: HEAD_SHA,
    idempotency_key: KEY,
    ...(operation === 'comment-pr' ? { comment_body: 'Comment body' } : { review_body: 'Review body' }),
  };
}

function trustedReceipt(
  evidence: EvidenceValidator,
  operation: 'comment-pr' | 'review-pr-comment',
  mutationId = MUTATION_ID,
  fragmentId = mutationId,
) {
  const pullUrl = `https://github.com/${REPOSITORY}/pull/${PR_NUMBER}`;
  const fragment =
    operation === 'comment-pr' ? `#issuecomment-${fragmentId}` : `#pullrequestreview-${fragmentId}`;
  const mutationUrl = `${pullUrl}${fragment}`;
  const body = operation === 'comment-pr' ? 'Comment body' : 'Review body';

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
      contentDigest: digest(body),
      externalEffect: 'REVERSIBLE',
      resultStatus: 'SUCCEEDED',
      readBackVerified: true,
      requiredPermissions: ['metadata:read', 'pull_requests:write'],
      evidenceUrls: [pullUrl, mutationUrl],
      skillId: skill.skillId,
      skillVersion: skill.version,
      agentId: context.agentId,
      missionId: context.executionContext.missionId,
      phaseId: context.executionContext.phaseId,
      expectedMissionVersion: context.executionContext.expectedMissionVersion,
    },
  });
}

describe('GitHub PR collaboration evidence URL binding', () => {
  beforeEach(() => {
    process.env.MCF_RECEIPT_SECRET = 'test-secret-that-is-long-enough-for-mcf-runtime';
  });

  it('accepts comment and review URLs bound to their exact mutation external IDs', () => {
    const evidence = new EvidenceValidator();

    for (const operation of ['comment-pr', 'review-pr-comment'] as const) {
      const current = trustedReceipt(evidence, operation);
      evidence.verify(current, tool(operation));
      expect(() =>
        verifyGitHubPrCollaborationEvidence(current, tool(operation), skill, inputs(operation), context),
      ).not.toThrow();
    }
  });

  it('rejects a comment URL whose issue-comment fragment references another mutation ID', () => {
    const evidence = new EvidenceValidator();
    const current = trustedReceipt(evidence, 'comment-pr', MUTATION_ID, 999);

    expect(() =>
      verifyGitHubPrCollaborationEvidence(current, tool('comment-pr'), skill, inputs('comment-pr'), context),
    ).toThrow(/exact mutation external ID/u);
  });

  it('rejects a review URL whose pull-request-review fragment references another mutation ID', () => {
    const evidence = new EvidenceValidator();
    const current = trustedReceipt(evidence, 'review-pr-comment', MUTATION_ID, 999);

    expect(() =>
      verifyGitHubPrCollaborationEvidence(
        current,
        tool('review-pr-comment'),
        skill,
        inputs('review-pr-comment'),
        context,
      ),
    ).toThrow(/exact mutation external ID/u);
  });
});
