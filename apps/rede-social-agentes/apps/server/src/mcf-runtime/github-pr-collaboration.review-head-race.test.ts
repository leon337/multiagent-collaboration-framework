import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EvidenceValidator } from './evidence-validator.js';
import type { ExternalActionRequest } from './external-action.contracts.js';
import {
  GitHubPullCollaborationAdapter,
  GitHubPullCollaborationClient,
} from './github-pr-collaboration.adapter.js';

const HEAD_SHA = '2'.repeat(40);
const MOVED_SHA = '3'.repeat(40);
const KEY = 'mcf-c2-review-race-0001';
const REPOSITORY = 'leon337/multiagent-collaboration-framework';
const PR_NUMBER = 80;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function pull(sha: string) {
  return {
    number: PR_NUMBER,
    html_url: `https://github.com/${REPOSITORY}/pull/${PR_NUMBER}`,
    state: 'open',
    title: 'C2',
    body: 'C2',
    head: { ref: 'feat/c2', sha },
    base: { ref: 'main', sha: '1'.repeat(40) },
  };
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
      authorizedScope: true,
      repository: REPOSITORY,
      pull_request_number: PR_NUMBER,
      expected_head_sha: HEAD_SHA,
      idempotency_key: KEY,
      review_body: 'review checkpoint',
    },
    tool: { provider: 'github', operation: 'review-pr-comment', resource: REPOSITORY },
    context: {
      missionId: 'mission-review-head-race',
      phaseId: 'phase-review-head-race',
      expectedMissionVersion: 1,
    },
  };
}

describe('C2 review HEAD race regression', () => {
  beforeEach(() => {
    process.env.MCF_RECEIPT_SECRET = 'test-secret-that-is-long-enough-for-mcf-runtime';
  });

  it('returns PARTIAL/UNKNOWN when the PR HEAD moves after review reconciliation', async () => {
    const body = `<!-- mcf-idempotency:${KEY} -->\n\nreview checkpoint`;
    let pullReads = 0;
    let reviewLookups = 0;
    const fetcher = vi.fn(async (input: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      if (input.endsWith(`/pulls/${PR_NUMBER}`) && method === 'GET') {
        pullReads += 1;
        return jsonResponse(pull(pullReads === 1 ? HEAD_SHA : MOVED_SHA));
      }
      if (input.includes(`/pulls/${PR_NUMBER}/reviews?`) && method === 'GET') {
        reviewLookups += 1;
        return jsonResponse(
          reviewLookups === 1
            ? []
            : [
                {
                  id: 202,
                  html_url: `https://github.com/${REPOSITORY}/pull/${PR_NUMBER}#pullrequestreview-202`,
                  body,
                  state: 'COMMENTED',
                  commit_id: HEAD_SHA,
                },
              ],
        );
      }
      if (input.endsWith(`/pulls/${PR_NUMBER}/reviews`) && method === 'POST') {
        return jsonResponse(
          {
            id: 202,
            html_url: `https://github.com/${REPOSITORY}/pull/${PR_NUMBER}#pullrequestreview-202`,
            body,
            state: 'COMMENTED',
            commit_id: HEAD_SHA,
          },
          200,
        );
      }
      throw new Error(`unexpected request ${method} ${input}`);
    });

    const adapter = new GitHubPullCollaborationAdapter(
      new EvidenceValidator(),
      new GitHubPullCollaborationClient(fetcher),
    );

    const receipt = await adapter.execute(request());

    expect(receipt.status).toBe('PARTIAL');
    expect(receipt.metadata.resultStatus).toBe('UNKNOWN');
    expect(receipt.metadata.readBackVerified).toBe(false);
    expect(receipt.metadata.unknownStage).toBe('REVIEW_PR_COMMENT');
  });
});
