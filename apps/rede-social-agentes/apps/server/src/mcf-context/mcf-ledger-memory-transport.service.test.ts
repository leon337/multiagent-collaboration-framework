import { describe, expect, it, vi } from 'vitest';

import {
  loadMcfLedgerMemoryConfiguration,
  McfLedgerMemoryInvalidError,
  McfLedgerMemoryUnavailableError,
  type McfLedgerMemoryConfiguration,
  type McfLedgerMemoryMcpClient,
  type McfLedgerMemoryMcpClientFactory,
  McfLedgerMemoryTransportService,
} from './mcf-ledger-memory-transport.service.js';

const memoryIngress = 'mcf-ledger-memory-ingress-token-000000000001';
const memoryBearer = 'ledger-memory-oauth-bearer-token-000000000002';
const readIngress = 'mcf-ledger-read-ingress-token-000000000003';
const readBearer = 'ledger-read-oauth-bearer-token-000000000004';
const contextToken = 'mcf-context-read-token-000000000005';
const cloudToken = 'mcf-cloud-context-token-000000000006';

function env(overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    NODE_ENV: 'test',
    MCF_COGNITIVE_LEDGER_WRITE_MCP_URL: 'http://127.0.0.1:33100/mcp-write',
    MCF_COGNITIVE_LEDGER_WRITE_BEARER_TOKEN: memoryBearer,
    MCF_COGNITIVE_LEDGER_WRITE_INGRESS_TOKEN: memoryIngress,
    MCF_COGNITIVE_LEDGER_INGRESS_TOKEN: readIngress,
    MCF_COGNITIVE_LEDGER_BEARER_TOKEN: readBearer,
    MCF_CONTEXT_READ_TOKEN: contextToken,
    MCF_CLOUD_CONTEXT_INGRESS_TOKEN: cloudToken,
    ...overrides,
  };
}

function config(overrides: Partial<McfLedgerMemoryConfiguration> = {}): McfLedgerMemoryConfiguration {
  return {
    endpoint: new URL('http://127.0.0.1:33100/mcp-write'),
    bearerToken: memoryBearer,
    timeoutMs: 500,
    inputLimitBytes: 65_536,
    responseLimitBytes: 65_536,
    maxConcurrentOperations: 1,
    ...overrides,
  };
}

function writeInput() {
  return {
    confirmacao_explicita: true,
    evento: {
      id: 'ec-mcf-write-001',
      timestamp: '2026-09-22T20:00:00-03:00',
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
      metadados: { proveniencia: 'sintetica', memory_scope: 'project:mcf' },
    },
    fontes: [{
      tipo_de_fonte: 'teste',
      provedor: 'mcf-lab',
      escopo_da_captura: 'project:mcf',
      conteudo_bruto: 'SINTETICO',
    }],
    relacoes: [],
  };
}

function writeReceipt() {
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

function inspectionResult() {
  return {
    estado: 'ok',
    memoria: {
      evento: {
        id: 'ec-mcf-write-001',
        timestamp: '2026-09-22T20:00:00-03:00',
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
        proximos_passos: [],
        metadados: { memory_scope: 'project:mcf' },
      },
      relacoes: [],
    },
  };
}

function tools() {
  return [
    {
      name: 'registrar_memoria',
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    {
      name: 'inspecionar_memoria',
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
  ];
}

function client(overrides: Partial<McfLedgerMemoryMcpClient> = {}): McfLedgerMemoryMcpClient {
  return {
    connect: vi.fn().mockResolvedValue(undefined),
    listTools: vi.fn().mockResolvedValue({ tools: tools() }),
    callTool: vi.fn(async (request) => {
      return request.name === 'registrar_memoria'
        ? { structuredContent: writeReceipt() }
        : { structuredContent: inspectionResult() };
    }),
    close: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function factory(c: McfLedgerMemoryMcpClient): McfLedgerMemoryMcpClientFactory {
  return vi.fn(() => c);
}

describe('governed memory transport configuration', () => {
  it('requires separate credentials and exact /mcp-write endpoint', () => {
    expect(loadMcfLedgerMemoryConfiguration(env())?.endpoint.pathname).toBe('/mcp-write');
    const invalid = [
      {},
      env({ MCF_COGNITIVE_LEDGER_WRITE_MCP_URL: undefined }),
      env({ MCF_COGNITIVE_LEDGER_WRITE_BEARER_TOKEN: undefined }),
      env({ MCF_COGNITIVE_LEDGER_WRITE_INGRESS_TOKEN: undefined }),
      env({ MCF_COGNITIVE_LEDGER_WRITE_INGRESS_TOKEN: readIngress }),
      env({ MCF_COGNITIVE_LEDGER_WRITE_BEARER_TOKEN: readBearer }),
      env({ MCF_COGNITIVE_LEDGER_WRITE_BEARER_TOKEN: memoryIngress }),
      env({ MCF_COGNITIVE_LEDGER_WRITE_MCP_URL: 'http://127.0.0.1:33100/mcp' }),
      env({ NODE_ENV: 'production', MCF_COGNITIVE_LEDGER_WRITE_MCP_URL: 'http://127.0.0.1:33100/mcp-write' }),
    ];
    for (const candidate of invalid) {
      expect(loadMcfLedgerMemoryConfiguration(candidate)).toBeNull();
    }
  });
});

describe('McfLedgerMemoryTransportService', () => {
  it('returns only provider Receipt metadata after explicit write', async () => {
    const mcp = client();
    const service = new McfLedgerMemoryTransportService(config(), factory(mcp));
    const result = await service.registerExplicit(writeInput());

    expect(result.receipt).toEqual(writeReceipt().receipt);
    expect(result.operation).toBe('registrar_memoria');
    expect(JSON.stringify(result)).not.toContain('SINTETICO');
    expect(mcp.callTool).toHaveBeenCalledWith({
      name: 'registrar_memoria',
      arguments: writeInput(),
    });
  });

  it('requires memory_scope on governed writes', async () => {
    const value = writeInput();
    delete (value.evento.metadados as Record<string, unknown>).memory_scope;
    const mcp = client();
    const service = new McfLedgerMemoryTransportService(config(), factory(mcp));
    await expect(service.registerExplicit(value)).rejects.toBeInstanceOf(McfLedgerMemoryInvalidError);
    expect(mcp.connect).not.toHaveBeenCalled();
  });

  it('inspects a memory by event id and explicit scope without raw source payload', async () => {
    const mcp = client();
    const service = new McfLedgerMemoryTransportService(config(), factory(mcp));
    const result = await service.inspect('ec-mcf-write-001', 'project:mcf');

    expect(result.evento.id).toBe('ec-mcf-write-001');
    expect(result.evento.metadados.memory_scope).toBe('project:mcf');
    expect(JSON.stringify(result)).not.toContain('conteudo_bruto');
    expect(mcp.callTool).toHaveBeenCalledWith({
      name: 'inspecionar_memoria',
      arguments: { evento_id: 'ec-mcf-write-001', memory_scope: 'project:mcf' },
    });
  });

  it('fails closed when the exact two-tool inventory drifts', async () => {
    const badInventories = [
      [],
      [tools()[0]],
      [...tools(), { name: 'apagar_memoria', annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      } }],
      [tools()[0], { ...tools()[1], annotations: { ...tools()[1].annotations, readOnlyHint: false } }],
    ];
    for (const inventory of badInventories) {
      const service = new McfLedgerMemoryTransportService(
        config(),
        factory(client({ listTools: vi.fn().mockResolvedValue({ tools: inventory }) })),
      );
      await expect(service.registerExplicit(writeInput())).rejects.toBeInstanceOf(
        McfLedgerMemoryUnavailableError,
      );
    }
  });

  it('rejects malformed provider responses and does not leak provider errors', async () => {
    const secret = 'private-memory-fragment';
    for (const c of [
      client({ callTool: vi.fn().mockResolvedValue({ structuredContent: { estado: 'ok' } }) }),
      client({ callTool: vi.fn().mockRejectedValue(new Error(`${memoryBearer}:${secret}`)) }),
    ]) {
      const service = new McfLedgerMemoryTransportService(config(), factory(c));
      const error = await service.registerExplicit(writeInput()).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(McfLedgerMemoryUnavailableError);
      expect(String(error)).not.toContain(memoryBearer);
      expect(String(error)).not.toContain(secret);
    }
  });

  it('enforces a fail-closed operation bulkhead', async () => {
    let release: (() => void) | undefined;
    const first = client({
      connect: vi.fn(() => new Promise<void>((resolve) => { release = resolve; })),
    });
    const recovered = client();
    const make = vi.fn<McfLedgerMemoryMcpClientFactory>()
      .mockReturnValueOnce(first)
      .mockReturnValueOnce(recovered);
    const service = new McfLedgerMemoryTransportService(
      config({ maxConcurrentOperations: 1, timeoutMs: 1_000 }),
      make,
    );

    const pending = service.registerExplicit(writeInput());
    await vi.waitFor(() => expect(make).toHaveBeenCalledOnce());
    await expect(service.inspect('ec-mcf-write-001', 'project:mcf')).rejects.toBeInstanceOf(
      McfLedgerMemoryUnavailableError,
    );
    release?.();
    await expect(pending).resolves.toMatchObject({ operation: 'registrar_memoria' });
    await expect(service.inspect('ec-mcf-write-001', 'project:mcf')).resolves.toMatchObject({
      evento: { id: 'ec-mcf-write-001' },
    });
  });
});
