import { describe, expect, it } from 'vitest';

import { AdapterRegistry } from './adapter-registry.js';
import { EvidenceValidator } from './evidence-validator.js';
import { GitHubBranchPullRequestAdapter } from './github-branch-pr.adapter.js';

const request = {
  skill: {
    skillId: 'MCF-GIT-PR-RELEASE',
    name: 'Git PR Release',
    version: '1.0.0',
    purpose: 'controlled GitHub branch and pull request creation',
    ownerAgents: ['Gabriel'],
    requiredInputs: [],
    allowedTools: ['github'],
    forbiddenTools: ['force-push', 'direct-main-write'],
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
    operation: 'create-branch-pr',
    resource: 'leon337/multiagent-collaboration-framework',
  },
};

describe('C1 adapter registry boundary', () => {
  it('matches only MCF-GIT-PR-RELEASE/create-branch-pr', () => {
    process.env.MCF_RECEIPT_SECRET = 'test-secret-that-is-long-enough-for-mcf-runtime';
    const adapter = new GitHubBranchPullRequestAdapter(new EvidenceValidator());
    const registry = new AdapterRegistry([adapter]);

    expect(registry.resolve(request)?.adapterId).toBe('github-branch-pr-write-v1');
    expect(
      registry.resolve({
        ...request,
        skill: { ...request.skill, skillId: 'MCF-IMPLEMENT-CHANGE' },
      }),
    ).toBeNull();
    expect(
      registry.resolve({
        ...request,
        tool: { ...request.tool, operation: 'merge' },
      }),
    ).toBeNull();
  });
});
