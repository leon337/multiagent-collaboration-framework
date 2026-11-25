/**
 * MCF #496: opt-in, fail-closed 9Router inference transport.
 *
 * This is NOT an AgentExecutionProviderAdapter and does not bypass the
 * MissionRuntime authorization/HDF/ExecutionBinding boundary.
 * It may only be called after those checks in a future governed binding.
 *
 * Local interface deliberately restricted to the SSH-tunneled endpoint.
 * No paid/free inference is inferred from a model name alone.
 */
export type NineRouterRole = 'system' | 'developer' | 'user' | 'assistant';

export interface NineRouterMessage {
  role: NineRouterRole;
  content: string;
}

export interface NineRouterGatewayConfig {
  enabled: boolean;
  baseUrl: string;
  apiKey?: string;
  verifiedFreeModels: readonly string[];
  timeoutMs?: number;
  maxRequestCharacters?: number;
  fetchImpl?: typeof fetch;
}

export interface NineRouterInference {
  agentId: string;
  missionId: string;
  requestId: string;
  model: string;
  messages: readonly NineRouterMessage[];
  maxOutputTokens?: number;
}

export interface NineRouterTelemetry {
  readonly boundary: 'EXPERIMENTAL_UNATTESTED_9ROUTER_TRANSPORT';
  readonly requestId: string;
  readonly missionId: string;
  readonly agentId: string;
  readonly requestedModel: string;
  readonly reportedModel: string;
  readonly latencyMs: number;
  readonly inputTokens: number | null;
  readonly outputTokens: number | null;
  readonly outcome: 'TRANSPORT_OK';
}

export interface NineRouterResult {
  content: string;
  telemetry: NineRouterTelemetry;
}

export type NineRouterErrorCode =
  | 'DISABLED'
  | 'INVALID_CONFIGURATION'
  | 'MODEL_NOT_VERIFIED'
  | 'INVALID_REQUEST'
  | 'TIMEOUT'
  | 'UPSTREAM_UNAVAILABLE'
  | 'UPSTREAM_REJECTED'
  | 'INVALID_UPSTREAM_RESPONSE';

export class NineRouterGatewayError extends Error {
  readonly code: NineRouterErrorCode;
  constructor(code: NineRouterErrorCode) {
    super(code);
    this.code = code; // Never copy upstream bodies, API keys or prompt content into errors.
    this.name = 'NineRouterGatewayError';
  }
}

function requireSafeLoopbackGateway(raw: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new NineRouterGatewayError('INVALID_CONFIGURATION');
  }
  // Only the *local SSH tunnel*. Do not silently fall back to a public URL.
  if (
    parsed.protocol !== 'http:' ||
    parsed.hostname !== '127.0.0.1' ||
    parsed.port !== '20129' ||
    parsed.pathname !== '/v1' ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash
  ) {
    throw new NineRouterGatewayError('INVALID_CONFIGURATION');
  }
  return parsed;
}

function isSafeIdentifier(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9_.:/-]{0,127}$/.test(value);
}

function checkMessages(messages: readonly NineRouterMessage[], maxCharacters: number): void {
  if (!Array.isArray(messages) || messages.length < 1 || messages.length > 32) {
    throw new NineRouterGatewayError('INVALID_REQUEST');
  }
  let totalCharacters = 0;
  for (const message of messages) {
    if (
      !message ||
      !['system', 'developer', 'user', 'assistant'].includes(message.role) ||
      typeof message.content !== 'string' ||
      !message.content.trim()
    ) {
      throw new NineRouterGatewayError('INVALID_REQUEST');
    }
    totalCharacters += message.content.length;
  }
  if (totalCharacters > maxCharacters) {
    throw new NineRouterGatewayError('INVALID_REQUEST');
  }
}

export class NineRouterModelGateway {
  private readonly endpoint: URL;
  private readonly freeModels: ReadonlySet<string>;
  private readonly timeoutMs: number;
  private readonly maxRequestCharacters: number;
  private readonly http: typeof fetch;
  private readonly config: NineRouterGatewayConfig;

  constructor(config: NineRouterGatewayConfig) {
    this.config = config;
    this.endpoint = requireSafeLoopbackGateway(config.baseUrl);
    this.freeModels = new Set(config.verifiedFreeModels);
    this.timeoutMs = config.timeoutMs ?? 12000;
    this.maxRequestCharacters = config.maxRequestCharacters ?? 32000;
    this.http = config.fetchImpl ?? fetch;
    if (
      !Number.isInteger(this.timeoutMs) ||
      this.timeoutMs < 1000 ||
      this.timeoutMs > 60000 ||
      !Number.isInteger(this.maxRequestCharacters) ||
      this.maxRequestCharacters < 128 ||
      this.maxRequestCharacters > 64000 ||
      config.verifiedFreeModels.some((model) => !isSafeIdentifier(model))
    ) {
      throw new NineRouterGatewayError('INVALID_CONFIGURATION');
    }
  }

  async infer(input: NineRouterInference): Promise<NineRouterResult> {
    if (!this.config.enabled) throw new NineRouterGatewayError('DISABLED');
    if (!this.config.apiKey?.trim()) {
      throw new NineRouterGatewayError('INVALID_CONFIGURATION');
    }
    if (
      !isSafeIdentifier(input.agentId) ||
      !isSafeIdentifier(input.missionId) ||
      !isSafeIdentifier(input.requestId) ||
      !isSafeIdentifier(input.model)
    ) {
      throw new NineRouterGatewayError('INVALID_REQUEST');
    }
    if (!this.freeModels.has(input.model)) {
      throw new NineRouterGatewayError('MODEL_NOT_VERIFIED');
    }
    checkMessages(input.messages, this.maxRequestCharacters);
    const maxTokens = input.maxOutputTokens ?? 512;
    if (!Number.isInteger(maxTokens) || maxTokens < 1 || maxTokens > 1024) {
      throw new NineRouterGatewayError('INVALID_REQUEST');
    }
    const startedAt = Date.now();
    let response: Response;
    try {
      response = await this.http(new URL('/v1/chat/completions', this.endpoint), {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${this.config.apiKey}`,
          'x-mcf-request-id': input.requestId,
        },
        body: JSON.stringify({
          model: input.model,
          messages: input.messages,
          max_tokens: maxTokens,
          stream: false,
        }),
        signal: AbortSignal.timeout(this.timeoutMs),
        redirect: 'error',
        cache: 'no-store',
      });
    } catch (error) {
      const err = error as Error;
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        throw new NineRouterGatewayError('TIMEOUT');
      }
      throw new NineRouterGatewayError('UPSTREAM_UNAVAILABLE');
    }

    if (response.status === 401 || response.status === 403) {
      throw new NineRouterGatewayError('UPSTREAM_REJECTED');
    }
    if (!response.ok) {
      throw new NineRouterGatewayError('UPSTREAM_UNAVAILABLE');
    }
    if (Number(response.headers.get('content-length') ?? 0) > 1024 * 1024) {
      throw new NineRouterGatewayError('INVALID_UPSTREAM_RESPONSE');
    }
    let result: unknown;
    try {
      const text = await response.text();
      if (text.length > 1024 * 1024) throw Error('too_large');
      result = JSON.parse(text);
    } catch {
      throw new NineRouterGatewayError('INVALID_UPSTREAM_RESPONSE');
    }
    const payload = result as {
      choices?: Array<{ message?: { content?: unknown } }>;
      model?: unknown;
      usage?: { prompt_tokens?: unknown; completion_tokens?: unknown };
    } | null;
    const content = payload?.choices?.[0]?.message?.content;
    const reportedModel = payload?.model;
    if (
      typeof content !== 'string' ||
      typeof reportedModel !== 'string' ||
      !this.freeModels.has(reportedModel)
    ) {
      // Catch an unexpected model fallback/rewrite before crediting output.
      throw new NineRouterGatewayError('INVALID_UPSTREAM_RESPONSE');
    }
    const tokens = (v: unknown): number | null =>
      typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null;
    return {
      content,
      telemetry: {
        boundary: 'EXPERIMENTAL_UNATTESTED_9ROUTER_TRANSPORT',
        requestId: input.requestId,
        missionId: input.missionId,
        agentId: input.agentId,
        requestedModel: input.model,
        reportedModel,
        latencyMs: Math.max(0, Date.now() - startedAt),
        inputTokens: tokens(payload?.usage?.prompt_tokens),
        outputTokens: tokens(payload?.usage?.completion_tokens),
        outcome: 'TRANSPORT_OK',
      },
    };
  }
}
