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

function requestIdempotencyFingerprint(
  request: ExternalActionRequest,
  adapterId: string,
  idempotencyKey: string | null,
): string | null {
  if (!idempotencyKey) return null;
  const payload = canonicalizeForDigest({
    adapterId,
    agentId: request.agentId,
    skillId: request.skill.skillId,
    skillVersion: request.skill.version,
    provider: request.tool.provider,
    operation: request.tool.operation,
    resource: request.tool.resource,
    inputs: request.inputs,
  });
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function requestGlobalIdempotencyScopeKey(
  request: ExternalActionRequest,
  adapterId: string,
  idempotencyKey: string | null,
): string | null {
  if (!idempotencyKey || adapterId !== 'github-pr-collaboration-write-v1') return null;

  const operation = canonicalizeToolValue(request.tool.operation);
  if (!['comment-pr', 'review-pr-comment', 'update-pr-text-metadata'].includes(operation)) {
    return null;
  }

  const pullRequestNumber = request.inputs.pull_request_number;
  if (!Number.isInteger(pullRequestNumber) || (pullRequestNumber as number) < 1) {
    return null;
  }

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
        if (idempotencyScopeKey) {
          // Serialize C2 global-idempotency reservation/recovery before taking any
          // mission or attempt row locks. This establishes one total order for
          // cross-mission expired-holder recovery and prevents A->B/B->A cycles.
          await client.query(
            `select pg_advisory_xact_lock(hashtextextended('mcf:external-action:global-idempotency', 0))`,
          );
        }

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
        ];

        for (const event of preflightEvents) {
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
              event.eventType,
              JSON.stringify(event.payload),
              event.idempotencyKey,
              occurredAt,
            ],
          );
        }
      });
      return attemptId;
    } catch (error) {
      if (error instanceof ExternalActionAdapterError) throw error;
      if (databaseErrorCode(error) === '23505') {
        throw new ExternalActionAdapterError(
          'RESERVATION_CONFLICT',
          idempotencyScopeKey
            ? 'Global external action idempotency key is already reserved or bound'
            : 'External action reservation conflicts with an existing idempotency key',
          idempotencyScopeKey === null,
        );
      }
      throw new ExternalActionAdapterError(
        'LEDGER_FAILURE',
        error instanceof Error ? error.message : 'Failed to reserve external action execution',
        true,
      );
    }
  }

  private async transition(
    attemptId: string,
    toStatus: ExternalAttemptStatus,
    patch: {
      receipt?: McfToolReceipt | undefined;
      failure?: ExternalActionFailure | undefined;
      receiptId?: string | null | undefined;
      rejectionReason?: string | null | undefined;
    } = {},
  ): Promise<void> {
    const occurredAt = new Date();
    try {
      await this.database.transaction(async (client) => {
        const attempt = await client.query<AttemptStateRow>(
          `select "attempt_id" as "attemptId", "status"
           from "mcf_external_action_attempts"
           where "attempt_id" = $1
           for update`,
          [attemptId],
        );
        const persisted = attempt.rows[0];
        if (!persisted) {
          throw new ExternalActionAdapterError(
            'TARGET_NOT_FOUND',
            `External action attempt ${attemptId} was not found`,
            false,
          );
        }
        if (!allowedTransitions[persisted.status].includes(toStatus)) {
          throw new ExternalActionAdapterError(
            'RESERVATION_CONFLICT',
            `External action attempt ${attemptId} cannot transition from ${persisted.status} to ${toStatus}`,
            false,
          );
        }

        const receipt = patch.receipt;
        const failure = patch.failure;
        await client.query(
          `update "mcf_external_action_attempts"
           set "status" = $2,
               "receipt_id" = coalesce($3, "receipt_id"),
               "failure_code" = coalesce($4, "failure_code"),
               "failure_message" = coalesce($5, "failure_message"),
               "updated_at" = $6
           where "attempt_id" = $1`,
          [
            attemptId,
            toStatus,
            receipt?.receiptId ?? patch.receiptId ?? null,
            failure?.code ?? null,
            failure?.message ?? patch.rejectionReason ?? null,
            occurredAt,
          ],
        );

        await client.query(
          `update "mcf_missions"
           set "active_external_attempt_id" = null,
               "updated_at" = $2
           where "active_external_attempt_id" = $1`,
          [attemptId, occurredAt],
        );
      });
    } catch (error) {
      if (error instanceof ExternalActionAdapterError) throw error;
      throw new ExternalActionAdapterError(
        'LEDGER_FAILURE',
        error instanceof Error ? error.message : 'Failed to transition external action attempt',
        true,
      );
    }
  }

  async recordExecuted(attemptId: string, receipt: McfToolReceipt): Promise<void> {
    await this.transition(attemptId, 'EXECUTED', { receipt });
  }

  async recordFailed(attemptId: string, failure: ExternalActionFailure): Promise<void> {
    await this.transition(attemptId, 'FAILED', { failure });
  }

  async recordEvidenceValidated(attemptId: string, receiptId: string): Promise<void> {
    await this.transition(attemptId, 'EVIDENCE_VALIDATED', { receiptId });
  }

  async recordEvidenceRejected(
    attemptId: string,
    receiptId: string | null,
    reason: string,
  ): Promise<void> {
    await this.transition(attemptId, 'EVIDENCE_REJECTED', {
      receiptId,
      rejectionReason: reason,
    });
  }
}
