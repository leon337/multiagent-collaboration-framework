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

/**
 * Prevents the human authority from becoming the default technical operator.
 *
 * A human intervention request is accepted only after the team has attempted
 * execution, captured evidence of the tool limitation, exhausted a fallback,
 * reduced the intervention to one unavoidable action and obtained Léo's gate.
 */
export class HumanDelegationGuard {
  assertAllowed(agentId: string, inputs: Record<string, unknown>): void {
    if (normalize(agentId) === 'leandro') {
      throw new McfPermissionDeniedError(
        'Leandro is the final human authority and cannot be used as an executing agent',
      );
    }

    const rawRequest = inputs.humanInterventionRequest;
    if (rawRequest === undefined || rawRequest === null) {
      return;
    }
    if (!isRecord(rawRequest)) {
      throw new McfPermissionDeniedError('humanInterventionRequest must be an object');
    }

    if (rawRequest.mode !== 'TEAM_FIRST') {
      throw new McfPermissionDeniedError('human intervention requires mode=TEAM_FIRST');
    }
    if (rawRequest.teamExecutionAttempted !== true) {
      throw new McfPermissionDeniedError(
        'human intervention requires a real team execution attempt first',
      );
    }
    if (!hasEvidenceList(rawRequest.attemptedActions)) {
      throw new McfPermissionDeniedError(
        'human intervention requires attemptedActions with at least one action',
      );
    }
    if (!hasEvidenceList(rawRequest.evidence)) {
      throw new McfPermissionDeniedError(
        'human intervention requires evidence of the failed or unavailable automation',
      );
    }
    if (!hasText(rawRequest.toolLimitation)) {
      throw new McfPermissionDeniedError(
        'human intervention requires an explicit toolLimitation',
      );
    }
    if (rawRequest.fallbackExhausted !== true) {
      throw new McfPermissionDeniedError(
        'human intervention is blocked while an executable fallback remains',
      );
    }
    if (!hasText(rawRequest.trigger) || !allowedTriggers.has(rawRequest.trigger)) {
      throw new McfPermissionDeniedError('human intervention trigger is not reserved');
    }
    if (rawRequest.leoApproved !== true) {
      throw new McfPermissionDeniedError('human intervention requires Léo approval');
    }
    if (rawRequest.actionCount !== 1) {
      throw new McfPermissionDeniedError(
        'human intervention must be reduced to exactly one unavoidable action',
      );
    }
    if (!hasText(rawRequest.action)) {
      throw new McfPermissionDeniedError('human intervention requires one explicit action');
    }
    if (!hasText(rawRequest.directLink) && !hasText(rawRequest.navigationPath)) {
      throw new McfPermissionDeniedError(
        'human intervention requires a directLink or an exact navigationPath',
      );
    }
    if (!hasText(rawRequest.risk)) {
      throw new McfPermissionDeniedError('human intervention requires an explicit risk');
    }
    if (!hasText(rawRequest.expectedResult)) {
      throw new McfPermissionDeniedError(
        'human intervention requires an expectedResult for immediate verification',
      );
    }
  }
}
