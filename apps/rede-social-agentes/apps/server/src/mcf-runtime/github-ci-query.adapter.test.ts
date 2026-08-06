import type { McfSkillDefinition } from '@rsa/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EvidenceValidator } from './evidence-validator.js';
import { GitHubCiQueryAdapter, GitHubCiReadClient } from './github-ci-query.adapter.js';
import { PermissionEngine } from './permission-engine.js';

const skill: McfSkillDefinition = {
  skillId: 'MCF-RUN-TESTS',
  name: 'Executar validação e testes',
  version: '1.0.0',
  purpose: 'Consultar e validar CI sem fabricar sucesso.',
  ownerAgents: ['Renato'],
  requiredInputs: ['acceptance_criteria', 'test_target'],
  allowedTools: ['GitHub'],
  forbiddenTools: ['fabricated_pass'],
  permissionProfile: 'SCOPED_WRITE',
  executionSteps: ['consultar_ci', 'coletar_evidencia'],
  requiredEvidence: ['commands_or_workflows', 'passed', 'failed', 'logs'],
  acceptanceCriteria: ['all_critical_tests_pass'],
  failureModes: ['environment_unavailable'],
  fallback: 'Registrar bloqueio verificável.',
  handoffTo: 'Emily',
};

const repository = 'leon337/multiagent-collaboration-framework';
const commitSha = 'a'.repeat(40);

beforeEach(() => {
  process.env.DATABASE_URL = 'postgresql://rsa:rsa@127.0.0.1:5432/rsa';
  process.env.MCF_RECEIPT_SECRET = 'test-only-mcf-receipt-secret-0000000001';
});

function request(inputs: Record<string, unknown> = {}) {
  return {
    skill,
    agentId: 'Renato',
    inputs: {
      acceptance_criteria: ['all_critical_tests_pass'],
      test_target: commitSha,
      repository,
      ...inputs,
    },
    tool: {
      provider: 'github-actions',
      operation: 'query-ci',
      resource: repository,
    },
  };
}

describe('GitHubCiQueryAdapter', () => {
  it('queries workflow runs, jobs and checks by exact SHA using GET only', async () => {
    const fetcher = vi.fn(async (url: string, init?: RequestInit) => {
      expect(init?.method).toBe('GET');
      if (url.endsWith(`/commits/${commitSha}`)) {
        return new Response(
          JSON.stringify({
            sha: commitSha,
            html_url: `https://github.com/${repository}/commit/${commitSha}`,
          }),
          { status: 200 },
        );
      }
      if (url.includes('/actions/runs?')) {
        return new Response(
          JSON.stringify({
            total_count: 1,
            workflow_runs: [
              {
                id: 44,
                name: 'CI',
                path: '.github/workflows/ci.yml',
                workflow_id: 12,
                run_number: 8,
                event: 'pull_request',
                status: 'completed',
                conclusion: 'success',
                head_sha: commitSha,
                html_url: `https://github.com/${repository}/actions/runs/44`,
                created_at: '2026-08-06T11:00:00Z',
                updated_at: '2026-08-06T11:02:00Z',
              },
            ],
          }),
          { status: 200 },
        );
      }
      if (url.includes('/actions/runs/44/jobs')) {
        return new Response(
          JSON.stringify({
            total_count: 1,
            jobs: [
              {
                id: 55,
                name: 'unit-tests',
                status: 'completed',
                conclusion: 'success',
                html_url: `https://github.com/${repository}/actions/runs/44/job/55`,
                started_at: '2026-08-06T11:00:10Z',
                completed_at: '2026-08-06T11:01:50Z',
                steps: [{ number: 1, name: 'test', status: 'completed', conclusion: 'success' }],
              },
            ],
          }),
          { status: 200 },
        );
      }
      if (url.includes('/check-runs?')) {
        return new Response(
          JSON.stringify({
            total_count: 1,
            check_runs: [
              {
                id: 66,
                name: 'unit-tests',
                status: 'completed',
                conclusion: 'success',
                html_url: `https://github.com/${repository}/runs/66`,
                started_at: '2026-08-06T11:00:10Z',
                completed_at: '2026-08-06T11:01:50Z',
                app: { name: 'GitHub Actions' },
              },
            ],
          }),
          { status: 200 },
        );
      }
      return new Response('{}', { status: 404 });
    });
    const evidence = new EvidenceValidator();
    const adapter = new GitHubCiQueryAdapter(evidence, new GitHubCiReadClient(fetcher, undefined));

    const receipt = await adapter.execute(request());

    evidence.verifyForSkill(receipt, request().tool, skill);
    expect(receipt).toMatchObject({
      provider: 'github-actions',
      operation: 'query-ci',
      resource: repository,
      externalId: '44',
      commitSha,
      status: 'SUCCEEDED',
      metadata: {
        adapterId: 'github-ci-query-read-only-v1',
        requestedSha: commitSha,
        verifiedSha: commitSha,
        conclusion: 'SUCCESS',
        readOnly: true,
        workflowRunCount: 1,
        jobCount: 1,
        checkRunCount: 1,
      },
    });
    expect(receipt.signature).toMatch(/^[a-f0-9]{64}$/u);
    expect(fetcher).toHaveBeenCalledTimes(4);
  });

  it.each([
    ['failure', 'FAILURE'],
    ['cancelled', 'CANCELLED'],
    [null, 'IN_PROGRESS'],
  ] as const)('maps check conclusion %s to %s', async (providerConclusion, expected) => {
    const fetcher = vi.fn(async (url: string) => {
      if (url.endsWith(`/commits/${commitSha}`)) {
        return new Response(
          JSON.stringify({
            sha: commitSha,
            html_url: `https://github.com/${repository}/commit/${commitSha}`,
          }),
          { status: 200 },
        );
      }
      if (url.includes('/actions/runs?')) {
        return new Response(JSON.stringify({ total_count: 0, workflow_runs: [] }), {
          status: 200,
        });
      }
      if (url.includes('/check-runs?')) {
        return new Response(
          JSON.stringify({
            total_count: 1,
            check_runs: [
              {
                id: 67,
                name: 'gate',
                status: providerConclusion === null ? 'in_progress' : 'completed',
                conclusion: providerConclusion,
                html_url: `https://github.com/${repository}/runs/67`,
                started_at: '2026-08-06T11:00:10Z',
                completed_at: providerConclusion === null ? null : '2026-08-06T11:01:50Z',
              },
            ],
          }),
          { status: 200 },
        );
      }
      return new Response('{}', { status: 404 });
    });
    const adapter = new GitHubCiQueryAdapter(
      new EvidenceValidator(),
      new GitHubCiReadClient(fetcher, undefined),
    );

    const receipt = await adapter.execute(request());

    expect(receipt.status).toBe('SUCCEEDED');
    expect(receipt.metadata.conclusion).toBe(expected);
    expect(receipt.metadata.readOnly).toBe(true);
  });

  it('rejects short, symbolic or missing commit references before any request', async () => {
    const fetcher = vi.fn(async () => new Response('{}', { status: 500 }));
    const adapter = new GitHubCiQueryAdapter(
      new EvidenceValidator(),
      new GitHubCiReadClient(fetcher, undefined),
    );

    await expect(adapter.execute(request({ test_target: 'main' }))).rejects.toMatchObject({
      code: 'UNSUPPORTED_TARGET',
    });
    await expect(
      adapter.execute(request({ test_target: commitSha.slice(0, 12) })),
    ).rejects.toMatchObject({ code: 'UNSUPPORTED_TARGET' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('fails closed when the exact SHA has no CI evidence', async () => {
    const fetcher = vi.fn(async (url: string) => {
      if (url.endsWith(`/commits/${commitSha}`)) {
        return new Response(
          JSON.stringify({
            sha: commitSha,
            html_url: `https://github.com/${repository}/commit/${commitSha}`,
          }),
          { status: 200 },
        );
      }
      if (url.includes('/actions/runs?')) {
        return new Response(JSON.stringify({ total_count: 0, workflow_runs: [] }), {
          status: 200,
        });
      }
      if (url.includes('/check-runs?')) {
        return new Response(JSON.stringify({ total_count: 0, check_runs: [] }), {
          status: 200,
        });
      }
      return new Response('{}', { status: 404 });
    });
    const adapter = new GitHubCiQueryAdapter(
      new EvidenceValidator(),
      new GitHubCiReadClient(fetcher, undefined),
    );

    await expect(adapter.execute(request())).rejects.toMatchObject({ code: 'TARGET_NOT_FOUND' });
  });

  it('keeps CI query read-only while future execution still requires scoped authorization', () => {
    const permissions = new PermissionEngine();

    expect(() =>
      permissions.assertAllowed(skill, 'Renato', request().tool, request().inputs),
    ).not.toThrow();
    expect(() =>
      permissions.assertAllowed(
        skill,
        'Renato',
        { provider: 'github-actions', operation: 'run-ci', resource: repository },
        request().inputs,
      ),
    ).toThrow(/SCOPED_WRITE requires inputs\.authorizedScope=true/u);
  });
});
