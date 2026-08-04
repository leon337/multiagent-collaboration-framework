import type { McfEventType } from '@rsa/contracts';
import type { DatabaseRow } from '@rsa/database';

import type { DatabaseService } from '../database.service.js';
import { McfMissionNotFoundError } from './mcf-runtime.errors.js';
import type {
  CompleteMcfPendingPhaseInput,
  CompleteMcfPendingPhaseResult,
  CreateMcfMissionInput,
  McfEventRecord,
  McfMissionRecord,
  McfPhaseRecord,
  McfRuntimeRepository,
  PersistMcfExecutionInput,
} from './mcf-runtime.repository.js';

interface OrderedEventRow extends DatabaseRow {
  id: string;
  missionId: string;
  phaseId: string | null;
  agentId: string | null;
  eventType: string;
  payload: unknown;
  idempotencyKey: string;
  occurredAt: Date;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export class OrderedMcfRuntimeRepository implements McfRuntimeRepository {
  constructor(
    private readonly database: DatabaseService,
    private readonly delegate: McfRuntimeRepository,
  ) {}

  createMission(input: CreateMcfMissionInput): Promise<McfMissionRecord> {
    return this.delegate.createMission(input);
  }

  findMission(missionId: string): Promise<McfMissionRecord | null> {
    return this.delegate.findMission(missionId);
  }

  findPhase(missionId: string, phaseId: string): Promise<McfPhaseRecord | null> {
    return this.delegate.findPhase(missionId, phaseId);
  }

  persistExecution(
    input: PersistMcfExecutionInput,
  ): Promise<{ mission: McfMissionRecord; phase: McfPhaseRecord }> {
    return this.delegate.persistExecution(input);
  }

  completePendingPhase(
    input: CompleteMcfPendingPhaseInput,
  ): Promise<CompleteMcfPendingPhaseResult> {
    return this.delegate.completePendingPhase(input);
  }

  async listEvents(missionId: string): Promise<McfEventRecord[]> {
    const mission = await this.delegate.findMission(missionId);
    if (!mission) {
      throw new McfMissionNotFoundError(missionId);
    }

    const result = await this.database.query<OrderedEventRow>(
      `select
        "id",
        "mission_id" as "missionId",
        "phase_id" as "phaseId",
        "agent_id" as "agentId",
        "event_type" as "eventType",
        "payload",
        "idempotency_key" as "idempotencyKey",
        "occurred_at" as "occurredAt"
       from "mcf_events"
       where "mission_id" = $1
       order by "sequence" asc`,
      [missionId],
    );

    return result.rows.map((row) => ({
      id: row.id,
      missionId: row.missionId,
      phaseId: row.phaseId,
      agentId: row.agentId,
      eventType: row.eventType as McfEventType,
      payload: asRecord(row.payload),
      idempotencyKey: row.idempotencyKey,
      occurredAt: row.occurredAt,
    }));
  }
}
