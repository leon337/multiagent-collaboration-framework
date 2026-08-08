import { createHash } from 'node:crypto';

import { beforeEach, describe, expect, it } from 'vitest';

import { EvidenceValidator } from './evidence-validator.js';
import { verifyGitHubPrCollaborationEvidence } from './github-pr-collaboration.evidence.js';

const HEAD_SHA = '4'.repeat(40);
const KEY = 'mcf-c2-metadata-evidence-0001';
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
    missionId: 'mission-c2-metadata-evidence',
    phaseId: 'phase-c2-metadata-evidence',
    expectedMissionVersion: 1,
  },
};

const tool = {
  provider: 'github',
  operation: 'update-pr-text-metadata',
  resource: REPOSITORY,
};

function inputs(overrides: Record<string, unknown> = {}) {
  return {
    repository: REPOSITORY,
    pull_request_number: PR_NUMBER,
    expected_head_sha: HEAD_SHA,
    idempotency_key: KEY,
    ...overrides,
  };
}

function metadataDigest(title: string | null, body: string | null): string {
  return createHash('sha256').update(JSON.stringify({ title, body })).digest('hex');
}

function receipt(evidence: EvidenceValidator, title: string | null, body: string | null) {
  const pullUrl = `https://github.com/${REPOSITORY}/pull/${PR_NUMBER}`;
  return evidence.createTrustedReceipt({
    provider: 'github',
    operation: 'update-pr-text-metadata',
    resource: REPOSITORY,
    externalId: String(PR_NUMBER),
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
      mutationType: 'update-pr-text-metadata',
      mutationExternalId: PR_NUMBER,
      mutationUrl: pullUrl,
      contentDigest: metadataDigest(title, body),
      verifiedTitle: title,
      verifiedBody: body,
      externalEffect: 'REVERSIBLE',
      resultStatus: 'SUCCEEDED',
      readBackVerified: true,
      requiredPermissions: ['metadata:read', 'pull_requests:write'],
      evidenceUrls: [pullUrl],
      skillId: skill.skillId,
      skillVersion: skill.version,
      agentId: context.agentId,
      missionId: context.executionContext.missionId,
      phaseId: context.executionContext.phaseId,
      expectedMissionVersion: context.executionContext.expectedMissionVersion,
    },
  });
}

describe('GitHub PR collaboration metadata evidence inputs', () => {
  beforeEach(() => {
    process.env.MCF_RECEIPT_SECRET = 'test-secret-that-is-long-enough-for-mcf-runtime';
  });

  it('accepts a valid title-only patch', () => {
    const evidence = new EvidenceValidator();
    const current = receipt(evidence, 'Controlled title', null);

    expect(() =>
      verifyGitHubPrCollaborationEvidence(
        current,
        tool,
        skill,
        inputs({ title: 'Controlled title' }),
        context,
      ),
    ).not.toThrow();
  });

  it('accepts an explicit empty body patch', () => {
    const evidence = new EvidenceValidator();
    const current = receipt(evidence, null, '');

    expect(() =>
      verifyGitHubPrCollaborationEvidence(current, tool, skill, inputs({ body: '' }), context),
    ).not.toThrow();
  });

  it('rejects metadata evidence when neither title nor body is supplied', () => {
    const evidence = new EvidenceValidator();
    const current = receipt(evidence, null, null);

    expect(() =>
      verifyGitHubPrCollaborationEvidence(current, tool, skill, inputs(), context),
    ).toThrow(/requires current title and\/or body/u);
    expect(() =>
      verifyGitHubPrCollaborationEvidence(
        current,
        tool,
        skill,
        inputs({ title: null, body: null }),
        context,
      ),
    ).toThrow(/requires current title and\/or body/u);
  });

  it('rejects non-string metadata fields instead of normalizing them to null', () => {
    const evidence = new EvidenceValidator();
    const current = receipt(evidence, null, null);

    expect(() =>
      verifyGitHubPrCollaborationEvidence(current, tool, skill, inputs({ title: 1 }), context),
    ).toThrow(/metadata evidence title/u);
    expect(() =>
      verifyGitHubPrCollaborationEvidence(current, tool, skill, inputs({ body: 1 }), context),
    ).toThrow(/metadata evidence body/u);
  });

  it('rejects empty, untrimmed, and oversized titles', () => {
    const evidence = new EvidenceValidator();
    const current = receipt(evidence, null, null);

    for (const title of ['', ' title ', 'x'.repeat(257)]) {
      expect(() =>
        verifyGitHubPrCollaborationEvidence(current, tool, skill, inputs({ title }), context),
      ).toThrow(/metadata evidence title/u);
    }
  });

  it('rejects untrimmed and oversized bodies while preserving empty body support', () => {
    const evidence = new EvidenceValidator();
    const current = receipt(evidence, null, null);

    for (const body of [' body ', 'x'.repeat(65_001)]) {
      expect(() =>
        verifyGitHubPrCollaborationEvidence(current, tool, skill, inputs({ body }), context),
      ).toThrow(/metadata evidence body/u);
    }
  });
});
