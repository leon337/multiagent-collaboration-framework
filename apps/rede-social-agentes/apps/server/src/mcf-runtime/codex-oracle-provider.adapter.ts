import { createHash } from 'node:crypto';

import type {
  AgentExecutionEvidence,
  AgentExecutionHandle,
  AgentExecutionProviderAdapter,
  AgentExecutionRequest,
  AgentExecutionStatus,
} from './agent-execution.contracts.js';

/**
 * MCF-ORACLE-001 P3 CANDIDATE.
 *
 * Never register with the production MCF module before human constitutional
 * authorization. The bridge runs on the Codex-authenticated host; no OAuth
 * token or commercial OpenAI API key crosses this interface.
 */
export const ORACLE_CODEX_EXPERIMENTAL_PROVIDER = {
  providerId: 'mcf-oracle-codex-cli-experimental',
  mode: 'LOCAL_SELF_HOSTED',
  version: '0.1.0-candidate',
  capabilities: ['PERSISTENT_CONTEXT', 'RESUMABLE_STATE', 'TRACE_EXPORT'],
} as const;

export interface OracleBridgeDecision {
  schema_version: string;
  mission_id: string;
  request_id: string;
  decision_id: string;
  status: 'PROPOSED' | 'BLOCKED' | 'REPLAN' | 'REVIEW';
  rationale: string;
  strategy: readonly unknown[];
  specialists: readonly string[];
  gates: readonly string[];
  acceptance_evidence: readonly string[];
  needs_human_approval: boolean;
}

export interface OracleBridgeResult {
  status: 'COMPLETED';
  mission_id: string;
  session_epoch: number;
  decision: OracleBridgeDecision;
}

/** The implementation of this transport is local to the authenticated host. */
export interface OracleBridgeClient {
  consult(request: {
    missionId: string;
    requestId: string;
    prompt: string;
    sessionEpoch: number;
  }): Promise<OracleBridgeResult>;
}

interface CompletedExecution {
  handle: AgentExecutionHandle;
  evidence: AgentExecutionEvidence;
  decisionId: string;
}

/**
 * Adapter candidate wrapping the Canonical AgentExecutionService interface.
 * Execution authority remains with the MCF AuthorityEnvelope/HDF; generated
 * text can NEVER initiate an external side effect or approve a human gate.
 *
 * Registry binding is intentionally absent from mcf-runtime.module.ts.
 */
export class CodexOracleProviderAdapter implements AgentExecutionProviderAdapter {
  readonly provider = ORACLE_CODEX_EXPERIMENTAL_PROVIDER;
  private readonly completed = new Map<string, CompletedExecution>();

  constructor(
    private readonly bridge: OracleBridgeClient,
    private readonly enabled = false,
  ) {}

  private key(missionId: string, runId: string): string {
    return JSON.stringify([missionId, runId]);
  }

  private assertedHandle(handle: AgentExecutionHandle): void {
    if (handle.providerId !== this.provider.providerId) {
      throw new Error('Oracle adapter received a handle for a different provider');
    }
  }

  async start(request: AgentExecutionRequest): Promise<AgentExecutionHandle> {
    if (!this.enabled) {
      throw new Error('Oracle execution provider is disabled pending constitutional approval');
    }
    if (request.agent.agentId !== 'Oraculo') {
      throw new Error('Oracle provider requires a matching future agent identity');
    }
    if (request.provider.providerId !== this.provider.providerId) {
      throw new Error('Oracle provider mismatch');
    }
    if (request.requestedAction !== 'oracle.strategy.consult') {
      throw new Error('Oracle provider does not execute arbitrary tool actions');
    }
    if (!request.prompt.trim()) throw new Error('Oracle prompt is required');

    const key = this.key(request.missionId, request.runId);
    const previous = this.completed.get(key);
    if (previous) return previous.handle;

    // Start() does NOT retry on ambiguous failure. Reconciliation must happen
    // in the canonical mission runtime using the bridge's durable state.
    const output = await this.bridge.consult({
      missionId: request.missionId,
      requestId: request.runId,
      sessionEpoch: 1,
      prompt: request.prompt,
    });
    if (
      output.status !== 'COMPLETED' ||
      output.mission_id !== request.missionId ||
      output.session_epoch !== 1 ||
      !output.decision ||
      output.decision.schema_version !== '1.0.0' ||
      output.decision.mission_id !== request.missionId ||
      output.decision.request_id !== request.runId ||
      typeof output.decision.decision_id !== 'string' ||
      !output.decision.decision_id ||
      !['PROPOSED', 'BLOCKED', 'REPLAN', 'REVIEW'].includes(output.decision.status) ||
      typeof output.decision.needs_human_approval !== 'boolean'
    ) {
      throw new Error('Oracle response failed mission-bound contract validation');
    }

    const handle: AgentExecutionHandle = {
      missionId: request.missionId,
      runId: request.runId,
      providerId: this.provider.providerId,
      providerExecutionId: output.decision.decision_id,
    };
    const decisionDigest = createHash('sha256')
      .update(JSON.stringify(output.decision))
      .digest('hex');
    const evidence: AgentExecutionEvidence = {
      evidenceId: decisionDigest.slice(0, 24),
      providerId: this.provider.providerId,
      providerExecutionId: handle.providerExecutionId,
      kind: 'TRACE',
      sourceRef:
        'local-oracle-bridge://decision/' +
        encodeURIComponent(request.missionId) +
        '/' +
        encodeURIComponent(request.runId),
      observedAt: new Date().toISOString(),
      digest: decisionDigest,
      metadata: {
        missionId: request.missionId,
        runId: request.runId,
        decisionId: output.decision.decision_id,
        modelRequested: 'gpt-6-astra',
        chatgptAuthRemainsLocal: true,
        allowsExternalEffect: false,
        humanGateCannotBeOverridden: true,
      },
    };
    this.completed.set(key, {
      handle,
      evidence,
      decisionId: output.decision.decision_id,
    });
    return handle;
  }

  async status(handle: AgentExecutionHandle): Promise<AgentExecutionStatus> {
    this.assertedHandle(handle);
    const completed = this.completed.get(this.key(handle.missionId, handle.runId));
    const known =
      !!completed && completed.handle.providerExecutionId === handle.providerExecutionId;
    return {
      handle,
      lifecycle: known ? 'COMPLETED' : 'EFFECT_UNKNOWN',
      observedAt: new Date().toISOString(),
      providerState: known ? 'decision-received-local' : 'requires-durable-reconciliation',
      effectState: known ? 'NONE_OBSERVED' : 'EFFECT_UNKNOWN',
    };
  }

  async resume(handle: AgentExecutionHandle): Promise<AgentExecutionStatus> {
    // Resuming the actual Codex thread is performed by the bridge, not a
    // second MissionRuntime. A missing local receipt must remain UNKNOWN.
    return this.status(handle);
  }

  async interrupt(handle: AgentExecutionHandle): Promise<AgentExecutionStatus> {
    return this.status(handle);
  }

  async cancel(handle: AgentExecutionHandle): Promise<AgentExecutionStatus> {
    return this.status(handle);
  }

  async collectEvidence(handle: AgentExecutionHandle): Promise<readonly AgentExecutionEvidence[]> {
    this.assertedHandle(handle);
    const completed = this.completed.get(this.key(handle.missionId, handle.runId));
    return completed?.handle.providerExecutionId === handle.providerExecutionId
      ? [completed.evidence]
      : [];
  }
}
