import { createHash } from 'node:crypto';

import type {
  McfLedgerMemoryInput,
  McfLedgerMemoryInspection,
  McfLedgerMemoryReceipt,
  McfLedgerMemoryTransportService,
} from './mcf-ledger-memory-transport.service.js';
import { McfMemoryPolicyService } from './mcf-memory-policy.service.js';

export type McfGovernedMemoryState =
  | 'CURRENT'
  | 'SUPERSEDED'
  | 'CONFLICTED'
  | 'STALE'
  | 'HISTORICAL';

export class McfGovernedMemoryDeniedError extends Error {
  constructor(message = 'Governed memory operation denied.') {
    super(message);
    this.name = 'McfGovernedMemoryDeniedError';
  }
}

export interface McfGovernedMemoryStateResult {
  eventId: string;
  status: McfGovernedMemoryState;
  successors: string[];
  staleBecause?: string;
}

type MemoryEvent = McfLedgerMemoryInput['evento'];
type MemoryRelation = McfLedgerMemoryInspection['relacoes'][number];

function memoryScope(event: MemoryEvent): string | null {
  const value = event.metadados.memory_scope;
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function relationOrigin(relation: MemoryRelation): string | null {
  return typeof relation.evento_origem_id === 'string' &&
      relation.evento_origem_id.trim().length > 0
    ? relation.evento_origem_id
    : null;
}

function incoming(
  relations: readonly MemoryRelation[],
  targetId: string,
  type: string,
): string[] {
  return [
    ...new Set(
      relations
        .filter(
          (relation) =>
            relation.tipo === type && relation.evento_destino_id === targetId,
        )
        .map(relationOrigin)
        .filter((value): value is string => value !== null),
    ),
  ].sort();
}

function outgoingTarget(
  relations: readonly MemoryRelation[],
  originId: string,
  type: string,
): string[] {
  return [
    ...new Set(
      relations
        .filter(
          (relation) =>
            relation.tipo === type && relationOrigin(relation) === originId,
        )
        .map((relation) => relation.evento_destino_id),
    ),
  ].sort();
}

function historicalStatus(status: string | undefined): boolean {
  if (!status) return false;
  return ['historico', 'historical', 'inativo', 'invalidado', 'superseded'].includes(
    status.toLowerCase(),
  );
}

function contradictionId(scope: string, left: string, right: string): string {
  const digest = createHash('sha256')
    .update(`${scope}\0${left}\0${right}`)
    .digest('hex')
    .slice(0, 32);
  return `mcf-conflict-${digest}`;
}

export class McfGovernedMemoryService {
  constructor(
    private readonly transport: McfLedgerMemoryTransportService,
    private readonly policy: McfMemoryPolicyService,
  ) {}

  async readScoped(
    eventId: string,
    scope: string,
  ): Promise<McfLedgerMemoryInspection> {
    try {
      const memory = await this.transport.inspect(eventId, scope);
      if (memoryScope(memory.evento) !== scope) {
        throw new McfGovernedMemoryDeniedError();
      }
      return memory;
    } catch (error) {
      if (error instanceof McfGovernedMemoryDeniedError) throw error;
      throw new McfGovernedMemoryDeniedError();
    }
  }

  async resolveState(
    eventId: string,
    scope: string,
  ): Promise<McfGovernedMemoryStateResult> {
    const memory = await this.readScoped(eventId, scope);
    const successors = incoming(memory.relacoes, eventId, 'SUPERSEDES');
    if (successors.length > 1) {
      return { eventId, status: 'CONFLICTED', successors };
    }
    if (successors.length === 1) {
      return { eventId, status: 'SUPERSEDED', successors };
    }

    const conflictMarkers = incoming(memory.relacoes, eventId, 'CONFLICTS_WITH');
    for (const markerId of conflictMarkers) {
      let marker: McfLedgerMemoryInspection;
      try {
        marker = await this.readScoped(markerId, scope);
      } catch {
        return { eventId, status: 'CONFLICTED', successors: [] };
      }
      if (incoming(marker.relacoes, markerId, 'SUPERSEDES').length === 0) {
        return { eventId, status: 'CONFLICTED', successors: [] };
      }
    }

    const propagatedSources = outgoingTarget(
      memory.relacoes,
      eventId,
      'PROPAGATED_FROM',
    );
    if (propagatedSources.length > 0) {
      const sourceScope = memory.evento.metadados.source_scope;
      if (typeof sourceScope !== 'string' || sourceScope.trim().length === 0) {
        return { eventId, status: 'STALE', successors: [], staleBecause: propagatedSources[0] };
      }
      for (const sourceId of propagatedSources) {
        try {
          const source = await this.readScoped(sourceId, sourceScope);
          if (incoming(source.relacoes, sourceId, 'SUPERSEDES').length > 0) {
            return {
              eventId,
              status: 'STALE',
              successors: [],
              staleBecause: sourceId,
            };
          }
        } catch {
          return {
            eventId,
            status: 'STALE',
            successors: [],
            staleBecause: sourceId,
          };
        }
      }
    }

    if (historicalStatus(memory.evento.status)) {
      return { eventId, status: 'HISTORICAL', successors: [] };
    }
    return { eventId, status: 'CURRENT', successors: [] };
  }

  async supersede(input: {
    sourceEventId: string;
    memoryScope: string;
    replacement: MemoryEvent;
  }): Promise<{
    operation: 'supersede';
    eventId: string;
    sourceEventId: string;
    receipt: McfLedgerMemoryReceipt;
  }> {
    if (
      input.sourceEventId === input.replacement.id ||
      memoryScope(input.replacement) !== input.memoryScope
    ) {
      throw new McfGovernedMemoryDeniedError();
    }

    await this.readScoped(input.sourceEventId, input.memoryScope);
    const state = await this.resolveState(input.sourceEventId, input.memoryScope);
    if (state.status !== 'CURRENT') {
      throw new McfGovernedMemoryDeniedError(
        'Only a current memory can be superseded.',
      );
    }

    const response = await this.transport.registerExplicit({
      confirmacao_explicita: true,
      evento: input.replacement,
      fontes: [],
      relacoes: [
        {
          evento_destino_id: input.sourceEventId,
          tipo: 'SUPERSEDES',
          rotulo: 'governed-memory-supersession',
        },
      ],
    });
    return {
      operation: 'supersede',
      eventId: input.replacement.id,
      sourceEventId: input.sourceEventId,
      receipt: response.receipt,
    };
  }

  async registerContradiction(input: {
    leftEventId: string;
    rightEventId: string;
    memoryScope: string;
    detectedAt: string;
  }): Promise<{
    operation: 'contradiction_detected';
    eventId: string;
    receipt: McfLedgerMemoryReceipt;
  }> {
    if (input.leftEventId === input.rightEventId) {
      throw new McfGovernedMemoryDeniedError();
    }
    await this.readScoped(input.leftEventId, input.memoryScope);
    await this.readScoped(input.rightEventId, input.memoryScope);

    const [left, right] = [input.leftEventId, input.rightEventId].sort();
    const eventId = contradictionId(input.memoryScope, left, right);
    const response = await this.transport.registerExplicit({
      confirmacao_explicita: true,
      evento: {
        id: eventId,
        timestamp: input.detectedAt,
        tipo: 'contradicao',
        status: 'nao_resolvida',
        titulo: 'Contradição cognitiva detectada',
        resumo: 'Duas memórias governadas foram marcadas como conflitantes.',
        contexto: 'Governed Shared Memory',
        projetos: [],
        assuntos: ['memory-contradiction'],
        ideias: [],
        decisoes: [],
        hipoteses: [],
        questoes_abertas: ['Resolver contradição explicitamente.'],
        proximos_passos: [],
        metadados: {
          memory_scope: input.memoryScope,
          contradiction_status: 'UNRESOLVED',
          left_event_id: left,
          right_event_id: right,
        },
      },
      fontes: [],
      relacoes: [
        {
          evento_destino_id: left,
          tipo: 'CONFLICTS_WITH',
          rotulo: 'contradiction-left',
        },
        {
          evento_destino_id: right,
          tipo: 'CONFLICTS_WITH',
          rotulo: 'contradiction-right',
        },
      ],
    });
    return {
      operation: 'contradiction_detected',
      eventId,
      receipt: response.receipt,
    };
  }

  async resolveContradiction(input: {
    conflictEventId: string;
    memoryScope: string;
    resolution: MemoryEvent;
  }): Promise<{
    operation: 'contradiction_resolved';
    eventId: string;
    conflictEventId: string;
    receipt: McfLedgerMemoryReceipt;
  }> {
    const result = await this.supersede({
      sourceEventId: input.conflictEventId,
      memoryScope: input.memoryScope,
      replacement: input.resolution,
    });
    return {
      operation: 'contradiction_resolved',
      eventId: result.eventId,
      conflictEventId: input.conflictEventId,
      receipt: result.receipt,
    };
  }

  async propagate(input: {
    sourceEventId: string;
    sourceScope: string;
    targetScope: string;
    targetEventId: string;
    propagatedAt: string;
    reason: string;
  }): Promise<
    | {
        operation: 'propagate';
        status: 'DENIED';
        policyVersion: string;
        reason: string;
      }
    | {
        operation: 'propagate';
        status: 'PROPAGATED';
        policyVersion: string;
        eventId: string;
        receipt: McfLedgerMemoryReceipt;
      }
  > {
    const decision = this.policy.evaluate({
      operation: 'propagate',
      sourceScope: input.sourceScope,
      targetScope: input.targetScope,
    });
    if (!decision.allowed) {
      return {
        operation: 'propagate',
        status: 'DENIED',
        policyVersion: decision.policyVersion,
        reason: decision.reason,
      };
    }

    const source = await this.readScoped(input.sourceEventId, input.sourceScope);
    const response = await this.transport.registerExplicit({
      confirmacao_explicita: true,
      evento: {
        ...source.evento,
        id: input.targetEventId,
        timestamp: input.propagatedAt,
        metadados: {
          ...source.evento.metadados,
          memory_scope: input.targetScope,
          source_event_id: input.sourceEventId,
          source_scope: input.sourceScope,
          policy_version: decision.policyVersion,
          propagation_mode: 'MARK_STALE',
          propagation_reason: input.reason,
        },
      },
      fontes: [],
      relacoes: [
        {
          evento_destino_id: input.sourceEventId,
          tipo: 'PROPAGATED_FROM',
          rotulo: 'governed-memory-propagation',
        },
      ],
    });
    return {
      operation: 'propagate',
      status: 'PROPAGATED',
      policyVersion: decision.policyVersion,
      eventId: input.targetEventId,
      receipt: response.receipt,
    };
  }
}
