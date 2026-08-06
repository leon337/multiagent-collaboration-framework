import { Injectable } from '@nestjs/common';
import type {
  McfEventType,
  McfMissionContract,
  McfMissionState,
  McfPhaseState,
} from '@rsa/contracts';
import type { DatabaseRow, DatabaseTransaction } from '@rsa/database';

import type { DatabaseService } from '../database.service.js';
import {
  McfMissionNotFoundError,
  McfMissionVersionConflictError,
  McfPhaseNotFoundError,
} from './mcf-runtime.errors.js';
import type {
  CompleteMcfPendingPhaseInput,
  CompleteMcfPendingPhaseResult,
  CreateMcfMissionInput,
  McfEventInput,
  McfEventRecord,
  McfMissionRecord,
  McfPhaseRecord,
  McfRuntimeRepository,
  PersistMcfExecutionInput,
} from './mcf-runtime.repository.js';

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

interface PhaseRow extends DatabaseRow {
  id: string;
  missionId: string;
  skillId: string;
  agentId: string;
  state: string;
  cycle: number;
  inputs: unknown;
  expectedEvidence: unknown;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface EventRow extends DatabaseRow {
  id: string;
  missionId: string;
  phaseId: string | null;
  agentId: string | null;
  eventType: string;
  payload: unknown;
  idempotencyKey: string;
  occurredAt: Date;
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

const phaseColumns = `
  "id",
  "mission_id" as "missionId",
  "skill_id" as "skillId",
  "agent_id" as "agentId",
  "state",
  "cycle",
  "inputs",
  "expected_evidence" as "expectedEvidence",
  "started_at" as "startedAt",
  "completed_at" as "completedAt",
  "created_at" as "createdAt",
  "updated_at" as "updatedAt"
`;

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
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

function mapPhase(row: PhaseRow): McfPhaseRecord {
  return {
    id: row.id,
    missionId: row.missionId,
    skillId: row.skillId,
    agentId: row.agentId,
    state: row.state as McfPhaseState,
    cycle: row.cycle,
    inputs: asRecord(row.inputs),
    expectedEvidence: asStringArray(row.expectedEvidence),
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapEvent(row: EventRow): McfEventRecord {
  return {
    id: row.id,
    missionId: row.missionId,
    phaseId: row.phaseId,
    agentId: row.agentId,
    eventType: row.eventType as McfEventType,
    payload: asRecord(row.payload),
    idempotencyKey: row.idempotencyKey,
    occurredAt: row.occurredAt,
  };
}

async function insertEvent(client: DatabaseTransaction, event: McfEventInput): Promise<void> {
  await client.query(
    `insert into "mcf_events" (
      "id", "mission_id", "phase_id", "agent_id", "event_type", "payload",
      "idempotency_key", "occurred_at"
    ) values ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)`,
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
}

async function loadMissionWithClient(
  client: DatabaseTransaction,
  missionId: string,
): Promise<McfMissionRecord> {
  const result = await client.query<MissionRow>(
    `select ${missionColumns} from "mcf_missions" where "id" = $1`,
    [missionId],
  );
  const row = result.rows[0];
  if (!row) {
    throw new McfMissionNotFoundError(missionId);
  }
  return mapMission(row);
}

async function loadPhaseWithClient(
  client: DatabaseTransaction,
  missionId: string,
  phaseId: string,
): Promise<McfPhaseRecord> {
  const result = await client.query<PhaseRow>(
    `select ${phaseColumns} from "mcf_phases" where "mission_id" = $1 and "id" = $2`,
    [missionId, phaseId],
  );
  const row = result.rows[0];
  if (!row) {
    throw new McfPhaseNotFoundError(missionId, phaseId);
  }
  return mapPhase(row);
}

@Injectable()
export class PostgresMcfRuntimeRepository implements McfRuntimeRepository {
  constructor(private readonly database: DatabaseService) {}

  async createMission(input: CreateMcfMissionInput): Promise<McfMissionRecord> {
    return this.database.transaction(async (client) => {
      const inserted = await client.query<MissionRow>(
        `insert into "mcf_missions" (
          "id", "contract", "state", "current_phase_id", "current_agent_id",
          "version", "created_at", "updated_at"
        ) values ($1, $2::jsonb, $3, $4, $5, $6, $7, $8)
        returning ${missionColumns}`,
        [
          input.mission.id,
          JSON.stringify(input.mission.contract),
          input.mission.state,
          input.mission.currentPhaseId,
          input.mission.currentAgentId,
          input.mission.version,
          input.mission.createdAt,
          input.mission.updatedAt,
        ],
      );

      await insertEvent(client, input.event);
      const row = inserted.rows[0];
      if (!row) {
        throw new Error('MCF mission insert did not return a row.');
      }
      return mapMission(row);
    });
  }

  async findMission(missionId: string): Promise<McfMissionRecord | null> {
    const result = await this.database.query<MissionRow>(
      `select ${missionColumns} from "mcf_missions" where "id" = $1`,
      [missionId],
    );
    return result.rows[0] ? mapMission(result.rows[0]) : null;
  }

  async findPhase(missionId: string, phaseId: string): Promise<McfPhaseRecord | null> {
    const result = await this.database.query<PhaseRow>(
      `select ${phaseColumns} from "mcf_phases" where "mission_id" = $1 and "id" = $2`,
      [missionId, phaseId],
    );
    return result.rows[0] ? mapPhase(result.rows[0]) : null;
  }

  async persistExecution(
    input: PersistMcfExecutionInput,
  ): Promise<{ mission: McfMissionRecord; phase: McfPhaseRecord }> {
    return this.database.transaction(async (client) => {
      const updatedMission = await client.query<MissionRow>(
        `update "mcf_missions"
         set "state" = $1,
             "current_phase_id" = $2,
             "current_agent_id" = $3,
             "version" = "version" + 1,
             "active_external_attempt_id" = null,
             "updated_at" = $4
         where "id" = $5
           and "version" = $6
           and (
             ($7::text is null and "active_external_attempt_id" is null)
             or (
               "active_external_attempt_id" = $7
               and exists (
                 select 1
                 from "mcf_external_action_attempts" as "attempt"
                 where "attempt"."attempt_id" = $7
                   and "attempt"."mission_id" = "mcf_missions"."id"
                   and "attempt"."phase_id" = $2
                   and "attempt"."status" in (
                     'FAILED',
                     'EVIDENCE_VALIDATED',
                     'EVIDENCE_REJECTED'
                   )
               )
             )
           )
         returning ${missionColumns}`,
        [
          input.missionState,
          input.phase.id,
          input.nextAgentId,
          input.phase.updatedAt,
          input.missionId,
          input.expectedMissionVersion,
          input.externalAttemptId ?? null,
        ],
      );

      const missionRow = updatedMission.rows[0];
      if (!missionRow) {
        const exists = await client.query('select 1 from "mcf_missions" where "id" = $1', [
          input.missionId,
        ]);
        if (exists.rowCount === 0) {
          throw new McfMissionNotFoundError(input.missionId);
        }
        throw new McfMissionVersionConflictError(input.missionId, input.expectedMissionVersion);
      }

      const insertedPhase = await client.query<PhaseRow>(
        `insert into "mcf_phases" (
          "id", "mission_id", "skill_id", "agent_id", "state", "cycle",
          "inputs", "expected_evidence", "started_at", "completed_at",
          "created_at", "updated_at"
        ) values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10, $11, $12)
        returning ${phaseColumns}`,
        [
          input.phase.id,
          input.phase.missionId,
          input.phase.skillId,
          input.phase.agentId,
          input.phase.state,
          input.phase.cycle,
          JSON.stringify(input.phase.inputs),
          JSON.stringify(input.phase.expectedEvidence),
          input.phase.startedAt,
          input.phase.completedAt,
          input.phase.createdAt,
          input.phase.updatedAt,
        ],
      );

      if (input.receipt) {
        await client.query(
          `insert into "mcf_tool_receipts" (
            "receipt_id", "mission_id", "phase_id", "provider", "operation", "resource",
            "external_id", "commit_sha", "status", "observed_at", "payload_digest",
            "signature", "metadata", "validation_status"
          ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14)`,
          [
            input.receipt.receiptId,
            input.missionId,
            input.phase.id,
            input.receipt.provider,
            input.receipt.operation,
            input.receipt.resource,
            input.receipt.externalId,
            input.receipt.commitSha,
            input.receipt.status,
            new Date(input.receipt.observedAt),
            input.receipt.payloadDigest,
            input.receipt.signature,
            JSON.stringify(input.receipt.metadata),
            input.evidenceStatus,
          ],
        );
      }

      if (input.handoff) {
        await client.query(
          `insert into "mcf_handoffs" (
            "id", "mission_id", "phase_id", "from_agent_id", "to_agent_id",
            "objective_state", "delivered", "evidence_receipt_ids", "open_findings",
            "next_action", "acceptance_for_next_action", "created_at"
          ) values ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb, $9::jsonb, $10, $11, $12)`,
          [
            input.handoff.id,
            input.missionId,
            input.phase.id,
            input.handoff.fromAgentId,
            input.handoff.toAgentId,
            JSON.stringify(input.handoff.objectiveState),
            JSON.stringify(input.handoff.delivered),
            JSON.stringify(input.handoff.evidenceReceiptIds),
            JSON.stringify(input.handoff.openFindings),
            input.handoff.nextAction,
            input.handoff.acceptanceForNextAction,
            input.handoff.createdAt,
          ],
        );
      }

      for (const event of input.events) {
        await insertEvent(client, event);
      }

      const phaseRow = insertedPhase.rows[0];
      if (!phaseRow) {
        throw new Error('MCF phase insert did not return a row.');
      }

      return { mission: mapMission(missionRow), phase: mapPhase(phaseRow) };
    });
  }

  async completePendingPhase(
    input: CompleteMcfPendingPhaseInput,
  ): Promise<CompleteMcfPendingPhaseResult> {
    return this.database.transaction(async (client) => {
      const duplicate = await client.query(
        'select 1 from "mcf_events" where "idempotency_key" = $1',
        [input.callbackIdempotencyKey],
      );
      if (duplicate.rowCount && duplicate.rowCount > 0) {
        return {
          duplicate: true,
          mission: await loadMissionWithClient(client, input.missionId),
          phase: await loadPhaseWithClient(client, input.missionId, input.phaseId),
        };
      }

      const lockedMission = await client.query<MissionRow>(
        `select ${missionColumns} from "mcf_missions" where "id" = $1 for update`,
        [input.missionId],
      );
      if (!lockedMission.rows[0]) {
        throw new McfMissionNotFoundError(input.missionId);
      }

      const existingPhase = await loadPhaseWithClient(client, input.missionId, input.phaseId);

      await client.query(
        `insert into "mcf_tool_receipts" (
          "receipt_id", "mission_id", "phase_id", "provider", "operation", "resource",
          "external_id", "commit_sha", "status", "observed_at", "payload_digest",
          "signature", "metadata", "validation_status"
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14)`,
        [
          input.receipt.receiptId,
          input.missionId,
          input.phaseId,
          input.receipt.provider,
          input.receipt.operation,
          input.receipt.resource,
          input.receipt.externalId,
          input.receipt.commitSha,
          input.receipt.status,
          new Date(input.receipt.observedAt),
          input.receipt.payloadDigest,
          input.receipt.signature,
          JSON.stringify(input.receipt.metadata),
          input.evidenceStatus,
        ],
      );

      const completedAt = input.phaseState === 'COMPLETED' ? new Date() : null;
      const updatedPhase = await client.query<PhaseRow>(
        `update "mcf_phases"
         set "state" = $1, "completed_at" = $2, "updated_at" = now()
         where "mission_id" = $3 and "id" = $4
         returning ${phaseColumns}`,
        [input.phaseState, completedAt, input.missionId, input.phaseId],
      );
      if (!updatedPhase.rows[0]) {
        throw new McfPhaseNotFoundError(input.missionId, input.phaseId);
      }

      if (input.handoff) {
        await client.query(
          `insert into "mcf_handoffs" (
            "id", "mission_id", "phase_id", "from_agent_id", "to_agent_id",
            "objective_state", "delivered", "evidence_receipt_ids", "open_findings",
            "next_action", "acceptance_for_next_action", "created_at"
          ) values ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb, $9::jsonb, $10, $11, $12)`,
          [
            input.handoff.id,
            input.missionId,
            input.phaseId,
            input.handoff.fromAgentId,
            input.handoff.toAgentId,
            JSON.stringify(input.handoff.objectiveState),
            JSON.stringify(input.handoff.delivered),
            JSON.stringify(input.handoff.evidenceReceiptIds),
            JSON.stringify(input.handoff.openFindings),
            input.handoff.nextAction,
            input.handoff.acceptanceForNextAction,
            input.handoff.createdAt,
          ],
        );
      }

      const updatedMission = await client.query<MissionRow>(
        `update "mcf_missions"
         set "state" = $1,
             "current_agent_id" = $2,
             "version" = "version" + 1,
             "updated_at" = now()
         where "id" = $3
           and "active_external_attempt_id" is null
         returning ${missionColumns}`,
        [input.missionState, input.nextAgentId, input.missionId],
      );
      if (!updatedMission.rows[0]) {
        throw new McfMissionVersionConflictError(
          input.missionId,
          lockedMission.rows[0].version,
        );
      }

      for (const event of input.events) {
        await insertEvent(client, event);
      }

      const missionRow = updatedMission.rows[0];
      const phaseRow = updatedPhase.rows[0];
      if (!missionRow || !phaseRow) {
        throw new Error('MCF pending phase completion did not return state.');
      }

      void existingPhase;
      return {
        duplicate: false,
        mission: mapMission(missionRow),
        phase: mapPhase(phaseRow),
      };
    });
  }

  async listEvents(missionId: string): Promise<McfEventRecord[]> {
    const mission = await this.findMission(missionId);
    if (!mission) {
      throw new McfMissionNotFoundError(missionId);
    }

    const result = await this.database.query<EventRow>(
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

    return result.rows.map(mapEvent);
  }
}
