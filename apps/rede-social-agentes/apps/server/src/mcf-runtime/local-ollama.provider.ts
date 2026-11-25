import { createHash, randomUUID } from 'node:crypto';
import {
  assertAuthorityEnvelope,
  assertRequestedCapabilities,
  type AgentExecutionEvidence,
  type AgentExecutionHandle,
  type AgentExecutionLifecycle,
  type AgentExecutionProviderAdapter,
  type AgentExecutionRequest,
  type AgentExecutionStatus,
  type ExecutionProviderContract,
} from './agent-execution.contracts.js';

const MODEL = 'qwen3.5:4b';
const PROVIDER_ID = 'mcf-ollama-qwen35-local';
const ENDPOINT = 'http://127.0.0.1:11434/api/chat';
const MAX_PROMPT_LENGTH = 8000;
const MAX_OUTPUT_LENGTH = 16000;
const MAX_HISTORY = 128;
type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

interface LocalRun {
  handle: AgentExecutionHandle;
  lifecycle: AgentExecutionLifecycle;
  controller: AbortController;
  evidence: readonly AgentExecutionEvidence[];
  detail: string;
  promptDigest: string;
}

/** Local, text-only inference; no tools, workspace access, network targeting or side effects. */
export class LocalOllamaProviderAdapter implements AgentExecutionProviderAdapter {
  readonly provider: ExecutionProviderContract = {
    providerId: PROVIDER_ID,
    mode: 'LOCAL_SELF_HOSTED',
    version: '1.0.0',
    capabilities: ['TRACE_EXPORT'],
  };
  private readonly runs = new Map<string, LocalRun>();
  private readonly fetchImpl: FetchLike;
  private readonly timeoutMs: number;

  constructor(options: { timeoutMs?: number; fetchImpl?: FetchLike } = {}) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 120_000;
  }

  async start(request: AgentExecutionRequest): Promise<AgentExecutionHandle> {
    assertAuthorityEnvelope(request);
    assertRequestedCapabilities(request);
    if (
      request.provider.providerId !== PROVIDER_ID ||
      request.provider.mode !== 'LOCAL_SELF_HOSTED'
    ) {
      throw new Error('Local Ollama execution provider mismatch');
    }
    if (request.requestedAction !== 'llm.generate') {
      throw new Error('Local Ollama only supports read-only llm.generate');
    }
    if (
      typeof request.prompt !== 'string' ||
      request.prompt.trim().length === 0 ||
      request.prompt.length > MAX_PROMPT_LENGTH
    ) {
      throw new Error('Local Ollama prompt must contain 1..8000 characters');
    }
    if (request.metadata?.model !== undefined && request.metadata.model !== MODEL) {
      throw new Error('Local Ollama model is allowlisted to qwen3.5:4b');
    }
    const promptDigest = createHash('sha256').update(request.prompt).digest('hex');
    const existing = [...this.runs.values()].find(
      (run) => run.handle.missionId === request.missionId && run.handle.runId === request.runId,
    );
    if (existing) {
      if (existing.promptDigest !== promptDigest)
        throw new Error('Idempotency conflict: runId reused with another prompt');
      return existing.handle;
    }
    if ([...this.runs.values()].some((run) => run.lifecycle === 'RUNNING')) {
      throw new Error('Local Ollama permits one concurrent inference');
    }
    for (const [key, value] of this.runs) {
      if (this.runs.size < MAX_HISTORY) break;
      if (value.lifecycle !== 'RUNNING') this.runs.delete(key);
    }
    if (this.runs.size >= MAX_HISTORY) throw new Error('Local Ollama run history capacity reached');
    const handle = {
      missionId: request.missionId,
      runId: request.runId,
      providerId: PROVIDER_ID,
      providerExecutionId: randomUUID(),
    };
    const run: LocalRun = {
      handle,
      lifecycle: 'RUNNING',
      controller: new AbortController(),
      evidence: [],
      detail: 'Local text inference running',
      promptDigest,
    };
    this.runs.set(handle.providerExecutionId, run);
    void this.generate(run, request.prompt);
    return handle;
  }

  private async generate(run: LocalRun, prompt: string): Promise<void> {
    const timer = setTimeout(() => run.controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: 'user', content: prompt }],
          stream: false,
          think: false,
          options: { num_ctx: 4096, num_predict: 384 },
        }),
        signal: run.controller.signal,
      });
      if (!response.ok) throw new Error(`Ollama returned HTTP ${response.status}`);
      const payload: { message?: { content?: unknown } } = await response.json();
      if (run.controller.signal.aborted) throw new Error('Inference was cancelled');
      if (
        !payload ||
        typeof payload.message?.content !== 'string' ||
        payload.message.content.length > MAX_OUTPUT_LENGTH ||
        !payload.message.content.trim()
      ) {
        throw new Error('Invalid or empty Ollama response');
      }
      const output = payload.message.content;
      const digest = createHash('sha256').update(output).digest('hex');
      run.evidence = [
        {
          evidenceId: randomUUID(),
          providerId: PROVIDER_ID,
          providerExecutionId: run.handle.providerExecutionId,
          kind: 'RECEIPT',
          sourceRef: 'local://ollama/qwen3.5:4b/generate',
          observedAt: new Date().toISOString(),
          digest,
          metadata: { model: MODEL, output, outputLength: output.length },
        },
      ];
      run.lifecycle = 'COMPLETED';
      run.detail = 'Inference completed with output digest and receipt';
    } catch (error) {
      run.lifecycle = 'FAILED';
      run.detail = run.controller.signal.aborted
        ? 'Inference aborted or timed out'
        : error instanceof Error
          ? error.message
          : 'Inference failed';
    } finally {
      clearTimeout(timer);
    }
  }

  private lookup(handle: AgentExecutionHandle): LocalRun {
    const run = this.runs.get(handle.providerExecutionId);
    if (
      !run ||
      run.handle.missionId !== handle.missionId ||
      run.handle.runId !== handle.runId ||
      handle.providerId !== PROVIDER_ID
    ) {
      throw new Error('Unknown or mismatched local Ollama run');
    }
    return run;
  }

  async status(handle: AgentExecutionHandle): Promise<AgentExecutionStatus> {
    const run = this.lookup(handle);
    return {
      handle,
      lifecycle: run.lifecycle,
      observedAt: new Date().toISOString(),
      providerState: run.lifecycle,
      effectState: 'NONE_OBSERVED',
      detail: run.detail,
    };
  }

  async resume(handle: AgentExecutionHandle): Promise<AgentExecutionStatus> {
    // Not resumable: never replay an inference after restart or a lost receipt.
    return this.status(handle);
  }

  async interrupt(handle: AgentExecutionHandle): Promise<AgentExecutionStatus> {
    return this.cancel(handle);
  }

  async cancel(handle: AgentExecutionHandle): Promise<AgentExecutionStatus> {
    const run = this.lookup(handle);
    if (run.lifecycle === 'RUNNING') {
      run.lifecycle = 'CANCEL_REQUESTED';
      run.controller.abort();
    }
    return this.status(handle);
  }

  async collectEvidence(handle: AgentExecutionHandle): Promise<readonly AgentExecutionEvidence[]> {
    return this.lookup(handle).evidence;
  }
}
