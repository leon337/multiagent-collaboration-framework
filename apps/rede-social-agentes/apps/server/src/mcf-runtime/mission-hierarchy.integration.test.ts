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

  it('blocks premature parent completion and resumes it after child completion', async () => {
    const parentMissionId = randomUUID();
    const childMissionId = randomUUID();
    const parentPhaseId = randomUUID();
    const childPhaseId = randomUUID();
    const now = new Date();

    const parentMission: McfMissionRecord = {
      id: parentMissionId,
      contract: {
        title: 'Parent mission',
        objective: 'Remain active until the child mission returns.',
        expectedOutcome: 'Parent resumes with the configured agent.',
        scope: ['mission hierarchy'],
        outOfScope: ['production deployment'],
        acceptanceCriteria: ['child return is persisted'],
        riskClass: 'B',
        selectedAgents: ['Leonardo', 'Emily'],
        selectedSkills: ['MCF-TRACE-MISSION'],
        sourceOfTruth: ['MCF-DEC-016-A1'],
      },
      state: 'PLANNED',
      currentPhaseId: null,
      currentAgentId: null,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    const childMission: McfMissionRecord = {
      id: childMissionId,
      contract: {
        title: 'Child mission',
        objective: 'Complete a controlled subflow and return to the parent.',
        expectedOutcome: 'Return to Leonardo after completion.',
        scope: ['controlled subflow'],
        outOfScope: ['closing the parent mission'],
        acceptanceCriteria: ['parent is resumed'],
        riskClass: 'B',
        selectedAgents: ['Emily', 'Leonardo'],
        selectedSkills: ['MCF-TRACE-MISSION'],
        sourceOfTruth: ['MCF-DEC-016-A1'],
        parentMissionId,
        returnToAgentId: 'Leonardo',
        returnStatus: 'PENDING',
      },
      state: 'PLANNED',
      currentPhaseId: null,
      currentAgentId: null,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await repository.createMission({
        mission: parentMission,
        event: missionEvent(
          parentMissionId,
          'MISSION_CREATED',
          `mission:${parentMissionId}:created`,
        ),
      });

      const createdChild = await repository.createMission({
        mission: childMission,
        event: missionEvent(childMissionId, 'MISSION_CREATED', `mission:${childMissionId}:created`),
      });
      expect(createdChild.contract).toMatchObject({
        parentMissionId,
        returnToAgentId: 'Leonardo',
        returnStatus: 'PENDING',
      });

      const prematureCompletion = await repository.persistExecution({
        missionId: parentMissionId,
        expectedMissionVersion: 1,
        phase: phase({
          id: parentPhaseId,
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
            `phase:${parentPhaseId}:completed`,
            parentPhaseId,
          ),
          missionEvent(
            parentMissionId,
            'MISSION_COMPLETED',
            `mission:${parentMissionId}:completed`,
            parentPhaseId,
          ),
        ],
      });

      expect(prematureCompletion.mission).toMatchObject({
        state: 'EXECUTING',
        version: 2,
      });
      expect(
        (await repository.listEvents(parentMissionId)).map((event) => event.eventType),
      ).not.toContain('MISSION_COMPLETED');

      const completedChild = await repository.persistExecution({
        missionId: childMissionId,
        expectedMissionVersion: 1,
        phase: phase({
          id: childPhaseId,
          missionId: childMissionId,
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
            childMissionId,
            'PHASE_COMPLETED',
            `phase:${childPhaseId}:completed`,
            childPhaseId,
          ),
          missionEvent(
            childMissionId,
            'MISSION_COMPLETED',
            `mission:${childMissionId}:completed`,
            childPhaseId,
          ),
        ],
      });

      expect(completedChild.mission).toMatchObject({
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
});
