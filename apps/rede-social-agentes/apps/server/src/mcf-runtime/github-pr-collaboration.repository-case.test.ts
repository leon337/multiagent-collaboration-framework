import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EvidenceValidator } from './evidence-validator.js';
import type { ExternalActionRequest } from './external-action.contracts.js';
import {
  GitHubPullCollaborationAdapter,
  GitHubPullCollaborationClient,
} from './github-pr-collaboration.adapter.js';

const HEAD_SHA = 'a'.repeat(40);

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
      repository: 'microsoft/typescript',
      pull_request_number: 80,
      expected_head_sha: HEAD_SHA,
      idempotency_key: 'mcf-c2-repository-case-0001',
      title: 'C2',
    },
    tool: {
      provider: 'github',
      operation: 'update-pr-text-metadata',
      resource: 'microsoft/typescript',
    },
    context: {
      missionId: 'mission-c2-repository-case',
      phaseId: 'phase-c2-repository-case',
      expectedMissionVersion: 1,
    },
  };
}

describe('C2 GitHub repository URL casing', () => {
  beforeEach(() => {
    process.env.MCF_RECEIPT_SECRET = 'test-secret-that-is-long-enough-for-mcf-runtime';
  });

  it('accepts GitHub canonical URL casing when the governed repository uses different casing', async () => {
    const fetcher = vi.fn(async (input: string, init?: RequestInit) => {
      expect(init?.method ?? 'GET').toBe('GET');
      expect(input).toBe('https://api.github.com/repos/microsoft/typescript/pulls/80');
      return new Response(
        JSON.stringify({
          number: 80,
          html_url: 'https://github.com/Microsoft/TypeScript/pull/80',
          state: 'open',
          title: 'C2',
          body: null,
          head: { ref: 'feat/c2', sha: HEAD_SHA },
          base: { ref: 'main', sha: 'b'.repeat(40) },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    });

    const adapter = new GitHubPullCollaborationAdapter(
      new EvidenceValidator(),
      new GitHubPullCollaborationClient(fetcher),
    );
    const receipt = await adapter.execute(request());

    expect(receipt.status).toBe('SUCCEEDED');
    expect(receipt.metadata.readBackVerified).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
