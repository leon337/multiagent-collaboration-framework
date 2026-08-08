import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EvidenceValidator } from './evidence-validator.js';
import type { ExternalActionRequest } from './external-action.contracts.js';
import {
  GitHubPullCollaborationAdapter,
  GitHubPullCollaborationClient,
} from './github-pr-collaboration.adapter.js';

const HEAD_SHA = '2'.repeat(40);
const REPOSITORY = 'leon337/multiagent-collaboration-framework';

function pull(body: string | null) {
  return {
    number: 80,
    html_url: `https://github.com/${REPOSITORY}/pull/80`,
    state: 'open',
    title: 'C2',
    body,
    head: { ref: 'feat/c2', sha: HEAD_SHA },
    base: { ref: 'main', sha: '1'.repeat(40) },
  };
}

function request(): ExternalActionRequest {
  return {
    skill: {
      skillId: 'MCF-GIT-PR-RELEASE',
      name: 'Git PR Release',
      version: '1.0.0',
      purpose: 'controlled PR collaboration',
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
      authorizedScope: true,
      repository: REPOSITORY,
      pull_request_number: 80,
      expected_head_sha: HEAD_SHA,
      idempotency_key: 'mcf-c2-body-clear-0001',
      body: '',
    },
    tool: {
      provider: 'github',
      operation: 'update-pr-text-metadata',
      resource: REPOSITORY,
    },
    context: {
      missionId: 'mission-c2-body-clear',
      phaseId: 'phase-c2-body-clear',
      expectedMissionVersion: 1,
    },
  };
}

describe('C2 PR metadata body clearing', () => {
  beforeEach(() => {
    process.env.MCF_RECEIPT_SECRET = 'test-secret-that-is-long-enough-for-mcf-runtime';
  });

  it('treats an explicitly empty body as a PATCH that clears the PR description', async () => {
    let currentBody: string | null = 'existing description';
    const fetcher = vi.fn(async (input: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      if (input.endsWith('/repos/leon337/multiagent-collaboration-framework/pulls/80')) {
        if (method === 'PATCH') {
          expect(JSON.parse(String(init?.body))).toEqual({ body: '' });
          currentBody = '';
        }
        return new Response(JSON.stringify(pull(currentBody)), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      throw new Error(`unexpected request ${method} ${input}`);
    });

    const adapter = new GitHubPullCollaborationAdapter(
      new EvidenceValidator(),
      new GitHubPullCollaborationClient(fetcher),
    );

    const receipt = await adapter.execute(request());

    expect(receipt.status).toBe('SUCCEEDED');
    expect(receipt.metadata.verifiedBody).toBe('');
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
});
