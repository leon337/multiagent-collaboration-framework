import { describe, expect, it, vi } from 'vitest';
import type { AgentExecutionRequest, AgentExecutionHandle } from './agent-execution.contracts.js';
import { AgentExecutionService } from './agent-execution.service.js';
import { ProviderAdapterRegistry } from './provider-adapter.registry.js';
import { LocalOllamaProviderAdapter } from './local-ollama.provider.js';

function createRequest(adapter: LocalOllamaProviderAdapter): AgentExecutionRequest {
  const missionId = 'MCF-LOCAL-OLLAMA-QWEN35-20261115';
  const runId = 'real-local-qwen-inference';
  return {
    missionId,
    runId,
    agent: { agentId: 'Mestre', role: 'orchestrator', version: '1', capabilities: [] },
    provider: adapter.provider,
    authority: {
      authorityId: 'local-test',
      issuer: 'HUMAN',
      missionId,
      runId,
      allowedActions: ['llm.generate'],
      providerScope: [adapter.provider.providerId],
      expiresAt: null,
      approvalRequired: false,
    },
    prompt: 'Responda apenas com um algarismo: quanto e 2 mais 2?',
    requestedAction: 'llm.generate',
    requestedCapabilities: ['TRACE_EXPORT'],
  };
}

describe('MCF AgentExecutionService -> local Ollama provider', () => {
  it('rejects unauthorized mission envelopes before any model request', async () => {
    const fetchImpl = vi.fn(async () => new Response('{"response":"4"}', { status: 200 }));
    const adapter = new LocalOllamaProviderAdapter({ fetchImpl });
    const service = new AgentExecutionService(new ProviderAdapterRegistry([adapter]));
    const input = createRequest(adapter);
    await expect(
      service.start({ ...input, authority: { ...input.authority, allowedActions: [] } }),
    ).rejects.toThrow(/authorize/u);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  const live = process.env.MCF_LOCAL_OLLAMA_E2E === 'true' ? it : it.skip;
  live(
    'executes the real Qwen 3.5 through the MCF service and verifies its evidence',
    async () => {
      const adapter = new LocalOllamaProviderAdapter({ timeoutMs: 120_000 });
      const service = new AgentExecutionService(new ProviderAdapterRegistry([adapter]));
      const request = createRequest(adapter);
      const handle: AgentExecutionHandle = await service.start(request);
      let completed = false;
      for (let attempt = 0; attempt < 240; attempt += 1) {
        const state = await service.status(handle);
        if (state.lifecycle === 'COMPLETED') {
          completed = true;
          break;
        }
        if (state.lifecycle === 'FAILED')
          throw new Error(`Local inference failed: ${state.detail}`);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      expect(completed).toBe(true);
      const evidence = await service.collectEvidence(handle);
      expect(evidence).toHaveLength(1);
      expect(evidence[0]?.digest).toMatch(/^[a-f0-9]{64}$/u);
      expect(String(evidence[0]?.metadata.output).trim()).toContain('4');
    },
    180_000,
  );
});
