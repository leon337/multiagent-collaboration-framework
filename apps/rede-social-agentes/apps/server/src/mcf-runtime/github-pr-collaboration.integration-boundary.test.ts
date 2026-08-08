import { describe, expect, it } from 'vitest';

import { AdapterRegistry } from './adapter-registry.js';
import { EvidenceValidator } from './evidence-validator.js';
import { GitHubBranchPullRequestAdapter } from './github-branch-pr.adapter.js';
import { GitHubPullCollaborationAdapter } from './github-pr-collaboration.adapter.js';

const request = {
  skill: {
    skillId: 'MCF-GIT-PR-RELEASE',
    name: 'Git PR Release',
    version: '1.0.0',
    purpose: 'controlled GitHub PR collaboration',
    ownerAgents: ['Gabriel'],
    requiredInputs: [],
    allowedTools: ['github'],
    forbiddenTools: ['force-push', 'merge-with-red-ci'],
    permissionProfile: 'SCOPED_WRITE' as const,
    executionSteps: [],
    requiredEvidence: [],
    acceptanceCriteria: [],
    failureModes: [],
    fallback: 'Mestre',
    handoffTo: 'Mestre',
  },
  agentId: 'Gabriel',
  inputs: {},
  tool: {
    provider: 'github',
    operation: 'comment-pr',
    resource: 'leon337/multiagent-collaboration-framework',
  },
};

describe('C2 adapter registry integration boundary', () => {
  it('routes C1 and C2 operations to exactly one adapter and rejects unrelated operations', () => {
    process.env.MCF_RECEIPT_SECRET = 'test-secret-that-is-long-enough-for-mcf-runtime';
    const evidence = new EvidenceValidator();
    const registry = new AdapterRegistry([
      new GitHubBranchPullRequestAdapter(evidence),
      new GitHubPullCollaborationAdapter(evidence),
    ]);

    expect(registry.resolve(request)?.adapterId).toBe('github-pr-collaboration-write-v1');
    expect(
      registry.resolve({
        ...request,
        tool: { ...request.tool, operation: 'review-pr-comment' },
      })?.adapterId,
    ).toBe('github-pr-collaboration-write-v1');
    expect(
      registry.resolve({
        ...request,
        tool: { ...request.tool, operation: 'update-pr-text-metadata' },
      })?.adapterId,
    ).toBe('github-pr-collaboration-write-v1');
    expect(
      registry.resolve({
        ...request,
        tool: { ...request.tool, operation: 'create-branch-pr' },
      })?.adapterId,
    ).toBe('github-branch-pr-write-v1');
    expect(
      registry.resolve({
        ...request,
        tool: { ...request.tool, operation: 'merge' },
      }),
    ).toBeNull();
    expect(
      registry.resolve({
        ...request,
        skill: { ...request.skill, skillId: 'MCF-IMPLEMENT-CHANGE' },
      }),
    ).toBeNull();
  });
});
