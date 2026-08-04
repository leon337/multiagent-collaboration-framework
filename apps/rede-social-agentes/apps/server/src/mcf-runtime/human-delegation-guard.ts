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

function normalize(value: string): string {
  return value.trim().toLowerCase().replaceAll('_', '-').replaceAll(' ', '-');
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

/**
 * Prevents the human authority from becoming the default technical operator.
 * A request is accepted only after a real team attempt, evidenced limitation,
 * exhausted fallback, one unavoidable action and Léo's approval.
 */
export class HumanDelegationGuard {
  assertAllowed(agentId: string, inputs: Record<string, unknown>): void {
    if (normalize(agentId) === 'leandro') {
      deny('Leandro cannot be used as an executing agent');
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
