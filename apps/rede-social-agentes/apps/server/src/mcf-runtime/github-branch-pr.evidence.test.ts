import { beforeEach, describe, expect, it } from 'vitest';

import { EvidenceValidator } from './evidence-validator.js';
import { verifyGitHubBranchPrEvidence } from './github-branch-pr.evidence.js';

const BASE_SHA = '1'.repeat(40);
const HEAD_SHA = '2'.repeat(40);
const KEY = 'mcf-c1-idempotency-0001';

const tool = {
  provider: 'github',
  operation: 'create-branch-pr',
  resource: 'leon337/multiagent-collaboration-framework',
};
const skill = {
  skillId: 'MCF-GIT-PR-RELEASE',
  name: 'Git PR Release',
  version: '1.0.0',
  purpose: 'controlled PR',
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
const inputs = {
  repository: tool.resource,
  base_branch: 'main',
  base_sha: BASE_SHA,
  commit_sha: HEAD_SHA,
  branch_ref: 'feat/mcf-c1-test',
  idempotency_key: KEY,
};
const context = {
  agentId: 'Gabriel',
  executionContext: {
    missionId: 'mission-c1',
    phaseId: 'phase-c1',
    expectedMissionVersion: 1,
  },
};

function makeReceipt(evidence: EvidenceValidator) {
  return evidence.createTrustedReceipt({
    provider: 'github',
    operation: 'create-branch-pr',
    resource: tool.resource,
    externalId: '76',
    commitSha: HEAD_SHA,
    status: 'SUCCEEDED',
    observedAt: new Date().toISOString(),
    metadata: {
      adapterId: 'github-branch-pr-write-v1',
      adapterVersion: '1.0.0',
      repository: tool.resource,
      baseRef: 'main',
      baseSha: BASE_SHA,
      branchRef: 'feat/mcf-c1-test',
      branchSha: HEAD_SHA,
      verifiedHeadSha: HEAD_SHA,
      verifiedBaseRef: 'main',
      verifiedBaseSha: BASE_SHA,
      pullRequestNumber: 76,
      pullRequestUrl: 'https://github.com/leon337/multiagent-collaboration-framework/pull/76',
      pullRequestState: 'open',
      idempotencyKey: KEY,
      externalEffect: 'REVERSIBLE',
      resultStatus: 'SUCCEEDED',
      readBackVerified: true,
      requiredPermissions: ['metadata:read', 'contents:write', 'pull_requests:write'],
      evidenceUrls: [
        `https://github.com/leon337/multiagent-collaboration-framework/commit/${HEAD_SHA}`,
        'https://github.com/leon337/multiagent-collaboration-framework/tree/feat%2Fmcf-c1-test',
        'https://github.com/leon337/multiagent-collaboration-framework/pull/76',
      ],
      skillId: skill.skillId,
      skillVersion: skill.version,
      agentId: context.agentId,
      missionId: context.executionContext.missionId,
      phaseId: context.executionContext.phaseId,
      expectedMissionVersion: context.executionContext.expectedMissionVersion,
    },
  });
}

describe('verifyGitHubBranchPrEvidence', () => {
  beforeEach(() => {
    process.env.MCF_RECEIPT_SECRET = 'test-secret-that-is-long-enough-for-mcf-runtime';
  });

  it('accepts a signed receipt bound to the current write context', () => {
    const evidence = new EvidenceValidator();
    const receipt = makeReceipt(evidence);
    evidence.verify(receipt, tool);
    expect(() => verifyGitHubBranchPrEvidence(receipt, tool, skill, inputs, context)).not.toThrow();
  });

  it('rejects replay in another mission context', () => {
    const evidence = new EvidenceValidator();
    const receipt = makeReceipt(evidence);
    expect(() =>
      verifyGitHubBranchPrEvidence(receipt, tool, skill, inputs, {
        ...context,
        executionContext: { ...context.executionContext, missionId: 'mission-other' },
      }),
    ).toThrow(/execution domain/u);
  });

  it('rejects an idempotency key changed in the current request', () => {
    const evidence = new EvidenceValidator();
    const receipt = makeReceipt(evidence);
    expect(() =>
      verifyGitHubBranchPrEvidence(
        receipt,
        tool,
        skill,
        { ...inputs, idempotency_key: 'mcf-c1-idempotency-9999' },
        context,
      ),
    ).toThrow(/idempotency key/u);
  });

  it('rejects exact SHA substitution', () => {
    const evidence = new EvidenceValidator();
    const receipt = makeReceipt(evidence);
    expect(() =>
      verifyGitHubBranchPrEvidence(
        receipt,
        tool,
        skill,
        { ...inputs, commit_sha: '3'.repeat(40) },
        context,
      ),
    ).toThrow(/bind base, branch and exact SHAs/u);
  });

  it('rejects a signed receipt that substitutes the branch evidence URL', () => {
    const evidence = new EvidenceValidator();
    const original = makeReceipt(evidence);
    const receipt = evidence.createTrustedReceipt({
      provider: original.provider,
      operation: original.operation,
      resource: original.resource,
      externalId: original.externalId,
      commitSha: original.commitSha,
      status: original.status,
      observedAt: original.observedAt,
      metadata: {
        ...original.metadata,
        evidenceUrls: [
          `https://github.com/leon337/multiagent-collaboration-framework/commit/${HEAD_SHA}`,
          'https://github.com/leon337/multiagent-collaboration-framework/tree/feat%2Fwrong-branch',
          'https://github.com/leon337/multiagent-collaboration-framework/pull/76',
        ],
      },
    });

    evidence.verify(receipt, tool);
    expect(() => verifyGitHubBranchPrEvidence(receipt, tool, skill, inputs, context)).toThrow(
      /exact commit, branch and pull request URLs/u,
    );
  });
});
