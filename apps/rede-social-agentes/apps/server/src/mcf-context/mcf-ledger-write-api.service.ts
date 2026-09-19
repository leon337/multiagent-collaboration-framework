import { Buffer } from 'node:buffer';

import { Injectable } from '@nestjs/common';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { z } from 'zod';

import { createBoundedMcpFetch } from './mcf-ledger-read-api.service.js';

const bounded = (max: number) => z.string().min(1).max(max).refine((v) => v === v.trim());
const textList = z.array(bounded(4096)).max(64);
const metadata = z.record(z.string(), z.unknown());

const eventSchema = z.object({
  id: bounded(256).regex(/^[A-Za-z0-9._:-]+$/u),
  timestamp: z.string().datetime({ offset: true }),
  tipo: bounded(256),
  status: bounded(128).optional(),
  titulo: bounded(1024),
  resumo: bounded(16384),
  contexto: z.string().max(16384).optional(),
  projetos: textList.optional(),
  assuntos: textList.optional(),
  ideias: textList.optional(),
  decisoes: textList.optional(),
  hipoteses: textList.optional(),
  questoes_abertas: textList.optional(),
  proximos_passos: textList.optional(),
  metadados: metadata.optional(),
}).strict();

const sourceSchema = z.object({
  tipo_de_fonte: bounded(256),
  provedor: bounded(256).optional(),
  referencia: z.string().max(4096).nullable().optional(),
  escopo_da_captura: z.string().max(4096).optional(),
  conteudo_bruto: z.string().max(16384).nullable().optional(),
  metadados: metadata.optional(),
}).strict();

const relationSchema = z.object({
  evento_destino_id: bounded(256),
  tipo: bounded(256),
  rotulo: z.string().max(1024).optional(),
}).strict();

const registerSchema = z.object({
  confirmacao_explicita: z.literal(true),
  evento: eventSchema,
  fontes: z.array(sourceSchema).max(8).optional(),
  relacoes: z.array(relationSchema).max(32).optional(),
}).strict();

const receiptSchema = z.object({
  schema: z.literal('cognitive_ledger_memory_receipt/v1'),
  operacao: z.literal('registrar_memoria'),
  evento_id: bounded(256),
  provider_status: z.enum(['criado', 'existente']),
  read_back: z.literal('verified'),
  event_sha256: z.string().regex(/^[a-f0-9]{64}$/u),
  receipt_sha256: z.string().regex(/^[a-f0-9]{64}$/u),
}).strict();

const resultSchema = z.object({
  estado: z.literal('ok'),
  receipt: receiptSchema,
}).strict();

export type McfLedgerMemoryWriteInput = z.infer<typeof registerSchema>;
export type McfLedgerMemoryReceipt = z.infer<typeof receiptSchema>;

export interface McfLedgerWriteConfiguration {
  endpoint: URL;
  bearerToken: string;
  timeoutMs: number;
  inputLimitBytes: number;
  responseLimitBytes: number;
  maxConcurrentWrites: number;
}

interface ToolDescriptor {
  name: string;
  annotations?: {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
  };
}

interface ToolResult {
  isError?: boolean;
  structuredContent?: Record<string, unknown>;
}

export interface McfLedgerWriteMcpClient {
  connect(): Promise<void>;
  listTools(): Promise<{ tools: ToolDescriptor[] }>;
  callTool(request: {
    name: 'registrar_memoria';
    arguments: Record<string, unknown>;
  }): Promise<ToolResult>;
  close(): Promise<void>;
}

export type McfLedgerWriteMcpClientFactory = (
  configuration: McfLedgerWriteConfiguration,
  signal: AbortSignal,
) => McfLedgerWriteMcpClient;

export class McfLedgerMemoryWriteInvalidError extends Error {
  constructor() {
    super('The Cognitive Ledger memory write request is invalid.');
    this.name = 'McfLedgerMemoryWriteInvalidError';
  }
}

export class McfLedgerMemoryWriteUnavailableError extends Error {
  constructor() {
    super('The Cognitive Ledger governed write provider is unavailable or failed closed.');
    this.name = 'McfLedgerMemoryWriteUnavailableError';
  }
}

function integer(
  value: string | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
): number | null {
  if (value === undefined) return fallback;
  if (!/^\d+$/u.test(value)) return null;
  const n = Number(value);
  return Number.isSafeInteger(n) && n >= minimum && n <= maximum ? n : null;
}

function loopback(host: string): boolean {
  return host === '127.0.0.1' || host === '[::1]' || host === '::1';
}

function endpoint(value: string, nodeEnvironment: string | undefined): URL | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (
    url.username !== '' ||
    url.password !== '' ||
    url.search !== '' ||
    url.hash !== '' ||
    url.pathname !== '/mcp-write'
  ) return null;
  if (url.protocol === 'https:') return url;
  if (
    url.protocol === 'http:' &&
    (nodeEnvironment === 'development' || nodeEnvironment === 'test') &&
    loopback(url.hostname)
  ) return url;
  return null;
}

function validBearer(value: string | undefined): value is string {
  return (
    typeof value === 'string' &&
    value.length >= 32 &&
    value.length <= 8192 &&
    value === value.trim() &&
    /^[A-Za-z0-9._~+/-]+={0,}$/u.test(value)
  );
}

export function loadMcfLedgerWriteConfiguration(
  env: NodeJS.ProcessEnv,
): McfLedgerWriteConfiguration | null {
  const urlValue = env.MCF_COGNITIVE_LEDGER_WRITE_MCP_URL;
  const bearerToken = env.MCF_COGNITIVE_LEDGER_WRITE_BEARER_TOKEN;
  const ingress = env.MCF_COGNITIVE_LEDGER_WRITE_INGRESS_TOKEN;
  if (!urlValue || !validBearer(bearerToken) || !ingress) return null;

  const credentials = [
    ingress,
    bearerToken,
    env.MCF_COGNITIVE_LEDGER_INGRESS_TOKEN,
    env.MCF_COGNITIVE_LEDGER_BEARER_TOKEN,
    env.MCF_CONTEXT_READ_TOKEN,
    env.MCF_CLOUD_CONTEXT_INGRESS_TOKEN,
  ].filter((v): v is string => Boolean(v));
  if (new Set(credentials).size !== credentials.length) return null;

  const parsedEndpoint = endpoint(urlValue, env.NODE_ENV);
  const timeoutMs = integer(env.MCF_COGNITIVE_LEDGER_WRITE_TIMEOUT_MS, 5_000, 250, 15_000);
  const inputLimitBytes = integer(
    env.MCF_COGNITIVE_LEDGER_WRITE_INPUT_LIMIT_BYTES,
    65_536,
    2_048,
    65_536,
  );
  const responseLimitBytes = integer(
    env.MCF_COGNITIVE_LEDGER_WRITE_RESPONSE_LIMIT_BYTES,
    65_536,
    2_048,
    262_144,
  );
  const maxConcurrentWrites = integer(
    env.MCF_COGNITIVE_LEDGER_MAX_CONCURRENT_WRITES,
    1,
    1,
    4,
  );
  if (
    parsedEndpoint === null ||
    timeoutMs === null ||
    inputLimitBytes === null ||
    responseLimitBytes === null ||
    maxConcurrentWrites === null
  ) return null;
  return {
    endpoint: parsedEndpoint,
    bearerToken,
    timeoutMs,
    inputLimitBytes,
    responseLimitBytes,
    maxConcurrentWrites,
  };
}

function factory(
  configuration: McfLedgerWriteConfiguration,
  signal: AbortSignal,
): McfLedgerWriteMcpClient {
  const transport = new StreamableHTTPClientTransport(configuration.endpoint, {
    requestInit: { headers: { Authorization: `Bearer ${configuration.bearerToken}` } },
    fetch: createBoundedMcpFetch(configuration, fetch, signal),
    reconnectionOptions: {
      maxReconnectionDelay: configuration.timeoutMs,
      initialReconnectionDelay: 250,
      reconnectionDelayGrowFactor: 1,
      maxRetries: 0,
    },
  });
  const client = new Client({ name: 'mcf-cognitive-ledger-write-adapter', version: '0.1.0' });
  return {
    connect: () => client.connect(transport as Transport),
    listTools: () => client.listTools() as Promise<{ tools: ToolDescriptor[] }>,
    callTool: (request) => client.callTool(request) as Promise<ToolResult>,
    close: () => client.close(),
  };
}

function exactWriteTool(tools: readonly ToolDescriptor[]): boolean {
  return (
    tools.length === 1 &&
    tools[0]?.name === 'registrar_memoria' &&
    tools[0]?.annotations?.readOnlyHint === false &&
    tools[0]?.annotations?.destructiveHint === false &&
    tools[0]?.annotations?.idempotentHint === true &&
    tools[0]?.annotations?.openWorldHint === false
  );
}

function deadline<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(new McfLedgerMemoryWriteUnavailableError());
  return new Promise<T>((resolve, reject) => {
    const abort = () => reject(new McfLedgerMemoryWriteUnavailableError());
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

async function closeBounded(client: McfLedgerWriteMcpClient, ms: number): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  await Promise.race([
    Promise.resolve().then(() => client.close()).catch(() => undefined),
    new Promise<void>((resolve) => {
      timer = setTimeout(resolve, ms);
    }),
  ]);
  if (timer !== undefined) clearTimeout(timer);
}

export interface McfLedgerMemoryWriteResponse {
  schema_version: 1;
  provider_project_id: 'cognitive-ledger';
  operation: 'registrar_memoria';
  explicit_confirmation: true;
  memory_payload_persisted_by_mcf: false;
  receipt: McfLedgerMemoryReceipt;
}

@Injectable()
export class McfLedgerWriteApiService {
  private activeWrites = 0;

  constructor(
    private readonly configuration: McfLedgerWriteConfiguration | null,
    private readonly clientFactory: McfLedgerWriteMcpClientFactory = factory,
  ) {}

  static fromEnvironment(env: NodeJS.ProcessEnv = process.env): McfLedgerWriteApiService {
    return new McfLedgerWriteApiService(loadMcfLedgerWriteConfiguration(env));
  }

  async registerExplicit(value: unknown): Promise<McfLedgerMemoryWriteResponse> {
    if (this.configuration === null) throw new McfLedgerMemoryWriteUnavailableError();

    let serialized: string;
    try {
      const candidate = JSON.stringify(value);
      if (candidate === undefined) throw new Error();
      serialized = candidate;
    } catch {
      throw new McfLedgerMemoryWriteInvalidError();
    }
    if (Buffer.byteLength(serialized, 'utf8') > this.configuration.inputLimitBytes) {
      throw new McfLedgerMemoryWriteInvalidError();
    }
    const parsed = registerSchema.safeParse(value);
    if (!parsed.success) throw new McfLedgerMemoryWriteInvalidError();

    if (this.activeWrites >= this.configuration.maxConcurrentWrites) {
      throw new McfLedgerMemoryWriteUnavailableError();
    }
    this.activeWrites += 1;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.configuration.timeoutMs);
    let client: McfLedgerWriteMcpClient | undefined;
    try {
      client = this.clientFactory(this.configuration, controller.signal);
      await deadline(Promise.resolve().then(() => client?.connect()), controller.signal);
      const listed = await deadline(
        Promise.resolve().then(() => client?.listTools()),
        controller.signal,
      );
      if (!listed || !exactWriteTool(listed.tools)) {
        throw new McfLedgerMemoryWriteUnavailableError();
      }
      const result = await deadline(
        Promise.resolve().then(() =>
          client?.callTool({
            name: 'registrar_memoria',
            arguments: parsed.data as Record<string, unknown>,
          }),
        ),
        controller.signal,
      );
      if (!result || result.isError === true) throw new McfLedgerMemoryWriteUnavailableError();
      const decoded = resultSchema.safeParse(result.structuredContent);
      if (!decoded.success) throw new McfLedgerMemoryWriteUnavailableError();
      if (
        Buffer.byteLength(JSON.stringify(decoded.data), 'utf8') >
        this.configuration.responseLimitBytes
      ) throw new McfLedgerMemoryWriteUnavailableError();

      return {
        schema_version: 1,
        provider_project_id: 'cognitive-ledger',
        operation: 'registrar_memoria',
        explicit_confirmation: true,
        memory_payload_persisted_by_mcf: false,
        receipt: decoded.data.receipt,
      };
    } catch (error) {
      if (error instanceof McfLedgerMemoryWriteInvalidError) throw error;
      throw new McfLedgerMemoryWriteUnavailableError();
    } finally {
      clearTimeout(timer);
      controller.abort();
      if (client) await closeBounded(client, Math.min(this.configuration.timeoutMs, 1_000));
      this.activeWrites -= 1;
    }
  }
}
