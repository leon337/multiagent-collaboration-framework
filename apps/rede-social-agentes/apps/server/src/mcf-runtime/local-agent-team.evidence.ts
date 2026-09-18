import { createHash } from 'node:crypto';

import type { McfSkillDefinition, McfToolReceipt } from '@rsa/contracts';

import { McfEvidenceRejectedError } from './mcf-runtime.errors.js';
import {
  canonicalizeProvider,
  canonicalizeToolValue,
  type McfToolRequest,
} from './permission-engine.js';
import {
  LOCAL_AGENT_TEAM_OPERATION,
  LOCAL_AGENT_TEAM_PROVIDER,
  LOCAL_AGENT_TEAM_RESOURCE,
  isLocalAgentTeamAgent,
  selectLocalAgentTeam,
} from './local-agent-team.router.js';

function reject(message: string): never {
  throw new McfEvidenceRejectedError(message);
}

function digest(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function asStringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    return reject(`${label} must be a string array`);
  }
  return value as string[];
}
function asPositiveIntegerArray(value: unknown, label: string): number[] {
  if (!Array.isArray(value) || value.some((item) => !Number.isInteger(item) || Number(item) <= 0)) {
    return reject(`${label} must contain positive integer process ids`);
  }
  return value as number[];
}

function asWorkerReceipts(value: unknown): McfToolReceipt[] {
  if (!Array.isArray(value) || value.length === 0) {
    return reject('local agent team requires worker receipts');
  }
  for (const candidate of value) {
    if (
      typeof candidate !== 'object' ||
      candidate === null ||
      Array.isArray(candidate) ||
      typeof (candidate as McfToolReceipt).receiptId !== 'string'
    ) {
      reject('local agent team worker receipt is malformed');
    }
  }
  return value as McfToolReceipt[];
}
export function verifyLocalAgentTeamEvidence(
  receipt: McfToolReceipt,
  expected: McfToolRequest,
  skill: McfSkillDefinition,
  inputs: Readonly<Record<string, unknown>>,
): McfToolReceipt[] {
  if (
    skill.skillId !== 'MCF-EXECUTE-LOCAL-TEAM' ||
    canonicalizeProvider(expected.provider) !== LOCAL_AGENT_TEAM_PROVIDER ||
    canonicalizeToolValue(expected.operation) !== LOCAL_AGENT_TEAM_OPERATION ||
    canonicalizeToolValue(expected.resource) !== LOCAL_AGENT_TEAM_RESOURCE
  ) {
    return reject('local agent team evidence was evaluated outside its canonical boundary');
  }

  const objective = inputs.objective;
  if (typeof objective !== 'string' || !objective.trim()) {
    return reject('local agent team evidence requires objective');
  }

  const selectedAgents = asStringArray(receipt.metadata.selectedAgents, 'selectedAgents');
  if (
    new Set(selectedAgents).size !== selectedAgents.length ||
    selectedAgents.some((agentId) => !isLocalAgentTeamAgent(agentId))
  ) {
    return reject('local agent team selectedAgents are not unique canonical identities');
  }
  const expectedAgents = selectLocalAgentTeam(objective);
  if (JSON.stringify(selectedAgents) !== JSON.stringify(expectedAgents)) {
    return reject('local agent team receipt does not match deterministic routing');
  }

  if (receipt.metadata.executionMode !== 'DETERMINISTIC_LOCAL_PROCESS') {
    return reject('local agent team executionMode is not the qualified deterministic process mode');
  }
  if (receipt.metadata.cognitiveIndependenceProven !== false) {
    return reject('local agent team must preserve the independent-LLM non-claim');
  }
  if (receipt.metadata.processIsolationObserved !== true) {
    return reject('local agent team did not prove process isolation');
  }

  const processIds = asPositiveIntegerArray(receipt.metadata.processIds, 'processIds');
  if (
    processIds.length !== selectedAgents.length ||
    new Set(processIds).size !== selectedAgents.length
  ) {
    return reject('local agent team requires one unique worker process per selected agent');
  }
  const workerReceipts = asWorkerReceipts(receipt.metadata.workerReceipts);
  if (workerReceipts.length !== selectedAgents.length) {
    return reject('local agent team worker receipt count does not match selected agents');
  }

  workerReceipts.forEach((workerReceipt, index) => {
    if (
      workerReceipt.provider !== LOCAL_AGENT_TEAM_PROVIDER ||
      workerReceipt.operation !== 'worker-result' ||
      workerReceipt.resource !== LOCAL_AGENT_TEAM_RESOURCE ||
      workerReceipt.status !== 'SUCCEEDED' ||
      workerReceipt.metadata.agentId !== selectedAgents[index] ||
      workerReceipt.metadata.workerPid !== processIds[index] ||
      workerReceipt.metadata.cognitiveIndependenceProven !== false
    ) {
      reject('local agent team worker receipt provenance is inconsistent');
    }
  });
  const expectedDigest = digest({
    selectedAgents,
    processIds,
    workerReceiptIds: workerReceipts.map((worker) => worker.receiptId),
  });
  if (receipt.metadata.consolidatedDigest !== expectedDigest) {
    return reject('local agent team consolidated digest is invalid');
  }

  return workerReceipts;
}
