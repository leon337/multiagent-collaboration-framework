import { describe, expect, it } from 'vitest';

process.env.DATABASE_URL ??= 'postgresql://mcf-test:mcf-test@127.0.0.1:5432/mcf_test';

import type { McfSkillDefinition } from '@rsa/contracts';

import { EvidenceValidator } from './evidence-validator.js';
import {
  LocalAgentTeamAdapter,
  NodeLocalAgentTeamHost,
  type LocalAgentTeamHost,
} from './local-agent-team.adapter.js';
import { verifyLocalAgentTeamEvidence } from './local-agent-team.evidence.js';

process.env.DATABASE_URL ??= 'postgresql://mcf:test@127.0.0.1:5432/mcf_test';
import {
  LOCAL_AGENT_TEAM_OPERATION,
  LOCAL_AGENT_TEAM_PROVIDER,
  LOCAL_AGENT_TEAM_RESOURCE,
  LOCAL_AGENT_TEAM_AGENTS,
  localAgentProfile,
} from './local-agent-team.router.js';

const skill: McfSkillDefinition = {
  skillId: 'MCF-EXECUTE-LOCAL-TEAM',
  name: 'Executar time local multiagente governado',
  version: '0.1.0',
  purpose: 'test',
  ownerAgents: ['Mestre'],
  requiredInputs: ['objective', 'mission_selected_agents'],
  allowedTools: [LOCAL_AGENT_TEAM_PROVIDER],
  forbiddenTools: [],
  permissionProfile: 'READ_AND_PROPOSE',
  executionSteps: ['route', 'execute', 'receipt'],
  requiredEvidence: ['selected_agents', 'process_ids', 'worker_receipts', 'consolidated_digest'],
  acceptanceCriteria: ['canonical_agents_only'],
  failureModes: ['timeout'],
  fallback: 'fail closed',
  handoffTo: 'Mestre',
};

class FakeHost implements LocalAgentTeamHost {
  private nextPid = 9000;

  async runWorker(input: Parameters<LocalAgentTeamHost['runWorker']>[0]) {
    this.nextPid += 1;
    return {
      agentId: input.agentId,
      pid: this.nextPid,
      role: input.role,
      focus: [...input.focus],
      findings: ['qualified deterministic result'],
      cognitiveIndependenceProven: false as const,
    };
  }
}
function request(objective: string) {
  return {
    skill,
    agentId: 'Mestre',
    inputs: {
      objective,
      mission_selected_agents: ['Mestre', ...LOCAL_AGENT_TEAM_AGENTS],
    },
    tool: {
      provider: LOCAL_AGENT_TEAM_PROVIDER,
      operation: LOCAL_AGENT_TEAM_OPERATION,
      resource: LOCAL_AGENT_TEAM_RESOURCE,
    },
    context: {
      missionId: 'mission-local-team-test',
      phaseId: 'phase-local-team-test',
      expectedMissionVersion: 1,
    },
  };
}

describe('LocalAgentTeamAdapter', () => {
  it('creates signed child receipts and a verifiable consolidated receipt', async () => {
    const evidence = new EvidenceValidator();
    const adapter = new LocalAgentTeamAdapter(
      evidence,
      { enabled: true, timeoutMs: 3000, maxParallelism: 4 },
      new FakeHost(),
    );
    const input = request('capacidade total com oito agentes');
    const receipt = await adapter.execute(input);

    evidence.verify(receipt, input.tool);
    const children = verifyLocalAgentTeamEvidence(receipt, input.tool, skill, input.inputs);

    expect(children).toHaveLength(8);
    expect(receipt.metadata.processIsolationObserved).toBe(true);
    expect(receipt.metadata.cognitiveIndependenceProven).toBe(false);

    for (const child of children) {
      evidence.verify(child, {
        provider: LOCAL_AGENT_TEAM_PROVIDER,
        operation: 'worker-result',
        resource: LOCAL_AGENT_TEAM_RESOURCE,
      });
    }
  });

  it('fails closed when the executor is disabled', async () => {
    const adapter = new LocalAgentTeamAdapter(
      new EvidenceValidator(),
      { enabled: false, timeoutMs: 3000, maxParallelism: 4 },
      new FakeHost(),
    );
    await expect(adapter.execute(request('github testes'))).rejects.toMatchObject({
      code: 'UNSUPPORTED_TARGET',
    });
  });
});

describe('NodeLocalAgentTeamHost', () => {
  it('runs workers in distinct operating-system processes without a shell', async () => {
    const host = new NodeLocalAgentTeamHost();
    const sofia = localAgentProfile('Sofia');
    const beatriz = localAgentProfile('Beatriz');
    const [left, right] = await Promise.all([
      host.runWorker({
        agentId: sofia.agentId,
        role: sofia.role,
        focus: sofia.focus,
        objective: 'arquitetura',
        timeoutMs: 4000,
      }),
      host.runWorker({
        agentId: beatriz.agentId,
        role: beatriz.role,
        focus: beatriz.focus,
        objective: 'evidencia',
        timeoutMs: 4000,
      }),
    ]);

    expect(left.pid).toBeGreaterThan(0);
    expect(right.pid).toBeGreaterThan(0);
    expect(left.pid).not.toBe(right.pid);
    expect(left.cognitiveIndependenceProven).toBe(false);
    expect(right.cognitiveIndependenceProven).toBe(false);
  });

  it('terminates a worker when the bounded timeout is exceeded', async () => {
    const host = new NodeLocalAgentTeamHost();
    const sofia = localAgentProfile('Sofia');

    await expect(
      host.runWorker({
        agentId: sofia.agentId,
        role: sofia.role,
        focus: sofia.focus,
        objective: 'timeout qualification',
        timeoutMs: 1,
      }),
    ).rejects.toMatchObject({ code: 'ADAPTER_TIMEOUT', retryable: true });
  });
});
