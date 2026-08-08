import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EvidenceValidator } from './evidence-validator.js';
import {
  GitHubBranchPrClient,
  GitHubBranchPullRequestAdapter,
} from './github-branch-pr.adapter.js';
import type { ExternalActionRequest } from './external-action.contracts.js';

const BASE_SHA = '1'.repeat(40);
const HEAD_SHA = '2'.repeat(40);
const OTHER_SHA = '3'.repeat(40);
const KEY = 'mcf-c1-idempotency-0001';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function request(overrides: Partial<ExternalActionRequest['inputs']> = {}): ExternalActionRequest {
  return {
    skill: {
      skillId: 'MCF-GIT-PR-RELEASE',
      name: 'Git PR Release',
      version: '1.0.0',
      purpose: 'create a controlled pull request',
      ownerAgents: ['Gabriel'],
      requiredInputs: ['repository', 'base_branch', 'commit_sha', 'change_summary', 'risk_summary'],
      allowedTools: ['github'],
      forbiddenTools: ['force-push', 'direct-main-write'],
      permissionProfile: 'SCOPED_WRITE',
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
      branch_ref: 'feat/mcf-c1-test',
      idempotency_key: KEY,
      change_summary: 'MCF C1 controlled write',
      risk_summary: 'reversible branch and draft pull request only',
      authorizedScope: true,
      ...overrides,
    },
    tool: {
      provider: 'github',
      operation: 'create-branch-pr',
      resource: 'leon337/multiagent-collaboration-framework',
    },
    context: {
      missionId: 'mission-c1',
      phaseId: 'phase-c1',
      expectedMissionVersion: 1,
    },
  };
}

function baseRef(sha = BASE_SHA) {
  return { ref: 'refs/heads/main', object: { sha, type: 'commit' } };
}

function branchRef(sha = HEAD_SHA) {
  return { ref: 'refs/heads/feat/mcf-c1-test', object: { sha, type: 'commit' } };
}

function pull(body = `<!-- mcf-idempotency:${KEY} -->`) {
  return {
    number: 76,
    html_url: 'https://github.com/leon337/multiagent-collaboration-framework/pull/76',
    state: 'open',
    body,
    head: { ref: 'feat/mcf-c1-test', sha: HEAD_SHA },
    base: { ref: 'main', sha: BASE_SHA },
  };
}

describe('GitHubBranchPullRequestAdapter', () => {
  beforeEach(() => {
    process.env.MCF_RECEIPT_SECRET = 'test-secret-that-is-long-enough-for-mcf-runtime';
  });

  it('creates branch and pull request once and verifies both by read-back', async () => {
    const calls: Array<{ method: string; url: string }> = [];
    let branchExists = false;
    let prExists = false;
    const fetcher = vi.fn(async (input: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      calls.push({ method, url: input });
      if (input.includes('/git/ref/heads/main')) return jsonResponse(baseRef());
      if (input.includes(`/commits/${HEAD_SHA}`)) {
        return jsonResponse({
          sha: HEAD_SHA,
          html_url: `https://github.com/leon337/multiagent-collaboration-framework/commit/${HEAD_SHA}`,
        });
      }
      if (input.includes('/git/ref/heads/feat/mcf-c1-test')) {
        return branchExists ? jsonResponse(branchRef()) : jsonResponse({}, 404);
      }
      if (input.endsWith('/git/refs') && method === 'POST') {
        branchExists = true;
        return jsonResponse(branchRef(), 201);
      }
      if (input.includes('/pulls?')) return jsonResponse(prExists ? [pull()] : []);
      if (input.endsWith('/pulls') && method === 'POST') {
        prExists = true;
        return jsonResponse(pull(), 201);
      }
      throw new Error(`unexpected request ${method} ${input}`);
    });
    const adapter = new GitHubBranchPullRequestAdapter(
      new EvidenceValidator(),
      new GitHubBranchPrClient(fetcher),
    );

    const receipt = await adapter.execute(request());

    expect(receipt.status).toBe('SUCCEEDED');
    expect(receipt.commitSha).toBe(HEAD_SHA);
    expect(receipt.metadata.idempotencyKey).toBe(KEY);
    expect(receipt.metadata.readBackVerified).toBe(true);
    expect(calls.filter((call) => call.method === 'POST')).toHaveLength(2);
  });

  it('reconciles an existing compatible branch and PR without any write', async () => {
    const methods: string[] = [];
    const fetcher = vi.fn(async (input: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      methods.push(method);
      if (input.includes('/git/ref/heads/main')) return jsonResponse(baseRef());
      if (input.includes(`/commits/${HEAD_SHA}`))
        return jsonResponse({ sha: HEAD_SHA, html_url: 'https://github.com/x' });
      if (input.includes('/git/ref/heads/feat/mcf-c1-test')) return jsonResponse(branchRef());
      if (input.includes('/pulls?')) return jsonResponse([pull()]);
      throw new Error(`unexpected request ${method} ${input}`);
    });
    const adapter = new GitHubBranchPullRequestAdapter(
      new EvidenceValidator(),
      new GitHubBranchPrClient(fetcher),
    );

    const receipt = await adapter.execute(request());

    expect(receipt.status).toBe('SUCCEEDED');
    expect(methods).not.toContain('POST');
  });

  it('fails closed when an existing branch points to another SHA', async () => {
    const fetcher = vi.fn(async (input: string) => {
      if (input.includes('/git/ref/heads/main')) return jsonResponse(baseRef());
      if (input.includes(`/commits/${HEAD_SHA}`))
        return jsonResponse({ sha: HEAD_SHA, html_url: 'https://github.com/x' });
      if (input.includes('/git/ref/heads/feat/mcf-c1-test'))
        return jsonResponse(branchRef(OTHER_SHA));
      throw new Error(`unexpected request ${input}`);
    });
    const adapter = new GitHubBranchPullRequestAdapter(
      new EvidenceValidator(),
      new GitHubBranchPrClient(fetcher),
    );

    await expect(adapter.execute(request())).rejects.toThrow(/does not match the expected SHA/u);
  });

  it('fails closed when a PR for the branch/base has incompatible provenance', async () => {
    const fetcher = vi.fn(async (input: string) => {
      if (input.includes('/git/ref/heads/main')) return jsonResponse(baseRef());
      if (input.includes(`/commits/${HEAD_SHA}`))
        return jsonResponse({ sha: HEAD_SHA, html_url: 'https://github.com/x' });
      if (input.includes('/git/ref/heads/feat/mcf-c1-test')) return jsonResponse(branchRef());
      if (input.includes('/pulls?'))
        return jsonResponse([pull('human-created pull without MCF marker')]);
      throw new Error(`unexpected request ${input}`);
    });
    const adapter = new GitHubBranchPullRequestAdapter(
      new EvidenceValidator(),
      new GitHubBranchPrClient(fetcher),
    );

    await expect(adapter.execute(request())).rejects.toThrow(/incompatible pull request/u);
  });

  it('rejects protected branch targets before any provider call', async () => {
    const fetcher = vi.fn();
    const adapter = new GitHubBranchPullRequestAdapter(
      new EvidenceValidator(),
      new GitHubBranchPrClient(fetcher),
    );

    await expect(adapter.execute(request({ branch_ref: 'main' }))).rejects.toThrow(
      /new non-protected branch/u,
    );
    expect(fetcher).not.toHaveBeenCalled();
  });
});
