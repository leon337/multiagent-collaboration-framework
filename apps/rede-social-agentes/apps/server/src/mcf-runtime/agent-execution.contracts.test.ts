import { describe, expect, it } from 'vitest';

import {
  assertAuthorityEnvelope,
  assertRequestedCapabilities,
  type AgentExecutionProviderAdapter,
  type AgentExecutionRequest,
} from './agent-execution.contracts.js';
import { ProviderAdapterRegistry } from './provider-adapter.registry.js';

const provider = {
  providerId: 'test-provider',
  mode: 'APPLICATION_OWNED' as const,
  version: '1',
  capabilities: ['PERSISTENT_CONTEXT', 'RESUMABLE_STATE'] as const,
};

function request(overrides: Partial<AgentExecutionRequest> = {}): AgentExecutionRequest {
  return {
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
      issuer: 'MISSION',
      missionId: 'mission-1',
      allowedActions: ['research'],
      providerScope: ['test-provider'],
      expiresAt: null,
      approvalRequired: false,
    },
    prompt: 'test',
    requestedCapabilities: ['PERSISTENT_CONTEXT'],
    ...overrides,
  };
}

describe('provider-independent agent execution contract', () => {
  it('keeps AgentRole separate from the execution provider', () => {
    const execution = request();
    expect(execution.agent.agentId).toBe('sofia');
    expect(execution.provider.providerId).toBe('test-provider');
    expect(execution.agent.agentId).not.toBe(execution.provider.providerId);
  });

  it('rejects authority for another mission', () => {
    expect(() =>
      assertAuthorityEnvelope(
        request({
          authority: {
            ...request().authority,
            missionId: 'other-mission',
          },
        }),
      ),
    ).toThrow(/missionId/);
  });

  it('rejects provider outside the authority scope', () => {
    expect(() =>
      assertAuthorityEnvelope(
        request({
          authority: {
            ...request().authority,
            providerScope: ['other-provider'],
          },
        }),
      ).toThrow(/provider/);
  });

  it('rejects expired authority', () => {
    expect(() =>
      assertAuthorityEnvelope(
        request({
          authority: {
            ...request().authority,
            expiresAt: '2020-01-01T00:00:00.000Z',
          },
        }),
      ),
    ).toThrow(/expired/);
  });

  it('requires a human issuer when human approval is required', () => {
    expect(() =>
      assertAuthorityEnvelope(
        request({
          authority: {
            ...request().authority,
            approvalRequired: true,
          },
        }),
      ),
    ).toThrow(/HUMAN/);
  });

  it('rejects unsupported provider capabilities', () => {
    expect(() =>
      assertRequestedCapabilities(
        request({
          requestedCapabilities: ['BACKGROUND_EXECUTION'],
        }),
      ),
    ).toThrow(/BACKGROUND_EXECUTION/);
  });

  it('resolves a provider by capability', async () => {
    const adapter: AgentExecutionProviderAdapter = {
      provider,
      start: async () => ({
        missionId: 'mission-1',
        runId: 'run-1',
        providerId: 'test-provider',
        providerExecutionId: 'exec-1',
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
      collectEvidence: async () => [],
    };

    const registry = new ProviderAdapterRegistry([adapter]);
    expect(
      registry.resolve({ requiredCapabilities: ['PERSISTENT_CONTEXT'] }),
    ).toBe(adapter);
    expect(registry.listProviders()).toEqual([provider]);
  });
});
