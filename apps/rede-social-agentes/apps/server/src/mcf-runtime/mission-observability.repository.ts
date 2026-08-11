import { Injectable } from '@nestjs/common';
import type { McfMissionContract, McfMissionState } from '@rsa/contracts';
import type { DatabaseRow, DatabaseTransaction } from '@rsa/database';

import type { DatabaseService } from '../database.service.js';
import type { McfEventInput, McfMissionRecord } from './mcf-runtime.repository.js';

interface MissionRow extends DatabaseRow {
  id: string;
  contract: unknown;
  state: string;
  currentPhaseId: string | null;
  currentAgentId: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function mapMission(row: MissionRow): McfMissionRecord {
  return {
    id: row.id,
    contract: asRecord(row.contract) as unknown as McfMissionContract,
    state: row.state as McfMissionState,
    currentPhaseId: row.currentPhaseId,
    currentAgentId: row.currentAgentId,
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const missionColumns = `
  "id",
  "contract",
  "state",
  "current_phase_id" as "currentPhaseId",
  "current_agent_id" as "currentAgentId",
  "version",
  "created_at" as "createdAt",
  "updated_at" as "updatedAt"
`;

@Injectable()
export class MissionObservabilityRepository {
  constructor(private readonly database: DatabaseService) {}

  async listMissionsByStates(states: readonly McfMissionState[]): Promise<McfMissionRecord[]> {
    if (states.length === 0) return [];

    const result = await this.database.query<MissionRow>(
      `select ${missionColumns}
       from "mcf_missions"
       where "state" = any($1::text[])
       order by "updated_at" asc, "id" asc`,
      [states],
    );

    return result.rows.map(mapMission);
  }

  async appendEventsIdempotently(
    events: readonly McfEventInput[],
  ): Promise<{ inserted: number; duplicates: number }> {
    if (events.length === 0) return { inserted: 0, duplicates: 0 };

    return this.database.transaction(async (client) => {
      let inserted = 0;

      for (const event of events) {
        inserted += await this.insertEventIdempotently(client, event);
      }

      return { inserted, duplicates: events.length - inserted };
    });
  }

  private async insertEventIdempotently(
    client: DatabaseTransaction,
    event: McfEventInput,
  ): Promise<number> {
    const result = await client.query(
      `insert into "mcf_events" (
        "id", "mission_id", "phase_id", "agent_id", "event_type", "payload",
        "idempotency_key", "occurred_at"
      ) values ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
      on conflict ("idempotency_key") do nothing`,
      [
        event.id,
        event.missionId,
        event.phaseId,
        event.agentId,
        event.eventType,
        JSON.stringify(event.payload),
        event.idempotencyKey,
        event.occurredAt,
      ],
    );

    return result.rowCount ?? 0;
  }
}
