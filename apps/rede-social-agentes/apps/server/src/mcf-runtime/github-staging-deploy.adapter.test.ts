import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EvidenceValidator } from './evidence-validator.js';
import type { ExternalActionRequest } from './external-action.contracts.js';
import {
  GitHubActionsStagingDeployAdapter,
  GitHubStagingDeployClient,
} from './github-staging-deploy.adapter.js';

const REPOSITORY = 'leon337/multiagent-collaboration-framework';
const PREVIOUS_SHA = 'a'.repeat(40);
const RELEASE_SHA = 'b'.repeat(40);
const MAIN_SHA = 'c'.repeat(40);
const OTHER_SHA = 'd'.repeat(40);
const KEY = 'mcf-gate-d-idempotency-0001';
const RUN_ID = 4242;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function request(overrides: Record<string, unknown> = {}): ExternalActionRequest {
  return {
    skill: {
      skillId: 'MCF-DEPLOY-VALIDATE',
      name: 'Deploy Validate',
      version: '1.0.0',
      purpose: 'verified staging deployment',
      ownerAgents: ['Bruno', 'Gabriel'],
      requiredInputs: ['artifact_or_commit', 'target_environment'],
      allowedTools: ['GitHub', 'Render'],
      forbiddenTools: ['public_production_without_gate'],
      permissionProfile: 'SCOPED_WRITE',
      executionSteps: [],
      requiredEvidence: ['deployment_id', 'target', 'smoke_result', 'rollback_state'],
      acceptanceCriteria: ['healthy_deployment', 'rollback_available'],
      failureModes: [],
      fallback: 'Mestre',
      handoffTo: 'Mestre',
    },
    agentId: 'Gabriel',
    inputs: {
      repository: REPOSITORY,
      artifact_or_commit: RELEASE_SHA,
      target_environment: 'staging',
      idempotency_key: KEY,
      authorizedScope: true,
      ...overrides,
    },
    tool: { provider: 'github', operation: 'deploy-staging', resource: REPOSITORY },
    context: {
      missionId: 'mission-gate-d',
      phaseId: 'phase-gate-d',
      expectedMissionVersion: 7,
    },
  };
}

function workflowRun({
  id = RUN_ID,
  title = `MCF staging deploy ${KEY} ${RELEASE_SHA} mission-gate-d phase-gate-d`,
  status = 'completed',
  conclusion = 'success',
}: {
  id?: number;
  title?: string;
  status?: string;
  conclusion?: string | null;
} = {}) {
  return {
    id,
    display_title: title,
    event: 'workflow_dispatch',
    status,
    conclusion,
    head_branch: 'main',
    head_sha: MAIN_SHA,
    path: '.github/workflows/mcf-runtime-staging-deploy.yml',
    html_url: `https://github.com/${REPOSITORY}/actions/runs/${id}`,
    created_at: '2026-08-08T22:00:00Z',
    updated_at: '2026-08-08T22:01:00Z',
  };
}

function jobs(
  outcome: 'DEPLOYED' | 'NOOP' | 'RECOVERED',
  options: {
    duplicateOutcomeMarker?: boolean;
    additionalSuccessfulOutcome?: 'DEPLOYED' | 'NOOP' | 'RECOVERED';
  } = {},
) {
  const names = ['DEPLOYED', 'NOOP', 'RECOVERED'];
  const steps = names.map((name, index) => ({
    number: index + 1,
    name: `Deployment result ${name}`,
    status: 'completed',
    conclusion: name === outcome ? 'success' : 'skipped',
  }));
  if (options.duplicateOutcomeMarker) {
    const source = steps.find((step) => step.name === `Deployment result ${outcome}`);
    if (!source) throw new Error('missing source outcome marker');
    steps.push({ ...source, number: steps.length + 1 });
  }
  if (options.additionalSuccessfulOutcome) {
    const additional = steps.find(
      (step) => step.name === `Deployment result ${options.additionalSuccessfulOutcome}`,
    );
    if (!additional) throw new Error('missing additional outcome marker');
    additional.conclusion = 'success';
  }
  return {
    total_count: 1,
    jobs: [
      {
        id: 99,
        run_id: RUN_ID,
        name: 'deploy-and-verify',
        status: 'completed',
        conclusion: outcome === 'RECOVERED' ? 'failure' : 'success',
        steps,
      },
    ],
  };
}

function fakeProvider(
  options: {
    existing?: boolean;
    duplicateRuns?: boolean;
    nonAncestor?: boolean;
    conflictingSha?: string | null;
    outcome?: 'DEPLOYED' | 'NOOP' | 'RECOVERED';
    hang?: boolean;
    finishAfterTimeout?: boolean;
    unhealthyBefore?: boolean;
    inconsistentFinal?: boolean;
    malformedJobs?: boolean;
    duplicateOutcomeMarker?: boolean;
    additionalSuccessfulOutcome?: 'DEPLOYED' | 'NOOP' | 'RECOVERED';
  } = {},
) {
  const outcome = options.outcome ?? 'DEPLOYED';
  let currentSha = options.existing && outcome !== 'RECOVERED' ? RELEASE_SHA : PREVIOUS_SHA;
  let ready = !options.unhealthyBefore;
  let runExists = options.existing ?? false;
  let hang = options.hang ?? false;
  let dispatches = 0;
  const requests: string[] = [];

  const fetcher = vi.fn(async (input: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET';
    requests.push(`${method} ${input}`);
    const url = new URL(input);

    if (url.hostname === 'staging.example' && url.pathname === '/health/version') {
      return jsonResponse({ commitSha: currentSha });
    }
    if (url.hostname === 'staging.example' && url.pathname === '/health/ready') {
      return jsonResponse({ status: ready ? 'ok' : 'not-ready' }, ready ? 200 : 503);
    }

    if (url.hostname !== 'api.github.com') {
      throw new Error(`unexpected host ${url.hostname}`);
    }
    if (url.pathname.endsWith('/git/ref/heads/main')) {
      return jsonResponse({ ref: 'refs/heads/main', object: { sha: MAIN_SHA } });
    }
    if (url.pathname.endsWith(`/commits/${RELEASE_SHA}`)) {
      return jsonResponse({
        sha: RELEASE_SHA,
        html_url: `https://github.com/${REPOSITORY}/commit/${RELEASE_SHA}`,
      });
    }
    if (url.pathname.includes(`/compare/${RELEASE_SHA}...${MAIN_SHA}`)) {
      return jsonResponse(
        options.nonAncestor
          ? { status: 'diverged', merge_base_commit: { sha: MAIN_SHA } }
          : { status: 'ahead', merge_base_commit: { sha: RELEASE_SHA } },
      );
    }
    if (url.pathname.endsWith('/actions/workflows/mcf-runtime-staging-deploy.yml/dispatches')) {
      dispatches += 1;
      runExists = true;
      return new Response(null, { status: 204 });
    }
    if (
      url.pathname.endsWith('/actions/workflows/mcf-runtime-staging-deploy.yml/runs') &&
      method === 'GET'
    ) {
      if (options.conflictingSha) {
        return jsonResponse({
          total_count: 1,
          workflow_runs: [
            workflowRun({ title: `MCF staging deploy ${KEY} ${options.conflictingSha}` }),
          ],
        });
      }
      if (!runExists) return jsonResponse({ total_count: 0, workflow_runs: [] });
      const status = hang ? 'in_progress' : 'completed';
      const conclusion = hang ? null : outcome === 'RECOVERED' ? 'failure' : 'success';
      if (!hang && !options.inconsistentFinal) {
        currentSha = outcome === 'RECOVERED' ? PREVIOUS_SHA : RELEASE_SHA;
        ready = !options.unhealthyBefore;
      }
      const workflowRuns = options.duplicateRuns
        ? [workflowRun({ status, conclusion }), workflowRun({ id: RUN_ID + 1, status, conclusion })]
        : [workflowRun({ status, conclusion })];
      return jsonResponse({
        total_count: workflowRuns.length,
        workflow_runs: workflowRuns,
      });
    }
    if (url.pathname.endsWith(`/actions/runs/${RUN_ID}`)) {
      if (hang) return jsonResponse(workflowRun({ status: 'in_progress', conclusion: null }));
      return jsonResponse(
        workflowRun({ conclusion: outcome === 'RECOVERED' ? 'failure' : 'success' }),
      );
    }
    if (url.pathname.endsWith(`/actions/runs/${RUN_ID}/jobs`)) {
      if (options.malformedJobs) {
        return jsonResponse({ total_count: 1, jobs: [{ id: 99, run_id: RUN_ID, steps: 'bad' }] });
      }
      return jsonResponse(jobs(outcome, options));
    }

    throw new Error(`unexpected request ${method} ${input}`);
  });

  return {
    fetcher,
    get dispatches() {
      return dispatches;
    },
    requests,
    finish() {
      hang = false;
      currentSha = outcome === 'RECOVERED' ? PREVIOUS_SHA : RELEASE_SHA;
      ready = true;
    },
  };
}

function adapter(provider: ReturnType<typeof fakeProvider>, timeoutMs = 200) {
  return new GitHubActionsStagingDeployAdapter(
    new EvidenceValidator(),
    new GitHubStagingDeployClient(provider.fetcher, 'test-token'),
    {
      stagingRuntimeUrl: 'https://staging.example',
      timeoutMs,
      pollIntervalMs: 2,
      sleepImpl: async () => new Promise((resolve) => setTimeout(resolve, 1)),
    },
  );
}

describe('GitHubActionsStagingDeployAdapter', () => {
  beforeEach(() => {
    process.env.MCF_RECEIPT_SECRET = 'test-secret-that-is-long-enough-for-mcf-runtime';
  });

  it('dispatches one correlated workflow and verifies the exact healthy release', async () => {
    const provider = fakeProvider();
    const receipt = await adapter(provider).execute(request());

    expect(provider.dispatches).toBe(1);
    expect(receipt.status).toBe('SUCCEEDED');
    expect(receipt.provider).toBe('github-actions');
    expect(receipt.externalId).toBe(String(RUN_ID));
    expect(receipt.commitSha).toBe(RELEASE_SHA);
    expect(receipt.metadata.deploymentOutcome).toBe('DEPLOYED');
    expect(receipt.metadata.verifiedSha).toBe(RELEASE_SHA);
    expect(receipt.metadata.stagingReady).toBe(true);
    expect(receipt.metadata.nativeRollbackClaimed).toBe(false);
    expect(JSON.stringify(receipt.metadata)).not.toContain('RENDER_DEPLOY_HOOK_URL');
  });

  it('replays an existing correlated NOOP run without dispatching a second workflow', async () => {
    const provider = fakeProvider({ existing: true, outcome: 'NOOP' });
    const receipt = await adapter(provider).execute(request());

    expect(provider.dispatches).toBe(0);
    expect(receipt.metadata.deploymentOutcome).toBe('NOOP');
    expect(receipt.metadata.previousSha).toBe(RELEASE_SHA);
  });

  it('does not fabricate the prior SHA when replaying an old DEPLOYED run', async () => {
    const provider = fakeProvider({ existing: true, outcome: 'DEPLOYED' });
    const receipt = await adapter(provider).execute(request());

    expect(provider.dispatches).toBe(0);
    expect(receipt.status).toBe('PARTIAL');
    expect(receipt.metadata.deploymentOutcome).toBe('UNKNOWN');
    expect(receipt.metadata.unknownReason).toMatch(
      /without durable proof of its original pre-deploy SHA/u,
    );
  });

  it('fails closed when the idempotency key is bound to another release SHA', async () => {
    const provider = fakeProvider({ conflictingSha: OTHER_SHA });

    await expect(adapter(provider).execute(request())).rejects.toMatchObject({
      code: 'RESERVATION_CONFLICT',
      retryable: false,
    });
    expect(provider.dispatches).toBe(0);
  });

  it('returns PARTIAL when multiple existing runs match the same key and release SHA', async () => {
    const provider = fakeProvider({ existing: true, duplicateRuns: true });
    const receipt = await adapter(provider).execute(request());

    expect(provider.dispatches).toBe(0);
    expect(receipt.status).toBe('PARTIAL');
    expect(receipt.metadata.deploymentOutcome).toBe('UNKNOWN');
    expect(receipt.metadata.unknownReason).toMatch(/multiple correlated workflow runs/u);
  });

  it('returns PARTIAL for duplicate existing runs before an unhealthy staging preflight can reject', async () => {
    const provider = fakeProvider({ existing: true, duplicateRuns: true, unhealthyBefore: true });
    const receipt = await adapter(provider).execute(request());

    expect(provider.dispatches).toBe(0);
    expect(receipt.status).toBe('PARTIAL');
    expect(receipt.metadata.deploymentOutcome).toBe('UNKNOWN');
    expect(receipt.metadata.previousSha).toBeNull();
    expect(provider.requests.some((entry) => entry.includes('staging.example'))).toBe(false);
  });

  it('returns PARTIAL for duplicate existing runs before a non-ancestor release preflight can reject', async () => {
    const provider = fakeProvider({ existing: true, duplicateRuns: true, nonAncestor: true });
    const receipt = await adapter(provider).execute(request());

    expect(provider.dispatches).toBe(0);
    expect(receipt.status).toBe('PARTIAL');
    expect(receipt.metadata.deploymentOutcome).toBe('UNKNOWN');
    expect(provider.requests.some((entry) => entry.includes('/compare/'))).toBe(false);
  });

  it('returns PARTIAL when one existing correlated run is present and staging preflight is unhealthy', async () => {
    const provider = fakeProvider({ existing: true, unhealthyBefore: true });
    const receipt = await adapter(provider).execute(request());

    expect(provider.dispatches).toBe(0);
    expect(receipt.status).toBe('PARTIAL');
    expect(receipt.metadata.deploymentOutcome).toBe('UNKNOWN');
    expect(receipt.metadata.previousSha).toBeNull();
    expect(receipt.metadata.unknownReason).toMatch(/existing correlated workflow run.*preflight/u);
    expect(provider.requests.some((entry) => entry.startsWith('POST '))).toBe(false);
  });

  it('returns PARTIAL when one existing correlated run is present and ancestry preflight rejects', async () => {
    const provider = fakeProvider({ existing: true, nonAncestor: true });
    const receipt = await adapter(provider).execute(request());

    expect(provider.dispatches).toBe(0);
    expect(receipt.status).toBe('PARTIAL');
    expect(receipt.metadata.deploymentOutcome).toBe('UNKNOWN');
    expect(receipt.metadata.previousSha).toBeNull();
    expect(receipt.metadata.unknownReason).toMatch(/existing correlated workflow run.*preflight/u);
    expect(provider.requests.some((entry) => entry.startsWith('POST '))).toBe(false);
  });

  it('proves recovery only when the previous healthy SHA is restored', async () => {
    const provider = fakeProvider({ outcome: 'RECOVERED' });
    const receipt = await adapter(provider).execute(request());

    expect(receipt.status).toBe('SUCCEEDED');
    expect(receipt.metadata.deploymentOutcome).toBe('RECOVERED');
    expect(receipt.metadata.workflowConclusion).toBe('failure');
    expect(receipt.metadata.previousSha).toBe(PREVIOUS_SHA);
    expect(receipt.metadata.verifiedSha).toBe(PREVIOUS_SHA);
    expect(receipt.metadata.recoveryStrategy).toBe('REDEPLOY_PREVIOUS_HEALTHY_SHA');
  });

  it('returns PARTIAL instead of assuming success when workflow and staging disagree', async () => {
    const provider = fakeProvider({ inconsistentFinal: true });
    const receipt = await adapter(provider).execute(request());

    expect(receipt.status).toBe('PARTIAL');
    expect(receipt.metadata.deploymentOutcome).toBe('UNKNOWN');
    expect(receipt.metadata.resultStatus).toBe('UNKNOWN');
  });

  it('returns PARTIAL after a malformed jobs response once external execution is possible', async () => {
    const provider = fakeProvider({ malformedJobs: true });
    const receipt = await adapter(provider).execute(request());

    expect(provider.dispatches).toBe(1);
    expect(receipt.status).toBe('PARTIAL');
    expect(receipt.metadata.deploymentOutcome).toBe('UNKNOWN');
    expect(receipt.metadata.unknownReason).toMatch(/workflow result marker could not be verified/u);
  });

  it('rejects duplicate successful copies of the same deployment marker', async () => {
    const provider = fakeProvider({ duplicateOutcomeMarker: true });
    const receipt = await adapter(provider).execute(request());

    expect(provider.dispatches).toBe(1);
    expect(receipt.status).toBe('PARTIAL');
    expect(receipt.metadata.deploymentOutcome).toBe('UNKNOWN');
    expect(receipt.metadata.unknownReason).toMatch(/exactly one trusted deployment result marker/u);
  });

  it('rejects multiple successful deployment outcomes in one job', async () => {
    const provider = fakeProvider({ additionalSuccessfulOutcome: 'NOOP' });
    const receipt = await adapter(provider).execute(request());

    expect(provider.dispatches).toBe(1);
    expect(receipt.status).toBe('PARTIAL');
    expect(receipt.metadata.deploymentOutcome).toBe('UNKNOWN');
    expect(receipt.metadata.unknownReason).toMatch(/exactly one trusted deployment result marker/u);
  });

  it('returns PARTIAL when the correlated workflow remains active past the adapter deadline', async () => {
    const provider = fakeProvider({ hang: true });
    const receipt = await adapter(provider, 25).execute(request());

    expect(provider.dispatches).toBe(1);
    expect(receipt.status).toBe('PARTIAL');
    expect(receipt.externalId).toBe(String(RUN_ID));
    expect(receipt.metadata.deploymentOutcome).toBe('UNKNOWN');
  });

  it('automatically reconciles a workflow that finishes after the adapter deadline without redispatch', async () => {
    const provider = fakeProvider({ hang: true });
    const instance = adapter(provider, 25);
    const initial = await instance.execute(request());

    expect(provider.dispatches).toBe(1);
    expect(initial.status).toBe('PARTIAL');
    expect(initial.metadata.deploymentOutcome).toBe('UNKNOWN');
    expect(initial.metadata.reconciliationEligible).toBe(true);
    expect(initial.metadata.previousSha).toBe(PREVIOUS_SHA);

    provider.finish();
    const reconciled = await instance.reconcile(request(), {
      expectedRunId: RUN_ID,
      previousSha: PREVIOUS_SHA,
      stagingRuntimeUrl: 'https://staging.example',
    });

    expect(provider.dispatches).toBe(1);
    expect(reconciled.status).toBe('SUCCEEDED');
    expect(reconciled.metadata.deploymentOutcome).toBe('DEPLOYED');
    expect(reconciled.metadata.previousSha).toBe(PREVIOUS_SHA);
    expect(reconciled.metadata.verifiedSha).toBe(RELEASE_SHA);
  });

  it('does not mutate when staging is unhealthy before dispatch', async () => {
    const provider = fakeProvider({ unhealthyBefore: true });

    await expect(adapter(provider).execute(request())).rejects.toMatchObject({
      code: 'RESERVATION_CONFLICT',
      retryable: false,
    });
    expect(provider.dispatches).toBe(0);
    expect(provider.requests.some((entry) => entry.startsWith('POST '))).toBe(false);
  });

  it('rejects production even when the caller supplies a human gate flag', async () => {
    const provider = fakeProvider();

    await expect(
      adapter(provider).execute(
        request({ target_environment: 'production', humanGateApproved: true }),
      ),
    ).rejects.toMatchObject({
      code: 'UNSUPPORTED_TARGET',
      retryable: false,
    });
    expect(provider.dispatches).toBe(0);
  });

  it('blocks dispatch when workflow history exceeds the bounded reconciliation window', async () => {
    let dispatches = 0;
    const fetcher = vi.fn(async (input: string, init?: RequestInit) => {
      const url = new URL(input);
      if (url.hostname === 'staging.example' && url.pathname === '/health/version') {
        return jsonResponse({ commitSha: PREVIOUS_SHA });
      }
      if (url.hostname === 'staging.example' && url.pathname === '/health/ready') {
        return jsonResponse({ status: 'ok' });
      }
      if (url.pathname.endsWith('/git/ref/heads/main')) {
        return jsonResponse({ ref: 'refs/heads/main', object: { sha: MAIN_SHA } });
      }
      if (url.pathname.endsWith(`/commits/${RELEASE_SHA}`)) {
        return jsonResponse({
          sha: RELEASE_SHA,
          html_url: `https://github.com/${REPOSITORY}/commit/${RELEASE_SHA}`,
        });
      }
      if (url.pathname.includes(`/compare/${RELEASE_SHA}...${MAIN_SHA}`)) {
        return jsonResponse({ status: 'ahead', merge_base_commit: { sha: RELEASE_SHA } });
      }
      if (url.pathname.endsWith('/actions/workflows/mcf-runtime-staging-deploy.yml/dispatches')) {
        dispatches += 1;
        return new Response(null, { status: 204 });
      }
      if (url.pathname.endsWith('/actions/workflows/mcf-runtime-staging-deploy.yml/runs')) {
        return jsonResponse({
          total_count: 1001,
          workflow_runs: Array.from({ length: 100 }, (_, index) =>
            workflowRun({ id: 10_000 + index, title: `unrelated-${index}` }),
          ),
        });
      }
      throw new Error(`unexpected request ${init?.method ?? 'GET'} ${input}`);
    });
    const gateD = new GitHubActionsStagingDeployAdapter(
      new EvidenceValidator(),
      new GitHubStagingDeployClient(fetcher, 'test-token'),
      {
        stagingRuntimeUrl: 'https://staging.example',
        timeoutMs: 200,
        pollIntervalMs: 1,
        sleepImpl: async () => {},
      },
    );

    await expect(gateD.execute(request())).rejects.toMatchObject({
      code: 'RESERVATION_CONFLICT',
      retryable: false,
    });
    expect(dispatches).toBe(0);
  });
});
