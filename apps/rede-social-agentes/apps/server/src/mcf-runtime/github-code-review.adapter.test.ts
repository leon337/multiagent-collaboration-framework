import type { McfSkillDefinition } from '@rsa/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EvidenceValidator } from './evidence-validator.js';
import { GitHubCodeReviewAdapter, GitHubReadClient } from './github-code-review.adapter.js';

const skill: McfSkillDefinition = {
  skillId: 'MCF-REVIEW-CODE',
  name: 'Revisar código',
  version: '1.0.0',
  purpose: 'Revisar código sem alterar o repositório.',
  ownerAgents: ['Vinicius'],
  requiredInputs: ['diff_or_commit'],
  allowedTools: ['GitHub'],
  forbiddenTools: ['merge_without_gate'],
  permissionProfile: 'READ_ONLY',
  executionSteps: ['inspecionar_diff', 'classificar_achados'],
  requiredEvidence: ['file_and_line_references', 'severity', 'recommendation'],
  acceptanceCriteria: ['findings_actionable'],
  failureModes: ['missing_context'],
  fallback: 'Limitar o veredito.',
  handoffTo: 'Rafael',
};

beforeEach(() => {
  process.env.DATABASE_URL = 'postgresql://rsa:rsa@127.0.0.1:5432/rsa';
  process.env.MCF_RECEIPT_SECRET = 'test-only-mcf-receipt-secret-0000000001';
});

describe('GitHubCodeReviewAdapter', () => {
  it('reviews a pull request through read-only GitHub requests and signs the evidence', async () => {
    const commitSha = 'a'.repeat(40);
    const fetcher = vi.fn(async (url: string, init?: RequestInit) => {
      expect(init?.method).toBe('GET');
      if (url.endsWith('/pulls/70')) {
        return new Response(
          JSON.stringify({
            number: 70,
            html_url: 'https://github.com/leon337/multiagent-collaboration-framework/pull/70',
            head: { sha: commitSha },
          }),
          { status: 200 },
        );
      }
      if (url.includes('/pulls/70/files')) {
        return new Response(
          JSON.stringify([
            {
              filename: 'src/config.ts',
              status: 'modified',
              additions: 2,
              deletions: 0,
              changes: 2,
              patch:
                "@@ -1,1 +1,3 @@\n export const safe = true;\n+const apiKey = 'hardcoded-value-123';\n+// TODO remove temporary fallback",
            },
          ]),
          { status: 200 },
        );
      }
      return new Response('{}', { status: 404 });
    });
    const evidence = new EvidenceValidator();
    const adapter = new GitHubCodeReviewAdapter(evidence, new GitHubReadClient(fetcher, undefined));

    const receipt = await adapter.execute({
      skill,
      agentId: 'Vinicius',
      inputs: {
        repository: 'leon337/multiagent-collaboration-framework',
        diff_or_commit: 'PR #70',
      },
      tool: {
        provider: 'github',
        operation: 'inspect-code',
        resource: 'leon337/multiagent-collaboration-framework',
      },
    });

    evidence.verifyForSkill(
      receipt,
      {
        provider: 'github',
        operation: 'inspect-code',
        resource: 'leon337/multiagent-collaboration-framework',
      },
      skill,
    );
    expect(receipt).toMatchObject({
      provider: 'github',
      operation: 'inspect-code',
      externalId: '70',
      commitSha,
      status: 'SUCCEEDED',
      metadata: {
        adapterId: 'github-code-review-read-only-v1',
        verdict: 'BLOCK',
        readOnly: true,
        reviewedFiles: ['src/config.ts'],
      },
    });
    expect(receipt.metadata.findingsCount).toBe(3);
    expect(receipt.signature).toMatch(/^[a-f0-9]{64}$/u);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('classifies a rate-limited GitHub response', async () => {
    const adapter = new GitHubCodeReviewAdapter(
      new EvidenceValidator(),
      new GitHubReadClient(
        async () =>
          new Response(JSON.stringify({ message: 'rate limit' }), {
            status: 403,
            headers: { 'x-ratelimit-remaining': '0' },
          }),
        undefined,
      ),
    );

    await expect(
      adapter.execute({
        skill,
        agentId: 'Vinicius',
        inputs: {
          repository: 'leon337/multiagent-collaboration-framework',
          diff_or_commit: 'PR #70',
        },
        tool: {
          provider: 'github',
          operation: 'inspect-code',
          resource: 'leon337/multiagent-collaboration-framework',
        },
      }),
    ).rejects.toMatchObject({ code: 'RATE_LIMITED', retryable: true, statusCode: 403 });
  });
});
