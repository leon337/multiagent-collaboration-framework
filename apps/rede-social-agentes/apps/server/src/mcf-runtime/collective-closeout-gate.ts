import type { McfMissionContract, McfRequiredAgentExecution } from '@rsa/contracts';
import type { AgentExecutionService } from './agent-execution.service.js';
import type { AgentExecutionEvidence, AgentExecutionHandle } from './agent-execution.contracts.js';
import { McfPermissionDeniedError } from './mcf-runtime.errors.js';

export type CollectiveCloseoutReader = Pick<AgentExecutionService, 'status' | 'collectEvidence'>;
const TIMEOUT_MS = 2500;

// Bounded read-only provider observation. Unknown/timeout never means completed.
async function bounded<T>(promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error('observation timeout')), TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function boundEvidence(
  evidence: readonly AgentExecutionEvidence[],
  missionId: string,
  p: McfRequiredAgentExecution,
): boolean {
  const same = (e: AgentExecutionEvidence) =>
    e.providerId === p.providerId &&
    e.providerExecutionId === p.providerExecutionId &&
    typeof e.sourceRef === 'string' &&
    e.sourceRef.trim().length > 0 &&
    typeof e.digest === 'string' &&
    e.digest.trim().length > 0;
  return (
    evidence.some((e) => same(e) && e.kind === 'ARTIFACT') &&
    evidence.some(
      (e) =>
        same(e) &&
        e.kind === 'RECEIPT' &&
        e.metadata.missionId === missionId &&
        e.metadata.runId === p.runId &&
        e.metadata.agentId === p.agentId &&
        e.metadata.surface === p.surface &&
        e.metadata.contractRef === p.contractRef &&
        e.metadata.handoffReceived === true &&
        e.metadata.handoffVerified === true,
    )
  );
}

function sameHandle(a: AgentExecutionHandle, b: AgentExecutionHandle): boolean {
  return (
    a.missionId === b.missionId &&
    a.runId === b.runId &&
    a.providerId === b.providerId &&
    a.providerExecutionId === b.providerExecutionId
  );
}

export async function assertCollectiveCloseoutReady(
  missionId: string,
  contract: McfMissionContract,
  reader?: CollectiveCloseoutReader,
): Promise<void> {
  const required = contract.requiredAgentExecutions ?? [];
  // Backward-compatible with contracts which do not request delegated closeout.
  if (!contract.collectiveCloseoutRequired && required.length === 0) return;
  if (required.length === 0)
    throw new McfPermissionDeniedError(
      'AGUARDANDO_AGENTE: required execution roster missing; retain checkpoint',
    );
  if (!reader)
    throw new McfPermissionDeniedError(
      'AGUARDANDO_AGENTE: agent provider unavailable; retain checkpoint',
    );

  const pending: string[] = [];
  const seen = new Set<string>();
  for (const p of required) {
    if (
      !p ||
      !['NATIVE_SUBAGENT', 'COCKPIT_SESSION', 'EXTERNAL_EXECUTOR'].includes(p.surface) ||
      ![p.agentId, p.runId, p.providerId, p.providerExecutionId, p.contractRef].every(
        (s) => typeof s === 'string' && s.trim().length > 0,
      ) ||
      !contract.selectedAgents.includes(p.agentId)
    ) {
      pending.push('INVALID_REQUIRED_EXECUTION');
      continue;
    }
    const key = p.providerId + ':' + p.providerExecutionId;
    if (seen.has(key)) {
      pending.push(p.agentId + ': duplicate execution');
      continue;
    }
    seen.add(key);
    const handle: AgentExecutionHandle = {
      missionId,
      runId: p.runId,
      providerId: p.providerId,
      providerExecutionId: p.providerExecutionId,
    };
    try {
      const first = await bounded(reader.status(handle));
      if (first.lifecycle !== 'COMPLETED' || !sameHandle(first.handle, handle)) {
        pending.push(p.agentId + ' [' + p.surface + '] status=' + first.lifecycle);
        continue;
      }
      const evidence = await bounded(reader.collectEvidence(handle));
      if (!Array.isArray(evidence) || !boundEvidence(evidence, missionId, p)) {
        pending.push(p.agentId + ' [' + p.surface + '] missing verified artifact/handoff');
        continue;
      }
      // Revalidate after awaits; a stale observation or different session cannot pass.
      const latest = await bounded(reader.status(handle));
      if (latest.lifecycle !== 'COMPLETED' || !sameHandle(latest.handle, handle))
        pending.push(p.agentId + ' [' + p.surface + '] changed/unknown');
    } catch {
      pending.push(p.agentId + ' [' + p.surface + '] provider unavailable/timeout');
    }
  }
  if (pending.length > 0)
    throw new McfPermissionDeniedError(
      'AGUARDANDO_AGENTE: ' + pending.join('; ') + '; retain checkpoint',
    );
}
