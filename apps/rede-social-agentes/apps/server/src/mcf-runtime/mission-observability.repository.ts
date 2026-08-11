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

interface MissionStateVersionRow extends DatabaseRow {
  state: string;
  version: number;
}

export interface BlockedAlertCandidate {
  event: McfEventInput;
  expectedMissionVersion: number;
}

export interface BlockedAlertAppendResult {
  inserted: number;
  duplicates: number;
  stale: number;
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

  async appendBlockedAlertsAtomically(
    candidates: readonly BlockedAlertCandidate[],
  ): Promise<BlockedAlertAppendResult> {
    if (candidates.length === 0) return { inserted: 0, duplicates: 0, stale: 0 };

    return this.database.transaction(async (client) => {
      let inserted = 0;
      let duplicates = 0;
      let stale = 0;

      for (const candidate of candidates) {
        const current = await this.lockMissionState(client, candidate.event.missionId);
        if (
          !current ||
          current.state !== 'BLOCKED_RISK' ||
          current.version !== candidate.expectedMissionVersion
        ) {
          stale += 1;
          continue;
        }

        const insertedRows = await this.insertEventIdempotently(client, candidate.event);
        if (insertedRows === 1) inserted += 1;
        else duplicates += 1;
      }

      return { inserted, duplicates, stale };
    });
  }

  private async lockMissionState(
    client: DatabaseTransaction,
    missionId: string,
  ): Promise<MissionStateVersionRow | null> {
    const result = await client.query<MissionStateVersionRow>(
      `select "state", "version"
       from "mcf_missions"
       where "id" = $1
       for update`,
      [missionId],
    );

    return result.rows[0] ?? null;
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
