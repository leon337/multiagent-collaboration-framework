import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EvidenceValidator } from './evidence-validator.js';
import type { ExternalActionRequest } from './external-action.contracts.js';
import {
  GitHubPullCollaborationAdapter,
  GitHubPullCollaborationClient,
} from './github-pr-collaboration.adapter.js';

const HEAD_SHA = '2'.repeat(40);
const KEY = 'mcf-c2-fragment-case-0001';
const REPOSITORY = 'leon337/multiagent-collaboration-framework';
const PR_NUMBER = 79;

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

function request(operation: 'comment-pr' | 'review-pr-comment'): ExternalActionRequest {
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
      ...(operation === 'comment-pr'
        ? { comment_body: 'case-sensitive comment fragment' }
        : { review_body: 'case-sensitive review fragment' }),
    },
    tool: { provider: 'github', operation, resource: REPOSITORY },
    context: {
      missionId: 'mission-c2-fragment-case',
      phaseId: 'phase-c2-fragment-case',
      expectedMissionVersion: 1,
    },
  };
}

function pull() {
  return {
    number: PR_NUMBER,
    html_url: `https://github.com/${REPOSITORY}/pull/${PR_NUMBER}`,
    state: 'open',
    title: 'PR title',
    body: 'PR body',
    head: { ref: 'feat/c2', sha: HEAD_SHA },
    base: { ref: 'main', sha: '1'.repeat(40) },
  };
}

function comment(body: string, fragment: string) {
  return {
    id: 101,
    html_url: `https://github.com/${REPOSITORY}/pull/${PR_NUMBER}${fragment}`,
    body,
  };
}

function review(body: string, fragment: string) {
  return {
    id: 202,
    html_url: `https://github.com/${REPOSITORY}/pull/${PR_NUMBER}${fragment}`,
    body,
    state: 'COMMENTED',
    commit_id: HEAD_SHA,
  };
}

function adapter(fetcher: ReturnType<typeof vi.fn>) {
  return new GitHubPullCollaborationAdapter(
    new EvidenceValidator(),
    new GitHubPullCollaborationClient(fetcher),
  );
}

describe('GitHubPullCollaborationAdapter mutation URL fragment casing', () => {
  beforeEach(() => {
    process.env.MCF_RECEIPT_SECRET = 'test-secret-that-is-long-enough-for-mcf-runtime';
  });

  it('accepts the canonical lowercase comment fragment', async () => {
    const expectedBody = `<!-- mcf-idempotency:${KEY} -->\n\ncase-sensitive comment fragment`;
    const fetcher = vi.fn(async (input: string) => {
      if (input.endsWith(`/pulls/${PR_NUMBER}`)) return jsonResponse(pull());
      if (input.includes(`/issues/${PR_NUMBER}/comments?`)) {
        return jsonResponse([comment(expectedBody, '#issuecomment-101')]);
      }
      throw new Error(`unexpected request ${input}`);
    });

    const receipt = await adapter(fetcher).execute(request('comment-pr'));

    expect(receipt.status).toBe('SUCCEEDED');
    expect(receipt.externalId).toBe('101');
  });

  it('rejects an uppercase comment fragment', async () => {
    const expectedBody = `<!-- mcf-idempotency:${KEY} -->\n\ncase-sensitive comment fragment`;
    const fetcher = vi.fn(async (input: string) => {
      if (input.endsWith(`/pulls/${PR_NUMBER}`)) return jsonResponse(pull());
      if (input.includes(`/issues/${PR_NUMBER}/comments?`)) {
        return jsonResponse([comment(expectedBody, '#ISSUECOMMENT-101')]);
      }
      throw new Error(`unexpected request ${input}`);
    });

    await expect(adapter(fetcher).execute(request('comment-pr'))).rejects.toThrow(
      /does not match the controlled collaboration write/u,
    );
  });

  it('accepts the canonical lowercase review fragment', async () => {
    const expectedBody = `<!-- mcf-idempotency:${KEY} -->\n\ncase-sensitive review fragment`;
    const fetcher = vi.fn(async (input: string) => {
      if (input.endsWith(`/pulls/${PR_NUMBER}`)) return jsonResponse(pull());
      if (input.includes(`/pulls/${PR_NUMBER}/reviews?`)) {
        return jsonResponse([review(expectedBody, '#pullrequestreview-202')]);
      }
      throw new Error(`unexpected request ${input}`);
    });

    const receipt = await adapter(fetcher).execute(request('review-pr-comment'));

    expect(receipt.status).toBe('SUCCEEDED');
    expect(receipt.externalId).toBe('202');
  });

  it('rejects an uppercase review fragment', async () => {
    const expectedBody = `<!-- mcf-idempotency:${KEY} -->\n\ncase-sensitive review fragment`;
    const fetcher = vi.fn(async (input: string) => {
      if (input.endsWith(`/pulls/${PR_NUMBER}`)) return jsonResponse(pull());
      if (input.includes(`/pulls/${PR_NUMBER}/reviews?`)) {
        return jsonResponse([review(expectedBody, '#PULLREQUESTREVIEW-202')]);
      }
      throw new Error(`unexpected request ${input}`);
    });

    await expect(adapter(fetcher).execute(request('review-pr-comment'))).rejects.toThrow(
      /does not match the controlled COMMENT-only write/u,
    );
  });
});
