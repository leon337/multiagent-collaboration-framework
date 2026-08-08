import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EvidenceValidator } from './evidence-validator.js';
import type { ExternalActionRequest } from './external-action.contracts.js';
import {
  GitHubPullCollaborationAdapter,
  GitHubPullCollaborationClient,
} from './github-pr-collaboration.adapter.js';

const HEAD_SHA = '2'.repeat(40);
const KEY = 'mcf-c2-invalid-json-0001';
const REPOSITORY = 'leon337/multiagent-collaboration-framework';
const PR_NUMBER = 80;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function invalidJsonResponse(status: number): Response {
  return new Response('{', {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function pull(title = 'Original title', body: string | null = 'Original body') {
  return {
    number: PR_NUMBER,
    html_url: `https://github.com/${REPOSITORY}/pull/${PR_NUMBER}`,
    state: 'open',
    title,
    body,
    head: { ref: 'feat/c2', sha: HEAD_SHA },
    base: { ref: 'main', sha: '1'.repeat(40) },
  };
}

function request(operation: string, overrides: Record<string, unknown>): ExternalActionRequest {
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
      ...overrides,
    },
    tool: { provider: 'github', operation, resource: REPOSITORY },
    context: {
      missionId: 'mission-c2-invalid-json',
      phaseId: `phase-${operation}`,
      expectedMissionVersion: 1,
    },
  };
}

describe('C2 accepted mutation with invalid JSON response', () => {
  beforeEach(() => {
    process.env.MCF_RECEIPT_SECRET = 'test-secret-that-is-long-enough-for-mcf-runtime';
  });

  it('reconciles a comment whose HTTP 201 response body is invalid JSON', async () => {
    const expectedBody = `<!-- mcf-idempotency:${KEY} -->\n\ncheckpoint`;
    let commentExists = false;
    const fetcher = vi.fn(async (input: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      if (input.endsWith(`/pulls/${PR_NUMBER}`) && method === 'GET') return jsonResponse(pull());
      if (input.includes(`/issues/${PR_NUMBER}/comments?`) && method === 'GET') {
        return jsonResponse(
          commentExists
            ? [
                {
                  id: 101,
                  html_url: `https://github.com/${REPOSITORY}/pull/${PR_NUMBER}#issuecomment-101`,
                  body: expectedBody,
                },
              ]
            : [],
        );
      }
      if (input.endsWith(`/issues/${PR_NUMBER}/comments`) && method === 'POST') {
        commentExists = true;
        return invalidJsonResponse(201);
      }
      throw new Error(`unexpected request ${method} ${input}`);
    });
    const adapter = new GitHubPullCollaborationAdapter(
      new EvidenceValidator(),
      new GitHubPullCollaborationClient(fetcher),
    );

    const receipt = await adapter.execute(request('comment-pr', { comment_body: 'checkpoint' }));

    expect(receipt.status).toBe('SUCCEEDED');
    expect(receipt.metadata.readBackVerified).toBe(true);
    expect(receipt.externalId).toBe('101');
  });

  it('reconciles a COMMENT review whose HTTP 200 response body is invalid JSON', async () => {
    const expectedBody = `<!-- mcf-idempotency:${KEY} -->\n\nreview checkpoint`;
    let reviewExists = false;
    const fetcher = vi.fn(async (input: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      if (input.endsWith(`/pulls/${PR_NUMBER}`) && method === 'GET') return jsonResponse(pull());
      if (input.includes(`/pulls/${PR_NUMBER}/reviews?`) && method === 'GET') {
        return jsonResponse(
          reviewExists
            ? [
                {
                  id: 202,
                  html_url: `https://github.com/${REPOSITORY}/pull/${PR_NUMBER}#pullrequestreview-202`,
                  body: expectedBody,
                  state: 'COMMENTED',
                  commit_id: HEAD_SHA,
                },
              ]
            : [],
        );
      }
      if (input.endsWith(`/pulls/${PR_NUMBER}/reviews`) && method === 'POST') {
        reviewExists = true;
        return invalidJsonResponse(200);
      }
      throw new Error(`unexpected request ${method} ${input}`);
    });
    const adapter = new GitHubPullCollaborationAdapter(
      new EvidenceValidator(),
      new GitHubPullCollaborationClient(fetcher),
    );

    const receipt = await adapter.execute(
      request('review-pr-comment', { review_body: 'review checkpoint' }),
    );

    expect(receipt.status).toBe('SUCCEEDED');
    expect(receipt.metadata.readBackVerified).toBe(true);
    expect(receipt.externalId).toBe('202');
  });

  it('reconciles a metadata PATCH whose HTTP 200 response body is invalid JSON', async () => {
    let currentTitle = 'Original title';
    const fetcher = vi.fn(async (input: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      if (input.endsWith(`/pulls/${PR_NUMBER}`) && method === 'GET') {
        return jsonResponse(pull(currentTitle));
      }
      if (input.endsWith(`/pulls/${PR_NUMBER}`) && method === 'PATCH') {
        const patch = JSON.parse(String(init?.body)) as { title?: string };
        currentTitle = patch.title ?? currentTitle;
        return invalidJsonResponse(200);
      }
      throw new Error(`unexpected request ${method} ${input}`);
    });
    const adapter = new GitHubPullCollaborationAdapter(
      new EvidenceValidator(),
      new GitHubPullCollaborationClient(fetcher),
    );

    const receipt = await adapter.execute(
      request('update-pr-text-metadata', { title: 'Controlled title' }),
    );

    expect(receipt.status).toBe('SUCCEEDED');
    expect(receipt.metadata.readBackVerified).toBe(true);
    expect(receipt.metadata.verifiedTitle).toBe('Controlled title');
  });
});
