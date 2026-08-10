import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import type {
  McfCiCallbackResponse,
  McfEventType,
  McfEvidenceValidationStatus,
} from '@rsa/contracts';
import type { DatabaseRow } from '@rsa/database';

import { DatabaseService } from '../database.service.js';
import type { ExternalActionRequest } from './external-action.contracts.js';
import {
  ExternalActionLedger,
  type StagingDeployReconciliationAttempt,
} from './external-action-ledger.js';
import { GitHubActionsStagingDeployAdapter } from './github-staging-deploy.adapter.js';
import { HumanDelegationGuard } from './human-delegation-guard.js';
import {
  McfEvidenceRejectedError,
  McfMissionNotFoundError,
  McfPermissionDeniedError,
  McfPhaseNotFoundError,
} from './mcf-runtime.errors.js';
import { resolveMissionState } from './mission-completion-policy.js';
import {
  MCF_RUNTIME_REPOSITORY,
  type McfEventInput,
  type McfEventRecord,
  type McfRuntimeRepository,
} from './mcf-runtime.repository.js';
import { SkillExecutor } from './skill-executor.js';
import { SkillRegistryLoader } from './skill-registry.loader.js';

export interface McfStagingDeployCallbackRequest {
  missionId: string;
  phaseId: string;
  requestId: string;
  releaseSha: string;
  workflowRunId: string;
  repository: string;
  completedAt: string;
  stagingRuntimeUrl: string;
}

interface RecoveryAttemptRow extends DatabaseRow {
  attemptId: string;
  missionId: string;
  phaseId: string;
  agentId: string;
  skillId: string;
  adapterId: string;
  provider: string;
  operation: string;
  resource: string;
  idempotencyKey: string;
  expectedMissionVersion: number;
  status: string;
}

interface RecoveryPreparedEventRow extends DatabaseRow {
  payload: unknown;
}

interface RecoveryMissionRow extends DatabaseRow {
  version: number;
  currentPhaseId: string | null;
  activeExternalAttemptId: string | null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function requiredInput(inputs: Record<string, unknown>, key: string): string {
  const value = inputs[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new McfEvidenceRejectedError(`staging callback requires persisted ${key}`);
  }
  return value;
}

function settledEvidenceStatus(
  status: 'EVIDENCE_VALIDATED' | 'EVIDENCE_REJECTED',
): McfEvidenceValidationStatus {
  return status === 'EVIDENCE_VALIDATED' ? 'VALID' : 'INVALID';
}

function callbackEvent(input: {
  missionId: string;
  phaseId: string;
  agentId: string;
  eventType: McfEventType;
  payload: Record<string, unknown>;
  idempotencyKey: string;
  occurredAt: Date;
}): McfEventInput {
  return { id: randomUUID(), ...input };
}

function persistedCompletionFromEvents(
  events: McfEventRecord[],
  callbackKey: string,
  evidenceKey: string,
): { receiptId: string; evidenceStatus: McfEvidenceValidationStatus } | null {
  const callback = events.find(
    (item) => item.idempotencyKey === callbackKey && item.eventType === 'CI_CALLBACK_RECEIVED',
  );
  if (!callback) return null;
  const evidence = events.find(
    (item) =>
      item.idempotencyKey === evidenceKey &&
      (item.eventType === 'EVIDENCE_VALIDATED' || item.eventType === 'EVIDENCE_REJECTED'),
  );
  const receiptId = evidence?.payload.receiptId;
  if (!evidence || typeof receiptId !== 'string' || receiptId.length === 0) {
    throw new McfEvidenceRejectedError(
      'persisted staging callback completion has invalid receipt evidence',
    );
  }
  return {
    receiptId,
    evidenceStatus: evidence.eventType === 'EVIDENCE_VALIDATED' ? 'VALID' : 'INVALID',
  };
}

@Injectable()
export class StagingDeployReconciliationService {
  private readonly humanDelegation = new HumanDelegationGuard();

  constructor(
    @Inject(MCF_RUNTIME_REPOSITORY) private readonly repository: McfRuntimeRepository,
    @Inject(SkillExecutor) private readonly executor: SkillExecutor,
    @Inject(SkillRegistryLoader) private readonly registry: SkillRegistryLoader,
    @Inject(ExternalActionLedger) private readonly ledger: ExternalActionLedger,
    @Inject(GitHubActionsStagingDeployAdapter)
    private readonly adapter: GitHubActionsStagingDeployAdapter,
    @Inject(DatabaseService) private readonly database?: DatabaseService,
  ) {}

  private async recoverInterruptedDispatch(
    request: McfStagingDeployCallbackRequest,
    attempt: StagingDeployReconciliationAttempt,
  ): Promise<void> {
    if (!this.database) {
      throw new McfEvidenceRejectedError(
        'staging callback cannot recover an interrupted dispatch without durable database access',
      );
    }
    if (attempt.status !== 'EXECUTING' && attempt.status !== 'UNKNOWN') {
      throw new McfEvidenceRejectedError(
        `staging callback cannot materialize missing phase from attempt status ${attempt.status}`,
      );
    }
    if (!attempt.reconciliationEligible || !attempt.previousSha) {
      throw new McfEvidenceRejectedError(
        'interrupted staging dispatch is missing durable pre-dispatch reconciliation metadata',
      );
    }

    const skill = await this.registry.load(attempt.skillId);
    if (skill.skillId !== 'MCF-DEPLOY-VALIDATE' || attempt.agentId.length === 0) {
      throw new McfPermissionDeniedError(
        'staging crash recovery may materialize only MCF-DEPLOY-VALIDATE phases',
      );
    }

    const now = new Date();
    await this.database.transaction(async (client) => {
      const attemptResult = await client.query<RecoveryAttemptRow>(
        `select
          "attempt_id" as "attemptId",
          "mission_id" as "missionId",
          "phase_id" as "phaseId",
          "agent_id" as "agentId",
          "skill_id" as "skillId",
          "adapter_id" as "adapterId",
          "provider",
          "operation",
          "resource",
          "idempotency_key" as "idempotencyKey",
          "expected_mission_version" as "expectedMissionVersion",
          "status"
         from "mcf_external_action_attempts"
         where "attempt_id" = $1
         for update`,
        [attempt.attemptId],
      );
      const durableAttempt = attemptResult.rows[0];
      if (!durableAttempt) {
        throw new McfEvidenceRejectedError('staging callback durable attempt disappeared');
      }
      if (
        durableAttempt.missionId !== request.missionId ||
        durableAttempt.phaseId !== request.phaseId ||
        durableAttempt.agentId !== attempt.agentId ||
        durableAttempt.skillId !== 'MCF-DEPLOY-VALIDATE' ||
        durableAttempt.adapterId !== 'github-actions-staging-deploy-v1' ||
        durableAttempt.provider !== 'github' ||
        durableAttempt.operation !== 'deploy-staging' ||
        durableAttempt.resource.toLowerCase() !== request.repository.toLowerCase() ||
        durableAttempt.idempotencyKey !== request.requestId ||
        durableAttempt.expectedMissionVersion !== attempt.expectedMissionVersion ||
        (durableAttempt.status !== 'EXECUTING' && durableAttempt.status !== 'UNKNOWN')
      ) {
        throw new McfEvidenceRejectedError(
          'staging callback does not match the durable interrupted deployment attempt',
        );
      }

      const preparedResult = await client.query<RecoveryPreparedEventRow>(
        `select "payload"
         from "mcf_events"
         where "mission_id" = $1
           and "phase_id" = $2
           and "event_type" = 'EXTERNAL_ACTION_RECONCILIATION_PREPARED'
           and "payload" ->> 'attemptId' = $3
         order by "occurred_at" desc
         limit 1`,
        [request.missionId, request.phaseId, attempt.attemptId],
      );
      const prepared = asRecord(preparedResult.rows[0]?.payload);
      if (
        prepared.reconciliationEligible !== true ||
        typeof prepared.previousSha !== 'string' ||
        prepared.previousSha.length === 0 ||
        typeof prepared.releaseSha !== 'string' ||
        prepared.releaseSha.toLowerCase() !== request.releaseSha.toLowerCase() ||
        typeof prepared.repository !== 'string' ||
        prepared.repository.toLowerCase() !== request.repository.toLowerCase() ||
        prepared.idempotencyKey !== request.requestId ||
        prepared.attemptId !== attempt.attemptId
      ) {
        throw new McfEvidenceRejectedError(
          'staging callback correlation does not match durable pre-dispatch metadata',
        );
      }

      const existingPhase = await client.query(
        `select "id"
         from "mcf_phases"
         where "id" = $1 and "mission_id" = $2
         for update`,
        [request.phaseId, request.missionId],
      );
      if (existingPhase.rows.length > 0) return;

      const missionResult = await client.query<RecoveryMissionRow>(
        `select
          "version",
          "current_phase_id" as "currentPhaseId",
          "active_external_attempt_id" as "activeExternalAttemptId"
         from "mcf_missions"
         where "id" = $1
         for update`,
        [request.missionId],
      );
      const durableMission = missionResult.rows[0];
      if (!durableMission) throw new McfMissionNotFoundError(request.missionId);
      if (
        durableMission.version !== attempt.expectedMissionVersion ||
        durableMission.currentPhaseId !== null ||
        durableMission.activeExternalAttemptId !== attempt.attemptId
      ) {
        throw new McfEvidenceRejectedError(
          'staging callback cannot safely materialize a stale or displaced mission phase',
        );
      }

      const recoveredInputs = {
        authorizedScope: true,
        repository: request.repository,
        artifact_or_commit: request.releaseSha.toLowerCase(),
        target_environment: 'staging',
        idempotency_key: request.requestId,
      };
      await client.query(
        `insert into "mcf_phases" (
          "id", "mission_id", "skill_id", "agent_id", "state", "cycle",
          "inputs", "expected_evidence", "started_at", "completed_at",
          "created_at", "updated_at"
        ) values ($1, $2, $3, $4, 'RECOVERING', 1, $5::jsonb, $6::jsonb, $7, null, $7, $7)`,
        [
          request.phaseId,
          request.missionId,
          skill.skillId,
          attempt.agentId,
          JSON.stringify(recoveredInputs),
          JSON.stringify(skill.requiredEvidence),
          now,
        ],
      );

      const missionUpdate = await client.query(
        `update "mcf_missions"
         set "state" = 'RECOVERING',
             "current_phase_id" = $2,
             "current_agent_id" = $3,
             "version" = "version" + 1,
             "updated_at" = $4
         where "id" = $1
           and "version" = $5
           and "current_phase_id" is null
           and "active_external_attempt_id" = $6
         returning "id"`,
        [
          request.missionId,
          request.phaseId,
          attempt.agentId,
          now,
          attempt.expectedMissionVersion,
          attempt.attemptId,
        ],
      );
      if (missionUpdate.rows.length !== 1) {
        throw new McfEvidenceRejectedError(
          'staging callback lost the mission recovery race before phase materialization',
        );
      }

      if (durableAttempt.status === 'EXECUTING') {
        const attemptUpdate = await client.query(
          `update "mcf_external_action_attempts"
           set "status" = 'UNKNOWN',
               "failure_code" = 'EXTERNAL_EFFECT_UNKNOWN',
               "failure_message" = 'workflow callback recovered interrupted staging dispatch',
               "updated_at" = $2
           where "attempt_id" = $1 and "status" = 'EXECUTING'
           returning "attempt_id"`,
          [attempt.attemptId, now],
        );
        if (attemptUpdate.rows.length !== 1) {
          throw new McfEvidenceRejectedError(
            'staging callback lost the attempt recovery race before UNKNOWN transition',
          );
        }
      }
    });
  }

  async accept(request: McfStagingDeployCallbackRequest): Promise<McfCiCallbackResponse> {
    let mission = await this.repository.findMission(request.missionId);
    if (!mission) throw new McfMissionNotFoundError(request.missionId);

    let attempt = await this.ledger.loadStagingDeployReconciliationAttempt(
      request.missionId,
      request.phaseId,
      request.requestId,
    );
    if (!attempt) {
      throw new McfEvidenceRejectedError('staging callback has no durable deployment attempt');
    }

    let phase = await this.repository.findPhase(request.missionId, request.phaseId);
    if (!phase && (attempt.status === 'EXECUTING' || attempt.status === 'UNKNOWN')) {
      await this.recoverInterruptedDispatch(request, attempt);
      mission = await this.repository.findMission(request.missionId);
      if (!mission) throw new McfMissionNotFoundError(request.missionId);
      phase = await this.repository.findPhase(request.missionId, request.phaseId);
      attempt = await this.ledger.loadStagingDeployReconciliationAttempt(
        request.missionId,
        request.phaseId,
        request.requestId,
      );
      if (!attempt) {
        throw new McfEvidenceRejectedError(
          'staging callback durable attempt disappeared after crash recovery',
        );
      }
    }

    if (!phase) throw new McfPhaseNotFoundError(request.missionId, request.phaseId);
    if (phase.skillId !== 'MCF-DEPLOY-VALIDATE') {
      throw new McfPermissionDeniedError(
        'staging deploy callbacks may complete only MCF-DEPLOY-VALIDATE phases',
      );
    }

    const repository = requiredInput(phase.inputs, 'repository');
    const releaseSha = requiredInput(phase.inputs, 'artifact_or_commit').toLowerCase();
    const requestId = requiredInput(phase.inputs, 'idempotency_key');
    if (
      repository.toLowerCase() !== request.repository.toLowerCase() ||
      releaseSha !== request.releaseSha.toLowerCase() ||
      requestId !== request.requestId ||
      requiredInput(phase.inputs, 'target_environment').toLowerCase() !== 'staging'
    ) {
      throw new McfEvidenceRejectedError(
        'staging callback correlation does not match persisted phase inputs',
      );
    }

    if (attempt.skillId !== phase.skillId || attempt.agentId !== phase.agentId) {
      throw new McfEvidenceRejectedError(
        'staging callback attempt does not match persisted phase identity',
      );
    }
    if (attempt.status === 'EVIDENCE_VALIDATED' || attempt.status === 'EVIDENCE_REJECTED') {
      return {
        accepted: true,
        duplicate: true,
        evidenceStatus: settledEvidenceStatus(attempt.status),
        missionState: mission.state,
      };
    }
    if (attempt.status !== 'UNKNOWN') {
      throw new McfEvidenceRejectedError(
        `staging callback cannot reconcile attempt status ${attempt.status}`,
      );
    }

    const workflowRunId = Number(request.workflowRunId);
    if (!Number.isSafeInteger(workflowRunId) || workflowRunId < 1) {
      throw new McfEvidenceRejectedError(
        'staging callback workflowRunId must be a positive integer',
      );
    }
    const callbackKey = `staging-deploy:${request.workflowRunId}:${request.requestId}`;
    const evidenceKey = `phase:${request.phaseId}:staging-evidence:${request.workflowRunId}`;
    const persistedCompletion = persistedCompletionFromEvents(
      await this.repository.listEvents(request.missionId),
      callbackKey,
      evidenceKey,
    );
    if (persistedCompletion) {
      if (persistedCompletion.evidenceStatus === 'VALID') {
        await this.ledger.recordEvidenceValidated(attempt.attemptId, persistedCompletion.receiptId);
      } else {
        await this.ledger.recordEvidenceRejected(
          attempt.attemptId,
          persistedCompletion.receiptId,
          'staging deployment evidence rejected',
        );
      }
      return {
        accepted: true,
        duplicate: true,
        evidenceStatus: persistedCompletion.evidenceStatus,
        missionState: mission.state,
      };
    }

    const expectedPendingMissionVersion = attempt.expectedMissionVersion + 1;
    if (
      mission.version !== expectedPendingMissionVersion ||
      mission.currentPhaseId !== request.phaseId
    ) {
      throw new McfEvidenceRejectedError(
        'staging callback is stale for the current mission version or phase',
      );
    }
    if (!attempt.reconciliationEligible || !attempt.previousSha) {
      throw new McfEvidenceRejectedError(
        'durable staging UNKNOWN attempt is not yet eligible for automatic reconciliation',
      );
    }

    const skill = await this.registry.load(phase.skillId);
    const externalRequest: ExternalActionRequest = {
      skill,
      agentId: phase.agentId,
      inputs: phase.inputs,
      tool: { provider: 'github', operation: 'deploy-staging', resource: repository },
      context: {
        missionId: request.missionId,
        phaseId: request.phaseId,
        expectedMissionVersion: attempt.expectedMissionVersion,
      },
    };
    const receipt = await this.adapter.reconcile(externalRequest, {
      expectedRunId: workflowRunId,
      previousSha: attempt.previousSha,
      stagingRuntimeUrl: request.stagingRuntimeUrl,
    });
    if (receipt.status !== 'SUCCEEDED') {
      throw new McfEvidenceRejectedError(
        'staging workflow completed but final provider state is still ambiguous',
      );
    }

    const outcome = await this.executor.execute({
      skillId: phase.skillId,
      agentId: phase.agentId,
      inputs: phase.inputs,
      tool: {
        provider: 'github',
        operation: 'deploy-staging',
        resource: repository,
        externalReceipt: receipt,
      },
      executionContext: externalRequest.context,
    });
    if (!outcome.receipt || outcome.evidenceStatus === 'PENDING') {
      throw new McfEvidenceRejectedError(
        'staging reconciliation did not produce terminal evidence',
      );
    }
    if (outcome.handoffTo) {
      this.humanDelegation.assertHandoffTarget(outcome.handoffTo, mission.contract.selectedAgents);
    }

    const missionState = resolveMissionState({
      selectedSkills: mission.contract.selectedSkills,
      currentSkillId: outcome.skill.skillId,
      currentPhaseCompleted: outcome.phaseState === 'COMPLETED',
      finalCheckpointRequested: false,
      defaultState: outcome.missionState,
      existingEvents: [],
    });
    const now = new Date();
    const handoff = outcome.handoffTo
      ? {
          id: randomUUID(),
          fromAgentId: phase.agentId,
          toAgentId: outcome.handoffTo,
          objectiveState: {
            missionState,
            phaseState: outcome.phaseState,
            workflowRunId: request.workflowRunId,
          },
          delivered: outcome.skill.requiredEvidence,
          evidenceReceiptIds: [outcome.receipt.receiptId],
          openFindings: [],
          nextAction: `Continue ${outcome.handoffTo} from the reconciled staging checkpoint`,
          acceptanceForNextAction:
            outcome.skill.acceptanceCriteria[0] ?? 'Preserve reconciled staging evidence',
          createdAt: now,
        }
      : null;

    const events: McfEventInput[] = [
      callbackEvent({
        missionId: request.missionId,
        phaseId: request.phaseId,
        agentId: phase.agentId,
        eventType: 'CI_CALLBACK_RECEIVED',
        payload: {
          kind: 'STAGING_DEPLOY_RECONCILIATION',
          workflowRunId: request.workflowRunId,
          requestId: request.requestId,
          releaseSha: request.releaseSha,
          completedAt: request.completedAt,
        },
        idempotencyKey: callbackKey,
        occurredAt: now,
      }),
      callbackEvent({
        missionId: request.missionId,
        phaseId: request.phaseId,
        agentId: phase.agentId,
        eventType: 'TOOL_RECEIPT_RECORDED',
        payload: { receiptId: outcome.receipt.receiptId, provider: outcome.receipt.provider },
        idempotencyKey: `receipt:${outcome.receipt.receiptId}:recorded`,
        occurredAt: now,
      }),
      callbackEvent({
        missionId: request.missionId,
        phaseId: request.phaseId,
        agentId: phase.agentId,
        eventType: outcome.evidenceStatus === 'VALID' ? 'EVIDENCE_VALIDATED' : 'EVIDENCE_REJECTED',
        payload: { receiptId: outcome.receipt.receiptId, reason: outcome.rejectionReason },
        idempotencyKey: evidenceKey,
        occurredAt: now,
      }),
    ];
    if (handoff) {
      events.push(
        callbackEvent({
          missionId: request.missionId,
          phaseId: request.phaseId,
          agentId: phase.agentId,
          eventType: 'HANDOFF_CREATED',
          payload: { from: phase.agentId, to: handoff.toAgentId },
          idempotencyKey: `phase:${request.phaseId}:staging-handoff:${request.workflowRunId}`,
          occurredAt: now,
        }),
        callbackEvent({
          missionId: request.missionId,
          phaseId: request.phaseId,
          agentId: phase.agentId,
          eventType: 'PHASE_COMPLETED',
          payload: { workflowRunId: request.workflowRunId, skillId: phase.skillId },
          idempotencyKey: `phase:${request.phaseId}:staging-completed:${request.workflowRunId}`,
          occurredAt: now,
        }),
      );
    } else {
      events.push(
        callbackEvent({
          missionId: request.missionId,
          phaseId: request.phaseId,
          agentId: phase.agentId,
          eventType: 'RECOVERY_STARTED',
          payload: { workflowRunId: request.workflowRunId, fallback: outcome.skill.fallback },
          idempotencyKey: `phase:${request.phaseId}:staging-recovery:${request.workflowRunId}`,
          occurredAt: now,
        }),
      );
    }

    const completed = await this.repository.completePendingPhase({
      missionId: request.missionId,
      phaseId: request.phaseId,
      externalAttemptId: attempt.attemptId,
      receipt: outcome.receipt,
      evidenceStatus: outcome.evidenceStatus,
      missionState,
      phaseState: outcome.phaseState,
      nextAgentId: handoff?.toAgentId ?? null,
      handoff,
      callbackIdempotencyKey: callbackKey,
      events,
    });

    if (completed.evidenceStatus === 'VALID') {
      await this.ledger.recordEvidenceValidated(attempt.attemptId, completed.receiptId);
    } else {
      await this.ledger.recordEvidenceRejected(
        attempt.attemptId,
        completed.receiptId,
        outcome.rejectionReason ?? 'staging deployment evidence rejected',
      );
    }

    return {
      accepted: true,
      duplicate: completed.duplicate,
      evidenceStatus: completed.evidenceStatus,
      missionState: completed.mission.state,
    };
  }
}
