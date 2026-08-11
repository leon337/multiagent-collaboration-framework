import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DatabaseService } from '../database.service.js';
import { ChatMissionPlanner } from './chat-mission-planner.js';
import { ChatRuntimeBridgeService } from './chat-runtime-bridge.service.js';
import { EvidenceValidator } from './evidence-validator.js';
import { MissionRuntimeService } from './mission-runtime.service.js';
import { OrderedMcfRuntimeRepository } from './ordered-mcf-runtime.repository.js';
import { PermissionEngine } from './permission-engine.js';
import { PostgresMcfRuntimeRepository } from './postgres-mcf-runtime.repository.js';
import { SkillExecutor } from './skill-executor.js';
import { SkillRegistryLoader } from './skill-registry.loader.js';

describe('ChatRuntimeBridge Lot 4D debug incident boundary', () => {
  let database: DatabaseService;
  let runtime: MissionRuntimeService;
  let bridge: ChatRuntimeBridgeService;

  beforeAll(() => {
    process.env.MCF_RECEIPT_SECRET = 'test-only-mcf-receipt-secret-lot4d-bridge-0001';
    database = new DatabaseService();
    const postgres = new PostgresMcfRuntimeRepository(database);
    const repository = new OrderedMcfRuntimeRepository(database, postgres);
    const registry = new SkillRegistryLoader();
    const evidence = new EvidenceValidator();
    const executor = new SkillExecutor(registry, new PermissionEngine(), evidence);
    runtime = new MissionRuntimeService(repository, executor, registry, evidence);
    bridge = new ChatRuntimeBridgeService(runtime, new ChatMissionPlanner());
  });

  afterAll(async () => {
    await database.onModuleDestroy();
  });

  it('executes bootstrap only and leaves MCF-DEBUG-INCIDENT in READY_AGENT', async () => {
    const response = await bridge.dispatch({
      objective: 'Diagnosticar incidente e encontrar a causa raiz sem blind retry.',
    });

    try {
      expect(response.internalExecutions.map((execution) => execution.skillId)).toEqual([
        'MCF-START-MISSION',
        'MCF-SELECT-AGENTS',
      ]);
      expect(response.internalExecutions.map((execution) => execution.skillId)).not.toContain(
        'MCF-DEBUG-INCIDENT',
      );
      expect(response.plan.find((step) => step.skillId === 'MCF-DEBUG-INCIDENT')).toMatchObject({
        agentId: 'Patricia',
        handoffTo: 'Renato',
        state: 'READY_AGENT',
      });
      expect(response.humanActionRequired).toBe(false);

      const timeline = await runtime.timeline(response.mission.id);
      const selectedSkills = timeline.events
        .filter((event) => event.eventType === 'SKILL_SELECTED')
        .map((event) => event.payload.skillId);
      expect(selectedSkills).not.toContain('MCF-DEBUG-INCIDENT');
    } finally {
      await database.query('delete from "mcf_missions" where "id" = $1', [response.mission.id]);
    }
  });
});
