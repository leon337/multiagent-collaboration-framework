import type { McfStandingAuthorization } from '@rsa/contracts';

import { McfPermissionDeniedError } from './mcf-runtime.errors.js';

const allowedTriggers = new Set([
  'SECRET_ENTRY',
  'PERSONAL_AUTHENTICATION',
  'BILLING_OR_CONTRACT',
  'IRREVERSIBLE_EXTERNAL_ACTION',
  'PUBLIC_RELEASE',
  'LEGAL_OBLIGATION',
  'MATERIAL_STRATEGIC_DECISION',
  'EXPLICIT_HUMAN_REQUEST',
]);

export interface McfV11AuthorizationContext {
  projectId: string;
  missionId?: string | undefined;
  actionClass: string;
  environment: string;
  estimatedCost?:
    | {
        currency: string;
        amount: number;
      }
    | undefined;
  reversible: boolean;
  observedAt: string;
  boundary?: string | undefined;
  evidenceRefs: string[];
  reservedHumanAuthority: boolean;
  standingAuthorizations: McfStandingAuthorization[];
  teamFirst?:
    | {
        attempted: boolean;
        evidenceRefs: string[];
        fallbackExhausted: boolean;
      }
    | undefined;
  humanGateDecision?:
    | {
        status: 'PENDING' | 'APPROVED' | 'REJECTED';
        decidedBy?: string | undefined;
        sourceRef?: string | undefined;
      }
    | undefined;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasEvidenceList(value: unknown): value is unknown[] {
  return Array.isArray(value) && value.length > 0;
}

function deny(message: string): never {
  throw new McfPermissionDeniedError(message);
}

function parseIsoInstant(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    deny(`${label} must be a valid ISO timestamp`);
  }
  return parsed;
}

function normalizeList(values: string[]): Set<string> {
  return new Set(values.map(normalize));
}

function exclusionMatches(
  authorization: McfStandingAuthorization,
  context: McfV11AuthorizationContext,
): boolean {
  const exclusions = normalizeList(authorization.exclusions);
  const action = normalize(context.actionClass);
  const environment = normalize(context.environment);
  const boundary = context.boundary ? normalize(context.boundary) : null;
  return (
    exclusions.has(action) ||
    exclusions.has(`action:${action}`) ||
    exclusions.has(environment) ||
    exclusions.has(`environment:${environment}`) ||
    (boundary !== null && (exclusions.has(boundary) || exclusions.has(`boundary:${boundary}`)))
  );
}

function costFits(
  authorization: McfStandingAuthorization,
  context: McfV11AuthorizationContext,
): boolean {
  if (authorization.maximumCost === null) return true;
  if (context.estimatedCost === undefined) return false;
  return (
    normalize(context.estimatedCost.currency) === normalize(authorization.maximumCost.currency) &&
    Number.isFinite(context.estimatedCost.amount) &&
    context.estimatedCost.amount >= 0 &&
    context.estimatedCost.amount <= authorization.maximumCost.amount
  );
}

function evidenceFits(
  authorization: McfStandingAuthorization,
  context: McfV11AuthorizationContext,
): boolean {
  const evidence = new Set(context.evidenceRefs);
  return authorization.evidenceRequirements.every((requirement) => evidence.has(requirement));
}

function authorizationScopeFits(
  authorization: McfStandingAuthorization,
  context: McfV11AuthorizationContext,
): boolean {
  if (authorization.grantedBy !== 'LEANDRO' || !hasText(authorization.sourceDecisionRef)) {
    return false;
  }
  if (authorization.projectId !== context.projectId) return false;
  if (authorization.missionId !== undefined && authorization.missionId !== context.missionId) {
    return false;
  }
  if (authorization.status !== 'ACTIVE') return false;

  const observedAt = parseIsoInstant(context.observedAt, 'observedAt');
  if (
    authorization.expiresAt !== undefined &&
    parseIsoInstant(authorization.expiresAt, 'standing authorization expiresAt') <= observedAt
  ) {
    return false;
  }

  if (!normalizeList(authorization.actionClasses).has(normalize(context.actionClass))) return false;
  if (!normalizeList(authorization.environments).has(normalize(context.environment))) return false;
  if (authorization.reversibleOnly && !context.reversible) return false;
  if (
    authorization.boundary !== undefined &&
    (context.boundary === undefined ||
      normalize(authorization.boundary) !== normalize(context.boundary))
  ) {
    return false;
  }
  if (!costFits(authorization, context)) return false;
  if (!evidenceFits(authorization, context)) return false;
  return true;
}

function hasValidStandingAuthorization(context: McfV11AuthorizationContext): boolean {
  let excluded = false;
  let matched = false;

  for (const authorization of context.standingAuthorizations) {
    if (!authorizationScopeFits(authorization, context)) continue;
    if (exclusionMatches(authorization, context)) {
      excluded = true;
      continue;
    }
    matched = true;
  }

  return !excluded && matched;
}

function assertTeamFirst(context: McfV11AuthorizationContext): void {
  const teamFirst = context.teamFirst;
  if (
    teamFirst === undefined ||
    teamFirst.attempted !== true ||
    teamFirst.fallbackExhausted !== true ||
    !hasEvidenceList(teamFirst.evidenceRefs)
  ) {
    deny('v1.1 human gate requires TEAM_FIRST attempt, evidence and exhausted fallback');
  }
}

function assertLeandroGate(context: McfV11AuthorizationContext): void {
  assertTeamFirst(context);
  const decision = context.humanGateDecision;
  if (decision?.status !== 'APPROVED') {
    deny('reserved human authority requires a human gate approved by LEANDRO');
  }
  if (normalize(String(decision.decidedBy ?? '')) !== 'leandro') {
    deny('v1.1 human gate approval must come from LEANDRO');
  }
  if (!hasText(decision.sourceRef)) {
    deny('v1.1 human gate approval requires a sourceRef');
  }
}

function isV11AuthorizationContext(value: unknown): value is McfV11AuthorizationContext {
  if (!isRecord(value)) return false;
  return (
    hasText(value.projectId) &&
    hasText(value.actionClass) &&
    hasText(value.environment) &&
    typeof value.reversible === 'boolean' &&
    hasText(value.observedAt) &&
    Array.isArray(value.evidenceRefs) &&
    typeof value.reservedHumanAuthority === 'boolean' &&
    Array.isArray(value.standingAuthorizations)
  );
}

export function isHumanAuthorityAgent(agentId: string): boolean {
  return normalize(agentId) === 'leandro';
}

/**
 * Prevents the human authority from becoming the default technical operator.
 * Legacy v1.0 human intervention remains unchanged. v1.1 additionally permits
 * bounded standing authorizations and routes reserved out-of-envelope actions
 * through TEAM_FIRST before accepting an explicit LEANDRO gate decision.
 */
export class HumanDelegationGuard {
  assertMissionAgents(agentIds: string[]): void {
    if (agentIds.some(isHumanAuthorityAgent)) {
      deny('Leandro cannot be selected as a mission agent');
    }
  }

  assertHandoffTarget(agentId: string, selectedAgents: string[]): void {
    if (isHumanAuthorityAgent(agentId)) {
      deny('Leandro cannot receive a technical handoff');
    }
    if (!selectedAgents.includes(agentId)) {
      deny(`handoff target ${agentId} was not selected by mission contract`);
    }
  }

  assertAllowed(agentId: string, inputs: Record<string, unknown>): void {
    if (isHumanAuthorityAgent(agentId)) {
      deny('Leandro cannot be used as an executing agent');
    }

    const v11AuthorizationContext = inputs.v11AuthorizationContext;
    if (v11AuthorizationContext !== undefined && v11AuthorizationContext !== null) {
      if (!isV11AuthorizationContext(v11AuthorizationContext)) {
        deny('v11AuthorizationContext is malformed');
      }
      if (
        !hasValidStandingAuthorization(v11AuthorizationContext) &&
        v11AuthorizationContext.reservedHumanAuthority
      ) {
        assertLeandroGate(v11AuthorizationContext);
      }
    }

    const request = inputs.humanInterventionRequest;
    if (request === undefined || request === null) {
      return;
    }
    if (!isRecord(request)) {
      deny('humanInterventionRequest must be an object');
    }
    if (request.mode !== 'TEAM_FIRST') {
      deny('human intervention requires mode=TEAM_FIRST');
    }
    if (request.teamExecutionAttempted !== true) {
      deny('human intervention requires a real team execution attempt');
    }
    if (!hasEvidenceList(request.attemptedActions)) {
      deny('human intervention requires attemptedActions');
    }
    if (!hasEvidenceList(request.evidence)) {
      deny('human intervention requires limitation evidence');
    }
    if (!hasText(request.toolLimitation)) {
      deny('human intervention requires a toolLimitation');
    }
    if (request.fallbackExhausted !== true) {
      deny('human intervention is blocked while an executable fallback remains');
    }

    const trigger = request.trigger;
    if (!hasText(trigger) || !allowedTriggers.has(trigger)) {
      deny('human intervention trigger is not reserved');
    }
    if (request.leoApproved !== true) {
      deny('human intervention requires Léo approval');
    }
    if (request.actionCount !== 1) {
      deny('human intervention requires exactly one action');
    }
    if (!hasText(request.action)) {
      deny('human intervention requires an explicit action');
    }

    const hasPath = hasText(request.navigationPath);
    const hasLink = hasText(request.directLink);
    if (!hasLink && !hasPath) {
      deny('human intervention requires a direct link or navigation path');
    }
    if (!hasText(request.risk)) {
      deny('human intervention requires an explicit risk');
    }
    if (!hasText(request.expectedResult)) {
      deny('human intervention requires an expected result');
    }
  }
}
