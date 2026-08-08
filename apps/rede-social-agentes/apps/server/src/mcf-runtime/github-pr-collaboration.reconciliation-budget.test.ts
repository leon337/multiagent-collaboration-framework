import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EvidenceValidator } from './evidence-validator.js';
import type { ExternalActionRequest } from './external-action.contracts.js';
import {
  GitHubPullCollaborationAdapter,
  GitHubPullCollaborationClient,
} from './github-pr-collaboration.adapter.js';

const REPOSITORY = 'leon337/multiagent-collaboration-framework';
const HEAD_SHA = '2'.repeat(40);
const PR_NUMBER = 80;
const KEY = 'mcf-c2-budget-0001';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function pull() {
  return {
    number: PR_NUMBER,
    html_url: `https://github.com/${REPOSITORY}/pull/${PR_NUMBER}`,
    state: 'open',
    title: 'C2',
    body: 'C2 body',
    head: { ref: 'feat/c2', sha: HEAD_SHA },
    base: { ref: 'main', sha: '1'.repeat(40) },
  };
}

function request(operation: 'comment-pr' | 'review-pr-comment'): ExternalActionRequest {
  return {
    skill: {
      skillId: 'MCF-GIT-PR-RELEASE',
      name: 'Git PR Release',
      version: '1.0.0',
      purpose: 'controlled collaboration',
      ownerAgents: ['Gabriel'],
      requiredInputs: [],
      allowedTools: ['github'],
      forbiddenTools: [],
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
        ? { comment_body: 'Controlled comment' }
        : { review_body: 'Controlled review' }),
    },
    tool: { provider: 'github', operation, resource: REPOSITORY },
    context: {
      missionId: 'mission-c2-budget',
      phaseId: `phase-${operation}`,
      expectedMissionVersion: 1,
    },
  };
}

function unrelatedComments(page: number) {
  return Array.from({ length: 100 }, (_, index) => ({
    id: page * 1_000 + index + 1,
    html_url: `https://github.com/${REPOSITORY}/pull/${PR_NUMBER}#issuecomment-${page * 1_000 + index + 1}`,
    body: 'unrelated comment',
  }));
}

function unrelatedReviews(page: number) {
  return Array.from({ length: 100 }, (_, index) => ({
    id: page * 1_000 + index + 1,
    html_url: `https://github.com/${REPOSITORY}/pull/${PR_NUMBER}#pullrequestreview-${page * 1_000 + index + 1}`,
    body: 'unrelated review',
    state: 'COMMENTED',
    commit_id: HEAD_SHA,
  }));
}

describe('C2 ambiguous-write reconciliation request budget', () => {
  beforeEach(() => {
    process.env.MCF_RECEIPT_SECRET = 'test-secret-that-is-long-enough-for-mcf-runtime';
  });

  it('reuses a reconciled comment instead of scanning ten pages a third time', async () => {
    let mutationAttempted = false;
    let commentLookups = 0;
    const markerBody = `<!-- mcf-idempotency:${KEY} -->\n\nControlled comment`;
    const fetcher = vi.fn(async (input: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      if (input.endsWith(`/pulls/${PR_NUMBER}`) && method === 'GET') return jsonResponse(pull());
      if (input.includes(`/issues/${PR_NUMBER}/comments?`)) {
        commentLookups += 1;
        const page = Number(new URL(input).searchParams.get('page'));
        if (page < 10) return jsonResponse(unrelatedComments(page));
        return mutationAttempted
          ? jsonResponse([
              {
                id: 99_001,
                html_url: `https://github.com/${REPOSITORY}/pull/${PR_NUMBER}#issuecomment-99001`,
                body: markerBody,
              },
            ])
          : jsonResponse([]);
      }
      if (input.endsWith(`/issues/${PR_NUMBER}/comments`) && method === 'POST') {
        mutationAttempted = true;
        throw new Error('connection dropped after provider accepted comment');
      }
      throw new Error(`unexpected request ${method} ${input}`);
    });

    const adapter = new GitHubPullCollaborationAdapter(
      new EvidenceValidator(),
      new GitHubPullCollaborationClient(fetcher),
    );
    const receipt = await adapter.execute(request('comment-pr'));

    expect(receipt.status).toBe('SUCCEEDED');
    expect(receipt.metadata.readBackVerified).toBe(true);
    expect(receipt.metadata.requestBudget).toEqual({ requests: 23, limit: 30 });
    expect(commentLookups).toBe(20);
  });

  it('reuses a reconciled review instead of scanning ten pages a third time', async () => {
    let mutationAttempted = false;
    let reviewLookups = 0;
    const markerBody = `<!-- mcf-idempotency:${KEY} -->\n\nControlled review`;
    const fetcher = vi.fn(async (input: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      if (input.endsWith(`/pulls/${PR_NUMBER}`) && method === 'GET') return jsonResponse(pull());
      if (input.includes(`/pulls/${PR_NUMBER}/reviews?`)) {
        reviewLookups += 1;
        const page = Number(new URL(input).searchParams.get('page'));
        if (page < 10) return jsonResponse(unrelatedReviews(page));
        return mutationAttempted
          ? jsonResponse([
              {
                id: 99_002,
                html_url: `https://github.com/${REPOSITORY}/pull/${PR_NUMBER}#pullrequestreview-99002`,
                body: markerBody,
                state: 'COMMENTED',
                commit_id: HEAD_SHA,
              },
            ])
          : jsonResponse([]);
      }
      if (input.endsWith(`/pulls/${PR_NUMBER}/reviews`) && method === 'POST') {
        mutationAttempted = true;
        throw new Error('connection dropped after provider accepted review');
      }
      throw new Error(`unexpected request ${method} ${input}`);
    });

    const adapter = new GitHubPullCollaborationAdapter(
      new EvidenceValidator(),
      new GitHubPullCollaborationClient(fetcher),
    );
    const receipt = await adapter.execute(request('review-pr-comment'));

    expect(receipt.status).toBe('SUCCEEDED');
    expect(receipt.metadata.readBackVerified).toBe(true);
    expect(receipt.metadata.requestBudget).toEqual({ requests: 23, limit: 30 });
    expect(reviewLookups).toBe(20);
  });
});
