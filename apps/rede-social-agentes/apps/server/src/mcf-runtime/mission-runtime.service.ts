import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import type {
  CreateMcfMissionRequest,
  ExecuteMcfPhaseRequest,
  McfCiCallbackRequest,
  McfCiCallbackResponse,
  McfEventType,
  McfMissionEventResponse,
  McfMissionResponse,
  McfMissionTimelineResponse,
  McfPhaseExecutionResponse,
} from '@rsa/contracts';

import type { EvidenceValidator } from './evidence-validator.js';
import {
  McfMissionNotFoundError,
  McfPermissionDeniedError,
  McfPhaseNotFoundError,
} from './mcf-runtime.errors.js';
import { HumanDelegationGuard } from './human-delegation-guard.js';
import { resolveMissionState } from './mission-completion-policy.js';
import {
  MCF_RUNTIME_REPOSITORY,
  type McfEventInput,
  type McfEventRecord,
  type McfMissionRecord,
  type McfPhaseRecord,
  type McfRuntimeRepository,
} from './mcf-runtime.repository.js';
import type { SkillExecutor } from './skill-executor.js';
import type { SkillRegistryLoader } from './skill-registry.loader.js';

function toMissionResponse(mission: McfMissionRecord): McfMissionResponse {
  return {
    id: mission.id,
    contract: mission.contract,
    state: mission.state,
    currentPhaseId: mission.currentPhaseId,
    currentAgentId: mission.currentAgentId,
    version: mission.version,
    createdAt: mission.createdAt.toISOString(),
    updatedAt: mission.updatedAt.toISOString(),
  };
}

function toEventResponse(event: McfEventRecord): McfMissionEventResponse {
  return {
    id: event.id,
    missionId: event.missionId,
    phaseId: event.phaseId,
    agentId: event.agentId,
    eventType: event.eventType,
    payload: event.payload,
    idempotencyKey: event.idempotencyKey,
    occurredAt: event.occurredAt.toISOString(),
  };
}

function event(input: {
  missionId: string;
  phaseId: string | null;
  agentId: string | null;
  eventType: McfEventType;
  payload: Record<string, unknown>;
  idempotencyKey: string;
  occurredAt: Date;
}): McfEventInput {
  return { id: randomUUID(), ...input };
}

@Injectable()
export class MissionRuntimeService {
  private readonly humanDelegation = new HumanDelegationGuard();

  constructor(
    @Inject(MCF_RUNTIME_REPOSITORY) private readonly repository: McfRuntimeRepository,
    private readonly executor: SkillExecutor,
    private readonly registry: SkillRegistryLoader,
    private readonly evidence: EvidenceValidator,
  ) {}

  async createMission(request: CreateMcfMissionRequest): Promise<McfMissionResponse> {
    this.humanDelegation.assertMissionAgents(request.contract.selectedAgents);

    const now = new Date();
    const missionId = randomUUID();
    const mission: McfMissionRecord = {
      id: missionId,
      contract: request.contract,
      state: 'PLANNED',
      currentPhaseId: null,
      currentAgentId: null,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    const created = await this.repository.createMission({
      mission,
      event: event({
        missionId,
        phaseId: null,
        agentId: null,
        eventType: 'MISSION_CREATED',
        payload: {
          title: request.contract.title,
          riskClass: request.contract.riskClass,
          selectedAgents: request.contract.selectedAgents,
          selectedSkills: request.contract.selectedSkills,
        },
        idempotencyKey: `mission:${missionId}:created`,
        occurredAt: now,
      }),
    });

    return toMissionResponse(created);
  }

  async getMission(missionId: string): Promise<McfMissionResponse> {
    const mission = await this.repository.findMission(missionId);
    if (!mission) {
      throw new McfMissionNotFoundError(missionId);
    }
    return toMissionResponse(mission);
  }

  async executePhase(
    missionId: string,
    request: ExecuteMcfPhaseRequest,
  ): Promise<McfPhaseExecutionResponse> {
    const mission = await this.repository.findMission(missionId);
    if (!mission) {
      throw new McfMissionNotFoundError(missionId);
    }

    if (!mission.contract.selectedSkills.includes(request.skillId)) {
      throw new McfPermissionDeniedError(
        `skill ${request.skillId} was not selected by mission contract`,
      );
    }
    if (!mission.contract.selectedAgents.includes(request.agentId)) {
      throw new McfPermissionDeniedError(
        `agent ${request.agentId} was not selected by mission contract`,
      );
    }

    const outcome = await this.executor.execute({
      skillId: request.skillId,
      agentId: request.agentId,
      inputs: request.inputs,
      tool: request.tool,
    });

    if (outcome.handoffTo) {
      this.humanDelegation.assertHandoffTarget(outcome.handoffTo, mission.contract.selectedAgents);
    }

    const existingEvents =
      outcome.skill.skillId === 'MCF-TRACE-MISSION' && request.inputs.final_checkpoint === true
        ? await this.repository.listEvents(missionId)
        : [];
    const missionState = resolveMissionState({
      selectedSkills: mission.contract.selectedSkills,
      currentSkillId: outcome.skill.skillId,
      currentPhaseCompleted: outcome.phaseState === 'COMPLETED',
      finalCheckpointRequested: request.inputs.final_checkpoint === true,
      defaultState: outcome.missionState,
      existingEvents,
    });

    const now = new Date();
    const phaseId = request.phaseId ?? randomUUID();
    const phase: McfPhaseRecord = {
      id: phaseId,
      missionId,
      skillId: outcome.skill.skillId,
      agentId: request.agentId,
      state: outcome.phaseState,
      cycle: 1,
      inputs: request.inputs,
      expectedEvidence: outcome.skill.requiredEvidence,
      startedAt: now,
      completedAt: outcome.phaseState === 'COMPLETED' ? now : null,
      createdAt: now,
      updatedAt: now,
    };

    const events: McfEventInput[] = [
      event({
        missionId,
        phaseId,
        agentId: request.agentId,
        eventType: 'PHASE_STARTED',
        payload: { skillId: outcome.skill.skillId, cycle: 1 },
        idempotencyKey: `phase:${phaseId}:started`,
        occurredAt: now,
      }),
      event({
        missionId,
        phaseId,
        agentId: request.agentId,
        eventType: 'SKILL_SELECTED',
        payload: { skillId: outcome.skill.skillId, version: outcome.skill.version },
        idempotencyKey: `phase:${phaseId}:skill-selected`,
        occurredAt: now,
      }),
      event({
        missionId,
        phaseId,
        agentId: request.agentId,
        eventType: 'PERMISSION_GRANTED',
        payload: { profile: outcome.skill.permissionProfile, provider: request.tool.provider },
        idempotencyKey: `phase:${phaseId}:permission-granted`,
        occurredAt: now,
      }),
      event({
        missionId,
        phaseId,
        agentId: request.agentId,
        eventType: 'TOOL_REQUESTED',
        payload: {
          provider: request.tool.provider,
          operation: request.tool.operation,
          resource: request.tool.resource,
        },
        idempotencyKey: `phase:${phaseId}:tool-requested`,
        occurredAt: now,
      }),
    ];

    if (outcome.receipt) {
      events.push(
        event({
          missionId,
          phaseId,
          agentId: request.agentId,
          eventType: 'TOOL_RECEIPT_RECORDED',
          payload: {
            receiptId: outcome.receipt.receiptId,
            provider: outcome.receipt.provider,
            status: outcome.receipt.status,
          },
          idempotencyKey: `receipt:${outcome.receipt.receiptId}:recorded`,
          occurredAt: now,
        }),
      );
    }

    if (outcome.evidenceStatus === 'VALID') {
      events.push(
        event({
          missionId,
          phaseId,
          agentId: request.agentId,
          eventType: 'EVIDENCE_VALIDATED',
          payload: { receiptId: outcome.receipt?.receiptId ?? null },
          idempotencyKey: `phase:${phaseId}:evidence-valid`,
          occurredAt: now,
        }),
      );
    } else if (outcome.evidenceStatus === 'INVALID') {
      events.push(
        event({
          missionId,
          phaseId,
          agentId: request.agentId,
          eventType: 'EVIDENCE_REJECTED',
          payload: { reason: outcome.rejectionReason },
          idempotencyKey: `phase:${phaseId}:evidence-rejected`,
          occurredAt: now,
        }),
        event({
          missionId,
          phaseId,
          agentId: request.agentId,
          eventType: 'RECOVERY_STARTED',
          payload: { fallback: outcome.skill.fallback },
          idempotencyKey: `phase:${phaseId}:recovery-started`,
          occurredAt: now,
        }),
      );
    }

    const handoff = outcome.handoffTo
      ? {
          id: randomUUID(),
          fromAgentId: request.agentId,
          toAgentId: outcome.handoffTo,
          objectiveState: {
            missionState,
            phaseState: outcome.phaseState,
            acceptanceCriteria: outcome.skill.acceptanceCriteria,
          },
          delivered: outcome.skill.requiredEvidence,
          evidenceReceiptIds: outcome.receipt ? [outcome.receipt.receiptId] : [],
          openFindings: [],
          nextAction: `Continue ${outcome.skill.handoffTo} from the validated checkpoint`,
          acceptanceForNextAction:
            outcome.skill.acceptanceCriteria[0] ?? 'Preserve the validated mission state',
          createdAt: now,
        }
      : null;

    if (handoff) {
      events.push(
        event({
          missionId,
          phaseId,
          agentId: request.agentId,
          eventType: 'HANDOFF_CREATED',
          payload: { from: request.agentId, to: handoff.toAgentId },
          idempotencyKey: `phase:${phaseId}:handoff`,
          occurredAt: now,
        }),
      );
    }

    if (outcome.phaseState === 'COMPLETED') {
      events.push(
        event({
          missionId,
          phaseId,
          agentId: request.agentId,
          eventType: 'PHASE_COMPLETED',
          payload: { skillId: outcome.skill.skillId },
          idempotencyKey: `phase:${phaseId}:completed`,
          occurredAt: now,
        }),
      );
    }
    if (missionState === 'COMPLETED') {
      events.push(
        event({
          missionId,
          phaseId,
          agentId: request.agentId,
          eventType: 'MISSION_COMPLETED',
          payload: { completedBySkill: outcome.skill.skillId },
          idempotencyKey: `mission:${missionId}:completed`,
          occurredAt: now,
        }),
      );
    }

    const persisted = await this.repository.persistExecution({
      missionId,
      expectedMissionVersion: request.expectedMissionVersion,
      phase,
      permissionProfile: outcome.skill.permissionProfile,
      missionState,
      nextAgentId: outcome.handoffTo,
      receipt: outcome.receipt,
      evidenceStatus: outcome.evidenceStatus,
      handoff,
      events,
    });

    return {
      mission: toMissionResponse(persisted.mission),
      phaseId: persisted.phase.id,
      phaseState: persisted.phase.state,
      selectedSkill: outcome.skill,
      receipt: outcome.receipt,
      evidenceStatus: outcome.evidenceStatus,
      handoffTo: outcome.handoffTo,
    };
  }

  async timeline(missionId: string): Promise<McfMissionTimelineResponse> {
    const mission = await this.repository.findMission(missionId);
    if (!mission) {
      throw new McfMissionNotFoundError(missionId);
    }
    const events = await this.repository.listEvents(missionId);
    return {
      mission: toMissionResponse(mission),
      events: events.map(toEventResponse),
    };
  }

  async acceptCiCallback(request: McfCiCallbackRequest): Promise<McfCiCallbackResponse> {
    const mission = await this.repository.findMission(request.missionId);
    if (!mission) {
      throw new McfMissionNotFoundError(request.missionId);
    }
    const phase = await this.repository.findPhase(request.missionId, request.phaseId);
    if (!phase) {
      throw new McfPhaseNotFoundError(request.missionId, request.phaseId);
    }
    if (phase.skillId !== 'MCF-RUN-TESTS') {
      throw new McfPermissionDeniedError('CI callbacks may complete only MCF-RUN-TESTS phases');
    }

    const skill = await this.registry.load(phase.skillId);
    const succeeded = request.conclusion === 'success';
    const receipt = this.evidence.createTrustedReceipt({
      provider: 'github-actions',
      operation: 'workflow-result',
      resource: request.repository,
      externalId: request.workflowRunId,
      commitSha: request.commitSha,
      status: succeeded ? 'SUCCEEDED' : 'FAILED',
      observedAt: request.completedAt,
      metadata: {
        workflowName: request.workflowName,
        conclusion: request.conclusion,
        repository: request.repository,
      },
    });
    this.evidence.verify(receipt, {
      provider: 'github-actions',
      operation: 'workflow-result',
      resource: request.repository,
    });

    const now = new Date();
    const evidenceStatus = succeeded ? 'VALID' : 'INVALID';
    const missionState = succeeded ? 'EXECUTING' : 'RECOVERING';
    const phaseState = succeeded ? 'COMPLETED' : 'RECOVERING';
    const handoff = succeeded
      ? {
          id: randomUUID(),
          fromAgentId: phase.agentId,
          toAgentId: skill.handoffTo,
          objectiveState: { missionState, phaseState, conclusion: request.conclusion },
          delivered: skill.requiredEvidence,
          evidenceReceiptIds: [receipt.receiptId],
          openFindings: [],
          nextAction: `Audit CI evidence and continue mission ${request.missionId}`,
          acceptanceForNextAction:
            skill.acceptanceCriteria[0] ?? 'Confirm all critical tests passed',
          createdAt: now,
        }
      : null;

    const callbackKey = `ci:${request.workflowRunId}:${request.conclusion}`;
    const events: McfEventInput[] = [
      event({
        missionId: request.missionId,
        phaseId: request.phaseId,
        agentId: phase.agentId,
        eventType: 'CI_CALLBACK_RECEIVED',
        payload: {
          workflowName: request.workflowName,
          workflowRunId: request.workflowRunId,
          conclusion: request.conclusion,
          commitSha: request.commitSha,
        },
        idempotencyKey: callbackKey,
        occurredAt: now,
      }),
      event({
        missionId: request.missionId,
        phaseId: request.phaseId,
        agentId: phase.agentId,
        eventType: 'TOOL_RECEIPT_RECORDED',
        payload: { receiptId: receipt.receiptId, provider: receipt.provider },
        idempotencyKey: `receipt:${receipt.receiptId}:recorded`,
        occurredAt: now,
      }),
      event({
        missionId: request.missionId,
        phaseId: request.phaseId,
        agentId: phase.agentId,
        eventType: succeeded ? 'EVIDENCE_VALIDATED' : 'EVIDENCE_REJECTED',
        payload: { receiptId: receipt.receiptId, conclusion: request.conclusion },
        idempotencyKey: `phase:${request.phaseId}:ci-evidence:${request.workflowRunId}`,
        occurredAt: now,
      }),
    ];

    if (handoff) {
      events.push(
        event({
          missionId: request.missionId,
          phaseId: request.phaseId,
          agentId: phase.agentId,
          eventType: 'HANDOFF_CREATED',
          payload: { from: phase.agentId, to: handoff.toAgentId },
          idempotencyKey: `phase:${request.phaseId}:ci-handoff:${request.workflowRunId}`,
          occurredAt: now,
        }),
        event({
          missionId: request.missionId,
          phaseId: request.phaseId,
          agentId: phase.agentId,
          eventType: 'PHASE_COMPLETED',
          payload: {
            workflowRunId: request.workflowRunId,
            skillId: phase.skillId,
          },
          idempotencyKey: `phase:${request.phaseId}:ci-completed:${request.workflowRunId}`,
          occurredAt: now,
        }),
      );
    } else {
      events.push(
        event({
          missionId: request.missionId,
          phaseId: request.phaseId,
          agentId: phase.agentId,
          eventType: 'RECOVERY_STARTED',
          payload: { conclusion: request.conclusion, fallback: skill.fallback },
          idempotencyKey: `phase:${request.phaseId}:ci-recovery:${request.workflowRunId}`,
          occurredAt: now,
        }),
      );
    }

    const completed = await this.repository.completePendingPhase({
      missionId: request.missionId,
      phaseId: request.phaseId,
      receipt,
      evidenceStatus,
      missionState,
      phaseState,
      nextAgentId: handoff?.toAgentId ?? null,
      handoff,
      callbackIdempotencyKey: callbackKey,
      events,
    });

    return {
      accepted: true,
      duplicate: completed.duplicate,
      evidenceStatus,
      missionState: completed.mission.state,
    };
  }
}
