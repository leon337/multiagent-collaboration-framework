import { Buffer } from 'node:buffer';

import type { FetchLike } from '@modelcontextprotocol/sdk/shared/transport.js';
import { describe, expect, it, vi } from 'vitest';

import {
  createBoundedMcpFetch,
  loadMcfLedgerReadConfiguration,
  MCF_LEDGER_PROVIDER_TOOL_NAMES,
  McfLedgerQueryInvalidError,
  type McfLedgerMcpClient,
  type McfLedgerMcpClientFactory,
  McfLedgerReadApiService,
  type McfLedgerReadConfiguration,
  McfLedgerReadUnavailableError,
  type McfLedgerToolName,
} from './mcf-ledger-read-api.service.js';

const contextToken = 'mcf-context-ingress-token-for-triview-lab-0001';
const ingressToken = 'mcf-ledger-ingress-token-for-readonly-lab-0002';
const bearerToken = 'ledger-oauth-bearer-token-for-readonly-lab-0002';

function environment(overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    NODE_ENV: 'test',
    MCF_CONTEXT_READ_TOKEN: contextToken,
    MCF_COGNITIVE_LEDGER_INGRESS_TOKEN: ingressToken,
    MCF_COGNITIVE_LEDGER_MCP_URL: 'http://127.0.0.1:33100/mcp',
    MCF_COGNITIVE_LEDGER_BEARER_TOKEN: bearerToken,
    ...overrides,
  };
}

function configuration(
  overrides: Partial<McfLedgerReadConfiguration> = {},
): McfLedgerReadConfiguration {
  return {
    endpoint: new URL('http://127.0.0.1:33100/mcp'),
    bearerToken,
    timeoutMs: 500,
    inputLimitBytes: 32_768,
    responseLimitBytes: 262_144,
    ...overrides,
  };
}

function tools() {
  return MCF_LEDGER_PROVIDER_TOOL_NAMES.map((name) => ({
    name,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  }));
}

function event(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ec-lab-001',
    timestamp: '2026-08-20T12:00:00Z',
    tipo: 'decisao',
    status: 'ativo',
    titulo: 'Integração somente leitura',
    resumo: 'Recuperar sem escrever.',
    contexto: 'Laboratório sintético',
    projetos: ['MCF', 'Cognitive Ledger'],
    assuntos: ['continuidade'],
    ideias: ['memória externa'],
    decisoes: ['usar leitura antes de escrita'],
    hipoteses: ['texto atende ao laboratório'],
    questoes_abertas: ['como calibrar ranking?'],
    proximos_passos: ['validar MCF'],
    ...overrides,
  };
}

function resultFor(operation: McfLedgerToolName): Record<string, unknown> {
  if (operation === 'ler_diario') {
    return { estado: 'ok', degradado: false, eventos: [event()], lacunas: [] };
  }
  if (operation === 'buscar_eventos') {
    return {
      estado: 'ok',
      degradado: true,
      eventos: [event()],
      lacunas: [],
      ranking: [
        {
          evento_id: 'ec-lab-001',
          score_total: 0.5,
          score_textual: 0.4,
          score_semantico: 0,
          score_recencia: 1,
        },
      ],
    };
  }
  if (operation === 'recuperar_contexto') {
    return {
      estado: 'conflito_de_contexto',
      degradado: true,
      eventos: [event()],
      decisoes: ['usar leitura antes de escrita'],
      hipoteses: ['texto atende ao laboratório'],
      questoes_abertas: ['como calibrar ranking?'],
      proximos_passos: ['validar MCF'],
      lacunas: [],
      conflitos: [{ origem: 'ec-lab-002', destino: 'ec-lab-001', tipo: 'revisa' }],
    };
  }
  throw new Error(`unsupported test operation: ${operation satisfies never}`);
}

function client(overrides: Partial<McfLedgerMcpClient> = {}): McfLedgerMcpClient {
  return {
    connect: vi.fn().mockResolvedValue(undefined),
    listTools: vi.fn().mockResolvedValue({ tools: tools() }),
    callTool: vi.fn(async ({ name }) => ({ structuredContent: resultFor(name) })),
    close: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function factory(value: McfLedgerMcpClient): McfLedgerMcpClientFactory {
  return vi.fn(() => value);
}

describe('Cognitive Ledger read-only configuration', () => {
  it('stays disabled unless URL, separate Bearer, ingress token and bounds are valid', () => {
    const invalidEnvironments = [
      {},
      environment({ MCF_COGNITIVE_LEDGER_MCP_URL: undefined }),
      environment({ MCF_COGNITIVE_LEDGER_INGRESS_TOKEN: undefined }),
      environment({ MCF_COGNITIVE_LEDGER_INGRESS_TOKEN: contextToken }),
      environment({ MCF_COGNITIVE_LEDGER_INGRESS_TOKEN: bearerToken }),
      environment({ MCF_COGNITIVE_LEDGER_BEARER_TOKEN: ingressToken }),
      environment({ MCF_COGNITIVE_LEDGER_BEARER_TOKEN: 'short' }),
      environment({ MCF_COGNITIVE_LEDGER_BEARER_TOKEN: `${bearerToken}\n` }),
      environment({ MCF_COGNITIVE_LEDGER_MCP_URL: 'http://ledger.example/mcp' }),
      environment({ MCF_COGNITIVE_LEDGER_MCP_URL: 'http://localhost:33100/mcp' }),
      environment({
        NODE_ENV: 'production',
        MCF_COGNITIVE_LEDGER_MCP_URL: 'http://127.0.0.1:33100/mcp',
      }),
      environment({ MCF_COGNITIVE_LEDGER_MCP_URL: 'https://user@ledger.example/mcp' }),
      environment({ MCF_COGNITIVE_LEDGER_MCP_URL: 'https://ledger.example/mcp?token=bad' }),
      environment({ MCF_COGNITIVE_LEDGER_MCP_URL: 'https://ledger.example/mcp#fragment' }),
      environment({ MCF_COGNITIVE_LEDGER_MCP_URL: 'https://ledger.example/other' }),
      environment({ MCF_COGNITIVE_LEDGER_TIMEOUT_MS: '15100' }),
      environment({ MCF_COGNITIVE_LEDGER_INPUT_LIMIT_BYTES: '32769' }),
      environment({ MCF_COGNITIVE_LEDGER_RESPONSE_LIMIT_BYTES: '1048577' }),
    ];
    for (const env of invalidEnvironments) {
      expect(loadMcfLedgerReadConfiguration(env)).toBeNull();
    }
  });

  it('allows loopback HTTP only in dev/test and requires HTTPS elsewhere', () => {
    expect(loadMcfLedgerReadConfiguration(environment())?.endpoint.href).toBe(
      'http://127.0.0.1:33100/mcp',
    );
    expect(
      loadMcfLedgerReadConfiguration(
        environment({
          NODE_ENV: 'production',
          MCF_COGNITIVE_LEDGER_MCP_URL: 'https://ledger.example/mcp',
        }),
      )?.endpoint.href,
    ).toBe('https://ledger.example/mcp');
  });
});

describe('McfLedgerReadApiService', () => {
  it.each<{
    operation: McfLedgerToolName;
    input: Record<string, unknown>;
  }>([
    { operation: 'ler_diario', input: { limite: 2 } },
    { operation: 'buscar_eventos', input: { texto: 'busca textual', limite: 2 } },
    {
      operation: 'recuperar_contexto',
      input: { objetivo: 'retomar integração', assuntos: ['custo zero'] },
    },
  ])('calls only the annotated read-only tool $operation without persistence', async (query) => {
    const mcp = client();
    const service = new McfLedgerReadApiService(configuration(), factory(mcp));

    const response = await service.queryReadOnly(query);

    expect(response).toEqual({
      schema_version: 1,
      provider_project_id: 'cognitive-ledger',
      operation: query.operation,
      read_only: true,
      memory_payload_persisted_by_mcf: false,
      result: resultFor(query.operation),
    });
    expect(mcp.callTool).toHaveBeenCalledWith({
      name: query.operation,
      arguments: query.input,
    });
    expect(mcp.close).toHaveBeenCalledOnce();
  });

  it.each([
    { operation: 'apagar_eventos', input: {} },
    { operation: 'buscar_eventos', input: { texto: '' } },
    { operation: 'buscar_eventos', input: { texto: ' válido com espaço externo ' } },
    { operation: 'ler_diario', input: { limite: 13 } },
    { operation: 'ler_diario', input: { desconhecido: true } },
    {
      operation: 'ler_fonte_bruta',
      input: { evento_id: 'ec-lab-001', justificativa: 'mesmo completa deve ser proibida' },
    },
  ])('rejects malformed or unknown queries before connecting: %j', async (query) => {
    const mcp = client();
    const service = new McfLedgerReadApiService(configuration(), factory(mcp));

    await expect(service.queryReadOnly(query)).rejects.toBeInstanceOf(McfLedgerQueryInvalidError);
    expect(mcp.connect).not.toHaveBeenCalled();
  });

  it('enforces the aggregate input byte limit before connecting', async () => {
    const mcp = client();
    const service = new McfLedgerReadApiService(
      configuration({ inputLimitBytes: 1024 }),
      factory(mcp),
    );
    await expect(
      service.queryReadOnly({
        operation: 'buscar_eventos',
        input: { texto: 'x'.repeat(2000) },
      }),
    ).rejects.toBeInstanceOf(McfLedgerQueryInvalidError);
    expect(mcp.connect).not.toHaveBeenCalled();
  });

  it('treats non-JSON top-level values as invalid queries instead of provider failures', async () => {
    const mcp = client();
    const service = new McfLedgerReadApiService(configuration(), factory(mcp));
    for (const value of [undefined, () => undefined, Symbol('non-json')]) {
      await expect(service.queryReadOnly(value)).rejects.toBeInstanceOf(McfLedgerQueryInvalidError);
    }
    expect(mcp.connect).not.toHaveBeenCalled();
  });

  it.each([
    {
      providerTools: [
        ...tools(),
        { name: 'escrever_evento', annotations: tools()[0]?.annotations },
      ],
    },
    { providerTools: tools().filter(({ name }) => name !== 'ler_fonte_bruta') },
    {
      providerTools: tools().map((tool, index) =>
        index === 0
          ? { ...tool, annotations: { ...tool.annotations, destructiveHint: true } }
          : tool,
      ),
    },
    {
      providerTools: tools().map((tool, index) =>
        index === 0
          ? { ...tool, annotations: { ...tool.annotations, idempotentHint: false } }
          : tool,
      ),
    },
  ])(
    'fails closed when provider tool inventory or annotations drift',
    async ({ providerTools }) => {
      const service = new McfLedgerReadApiService(
        configuration(),
        factory(client({ listTools: vi.fn().mockResolvedValue({ tools: providerTools }) })),
      );
      await expect(
        service.queryReadOnly({ operation: 'ler_diario', input: {} }),
      ).rejects.toBeInstanceOf(McfLedgerReadUnavailableError);
    },
  );

  it('does not echo an upstream token or memory fragment in failures', async () => {
    const privateFragment = 'conteudo privado que nao pode escapar';
    const service = new McfLedgerReadApiService(
      configuration(),
      factory(
        client({
          callTool: vi.fn().mockRejectedValue(new Error(`${bearerToken}:${privateFragment}`)),
        }),
      ),
    );
    const error = await service
      .queryReadOnly({ operation: 'ler_diario', input: {} })
      .catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(McfLedgerReadUnavailableError);
    expect(String(error)).not.toContain(bearerToken);
    expect(String(error)).not.toContain(privateFragment);
  });

  it.each([
    { estado: 'ok' },
    { ...resultFor('ler_diario'), campo_injetado: 'não repassar' },
    {
      ...resultFor('ler_diario'),
      eventos: [{ ...event(), campo_injetado: 'não repassar' }],
    },
    {
      ...resultFor('ler_diario'),
      eventos: Array.from({ length: 13 }, () => event()),
    },
    {
      ...resultFor('ler_diario'),
      eventos: [event({ titulo: 'x'.repeat(32_769) })],
    },
  ])('rejects arbitrary, deep or over-bounded structured content', async (structuredContent) => {
    const service = new McfLedgerReadApiService(
      configuration(),
      factory(client({ callTool: vi.fn().mockResolvedValue({ structuredContent }) })),
    );
    await expect(
      service.queryReadOnly({ operation: 'ler_diario', input: {} }),
    ).rejects.toBeInstanceOf(McfLedgerReadUnavailableError);
  });

  it('fails closed on tool errors, missing structured data and oversized responses', async () => {
    const cases = [
      { isError: true, structuredContent: { erro: 'owner_negado' } },
      { content: [{ type: 'text', text: 'memory-only-shape' }] },
      {
        structuredContent: {
          ...resultFor('ler_diario'),
          eventos: [event({ titulo: 'x'.repeat(5000) })],
        },
      },
    ];
    for (const result of cases) {
      const service = new McfLedgerReadApiService(
        configuration({ responseLimitBytes: 4096 }),
        factory(client({ callTool: vi.fn().mockResolvedValue(result) })),
      );
      await expect(
        service.queryReadOnly({ operation: 'ler_diario', input: {} }),
      ).rejects.toBeInstanceOf(McfLedgerReadUnavailableError);
    }
  });

  it('remains disabled by default', async () => {
    await expect(
      new McfLedgerReadApiService(null).queryReadOnly({ operation: 'ler_diario', input: {} }),
    ).rejects.toBeInstanceOf(McfLedgerReadUnavailableError);
  });

  it('enforces one aggregate deadline across connect, inventory and call', async () => {
    const wait = (milliseconds: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
    let observedSignal: AbortSignal | undefined;
    const mcp = client({
      connect: vi.fn(async () => wait(140)),
      listTools: vi.fn(async () => {
        await wait(140);
        return { tools: tools() };
      }),
    });
    const service = new McfLedgerReadApiService(
      configuration({ timeoutMs: 250 }),
      vi.fn((_configuration, signal) => {
        observedSignal = signal;
        return mcp;
      }),
    );

    await expect(
      service.queryReadOnly({ operation: 'ler_diario', input: {} }),
    ).rejects.toBeInstanceOf(McfLedgerReadUnavailableError);
    expect(observedSignal?.aborted).toBe(true);
    expect(mcp.callTool).not.toHaveBeenCalled();
    expect(mcp.close).toHaveBeenCalledOnce();
  });

  it('bounds close even when the provider client never settles', async () => {
    const mcp = client({ close: vi.fn(() => new Promise<void>(() => undefined)) });
    const service = new McfLedgerReadApiService(configuration({ timeoutMs: 250 }), factory(mcp));
    const startedAt = Date.now();
    await expect(
      service.queryReadOnly({ operation: 'ler_diario', input: {} }),
    ).resolves.toMatchObject({ operation: 'ler_diario' });
    expect(Date.now() - startedAt).toBeLessThan(1_000);
  });
});

describe('bounded MCP network transport', () => {
  it('refuses any URL or method outside the exact POST /mcp provider boundary', async () => {
    const baseFetch = vi.fn<FetchLike>();
    const bounded = createBoundedMcpFetch(configuration(), baseFetch);
    await expect(
      bounded('http://127.0.0.1:33100/other', { method: 'POST' }),
    ).rejects.toBeInstanceOf(McfLedgerReadUnavailableError);
    await expect(bounded('http://127.0.0.1:33100/mcp', { method: 'GET' })).rejects.toBeInstanceOf(
      McfLedgerReadUnavailableError,
    );
    expect(baseFetch).not.toHaveBeenCalled();
  });

  it('bounds each upstream response before the SDK can parse it', async () => {
    const baseFetch: FetchLike = vi.fn().mockResolvedValue(
      new Response('private'.repeat(1000), {
        headers: { 'content-type': 'application/json' },
      }),
    );
    const bounded = createBoundedMcpFetch(configuration({ responseLimitBytes: 4096 }), baseFetch);
    await expect(
      bounded('http://127.0.0.1:33100/mcp', { method: 'POST', body: '{}' }),
    ).rejects.toBeInstanceOf(McfLedgerReadUnavailableError);
  });

  it('aborts a stalled provider at the configured timeout', async () => {
    const baseFetch: FetchLike = (_url, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener(
          'abort',
          () => reject(new Error('aborted-without-sensitive-details')),
          { once: true },
        );
      });
    const bounded = createBoundedMcpFetch(configuration({ timeoutMs: 250 }), baseFetch);
    await expect(
      bounded('http://127.0.0.1:33100/mcp', {
        method: 'POST',
        body: JSON.stringify({ jsonrpc: '2.0' }),
      }),
    ).rejects.toBeInstanceOf(McfLedgerReadUnavailableError);
  });

  it('bounds serialized MCP requests including protocol overhead', async () => {
    const baseFetch = vi.fn<FetchLike>();
    const bounded = createBoundedMcpFetch(configuration({ inputLimitBytes: 1024 }), baseFetch);
    await expect(
      bounded('http://127.0.0.1:33100/mcp', {
        method: 'POST',
        body: 'x'.repeat(1024 + 16_385),
      }),
    ).rejects.toBeInstanceOf(McfLedgerReadUnavailableError);
    expect(baseFetch).not.toHaveBeenCalled();
  });

  it.each([
    new Uint8Array([123, 125]),
    new URLSearchParams({ jsonrpc: '2.0' }),
    new Blob(['{}'], { type: 'application/json' }),
  ])('rejects non-string outbound BodyInit before the network call', async (body) => {
    const baseFetch = vi.fn<FetchLike>();
    const bounded = createBoundedMcpFetch(configuration(), baseFetch);
    await expect(
      bounded('http://127.0.0.1:33100/mcp', { method: 'POST', body }),
    ).rejects.toBeInstanceOf(McfLedgerReadUnavailableError);
    expect(baseFetch).not.toHaveBeenCalled();
  });

  it('returns a bounded response intact when it is within the limit', async () => {
    const body = JSON.stringify({ estado: 'ok' });
    const baseFetch: FetchLike = vi
      .fn()
      .mockResolvedValue(
        new Response(body, { status: 200, headers: { 'content-type': 'application/json' } }),
      );
    const response = await createBoundedMcpFetch(configuration(), baseFetch)(
      'http://127.0.0.1:33100/mcp',
      { method: 'POST', body: '{}' },
    );
    expect(await response.text()).toBe(body);
    expect(Buffer.byteLength(body)).toBeLessThan(262_144);
  });
});
