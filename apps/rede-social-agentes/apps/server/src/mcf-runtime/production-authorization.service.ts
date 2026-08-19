import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';

import { HumanDelegationGuard } from './human-delegation-guard.js';
import {
  McfMissionNotFoundError,
  McfPermissionDeniedError,
  McfPhaseNotFoundError,
} from './mcf-runtime.errors.js';
import {
  MCF_RUNTIME_REPOSITORY,
  type McfEventInput,
  type McfEventRecord,
  type McfMissionRecord,
  type McfPhaseRecord,
  type McfRuntimeRepository,
} from './mcf-runtime.repository.js';

export const PRODUCTION_GATE_EVENT_STORE = Symbol('PRODUCTION_GATE_EVENT_STORE');

export interface ProductionGateEventStore {
  appendGateEvent(event: McfEventInput): Promise<boolean>;
}

export interface RecordLeoOperationalGateRequest {
  missionId: string;
  phaseId: string;
  releaseSha: string;
  decision: 'APPROVE' | 'REJECT';
  sourceRef: string;
  evidenceRef: string;
}

export interface ResolveProductionAuthorizationRequest {
  missionId: string;
  phaseId: string;
  releaseSha: string;
}

export interface ProductionAuthorizationBlocked {
  state: 'BLOCKED';
  reason:
    | 'PRODUCTION_AUTHORIZATION_REQUIRED'
    | 'OPERATIONAL_GATE_REQUIRED'
    | 'OPERATIONAL_GATE_REJECTED'
    | 'OPERATIONAL_GATE_STALE';
  targetSha: string;
}

export interface ProductionAuthorizationGranted {
  state: 'AUTHORIZED';
  humanAuthority: 'LEANDRO';
  operationalGate: 'LEO';
  gateDecision: 'APPROVE';
  provenance: 'MCF_RUNTIME_PERSISTED_AUTHORIZATION';
  targetSha: string;
  sourceDecision: string;
  authorizationId: string;
  evidenceRef: string;
}

export type ProductionAuthorizationResolution =
  | ProductionAuthorizationBlocked
  | ProductionAuthorizationGranted;

interface HumanProductionAuthorization {
  sourceRef: string;
}

interface CanonicalOperationalGate {
  decision: 'APPROVE' | 'REJECT';
  evidenceRef: string;
  humanAuthorizationRef: string;
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase()
    .replaceAll('_', '-')
    .replaceAll(' ', '-');
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function blocked(
  reason: ProductionAuthorizationBlocked['reason'],
  targetSha: string,
): ProductionAuthorizationBlocked {
  return { state: 'BLOCKED', reason, targetSha };
}

function isLeo(agentId: string): boolean {
  return normalize(agentId) === 'leo';
}

function gateFromEvent(
  event: McfEventRecord,
  phaseId: string,
  releaseSha: string,
): CanonicalOperationalGate | null {
  if (event.phaseId !== phaseId || !event.agentId || !isLeo(event.agentId)) return null;
  if (event.eventType !== 'GATE_APPROVED' && event.eventType !== 'GATE_REJECTED') return null;

  const payload = asRecord(event.payload);
  if (!payload) return null;
  const expectedDecision = event.eventType === 'GATE_APPROVED' ? 'APPROVE' : 'REJECT';
  if (
    payload.gate !== 'PRODUCTION_PROMOTION' ||
    payload.operationalAuthority !== 'LEO' ||
    payload.decision !== expectedDecision ||
    payload.targetSha !== releaseSha ||
    !hasText(payload.evidenceRef) ||
    !hasText(payload.humanAuthorizationRef)
  ) {
    return null;
  }

  return {
    decision: expectedDecision,
    evidenceRef: payload.evidenceRef,
    humanAuthorizationRef: payload.humanAuthorizationRef,
  };
}

@Injectable()
export class ProductionAuthorizationService {
  private readonly humanDelegation = new HumanDelegationGuard();

  constructor(
    @Inject(MCF_RUNTIME_REPOSITORY) private readonly runtime: McfRuntimeRepository,
    @Inject(PRODUCTION_GATE_EVENT_STORE) private readonly gateStore: ProductionGateEventStore,
  ) {}

  async recordLeoOperationalGate(request: RecordLeoOperationalGateRequest): Promise<{
    accepted: true;
    duplicate: boolean;
    operationalGate: 'LEO';
    targetSha: string;
  }> {
    const { mission, phase } = await this.loadMissionAndPhase(request.missionId, request.phaseId);
    if (!isLeo(phase.agentId)) {
      throw new McfPermissionDeniedError('production operational gate must be owned by LÉO');
    }

    const humanAuthorization = this.resolveHumanProductionAuthorization(
      mission,
      phase,
      request.releaseSha,
    );
    if (!humanAuthorization) {
      throw new McfPermissionDeniedError(
        'production operational gate requires exact-SHA LEANDRO authorization',
      );
    }

    const now = new Date();
    const eventType = request.decision === 'APPROVE' ? 'GATE_APPROVED' : 'GATE_REJECTED';
    const event: McfEventInput = {
      id: randomUUID(),
      missionId: request.missionId,
      phaseId: request.phaseId,
      agentId: phase.agentId,
      eventType,
      payload: {
        gate: 'PRODUCTION_PROMOTION',
        operationalAuthority: 'LEO',
        decision: request.decision,
        targetSha: request.releaseSha,
        sourceRef: request.sourceRef,
        evidenceRef: request.evidenceRef,
        humanAuthorizationRef: humanAuthorization.sourceRef,
      },
      idempotencyKey: [
        'production-gate',
        request.missionId,
        request.phaseId,
        request.releaseSha,
        request.decision,
        request.sourceRef,
      ].join(':'),
      occurredAt: now,
    };

    const inserted = await this.gateStore.appendGateEvent(event);
    return {
      accepted: true,
      duplicate: !inserted,
      operationalGate: 'LEO',
      targetSha: request.releaseSha,
    };
  }

  async resolveProductionAuthorization(
    request: ResolveProductionAuthorizationRequest,
  ): Promise<ProductionAuthorizationResolution> {
    const { mission, phase } = await this.loadMissionAndPhase(request.missionId, request.phaseId);
    const humanAuthorization = this.resolveHumanProductionAuthorization(
      mission,
      phase,
      request.releaseSha,
    );
    if (!humanAuthorization) {
      return blocked('PRODUCTION_AUTHORIZATION_REQUIRED', request.releaseSha);
    }

    const events = await this.runtime.listEvents(request.missionId);
    let latestGate: CanonicalOperationalGate | null = null;
    for (const event of events) {
      const candidate = gateFromEvent(event, request.phaseId, request.releaseSha);
      if (candidate) latestGate = candidate;
    }

    if (!latestGate) {
      return blocked('OPERATIONAL_GATE_REQUIRED', request.releaseSha);
    }
    if (latestGate.humanAuthorizationRef !== humanAuthorization.sourceRef) {
      return blocked('OPERATIONAL_GATE_STALE', request.releaseSha);
    }
    if (latestGate.decision !== 'APPROVE') {
      return blocked('OPERATIONAL_GATE_REJECTED', request.releaseSha);
    }

    return {
      state: 'AUTHORIZED',
      humanAuthority: 'LEANDRO',
      operationalGate: 'LEO',
      gateDecision: 'APPROVE',
      provenance: 'MCF_RUNTIME_PERSISTED_AUTHORIZATION',
      targetSha: request.releaseSha,
      sourceDecision: humanAuthorization.sourceRef,
      authorizationId: humanAuthorization.sourceRef,
      evidenceRef: latestGate.evidenceRef,
    };
  }

  private async loadMissionAndPhase(
    missionId: string,
    phaseId: string,
  ): Promise<{ mission: McfMissionRecord; phase: McfPhaseRecord }> {
    const mission = await this.runtime.findMission(missionId);
    if (!mission) throw new McfMissionNotFoundError(missionId);
    const phase = await this.runtime.findPhase(missionId, phaseId);
    if (!phase) throw new McfPhaseNotFoundError(missionId, phaseId);
    return { mission, phase };
  }

  private resolveHumanProductionAuthorization(
    mission: McfMissionRecord,
    phase: McfPhaseRecord,
    releaseSha: string,
  ): HumanProductionAuthorization | null {
    if (
      mission.contract.contractSchemaVersion !== '1.1' ||
      !hasText(mission.contract.projectId) ||
      phase.skillId !== 'MCF-DEPLOY-VALIDATE'
    ) {
      return null;
    }

    const context = asRecord(phase.inputs.v11AuthorizationContext);
    const humanDecision = asRecord(context?.humanGateDecision);
    if (
      !context ||
      context.projectId !== mission.contract.projectId ||
      context.missionId !== mission.id ||
      !hasText(context.actionClass) ||
      normalize(context.actionClass) !== 'release-public' ||
      !hasText(context.environment) ||
      normalize(context.environment) !== 'production' ||
      context.reservedHumanAuthority !== true ||
      context.boundary !== `release-sha:${releaseSha}` ||
      humanDecision?.status !== 'APPROVED' ||
      !hasText(humanDecision.decidedBy) ||
      normalize(humanDecision.decidedBy) !== 'leandro' ||
      !hasText(humanDecision.sourceRef)
    ) {
      return null;
    }

    try {
      this.humanDelegation.assertAllowed(phase.agentId, {
        v11AuthorizationContext: {
          ...context,
          standingAuthorizations: [],
        },
      });
    } catch (error) {
      if (error instanceof McfPermissionDeniedError) return null;
      throw error;
    }

    return { sourceRef: humanDecision.sourceRef };
  }
}
