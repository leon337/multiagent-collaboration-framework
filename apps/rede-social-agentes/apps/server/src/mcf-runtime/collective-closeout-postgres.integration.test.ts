import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { McfMissionContract } from '@rsa/contracts';
import type { AgentExecutionHandle } from './agent-execution.contracts.js';

import { DatabaseService } from '../database.service.js';
import { MissionRuntimeService } from './mission-runtime.service.js';
import { rosterFingerprint } from './collective-closeout-gate.js';
import { OrderedMcfRuntimeRepository } from './ordered-mcf-runtime.repository.js';
import { PostgresMcfRuntimeRepository } from './postgres-mcf-runtime.repository.js';

const suite = process.env.DATABASE_URL ? describe : describe.skip;
suite('Issue #483 — canonical Postgres checkpoint and contract CAS', () => {
  let database: DatabaseService;
  let service: MissionRuntimeService;
  let repo: OrderedMcfRuntimeRepository;
  const createdIds: string[] = [];
  const contract: McfMissionContract = {
    title: 'Collective gate Postgres witness',
    objective: 'Persist a closeout denial, no false finish even on replay',
    expectedOutcome: 'Postgres GATE_REJECTED and stable version',
    scope: ['mission runtime'],
    outOfScope: [],
    acceptanceCriteria: ['no premature mission completion'],
    riskClass: 'C',
    selectedAgents: ['Mestre', 'Sofia', 'Emily'],
    selectedSkills: ['MCF-CLOSE-PHASE'],
    sourceOfTruth: ['Issue #483'],
    collectiveCloseoutRequired: true,
    rosterRevision: 1,
    requiredAgentExecutions: [
      {
        agentId: 'Sofia',
        runId: 'run-sofia',
        providerId: 'native',
        providerExecutionId: 'task-sofia',
        surface: 'NATIVE_SUBAGENT',
        contractRef: 'arch@1',
      },
      {
        agentId: 'Emily',
        runId: 'run-emily',
        providerId: 'cockpit',
        providerExecutionId: 'chat-emily',
        surface: 'COCKPIT_SESSION',
        contractRef: 'audit@1',
      },
    ],
  };
  beforeAll(() => {
    database = new DatabaseService();
    repo = new OrderedMcfRuntimeRepository(database, new PostgresMcfRuntimeRepository(database));
    const reader = {
      status: vi.fn(async (handle: AgentExecutionHandle) => ({
        handle,
        lifecycle: handle.runId === 'run-sofia' ? 'RUNNING' : 'COMPLETED',
        observedAt: new Date().toISOString(),
        providerState: null,
        effectState: 'NONE_OBSERVED',
      })),
      collectEvidence: vi.fn(async () => []),
    };
    service = new MissionRuntimeService(
      repo,
      {
        execute: vi.fn(() => {
          throw Error('EXECUTOR_REACHED');
        }),
      } as never,
      {} as never,
      {} as never,
      undefined,
      undefined,
      reader as never,
    );
  });
  afterAll(async () => {
    if (!database) return;
    for (const id of createdIds) {
      await database.query('delete from "mcf_missions" where "id" = $1', [id]);
    }
    await database.onModuleDestroy();
  });
  it('round-trips JSONB mission+ledger fingerprint without losing agent/run/provider/surface identity', async () => {
    const mission = await service.createMission({ contract });
    createdIds.push(mission.id);
    const reloaded = await repo.findMission(mission.id);
    expect(reloaded).not.toBeNull();
    expect(reloaded!.contract.requiredAgentExecutions).toEqual(contract.requiredAgentExecutions);
    expect(rosterFingerprint(reloaded!.contract)).toBe(rosterFingerprint(contract));

    const events = await repo.listEvents(mission.id);
    const creation = events.find((e) => e.eventType === 'MISSION_CREATED');
    expect(creation?.payload.rosterFingerprint).toBe(rosterFingerprint(contract));
    expect(creation?.payload.rosterFingerprint).toBe(rosterFingerprint(reloaded!.contract));
    expect(creation?.payload.requiredAgentExecutions).toEqual(contract.requiredAgentExecutions);
    expect(creation?.payload.rosterRevision).toBe(1);
    expect(creation?.payload.parentMissionId).toBeNull();
    expect(creation?.payload.collectiveCloseoutRequired).toBe(true);
  });

  it('denied closeout emits one persistent checkpoint, survives replay, no completed phase', async () => {
    const mission = await service.createMission({ contract });
    createdIds.push(mission.id);
    const request = {
      skillId: 'MCF-CLOSE-PHASE',
      agentId: 'Mestre',
      expectedMissionVersion: 1,
      inputs: {},
      tool: { provider: 'internal', operation: 'close-phase', resource: 'mcf-agent-runtime' },
    };
    for (let i = 0; i < 2; i++) {
      await expect(service.executePhase(mission.id, request)).rejects.toThrow('Sofia');
    }
    const reloaded = new OrderedMcfRuntimeRepository(
      database,
      new PostgresMcfRuntimeRepository(database),
    );
    const events = await reloaded.listEvents(mission.id);
    expect(events.filter((e) => e.eventType === 'GATE_REJECTED')).toHaveLength(1);
    expect(events.some((e) => e.eventType === 'PHASE_COMPLETED')).toBe(false);
    expect(events.some((e) => e.eventType === 'MISSION_COMPLETED')).toBe(false);
    expect(events.find((e) => e.eventType === 'GATE_REJECTED')?.payload).toMatchObject({
      rosterRevision: 1,
      state: 'AGUARDANDO_AGENTE',
    });
    expect((await reloaded.findMission(mission.id))?.version).toBe(1);
  });
  it('refuses atomic completion if DB contract changed even when mission version did not', async () => {
    const mission = await service.createMission({ contract });
    createdIds.push(mission.id);
    await database.query(
      `update "mcf_missions" set "contract" = jsonb_set("contract", '{rosterRevision}', '2'::jsonb) where "id" = $1`,
      [mission.id],
    );
    const now = new Date();
    await expect(
      repo.persistExecution({
        missionId: mission.id,
        expectedMissionVersion: mission.version,
        expectedMissionContract: mission.contract,
        phase: {
          id: randomUUID(),
          missionId: mission.id,
          skillId: 'MCF-CLOSE-PHASE',
          agentId: 'Mestre',
          state: 'COMPLETED',
          cycle: 1,
          inputs: {},
          expectedEvidence: [],
          startedAt: now,
          completedAt: now,
          createdAt: now,
          updatedAt: now,
        },
        permissionProfile: 'SCOPED_WRITE',
        missionState: 'COMPLETED',
        nextAgentId: null,
        receipt: null,
        evidenceStatus: 'VALID',
        handoff: null,
        events: [],
      }),
    ).rejects.toThrow();
    const events = await repo.listEvents(mission.id);
    expect(events.some((e) => e.eventType === 'MISSION_COMPLETED')).toBe(false);
    expect((await repo.findMission(mission.id))?.version).toBe(1);
  });
  it('rejects contract CAS after an intervening await and concurrent roster mutation', async () => {
    const mission = await service.createMission({ contract });
    createdIds.push(mission.id);

    let notifyRead!: () => void;
    let releaseMutation!: () => void;
    const observed = new Promise<void>((resolve) => {
      notifyRead = resolve;
    });
    const proceed = new Promise<void>((resolve) => {
      releaseMutation = resolve;
    });

    const now = new Date();
    const attempt = (async () => {
      const stale = await repo.findMission(mission.id);
      expect(stale).not.toBeNull();
      // Simulates the awaited terminal/provider evidence boundary before the DB CAS.
      notifyRead();
      await proceed;
      return repo.persistExecution({
        missionId: mission.id,
        expectedMissionVersion: stale!.version,
        expectedMissionContract: stale!.contract,
        phase: {
          id: randomUUID(),
          missionId: mission.id,
          skillId: 'MCF-CLOSE-PHASE',
          agentId: 'Mestre',
          state: 'COMPLETED',
          cycle: 1,
          inputs: {},
          expectedEvidence: [],
          startedAt: now,
          completedAt: now,
          createdAt: now,
          updatedAt: now,
        },
        permissionProfile: 'SCOPED_WRITE',
        missionState: 'COMPLETED',
        nextAgentId: null,
        receipt: null,
        evidenceStatus: 'VALID',
        handoff: null,
        events: [],
      });
    })();

    await observed;
    await database.query(
      `update "mcf_missions" set "contract" = jsonb_set("contract",
       '{requiredAgentExecutions,0,providerExecutionId}', '"task-rebound"'::jsonb)
       where "id" = $1`,
      [mission.id],
    );
    releaseMutation();
    await expect(attempt).rejects.toThrow();
    const reloaded = await repo.findMission(mission.id);
    expect(reloaded?.version).toBe(1);
    expect(reloaded?.state).not.toBe('COMPLETED');
    const events = await repo.listEvents(mission.id);
    expect(events.some((e) => e.eventType === 'MISSION_COMPLETED')).toBe(false);
    expect(events.some((e) => e.eventType === 'PHASE_COMPLETED')).toBe(false);
  });
});
