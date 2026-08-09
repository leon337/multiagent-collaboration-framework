import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import type {
  McfCiCallbackResponse,
  McfEventType,
  McfEvidenceValidationStatus,
} from '@rsa/contracts';

import type { ExternalActionRequest } from './external-action.contracts.js';
import { ExternalActionLedger } from './external-action-ledger.js';
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
  ) {}

  async accept(request: McfStagingDeployCallbackRequest): Promise<McfCiCallbackResponse> {
    const mission = await this.repository.findMission(request.missionId);
    if (!mission) throw new McfMissionNotFoundError(request.missionId);
    const phase = await this.repository.findPhase(request.missionId, request.phaseId);
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

    const attempt = await this.ledger.loadStagingDeployReconciliationAttempt(
      request.missionId,
      request.phaseId,
      request.requestId,
    );
    if (!attempt) {
      throw new McfEvidenceRejectedError('staging callback has no durable deployment attempt');
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
    const workflowRunId = Number(request.workflowRunId);
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
    const callbackKey = `staging-deploy:${request.workflowRunId}:${request.requestId}`;
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
        idempotencyKey: `phase:${request.phaseId}:staging-evidence:${request.workflowRunId}`,
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
