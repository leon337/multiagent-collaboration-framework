import { Buffer } from 'node:buffer';

import { Injectable } from '@nestjs/common';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { FetchLike, Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { z } from 'zod';

import { loadMcfLedgerReadIngressToken } from './mcf-ledger-read-token.guard.js';

export const MCF_LEDGER_PROVIDER_TOOL_NAMES = [
  'ler_diario',
  'buscar_eventos',
  'recuperar_contexto',
  'ler_fonte_bruta',
] as const;
export const MCF_LEDGER_QUERY_TOOL_NAMES = [
  'ler_diario',
  'buscar_eventos',
  'recuperar_contexto',
] as const;

export type McfLedgerProviderToolName = (typeof MCF_LEDGER_PROVIDER_TOOL_NAMES)[number];
export type McfLedgerToolName = (typeof MCF_LEDGER_QUERY_TOOL_NAMES)[number];

const boundedText = (maximum: number) =>
  z
    .string()
    .min(1)
    .max(maximum)
    .refine((value) => value === value.trim());
const dateTime = z.string().datetime({ offset: true });
const filters = {
  projeto: boundedText(256).optional(),
  assuntos: z.array(boundedText(256)).max(32).optional(),
  tipos: z.array(boundedText(256)).max(32).optional(),
  limite: z.number().int().min(1).max(12).optional(),
  inicio: dateTime.optional(),
  fim: dateTime.optional(),
};

const ledgerQuerySchema = z.discriminatedUnion('operation', [
  z
    .object({
      operation: z.literal('ler_diario'),
      input: z.object(filters).strict(),
    })
    .strict(),
  z
    .object({
      operation: z.literal('buscar_eventos'),
      input: z.object({ texto: boundedText(4096), ...filters }).strict(),
    })
    .strict(),
  z
    .object({
      operation: z.literal('recuperar_contexto'),
      input: z.object({ objetivo: boundedText(4096), ...filters }).strict(),
    })
    .strict(),
]);

const outputText = (maximum = 32_768) => z.string().max(maximum);
const nonEmptyOutputText = (maximum = 32_768) => z.string().min(1).max(maximum);
const outputTextArray = z.array(outputText(4_096)).max(128);
const eventSchema = z
  .object({
    id: nonEmptyOutputText(256),
    timestamp: dateTime,
    tipo: nonEmptyOutputText(256),
    status: nonEmptyOutputText(256),
    titulo: outputText(),
    resumo: outputText(),
    contexto: outputText(),
    projetos: outputTextArray,
    assuntos: outputTextArray,
    ideias: outputTextArray,
    decisoes: outputTextArray,
    hipoteses: outputTextArray,
    questoes_abertas: outputTextArray,
    proximos_passos: outputTextArray,
  })
  .strict();
const eventsSchema = z.array(eventSchema).max(12);
const gapsSchema = z.array(nonEmptyOutputText(1_024)).max(64);
const stateSchema = z.enum(['ok', 'evidencia_insuficiente']);
const diaryResultSchema = z
  .object({
    estado: stateSchema,
    degradado: z.literal(false),
    eventos: eventsSchema,
    lacunas: gapsSchema,
  })
  .strict();
const searchResultSchema = z
  .object({
    estado: stateSchema,
    degradado: z.boolean(),
    eventos: eventsSchema,
    lacunas: gapsSchema,
    ranking: z
      .array(
        z
          .object({
            evento_id: nonEmptyOutputText(256),
            score_total: z.number().finite(),
            score_textual: z.number().finite(),
            score_semantico: z.number().finite(),
            score_recencia: z.number().finite(),
          })
          .strict(),
      )
      .max(12),
  })
  .strict();
const contextResultSchema = z
  .object({
    estado: z.enum(['ok', 'conflito_de_contexto', 'evidencia_insuficiente']),
    degradado: z.boolean(),
    eventos: eventsSchema,
    decisoes: outputTextArray,
    hipoteses: outputTextArray,
    questoes_abertas: outputTextArray,
    proximos_passos: outputTextArray,
    lacunas: gapsSchema,
    conflitos: z
      .array(
        z
          .object({
            origem: nonEmptyOutputText(256),
            destino: nonEmptyOutputText(256),
            tipo: z.enum(['contradiz', 'revisa', 'substitui']),
          })
          .strict(),
      )
      .max(128),
  })
  .strict();
const resultSchemas = {
  ler_diario: diaryResultSchema,
  buscar_eventos: searchResultSchema,
  recuperar_contexto: contextResultSchema,
} satisfies Record<McfLedgerToolName, z.ZodType>;

export type McfLedgerReadQuery = z.infer<typeof ledgerQuerySchema>;

export interface McfLedgerReadResponse {
  schema_version: 1;
  provider_project_id: 'cognitive-ledger';
  operation: McfLedgerToolName;
  read_only: true;
  memory_payload_persisted_by_mcf: false;
  result: Record<string, unknown>;
}

export interface McfLedgerReadConfiguration {
  endpoint: URL;
  bearerToken: string;
  timeoutMs: number;
  inputLimitBytes: number;
  responseLimitBytes: number;
  maxConcurrentQueries: number;
}

interface McpToolDescriptor {
  name: string;
  annotations?: {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
  };
}

interface McpToolResult {
  isError?: boolean;
  structuredContent?: Record<string, unknown>;
}

export interface McfLedgerMcpClient {
  connect(): Promise<void>;
  listTools(): Promise<{ tools: McpToolDescriptor[] }>;
  callTool(request: {
    name: McfLedgerToolName;
    arguments: Record<string, unknown>;
  }): Promise<McpToolResult>;
  close(): Promise<void>;
}

export type McfLedgerMcpClientFactory = (
  configuration: McfLedgerReadConfiguration,
  deadlineSignal: AbortSignal,
) => McfLedgerMcpClient;

export class McfLedgerQueryInvalidError extends Error {
  constructor() {
    super('The Cognitive Ledger read query is invalid.');
    this.name = 'McfLedgerQueryInvalidError';
  }
}

export class McfLedgerReadUnavailableError extends Error {
  constructor() {
    super('The Cognitive Ledger read-only provider is unavailable or failed closed.');
    this.name = 'McfLedgerReadUnavailableError';
  }
}

function parseBoundedInteger(
  value: string | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
): number | null {
  if (value === undefined) return fallback;
  if (!/^\d+$/u.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= minimum && parsed <= maximum ? parsed : null;
}

function isLoopbackHostname(hostname: string): boolean {
  return hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '::1';
}

function parseStrictEndpoint(value: string, nodeEnvironment: string | undefined): URL | null {
  let endpoint: URL;
  try {
    endpoint = new URL(value);
  } catch {
    return null;
  }

  if (
    endpoint.username !== '' ||
    endpoint.password !== '' ||
    endpoint.search !== '' ||
    endpoint.hash !== '' ||
    endpoint.pathname !== '/mcp'
  ) {
    return null;
  }
  if (endpoint.protocol === 'https:') return endpoint;
  if (
    endpoint.protocol === 'http:' &&
    (nodeEnvironment === 'development' || nodeEnvironment === 'test') &&
    isLoopbackHostname(endpoint.hostname)
  ) {
    return endpoint;
  }
  return null;
}

export function loadMcfLedgerReadConfiguration(
  env: NodeJS.ProcessEnv,
): McfLedgerReadConfiguration | null {
  const endpointValue = env.MCF_COGNITIVE_LEDGER_MCP_URL;
  const bearerToken = env.MCF_COGNITIVE_LEDGER_BEARER_TOKEN;
  const ingressToken = loadMcfLedgerReadIngressToken(env);
  if (!endpointValue || !bearerToken || !ingressToken) return null;
  const peerCredentials = [
    ingressToken,
    bearerToken,
    env.MCF_CONTEXT_READ_TOKEN,
    env.MCF_CLOUD_CONTEXT_INGRESS_TOKEN,
  ].filter((value): value is string => value !== undefined && value.length > 0);
  if (
    bearerToken.length < 32 ||
    bearerToken.length > 8192 ||
    bearerToken !== bearerToken.trim() ||
    !/^[A-Za-z0-9._~+/-]+={0,}$/u.test(bearerToken) ||
    new Set(peerCredentials).size !== peerCredentials.length
  ) {
    return null;
  }
  const endpoint = parseStrictEndpoint(endpointValue, env.NODE_ENV);
  const timeoutMs = parseBoundedInteger(env.MCF_COGNITIVE_LEDGER_TIMEOUT_MS, 5_000, 250, 15_000);
  const inputLimitBytes = parseBoundedInteger(
    env.MCF_COGNITIVE_LEDGER_INPUT_LIMIT_BYTES,
    32_768,
    1_024,
    32_768,
  );
  const responseLimitBytes = parseBoundedInteger(
    env.MCF_COGNITIVE_LEDGER_RESPONSE_LIMIT_BYTES,
    262_144,
    4_096,
    1_048_576,
  );
  const maxConcurrentQueries = parseBoundedInteger(
    env.MCF_COGNITIVE_LEDGER_MAX_CONCURRENT_QUERIES,
    4,
    1,
    16,
  );
  if (
    !endpoint ||
    timeoutMs === null ||
    inputLimitBytes === null ||
    responseLimitBytes === null ||
    maxConcurrentQueries === null
  ) {
    return null;
  }
  return {
    endpoint,
    bearerToken,
    timeoutMs,
    inputLimitBytes,
    responseLimitBytes,
    maxConcurrentQueries,
  };
}

async function readBodyBounded(response: Response, maximumBytes: number): Promise<Uint8Array> {
  const declaredLength = response.headers.get('content-length');
  if (declaredLength !== null && Number(declaredLength) > maximumBytes) {
    await response.body?.cancel().catch(() => undefined);
    throw new McfLedgerReadUnavailableError();
  }
  if (response.body === null) return new Uint8Array();

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maximumBytes) {
      await reader.cancel().catch(() => undefined);
      throw new McfLedgerReadUnavailableError();
    }
    chunks.push(value);
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

export function createBoundedMcpFetch(
  configuration: McfLedgerReadConfiguration,
  baseFetch: FetchLike = fetch,
  aggregateSignal?: AbortSignal,
): FetchLike {
  return async (url, init = {}) => {
    const requestedUrl = new URL(url);
    if (requestedUrl.href !== configuration.endpoint.href || init.method !== 'POST') {
      throw new McfLedgerReadUnavailableError();
    }
    if (typeof init.body !== 'string') throw new McfLedgerReadUnavailableError();
    const outboundBytes = Buffer.byteLength(init.body, 'utf8');
    if (outboundBytes > configuration.inputLimitBytes + 16_384) {
      throw new McfLedgerReadUnavailableError();
    }

    const controller = new AbortController();
    const abortFromCaller = () => controller.abort();
    const abortFromAggregate = () => controller.abort();
    init.signal?.addEventListener('abort', abortFromCaller, { once: true });
    aggregateSignal?.addEventListener('abort', abortFromAggregate, { once: true });
    if (init.signal?.aborted === true || aggregateSignal?.aborted === true) controller.abort();
    const timer = setTimeout(() => controller.abort(), configuration.timeoutMs);
    try {
      const response = await baseFetch(url, {
        ...init,
        redirect: 'error',
        signal: controller.signal,
      });
      const body = await readBodyBounded(response, configuration.responseLimitBytes);
      const headers = new Headers(response.headers);
      headers.delete('content-length');
      const responseBody = new ArrayBuffer(body.byteLength);
      new Uint8Array(responseBody).set(body);
      return new Response(responseBody, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch {
      throw new McfLedgerReadUnavailableError();
    } finally {
      clearTimeout(timer);
      init.signal?.removeEventListener('abort', abortFromCaller);
      aggregateSignal?.removeEventListener('abort', abortFromAggregate);
    }
  };
}

function officialClientFactory(
  configuration: McfLedgerReadConfiguration,
  deadlineSignal: AbortSignal,
): McfLedgerMcpClient {
  const transport = new StreamableHTTPClientTransport(configuration.endpoint, {
    requestInit: {
      headers: { Authorization: `Bearer ${configuration.bearerToken}` },
    },
    fetch: createBoundedMcpFetch(configuration, fetch, deadlineSignal),
    reconnectionOptions: {
      maxReconnectionDelay: configuration.timeoutMs,
      initialReconnectionDelay: 250,
      reconnectionDelayGrowFactor: 1,
      maxRetries: 0,
    },
  });
  const client = new Client({ name: 'mcf-cognitive-ledger-read-adapter', version: '0.1.0' });
  return {
    // SDK 1.30.0 declares `sessionId?: string` without exact-optional compatibility;
    // the concrete transport implements the runtime Transport contract.
    connect: () => client.connect(transport as Transport),
    listTools: () => client.listTools() as Promise<{ tools: McpToolDescriptor[] }>,
    callTool: (request) => client.callTool(request) as Promise<McpToolResult>,
    close: () => client.close(),
  };
}

function hasExactReadOnlyContract(tools: readonly McpToolDescriptor[]): boolean {
  if (tools.length !== MCF_LEDGER_PROVIDER_TOOL_NAMES.length) return false;
  const expected = new Set<string>(MCF_LEDGER_PROVIDER_TOOL_NAMES);
  const observed = new Set(tools.map(({ name }) => name));
  if (observed.size !== expected.size || [...expected].some((name) => !observed.has(name))) {
    return false;
  }
  return tools.every(
    ({ annotations }) =>
      annotations?.readOnlyHint === true &&
      annotations.destructiveHint === false &&
      annotations.idempotentHint === true &&
      annotations.openWorldHint === false,
  );
}

function withAbortDeadline<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(new McfLedgerReadUnavailableError());
  return new Promise<T>((resolve, reject) => {
    const abort = () => reject(new McfLedgerReadUnavailableError());
    signal.addEventListener('abort', abort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener('abort', abort);
        resolve(value);
      },
      (error: unknown) => {
        signal.removeEventListener('abort', abort);
        reject(error);
      },
    );
  });
}

async function closeWithin(client: McfLedgerMcpClient, maximumMs: number): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  await Promise.race([
    Promise.resolve()
      .then(() => client.close())
      .catch(() => undefined),
    new Promise<void>((resolve) => {
      timer = setTimeout(resolve, maximumMs);
    }),
  ]);
  if (timer !== undefined) clearTimeout(timer);
}

function parseStructuredResult(
  operation: McfLedgerToolName,
  value: unknown,
): Record<string, unknown> | null {
  const parsed = resultSchemas[operation].safeParse(value);
  return parsed.success ? (parsed.data as Record<string, unknown>) : null;
}

@Injectable()
export class McfLedgerReadApiService {
  private activeQueries = 0;

  constructor(
    private readonly configuration: McfLedgerReadConfiguration | null,
    private readonly clientFactory: McfLedgerMcpClientFactory = officialClientFactory,
  ) {}

  static fromEnvironment(env: NodeJS.ProcessEnv = process.env): McfLedgerReadApiService {
    return new McfLedgerReadApiService(loadMcfLedgerReadConfiguration(env));
  }

  async queryReadOnly(value: unknown): Promise<McfLedgerReadResponse> {
    if (this.configuration === null) throw new McfLedgerReadUnavailableError();

    let serializedInput: string;
    try {
      const serialized = JSON.stringify(value);
      if (serialized === undefined) throw new McfLedgerQueryInvalidError();
      serializedInput = serialized;
    } catch {
      throw new McfLedgerQueryInvalidError();
    }
    if (Buffer.byteLength(serializedInput, 'utf8') > this.configuration.inputLimitBytes) {
      throw new McfLedgerQueryInvalidError();
    }
    const parsed = ledgerQuerySchema.safeParse(value);
    if (!parsed.success) throw new McfLedgerQueryInvalidError();
    if (this.activeQueries >= this.configuration.maxConcurrentQueries) {
      throw new McfLedgerReadUnavailableError();
    }
    this.activeQueries += 1;

    const deadline = new AbortController();
    const deadlineTimer = setTimeout(() => deadline.abort(), this.configuration.timeoutMs);
    let client: McfLedgerMcpClient | undefined;
    try {
      client = this.clientFactory(this.configuration, deadline.signal);
      await withAbortDeadline(
        Promise.resolve().then(() => client?.connect()),
        deadline.signal,
      );
      const listed = await withAbortDeadline(
        Promise.resolve().then(() => client?.listTools()),
        deadline.signal,
      );
      if (listed === undefined) throw new McfLedgerReadUnavailableError();
      if (!hasExactReadOnlyContract(listed.tools)) throw new McfLedgerReadUnavailableError();
      const result = await withAbortDeadline(
        Promise.resolve().then(() =>
          client?.callTool({
            name: parsed.data.operation,
            arguments: parsed.data.input,
          }),
        ),
        deadline.signal,
      );
      if (result === undefined) throw new McfLedgerReadUnavailableError();
      if (result.isError === true) {
        throw new McfLedgerReadUnavailableError();
      }
      const structuredResult = parseStructuredResult(
        parsed.data.operation,
        result.structuredContent,
      );
      if (structuredResult === null) throw new McfLedgerReadUnavailableError();
      const responseBytes = Buffer.byteLength(JSON.stringify(structuredResult), 'utf8');
      if (responseBytes > this.configuration.responseLimitBytes) {
        throw new McfLedgerReadUnavailableError();
      }
      return {
        schema_version: 1,
        provider_project_id: 'cognitive-ledger',
        operation: parsed.data.operation,
        read_only: true,
        memory_payload_persisted_by_mcf: false,
        result: structuredResult,
      };
    } catch (error) {
      if (error instanceof McfLedgerQueryInvalidError) throw error;
      throw new McfLedgerReadUnavailableError();
    } finally {
      clearTimeout(deadlineTimer);
      deadline.abort();
      if (client !== undefined) {
        await closeWithin(client, Math.min(this.configuration.timeoutMs, 1_000));
      }
      this.activeQueries -= 1;
    }
  }
}
