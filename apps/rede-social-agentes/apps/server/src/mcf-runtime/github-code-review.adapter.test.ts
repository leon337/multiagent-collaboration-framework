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
  permissionProfile: 'READ_AND_PROPOSE',
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
    expect(fetcher).toHaveBeenCalledTimes(3);
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

  it('rejects repository URLs outside github.com before any network call', async () => {
    const fetcher = vi.fn(async () => new Response('{}', { status: 500 }));
    const adapter = new GitHubCodeReviewAdapter(
      new EvidenceValidator(),
      new GitHubReadClient(fetcher, undefined),
    );

    await expect(
      adapter.execute({
        skill,
        agentId: 'Vinicius',
        inputs: {
          repository: 'https://example.com/leon337/multiagent-collaboration-framework',
          diff_or_commit: 'PR #70',
        },
        tool: {
          provider: 'github',
          operation: 'inspect-code',
          resource: 'leon337/multiagent-collaboration-framework',
        },
      }),
    ).rejects.toMatchObject({ code: 'UNSUPPORTED_TARGET' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('declares partial coverage when at least one changed file has no textual patch', async () => {
    const commitSha = 'd'.repeat(40);
    const fetcher = vi.fn(async (url: string) => {
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
              filename: 'src/runtime.ts',
              status: 'modified',
              additions: 1,
              deletions: 0,
              changes: 1,
              patch: '@@ -1,1 +1,2 @@\n export const safe = true;\n+export const ready = true;',
            },
            {
              filename: 'assets/runtime.bin',
              status: 'modified',
              additions: 0,
              deletions: 0,
              changes: 1,
            },
          ]),
          { status: 200 },
        );
      }
      return new Response('{}', { status: 404 });
    });
    const adapter = new GitHubCodeReviewAdapter(
      new EvidenceValidator(),
      new GitHubReadClient(fetcher, undefined),
    );

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

    expect(receipt.metadata).toMatchObject({
      coverage: 'PARTIAL',
      unavailablePatchFiles: ['assets/runtime.bin'],
      verdict: 'PASS_WITH_FINDINGS',
    });
  });

  it('fails closed when pull request pagination reaches the supported limit', async () => {
    const commitSha = 'e'.repeat(40);
    const files = Array.from({ length: 100 }, (_, index) => ({
      filename: `src/file-${index}.ts`,
      status: 'modified',
      additions: 1,
      deletions: 0,
      changes: 1,
      patch: '@@ -0,0 +1 @@\n+export const value = true;',
    }));
    const fetcher = vi.fn(async (url: string) => {
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
        return new Response(JSON.stringify(files), { status: 200 });
      }
      return new Response('{}', { status: 404 });
    });
    const adapter = new GitHubCodeReviewAdapter(
      new EvidenceValidator(),
      new GitHubReadClient(fetcher, undefined),
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
    ).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
    expect(fetcher).toHaveBeenCalledTimes(21);
  });

  it('rejects a pull request when its head changes during paginated collection', async () => {
    const initialSha = 'a'.repeat(40);
    const changedSha = 'b'.repeat(40);
    let metadataCalls = 0;
    const fetcher = vi.fn(async (url: string) => {
      if (url.endsWith('/pulls/70')) {
        metadataCalls += 1;
        return new Response(
          JSON.stringify({
            number: 70,
            html_url: 'https://github.com/leon337/multiagent-collaboration-framework/pull/70',
            head: { sha: metadataCalls === 1 ? initialSha : changedSha },
          }),
          { status: 200 },
        );
      }
      if (url.includes('/pulls/70/files')) {
        return new Response(
          JSON.stringify([
            {
              filename: 'src/runtime.ts',
              status: 'modified',
              additions: 1,
              deletions: 0,
              changes: 1,
              patch: '@@ -1,1 +1,2 @@\n export const safe = true;\n+export const ready = true;',
            },
          ]),
          { status: 200 },
        );
      }
      return new Response('{}', { status: 404 });
    });
    const adapter = new GitHubCodeReviewAdapter(
      new EvidenceValidator(),
      new GitHubReadClient(fetcher, undefined),
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
    ).rejects.toMatchObject({ code: 'RESERVATION_CONFLICT', retryable: true });
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it('canonicalizes accepted provider and operation aliases in signed evidence', async () => {
    const commitSha = 'c'.repeat(40);
    const fetcher = vi.fn(async (url: string) => {
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
              filename: 'src/runtime.ts',
              status: 'modified',
              additions: 1,
              deletions: 0,
              changes: 1,
              patch: '@@ -1,1 +1,2 @@\n export const safe = true;\n+export const ready = true;',
            },
          ]),
          { status: 200 },
        );
      }
      return new Response('{}', { status: 404 });
    });
    const evidence = new EvidenceValidator();
    const adapter = new GitHubCodeReviewAdapter(evidence, new GitHubReadClient(fetcher, undefined));
    const request = {
      skill,
      agentId: 'Vinicius',
      inputs: {
        repository: 'leon337/multiagent-collaboration-framework',
        diff_or_commit: 'PR #70',
      },
      tool: {
        provider: ' GitHub ',
        operation: ' INSPECT_CODE ',
        resource: 'leon337/multiagent-collaboration-framework',
      },
    };

    expect(adapter.supports(request)).toBe(true);
    const receipt = await adapter.execute(request);
    evidence.verifyForSkill(receipt, request.tool, skill);
    expect(receipt).toMatchObject({
      provider: 'github',
      operation: 'inspect-code',
      commitSha,
    });
  });
});
