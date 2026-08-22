const G2B_PROTOCOL = 'MCF_WORKSPACE_MUTATION_V1' as const;
const G2B_RESULT_PROTOCOL = 'MCF_WORKSPACE_MUTATION_RESULT_V1' as const;
const G2B_PILOT_MISSION_ID = 'CONTROL-BRIDGE-G2B-PILOT' as const;
const G2B_DECLARED_ACTOR = 'MESTRE_MCF' as const;
const G2B_OPERATIONS = ['workspace.write', 'rollback', 'status', 'revoke'] as const;
const G2B_STATUSES = [
  'PASS',
  'REFUSED',
  'CONFLICT',
  'FAILED',
  'TIMEOUT',
  'ROLLED_BACK',
  'REVOKED',
] as const;

const REQUEST_ID = /^[A-Z0-9][A-Z0-9-]{0,127}$/u;
const SHA256 = /^[0-9a-f]{64}$/u;
const COMMIT_SHA = /^[0-9a-f]{40}$/u;
const DNS_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/u;

export type ControlBridgeG2bOperation = (typeof G2B_OPERATIONS)[number];
export type ControlBridgeG2bStatus = (typeof G2B_STATUSES)[number];

export interface ControlBridgeG2bProject {
  tenant: string;
  name: string;
  environment: 'dev' | 'staging';
}

export type ControlBridgeG2bCommand =
  | {
      operation: 'workspace.write';
      path: string;
      content: string;
      precondition: { state: 'ABSENT' } | { sha256: string };
    }
  | { operation: 'rollback'; originalRequestId: string }
  | { operation: 'status' }
  | { operation: 'revoke' };

export interface ControlBridgeG2bGovernanceContext {
  mcfMissionId: string;
  phaseId: string;
  agentId: string;
  permissionProfile: string;
  permissionRef: string;
  permissionGranted: boolean;
  authorizedScope: boolean;
  sourceSha: string;
  bridgeRequestId: string;
  project: ControlBridgeG2bProject;
}

export interface ControlBridgeG2bRequest {
  protocol: typeof G2B_PROTOCOL;
  request_id: string;
  mission_id: typeof G2B_PILOT_MISSION_ID;
  declared_actor: typeof G2B_DECLARED_ACTOR;
  project: ControlBridgeG2bProject;
  operation: ControlBridgeG2bOperation;
  arguments: Record<string, unknown>;
}

export interface ControlBridgeG2bCorrelation {
  protocol: 'MCF_CONTROL_BRIDGE_CORRELATION_V1';
  mcfMissionId: string;
  phaseId: string;
  agentId: string;
  permissionProfile: string;
  permissionRef: string;
  sourceSha: string;
  bridgeRequestId: string;
  bridgeMissionId: typeof G2B_PILOT_MISSION_ID;
  declaredActor: typeof G2B_DECLARED_ACTOR;
  operation: ControlBridgeG2bOperation;
  project: ControlBridgeG2bProject;
}

export interface PreparedControlBridgeG2bDispatch {
  request: ControlBridgeG2bRequest;
  correlation: ControlBridgeG2bCorrelation;
}

export type ControlBridgeG2bNormalizedOutcome =
  | 'SUCCESS'
  | 'REJECTED'
  | 'CONFLICT'
  | 'INFRA_ERROR'
  | 'TIMEOUT'
  | 'ROLLED_BACK'
  | 'REVOKED';

export interface ControlBridgeG2bNormalizedResult {
  outcome: ControlBridgeG2bNormalizedOutcome;
  receiptEligible: boolean;
  requestId: string;
  requestDigest: string;
  status: ControlBridgeG2bStatus;
  replayed: boolean;
  raw: Record<string, unknown>;
}

export class ControlBridgeG2bPreparationError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = 'ControlBridgeG2bPreparationError';
  }
}

function fail(code: string, message: string): never {
  throw new ControlBridgeG2bPreparationError(code, message);
}

function requireNonEmpty(value: string, field: string): void {
  if (value.trim().length === 0 || value !== value.trim()) {
    fail('INVALID_GOVERNANCE_CONTEXT', `${field} must be a non-empty canonical string`);
  }
}

function assertProject(project: ControlBridgeG2bProject): void {
  if (
    project.tenant.length > 63 ||
    project.name.length > 63 ||
    !DNS_LABEL.test(project.tenant) ||
    !DNS_LABEL.test(project.name) ||
    !['dev', 'staging'].includes(project.environment)
  ) {
    fail('OUT_OF_SCOPE', 'project must match the bounded G2-B dev/staging DNS-label scope');
  }
}

function assertGovernanceContext(context: ControlBridgeG2bGovernanceContext): void {
  requireNonEmpty(context.mcfMissionId, 'mcfMissionId');
  requireNonEmpty(context.phaseId, 'phaseId');
  requireNonEmpty(context.agentId, 'agentId');
  requireNonEmpty(context.permissionProfile, 'permissionProfile');
  requireNonEmpty(context.permissionRef, 'permissionRef');
  if (!context.permissionGranted || !context.authorizedScope) {
    fail('MISSION_NOT_AUTHORIZED', 'permission and authorized scope are required before preparation');
  }
  if (!COMMIT_SHA.test(context.sourceSha)) {
    fail('INVALID_SOURCE_SHA', 'sourceSha must be the exact lowercase 40-character commit SHA');
  }
  if (!REQUEST_ID.test(context.bridgeRequestId)) {
    fail('INVALID_REQUEST_ID', 'bridgeRequestId does not satisfy the G2-B request id contract');
  }
  assertProject(context.project);
}

function argumentsFor(command: ControlBridgeG2bCommand): Record<string, unknown> {
  switch (command.operation) {
    case 'workspace.write': {
      if (!command.path || command.path !== command.path.trim()) {
        return fail('INVALID_PATH', 'workspace.write requires a non-empty canonical path');
      }
      if (Buffer.byteLength(command.content, 'utf8') > 65_536) {
        return fail('CONTENT_TOO_LARGE', 'workspace.write content exceeds the G2-B 65536-byte limit');
      }
      if ('sha256' in command.precondition && !SHA256.test(command.precondition.sha256)) {
        return fail('INVALID_PRECONDITION', 'sha256 precondition must be lowercase SHA-256');
      }
      return {
        path: command.path,
        content: command.content,
        precondition: command.precondition,
      };
    }
    case 'rollback':
      if (!REQUEST_ID.test(command.originalRequestId)) {
        return fail('INVALID_ORIGINAL_REQUEST_ID', 'rollback requires a valid original request id');
      }
      return { original_request_id: command.originalRequestId };
    case 'status':
    case 'revoke':
      return {};
  }
}

export function prepareControlBridgeG2bDispatch(
  context: ControlBridgeG2bGovernanceContext,
  command: ControlBridgeG2bCommand,
): PreparedControlBridgeG2bDispatch {
  assertGovernanceContext(context);
  if (!G2B_OPERATIONS.includes(command.operation)) {
    return fail('UNKNOWN_OPERATION', 'operation is not part of the frozen G2-B pilot allowlist');
  }

  const request: ControlBridgeG2bRequest = {
    protocol: G2B_PROTOCOL,
    request_id: context.bridgeRequestId,
    mission_id: G2B_PILOT_MISSION_ID,
    declared_actor: G2B_DECLARED_ACTOR,
    project: { ...context.project },
    operation: command.operation,
    arguments: argumentsFor(command),
  };

  return {
    request,
    correlation: {
      protocol: 'MCF_CONTROL_BRIDGE_CORRELATION_V1',
      mcfMissionId: context.mcfMissionId,
      phaseId: context.phaseId,
      agentId: context.agentId,
      permissionProfile: context.permissionProfile,
      permissionRef: context.permissionRef,
      sourceSha: context.sourceSha,
      bridgeRequestId: context.bridgeRequestId,
      bridgeMissionId: G2B_PILOT_MISSION_ID,
      declaredActor: G2B_DECLARED_ACTOR,
      operation: command.operation,
      project: { ...context.project },
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sameProject(actual: unknown, expected: ControlBridgeG2bProject): boolean {
  if (!isRecord(actual)) return false;
  return (
    actual.tenant === expected.tenant &&
    actual.name === expected.name &&
    actual.environment === expected.environment
  );
}

function normalizeOutcome(status: ControlBridgeG2bStatus): ControlBridgeG2bNormalizedOutcome {
  switch (status) {
    case 'PASS':
      return 'SUCCESS';
    case 'REFUSED':
      return 'REJECTED';
    case 'CONFLICT':
      return 'CONFLICT';
    case 'FAILED':
      return 'INFRA_ERROR';
    case 'TIMEOUT':
      return 'TIMEOUT';
    case 'ROLLED_BACK':
      return 'ROLLED_BACK';
    case 'REVOKED':
      return 'REVOKED';
  }
}

export function normalizeControlBridgeG2bResult(
  prepared: PreparedControlBridgeG2bDispatch,
  currentSourceSha: string,
  value: unknown,
): ControlBridgeG2bNormalizedResult {
  if (!isRecord(value)) fail('INVALID_RESPONSE', 'bridge response must be an object');
  if (value.protocol !== G2B_RESULT_PROTOCOL) {
    fail('INVALID_RESPONSE', 'bridge response protocol is inconsistent');
  }
  if (currentSourceSha !== prepared.correlation.sourceSha || !COMMIT_SHA.test(currentSourceSha)) {
    fail('WRONG_SOURCE_SHA', 'result cannot be accepted under a different MCF source SHA');
  }
  if (value.request_id !== prepared.request.request_id) {
    fail('CORRELATION_MISMATCH', 'bridge result request id does not match the prepared dispatch');
  }
  if (value.mission_id !== G2B_PILOT_MISSION_ID || value.declared_actor !== G2B_DECLARED_ACTOR) {
    fail('CORRELATION_MISMATCH', 'bridge result mission or declared actor is inconsistent');
  }
  if (value.operation !== prepared.request.operation || !sameProject(value.project, prepared.request.project)) {
    fail('CORRELATION_MISMATCH', 'bridge result operation or project is inconsistent');
  }
  if (typeof value.request_digest !== 'string' || !SHA256.test(value.request_digest)) {
    fail('EVIDENCE_MISSING', 'bridge result requires a canonical request digest');
  }
  if (typeof value.replayed !== 'boolean') {
    fail('INVALID_RESPONSE', 'bridge result replay marker is missing or invalid');
  }
  if (typeof value.status !== 'string' || !(G2B_STATUSES as readonly string[]).includes(value.status)) {
    fail('INVALID_RESPONSE', 'bridge result status is unsupported');
  }

  const status = value.status as ControlBridgeG2bStatus;
  return {
    outcome: normalizeOutcome(status),
    receiptEligible: status === 'PASS' || status === 'ROLLED_BACK' || status === 'REVOKED',
    requestId: value.request_id as string,
    requestDigest: value.request_digest,
    status,
    replayed: value.replayed,
    raw: value,
  };
}
