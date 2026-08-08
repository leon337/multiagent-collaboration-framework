import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EvidenceValidator } from './evidence-validator.js';
import type { ExternalActionRequest } from './external-action.contracts.js';
import {
  GitHubPullCollaborationAdapter,
  GitHubPullCollaborationClient,
} from './github-pr-collaboration.adapter.js';

const HEAD_SHA = '2'.repeat(40);
const OTHER_SHA = '3'.repeat(40);
const KEY = 'mcf-c2-idempotency-0001';
const REPOSITORY = 'leon337/multiagent-collaboration-framework';
const PR_NUMBER = 79;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function request(
  operation: string,
  overrides: Record<string, unknown> = {},
): ExternalActionRequest {
  return {
    skill: {
      skillId: 'MCF-GIT-PR-RELEASE',
      name: 'Git PR Release',
      version: '1.0.0',
      purpose: 'controlled GitHub PR collaboration',
      ownerAgents: ['Gabriel'],
      requiredInputs: [],
      allowedTools: ['github'],
      forbiddenTools: ['force-push', 'merge-with-red-ci'],
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
      repository: REPOSITORY,
      pull_request_number: PR_NUMBER,
      expected_head_sha: HEAD_SHA,
      idempotency_key: KEY,
      authorizedScope: true,
      ...overrides,
    },
    tool: { provider: 'github', operation, resource: REPOSITORY },
    context: {
      missionId: 'mission-c2',
      phaseId: 'phase-c2',
      expectedMissionVersion: 1,
    },
  };
}

function pull(
  overrides: Partial<{
    sha: string;
    title: string;
    body: string | null;
    state: string;
  }> = {},
) {
  return {
    number: PR_NUMBER,
    html_url: `https://github.com/${REPOSITORY}/pull/${PR_NUMBER}`,
    state: overrides.state ?? 'open',
    title: overrides.title ?? 'Original title',
    body: overrides.body ?? 'Original body',
    head: { ref: 'feat/c2', sha: overrides.sha ?? HEAD_SHA },
    base: { ref: 'main', sha: '1'.repeat(40) },
  };
}

function comment(body: string) {
  return {
    id: 101,
    html_url: `https://github.com/${REPOSITORY}/pull/${PR_NUMBER}#issuecomment-101`,
    body,
  };
}

function review(body: string) {
  return {
    id: 202,
    html_url: `https://github.com/${REPOSITORY}/pull/${PR_NUMBER}#pullrequestreview-202`,
    body,
    state: 'COMMENTED',
    commit_id: HEAD_SHA,
  };
}

describe('GitHubPullCollaborationAdapter', () => {
  beforeEach(() => {
    process.env.MCF_RECEIPT_SECRET = 'test-secret-that-is-long-enough-for-mcf-runtime';
  });

  it('creates one idempotent PR comment and verifies it by read-back', async () => {
    const expectedBody = `<!-- mcf-idempotency:${KEY} -->\n\nAutomated MCF checkpoint`;
    let created = false;
    const writes: Array<{ method: string; body: unknown }> = [];
    const fetcher = vi.fn(async (input: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      if (input.endsWith(`/pulls/${PR_NUMBER}`)) return jsonResponse(pull());
      if (input.includes(`/issues/${PR_NUMBER}/comments?`)) {
        return jsonResponse(created ? [comment(expectedBody)] : []);
      }
      if (input.endsWith(`/issues/${PR_NUMBER}/comments`) && method === 'POST') {
        writes.push({ method, body: init?.body ? JSON.parse(String(init.body)) : null });
        created = true;
        return jsonResponse(comment(expectedBody), 201);
      }
      throw new Error(`unexpected request ${method} ${input}`);
    });
    const adapter = new GitHubPullCollaborationAdapter(
      new EvidenceValidator(),
      new GitHubPullCollaborationClient(fetcher),
    );

    const receipt = await adapter.execute(
      request('comment-pr', { comment_body: 'Automated MCF checkpoint' }),
    );

    expect(receipt.status).toBe('SUCCEEDED');
    expect(receipt.externalId).toBe('101');
    expect(receipt.metadata.readBackVerified).toBe(true);
    expect(writes).toEqual([{ method: 'POST', body: { body: expectedBody } }]);
  });

  it('submits only COMMENT review events bound to the expected HEAD SHA', async () => {
    const expectedBody = `<!-- mcf-idempotency:${KEY} -->\n\nReview note only`;
    let created = false;
    let submittedBody: Record<string, unknown> | null = null;
    const fetcher = vi.fn(async (input: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      if (input.endsWith(`/pulls/${PR_NUMBER}`)) return jsonResponse(pull());
      if (input.includes(`/pulls/${PR_NUMBER}/reviews?`)) {
        return jsonResponse(created ? [review(expectedBody)] : []);
      }
      if (input.endsWith(`/pulls/${PR_NUMBER}/reviews`) && method === 'POST') {
        submittedBody = init?.body ? JSON.parse(String(init.body)) : null;
        created = true;
        return jsonResponse(review(expectedBody), 200);
      }
      throw new Error(`unexpected request ${method} ${input}`);
    });
    const adapter = new GitHubPullCollaborationAdapter(
      new EvidenceValidator(),
      new GitHubPullCollaborationClient(fetcher),
    );

    const receipt = await adapter.execute(
      request('review-pr-comment', { review_body: 'Review note only' }),
    );

    expect(receipt.status).toBe('SUCCEEDED');
    expect(submittedBody).toEqual({ body: expectedBody, event: 'COMMENT', commit_id: HEAD_SHA });
  });

  it('updates only title/body metadata and becomes a no-op after verified state matches', async () => {
    let current = pull();
    const patches: Record<string, unknown>[] = [];
    const fetcher = vi.fn(async (input: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      if (input.endsWith(`/pulls/${PR_NUMBER}`) && method === 'GET') return jsonResponse(current);
      if (input.endsWith(`/pulls/${PR_NUMBER}`) && method === 'PATCH') {
        const patch = JSON.parse(String(init?.body)) as Record<string, unknown>;
        patches.push(patch);
        current = pull({ title: String(patch.title), body: String(patch.body) });
        return jsonResponse(current);
      }
      throw new Error(`unexpected request ${method} ${input}`);
    });
    const adapter = new GitHubPullCollaborationAdapter(
      new EvidenceValidator(),
      new GitHubPullCollaborationClient(fetcher),
    );
    const input = request('update-pr-text-metadata', {
      title: 'Controlled title',
      body: 'Controlled body',
    });

    const first = await adapter.execute(input);
    const second = await adapter.execute(input);

    expect(first.status).toBe('SUCCEEDED');
    expect(second.status).toBe('SUCCEEDED');
    expect(patches).toEqual([{ title: 'Controlled title', body: 'Controlled body' }]);
  });

  it('fails closed before mutation when the PR HEAD moved', async () => {
    const fetcher = vi.fn(async () => jsonResponse(pull({ sha: OTHER_SHA })));
    const adapter = new GitHubPullCollaborationAdapter(
      new EvidenceValidator(),
      new GitHubPullCollaborationClient(fetcher),
    );

    await expect(
      adapter.execute(request('comment-pr', { comment_body: 'checkpoint' })),
    ).rejects.toThrow(/does not match the controlled collaboration target/u);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('rejects approval/state/base escalation inputs before any provider call', async () => {
    const fetcher = vi.fn();
    const adapter = new GitHubPullCollaborationAdapter(
      new EvidenceValidator(),
      new GitHubPullCollaborationClient(fetcher),
    );

    await expect(
      adapter.execute(
        request('review-pr-comment', { review_body: 'note', review_event: 'APPROVE' }),
      ),
    ).rejects.toThrow(/review_event is forbidden/u);
    await expect(
      adapter.execute(
        request('update-pr-text-metadata', { title: 'safe', state: 'closed' }),
      ),
    ).rejects.toThrow(/state is forbidden/u);
    await expect(
      adapter.execute(
        request('update-pr-text-metadata', { title: 'safe', base: 'release' }),
      ),
    ).rejects.toThrow(/base is forbidden/u);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('returns PARTIAL/UNKNOWN when a comment write and reconciliation are both ambiguous', async () => {
    let commentLookup = 0;
    const fetcher = vi.fn(async (input: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      if (input.endsWith(`/pulls/${PR_NUMBER}`)) return jsonResponse(pull());
      if (input.includes(`/issues/${PR_NUMBER}/comments?`)) {
        commentLookup += 1;
        if (commentLookup === 1) return jsonResponse([]);
        throw new Error('network unavailable during reconciliation');
      }
      if (input.endsWith(`/issues/${PR_NUMBER}/comments`) && method === 'POST') {
        throw new Error('network failed after possible write');
      }
      throw new Error(`unexpected request ${method} ${input}`);
    });
    const adapter = new GitHubPullCollaborationAdapter(
      new EvidenceValidator(),
      new GitHubPullCollaborationClient(fetcher),
    );

    const receipt = await adapter.execute(
      request('comment-pr', { comment_body: 'Ambiguous checkpoint' }),
    );

    expect(receipt.status).toBe('PARTIAL');
    expect(receipt.metadata.resultStatus).toBe('UNKNOWN');
    expect(receipt.metadata.readBackVerified).toBe(false);
    expect(receipt.metadata.unknownStage).toBe('COMMENT_PR');
  });
});
