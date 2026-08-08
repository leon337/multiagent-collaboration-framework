import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EvidenceValidator } from './evidence-validator.js';
import type { ExternalActionRequest } from './external-action.contracts.js';
import {
  GitHubPullCollaborationAdapter,
  GitHubPullCollaborationClient,
} from './github-pr-collaboration.adapter.js';

const HEAD_SHA = '2'.repeat(40);
const KEY = 'mcf-c2-review-url-0001';
const REPOSITORY = 'leon337/multiagent-collaboration-framework';
const PR_NUMBER = 79;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function request(): ExternalActionRequest {
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
      review_body: 'Review note only',
    },
    tool: { provider: 'github', operation: 'review-pr-comment', resource: REPOSITORY },
    context: {
      missionId: 'mission-c2-review-url',
      phaseId: 'phase-c2-review-url',
      expectedMissionVersion: 1,
    },
  };
}

function pull() {
  return {
    number: PR_NUMBER,
    html_url: `https://github.com/${REPOSITORY}/pull/${PR_NUMBER}`,
    state: 'open',
    title: 'Controlled PR',
    body: 'Body',
    head: { ref: 'feat/c2', sha: HEAD_SHA },
    base: { ref: 'main', sha: '1'.repeat(40) },
  };
}

describe('GitHub PR review URL binding', () => {
  beforeEach(() => {
    process.env.MCF_RECEIPT_SECRET = 'test-secret-that-is-long-enough-for-mcf-runtime';
  });

  it('rejects a review whose html_url fragment does not match its review id', async () => {
    const expectedBody = `<!-- mcf-idempotency:${KEY} -->\n\nReview note only`;
    let writes = 0;
    const fetcher = vi.fn(async (input: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      if (input.endsWith(`/pulls/${PR_NUMBER}`)) return jsonResponse(pull());
      if (input.includes(`/pulls/${PR_NUMBER}/reviews?`)) {
        return jsonResponse([
          {
            id: 202,
            html_url: `https://github.com/${REPOSITORY}/pull/${PR_NUMBER}#pullrequestreview-999`,
            body: expectedBody,
            state: 'COMMENTED',
            commit_id: HEAD_SHA,
          },
        ]);
      }
      if (input.endsWith(`/pulls/${PR_NUMBER}/reviews`) && method === 'POST') {
        writes += 1;
        throw new Error('mutation must not be reached');
      }
      throw new Error(`unexpected request ${method} ${input}`);
    });

    const adapter = new GitHubPullCollaborationAdapter(
      new EvidenceValidator(),
      new GitHubPullCollaborationClient(fetcher),
    );

    await expect(adapter.execute(request())).rejects.toThrow(
      /does not match the controlled COMMENT-only write/u,
    );
    expect(writes).toBe(0);
  });
});
