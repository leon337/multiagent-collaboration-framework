import { describe, expect, it } from 'vitest';

import {
  type AgentExecutionProviderAdapter,
  type AgentExecutionRequest,
} from './agent-execution.contracts.js';
import { AgentExecutionService } from './agent-execution.service.js';
import { ProviderAdapterRegistry } from './provider-adapter.registry.js';

const provider = {
  providerId: 'test-provider',
  mode: 'APPLICATION_OWNED' as const,
  version: '1',
  capabilities: ['PERSISTENT_CONTEXT'] as const,
};

const request: AgentExecutionRequest = {
  missionId: 'mission-1',
  runId: 'run-1',
  agent: {
    agentId: 'sofia',
    role: 'architecture',
    version: '1',
    capabilities: ['architecture'],
  },
  provider,
  authority: {
    authorityId: 'authority-1',
    issuer: 'HUMAN',
    missionId: 'mission-1',
    runId: 'run-1',
    allowedActions: ['research'],
    providerScope: ['test-provider'],
    expiresAt: null,
    approvalRequired: true,
  },
  prompt: 'test',
  requestedAction: 'research',
  requestedCapabilities: ['PERSISTENT_CONTEXT'],
};

function adapter(): AgentExecutionProviderAdapter {
  return {
    provider,
    start: async () => ({
      missionId: 'mission-1',
      runId: 'run-1',
      providerId: 'test-provider',
      providerExecutionId: 'provider-run-1',
    }),
    resume: async (handle) => ({
      handle,
      lifecycle: 'RUNNING',
      observedAt: new Date().toISOString(),
      providerState: 'running',
      effectState: 'NONE_OBSERVED',
    }),
    interrupt: async (handle) => ({
      handle,
      lifecycle: 'INTERRUPT_REQUESTED',
      observedAt: new Date().toISOString(),
      providerState: 'interrupt_requested',
      effectState: 'EFFECT_UNKNOWN',
    }),
    cancel: async (handle) => ({
      handle,
      lifecycle: 'CANCEL_REQUESTED',
      observedAt: new Date().toISOString(),
      providerState: 'cancel_requested',
      effectState: 'EFFECT_UNKNOWN',
    }),
    status: async (handle) => ({
      handle,
      lifecycle: 'RUNNING',
      observedAt: new Date().toISOString(),
      providerState: 'running',
      effectState: 'NONE_OBSERVED',
    }),
    collectEvidence: async () => [
      {
        evidenceId: 'evidence-1',
        providerId: 'test-provider',
        providerExecutionId: 'provider-run-1',
        kind: 'TRACE',
        sourceRef: 'trace://provider-run-1',
        observedAt: new Date().toISOString(),
        digest: null,
        metadata: {},
      },
    ],
  };
}

describe('AgentExecutionService', () => {
  it('validates authority and capabilities before starting provider execution', async () => {
    const service = new AgentExecutionService(new ProviderAdapterRegistry([adapter()]));

    await expect(service.start(request)).resolves.toEqual({
      missionId: 'mission-1',
      runId: 'run-1',
      providerId: 'test-provider',
      providerExecutionId: 'provider-run-1',
    });
  });

  it('keeps interrupt and cancel provider semantics visible to MCF', async () => {
    const service = new AgentExecutionService(new ProviderAdapterRegistry([adapter()]));
    const handle = await service.start(request);

    await expect(service.interrupt(handle)).resolves.toMatchObject({
      lifecycle: 'INTERRUPT_REQUESTED',
      effectState: 'EFFECT_UNKNOWN',
    });
    await expect(service.cancel(handle)).resolves.toMatchObject({
      lifecycle: 'CANCEL_REQUESTED',
      effectState: 'EFFECT_UNKNOWN',
    });
  });

  it('collects provider evidence without treating it as authority', async () => {
    const service = new AgentExecutionService(new ProviderAdapterRegistry([adapter()]));
    const handle = await service.start(request);
    const evidence = await service.collectEvidence(handle);

    expect(evidence[0]).toMatchObject({
      providerId: 'test-provider',
      kind: 'TRACE',
    });
  });
});
