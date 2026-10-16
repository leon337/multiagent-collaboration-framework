import { describe, expect, it } from 'vitest';

import type { AgentExecutionRequest } from './agent-execution.contracts.js';
import { AgentExecutionService } from './agent-execution.service.js';
import {
  CodexOracleProviderAdapter,
  ORACLE_CODEX_EXPERIMENTAL_PROVIDER,
  type OracleBridgeClient,
  type OracleBridgeResult,
} from './codex-oracle-provider.adapter.js';
import { ProviderAdapterRegistry } from './provider-adapter.registry.js';

const request: AgentExecutionRequest = {
  missionId: 'MCF-ORACLE-001',
  runId: 'p3-test-01',
  agent: {
    agentId: 'Oraculo',
    role: 'strategic',
    version: 'candidate',
    capabilities: ['planning'],
  },
  provider: ORACLE_CODEX_EXPERIMENTAL_PROVIDER,
  authority: {
    authorityId: 'p3-fixture-only',
    issuer: 'MISSION',
    missionId: 'MCF-ORACLE-001',
    runId: 'p3-test-01',
    allowedActions: ['oracle.strategy.consult'],
    providerScope: ['mcf-oracle-codex-cli-experimental'],
    expiresAt: null,
    approvalRequired: false,
  },
  prompt: 'Plan a read-only MCF test with zero paid APIs.',
  requestedAction: 'oracle.strategy.consult',
  requestedCapabilities: ['PERSISTENT_CONTEXT', 'TRACE_EXPORT'],
};

function mockBridge(
  overrides: Partial<OracleBridgeResult> = {},
  invoked?: () => void,
): OracleBridgeClient {
  return {
    consult: async (input) => {
      invoked?.();
      return {
        status: 'COMPLETED',
        mission_id: input.missionId,
        session_epoch: 1,
        decision: {
          schema_version: '1.0.0',
          mission_id: input.missionId,
          request_id: input.requestId,
          decision_id: 'p3-accepted-strategy-01',
          status: 'PROPOSED',
          rationale: 'synthetic evidence only',
          strategy: [],
          specialists: ['Sofia', 'Beatriz'],
          gates: ['Constitutional human approval before activation'],
          acceptance_evidence: ['CI'],
          needs_human_approval: true,
        },
        ...overrides,
      };
    },
  };
}

describe('CodexOracleProviderAdapter candidate (DISABLED in production)', () => {
  it('fails closed without explicit enablement before contacting Codex bridge', async () => {
    let called = false;
    const adapter = new CodexOracleProviderAdapter(
      mockBridge({}, () => {
        called = true;
      }),
    );
    const runtime = new AgentExecutionService(new ProviderAdapterRegistry([adapter]));
    await expect(runtime.start(request)).rejects.toThrow(
      'disabled pending constitutional approval',
    );
    expect(called).toBe(false);
  });

  it('validates authority via real AgentExecutionService before consulting Oracle', async () => {
    let called = false;
    const adapter = new CodexOracleProviderAdapter(
      mockBridge({}, () => {
        called = true;
      }),
      true,
    );
    const runtime = new AgentExecutionService(new ProviderAdapterRegistry([adapter]));
    await expect(
      runtime.start({
        ...request,
        requestedAction: 'deploy-production',
      }),
    ).rejects.toThrow('does not authorize the requested action');
    expect(called).toBe(false);
  });

  it('accepts structured decision, produces digest evidence and no side effects', async () => {
    let invocations = 0;
    const adapter = new CodexOracleProviderAdapter(
      mockBridge({}, () => {
        invocations += 1;
      }),
      true,
    );
    const runtime = new AgentExecutionService(new ProviderAdapterRegistry([adapter]));
    const handle = await runtime.start(request);
    expect(handle.providerExecutionId).toBe('p3-accepted-strategy-01');
    expect((await runtime.status(handle)).lifecycle).toBe('COMPLETED');
    expect(await runtime.collectEvidence(handle)).toMatchObject([
      {
        kind: 'TRACE',
        digest: expect.stringMatching(/^[0-9a-f]{64}$/),
        metadata: {
          chatgptAuthRemainsLocal: true,
          allowsExternalEffect: false,
          humanGateCannotBeOverridden: true,
        },
      },
    ]);
    expect((await runtime.resume(handle)).effectState).toBe('NONE_OBSERVED');
    expect((await runtime.start(request)).providerExecutionId).toBe('p3-accepted-strategy-01');
    expect(invocations).toBe(1);
  });

  it('blocks model output bound to another mission or request', async () => {
    for (const wrong of [
      { mission_id: 'OTHER-MISSION' },
      { session_epoch: 2 },
      {
        decision: {
          ...(
            await mockBridge().consult({
              missionId: request.missionId,
              requestId: request.runId,
              prompt: request.prompt,
              sessionEpoch: 1,
            })
          ).decision,
          request_id: 'OTHER-RUN',
        },
      },
    ]) {
      const runtime = new AgentExecutionService(
        new ProviderAdapterRegistry([new CodexOracleProviderAdapter(mockBridge(wrong), true)]),
      );
      await expect(runtime.start(request)).rejects.toThrow('contract validation');
    }
  });

  it('reports unknown state without inventing a completed session after restart', async () => {
    const adapter = new CodexOracleProviderAdapter(mockBridge(), true);
    const handle = {
      missionId: request.missionId,
      runId: request.runId,
      providerId: adapter.provider.providerId,
      providerExecutionId: 'not-in-process',
    };
    expect(await adapter.status(handle)).toMatchObject({
      lifecycle: 'EFFECT_UNKNOWN',
      effectState: 'EFFECT_UNKNOWN',
    });
    expect(await adapter.collectEvidence(handle)).toEqual([]);
  });

  it('rejects arbitrary agent identity and arbitrary execution action', async () => {
    const adapter = new CodexOracleProviderAdapter(mockBridge(), true);
    const runtime = new AgentExecutionService(new ProviderAdapterRegistry([adapter]));
    await expect(
      runtime.start({
        ...request,
        agent: { ...request.agent, agentId: 'Mestre' },
      }),
    ).rejects.toThrow('requires a matching');
    await expect(
      runtime.start({
        ...request,
        requestedAction: 'read-any-file',
        authority: { ...request.authority, allowedActions: ['read-any-file'] },
      }),
    ).rejects.toThrow('does not execute arbitrary tool');
  });
});
