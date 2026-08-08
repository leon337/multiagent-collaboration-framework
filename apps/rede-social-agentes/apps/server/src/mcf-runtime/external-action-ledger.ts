import { createHash, randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import type { McfToolReceipt } from '@rsa/contracts';

import type { DatabaseService } from '../database.service.js';
import {
  ExternalActionAdapterError,
  type ExternalActionFailure,
  type ExternalActionRequest,
} from './external-action.contracts.js';
import {
  EXTERNAL_ACTION_LEASE_MS,
  reconcileExpiredExternalReservation,
} from './external-action-reservation.js';
import { canonicalizeProvider, canonicalizeToolValue } from './permission-engine.js';

interface MissionVersionRow {
  version: number;
  activeExternalAttemptId: string | null;
}

interface AttemptRow {
  attemptId: string;
}

interface IdempotencyRow extends AttemptRow {
  idempotencyFingerprint: string | null;
}

type ExternalAttemptStatus =
  | 'ALLOWED'
  | 'EXECUTED'
  | 'FAILED'
  | 'EVIDENCE_VALIDATED'
  | 'EVIDENCE_REJECTED'
  | 'ABANDONED';

interface AttemptStateRow extends AttemptRow {
  status: ExternalAttemptStatus;
}

const allowedTransitions: Record<ExternalAttemptStatus, ExternalAttemptStatus[]> = {
  ALLOWED: ['EXECUTED', 'FAILED'],
  EXECUTED: ['EVIDENCE_VALIDATED', 'EVIDENCE_REJECTED'],
  FAILED: [],
  EVIDENCE_VALIDATED: [],
  EVIDENCE_REJECTED: [],
  ABANDONED: [],
};

const globallySerializedAdapter = 'github-pr-collaboration-write-v1';
const globallySerializedOperations = new Set([
  'comment-pr',
  'review-pr-comment',
  'update-pr-text-metadata',
]);

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

function requestIdempotencyKey(request: ExternalActionRequest): string | null {
  const value = request.inputs.idempotency_key;
  if (value === undefined) return null;
  if (
    typeof value !== 'string' ||
    value.length < 16 ||
    value.length > 128 ||
    value !== value.trim() ||
    !/^[A-Za-z0-9][A-Za-z0-9._:-]+$/u.test(value)
  ) {
    throw new ExternalActionAdapterError(
      'INVALID_CONTEXT',
      'External action idempotency_key must be 16-128 safe characters',
      false,
    );
  }
  return value;
}

function canonicalizeForDigest(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => canonicalizeForDigest(item));
  }
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalizeForDigest(item)]),
    );
  }
  return value;
}

function isGloballySerializedC2Request(
  request: ExternalActionRequest,
  adapterId: string,
): boolean {
  return (
    adapterId === globallySerializedAdapter &&
    globallySerializedOperations.has(canonicalizeToolValue(request.tool.operation))
  );
}

function canonicalizeC2FingerprintInputs(
  inputs: Record<string, unknown>,
): Record<string, unknown> {
  const canonical = { ...inputs };
  if (typeof canonical.repository === 'string') {
    canonical.repository = canonical.repository.trim().toLowerCase();
  }
  if (typeof canonical.expected_head_sha === 'string') {
    canonical.expected_head_sha = canonical.expected_head_sha.trim().toLowerCase();
  }
  return canonical;
}

function requestIdempotencyFingerprint(
  request: ExternalActionRequest,
  adapterId: string,
  idempotencyKey: string | null,
): string | null {
  if (!idempotencyKey) return null;

  const canonicalC2 = isGloballySerializedC2Request(request, adapterId);
  const payload = canonicalizeForDigest({
    adapterId,
    agentId: request.agentId,
    skillId: request.skill.skillId,
    skillVersion: request.skill.version,
    provider: canonicalC2 ? canonicalizeProvider(request.tool.provider) : request.tool.provider,
    operation: canonicalC2
      ? canonicalizeToolValue(request.tool.operation)
      : request.tool.operation,
    resource: canonicalC2
      ? request.tool.resource.trim().toLowerCase()
      : request.tool.resource,
    inputs: canonicalC2 ? canonicalizeC2FingerprintInputs(request.inputs) : request.inputs,
  });
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function requestGlobalIdempotencyScopeKey(
  request: ExternalActionRequest,
  adapterId: string,
  idempotencyKey: string | null,
): string | null {
  if (!idempotencyKey || adapterId !== globallySerializedAdapter) return null;

  const operation = canonicalizeToolValue(request.tool.operation);
  if (!globallySerializedOperations.has(operation)) return null;

  const pullRequestNumber = request.inputs.pull_request_number;
  if (!Number.isInteger(pullRequestNumber) || (pullRequestNumber as number) < 1) return null;

  const payload = {
    adapterId,
    provider: canonicalizeProvider(request.tool.provider),
    operation,
    resource: request.tool.resource.trim().toLowerCase(),
    pullRequestNumber,
    idempotencyKey,
  };
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
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

    const idempotencyKey = requestIdempotencyKey(request);
    const idempotencyFingerprint = requestIdempotencyFingerprint(
      request,
      adapterId,
      idempotencyKey,
    );
    const idempotencyScopeKey = requestGlobalIdempotencyScopeKey(
      request,
      adapterId,
      idempotencyKey,
    );
    const attemptId = randomUUID();
    const occurredAt = new Date();
    const leaseExpiresAt = new Date(occurredAt.getTime() + EXTERNAL_ACTION_LEASE_MS);

    try {
      await this.database.transaction(async (client) => {
        await reconcileExpiredExternalReservation(client, request.context!.missionId, occurredAt);
        const mission = await client.query<MissionVersionRow>(
          `select
             "version",
             "active_external_attempt_id" as "activeExternalAttemptId"
           from "mcf_missions"
           where "id" = $1
           for update`,
          [request.context?.missionId],
        );
        const persistedMission = mission.rows[0];
        if (!persistedMission) {
          throw new ExternalActionAdapterError(
            'TARGET_NOT_FOUND',
            `Mission ${request.context?.missionId ?? 'unknown'} was not found for external action`,
            false,
          );
        }
        if (persistedMission.version !== request.context?.expectedMissionVersion) {
          throw new ExternalActionAdapterError(
            'RESERVATION_CONFLICT',
            `Mission version conflict: expected ${request.context?.expectedMissionVersion}, actual ${persistedMission.version}`,
            true,
          );
        }
        if (persistedMission.activeExternalAttemptId) {
          throw new ExternalActionAdapterError(
            'RESERVATION_CONFLICT',
            `Mission ${request.context.missionId} already has active external attempt ${persistedMission.activeExternalAttemptId}`,
            true,
          );
        }

        if (idempotencyKey && idempotencyFingerprint) {
          const existing = await client.query<IdempotencyRow>(
            `select
               "attempt_id" as "attemptId",
               "idempotency_fingerprint" as "idempotencyFingerprint"
             from "mcf_external_action_attempts"
             where "mission_id" = $1
               and "skill_id" = $2
               and "adapter_id" = $3
               and "idempotency_key" = $4
             order by "created_at" desc`,
            [request.context.missionId, request.skill.skillId, adapterId, idempotencyKey],
          );
          const incompatible = existing.rows.find(
            (row) => row.idempotencyFingerprint !== idempotencyFingerprint,
          );
          if (incompatible) {
            throw new ExternalActionAdapterError(
              'RESERVATION_CONFLICT',
              `Idempotency key ${idempotencyKey} is already bound to a different external request`,
              false,
            );
          }
        }

        const reservedMission = await client.query<{ id: string }>(
          `update "mcf_missions"
           set "active_external_attempt_id" = $1
           where "id" = $2
             and "version" = $3
             and "active_external_attempt_id" is null
           returning "id"`,
          [attemptId, request.context.missionId, request.context.expectedMissionVersion],
        );
        if (!reservedMission.rows[0]) {
          throw new ExternalActionAdapterError(
            'RESERVATION_CONFLICT',
            `Mission ${request.context.missionId} changed while reserving external execution`,
            true,
          );
        }

        await client.query(
          `insert into "mcf_external_action_attempts" (
            "attempt_id", "mission_id", "phase_id", "agent_id", "skill_id",
            "adapter_id", "provider", "operation", "resource", "idempotency_key",
            "idempotency_fingerprint", "expected_mission_version", "status",
            "lease_expires_at", "created_at", "updated_at", "idempotency_scope_key"
          ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'ALLOWED', $13, $14, $14, $15)`,
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
            idempotencyKey,
            idempotencyFingerprint,
            request.context.expectedMissionVersion,
            leaseExpiresAt,
            occurredAt,
            idempotencyScopeKey,
          ],
        );

        const preflightEvents = [
          {
            eventType: 'PHASE_STARTED',
            payload: { skillId: request.skill.skillId, cycle: 1 },
            idempotencyKey: `phase:${request.context.phaseId}:started`,
          },
          {
            eventType: 'SKILL_SELECTED',
            payload: { skillId: request.skill.skillId, version: request.skill.version },
            idempotencyKey: `phase:${request.context.phaseId}:skill-selected`,
          },
          {
            eventType: 'PERMISSION_GRANTED',
            payload: {
              profile: request.skill.permissionProfile,
              provider: request.tool.provider,
            },
            idempotencyKey: `phase:${request.context.phaseId}:permission-granted`,
          },
          {
            eventType: 'TOOL_REQUESTED',
            payload: {
              provider: request.tool.provider,
              operation: request.tool.operation,
              resource: request.tool.resource,
            },
            idempotencyKey: `phase:${request.context.phaseId}:tool-requested`,
          },
          {
            eventType: 'EXTERNAL_ACTION_REQUESTED',
            payload: {
              attemptId,
              adapterId,
              skillId: request.skill.skillId,
              provider: request.tool.provider,
              operation: request.tool.operation,
              resource: request.tool.resource,
              idempotencyKey,
              idempotencyFingerprint,
              idempotencyScopeKey,
              expectedMissionVersion: request.context.expectedMissionVersion,
            },
            idempotencyKey: `external-action:${attemptId}:requested`,
          },
          {
            eventType: 'EXTERNAL_ACTION_ALLOWED',
            payload: {
              attemptId,
              adapterId,
              permissionProfile: request.skill.permissionProfile,
              provider: request.tool.provider,
              operation: request.tool.operation,
              resource: request.tool.resource,
              idempotencyKey,
              idempotencyFingerprint,
              idempotencyScopeKey,
            },
            idempotencyKey: `external-action:${attemptId}:allowed`,
          },
        ];

        for (const item of preflightEvents) {
          await client.query(
            `insert into "mcf_events" (
              "id", "mission_id", "phase_id", "agent_id", "event_type", "payload",
              "idempotency_key", "occurred_at"
            ) values ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
            on conflict ("idempotency_key") do nothing`,
            [
              randomUUID(),
              request.context.missionId,
              request.context.phaseId,
              request.agentId,
              item.eventType,
              JSON.stringify(item.payload),
              item.idempotencyKey,
              occurredAt,
            ],
          );
        }
      });
    } catch (error) {
      if (error instanceof ExternalActionAdapterError) {
        throw error;
      }
      if (databaseErrorCode(error) === '23505') {
        if (idempotencyScopeKey) {
          throw new ExternalActionAdapterError(
            'RESERVATION_CONFLICT',
            `Global idempotency scope for ${request.tool.resource}/${request.tool.operation} is already durably bound to a prior or active attempt`,
            false,
          );
        }
        throw new ExternalActionAdapterError(
          'RESERVATION_CONFLICT',
          `External action phase ${request.context.phaseId} already has a conflicting reserved attempt`,
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
        idempotencyKey:
          typeof receipt.metadata.idempotencyKey === 'string'
            ? receipt.metadata.idempotencyKey
            : null,
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
    const leaseExpiresAt = new Date(occurredAt.getTime() + EXTERNAL_ACTION_LEASE_MS);

    try {
      await this.database.transaction(async (client) => {
        const current = await client.query<AttemptStateRow>(
          `select "attempt_id" as "attemptId", "status"
           from "mcf_external_action_attempts"
           where "attempt_id" = $1
           for update`,
          [input.attemptId],
        );
        const attempt = current.rows[0];
        if (!attempt) {
          throw new ExternalActionAdapterError(
            'LEDGER_FAILURE',
            `External action attempt ${input.attemptId} was not found`,
            false,
          );
        }
        if (attempt.status === input.status) {
          return;
        }
        if (!allowedTransitions[attempt.status].includes(input.status)) {
          throw new ExternalActionAdapterError(
            'LEDGER_FAILURE',
            `Invalid external action transition ${attempt.status} -> ${input.status}`,
            false,
          );
        }

        const updated = await client.query<AttemptRow>(
          `update "mcf_external_action_attempts"
           set "status" = $1,
               "receipt_id" = coalesce($2, "receipt_id"),
               "failure_code" = $3,
               "failure_message" = $4,
               "lease_expires_at" = $5,
               "updated_at" = $6
           where "attempt_id" = $7 and "status" = $8
           returning "attempt_id" as "attemptId"`,
          [
            input.status,
            input.receiptId,
            input.failure?.code ?? null,
            input.failure?.message ?? null,
            leaseExpiresAt,
            occurredAt,
            input.attemptId,
            attempt.status,
          ],
        );
        if (!updated.rows[0]) {
          throw new ExternalActionAdapterError(
            'LEDGER_FAILURE',
            `External action attempt ${input.attemptId} changed during transition`,
            true,
          );
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
      if (error instanceof ExternalActionAdapterError) {
        throw error;
      }
      throw new ExternalActionAdapterError(
        'LEDGER_FAILURE',
        error instanceof Error ? error.message : 'Failed to persist external action transition',
        true,
      );
    }
  }
}
