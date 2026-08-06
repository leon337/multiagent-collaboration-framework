import { randomUUID } from 'node:crypto';

import type { McfMissionState } from '@rsa/contracts';
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

function missionEvent(
  missionId: string,
  eventType: McfEventInput['eventType'],
  idempotencyKey: string,
  phaseId: string | null = null,
): McfEventInput {
  return {
    id: randomUUID(),
    missionId,
    phaseId,
    agentId: phaseId ? 'Emily' : null,
    eventType,
    payload: { hierarchyTest: true },
    idempotencyKey,
    occurredAt: new Date(),
  };
}

function phase(input: {
  id: string;
  missionId: string;
  agentId: string;
  skillId: string;
  now: Date;
}): McfPhaseRecord {
  return {
    id: input.id,
    missionId: input.missionId,
    skillId: input.skillId,
    agentId: input.agentId,
    state: 'COMPLETED',
    cycle: 1,
    inputs: { final_checkpoint: true },
    expectedEvidence: ['hierarchy_state'],
    startedAt: input.now,
    completedAt: input.now,
    createdAt: input.now,
    updatedAt: input.now,
  };
}

function parentMission(input: {
  id: string;
  now: Date;
  currentPhaseId: string | null;
}): McfMissionRecord {
  return {
    id: input.id,
    contract: {
      title: 'Parent mission',
      objective: 'Remain active until every child mission returns.',
      expectedOutcome: 'The validated parent checkpoint is restored safely.',
      scope: ['mission hierarchy'],
      outOfScope: ['production deployment'],
      acceptanceCriteria: ['child return is persisted'],
      riskClass: 'B',
      selectedAgents: ['Leonardo', 'Emily', 'Júlia'],
      selectedSkills: ['MCF-TRACE-MISSION'],
      sourceOfTruth: ['MCF-DEC-059'],
    },
    state: 'EXECUTING',
    currentPhaseId: input.currentPhaseId,
    currentAgentId: 'Leonardo',
    version: 1,
    createdAt: input.now,
    updatedAt: input.now,
  };
}

function childMission(input: {
  id: string;
  parentMissionId: string;
  now: Date;
}): McfMissionRecord {
  return {
    id: input.id,
    contract: {
      title: 'Child mission',
      objective: 'Complete a controlled subflow and return to the parent.',
      expectedOutcome: 'Return to Leonardo after completion.',
      scope: ['controlled subflow'],
      outOfScope: ['closing the parent mission'],
      acceptanceCriteria: ['parent checkpoint is restored'],
      riskClass: 'B',
      selectedAgents: ['Emily', 'Leonardo'],
      selectedSkills: ['MCF-TRACE-MISSION'],
      sourceOfTruth: ['MCF-DEC-059'],
      parentMissionId: input.parentMissionId,
      returnToAgentId: 'Leonardo',
      returnStatus: 'PENDING',
    },
    state: 'PLANNED',
    currentPhaseId: null,
    currentAgentId: null,
    version: 1,
    createdAt: input.now,
    updatedAt: input.now,
  };
}

async function createHierarchy(input: {
  repository: McfRuntimeRepository;
  parent: McfMissionRecord;
  child: McfMissionRecord;
}): Promise<void> {
  await input.repository.createMission({
    mission: input.parent,
    event: missionEvent(
      input.parent.id,
      'MISSION_CREATED',
      `mission:${input.parent.id}:created`,
    ),
  });
  await input.repository.createMission({
    mission: input.child,
    event: missionEvent(
      input.child.id,
      'MISSION_CREATED',
      `mission:${input.child.id}:created`,
    ),
  });
}

async function completeChild(input: {
  repository: McfRuntimeRepository;
  childMissionId: string;
  phaseId: string;
  now: Date;
}): Promise<void> {
  await input.repository.persistExecution({
    missionId: input.childMissionId,
    expectedMissionVersion: 1,
    phase: phase({
      id: input.phaseId,
      missionId: input.childMissionId,
      agentId: 'Emily',
      skillId: 'MCF-TRACE-MISSION',
      now: input.now,
    }),
    permissionProfile: 'READ_ONLY',
    missionState: 'COMPLETED',
    nextAgentId: null,
    receipt: null,
    evidenceStatus: 'VALID',
    handoff: null,
    events: [
      missionEvent(
        input.childMissionId,
        'PHASE_COMPLETED',
        `phase:${input.phaseId}:completed`,
        input.phaseId,
      ),
      missionEvent(
        input.childMissionId,
        'MISSION_COMPLETED',
        `mission:${input.childMissionId}:completed`,
        input.phaseId,
      ),
    ],
  });
}

describe('MCF mission hierarchy integration', () => {
  let database: DatabaseService;
  let repository: McfRuntimeRepository;

  beforeAll(() => {
    database = new DatabaseService();
    const postgresRepository = new PostgresMcfRuntimeRepository(database);
    repository = new OrderedMcfRuntimeRepository(database, postgresRepository);
  });

  afterAll(async () => {
    await database.onModuleDestroy();
  });

  it('restores the parent checkpoint after blocking premature completion', async () => {
    const parentMissionId = randomUUID();
    const childMissionId = randomUUID();
    const checkpointPhaseId = randomUUID();
    const prematurePhaseId = randomUUID();
    const childPhaseId = randomUUID();
    const now = new Date();

    try {
      await createHierarchy({
        repository,
        parent: parentMission({ id: parentMissionId, now, currentPhaseId: checkpointPhaseId }),
        child: childMission({ id: childMissionId, parentMissionId, now }),
      });

      const createdChild = await repository.findMission(childMissionId);
      expect(createdChild?.contract).toMatchObject({
        parentMissionId,
        returnToAgentId: 'Leonardo',
        returnStatus: 'PENDING',
      });

      const prematureCompletion = await repository.persistExecution({
        missionId: parentMissionId,
        expectedMissionVersion: 1,
        phase: phase({
          id: prematurePhaseId,
          missionId: parentMissionId,
          agentId: 'Emily',
          skillId: 'MCF-TRACE-MISSION',
          now,
        }),
        permissionProfile: 'READ_ONLY',
        missionState: 'COMPLETED',
        nextAgentId: null,
        receipt: null,
        evidenceStatus: 'VALID',
        handoff: null,
        events: [
          missionEvent(
            parentMissionId,
            'PHASE_COMPLETED',
            `phase:${prematurePhaseId}:completed`,
            prematurePhaseId,
          ),
          missionEvent(
            parentMissionId,
            'MISSION_COMPLETED',
            `mission:${parentMissionId}:completed`,
            prematurePhaseId,
          ),
        ],
      });

      expect(prematureCompletion.mission).toMatchObject({
        state: 'EXECUTING',
        currentPhaseId: checkpointPhaseId,
        currentAgentId: 'Leonardo',
        version: 2,
      });
      expect(
        (await repository.listEvents(parentMissionId)).map((event) => event.eventType),
      ).not.toContain('MISSION_COMPLETED');

      await completeChild({ repository, childMissionId, phaseId: childPhaseId, now });

      const completedChild = await repository.findMission(childMissionId);
      expect(completedChild).toMatchObject({
        state: 'COMPLETED',
        contract: {
          parentMissionId,
          returnToAgentId: 'Leonardo',
          returnStatus: 'COMPLETED',
        },
      });

      const resumedParent = await repository.findMission(parentMissionId);
      expect(resumedParent).toMatchObject({
        state: 'EXECUTING',
        currentPhaseId: checkpointPhaseId,
        currentAgentId: 'Leonardo',
        version: 3,
      });

      expect(
        (await repository.listEvents(childMissionId)).map((event) => event.eventType),
      ).toContain('PARENT_RETURN_COMPLETED');
      expect(
        (await repository.listEvents(parentMissionId)).map((event) => event.eventType),
      ).toContain('PARENT_MISSION_RESUMED');
    } finally {
      await database.query('delete from "mcf_missions" where "id" = $1', [childMissionId]);
      await database.query('delete from "mcf_missions" where "id" = $1', [parentMissionId]);
    }
  });

  it.each<McfMissionState>(['BLOCKED_RISK', 'RECOVERING', 'WAITING_EXTERNAL'])(
    'preserves protected parent state %s when the child returns',
    async (protectedState) => {
      const parentMissionId = randomUUID();
      const childMissionId = randomUUID();
      const childPhaseId = randomUUID();
      const now = new Date();

      try {
        await createHierarchy({
          repository,
          parent: parentMission({ id: parentMissionId, now, currentPhaseId: null }),
          child: childMission({ id: childMissionId, parentMissionId, now }),
        });

        await database.query(
          `update "mcf_missions"
           set "state" = $1, "current_agent_id" = $2, "version" = "version" + 1
           where "id" = $3`,
          [protectedState, 'Júlia', parentMissionId],
        );

        await completeChild({ repository, childMissionId, phaseId: childPhaseId, now });

        const protectedParent = await repository.findMission(parentMissionId);
        expect(protectedParent).toMatchObject({
          state: protectedState,
          currentAgentId: 'Júlia',
        });

        const parentEvents = (await repository.listEvents(parentMissionId)).map(
          (event) => event.eventType,
        );
        expect(parentEvents).toContain('PARENT_RETURN_DEFERRED');
        expect(parentEvents).not.toContain('PARENT_MISSION_RESUMED');
      } finally {
        await database.query('delete from "mcf_missions" where "id" = $1', [childMissionId]);
        await database.query('delete from "mcf_missions" where "id" = $1', [parentMissionId]);
      }
    },
  );
});
