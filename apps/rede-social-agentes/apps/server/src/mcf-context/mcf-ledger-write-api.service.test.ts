import { describe, expect, it, vi } from 'vitest';

import {
  loadMcfLedgerWriteConfiguration,
  McfLedgerMemoryWriteInvalidError,
  McfLedgerMemoryWriteUnavailableError,
  type McfLedgerWriteConfiguration,
  type McfLedgerWriteMcpClient,
  type McfLedgerWriteMcpClientFactory,
  McfLedgerWriteApiService,
} from './mcf-ledger-write-api.service.js';

const writeIngress = 'mcf-ledger-write-ingress-token-000000000001';
const writeBearer = 'ledger-write-oauth-bearer-token-000000000002';
const readIngress = 'mcf-ledger-read-ingress-token-000000000003';
const readBearer = 'ledger-read-oauth-bearer-token-000000000004';
const contextToken = 'mcf-context-read-token-000000000005';
const cloudToken = 'mcf-cloud-context-token-000000000006';

function env(overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    NODE_ENV: 'test',
    MCF_COGNITIVE_LEDGER_WRITE_MCP_URL: 'http://127.0.0.1:33100/mcp-write',
    MCF_COGNITIVE_LEDGER_WRITE_BEARER_TOKEN: writeBearer,
    MCF_COGNITIVE_LEDGER_WRITE_INGRESS_TOKEN: writeIngress,
    MCF_COGNITIVE_LEDGER_INGRESS_TOKEN: readIngress,
    MCF_COGNITIVE_LEDGER_BEARER_TOKEN: readBearer,
    MCF_CONTEXT_READ_TOKEN: contextToken,
    MCF_CLOUD_CONTEXT_INGRESS_TOKEN: cloudToken,
    ...overrides,
  };
}

function config(overrides: Partial<McfLedgerWriteConfiguration> = {}): McfLedgerWriteConfiguration {
  return {
    endpoint: new URL('http://127.0.0.1:33100/mcp-write'),
    bearerToken: writeBearer,
    timeoutMs: 500,
    inputLimitBytes: 65_536,
    responseLimitBytes: 65_536,
    maxConcurrentWrites: 1,
    ...overrides,
  };
}

function input() {
  return {
    confirmacao_explicita: true,
    evento: {
      id: 'ec-mcf-write-001',
      timestamp: '2026-09-18T21:00:00-03:00',
      tipo: 'decisao',
      status: 'ativo',
      titulo: 'Evento sintético',
      resumo: 'Prova MCF write.',
      contexto: 'Lab',
      projetos: ['MCF'],
      assuntos: ['memoria'],
      ideias: [],
      decisoes: ['registrar'],
      hipoteses: [],
      questoes_abertas: [],
      proximos_passos: ['read-back'],
      metadados: { proveniencia: 'sintetica' },
    },
    fontes: [{ tipo_de_fonte: 'teste', provedor: 'mcf-lab', conteudo_bruto: 'SINTETICO' }],
    relacoes: [],
  };
}

function receipt() {
  return {
    estado: 'ok',
    receipt: {
      schema: 'cognitive_ledger_memory_receipt/v1',
      operacao: 'registrar_memoria',
      evento_id: 'ec-mcf-write-001',
      provider_status: 'criado',
      read_back: 'verified',
      event_sha256: 'a'.repeat(64),
      receipt_sha256: 'b'.repeat(64),
    },
  };
}

function client(overrides: Partial<McfLedgerWriteMcpClient> = {}): McfLedgerWriteMcpClient {
  return {
    connect: vi.fn().mockResolvedValue(undefined),
    listTools: vi.fn().mockResolvedValue({
      tools: [{
        name: 'registrar_memoria',
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      }],
    }),
    callTool: vi.fn().mockResolvedValue({ structuredContent: receipt() }),
    close: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function factory(c: McfLedgerWriteMcpClient): McfLedgerWriteMcpClientFactory {
  return vi.fn(() => c);
}

describe('Cognitive Ledger governed write configuration', () => {
  it('requires separate write credentials and exact /mcp-write endpoint', () => {
    expect(loadMcfLedgerWriteConfiguration(env())?.endpoint.pathname).toBe('/mcp-write');
    const invalid = [
      {},
      env({ MCF_COGNITIVE_LEDGER_WRITE_MCP_URL: undefined }),
      env({ MCF_COGNITIVE_LEDGER_WRITE_BEARER_TOKEN: undefined }),
      env({ MCF_COGNITIVE_LEDGER_WRITE_INGRESS_TOKEN: undefined }),
      env({ MCF_COGNITIVE_LEDGER_WRITE_INGRESS_TOKEN: readIngress }),
      env({ MCF_COGNITIVE_LEDGER_WRITE_BEARER_TOKEN: readBearer }),
      env({ MCF_COGNITIVE_LEDGER_WRITE_BEARER_TOKEN: writeIngress }),
      env({ MCF_COGNITIVE_LEDGER_WRITE_MCP_URL: 'http://127.0.0.1:33100/mcp' }),
      env({ MCF_COGNITIVE_LEDGER_WRITE_MCP_URL: 'http://localhost:33100/mcp-write' }),
      env({ NODE_ENV: 'production', MCF_COGNITIVE_LEDGER_WRITE_MCP_URL: 'http://127.0.0.1:33100/mcp-write' }),
    ];
    for (const candidate of invalid) expect(loadMcfLedgerWriteConfiguration(candidate)).toBeNull();
  });
});

describe('McfLedgerWriteApiService', () => {
  it('returns only provider Receipt metadata after explicit write', async () => {
    const mcp = client();
    const service = new McfLedgerWriteApiService(config(), factory(mcp));
    const result = await service.registerExplicit(input());

    expect(result).toEqual({
      schema_version: 1,
      provider_project_id: 'cognitive-ledger',
      operation: 'registrar_memoria',
      explicit_confirmation: true,
      memory_payload_persisted_by_mcf: false,
      receipt: receipt().receipt,
    });
    expect(JSON.stringify(result)).not.toContain('SINTETICO');
    expect(mcp.callTool).toHaveBeenCalledWith({
      name: 'registrar_memoria',
      arguments: input(),
    });
  });

  it('rejects silent or malformed writes before connecting', async () => {
    const mcp = client();
    const service = new McfLedgerWriteApiService(config(), factory(mcp));
    for (const value of [
      { ...input(), confirmacao_explicita: false },
      { ...input(), extra: true },
      { confirmacao_explicita: true },
    ]) {
      await expect(service.registerExplicit(value)).rejects.toBeInstanceOf(
        McfLedgerMemoryWriteInvalidError,
      );
    }
    expect(mcp.connect).not.toHaveBeenCalled();
  });

  it('fails closed when write-tool inventory or annotations drift', async () => {
    const badInventories = [
      [],
      [{
        name: 'registrar_memoria',
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      }],
      [{
        name: 'registrar_memoria',
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      }, {
        name: 'apagar_memoria',
        annotations: {
          readOnlyHint: false,
          destructiveHint: true,
          idempotentHint: false,
          openWorldHint: false,
        },
      }],
    ];
    for (const tools of badInventories) {
      const service = new McfLedgerWriteApiService(
        config(),
        factory(client({ listTools: vi.fn().mockResolvedValue({ tools }) })),
      );
      await expect(service.registerExplicit(input())).rejects.toBeInstanceOf(
        McfLedgerMemoryWriteUnavailableError,
      );
    }
  });

  it('rejects malformed Receipt and never echoes provider secrets', async () => {
    const secret = 'private-memory-fragment';
    for (const c of [
      client({ callTool: vi.fn().mockResolvedValue({ structuredContent: { estado: 'ok' } }) }),
      client({ callTool: vi.fn().mockRejectedValue(new Error(`${writeBearer}:${secret}`)) }),
    ]) {
      const service = new McfLedgerWriteApiService(config(), factory(c));
      const error = await service.registerExplicit(input()).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(McfLedgerMemoryWriteUnavailableError);
      expect(String(error)).not.toContain(writeBearer);
      expect(String(error)).not.toContain(secret);
    }
  });

  it('enforces a fail-closed write bulkhead', async () => {
    let release: (() => void) | undefined;
    const first = client({
      connect: vi.fn(() => new Promise<void>((resolve) => { release = resolve; })),
    });
    const recovered = client();
    const make = vi.fn<McfLedgerWriteMcpClientFactory>()
      .mockReturnValueOnce(first)
      .mockReturnValueOnce(recovered);
    const service = new McfLedgerWriteApiService(
      config({ maxConcurrentWrites: 1, timeoutMs: 1_000 }),
      make,
    );

    const pending = service.registerExplicit(input());
    await vi.waitFor(() => expect(make).toHaveBeenCalledOnce());
    await expect(service.registerExplicit(input())).rejects.toBeInstanceOf(
      McfLedgerMemoryWriteUnavailableError,
    );
    release?.();
    await expect(pending).resolves.toMatchObject({ operation: 'registrar_memoria' });
    await expect(service.registerExplicit(input())).resolves.toMatchObject({
      operation: 'registrar_memoria',
    });
  });
});
