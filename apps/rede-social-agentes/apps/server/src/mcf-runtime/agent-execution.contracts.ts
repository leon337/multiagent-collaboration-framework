export type AgentExecutionProviderMode = 'MANAGED' | 'APPLICATION_OWNED' | 'LOCAL_SELF_HOSTED';

export type AgentExecutionLifecycle =
  | 'QUEUED'
  | 'RUNNING'
  | 'PAUSED'
  | 'INTERRUPT_REQUESTED'
  | 'CANCEL_REQUESTED'
  | 'COMPLETED'
  | 'FAILED'
  | 'EFFECT_UNKNOWN';

export type AgentExecutionCapability =
  | 'PERSISTENT_CONTEXT'
  | 'BACKGROUND_EXECUTION'
  | 'SCHEDULING'
  | 'COMPUTER_USE'
  | 'CONNECTED_APPS'
  | 'PARALLEL_SUBAGENTS'
  | 'HUMAN_APPROVAL'
  | 'RESUMABLE_STATE'
  | 'TRACE_EXPORT';

export interface AgentRoleContract {
  agentId: string;
  role: string;
  version: string;
  capabilities: readonly string[];
}

export interface ExecutionProviderContract {
  providerId: string;
  mode: AgentExecutionProviderMode;
  version: string;
  capabilities: readonly AgentExecutionCapability[];
}

export interface AuthorityEnvelope {
  authorityId: string;
  issuer: 'HUMAN' | 'MISSION';
  missionId: string;
  allowedActions: readonly string[];
  providerScope: readonly string[];
  expiresAt: string | null;
  approvalRequired: boolean;
}

export interface AgentExecutionRequest {
  missionId: string;
  runId: string;
  agent: AgentRoleContract;
  provider: ExecutionProviderContract;
  authority: AuthorityEnvelope;
  prompt: string;
  requestedCapabilities: readonly AgentExecutionCapability[];
  metadata?: Readonly<Record<string, unknown>>;
}

export interface AgentExecutionHandle {
  missionId: string;
  runId: string;
  providerId: string;
  providerExecutionId: string;
}

export interface AgentExecutionStatus {
  handle: AgentExecutionHandle;
  lifecycle: AgentExecutionLifecycle;
  observedAt: string;
  providerState: string | null;
  effectState: 'NONE_OBSERVED' | 'EFFECT_OBSERVED' | 'EFFECT_UNKNOWN';
  detail?: string;
}

export interface AgentExecutionEvidence {
  evidenceId: string;
  providerId: string;
  providerExecutionId: string;
  kind: 'TRACE' | 'ARTIFACT' | 'RECEIPT' | 'STATUS';
  sourceRef: string;
  observedAt: string;
  digest: string | null;
  metadata: Readonly<Record<string, unknown>>;
}

export interface AgentExecutionResult {
  handle: AgentExecutionHandle;
  lifecycle: Extract<AgentExecutionLifecycle, 'COMPLETED' | 'FAILED' | 'EFFECT_UNKNOWN'>;
  output: unknown;
  evidence: readonly AgentExecutionEvidence[];
}

export interface AgentExecutionProviderAdapter {
  readonly provider: ExecutionProviderContract;
  start(request: AgentExecutionRequest): Promise<AgentExecutionHandle>;
  resume(handle: AgentExecutionHandle): Promise<AgentExecutionStatus>;
  interrupt(handle: AgentExecutionHandle): Promise<AgentExecutionStatus>;
  cancel(handle: AgentExecutionHandle): Promise<AgentExecutionStatus>;
  status(handle: AgentExecutionHandle): Promise<AgentExecutionStatus>;
  collectEvidence(handle: AgentExecutionHandle): Promise<readonly AgentExecutionEvidence[]>;
}

export function assertAuthorityEnvelope(
  request: AgentExecutionRequest,
  now = new Date(),
): void {
  if (request.authority.missionId !== request.missionId) {
    throw new Error('authority envelope missionId does not match execution missionId');
  }

  if (
    request.authority.providerScope.length > 0 &&
    !request.authority.providerScope.includes(request.provider.providerId)
  ) {
    throw new Error('authority envelope does not authorize the selected execution provider');
  }

  if (request.authority.expiresAt) {
    const expiresAt = new Date(request.authority.expiresAt);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= now.getTime()) {
      throw new Error('authority envelope is expired or invalid');
    }
  }

  if (
    request.authority.approvalRequired &&
    request.authority.issuer !== 'HUMAN'
  ) {
    throw new Error('human approval is required but the authority issuer is not HUMAN');
  }
}

export function assertRequestedCapabilities(
  request: AgentExecutionRequest,
): void {
  const available = new Set(request.provider.capabilities);
  const missing = request.requestedCapabilities.filter((capability) => !available.has(capability));
  if (missing.length > 0) {
    throw new Error(
      `execution provider ${request.provider.providerId} lacks capabilities: ${missing.join(', ')}`,
    );
  }
}
