import { Inject, Injectable } from '@nestjs/common';
import type {
  McfBlockedAlertReconcileResponse,
  McfBlockedMissionListResponse,
  McfBlockedMissionSummary,
  McfEventType,
  McfMissionBlockContext,
  McfMissionEventResponse,
  McfMissionObservationResponse,
  McfMissionResponse,
} from '@rsa/contracts';
import { randomUUID } from 'node:crypto';

import { McfMissionNotFoundError } from './mcf-runtime.errors.js';
import {
  MCF_RUNTIME_REPOSITORY,
  type McfEventInput,
  type McfEventRecord,
  type McfMissionRecord,
  type McfPhaseRecord,
  type McfRuntimeRepository,
} from './mcf-runtime.repository.js';
import type { MissionObservabilityRepository } from './mission-observability.repository.js';

const blockingEventTypes = new Set<McfEventType>([
  'MISSION_STATE_CHANGED',
  'PERMISSION_DENIED',
  'EVIDENCE_REJECTED',
  'EXTERNAL_ACTION_FAILED',
  'EXTERNAL_ACTION_ABANDONED',
  'GATE_REQUIRED',
  'GATE_REJECTED',
  'RECOVERY_STARTED',
]);

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

function toPhaseResponse(
  phase: McfPhaseRecord | null,
): McfMissionObservationResponse['currentPhase'] {
  if (!phase) return null;
  return {
    id: phase.id,
    skillId: phase.skillId,
    agentId: phase.agentId,
    state: phase.state,
    cycle: phase.cycle,
    startedAt: phase.startedAt?.toISOString() ?? null,
    updatedAt: phase.updatedAt.toISOString(),
  };
}

function firstString(payload: Record<string, unknown>, keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  }
  return null;
}

function deriveBlockContext(events: readonly McfEventRecord[]): McfMissionBlockContext {
  const source = [...events]
    .reverse()
    .find(
      (event) =>
        event.eventType !== 'MISSION_BLOCKED_ALERT_RAISED' &&
        blockingEventTypes.has(event.eventType),
    );

  if (!source) {
    return {
      reason: 'MISSION_STATE_BLOCKED_RISK',
      eventType: null,
      eventId: null,
      occurredAt: null,
      payload: {},
    };
  }

  return {
    reason:
      firstString(source.payload, ['reason', 'error', 'code', 'message']) ??
      `BLOCKED_AFTER_${source.eventType}`,
    eventType: source.eventType,
    eventId: source.id,
    occurredAt: source.occurredAt.toISOString(),
    payload: source.payload,
  };
}

@Injectable()
export class MissionObservabilityService {
  constructor(
    @Inject(MCF_RUNTIME_REPOSITORY)
    private readonly runtimeRepository: McfRuntimeRepository,
    private readonly observabilityRepository: MissionObservabilityRepository,
  ) {}

  async getMissionObservation(missionId: string): Promise<McfMissionObservationResponse> {
    const mission = await this.runtimeRepository.findMission(missionId);
    if (!mission) throw new McfMissionNotFoundError(missionId);

    const [phase, events] = await Promise.all([
      mission.currentPhaseId
        ? this.runtimeRepository.findPhase(mission.id, mission.currentPhaseId)
        : Promise.resolve(null),
      this.runtimeRepository.listEvents(mission.id),
    ]);

    const latestEvent = events.at(-1) ?? null;
    const blocked = mission.state === 'BLOCKED_RISK';

    return {
      mission: toMissionResponse(mission),
      currentPhase: toPhaseResponse(phase),
      latestEvent: latestEvent ? toEventResponse(latestEvent) : null,
      blocked,
      blockContext: blocked ? deriveBlockContext(events) : null,
    };
  }

  async listBlockedMissions(): Promise<McfBlockedMissionListResponse> {
    const missions = await this.observabilityRepository.listMissionsByStates(['BLOCKED_RISK']);
    const summaries = await Promise.all(missions.map((mission) => this.toBlockedSummary(mission)));

    return {
      missions: summaries,
      count: summaries.length,
      sourceOfTruth: 'MCF_PERSISTENCE_AND_EVENT_LEDGER',
    };
  }

  async reconcileBlockedAlerts(): Promise<McfBlockedAlertReconcileResponse> {
    const missions = await this.observabilityRepository.listMissionsByStates(['BLOCKED_RISK']);
    const events: McfEventInput[] = [];

    for (const mission of missions) {
      const timeline = await this.runtimeRepository.listEvents(mission.id);
      const context = deriveBlockContext(timeline);
      events.push({
        id: randomUUID(),
        missionId: mission.id,
        phaseId: mission.currentPhaseId,
        agentId: mission.currentAgentId,
        eventType: 'MISSION_BLOCKED_ALERT_RAISED',
        payload: {
          missionState: mission.state,
          missionVersion: mission.version,
          reason: context.reason,
          sourceEventType: context.eventType,
          sourceEventId: context.eventId,
          externalNotification: false,
          humanActionRequired: false,
        },
        idempotencyKey: `mission:${mission.id}:blocked-alert:v${mission.version}`,
        occurredAt: new Date(),
      });
    }

    const result = await this.observabilityRepository.appendEventsIdempotently(events);
    return {
      blockedMissionsObserved: missions.length,
      alertsInserted: result.inserted,
      duplicates: result.duplicates,
      externalNotification: false,
      humanActionRequired: false,
    };
  }

  private async toBlockedSummary(mission: McfMissionRecord): Promise<McfBlockedMissionSummary> {
    const events = await this.runtimeRepository.listEvents(mission.id);
    return {
      missionId: mission.id,
      title: mission.contract.title,
      state: 'BLOCKED_RISK',
      currentPhaseId: mission.currentPhaseId,
      currentAgentId: mission.currentAgentId,
      version: mission.version,
      updatedAt: mission.updatedAt.toISOString(),
      blockContext: deriveBlockContext(events),
    };
  }
}
