import { randomUUID } from 'node:crypto';

import type { McfSkillDefinition } from '@rsa/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DatabaseService } from '../database.service.js';
import { ExternalActionLedger } from './external-action-ledger.js';

const REPOSITORY = 'leon337/multiagent-collaboration-framework';
const ADAPTER = 'github-pr-collaboration-write-v1';

const skill: McfSkillDefinition = {
  skillId: 'MCF-GIT-PR-RELEASE',
  name: 'Git PR Release',
  version: '1.0.0',
  purpose: 'controlled GitHub PR collaboration',
  ownerAgents: ['Gabriel'],
  requiredInputs: [],
  allowedTools: ['github'],
  forbiddenTools: ['force-push', 'merge-with-red-ci'],
  permissionProfile: 'SCOPED_WRITE',
  executionSteps: [],
  requiredEvidence: [],
  acceptanceCriteria: [],
  failureModes: [],
  fallback: 'Mestre',
  handoffTo: 'Mestre',
};

function missionContract(title: string) {
  return JSON.stringify({
    title,
    objective: 'Prove deadlock-free global expired reservation recovery.',
    expectedOutcome: 'Cross-mission compatible retries serialize and complete.',
    scope: ['C2 global idempotency recovery'],
    outOfScope: ['real provider write'],
    acceptanceCriteria: ['no cross-mission A->B/B->A deadlock'],
    riskClass: 'B',
    selectedAgents: ['Gabriel', 'Mestre'],
    selectedSkills: ['MCF-GIT-PR-RELEASE'],
    sourceOfTruth: ['MCF-RUNTIME-006-C2'],
  });
}

function request(missionId: string, phaseId: string, idempotencyKey: string, commentBody: string) {
  return {
    skill,
    agentId: 'Gabriel',
    inputs: {
      authorizedScope: true,
      repository: REPOSITORY,
      pull_request_number: 80,
      expected_head_sha: 'a'.repeat(40),
      idempotency_key: idempotencyKey,
      comment_body: commentBody,
    },
    tool: {
      provider: 'github',
      operation: 'comment-pr',
      resource: REPOSITORY,
    },
    context: { missionId, phaseId, expectedMissionVersion: 1 },
  };
}

describe('C2 global recovery lock ordering', () => {
  let database: DatabaseService;
  let ledger: ExternalActionLedger;

  beforeAll(() => {
    database = new DatabaseService();
    ledger = new ExternalActionLedger(database);
  });

  afterAll(async () => {
    await database.onModuleDestroy();
  });

  async function insertMission(missionId: string, title: string, now: Date) {
    await database.query(
      `insert into "mcf_missions" (
        "id", "contract", "state", "current_phase_id", "current_agent_id",
        "version", "created_at", "updated_at"
      ) values ($1, $2::jsonb, 'EXECUTING', null, 'Gabriel', 1, $3, $3)`,
      [missionId, missionContract(title), now],
    );
  }

  async function expire(attemptId: string) {
    await database.query(
      `update "mcf_external_action_attempts"
       set "lease_expires_at" = now() - interval '1 minute'
       where "attempt_id" = $1`,
      [attemptId],
    );
  }

  async function cleanup(missionIds: string[]) {
    await database.query(
      `delete from "mcf_external_action_attempts" where "mission_id" = any($1::text[])`,
      [missionIds],
    );
    await database.query(`delete from "mcf_events" where "mission_id" = any($1::text[])`, [
      missionIds,
    ]);
    await database.query(`delete from "mcf_missions" where "id" = any($1::text[])`, [missionIds]);
  }

  it('serializes concurrent cross-mission expired recovery', async () => {
    const missionA = randomUUID();
    const missionB = randomUUID();
    const keyA = 'mcf-c2-deadlock-key-a-0001';
    const keyB = 'mcf-c2-deadlock-key-b-0001';
    const bodyA = 'logical payload A';
    const bodyB = 'logical payload B';
    const now = new Date();

    try {
      await insertMission(missionA, 'C2 deadlock mission A', now);
      await insertMission(missionB, 'C2 deadlock mission B', now);

      const holderA = await ledger.reserve(request(missionA, randomUUID(), keyA, bodyA), ADAPTER);
      const holderB = await ledger.reserve(request(missionB, randomUUID(), keyB, bodyB), ADAPTER);
      await expire(holderA);
      await expire(holderB);

      const results = await Promise.allSettled([
        ledger.reserve(request(missionA, randomUUID(), keyB, bodyB), ADAPTER),
        ledger.reserve(request(missionB, randomUUID(), keyA, bodyA), ADAPTER),
      ]);

      expect(results.every((result) => result.status === 'fulfilled')).toBe(true);

      const attempts = await database.query<{ status: string; count: string }>(
        `select "status", count(*)::text as "count"
         from "mcf_external_action_attempts"
         where "mission_id" = any($1::text[])
         group by "status"`,
        [[missionA, missionB]],
      );
      const counts = Object.fromEntries(
        attempts.rows.map((row) => [row.status, Number(row.count)]),
      );
      expect(counts.ABANDONED).toBe(2);
      expect(counts.ALLOWED).toBe(2);
    } finally {
      await cleanup([missionA, missionB]);
    }
  });
});
