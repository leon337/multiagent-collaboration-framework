import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import type { McfToolReceipt } from '@rsa/contracts';

import type { DatabaseService } from '../database.service.js';
import {
  ExternalActionAdapterError,
  type ExternalActionFailure,
  type ExternalActionRequest,
} from './external-action.contracts.js';

interface MissionVersionRow {
  version: number;
}

interface AttemptRow {
  attemptId: string;
}

function databaseErrorCode(error: unknown): string | null {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string'
  ) {
    return (error as { code: string }).code;
  }
  return null;
}

@Injectable()
export class ExternalActionLedger {
  constructor(private readonly database: DatabaseService) {}

  async reserve(request: ExternalActionRequest, adapterId: string): Promise<string> {
    if (!request.context) {
      throw new ExternalActionAdapterError(
        'INVALID_CONTEXT',
        'External adapter execution requires mission, phase, and mission version context',
        false,
      );
    }

    const attemptId = randomUUID();
    const occurredAt = new Date();

    try {
      await this.database.transaction(async (client) => {
        const mission = await client.query<MissionVersionRow>(
          `select "version"
           from "mcf_missions"
           where "id" = $1
           for update`,
          [request.context?.missionId],
        );
        const persistedVersion = mission.rows[0]?.version;
        if (persistedVersion === undefined) {
          throw new ExternalActionAdapterError(
            'TARGET_NOT_FOUND',
            `Mission ${request.context?.missionId ?? 'unknown'} was not found for external action`,
            false,
          );
        }
        if (persistedVersion !== request.context?.expectedMissionVersion) {
          throw new ExternalActionAdapterError(
            'RESERVATION_CONFLICT',
            `Mission version conflict: expected ${request.context?.expectedMissionVersion}, actual ${persistedVersion}`,
            true,
          );
        }

        await client.query(
          `insert into "mcf_external_action_attempts" (
            "attempt_id", "mission_id", "phase_id", "agent_id", "skill_id",
            "adapter_id", "provider", "operation", "resource",
            "expected_mission_version", "status", "created_at", "updated_at"
          ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ALLOWED', $11, $11)`,
          [
            attemptId,
            request.context.missionId,
            request.context.phaseId,
            request.agentId,
            request.skill.skillId,
            adapterId,
            request.tool.provider,
            request.tool.operation,
            request.tool.resource,
            request.context.expectedMissionVersion,
            occurredAt,
          ],
        );

        await client.query(
          `insert into "mcf_events" (
            "id", "mission_id", "phase_id", "agent_id", "event_type", "payload",
            "idempotency_key", "occurred_at"
          ) values
          ($1, $2, $3, $4, 'EXTERNAL_ACTION_REQUESTED', $5::jsonb, $6, $7),
          ($8, $2, $3, $4, 'EXTERNAL_ACTION_ALLOWED', $9::jsonb, $10, $7)`,
          [
            randomUUID(),
            request.context.missionId,
            request.context.phaseId,
            request.agentId,
            JSON.stringify({
              attemptId,
              adapterId,
              skillId: request.skill.skillId,
              provider: request.tool.provider,
              operation: request.tool.operation,
              resource: request.tool.resource,
              expectedMissionVersion: request.context.expectedMissionVersion,
            }),
            `external-action:${attemptId}:requested`,
            occurredAt,
            randomUUID(),
            JSON.stringify({
              attemptId,
              adapterId,
              permissionProfile: request.skill.permissionProfile,
              provider: request.tool.provider,
              operation: request.tool.operation,
              resource: request.tool.resource,
            }),
            `external-action:${attemptId}:allowed`,
          ],
        );
      });
    } catch (error) {
      if (error instanceof ExternalActionAdapterError) {
        throw error;
      }
      if (databaseErrorCode(error) === '23505') {
        throw new ExternalActionAdapterError(
          'RESERVATION_CONFLICT',
          `External action phase ${request.context.phaseId} already has a reserved attempt`,
          true,
        );
      }
      throw new ExternalActionAdapterError(
        'LEDGER_FAILURE',
        error instanceof Error ? error.message : 'Failed to reserve external action in ledger',
        true,
      );
    }

    return attemptId;
  }

  async recordExecuted(attemptId: string, receipt: McfToolReceipt): Promise<void> {
    await this.transition({
      attemptId,
      status: 'EXECUTED',
      eventType: 'EXTERNAL_ACTION_EXECUTED',
      receiptId: receipt.receiptId,
      failure: null,
      payload: {
        receiptId: receipt.receiptId,
        provider: receipt.provider,
        operation: receipt.operation,
        resource: receipt.resource,
        externalId: receipt.externalId,
        commitSha: receipt.commitSha,
        status: receipt.status,
      },
    });
  }

  async recordFailed(attemptId: string, failure: ExternalActionFailure): Promise<void> {
    await this.transition({
      attemptId,
      status: 'FAILED',
      eventType: 'EXTERNAL_ACTION_FAILED',
      receiptId: null,
      failure,
      payload: {
        failureCode: failure.code,
        message: failure.message,
        retryable: failure.retryable,
        statusCode: failure.statusCode,
      },
    });
  }

  async recordEvidenceValidated(attemptId: string, receiptId: string): Promise<void> {
    await this.transition({
      attemptId,
      status: 'EVIDENCE_VALIDATED',
      eventType: 'EXTERNAL_ACTION_EVIDENCE_VALIDATED',
      receiptId,
      failure: null,
      payload: { receiptId },
    });
  }

  async recordEvidenceRejected(
    attemptId: string,
    receiptId: string | null,
    reason: string,
  ): Promise<void> {
    await this.transition({
      attemptId,
      status: 'EVIDENCE_REJECTED',
      eventType: 'EXTERNAL_ACTION_FAILED',
      receiptId,
      failure: {
        code: 'INVALID_RESPONSE',
        message: reason,
        retryable: false,
        statusCode: null,
      },
      payload: { receiptId, failureCode: 'EVIDENCE_REJECTED', reason },
    });
  }

  private async transition(input: {
    attemptId: string;
    status: 'EXECUTED' | 'FAILED' | 'EVIDENCE_VALIDATED' | 'EVIDENCE_REJECTED';
    eventType:
      | 'EXTERNAL_ACTION_EXECUTED'
      | 'EXTERNAL_ACTION_FAILED'
      | 'EXTERNAL_ACTION_EVIDENCE_VALIDATED';
    receiptId: string | null;
    failure: ExternalActionFailure | null;
    payload: Record<string, unknown>;
  }): Promise<void> {
    const occurredAt = new Date();

    try {
      await this.database.transaction(async (client) => {
        const updated = await client.query<AttemptRow>(
          `update "mcf_external_action_attempts"
           set "status" = $1,
               "receipt_id" = coalesce($2, "receipt_id"),
               "failure_code" = $3,
               "failure_message" = $4,
               "updated_at" = $5
           where "attempt_id" = $6
           returning "attempt_id" as "attemptId"`,
          [
            input.status,
            input.receiptId,
            input.failure?.code ?? null,
            input.failure?.message ?? null,
            occurredAt,
            input.attemptId,
          ],
        );
        if (!updated.rows[0]) {
          throw new Error(`External action attempt ${input.attemptId} was not found`);
        }

        await client.query(
          `insert into "mcf_events" (
            "id", "mission_id", "phase_id", "agent_id", "event_type", "payload",
            "idempotency_key", "occurred_at"
          )
          select $1, "mission_id", "phase_id", "agent_id", $2, $3::jsonb, $4, $5
          from "mcf_external_action_attempts"
          where "attempt_id" = $6
          on conflict ("idempotency_key") do nothing`,
          [
            randomUUID(),
            input.eventType,
            JSON.stringify({ attemptId: input.attemptId, ...input.payload }),
            `external-action:${input.attemptId}:${input.status.toLowerCase()}`,
            occurredAt,
            input.attemptId,
          ],
        );
      });
    } catch (error) {
      throw new ExternalActionAdapterError(
        'LEDGER_FAILURE',
        error instanceof Error ? error.message : 'Failed to persist external action transition',
        true,
      );
    }
  }
}
