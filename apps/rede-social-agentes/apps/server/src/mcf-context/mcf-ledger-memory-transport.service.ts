import { Buffer } from 'node:buffer';

import { Injectable } from '@nestjs/common';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { z } from 'zod';

import { createBoundedMcpFetch } from './mcf-ledger-read-api.service.js';

const bounded = (max: number) =>
  z
    .string()
    .min(1)
    .max(max)
    .refine((value) => value === value.trim());
const textList = z.array(bounded(4096)).max(64);
const metadata = z.record(z.string(), z.unknown());

const eventSchema = z
  .object({
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
    metadados: metadata,
  })
  .strict()
  .refine(
    (event) =>
      typeof event.metadados.memory_scope === 'string' &&
      event.metadados.memory_scope.trim().length > 0 &&
      event.metadados.memory_scope.length <= 512,
    { path: ['metadados', 'memory_scope'] },
  );

const sourceSchema = z
  .object({
    tipo_de_fonte: bounded(256),
    provedor: bounded(256).optional(),
    referencia: z.string().max(4096).nullable().optional(),
    escopo_da_captura: z.string().max(4096).optional(),
    conteudo_bruto: z.string().max(16384).nullable().optional(),
    metadados: metadata.optional(),
  })
  .strict();

const relationWriteSchema = z
  .object({
    evento_destino_id: bounded(256),
    tipo: bounded(256),
    rotulo: z.string().max(1024).optional(),
  })
  .strict();

const relationInspectSchema = z
  .object({
    evento_origem_id: bounded(256).optional(),
    evento_destino_id: bounded(256),
    tipo: bounded(256),
    rotulo: z.string().max(1024).nullable().optional(),
    metadados: metadata.optional(),
  })
  .strict();

const registerSchema = z
  .object({
    confirmacao_explicita: z.literal(true),
    evento: eventSchema,
    fontes: z.array(sourceSchema).max(8).optional(),
    relacoes: z.array(relationWriteSchema).max(32).optional(),
  })
  .strict();

const receiptSchema = z
  .object({
    schema: z.literal('cognitive_ledger_memory_receipt/v1'),
    operacao: z.literal('registrar_memoria'),
    evento_id: bounded(256),
    provider_status: z.enum(['criado', 'existente']),
    read_back: z.literal('verified'),
    event_sha256: z.string().regex(/^[a-f0-9]{64}$/u),
    receipt_sha256: z.string().regex(/^[a-f0-9]{64}$/u),
  })
  .strict();

const writeResultSchema = z
  .object({
    estado: z.literal('ok'),
    receipt: receiptSchema,
  })
  .strict();

const inspectResultSchema = z
  .object({
    estado: z.literal('ok'),
    memoria: z
      .object({
        evento: eventSchema,
        relacoes: z.array(relationInspectSchema).max(256),
      })
      .strict(),
  })
  .strict();

const inspectIdSchema = bounded(256).regex(/^[A-Za-z0-9._:-]+$/u);
const scopeSchema = bounded(512);

export type McfLedgerMemoryInput = z.infer<typeof registerSchema>;
export type McfLedgerMemoryReceipt = z.infer<typeof receiptSchema>;
export type McfLedgerMemoryInspection = z.infer<
  typeof inspectResultSchema
>['memoria'];

export interface McfLedgerMemoryConfiguration {
  endpoint: URL;
  bearerToken: string;
  timeoutMs: number;
  inputLimitBytes: number;
  responseLimitBytes: number;
  maxConcurrentOperations: number;
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

export interface McfLedgerMemoryMcpClient {
  connect(): Promise<void>;
  listTools(): Promise<{ tools: ToolDescriptor[] }>;
  callTool(request: {
    name: 'registrar_memoria' | 'inspecionar_memoria';
    arguments: Record<string, unknown>;
  }): Promise<ToolResult>;
  close(): Promise<void>;
}

export type McfLedgerMemoryMcpClientFactory = (
  configuration: McfLedgerMemoryConfiguration,
  signal: AbortSignal,
) => McfLedgerMemoryMcpClient;

export class McfLedgerMemoryInvalidError extends Error {
  constructor() {
    super('The governed Cognitive Ledger memory request is invalid.');
    this.name = 'McfLedgerMemoryInvalidError';
  }
}

export class McfLedgerMemoryUnavailableError extends Error {
  constructor() {
    super(
      'The governed Cognitive Ledger memory provider is unavailable or failed closed.',
    );
    this.name = 'McfLedgerMemoryUnavailableError';
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
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) &&
      parsed >= minimum &&
      parsed <= maximum
    ? parsed
    : null;
}

function loopback(host: string): boolean {
  return host === '127.0.0.1' || host === '[::1]' || host === '::1';
}

function parseEndpoint(
  value: string,
  nodeEnvironment: string | undefined,
): URL | null {
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
  ) {
    return null;
  }
  if (url.protocol === 'https:') return url;
  if (
    url.protocol === 'http:' &&
    (nodeEnvironment === 'development' || nodeEnvironment === 'test') &&
    loopback(url.hostname)
  ) {
    return url;
  }
  return null;
}

function validCredential(value: string | undefined): value is string {
  return (
    typeof value === 'string' &&
    value.length >= 32 &&
    value.length <= 8192 &&
    value === value.trim() &&
    /^[A-Za-z0-9._~+/-]+={0,}$/u.test(value)
  );
}

export function loadMcfLedgerMemoryConfiguration(
  env: NodeJS.ProcessEnv,
): McfLedgerMemoryConfiguration | null {
  const endpointValue = env.MCF_COGNITIVE_LEDGER_WRITE_MCP_URL;
  const bearerToken = env.MCF_COGNITIVE_LEDGER_WRITE_BEARER_TOKEN;
  const ingress = env.MCF_COGNITIVE_LEDGER_WRITE_INGRESS_TOKEN;
  if (
    !endpointValue ||
    !validCredential(bearerToken) ||
    !validCredential(ingress)
  ) {
    return null;
  }

  const credentials = [
    ingress,
    bearerToken,
    env.MCF_COGNITIVE_LEDGER_INGRESS_TOKEN,
    env.MCF_COGNITIVE_LEDGER_BEARER_TOKEN,
    env.MCF_CONTEXT_READ_TOKEN,
    env.MCF_CLOUD_CONTEXT_INGRESS_TOKEN,
  ].filter((value): value is string => Boolean(value));
  if (new Set(credentials).size !== credentials.length) return null;

  const endpoint = parseEndpoint(endpointValue, env.NODE_ENV);
  const timeoutMs = integer(
    env.MCF_COGNITIVE_LEDGER_WRITE_TIMEOUT_MS,
    5_000,
    250,
    15_000,
  );
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
  const maxConcurrentOperations = integer(
    env.MCF_COGNITIVE_LEDGER_MAX_CONCURRENT_WRITES,
    1,
    1,
    4,
  );
  if (
    endpoint === null ||
    timeoutMs === null ||
    inputLimitBytes === null ||
    responseLimitBytes === null ||
    maxConcurrentOperations === null
  ) {
    return null;
  }
  return {
    endpoint,
    bearerToken,
    timeoutMs,
    inputLimitBytes,
    responseLimitBytes,
    maxConcurrentOperations,
  };
}

function defaultFactory(
  configuration: McfLedgerMemoryConfiguration,
  signal: AbortSignal,
): McfLedgerMemoryMcpClient {
  const transport = new StreamableHTTPClientTransport(configuration.endpoint, {
    requestInit: {
      headers: { Authorization: `Bearer ${configuration.bearerToken}` },
    },
    fetch: createBoundedMcpFetch(
      {
        ...configuration,
        maxConcurrentQueries: configuration.maxConcurrentOperations,
      },
      fetch,
      signal,
    ),
    reconnectionOptions: {
      maxReconnectionDelay: configuration.timeoutMs,
      initialReconnectionDelay: 250,
      reconnectionDelayGrowFactor: 1,
      maxRetries: 0,
    },
  });
  const client = new Client({
    name: 'mcf-governed-cognitive-memory',
    version: '0.2.0',
  });
  return {
    connect: () => client.connect(transport as Transport),
    listTools: () =>
      client.listTools() as Promise<{ tools: ToolDescriptor[] }>,
    callTool: (request) => client.callTool(request) as Promise<ToolResult>,
    close: () => client.close(),
  };
}

function exactToolInventory(tools: readonly ToolDescriptor[]): boolean {
  if (tools.length !== 2) return false;
  const byName = new Map(tools.map((tool) => [tool.name, tool]));
  const write = byName.get('registrar_memoria');
  const inspect = byName.get('inspecionar_memoria');
  return (
    byName.size === 2 &&
    write?.annotations?.readOnlyHint === false &&
    write.annotations.destructiveHint === false &&
    write.annotations.idempotentHint === true &&
    write.annotations.openWorldHint === false &&
    inspect?.annotations?.readOnlyHint === true &&
    inspect.annotations.destructiveHint === false &&
    inspect.annotations.idempotentHint === true &&
    inspect.annotations.openWorldHint === false
  );
}

function deadline<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) {
    return Promise.reject(new McfLedgerMemoryUnavailableError());
  }
  return new Promise<T>((resolve, reject) => {
    const abort = () => reject(new McfLedgerMemoryUnavailableError());
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

async function closeBounded(
  client: McfLedgerMemoryMcpClient,
  ms: number,
): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  await Promise.race([
    Promise.resolve()
      .then(() => client.close())
      .catch(() => undefined),
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
export class McfLedgerMemoryTransportService {
  private activeOperations = 0;

  constructor(
    private readonly configuration: McfLedgerMemoryConfiguration | null,
    private readonly clientFactory: McfLedgerMemoryMcpClientFactory =
      defaultFactory,
  ) {}

  static fromEnvironment(
    env: NodeJS.ProcessEnv = process.env,
  ): McfLedgerMemoryTransportService {
    return new McfLedgerMemoryTransportService(
      loadMcfLedgerMemoryConfiguration(env),
    );
  }

  async registerExplicit(value: unknown): Promise<McfLedgerMemoryWriteResponse> {
    const parsed = this.parseWrite(value);
    return this.withClient(async (client, signal) => {
      const result = await deadline(
        client.callTool({
          name: 'registrar_memoria',
          arguments: parsed as Record<string, unknown>,
        }),
        signal,
      );
      if (result.isError === true) throw new McfLedgerMemoryUnavailableError();
      const decoded = writeResultSchema.safeParse(result.structuredContent);
      if (!decoded.success) throw new McfLedgerMemoryUnavailableError();
      this.assertResponseSize(decoded.data);
      return {
        schema_version: 1,
        provider_project_id: 'cognitive-ledger',
        operation: 'registrar_memoria',
        explicit_confirmation: true,
        memory_payload_persisted_by_mcf: false,
        receipt: decoded.data.receipt,
      };
    });
  }

  async inspect(
    eventId: string,
    memoryScope: string,
  ): Promise<McfLedgerMemoryInspection> {
    const id = inspectIdSchema.safeParse(eventId);
    const scope = scopeSchema.safeParse(memoryScope);
    if (!id.success || !scope.success) throw new McfLedgerMemoryInvalidError();

    return this.withClient(async (client, signal) => {
      const result = await deadline(
        client.callTool({
          name: 'inspecionar_memoria',
          arguments: { evento_id: id.data, memory_scope: scope.data },
        }),
        signal,
      );
      if (result.isError === true) throw new McfLedgerMemoryUnavailableError();
      const decoded = inspectResultSchema.safeParse(result.structuredContent);
      if (!decoded.success) throw new McfLedgerMemoryUnavailableError();
      this.assertResponseSize(decoded.data);
      if (decoded.data.memoria.evento.metadados.memory_scope !== scope.data) {
        throw new McfLedgerMemoryUnavailableError();
      }
      return decoded.data.memoria;
    });
  }

  private parseWrite(value: unknown): McfLedgerMemoryInput {
    if (this.configuration === null) throw new McfLedgerMemoryUnavailableError();
    let serialized: string;
    try {
      const candidate = JSON.stringify(value);
      if (candidate === undefined) throw new Error();
      serialized = candidate;
    } catch {
      throw new McfLedgerMemoryInvalidError();
    }
    if (Buffer.byteLength(serialized, 'utf8') > this.configuration.inputLimitBytes) {
      throw new McfLedgerMemoryInvalidError();
    }
    const parsed = registerSchema.safeParse(value);
    if (!parsed.success) throw new McfLedgerMemoryInvalidError();
    return parsed.data;
  }

  private assertResponseSize(value: unknown): void {
    if (this.configuration === null) throw new McfLedgerMemoryUnavailableError();
    if (
      Buffer.byteLength(JSON.stringify(value), 'utf8') >
      this.configuration.responseLimitBytes
    ) {
      throw new McfLedgerMemoryUnavailableError();
    }
  }

  private async withClient<T>(
    operation: (
      client: McfLedgerMemoryMcpClient,
      signal: AbortSignal,
    ) => Promise<T>,
  ): Promise<T> {
    if (this.configuration === null) throw new McfLedgerMemoryUnavailableError();
    if (this.activeOperations >= this.configuration.maxConcurrentOperations) {
      throw new McfLedgerMemoryUnavailableError();
    }
    this.activeOperations += 1;

    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      this.configuration.timeoutMs,
    );
    let client: McfLedgerMemoryMcpClient | undefined;
    try {
      client = this.clientFactory(this.configuration, controller.signal);
      await deadline(client.connect(), controller.signal);
      const listed = await deadline(client.listTools(), controller.signal);
      if (!exactToolInventory(listed.tools)) {
        throw new McfLedgerMemoryUnavailableError();
      }
      return await operation(client, controller.signal);
    } catch (error) {
      if (error instanceof McfLedgerMemoryInvalidError) throw error;
      throw new McfLedgerMemoryUnavailableError();
    } finally {
      clearTimeout(timer);
      controller.abort();
      if (client) {
        await closeBounded(
          client,
          Math.min(this.configuration.timeoutMs, 1_000),
        );
      }
      this.activeOperations -= 1;
    }
  }
}