import { describe, expect, it, vi } from 'vitest';
import type { AgentExecutionRequest } from './agent-execution.contracts.js';
import { LocalOllamaProviderAdapter } from './local-ollama.provider.js';
import { loadRuntimeConfig } from '../config.js';

function request(adapter: LocalOllamaProviderAdapter): AgentExecutionRequest {
  return {
    missionId: 'MCF-LOCAL-QWEN35-001',
    runId: 'run-001',
    agent: { agentId: 'Mestre', role: 'orchestrator', version: '1', capabilities: [] },
    provider: adapter.provider,
    authority: {
      authorityId: 'local-user',
      issuer: 'HUMAN',
      missionId: 'MCF-LOCAL-QWEN35-001',
      runId: 'run-001',
      allowedActions: ['llm.generate'],
      providerScope: [adapter.provider.providerId],
      expiresAt: null,
      approvalRequired: false,
    },
    prompt: 'Quanto e 2+2?',
    requestedAction: 'llm.generate',
    requestedCapabilities: ['TRACE_EXPORT'],
  };
}
async function untilFinished(
  adapter: LocalOllamaProviderAdapter,
  handle: Awaited<ReturnType<LocalOllamaProviderAdapter['start']>>,
) {
  for (let i = 0; i < 60; i += 1) {
    const state = await adapter.status(handle);
    if (state.lifecycle !== 'RUNNING' && state.lifecycle !== 'CANCEL_REQUESTED') return state;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error('Inference did not finish in the unit test');
}

describe('MCF local Ollama provider', () => {
  it('fails closed if enabled in production', () => {
    expect(() =>
      loadRuntimeConfig({
        ...process.env,
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://localhost/mcf_test',
        MCF_LOCAL_OLLAMA_ENABLED: 'true',
      }),
    ).toThrow(/Local Ollama provider cannot be enabled in production/u);
  });
  it('executes only local Qwen inference, emits a stable receipt, and reports no external effect', async () => {
    const transport = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe('http://127.0.0.1:11434/api/chat');
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      expect(body).toMatchObject({
        model: 'qwen3.5:4b',
        stream: false,
        think: false,
        messages: [{ role: 'user', content: 'Quanto e 2+2?' }],
      });
      return new Response(JSON.stringify({ message: { content: '4' }, eval_count: 1 }), {
        status: 200,
      });
    });
    const adapter = new LocalOllamaProviderAdapter({ fetchImpl: transport });
    const input = request(adapter);
    const handle = await adapter.start(input);
    const duplicateHandle = await adapter.start(input);
    expect(handle).toEqual(duplicateHandle);
    const status = await untilFinished(adapter, handle);
    expect(status.lifecycle).toBe('COMPLETED');
    expect(status.effectState).toBe('NONE_OBSERVED');
    const evidence = await adapter.collectEvidence(handle);
    expect(evidence).toHaveLength(1);
    expect(evidence[0]?.digest).toMatch(/^[a-f0-9]{64}$/u);
    expect(evidence[0]?.metadata.output).toBe('4');
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it('rejects unauthorized actions and a conflicting repeated runId', async () => {
    const adapter = new LocalOllamaProviderAdapter({
      fetchImpl: async () => new Response('{"message":{"content":"ok"}}', { status: 200 }),
    });
    const input = request(adapter);
    await expect(
      adapter.start({
        ...input,
        requestedAction: 'shell.exec',
        authority: { ...input.authority, allowedActions: ['shell.exec'] },
      }),
    ).rejects.toThrow(/read-only/u);
    await expect(adapter.start({ ...input, prompt: '' })).rejects.toThrow(/prompt/u);
    await expect(adapter.start({ ...input, metadata: { model: 'evil:cloud' } })).rejects.toThrow(
      /allowlisted/u,
    );
    const handle = await adapter.start(input);
    await untilFinished(adapter, handle);
    await expect(adapter.start({ ...input, prompt: 'outra pergunta' })).rejects.toThrow(
      /Idempotency conflict/u,
    );
  });

  it('preserves mission and run isolation for receipts', async () => {
    const adapter = new LocalOllamaProviderAdapter({
      fetchImpl: async () => new Response('{"message":{"content":"ok"}}', { status: 200 }),
    });
    const handle = await adapter.start(request(adapter));
    await untilFinished(adapter, handle);
    await expect(adapter.collectEvidence({ ...handle, runId: 'other-run' })).rejects.toThrow(
      /mismatched/u,
    );
    await expect(adapter.status({ ...handle, missionId: 'other-mission' })).rejects.toThrow(
      /mismatched/u,
    );
  });

  it('fails closed on an invalid Ollama response', async () => {
    const adapter = new LocalOllamaProviderAdapter({
      fetchImpl: async () => new Response('{"oops":"no text"}', { status: 200 }),
    });
    const handle = await adapter.start(request(adapter));
    const status = await untilFinished(adapter, handle);
    expect(status.lifecycle).toBe('FAILED');
    expect(await adapter.collectEvidence(handle)).toHaveLength(0);
  });

  it('can cancel a pending inference without running OS tools', async () => {
    const adapter = new LocalOllamaProviderAdapter({
      fetchImpl: async (_url, options) =>
        new Promise((_resolve, reject) =>
          options?.signal?.addEventListener('abort', () => reject(new Error('aborted'))),
        ),
    });
    const handle = await adapter.start(request(adapter));
    const cancellation = await adapter.cancel(handle);
    expect(cancellation.lifecycle).toBe('CANCEL_REQUESTED');
    const status = await untilFinished(adapter, handle);
    expect(status.lifecycle).toBe('FAILED');
    expect(status.effectState).toBe('NONE_OBSERVED');
  });
});
