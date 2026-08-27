import { McfPermissionDeniedError } from './mcf-runtime.errors.js';

export interface AuthenticatedHumanExecutionProof {
  accountId: string;
  sourceRef: string;
}

export interface HumanAuthorityProof {
  accountId: string;
  authority: 'LEANDRO';
  sourceRef: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function denyReservedHumanAuthority(): never {
  throw new McfPermissionDeniedError(
    'reserved human gate decision requires the authenticated reserved human authority account',
  );
}
export function canonicalizeHumanGateDecision(
  inputs: Record<string, unknown>,
  authenticatedHuman: AuthenticatedHumanExecutionProof | undefined,
  reservedHumanAuthorityAccountId: string | undefined,
): Record<string, unknown> {
  const context = isRecord(inputs.v11AuthorizationContext) ? inputs.v11AuthorizationContext : null;
  const decision =
    context && isRecord(context.humanGateDecision) ? context.humanGateDecision : null;
  if (!decision || (decision.status !== 'APPROVED' && decision.status !== 'REJECTED')) {
    return inputs;
  }
  if (
    !authenticatedHuman ||
    !reservedHumanAuthorityAccountId ||
    authenticatedHuman.accountId !== reservedHumanAuthorityAccountId
  ) {
    denyReservedHumanAuthority();
  }
  return {
    ...inputs,
    v11AuthorizationContext: {
      ...context,
      humanGateDecision: {
        status: decision.status,
        decidedBy: 'LEANDRO',
        accountId: authenticatedHuman.accountId,
        sourceRef: authenticatedHuman.sourceRef,
      },
    },
  };
}

export function readApprovedHumanAuthorityProof(
  value: unknown,
  reservedHumanAuthorityAccountId: string | undefined,
): HumanAuthorityProof | null {
  if (!reservedHumanAuthorityAccountId || !isRecord(value)) return null;
  if (
    value.status !== 'APPROVED' ||
    value.decidedBy !== 'LEANDRO' ||
    value.accountId !== reservedHumanAuthorityAccountId ||
    typeof value.sourceRef !== 'string' ||
    value.sourceRef.trim().length === 0
  ) {
    return null;
  }
  return {
    accountId: reservedHumanAuthorityAccountId,
    authority: 'LEANDRO',
    sourceRef: value.sourceRef,
  };
}
