import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { DatabaseService } from '../database.service.js';
import { AdapterRegistry } from './adapter-registry.js';
import { CanonicalExternalActionLedger } from './canonical-external-action-ledger.js';
import { EvidenceValidator } from './evidence-validator.js';
import { ExternalActionDispatcher } from './external-action-dispatcher.js';
import { GitHubPullCollaborationAdapter } from './github-pr-collaboration.adapter.js';
import { PermissionEngine } from './permission-engine.js';
import { SkillExecutor } from './skill-executor.js';
import { SkillRegistryLoader } from './skill-registry.loader.js';

const enabled = process.env.MCF_GATE_C_C2_REAL_WRITE === '1';
const repository = 'leon337/multiagent-collaboration-framework';
const shaPattern = /^[a-f0-9]{40}$/u;

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for the Gate C C2 provider proof`);
  return value;
}

async function countProofComments(pullNumber: number, idempotencyKey: string): Promise<number> {
  const token = requiredEnv('GITHUB_TOKEN');
  const marker = `<!-- mcf-idempotency:${idempotencyKey} -->`;
  const response = await fetch(
    `https://api.github.com/repos/${repository}/issues/${pullNumber}/comments?per_page=100`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'mcf-gate-c-c2-provider-proof',
      },
    },
  );
  if (!response.ok) throw new Error(`GitHub C2 proof read-back failed with HTTP ${response.status}`);
  const comments = (await response.json()) as Array<{ body?: string | null }>;
  return comments.filter((comment) => comment.body?.includes(marker)).length;
}

async function persistArtifact(proof: Record<string, unknown>): Promise<void> {
  const directory = resolve(process.cwd(), 'test-results');
  await mkdir(directory, { recursive: true });
  await writeFile(
    resolve(directory, 'gate-c-c2-real-provider-write.json'),
    `${JSON.stringify(proof, null, 2)}\n`,
    'utf8',
  );
}

describe('MCF Gate C C2 real GitHub provider proof', () => {
  it('comments on an existing controlled PR through the governed runtime path', async () => {
    if (!enabled) return;

    const headSha = requiredEnv('MCF_GATE_C_HEAD_SHA').toLowerCase();
    const pullNumber = Number(requiredEnv('MCF_GATE_C_EXISTING_PR_NUMBER'));
    const authSource = process.env.MCF_GATE_C_AUTH_SOURCE?.trim() || 'UNKNOWN';
    expect(headSha).toMatch(shaPattern);
    expect(Number.isInteger(pullNumber) && pullNumber > 0).toBe(true);
    expect(requiredEnv('GITHUB_REPOSITORY').toLowerCase()).toBe(repository);
    requiredEnv('MCF_GITHUB_TOKEN');
    requiredEnv('GITHUB_TOKEN');

    const database = new DatabaseService();
    const evidence = new EvidenceValidator();
    const ledger = new CanonicalExternalActionLedger(database);
    const dispatcher = new ExternalActionDispatcher(
      new AdapterRegistry([new GitHubPullCollaborationAdapter(evidence)]),
      ledger,
    );
    const executor = new SkillExecutor(
      new SkillRegistryLoader(),
      new PermissionEngine(),
      evidence,
      dispatcher,
    );

    const missionId = randomUUID();
    const firstPhase = randomUUID();
    const replayPhase = randomUUID();
    const idempotencyKey = `gate-c-c2-existing-${headSha.slice(0, 20)}`;
    const now = new Date();

    try {
      await database.query(
        `insert into "mcf_missions" (
          "id", "contract", "state", "current_phase_id", "current_agent_id",
          "version", "created_at", "updated_at"
        ) values ($1, $2::jsonb, 'EXECUTING', null, 'Gabriel', 1, $3, $3)`,
        [
          missionId,
          JSON.stringify({
            title: 'Gate C C2 existing PR proof',
            objective: 'Prove real governed C2 comment write.',
            acceptanceCriteria: ['real comment write', 'read-back', 'idempotency'],
            riskClass: 'C',
            sourceOfTruth: ['GitHub', 'Issue #111', `PR #${pullNumber}`],
          }),
          now,
        ],
      );

      const inputs = {
        authorizedScope: true,
        repository,
        branch: 'feat/mcf-runtime-006-gate-c-real-provider-write',
        acceptance_state: 'GATE_C_CONTROLLED_C2_PROOF',
        pull_request_number: pullNumber,
        expected_head_sha: headSha,
        idempotency_key: idempotencyKey,
        comment_body:
          'MCF Gate C controlled C2 proof: real PR comment written by the governed runtime provider path. Production remains blocked.',
      };
      const tool = { provider: 'github', operation: 'comment-pr', resource: repository };

      const first = await executor.execute({
        skillId: 'MCF-GIT-PR-RELEASE',
        agentId: 'Gabriel',
        inputs,
        tool,
        executionContext: { missionId, phaseId: firstPhase, expectedMissionVersion: 1 },
      });

      if (first.evidenceStatus !== 'VALID') {
        await persistArtifact({
          stage: 'C2_DIAGNOSTIC',
          missionId,
          repository,
          headSha,
          pullNumber,
          authSource,
          evidenceStatus: first.evidenceStatus,
          rejectionReason: first.rejectionReason,
          externalAction: first.externalAction,
          production: 'BLOCKED',
        });
        throw new Error(`C2 existing-PR proof did not reach VALID: ${first.evidenceStatus}`);
      }

      expect(first.externalAction?.status).toBe('EXECUTED');
      expect(first.receipt?.status).toBe('SUCCEEDED');
      expect(first.receipt?.commitSha).toBe(headSha);
      expect(first.receipt?.metadata.readBackVerified).toBe(true);

      const replay = await executor.execute({
        skillId: 'MCF-GIT-PR-RELEASE',
        agentId: 'Gabriel',
        inputs,
        tool,
        executionContext: { missionId, phaseId: replayPhase, expectedMissionVersion: 1 },
      });

      expect(replay.evidenceStatus).toBe('INVALID');
      expect(replay.externalAction?.status).toBe('FAILED');
      expect(replay.externalAction?.failureCode).toBe('RESERVATION_CONFLICT');
      expect(await countProofComments(pullNumber, idempotencyKey)).toBe(1);

      const attempts = await database.query<{
        adapterId: string;
        status: string;
        receiptId: string | null;
      }>(
        `select
          "adapter_id" as "adapterId",
          "status",
          "receipt_id" as "receiptId"
        from "mcf_external_action_attempts"
        where "mission_id" = $1
        order by "created_at" asc`,
        [missionId],
      );

      expect(attempts.rows).toHaveLength(1);
      expect(attempts.rows[0]?.adapterId).toBe('github-pr-collaboration-write-v1');
      expect(attempts.rows[0]?.status).toBe('EVIDENCE_VALIDATED');
      expect(typeof attempts.rows[0]?.receiptId).toBe('string');

      await persistArtifact({
        stage: 'COMPLETE',
        missionId,
        repository,
        headSha,
        pullNumber,
        authSource,
        adapterId: first.externalAction?.adapterId ?? null,
        attemptId: first.externalAction?.attemptId ?? null,
        receiptId: first.receipt?.receiptId ?? null,
        mutationExternalId: first.receipt?.metadata.mutationExternalId ?? null,
        mutationUrl: first.receipt?.metadata.mutationUrl ?? null,
        readBackVerified: first.receipt?.metadata.readBackVerified ?? null,
        duplicateReplayFailure: replay.externalAction?.failureCode ?? null,
        proofCommentCount: 1,
        ledgerAttemptStatus: attempts.rows[0]?.status ?? null,
        production: 'BLOCKED',
      });
    } finally {
      await database.onModuleDestroy();
    }
  });
});
