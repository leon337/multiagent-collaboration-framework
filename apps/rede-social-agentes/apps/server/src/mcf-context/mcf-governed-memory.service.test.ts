import { createHash } from 'node:crypto';

import { describe, expect, it, vi } from 'vitest';

import {
  McfGovernedMemoryDeniedError,
  McfGovernedMemoryService,
} from './mcf-governed-memory.service.js';
import type {
  McfLedgerMemoryInspection,
  McfLedgerMemoryInput,
  McfLedgerMemoryTransportService,
  McfLedgerMemoryWriteResponse,
} from './mcf-ledger-memory-transport.service.js';
import { McfMemoryPolicyService } from './mcf-memory-policy.service.js';

function event(
  id: string,
  scope = 'project:mcf',
  overrides: Record<string, unknown> = {},
) {
  return {
    id,
    timestamp: '2026-09-22T20:00:00-03:00',
    tipo: 'decisao',
    status: 'ativo',
    titulo: `Evento ${id}`,
    resumo: `Resumo ${id}`,
    contexto: 'MCF synthetic test',
    projetos: ['MCF'],
    assuntos: ['memoria'],
    ideias: [],
    decisoes: [],
    hipoteses: [],
    questoes_abertas: [],
    proximos_passos: [],
    metadados: { memory_scope: scope },
    ...overrides,
  };
}

type Relation = McfLedgerMemoryInspection['relacoes'][number];

class FakeTransport {
  readonly memories = new Map<string, McfLedgerMemoryInspection>();
  readonly registerExplicit = vi.fn(
    async (input: McfLedgerMemoryInput): Promise<McfLedgerMemoryWriteResponse> => {
      const origin = input.evento.id;
      const relations: Relation[] = (input.relacoes ?? []).map((relation) => ({
        evento_origem_id: origin,
        evento_destino_id: relation.evento_destino_id,
        tipo: relation.tipo,
        rotulo: relation.rotulo,
      }));
      const current = this.memories.get(origin);
      if (current) {
        const comparable = JSON.stringify(current.evento);
        if (comparable !== JSON.stringify(input.evento)) {
          throw new Error('incompatible collision');
        }
      } else {
        this.memories.set(origin, { evento: input.evento, relacoes: [] });
      }
      const originMemory = this.memories.get(origin)!;
      for (const relation of relations) {
        const key = `${relation.evento_origem_id}|${relation.evento_destino_id}|${relation.tipo}`;
        if (
          !originMemory.relacoes.some(
            (candidate) =>
              `${candidate.evento_origem_id}|${candidate.evento_destino_id}|${candidate.tipo}` ===
              key,
          )
        ) {
          originMemory.relacoes.push(relation);
        }
        const target = this.memories.get(relation.evento_destino_id);
        if (target && !target.relacoes.some((candidate) => candidate === relation)) {
          target.relacoes.push(relation);
        }
      }
      const eventHash = createHash('sha256')
        .update(JSON.stringify(input.evento))
        .digest('hex');
      return {
        schema_version: 1,
        provider_project_id: 'cognitive-ledger',
        operation: 'registrar_memoria',
        explicit_confirmation: true,
        memory_payload_persisted_by_mcf: false,
        receipt: {
          schema: 'cognitive_ledger_memory_receipt/v1',
          operacao: 'registrar_memoria',
          evento_id: origin,
          provider_status: current ? 'existente' : 'criado',
          read_back: 'verified',
          event_sha256: eventHash,
          receipt_sha256: 'b'.repeat(64),
        },
      };
    },
  );

  readonly inspect = vi.fn(async (id: string, scope: string) => {
    const memory = this.memories.get(id);
    if (!memory) throw new Error('not found');
    if (memory.evento.metadados.memory_scope !== scope) throw new Error('scope');
    return structuredClone(memory);
  });

  seed(id: string, scope = 'project:mcf', relations: Relation[] = []) {
    this.memories.set(id, { evento: event(id, scope), relacoes: [...relations] });
  }
}

function service(
  transport: FakeTransport,
  rules: ConstructorParameters<typeof McfMemoryPolicyService>[0]['rules'] = [],
) {
  return new McfGovernedMemoryService(
    transport as unknown as McfLedgerMemoryTransportService,
    new McfMemoryPolicyService({ version: 'memory-policy/v1', rules }),
  );
}

describe('governed scoped read and current-state resolver', () => {
  it('reads only when the returned event belongs to the requested scope', async () => {
    const transport = new FakeTransport();
    transport.seed('evt-1');
    await expect(service(transport).readScoped('evt-1', 'project:mcf')).resolves.toMatchObject({
      evento: { id: 'evt-1' },
    });
    await expect(service(transport).readScoped('evt-1', 'project:other')).rejects.toBeInstanceOf(
      McfGovernedMemoryDeniedError,
    );
  });

  it('resolves current, superseded and conflicting supersession forks deterministically', async () => {
    const currentTransport = new FakeTransport();
    currentTransport.seed('a1');
    await expect(service(currentTransport).resolveState('a1', 'project:mcf')).resolves.toMatchObject({
      status: 'CURRENT',
      eventId: 'a1',
    });

    const superseded = new FakeTransport();
    superseded.seed('a1', 'project:mcf', [
      {
        evento_origem_id: 'a2',
        evento_destino_id: 'a1',
        tipo: 'SUPERSEDES',
      },
    ]);
    superseded.seed('a2', 'project:mcf', [
      {
        evento_origem_id: 'a2',
        evento_destino_id: 'a1',
        tipo: 'SUPERSEDES',
      },
    ]);
    await expect(service(superseded).resolveState('a1', 'project:mcf')).resolves.toMatchObject({
      status: 'SUPERSEDED',
      successors: ['a2'],
    });

    superseded.memories.get('a1')!.relacoes.push({
      evento_origem_id: 'a3',
      evento_destino_id: 'a1',
      tipo: 'SUPERSEDES',
    });
    superseded.seed('a3', 'project:mcf', [
      {
        evento_origem_id: 'a3',
        evento_destino_id: 'a1',
        tipo: 'SUPERSEDES',
      },
    ]);
    await expect(service(superseded).resolveState('a1', 'project:mcf')).resolves.toMatchObject({
      status: 'CONFLICTED',
      successors: ['a2', 'a3'],
    });
  });

  it('treats an unresolved contradiction as conflict without converting it to supersession', async () => {
    const transport = new FakeTransport();
    transport.seed('claim-a', 'project:mcf', [
      {
        evento_origem_id: 'conflict-1',
        evento_destino_id: 'claim-a',
        tipo: 'CONFLICTS_WITH',
      },
    ]);
    transport.seed('conflict-1', 'project:mcf', [
      {
        evento_origem_id: 'conflict-1',
        evento_destino_id: 'claim-a',
        tipo: 'CONFLICTS_WITH',
      },
    ]);

    const state = await service(transport).resolveState('claim-a', 'project:mcf');
    expect(state.status).toBe('CONFLICTED');
    expect(state.successors).toEqual([]);
  });

  it('marks a propagated derivative stale when its source is superseded', async () => {
    const transport = new FakeTransport();
    transport.seed('source-a1', 'project:mcf', [
      {
        evento_origem_id: 'source-a2',
        evento_destino_id: 'source-a1',
        tipo: 'SUPERSEDES',
      },
    ]);
    transport.seed('source-a2');
    transport.seed('target-b1', 'mission:316', [
      {
        evento_origem_id: 'target-b1',
        evento_destino_id: 'source-a1',
        tipo: 'PROPAGATED_FROM',
      },
    ]);

    await expect(service(transport).resolveState('target-b1', 'mission:316')).resolves.toMatchObject({
      status: 'STALE',
      staleBecause: 'source-a1',
    });
  });
});

describe('memory.supersede', () => {
  it('creates an append-only replacement with SUPERSEDES and preserves the old event', async () => {
    const transport = new FakeTransport();
    transport.seed('a1');
    const governed = service(transport);

    const result = await governed.supersede({
      sourceEventId: 'a1',
      memoryScope: 'project:mcf',
      replacement: event('a2'),
    });

    expect(result.operation).toBe('supersede');
    expect(transport.memories.has('a1')).toBe(true);
    expect(transport.memories.has('a2')).toBe(true);
    expect(transport.registerExplicit).toHaveBeenCalledWith(
      expect.objectContaining({
        confirmacao_explicita: true,
        evento: expect.objectContaining({ id: 'a2' }),
        relacoes: [
          expect.objectContaining({ evento_destino_id: 'a1', tipo: 'SUPERSEDES' }),
        ],
      }),
    );
    await expect(governed.resolveState('a1', 'project:mcf')).resolves.toMatchObject({
      status: 'SUPERSEDED',
    });
  });

  it('denies self-supersession and cross-scope replacement', async () => {
    const transport = new FakeTransport();
    transport.seed('a1');
    const governed = service(transport);

    await expect(
      governed.supersede({
        sourceEventId: 'a1',
        memoryScope: 'project:mcf',
        replacement: event('a1'),
      }),
    ).rejects.toBeInstanceOf(McfGovernedMemoryDeniedError);
    await expect(
      governed.supersede({
        sourceEventId: 'a1',
        memoryScope: 'project:mcf',
        replacement: event('a2', 'project:other'),
      }),
    ).rejects.toBeInstanceOf(McfGovernedMemoryDeniedError);
  });
});

describe('contradiction lifecycle', () => {
  it('records contradiction as a separate marker and never as SUPERSEDES', async () => {
    const transport = new FakeTransport();
    transport.seed('claim-a');
    transport.seed('claim-b');
    const governed = service(transport);

    const result = await governed.registerContradiction({
      leftEventId: 'claim-a',
      rightEventId: 'claim-b',
      memoryScope: 'project:mcf',
      detectedAt: '2026-09-22T21:00:00-03:00',
    });

    expect(result.operation).toBe('contradiction_detected');
    const call = transport.registerExplicit.mock.calls.at(-1)?.[0];
    expect(call?.relacoes?.map((relation) => relation.tipo)).toEqual([
      'CONFLICTS_WITH',
      'CONFLICTS_WITH',
    ]);
    expect(JSON.stringify(call)).not.toContain('SUPERSEDES');
    await expect(governed.resolveState('claim-a', 'project:mcf')).resolves.toMatchObject({
      status: 'CONFLICTED',
    });
  });

  it('resolves a contradiction by superseding the conflict marker, preserving both claims', async () => {
    const transport = new FakeTransport();
    transport.seed('claim-a');
    transport.seed('claim-b');
    const governed = service(transport);
    const detected = await governed.registerContradiction({
      leftEventId: 'claim-a',
      rightEventId: 'claim-b',
      memoryScope: 'project:mcf',
      detectedAt: '2026-09-22T21:00:00-03:00',
    });

    await governed.resolveContradiction({
      conflictEventId: detected.eventId,
      memoryScope: 'project:mcf',
      resolution: event('conflict-resolution-1', 'project:mcf', {
        tipo: 'resolucao_contradicao',
      }),
    });

    expect(transport.memories.has('claim-a')).toBe(true);
    expect(transport.memories.has('claim-b')).toBe(true);
    await expect(governed.resolveState('claim-a', 'project:mcf')).resolves.toMatchObject({
      status: 'CURRENT',
    });
  });
});

describe('memory.propagate', () => {
  it('denies without an explicit policy rule and performs zero provider mutation', async () => {
    const transport = new FakeTransport();
    transport.seed('source-a1');
    const governed = service(transport);

    const result = await governed.propagate({
      sourceEventId: 'source-a1',
      sourceScope: 'project:mcf',
      targetScope: 'mission:316',
      targetEventId: 'target-b1',
      propagatedAt: '2026-09-22T21:30:00-03:00',
      reason: 'mission context',
    });

    expect(result).toMatchObject({
      operation: 'propagate',
      status: 'DENIED',
      policyVersion: 'memory-policy/v1',
    });
    expect(transport.registerExplicit).not.toHaveBeenCalled();
  });

  it('propagates only under an exact allow rule and records policy + provenance', async () => {
    const transport = new FakeTransport();
    transport.seed('source-a1');
    const governed = service(transport, [
      {
        operation: 'propagate',
        sourceScope: 'project:mcf',
        targetScope: 'mission:316',
        effect: 'allow',
      },
    ]);

    const result = await governed.propagate({
      sourceEventId: 'source-a1',
      sourceScope: 'project:mcf',
      targetScope: 'mission:316',
      targetEventId: 'target-b1',
      propagatedAt: '2026-09-22T21:30:00-03:00',
      reason: 'mission context',
    });

    expect(result).toMatchObject({
      operation: 'propagate',
      status: 'PROPAGATED',
      policyVersion: 'memory-policy/v1',
      eventId: 'target-b1',
    });
    const call = transport.registerExplicit.mock.calls.at(-1)?.[0];
    expect(call?.fontes).toEqual([]);
    expect(call?.evento.metadados).toMatchObject({
      memory_scope: 'mission:316',
      source_event_id: 'source-a1',
      source_scope: 'project:mcf',
      policy_version: 'memory-policy/v1',
      propagation_mode: 'MARK_STALE',
    });
    expect(call?.relacoes).toEqual([
      expect.objectContaining({
        evento_destino_id: 'source-a1',
        tipo: 'PROPAGATED_FROM',
      }),
    ]);
  });
});
