import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EvidenceValidator } from './evidence-validator.js';
import type { ExternalActionRequest } from './external-action.contracts.js';
import {
  GitHubPullCollaborationAdapter,
  GitHubPullCollaborationClient,
} from './github-pr-collaboration.adapter.js';

const HEAD_SHA = '2'.repeat(40);
const MOVED_SHA = '3'.repeat(40);
const KEY = 'mcf-c2-p1-regression-0001';
const REPOSITORY = 'leon337/multiagent-collaboration-framework';
const PR_NUMBER = 79;

const modulePath = fileURLToPath(new URL('./mcf-runtime.module.ts', import.meta.url));

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function pull(
  overrides: Partial<{
    sha: string;
    title: string;
    body: string | null;
  }> = {},
) {
  return {
    number: PR_NUMBER,
    html_url: `https://github.com/${REPOSITORY}/pull/${PR_NUMBER}`,
    state: 'open',
    title: overrides.title ?? 'Original title',
    body: overrides.body ?? 'Original body',
    head: { ref: 'feat/c2', sha: overrides.sha ?? HEAD_SHA },
    base: { ref: 'main', sha: '1'.repeat(40) },
  };
}

function request(
  operation: 'comment-pr' | 'review-pr-comment' | 'update-pr-text-metadata',
  overrides: Record<string, unknown>,
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
      missionId: 'mission-c2-p1',
      phaseId: 'phase-c2-p1',
      expectedMissionVersion: 1,
    },
  };
}

describe('C2 independent-review P1 regressions', () => {
  beforeEach(() => {
    process.env.MCF_RECEIPT_SECRET = 'test-secret-that-is-long-enough-for-mcf-runtime';
  });

  it('wires the C2 mutating adapter into the live runtime registry after Gate C authorization', async () => {
    const moduleSource = await readFile(modulePath, 'utf8');

    expect(moduleSource).toContain('GitHubPullCollaborationAdapter');
    expect(moduleSource).toContain("'./github-pr-collaboration.adapter.js'");
    expect(moduleSource).toContain('githubPrCollaboration: GitHubPullCollaborationAdapter');
  });

  it('returns PARTIAL/UNKNOWN when a successful comment write cannot be reconciled after auth loss', async () => {
    const expectedBody = `<!-- mcf-idempotency:${KEY} -->\n\ncheckpoint`;
    let lookupCount = 0;
    const fetcher = vi.fn(async (input: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      if (input.endsWith(`/pulls/${PR_NUMBER}`) && method === 'GET') {
        return jsonResponse(pull());
      }
      if (input.includes(`/issues/${PR_NUMBER}/comments?`) && method === 'GET') {
        lookupCount += 1;
        if (lookupCount === 1) return jsonResponse([]);
        return jsonResponse({ message: 'credential revoked' }, 401);
      }
      if (input.endsWith(`/issues/${PR_NUMBER}/comments`) && method === 'POST') {
        return jsonResponse(
          {
            id: 101,
            html_url: `https://github.com/${REPOSITORY}/pull/${PR_NUMBER}#issuecomment-101`,
            body: expectedBody,
          },
          201,
        );
      }
      throw new Error(`unexpected request ${method} ${input}`);
    });
    const adapter = new GitHubPullCollaborationAdapter(
      new EvidenceValidator(),
      new GitHubPullCollaborationClient(fetcher),
    );

    const receipt = await adapter.execute(request('comment-pr', { comment_body: 'checkpoint' }));

    expect(receipt.status).toBe('PARTIAL');
    expect(receipt.metadata.resultStatus).toBe('UNKNOWN');
    expect(receipt.metadata.readBackVerified).toBe(false);
    expect(receipt.metadata.unknownStage).toBe('COMMENT_PR');
  });

  it('does not emit SUCCEEDED when the PR HEAD moves after comment reconciliation', async () => {
    const expectedBody = `<!-- mcf-idempotency:${KEY} -->\n\ncheckpoint`;
    let pullReads = 0;
    let commentLookup = 0;
    const fetcher = vi.fn(async (input: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      if (input.endsWith(`/pulls/${PR_NUMBER}`) && method === 'GET') {
        pullReads += 1;
        return jsonResponse(pull({ sha: pullReads === 1 ? HEAD_SHA : MOVED_SHA }));
      }
      if (input.includes(`/issues/${PR_NUMBER}/comments?`) && method === 'GET') {
        commentLookup += 1;
        return jsonResponse(
          commentLookup === 1
            ? []
            : [
                {
                  id: 101,
                  html_url: `https://github.com/${REPOSITORY}/pull/${PR_NUMBER}#issuecomment-101`,
                  body: expectedBody,
                },
              ],
        );
      }
      if (input.endsWith(`/issues/${PR_NUMBER}/comments`) && method === 'POST') {
        return jsonResponse(
          {
            id: 101,
            html_url: `https://github.com/${REPOSITORY}/pull/${PR_NUMBER}#issuecomment-101`,
            body: expectedBody,
          },
          201,
        );
      }
      throw new Error(`unexpected request ${method} ${input}`);
    });
    const adapter = new GitHubPullCollaborationAdapter(
      new EvidenceValidator(),
      new GitHubPullCollaborationClient(fetcher),
    );

    const receipt = await adapter.execute(request('comment-pr', { comment_body: 'checkpoint' }));

    expect(receipt.status).toBe('PARTIAL');
    expect(receipt.metadata.resultStatus).toBe('UNKNOWN');
    expect(receipt.metadata.readBackVerified).toBe(false);
    expect(receipt.metadata.unknownStage).toBe('COMMENT_PR');
  });

  it('returns PARTIAL/UNKNOWN when metadata PATCH succeeds but post-write read-back becomes unavailable', async () => {
    let pullReads = 0;
    const fetcher = vi.fn(async (input: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      if (input.endsWith(`/pulls/${PR_NUMBER}`) && method === 'GET') {
        pullReads += 1;
        if (pullReads <= 2) return jsonResponse(pull());
        return jsonResponse({ message: 'target became unavailable' }, 404);
      }
      if (input.endsWith(`/pulls/${PR_NUMBER}`) && method === 'PATCH') {
        return jsonResponse(pull({ title: 'Controlled title' }));
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

    expect(receipt.status).toBe('PARTIAL');
    expect(receipt.metadata.resultStatus).toBe('UNKNOWN');
    expect(receipt.metadata.readBackVerified).toBe(false);
    expect(receipt.metadata.unknownStage).toBe('UPDATE_PR_TEXT_METADATA');
  });
});
