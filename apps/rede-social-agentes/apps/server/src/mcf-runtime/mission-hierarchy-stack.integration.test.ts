import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DatabaseService } from '../database.service.js';
import type {
  McfEventInput,
  McfMissionRecord,
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
    payload: { stackTest: true },
    idempotencyKey: `mission:${missionId}:created`,
    occurredAt: new Date(),
  };
}

function mission(input: {
  id: string;
  now: Date;
  parentMissionId?: string;
}): McfMissionRecord {
  const child = input.parentMissionId !== undefined;

  return {
    id: input.id,
    contract: {
      title: child ? 'Child mission' : 'Parent mission',
      objective: child ? 'Open one controlled submission.' : 'Own one active submission at a time.',
      expectedOutcome: child ? 'Return to Leonardo.' : 'Preserve deterministic stack order.',
      scope: ['mission hierarchy stack'],
      outOfScope: ['parallel submissions'],
      acceptanceCriteria: ['at most one pending child'],
      riskClass: 'B',
      selectedAgents: ['Leonardo', 'Emily'],
      selectedSkills: ['MCF-TRACE-MISSION'],
      sourceOfTruth: ['MCF-DEC-059'],
      ...(child
        ? {
            parentMissionId: input.parentMissionId,
            returnToAgentId: 'Leonardo',
            returnStatus: 'PENDING' as const,
          }
        : {}),
    },
    state: child ? 'PLANNED' : 'EXECUTING',
    currentPhaseId: null,
    currentAgentId: child ? null : 'Leonardo',
    version: 1,
    createdAt: input.now,
    updatedAt: input.now,
  };
}

describe('MCF mission hierarchy stack integration', () => {
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

  it('allows only one pending child per parent mission', async () => {
    const parentMissionId = randomUUID();
    const firstChildId = randomUUID();
    const secondChildId = randomUUID();
    const now = new Date();

    try {
      await repository.createMission({
        mission: mission({ id: parentMissionId, now }),
        event: createdEvent(parentMissionId),
      });
      await repository.createMission({
        mission: mission({ id: firstChildId, now, parentMissionId }),
        event: createdEvent(firstChildId),
      });

      await expect(
        repository.createMission({
          mission: mission({ id: secondChildId, now, parentMissionId }),
          event: createdEvent(secondChildId),
        }),
      ).rejects.toThrow();

      expect(await repository.findMission(secondChildId)).toBeNull();
      expect(
        (await repository.listEvents(parentMissionId)).filter(
          (event) => event.eventType === 'SUBMISSION_OPENED',
        ),
      ).toHaveLength(1);
    } finally {
      await database.query('delete from "mcf_missions" where "id" = $1', [firstChildId]);
      await database.query('delete from "mcf_missions" where "id" = $1', [parentMissionId]);
    }
  });
});
