import { createHash } from 'node:crypto';

import type {
  ModelExecutionFailureCode,
  ModelExecutionProvider,
  ModelExecutionReceipt,
  ModelExecutionRequest,
  ModelToolIntent,
} from './model-execution.contracts.js';

export interface GeminiClientResponse {
  text?: string;
  functionCalls?: Array<{ name?: string; args?: Record<string, unknown> }>;
  candidates?: Array<{ finishReason?: string }>;
  promptFeedback?: { blockReason?: string };
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
  modelVersion?: string;
}

export interface GeminiClient {
  generateContent(request: {
    model: string;
    contents: unknown;
    disableAutomaticFunctionCalling: true;
  }): Promise<GeminiClientResponse>;
}

export interface GeminiModelProviderConfig {
  enabled: boolean;
  modelAllowlist: readonly string[];
  paidFallbackAllowed: boolean;
}

function stableValue(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return '[Circular]';
  seen.add(value);
  if (Array.isArray(value)) return value.map((entry) => stableValue(entry, seen));
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, stableValue(entry, seen)]),
  );
}

function sha256(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(stableValue(value))).digest('hex');
}

function toolIntentsFrom(response: GeminiClientResponse): ModelToolIntent[] {
  return (response.functionCalls ?? [])
    .filter(
      (call): call is { name: string; args?: Record<string, unknown> } =>
        typeof call.name === 'string' && call.name.length > 0,
    )
    .map((call) => ({ name: call.name, arguments: call.args ?? {} }));
}

function usageFrom(response: GeminiClientResponse): Record<string, number> | undefined {
  const usage = response.usageMetadata;
  if (!usage) return undefined;
  const normalized: Record<string, number> = {};
  if (typeof usage.promptTokenCount === 'number') normalized.promptTokens = usage.promptTokenCount;
  if (typeof usage.candidatesTokenCount === 'number') {
    normalized.outputTokens = usage.candidatesTokenCount;
  }
  if (typeof usage.totalTokenCount === 'number') normalized.totalTokens = usage.totalTokenCount;
  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function statusFrom(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const candidate = error as { status?: unknown; code?: unknown };
  if (typeof candidate.status === 'number') return candidate.status;
  return typeof candidate.code === 'number' ? candidate.code : undefined;
}

function mapFailure(error: unknown): ModelExecutionFailureCode {
  const status = statusFrom(error);
  if (status === 401 || status === 403) return 'AUTHENTICATION_REQUIRED';
  if (status === 429) return 'RATE_LIMITED';
  if (typeof status === 'number' && status >= 500) return 'NETWORK_FAILURE';

  if (error && typeof error === 'object') {
    const candidate = error as { name?: unknown; code?: unknown; message?: unknown };
    if (candidate.name === 'AbortError') return 'MODEL_TIMEOUT';
    if (
      typeof candidate.message === 'string' &&
      /timeout|timed out|deadline/iu.test(candidate.message)
    ) {
      return 'MODEL_TIMEOUT';
    }
    if (
      typeof candidate.code === 'string' &&
      ['ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN'].includes(candidate.code)
    ) {
      return 'NETWORK_FAILURE';
    }
  }
  return 'INVALID_RESPONSE';
}

export class GeminiModelProvider implements ModelExecutionProvider {
  readonly providerId = 'google-gemini';

  constructor(
    private readonly client: GeminiClient,
    private readonly config: GeminiModelProviderConfig,
  ) {}

  supports(request: ModelExecutionRequest): boolean {
    return request.provider === 'google' && request.operation === 'generate';
  }

  async execute(request: ModelExecutionRequest): Promise<ModelExecutionReceipt> {
    const startedAt = new Date().toISOString();
    const inputDigest = sha256(request.input);
    const bindings = {
      ...(request.missionId !== undefined ? { missionId: request.missionId } : {}),
      ...(request.phaseId !== undefined ? { phaseId: request.phaseId } : {}),
      ...(request.agentId !== undefined ? { agentId: request.agentId } : {}),
    };
    const base = {
      provider: request.provider,
      model: request.model,
      operation: request.operation,
      executor: request.executor,
      ...bindings,
      startedAt,
      inputDigest,
      toolIntents: [] as ModelToolIntent[],
    };

    const failed = (failureCode: ModelExecutionFailureCode): ModelExecutionReceipt => ({
      ...base,
      completedAt: new Date().toISOString(),
      finishReason: failureCode,
      validationVerdict: 'FAILED',
      failureCode,
    });

    if (!this.config.enabled || this.config.paidFallbackAllowed) return failed('PROVIDER_DISABLED');
    if (!this.config.modelAllowlist.includes(request.model)) return failed('MODEL_NOT_ALLOWED');

    try {
      const response = await this.client.generateContent({
        model: request.model,
        contents: request.input,
        disableAutomaticFunctionCalling: true,
      });
      const toolIntents = toolIntentsFrom(response);
      const blockReason = response.promptFeedback?.blockReason;
      const outputEvidence = { text: response.text ?? null, toolIntents };
      const usage = usageFrom(response);

      if (blockReason) {
        return {
          ...base,
          completedAt: new Date().toISOString(),
          outputDigest: sha256(outputEvidence),
          finishReason: blockReason,
          toolIntents,
          validationVerdict: 'BLOCKED',
          failureCode: 'MODEL_BLOCKED',
          ...(usage !== undefined ? { usage } : {}),
        };
      }

      if (typeof response.text !== 'string' && toolIntents.length === 0) {
        return failed('INVALID_RESPONSE');
      }

      return {
        ...base,
        completedAt: new Date().toISOString(),
        outputDigest: sha256(outputEvidence),
        finishReason:
          response.candidates?.[0]?.finishReason ?? (toolIntents.length ? 'TOOL_INTENT' : 'STOP'),
        toolIntents,
        validationVerdict: 'PASS',
        ...(usage !== undefined ? { usage } : {}),
      };
    } catch (error) {
      return failed(mapFailure(error));
    }
  }
}
