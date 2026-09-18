import { randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

process.env.DATABASE_URL ??= 'postgresql://mcf-test:mcf-test@127.0.0.1:5432/mcf_test';
process.env.MCF_RECEIPT_SECRET ??= 'test-only-local-agent-team-e2e-receipt-secret-0001';

import type { McfToolReceipt } from '@rsa/contracts';

import { AdapterRegistry } from './adapter-registry.js';
import { EvidenceValidator } from './evidence-validator.js';
import { ExternalActionDispatcher } from './external-action-dispatcher.js';
import type { ExternalActionLedger } from './external-action-ledger.js';
import { LocalAgentTeamAdapter } from './local-agent-team.adapter.js';
import {
  LOCAL_AGENT_TEAM_AGENTS,
  LOCAL_AGENT_TEAM_OPERATION,
  LOCAL_AGENT_TEAM_PROVIDER,
  LOCAL_AGENT_TEAM_RESOURCE,
} from './local-agent-team.router.js';
import type {
  McfEventRecord,
  McfMissionRecord,
  McfPhaseRecord,
  McfRuntimeRepository,
  PersistMcfExecutionInput,
} from './mcf-runtime.repository.js';
import { MissionRuntimeService } from './mission-runtime.service.js';
import { PermissionEngine } from './permission-engine.js';
import { SkillExecutor } from './skill-executor.js';
import { SkillRegistryLoader } from './skill-registry.loader.js';
class InMemoryRuntimeRepository implements McfRuntimeRepository {
  private mission: McfMissionRecord | null = null;
  private phase: McfPhaseRecord | null = null;
  private events: McfEventRecord[] = [];
  persisted: PersistMcfExecutionInput | null = null;

  async createMission(input: Parameters<McfRuntimeRepository['createMission']>[0]) {
    this.mission = input.mission;
    this.events.push({ ...input.event });
    return input.mission;
  }

  async findMission(missionId: string) {
    return this.mission?.id === missionId ? this.mission : null;
  }

  async findPhase(missionId: string, phaseId: string) {
    return this.phase?.missionId === missionId && this.phase.id === phaseId ? this.phase : null;
  }

  async persistExecution(input: PersistMcfExecutionInput) {
    if (!this.mission || this.mission.id !== input.missionId) {
      throw new Error('mission missing');
    }
    this.persisted = input;
    this.phase = input.phase;
    this.events.push(...input.events.map((event) => ({ ...event })));
    this.mission = {
      ...this.mission,
      state: input.missionState,
      currentPhaseId: input.phase.id,
      currentAgentId: input.nextAgentId,
      version: this.mission.version + 1,
      updatedAt: input.phase.updatedAt,
    };
    return { mission: this.mission, phase: input.phase };
  }
  async completePendingPhase(): Promise<never> {
    throw new Error('not used by local-agent-team e2e');
  }

  async listEvents(missionId: string) {
    return this.events.filter((event) => event.missionId === missionId);
  }
}

class InMemoryExternalLedger {
  receipt: McfToolReceipt | null = null;
  validatedReceiptId: string | null = null;
  failures: string[] = [];

  async reserve() {
    return 'attempt-local-agent-team-e2e-0001';
  }

  async recordExecuted(_attemptId: string, receipt: McfToolReceipt) {
    this.receipt = receipt;
  }

  async recordEvidenceValidated(_attemptId: string, receiptId: string) {
    this.validatedReceiptId = receiptId;
  }

  async recordEvidenceRejected(_attemptId: string, _receiptId: string | null, reason: string) {
    this.failures.push(reason);
  }

  async recordFailed(_attemptId: string, failure: { message: string }) {
    this.failures.push(failure.message);
  }

  async recordUnknown() {
    throw new Error('unexpected UNKNOWN state');
  }

  async recordExecuting() {}
  async recordReconciliationPrepared() {}
}
function runtime(enabled: boolean) {
  const evidence = new EvidenceValidator();
  const adapter = new LocalAgentTeamAdapter(evidence, {
    enabled,
    timeoutMs: 5000,
    maxParallelism: 8,
  });
  const adapters = new AdapterRegistry([adapter]);
  const ledger = new InMemoryExternalLedger();
  const dispatcher = new ExternalActionDispatcher(
    adapters,
    ledger as unknown as ExternalActionLedger,
  );
  const registry = new SkillRegistryLoader();
  const executor = new SkillExecutor(registry, new PermissionEngine(), evidence, dispatcher);
  const repository = new InMemoryRuntimeRepository();
  const service = new MissionRuntimeService(repository, executor, registry, evidence);
  return { service, repository, ledger };
}

async function createLocalTeamMission(service: MissionRuntimeService) {
  return service.createMission({
    contract: {
      title: 'MCF local agent team E2E qualification',
      objective: 'Executar capacidade total com oito agentes em paralelo.',
      expectedOutcome: 'Runtime canônico valida processos e receipts governados.',
      scope: ['MCF-EXECUTE-LOCAL-TEAM'],
      outOfScope: ['production', 'release', 'LLM cognition'],
      acceptanceCriteria: [
        'unique processes',
        'valid child receipts',
        'valid consolidated receipt',
      ],
      riskClass: 'B',
      selectedAgents: ['Mestre', ...LOCAL_AGENT_TEAM_AGENTS],
      selectedSkills: ['MCF-EXECUTE-LOCAL-TEAM'],
      sourceOfTruth: ['skills/registry.yaml', 'docs/MCF-CURRENT-STATE.md'],
    },
  });
}
describe('MCF local agent team canonical runtime E2E', () => {
  it('executes through MissionRuntimeService and persists governed process/receipt evidence', async () => {
    const { service, repository, ledger } = runtime(true);
    const mission = await createLocalTeamMission(service);
    const phaseId = randomUUID();

    const result = await service.executePhase(mission.id, {
      phaseId,
      skillId: 'MCF-EXECUTE-LOCAL-TEAM',
      agentId: 'Mestre',
      expectedMissionVersion: 1,
      inputs: {
        objective: 'Executar capacidade total com oito agentes em paralelo.',
        mission_selected_agents: ['SPOOFED-CALLER-VALUE'],
      },
      tool: {
        provider: LOCAL_AGENT_TEAM_PROVIDER,
        operation: LOCAL_AGENT_TEAM_OPERATION,
        resource: LOCAL_AGENT_TEAM_RESOURCE,
      },
    });

    expect(result).toMatchObject({
      phaseState: 'COMPLETED',
      evidenceStatus: 'VALID',
      handoffTo: null,
    });
    const receipt = result.receipt;
    expect(receipt).not.toBeNull();
    expect(receipt?.metadata.selectedAgents).toEqual([...LOCAL_AGENT_TEAM_AGENTS]);
    expect(receipt?.metadata.processIsolationObserved).toBe(true);
    expect(receipt?.metadata.cognitiveIndependenceProven).toBe(false);

    const pids = receipt?.metadata.processIds as number[];
    expect(pids).toHaveLength(8);
    expect(new Set(pids).size).toBe(8);

    const workerReceipts = receipt?.metadata.workerReceipts as McfToolReceipt[];
    expect(workerReceipts).toHaveLength(8);
    expect(workerReceipts.map((worker) => worker.metadata.agentId)).toEqual([
      ...LOCAL_AGENT_TEAM_AGENTS,
    ]);

    expect(ledger.receipt?.receiptId).toBe(receipt?.receiptId);
    expect(ledger.validatedReceiptId).toBe(receipt?.receiptId);
    expect(ledger.failures).toEqual([]);

    expect(repository.persisted?.receipt?.receiptId).toBe(receipt?.receiptId);
    expect(repository.persisted?.externalAttemptId).toBe('attempt-local-agent-team-e2e-0001');

    const timeline = await service.timeline(mission.id);
    const eventTypes = timeline.events.map((event) => event.eventType);
    expect(eventTypes).toContain('TOOL_RECEIPT_RECORDED');
    expect(eventTypes).toContain('EVIDENCE_VALIDATED');
    expect(eventTypes).toContain('PHASE_COMPLETED');
  });
  it('fails closed through the same runtime path when the executor is disabled', async () => {
    const { service, repository, ledger } = runtime(false);
    const mission = await createLocalTeamMission(service);

    const result = await service.executePhase(mission.id, {
      phaseId: randomUUID(),
      skillId: 'MCF-EXECUTE-LOCAL-TEAM',
      agentId: 'Mestre',
      expectedMissionVersion: 1,
      inputs: {
        objective: 'Executar capacidade total com oito agentes em paralelo.',
      },
      tool: {
        provider: LOCAL_AGENT_TEAM_PROVIDER,
        operation: LOCAL_AGENT_TEAM_OPERATION,
        resource: LOCAL_AGENT_TEAM_RESOURCE,
      },
    });

    expect(result).toMatchObject({
      phaseState: 'RECOVERING',
      evidenceStatus: 'INVALID',
      handoffTo: null,
    });
    expect(result.receipt).toBeNull();
    expect(ledger.receipt).toBeNull();
    expect(ledger.validatedReceiptId).toBeNull();
    expect(repository.persisted?.evidenceStatus).toBe('INVALID');
    expect(repository.persisted?.externalAttemptId).toBe('attempt-local-agent-team-e2e-0001');
    const rejected = repository.persisted?.events.find(
      (event) => event.eventType === 'EVIDENCE_REJECTED',
    );
    expect(rejected?.payload.reason).toMatch(/UNSUPPORTED_TARGET.*disabled/i);
  });
});
