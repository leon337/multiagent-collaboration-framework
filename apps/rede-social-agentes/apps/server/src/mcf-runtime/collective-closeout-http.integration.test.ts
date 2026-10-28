import 'reflect-metadata';

import { randomUUID } from 'node:crypto';

import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import type { McfMissionContract, McfRequiredAgentExecution } from '@rsa/contracts';
import type { AgentExecutionHandle } from './agent-execution.contracts.js';
import type {
  CollectiveCloseoutBlockInput,
  CreateMcfMissionInput,
  McfMissionRecord,
  McfEventRecord,
} from './mcf-runtime.repository.js';
import type { FastifyInstance } from 'fastify';
import { describe, expect, it, vi } from 'vitest';

import { IDENTITY_REPOSITORY } from '../identity/identity.repository.js';
import { SessionAuthGuard } from '../identity/session-auth.guard.js';
import { SessionTokenService } from '../identity/session-token.service.js';
import { MissionRuntimeController } from './mission-runtime.controller.js';
import { MissionRuntimeService } from './mission-runtime.service.js';

const token = 'collective-closeout-http-bearer';
const sofia: McfRequiredAgentExecution = {
  agentId: 'Sofia',
  runId: 'run-sofia',
  providerId: 'native',
  providerExecutionId: 'task-sofia',
  surface: 'NATIVE_SUBAGENT',
  contractRef: 'arch@1',
};
const emily: McfRequiredAgentExecution = {
  agentId: 'Emily',
  runId: 'run-emily',
  providerId: 'cockpit',
  providerExecutionId: 'chat-emily',
  surface: 'COCKPIT_SESSION',
  contractRef: 'audit@1',
};
const contract: McfMissionContract = {
  title: 'HTTP collective closeout #483',
  objective: 'Deny collective closeout with a required agent still running',
  expectedOutcome: 'HTTP 403 with persistent checkpoint',
  scope: ['collective closeout'],
  outOfScope: [],
  acceptanceCriteria: ['SOFIA running blocks closure'],
  riskClass: 'C',
  selectedAgents: ['Mestre', 'Sofia', 'Emily'],
  selectedSkills: ['MCF-CLOSE-PHASE'],
  sourceOfTruth: ['Issue #483'],
  collectiveCloseoutRequired: true,
  rosterRevision: 1,
  requiredAgentExecutions: [sofia, emily],
};

async function setup() {
  const store = new Map<string, { mission: McfMissionRecord; events: McfEventRecord[] }>();
  const executor = {
    execute: vi.fn(async () => {
      throw Error('EXECUTOR_REACHED');
    }),
  };
  const persisted = vi.fn(async () => {
    throw Error('PERSISTENCE_REACHED');
  });
  const recordCloseoutBlock = vi.fn(async (input: CollectiveCloseoutBlockInput) => {
    const record = store.get(input.missionId)!;
    const key = [
      input.missionId,
      input.expectedMissionVersion,
      input.phaseSkillId,
      input.rosterFingerprint,
      input.reason,
    ].join(':');
    if (record.events.some((e) => e.idempotencyKey === key)) return;
    record.events.push({
      id: randomUUID(),
      missionId: input.missionId,
      phaseId: null,
      agentId: null,
      eventType: 'GATE_REJECTED',
      payload: {
        reason: input.reason,
        state: 'AGUARDANDO_AGENTE',
        rosterRevision: input.rosterRevision,
        requiredAgentIds: input.requiredAgentIds,
      },
      idempotencyKey: key,
      occurredAt: new Date(),
    });
  });
  const repository = {
    createMission: vi.fn(async (input: CreateMcfMissionInput) => {
      store.set(input.mission.id, { mission: input.mission, events: [input.event] });
      return input.mission;
    }),
    findMission: vi.fn(async (id: string) => store.get(id)?.mission ?? null),
    listEvents: vi.fn(async (id: string) => store.get(id)?.events ?? []),
    recordCloseoutBlock,
    persistExecution: persisted,
  };
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
  const runtime = new MissionRuntimeService(
    repository as never,
    executor as never,
    {} as never,
    {} as never,
    undefined,
    undefined,
    reader as never,
  );
  const tokens = new SessionTokenService();
  const identityRepository = {
    findActiveSessionByTokenHash: vi.fn(async (hash: string) =>
      hash === tokens.hash(token)
        ? {
            accountId: randomUUID(),
            email: 'test@example.test',
            displayName: 'Test human',
            sessionId: randomUUID(),
            sessionExpiresAt: new Date(Date.now() + 60_000),
          }
        : null,
    ),
  };
  class HttpTestModule {}
  Module({
    controllers: [MissionRuntimeController],
    providers: [
      SessionAuthGuard,
      { provide: IDENTITY_REPOSITORY, useValue: identityRepository },
      { provide: SessionTokenService, useValue: tokens },
      { provide: MissionRuntimeService, useValue: runtime },
    ],
  })(HttpTestModule);
  const app = await NestFactory.create<NestFastifyApplication>(
    HttpTestModule,
    new FastifyAdapter({ logger: false }),
    { logger: false },
  );
  await app.init();
  const fastify = app.getHttpAdapter().getInstance() as FastifyInstance;
  await fastify.ready();
  const headers = { authorization: 'Bearer ' + token, 'content-type': 'application/json' };
  const create = async (c: McfMissionContract) =>
    fastify.inject({
      method: 'POST',
      url: '/v1/mcf/missions',
      headers,
      payload: { contract: c },
    });
  const close = async (missionId: string) =>
    fastify.inject({
      method: 'POST',
      url: '/v1/mcf/missions/' + missionId + '/phases/execute',
      headers,
      payload: {
        skillId: 'MCF-CLOSE-PHASE',
        agentId: 'Mestre',
        inputs: {},
        tool: { provider: 'internal', operation: 'close-phase', resource: 'mcf-agent-runtime' },
        expectedMissionVersion: 1,
      },
    });
  const timeline = async (missionId: string) =>
    fastify.inject({
      method: 'GET',
      url: '/v1/mcf/missions/' + missionId + '/timeline',
      headers,
    });
  return { app, store, executor, persisted, recordCloseoutBlock, create, close, timeline };
}

describe('Issue #483 — authenticated REST closure bypass regression', () => {
  it('preserves the whole roster in POST, denies SOFIA running, persists one replayable rejection', async () => {
    const h = await setup();
    try {
      const created = await h.create(contract);
      expect(created.statusCode).toBe(201);
      const mission = created.json();
      expect(mission.contract.requiredAgentExecutions).toEqual([sofia, emily]);
      expect(mission.contract.rosterRevision).toBe(1);
      const createdEvent = h.store.get(mission.id)!.events[0]!;
      expect(createdEvent.payload.rosterFingerprint).toMatch(/^[a-f0-9]{64}$/);
      for (let i = 0; i < 2; i++) {
        const denied = await h.close(mission.id);
        expect(denied.statusCode).toBe(403);
        expect(denied.json().message).toContain('Sofia');
      }
      expect(h.executor.execute).not.toHaveBeenCalled();
      expect(h.persisted).not.toHaveBeenCalled();
      expect(h.recordCloseoutBlock).toHaveBeenCalledTimes(2);
      const events = (await h.timeline(mission.id)).json().events;
      expect(
        events.filter((event: { eventType: string }) => event.eventType === 'GATE_REJECTED'),
      ).toHaveLength(1);
      expect(events.at(-1).payload).toMatchObject({ state: 'AGUARDANDO_AGENTE' });
    } finally {
      await h.app.close();
    }
  });

  it('rejects a trimmed HTTP roster missing SOFIA even when EMILY is listed', async () => {
    const h = await setup();
    try {
      const rejected = await h.create({ ...contract, requiredAgentExecutions: [emily] });
      expect(rejected.statusCode).toBe(403);
      expect(rejected.json().message).toContain('Sofia');
      expect(h.store.size).toBe(0);
    } finally {
      await h.app.close();
    }
  });

  it('disallows false opt-out or roster omission at HTTP close', async () => {
    const h = await setup();
    try {
      const created = await h.create({
        ...contract,
        collectiveCloseoutRequired: false,
        rosterRevision: undefined,
        requiredAgentExecutions: undefined,
      });
      expect(created.statusCode).toBe(201);
      const denied = await h.close(created.json().id);
      expect(denied.statusCode).toBe(403);
      expect(denied.json().message).toContain('roster');
      expect(h.persisted).not.toHaveBeenCalled();
    } finally {
      await h.app.close();
    }
  });

  it('rejects unknown structural HTTP fields rather than silently stripping them', async () => {
    const h = await setup();
    try {
      const bad = await h.create({
        ...contract,
        requiredAgentExecutions: [sofia, emily],
        unsafeOverride: 'force-close',
      } as McfMissionContract);
      expect(bad.statusCode).toBe(400);
      expect(h.store.size).toBe(0);
    } finally {
      await h.app.close();
    }
  });

  it('rejects a roster changed in storage without matching immutable creation event', async () => {
    const h = await setup();
    try {
      const created = await h.create(contract);
      expect(created.statusCode).toBe(201);
      const id = created.json().id;
      h.store.get(id)!.mission.contract = {
        ...contract,
        requiredAgentExecutions: [{ ...sofia, providerExecutionId: 'replaced' }, emily],
      };
      const denied = await h.close(id);
      expect(denied.statusCode).toBe(403);
      expect(denied.json().message).toContain('snapshot');
      expect(h.persisted).not.toHaveBeenCalled();
    } finally {
      await h.app.close();
    }
  });
});
