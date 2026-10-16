import { describe, expect, it } from 'vitest';

import type {
  AgentExecutionProviderAdapter,
  AgentExecutionRequest,
} from './agent-execution.contracts.js';
import { AgentExecutionService } from './agent-execution.service.js';
import { ProviderAdapterRegistry } from './provider-adapter.registry.js';

/**
 * MCF-ORACLE-001 / P0: exercises the ACTUAL AgentExecutionService against
 * a deterministic in-process provider. This is a contract qualification,
 * NOT a Codex/GPT-6 Astra invocation or proof of a live Oracle binding.
 *
 * No external calls, credentials, paid AI APIs, or production writes.
 */
const provider = {
  providerId: 'oracle-preflight-test-only',
  mode: 'APPLICATION_OWNED' as const,
  version: 'p0',
  capabilities: ['PERSISTENT_CONTEXT', 'RESUMABLE_STATE', 'TRACE_EXPORT'] as const,
};

const request: AgentExecutionRequest = {
  missionId: 'mcf-oracle-001-p0',
  runId: 'p0-readonly-1',
  agent: {
    agentId: 'Oraculo',
    role: 'strategic-planning-test-only',
    version: 'candidate',
    capabilities: ['planning'],
  },
  provider,
  authority: {
    authorityId: 'test-scope-p0',
    issuer: 'MISSION',
    missionId: 'mcf-oracle-001-p0',
    runId: 'p0-readonly-1',
    allowedActions: ['inspect-contract'],
    providerScope: [provider.providerId],
    expiresAt: null,
    approvalRequired: false,
  },
  prompt: 'Inspect the MCF-ORACLE-001 phase P0 contract without changing anything.',
  requestedAction: 'inspect-contract',
  requestedCapabilities: ['PERSISTENT_CONTEXT', 'RESUMABLE_STATE'],
};

function testProvider(onStart?: () => void): AgentExecutionProviderAdapter {
  return {
    provider,
    start: async (input) => {
      onStart?.();
      return {
        missionId: input.missionId,
        runId: input.runId,
        providerId: provider.providerId,
        providerExecutionId: 'p0-test-execution',
      };
    },
    resume: async (handle) => ({
      handle,
      lifecycle: 'RUNNING',
      observedAt: '2026-10-16T00:00:00.000Z',
      providerState: 'resumed',
      effectState: 'NONE_OBSERVED',
    }),
    interrupt: async (handle) => ({
      handle,
      lifecycle: 'INTERRUPT_REQUESTED',
      observedAt: '2026-10-16T00:00:00.000Z',
      providerState: 'interrupt_requested',
      effectState: 'EFFECT_UNKNOWN',
    }),
    cancel: async (handle) => ({
      handle,
      lifecycle: 'CANCEL_REQUESTED',
      observedAt: '2026-10-16T00:00:00.000Z',
      providerState: 'cancel_requested',
      effectState: 'EFFECT_UNKNOWN',
    }),
    status: async (handle) => ({
      handle,
      lifecycle: 'RUNNING',
      observedAt: '2026-10-16T00:00:00.000Z',
      providerState: 'running',
      effectState: 'NONE_OBSERVED',
    }),
    collectEvidence: async (handle) => [
      {
        evidenceId: 'p0-evidence',
        providerId: provider.providerId,
        providerExecutionId: handle.providerExecutionId,
        kind: 'TRACE',
        sourceRef: 'test://mcf-oracle-001/p0',
        observedAt: '2026-10-16T00:00:00.000Z',
        digest: null,
        metadata: { testOnly: true, noCognitiveExecutor: true },
      },
    ],
  };
}

describe('MCF-ORACLE-001 P0 — execute real MCF provider lifecycle without a live LLM', () => {
  it('starts a bounded mission, resumes it and collects typed provider evidence', async () => {
    let started = 0;
    const runtime = new AgentExecutionService(
      new ProviderAdapterRegistry([
        testProvider(() => {
          started += 1;
        }),
      ]),
    );
    const handle = await runtime.start(request);
    expect(started).toBe(1);
    expect(handle).toEqual({
      missionId: request.missionId,
      runId: request.runId,
      providerId: provider.providerId,
      providerExecutionId: 'p0-test-execution',
    });
    expect(await runtime.resume(handle)).toMatchObject({
      lifecycle: 'RUNNING',
      effectState: 'NONE_OBSERVED',
    });
    expect(await runtime.collectEvidence(handle)).toMatchObject([
      {
        kind: 'TRACE',
        metadata: { testOnly: true, noCognitiveExecutor: true },
      },
    ]);
  });

  it('blocks action outside the mission authority envelope before invoking a provider', async () => {
    let started = 0;
    const runtime = new AgentExecutionService(
      new ProviderAdapterRegistry([
        testProvider(() => {
          started += 1;
        }),
      ]),
    );
    await expect(
      runtime.start({
        ...request,
        requestedAction: 'deploy-production',
      }),
    ).rejects.toThrow('does not authorize the requested action');
    expect(started).toBe(0);
  });

  it('blocks wrong-mission scope and an expired authority envelope', async () => {
    const runtime = new AgentExecutionService(new ProviderAdapterRegistry([testProvider()]));
    await expect(
      runtime.start({
        ...request,
        authority: { ...request.authority, missionId: 'some-other-mission' },
      }),
    ).rejects.toThrow('missionId does not match');
    await expect(
      runtime.start({
        ...request,
        authority: { ...request.authority, expiresAt: '2020-01-01T00:00:00.000Z' },
      }),
    ).rejects.toThrow('expired or invalid');
  });

  it('requires the human authority issuer for actions flagged as requiring approval', async () => {
    const runtime = new AgentExecutionService(new ProviderAdapterRegistry([testProvider()]));
    await expect(
      runtime.start({
        ...request,
        authority: { ...request.authority, approvalRequired: true },
      }),
    ).rejects.toThrow('human approval is required');
  });

  it('fails closed if no eligible execution provider supports the requested capabilities', async () => {
    const runtime = new AgentExecutionService(new ProviderAdapterRegistry([testProvider()]));
    await expect(
      runtime.start({
        ...request,
        requestedCapabilities: ['COMPUTER_USE'],
      }),
    ).rejects.toThrow('lacks capabilities');
    await expect(
      new AgentExecutionService(new ProviderAdapterRegistry()).start(request),
    ).rejects.toThrow('No execution provider adapter');
  });

  it('does not interpret an unknown external effect as a successful conclusion', async () => {
    const runtime = new AgentExecutionService(new ProviderAdapterRegistry([testProvider()]));
    const handle = await runtime.start(request);
    expect(await runtime.interrupt(handle)).toMatchObject({
      lifecycle: 'INTERRUPT_REQUESTED',
      effectState: 'EFFECT_UNKNOWN',
    });
    expect(await runtime.cancel(handle)).toMatchObject({
      lifecycle: 'CANCEL_REQUESTED',
      effectState: 'EFFECT_UNKNOWN',
    });
  });
});
