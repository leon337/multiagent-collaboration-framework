import { createHash } from 'node:crypto';
import type { McfMissionContract, McfRequiredAgentExecution } from '@rsa/contracts';
import type { AgentExecutionService } from './agent-execution.service.js';
import type { AgentExecutionEvidence, AgentExecutionHandle } from './agent-execution.contracts.js';
import { McfPermissionDeniedError } from './mcf-runtime.errors.js';

export type CollectiveCloseoutReader = Pick<AgentExecutionService, 'status' | 'collectEvidence'>;
const TIMEOUT_MS = 2500;
const MAX_OBSERVATION_AGE_MS = 60_000;

/** A single-agent legacy contract is the only inferable non-delegated route. */
export function isProvenNonDelegated(contract: McfMissionContract): boolean {
  if (
    contract.collectiveCloseoutRequired === true ||
    contract.requiredAgentExecutions?.length ||
    contract.parentMissionId ||
    contract.rosterRevision !== undefined
  )
    return false;
  // Only internal skills with no provider dispatch can inherit legacy single-agent behavior.
  const allowed = new Set([
    'MCF-START-MISSION',
    'MCF-TRACE-MISSION',
    'MCF-CLOSE-PHASE',
    'MCF-RECOVER-CONTEXT',
    'MCF-DEFINE-PRODUCT',
    'MCF-DESIGN-EXPERIENCE',
    'MCF-DESIGN-ARCHITECTURE',
  ]);
  if (!contract.selectedSkills.every((skill) => allowed.has(skill))) return false;
  if (contract.selectedAgents.length === 1) return true;
  // Existing internal-only Carmem→Mestre close-phase is not an external session dispatch.
  return (
    contract.selectedAgents.length === 2 &&
    contract.selectedAgents.includes('Carmem') &&
    contract.selectedAgents.includes('Mestre') &&
    contract.selectedSkills.length === 1 &&
    contract.selectedSkills[0] === 'MCF-CLOSE-PHASE'
  );
}
export function rosterFingerprint(contract: McfMissionContract): string {
  const entries = [...(contract.requiredAgentExecutions ?? [])].sort((a, b) =>
    [a.agentId, a.providerId, a.providerExecutionId, a.runId]
      .join(':')
      .localeCompare([b.agentId, b.providerId, b.providerExecutionId, b.runId].join(':')),
  );
  return createHash('sha256')
    .update(
      JSON.stringify({
        selectedAgents: [...contract.selectedAgents].sort(),
        rosterRevision: contract.rosterRevision,
        participants: entries,
        parentMissionId: contract.parentMissionId ?? null,
      }),
    )
    .digest('hex');
}

/** Fail closed on an omitted, narrowed or rewritten roster, including opt-out=false. */
export function assertCompleteRoster(contract: McfMissionContract): void {
  if (isProvenNonDelegated(contract)) return;
  const entries = contract.requiredAgentExecutions ?? [];
  if (
    contract.collectiveCloseoutRequired !== true ||
    contract.rosterRevision !== 1 ||
    entries.length === 0
  ) {
    throw new McfPermissionDeniedError(
      'AGUARDANDO_AGENTE: delegated mission requires frozen version-1 roster',
    );
  }
  const selected = contract.selectedAgents.filter((agent) => agent.toLowerCase() !== 'mestre');
  const counts = new Map<string, number>();
  const ids = new Set<string>();
  for (const entry of entries) {
    if (
      !entry ||
      !['NATIVE_SUBAGENT', 'COCKPIT_SESSION', 'EXTERNAL_EXECUTOR'].includes(entry.surface) ||
      ![
        entry.agentId,
        entry.runId,
        entry.providerId,
        entry.providerExecutionId,
        entry.contractRef,
      ].every((field) => typeof field === 'string' && field.trim().length > 0)
    ) {
      throw new McfPermissionDeniedError('AGUARDANDO_AGENTE: invalid participant binding');
    }
    counts.set(entry.agentId, (counts.get(entry.agentId) ?? 0) + 1);
    const key = entry.providerId + ':' + entry.providerExecutionId;
    if (ids.has(key))
      throw new McfPermissionDeniedError('AGUARDANDO_AGENTE: duplicate provider execution');
    ids.add(key);
  }
  const missing = selected.filter((name) => (counts.get(name) ?? 0) === 0);
  if (missing.length > 0 || entries.some((e) => !selected.includes(e.agentId))) {
    throw new McfPermissionDeniedError(
      'AGUARDANDO_AGENTE: incomplete/unbound roster: ' + missing.join(', '),
    );
  }
}

function recentObservation(observedAt: string): boolean {
  const t = Date.parse(observedAt);
  const age = Date.now() - t;
  return Number.isFinite(t) && age >= -5_000 && age <= MAX_OBSERVATION_AGE_MS;
}

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
  // A sender's self-reported boolean cannot establish an independent received handoff.
  const delivery = evidence.find(
    (e) =>
      same(e) &&
      e.kind === 'RECEIPT' &&
      e.metadata.missionId === missionId &&
      e.metadata.runId === p.runId &&
      e.metadata.agentId === p.agentId &&
      e.metadata.surface === p.surface &&
      e.metadata.contractRef === p.contractRef &&
      e.metadata.handoffReceived === true &&
      e.metadata.handoffVerified === true &&
      typeof e.metadata.handoffId === 'string' &&
      e.metadata.handoffId.length > 0 &&
      typeof e.metadata.handoffToAgentId === 'string' &&
      e.metadata.handoffToAgentId.length > 0,
  );
  const receiverAck =
    delivery &&
    evidence.find(
      (e) =>
        e.kind === 'RECEIPT' &&
        e.evidenceId !== delivery.evidenceId &&
        typeof e.sourceRef === 'string' &&
        e.sourceRef.trim().length > 0 &&
        typeof e.digest === 'string' &&
        e.digest.trim().length > 0 &&
        e.metadata.receiptType === 'HANDOFF_ACK' &&
        e.metadata.missionId === missionId &&
        e.metadata.handoffId === delivery.metadata.handoffId &&
        e.metadata.handoffReceiptId === delivery.evidenceId &&
        e.metadata.ackForRunId === p.runId &&
        e.metadata.ackByAgentId === delivery.metadata.handoffToAgentId &&
        typeof e.metadata.ackSessionId === 'string' &&
        e.metadata.ackSessionId.length > 0,
    );
  return evidence.some((e) => same(e) && e.kind === 'ARTIFACT') && !!delivery && !!receiverAck;
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
  assertCompleteRoster(contract);
  const required = contract.requiredAgentExecutions ?? [];
  if (isProvenNonDelegated(contract)) return;
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
      if (
        first.lifecycle !== 'COMPLETED' ||
        !sameHandle(first.handle, handle) ||
        !recentObservation(first.observedAt)
      ) {
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
      if (
        latest.lifecycle !== 'COMPLETED' ||
        !sameHandle(latest.handle, handle) ||
        !recentObservation(latest.observedAt)
      )
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
