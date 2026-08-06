import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DatabaseService } from '../database.service.js';
import type {
  McfEventInput,
  McfMissionRecord,
  McfPhaseRecord,
  McfRuntimeRepository,
} from './mcf-runtime.repository.js';
import { OrderedMcfRuntimeRepository } from './ordered-mcf-runtime.repository.js';
import { PostgresMcfRuntimeRepository } from './postgres-mcf-runtime.repository.js';

function createdEvent(missionId: string): McfEventInput {
  return {
    id: randomUUID(),
    missionId,
    phaseId: null,
    agentId: null,
    eventType: 'MISSION_CREATED',
    payload: { hierarchyHardeningTest: true },
    idempotencyKey: `mission:${missionId}:created`,
    occurredAt: new Date(),
  };
}

function executionEvent(
  missionId: string,
  phaseId: string,
  eventType: 'PHASE_COMPLETED' | 'MISSION_COMPLETED',
): McfEventInput {
  return {
    id: randomUUID(),
    missionId,
    phaseId,
    agentId: 'Emily',
    eventType,
    payload: { hierarchyHardeningTest: true },
    idempotencyKey: `${eventType.toLowerCase()}:${missionId}:${phaseId}`,
    occurredAt: new Date(),
  };
}

function mission(input: {
  id: string;
  now: Date;
  selectedAgents: string[];
  parentMissionId?: string;
  returnToAgentId?: string;
}): McfMissionRecord {
  const child = input.parentMissionId !== undefined;
  return {
    id: input.id,
    contract: {
      title: child ? 'Child mission' : 'Parent mission',
      objective: child
        ? 'Execute one controlled child flow and return safely.'
        : 'Coordinate one controlled hierarchy flow.',
      expectedOutcome: child ? 'Return to the validated parent checkpoint.' : 'Preserve order.',
      scope: ['mission hierarchy hardening'],
      outOfScope: ['production deployment'],
      acceptanceCriteria: ['hierarchy remains deterministic'],
      riskClass: 'B',
      selectedAgents: input.selectedAgents,
      selectedSkills: ['MCF-TRACE-MISSION'],
      sourceOfTruth: ['MCF-DEC-059'],
      ...(child
        ? {
            parentMissionId: input.parentMissionId,
            returnToAgentId: input.returnToAgentId,
            returnStatus: 'PENDING' as const,
          }
        : {}),
    },
    state: child ? 'PLANNED' : 'EXECUTING',
    currentPhaseId: null,
    currentAgentId: child ? null : (input.selectedAgents[0] ?? null),
    version: 1,
    createdAt: input.now,
    updatedAt: input.now,
  };
}

function phase(missionId: string, phaseId: string, now: Date): McfPhaseRecord {
  return {
    id: phaseId,
    missionId,
    skillId: 'MCF-TRACE-MISSION',
    agentId: 'Emily',
    state: 'COMPLETED',
    cycle: 1,
    inputs: { final_checkpoint: true },
    expectedEvidence: ['hierarchy_state'],
    startedAt: now,
    completedAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

async function completeMission(input: {
  repository: McfRuntimeRepository;
  missionId: string;
  phaseId: string;
  expectedVersion: number;
  now: Date;
}): Promise<void> {
  await input.repository.persistExecution({
    missionId: input.missionId,
    expectedMissionVersion: input.expectedVersion,
    phase: phase(input.missionId, input.phaseId, input.now),
    permissionProfile: 'READ_ONLY',
    missionState: 'COMPLETED',
    nextAgentId: null,
    receipt: null,
    evidenceStatus: 'VALID',
    handoff: null,
    events: [
      executionEvent(input.missionId, input.phaseId, 'PHASE_COMPLETED'),
      executionEvent(input.missionId, input.phaseId, 'MISSION_COMPLETED'),
    ],
  });
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

describe('MCF mission hierarchy gate hardening', () => {
  let database: DatabaseService;
  let repository: McfRuntimeRepository;

  beforeAll(() => {
    database = new DatabaseService();
    repository = new OrderedMcfRuntimeRepository(
      database,
      new PostgresMcfRuntimeRepository(database),
    );
  });

  afterAll(async () => {
    await database.onModuleDestroy();
  });

  it('rejects Leandro and unselected agents as parent return targets', async () => {
    const parentMissionId = randomUUID();
    const humanChildId = randomUUID();
    const unselectedChildId = randomUUID();
    const now = new Date();

    try {
      await repository.createMission({
        mission: mission({ id: parentMissionId, now, selectedAgents: ['Leonardo'] }),
        event: createdEvent(parentMissionId),
      });

      await expect(
        repository.createMission({
          mission: mission({
            id: humanChildId,
            now,
            selectedAgents: ['Emily'],
            parentMissionId,
            returnToAgentId: 'Leandro',
          }),
          event: createdEvent(humanChildId),
        }),
      ).rejects.toThrow(/Leandro cannot receive/u);

      await expect(
        repository.createMission({
          mission: mission({
            id: unselectedChildId,
            now,
            selectedAgents: ['Emily'],
            parentMissionId,
            returnToAgentId: 'Emily',
          }),
          event: createdEvent(unselectedChildId),
        }),
      ).rejects.toThrow(/was not selected by parent mission/u);

      expect(await repository.findMission(humanChildId)).toBeNull();
      expect(await repository.findMission(unselectedChildId)).toBeNull();
    } finally {
      await database.query('delete from "mcf_missions" where "id" = any($1::text[])', [
        [humanChildId, unselectedChildId, parentMissionId],
      ]);
    }
  });

  it('blocks intermediate completion and records return after child completion events', async () => {
    const rootMissionId = randomUUID();
    const childMissionId = randomUUID();
    const grandchildMissionId = randomUUID();
    const childPrematurePhaseId = randomUUID();
    const grandchildPhaseId = randomUUID();
    const childFinalPhaseId = randomUUID();
    const now = new Date();

    try {
      await repository.createMission({
        mission: mission({ id: rootMissionId, now, selectedAgents: ['Leonardo'] }),
        event: createdEvent(rootMissionId),
      });
      await repository.createMission({
        mission: mission({
          id: childMissionId,
          now,
          selectedAgents: ['Emily', 'Leonardo'],
          parentMissionId: rootMissionId,
          returnToAgentId: 'Leonardo',
        }),
        event: createdEvent(childMissionId),
      });
      await repository.createMission({
        mission: mission({
          id: grandchildMissionId,
          now,
          selectedAgents: ['Emily'],
          parentMissionId: childMissionId,
          returnToAgentId: 'Emily',
        }),
        event: createdEvent(grandchildMissionId),
      });

      await completeMission({
        repository,
        missionId: childMissionId,
        phaseId: childPrematurePhaseId,
        expectedVersion: 1,
        now,
      });

      expect(await repository.findMission(childMissionId)).toMatchObject({
        state: 'PLANNED',
        version: 2,
      });
      expect(
        (await repository.listEvents(childMissionId)).map((event) => event.eventType),
      ).not.toContain('MISSION_COMPLETED');

      await completeMission({
        repository,
        missionId: grandchildMissionId,
        phaseId: grandchildPhaseId,
        expectedVersion: 1,
        now,
      });

      const grandchildEvents = (await repository.listEvents(grandchildMissionId)).map(
        (event) => event.eventType,
      );
      expect(grandchildEvents.indexOf('PHASE_COMPLETED')).toBeLessThan(
        grandchildEvents.indexOf('MISSION_COMPLETED'),
      );
      expect(grandchildEvents.indexOf('MISSION_COMPLETED')).toBeLessThan(
        grandchildEvents.indexOf('PARENT_RETURN_COMPLETED'),
      );

      expect(await repository.findMission(childMissionId)).toMatchObject({
        state: 'PLANNED',
        currentAgentId: 'Emily',
        version: 3,
      });

      await completeMission({
        repository,
        missionId: childMissionId,
        phaseId: childFinalPhaseId,
        expectedVersion: 3,
        now,
      });

      expect(await repository.findMission(rootMissionId)).toMatchObject({
        state: 'EXECUTING',
        currentAgentId: 'Leonardo',
        version: 2,
      });
    } finally {
      await database.query('delete from "mcf_missions" where "id" = any($1::text[])', [
        [grandchildMissionId, childMissionId, rootMissionId],
      ]);
    }
  });

  it('locks the parent checkpoint before a concurrent parent update can commit', async () => {
    const parentMissionId = randomUUID();
    const childMissionId = randomUUID();
    const now = new Date();
    let releaseChildTransaction: (() => void) | undefined;
    let signalChildInserted: (() => void) | undefined;
    const childTransactionHold = new Promise<void>((resolve) => {
      releaseChildTransaction = resolve;
    });
    const childInserted = new Promise<void>((resolve) => {
      signalChildInserted = resolve;
    });

    try {
      await repository.createMission({
        mission: mission({ id: parentMissionId, now, selectedAgents: ['Leonardo'] }),
        event: createdEvent(parentMissionId),
      });

      const childRecord = mission({
        id: childMissionId,
        now,
        selectedAgents: ['Emily'],
        parentMissionId,
        returnToAgentId: 'Leonardo',
      });
      const childTransaction = database.transaction(async (client) => {
        await client.query(
          `insert into "mcf_missions" (
             "id", "contract", "state", "current_phase_id", "current_agent_id",
             "version", "created_at", "updated_at"
           ) values ($1, $2::jsonb, $3, $4, $5, $6, $7, $8)`,
          [
            childRecord.id,
            JSON.stringify(childRecord.contract),
            childRecord.state,
            childRecord.currentPhaseId,
            childRecord.currentAgentId,
            childRecord.version,
            childRecord.createdAt,
            childRecord.updatedAt,
          ],
        );
        signalChildInserted?.();
        await childTransactionHold;
      });

      await childInserted;
      const parentUpdate = database.transaction(async (client) => {
        await client.query(
          `update "mcf_missions"
           set "current_agent_id" = $1, "version" = "version" + 1
           where "id" = $2`,
          ['Júlia', parentMissionId],
        );
      });
      const earlySettlement = await Promise.race([
        parentUpdate.then(
          () => 'settled',
          () => 'settled',
        ),
        delay(100).then(() => 'waiting'),
      ]);
      expect(earlySettlement).toBe('waiting');

      releaseChildTransaction?.();
      await childTransaction;
      await expect(parentUpdate).rejects.toThrow(/is suspended while a submission is pending/u);
    } finally {
      releaseChildTransaction?.();
      await database.query('delete from "mcf_missions" where "id" = any($1::text[])', [
        [childMissionId, parentMissionId],
      ]);
    }
  });
});
