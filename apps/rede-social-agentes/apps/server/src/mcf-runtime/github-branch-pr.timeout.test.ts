import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EvidenceValidator } from './evidence-validator.js';
import {
  GitHubBranchPrClient,
  GitHubBranchPullRequestAdapter,
} from './github-branch-pr.adapter.js';

const BASE_SHA = '1'.repeat(40);
const HEAD_SHA = '2'.repeat(40);
const KEY = 'mcf-c1-timeout-reconcile-0001';

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function request() {
  return {
    skill: {
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
    },
    agentId: 'Gabriel',
    inputs: {
      repository: 'leon337/multiagent-collaboration-framework',
      base_branch: 'main',
      base_sha: BASE_SHA,
      commit_sha: HEAD_SHA,
      branch_ref: 'feat/mcf-c1-timeout',
      idempotency_key: KEY,
      change_summary: 'timeout reconciliation',
      risk_summary: 'reversible',
      authorizedScope: true,
    },
    tool: {
      provider: 'github',
      operation: 'create-branch-pr',
      resource: 'leon337/multiagent-collaboration-framework',
    },
    context: { missionId: 'm1', phaseId: 'p1', expectedMissionVersion: 1 },
  };
}

function branch() {
  return { ref: 'refs/heads/feat/mcf-c1-timeout', object: { sha: HEAD_SHA } };
}

function pull() {
  return {
    number: 88,
    html_url: 'https://github.com/leon337/multiagent-collaboration-framework/pull/88',
    state: 'open',
    body: `<!-- mcf-idempotency:${KEY} -->`,
    head: { ref: 'feat/mcf-c1-timeout', sha: HEAD_SHA },
    base: { ref: 'main', sha: BASE_SHA },
  };
}

function baseAndCommit(url: string): Response | null {
  if (url.includes('/git/ref/heads/main')) {
    return response({ ref: 'refs/heads/main', object: { sha: BASE_SHA } });
  }
  if (url.includes(`/commits/${HEAD_SHA}`)) {
    return response({ sha: HEAD_SHA, html_url: 'https://github.com/x' });
  }
  return null;
}

describe('GitHub branch/PR timeout reconciliation', () => {
  beforeEach(() => {
    process.env.MCF_RECEIPT_SECRET = 'test-secret-that-is-long-enough-for-mcf-runtime';
  });

  it('reconciles after an ambiguous branch POST failure before considering a retry', async () => {
    let branchExists = false;
    const fetcher = vi.fn(async (url: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      const common = baseAndCommit(url);
      if (common) return common;
      if (url.includes('/git/ref/heads/feat/mcf-c1-timeout')) {
        return branchExists ? response(branch()) : response({}, 404);
      }
      if (url.endsWith('/git/refs') && method === 'POST') {
        branchExists = true;
        throw new Error('connection reset after provider accepted branch');
      }
      if (url.includes('/pulls?')) return response([pull()]);
      throw new Error(`unexpected ${method} ${url}`);
    });
    const adapter = new GitHubBranchPullRequestAdapter(
      new EvidenceValidator(),
      new GitHubBranchPrClient(fetcher),
    );

    const receipt = await adapter.execute(request());
    expect(receipt.status).toBe('SUCCEEDED');
    expect(fetcher.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(1);
  });

  it('records UNKNOWN when an ambiguous branch creation cannot be proven by read-back', async () => {
    let branchLookupCount = 0;
    const evidence = new EvidenceValidator();
    const fetcher = vi.fn(async (url: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      const common = baseAndCommit(url);
      if (common) return common;
      if (url.includes('/git/ref/heads/feat/mcf-c1-timeout')) {
        branchLookupCount += 1;
        if (branchLookupCount === 1) return response({}, 404);
        throw new Error('read-back unavailable after ambiguous branch POST');
      }
      if (url.endsWith('/git/refs') && method === 'POST') {
        throw new Error('connection reset after provider may have accepted branch');
      }
      throw new Error(`unexpected ${method} ${url}`);
    });
    const adapter = new GitHubBranchPullRequestAdapter(
      evidence,
      new GitHubBranchPrClient(fetcher),
    );

    const input = request();
    const receipt = await adapter.execute(input);
    expect(receipt.status).toBe('PARTIAL');
    expect(receipt.metadata).toMatchObject({
      resultStatus: 'UNKNOWN',
      readBackVerified: false,
      unknownStage: 'CREATE_BRANCH',
      idempotencyKey: KEY,
    });
    expect(() => evidence.verify(receipt, input.tool)).not.toThrow();
    expect(fetcher.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(1);
  });

  it('records UNKNOWN when an ambiguous PR creation cannot be proven by read-back', async () => {
    let pullLookupCount = 0;
    const evidence = new EvidenceValidator();
    const fetcher = vi.fn(async (url: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      const common = baseAndCommit(url);
      if (common) return common;
      if (url.includes('/git/ref/heads/feat/mcf-c1-timeout')) return response(branch());
      if (url.includes('/pulls?')) {
        pullLookupCount += 1;
        if (pullLookupCount === 1) return response([]);
        throw new Error('read-back unavailable after ambiguous pull POST');
      }
      if (url.endsWith('/pulls') && method === 'POST') {
        throw new Error('connection reset after provider may have accepted pull request');
      }
      throw new Error(`unexpected ${method} ${url}`);
    });
    const adapter = new GitHubBranchPullRequestAdapter(
      evidence,
      new GitHubBranchPrClient(fetcher),
    );

    const input = request();
    const receipt = await adapter.execute(input);
    expect(receipt.status).toBe('PARTIAL');
    expect(receipt.metadata).toMatchObject({
      resultStatus: 'UNKNOWN',
      readBackVerified: false,
      unknownStage: 'CREATE_PULL_REQUEST',
      idempotencyKey: KEY,
    });
    expect(() => evidence.verify(receipt, input.tool)).not.toThrow();
    expect(fetcher.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(1);
  });
});
