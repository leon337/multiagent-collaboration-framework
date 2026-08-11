import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { DatabaseService } from '../database.service.js';
import { AdapterRegistry } from './adapter-registry.js';
import { CanonicalExternalActionLedger } from './canonical-external-action-ledger.js';
import { EvidenceValidator } from './evidence-validator.js';
import { ExternalActionDispatcher } from './external-action-dispatcher.js';
import { GitHubBranchPullRequestAdapter } from './github-branch-pr.adapter.js';
import { GitHubPullCollaborationAdapter } from './github-pr-collaboration.adapter.js';
import { MissionRuntimeService } from './mission-runtime.service.js';
import { OrderedMcfRuntimeRepository } from './ordered-mcf-runtime.repository.js';
import { PermissionEngine } from './permission-engine.js';
import { PostgresMcfRuntimeRepository } from './postgres-mcf-runtime.repository.js';
import { SkillExecutor } from './skill-executor.js';
import { SkillRegistryLoader } from './skill-registry.loader.js';

const enabled = process.env.MCF_GATE_C_REAL_WRITE === '1';
const repository = 'leon337/multiagent-collaboration-framework';
const shaPattern = /^[a-f0-9]{40}$/u;

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for the Gate C real-provider proof`);
  return value;
}

function proofContract() {
  return {
    title: 'MCF-RUNTIME-006 Gate C real provider write proof',
    objective:
      'Prove governed reversible GitHub writes through the complete MCF Runtime lifecycle.',
    expectedOutcome: 'C1 and C2 real writes verified with receipts, ledger and idempotency.',
    scope: ['controlled reversible GitHub branch/PR write', 'controlled PR comment'],
    outOfScope: ['production', 'direct main write', 'merge', 'destructive action'],
    acceptanceCriteria: [
      'C1 real provider write read-back verified',
      'C1 compatible replay reuses the existing PR',
      'C2 real provider write read-back verified',
      'C2 durable idempotency prevents duplicate comment',
      'receipts and ledger evidence validated',
    ],
    riskClass: 'C' as const,
    selectedAgents: ['Gabriel', 'Mestre'],
    selectedSkills: ['MCF-GIT-PR-RELEASE'],
    sourceOfTruth: ['GitHub', 'Issue #111'],
  };
}

async function countProofComments(pullNumber: number, idempotencyKey: string): Promise<number> {
  const token = requiredEnv('GITHUB_TOKEN');
  const marker = `<!-- mcf-idempotency:${idempotencyKey} -->`;
  let count = 0;

  for (let page = 1; page <= 10; page += 1) {
    const response = await fetch(
      `https://api.github.com/repos/${repository}/issues/${pullNumber}/comments?per_page=100&page=${page}`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'mcf-gate-c-provider-proof',
        },
      },
    );
    if (!response.ok) {
      throw new Error(`GitHub proof read-back failed with HTTP ${response.status}`);
    }
    const comments = (await response.json()) as Array<{ body?: string | null }>;
    count += comments.filter((comment) => comment.body?.includes(marker)).length;
    if (comments.length < 100) return count;
  }

  throw new Error('GitHub proof comment read-back exceeded bounded pagination');
}

async function countProofPullRequests(
  branchRef: string,
  headSha: string,
  idempotencyKey: string,
): Promise<number> {
  const token = requiredEnv('GITHUB_TOKEN');
  const marker = `<!-- mcf-idempotency:${idempotencyKey} -->`;
  const url = new URL(`https://api.github.com/repos/${repository}/pulls`);
  url.searchParams.set('state', 'all');
  url.searchParams.set('head', `leon337:${branchRef}`);
  url.searchParams.set('per_page', '100');

  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'mcf-gate-c-provider-proof',
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub C1 proof read-back failed with HTTP ${response.status}`);
  }
  const pulls = (await response.json()) as Array<{
    body?: string | null;
    head?: { ref?: string; sha?: string };
  }>;
  return pulls.filter(
    (pull) =>
      pull.body?.includes(marker) &&
      pull.head?.ref === branchRef &&
      pull.head?.sha?.toLowerCase() === headSha,
  ).length;
}

async function persistProofArtifact(proof: Record<string, unknown>): Promise<void> {
  const directory = resolve(process.cwd(), 'test-results');
  await mkdir(directory, { recursive: true });
  await writeFile(
    resolve(directory, 'gate-c-real-provider-write.json'),
    `${JSON.stringify(proof, null, 2)}\n`,
    'utf8',
  );
}

describe('MCF Gate C real GitHub provider proof', () => {
  it('executes C1 and C2 through MissionRuntime -> PermissionEngine -> Dispatcher -> Ledger -> real adapters', async () => {
    if (!enabled) return;

    const headSha = requiredEnv('MCF_GATE_C_HEAD_SHA').toLowerCase();
    const baseSha = requiredEnv('MCF_GATE_C_BASE_SHA').toLowerCase();
    const authSource = process.env.MCF_GATE_C_AUTH_SOURCE?.trim() || 'UNKNOWN';
    expect(headSha).toMatch(shaPattern);
    expect(baseSha).toMatch(shaPattern);
    expect(requiredEnv('GITHUB_REPOSITORY').toLowerCase()).toBe(repository);
    requiredEnv('MCF_GITHUB_TOKEN');
    requiredEnv('GITHUB_TOKEN');

    const database = new DatabaseService();
    const evidence = new EvidenceValidator();
    const ledger = new CanonicalExternalActionLedger(database);
    const adapterRegistry = new AdapterRegistry([
      new GitHubBranchPullRequestAdapter(evidence),
      new GitHubPullCollaborationAdapter(evidence),
    ]);
    const dispatcher = new ExternalActionDispatcher(adapterRegistry, ledger);
    const registry = new SkillRegistryLoader();
    const executor = new SkillExecutor(registry, new PermissionEngine(), evidence, dispatcher);
    const postgres = new PostgresMcfRuntimeRepository(database);
    const runtimeRepository = new OrderedMcfRuntimeRepository(database, postgres);
    const runtime = new MissionRuntimeService(runtimeRepository, executor, registry, evidence);

    const c1Phase = randomUUID();
    const c1ReplayPhase = randomUUID();
    const c2Phase = randomUUID();
    const c2ReplayPhase = randomUUID();
    const branchRef = `mcf/gate-c-proof-${headSha.slice(0, 12)}`;
    const c1Key = `gate-c-c1-${headSha.slice(0, 24)}`;
    const c2Key = `gate-c-c2-${headSha.slice(0, 24)}`;

    const mission = await runtime.createMission({ contract: proofContract() });
    const missionId = mission.id;

    try {
      const c1Inputs = {
        authorizedScope: true,
        repository,
        branch: branchRef,
        acceptance_state: 'GATE_C_CONTROLLED_PROOF',
        base_branch: 'main',
        base_sha: baseSha,
        commit_sha: headSha,
        branch_ref: branchRef,
        idempotency_key: c1Key,
        change_summary: 'MCF Gate C real provider write proof',
        risk_summary: 'Reversible branch and PR only; production remains blocked.',
      };
      const c1Tool = {
        provider: 'github',
        operation: 'create-branch-pr',
        resource: repository,
      };

      const c1 = await runtime.executePhase(missionId, {
        phaseId: c1Phase,
        skillId: 'MCF-GIT-PR-RELEASE',
        agentId: 'Gabriel',
        expectedMissionVersion: mission.version,
        inputs: c1Inputs,
        tool: c1Tool,
      });

      if (c1.evidenceStatus !== 'VALID') {
        await persistProofArtifact({
          stage: 'C1_DIAGNOSTIC',
          missionId,
          repository,
          baseSha,
          headSha,
          branchRef,
          authSource,
          c1,
          timeline: await runtime.timeline(missionId),
          production: 'BLOCKED',
        });
        throw new Error(`C1 real-provider proof did not reach VALID: ${c1.evidenceStatus}`);
      }

      expect(c1.phaseState).toBe('COMPLETED');
      expect(c1.receipt?.status).toBe('SUCCEEDED');
      expect(c1.receipt?.metadata.readBackVerified).toBe(true);
      expect(c1.receipt?.commitSha).toBe(headSha);
      expect(c1.mission.version).toBe(mission.version + 1);
      const pullNumber = Number(c1.receipt?.metadata.pullRequestNumber);
      expect(Number.isInteger(pullNumber) && pullNumber > 0).toBe(true);

      const c1Replay = await runtime.executePhase(missionId, {
        phaseId: c1ReplayPhase,
        skillId: 'MCF-GIT-PR-RELEASE',
        agentId: 'Gabriel',
        expectedMissionVersion: c1.mission.version,
        inputs: c1Inputs,
        tool: c1Tool,
      });

      expect(c1Replay.evidenceStatus).toBe('VALID');
      expect(c1Replay.phaseState).toBe('COMPLETED');
      expect(c1Replay.receipt?.externalId).toBe(c1.receipt?.externalId);
      expect(c1Replay.receipt?.metadata.pullRequestNumber).toBe(pullNumber);
      expect(c1Replay.receipt?.metadata.readBackVerified).toBe(true);
      expect(await countProofPullRequests(branchRef, headSha, c1Key)).toBe(1);

      const c2Inputs = {
        authorizedScope: true,
        repository,
        branch: branchRef,
        acceptance_state: 'GATE_C_CONTROLLED_PROOF',
        pull_request_number: pullNumber,
        expected_head_sha: headSha,
        idempotency_key: c2Key,
        comment_body:
          'MCF Gate C controlled real-provider proof: C2 comment write executed by the governed runtime path. Production remains blocked.',
      };
      const c2Tool = {
        provider: 'github',
        operation: 'comment-pr',
        resource: repository,
      };

      const c2 = await runtime.executePhase(missionId, {
        phaseId: c2Phase,
        skillId: 'MCF-GIT-PR-RELEASE',
        agentId: 'Gabriel',
        expectedMissionVersion: c1Replay.mission.version,
        inputs: c2Inputs,
        tool: c2Tool,
      });

      if (c2.evidenceStatus !== 'VALID') {
        await persistProofArtifact({
          stage: 'C2_DIAGNOSTIC',
          missionId,
          repository,
          baseSha,
          headSha,
          branchRef,
          pullRequestNumber: pullNumber,
          authSource,
          c1,
          c1Replay,
          c2,
          timeline: await runtime.timeline(missionId),
          production: 'BLOCKED',
        });
        throw new Error(`C2 real-provider proof did not reach VALID: ${c2.evidenceStatus}`);
      }

      expect(c2.phaseState).toBe('COMPLETED');
      expect(c2.receipt?.status).toBe('SUCCEEDED');
      expect(c2.receipt?.metadata.readBackVerified).toBe(true);
      expect(c2.receipt?.commitSha).toBe(headSha);

      const c2Replay = await executor.execute({
        skillId: 'MCF-GIT-PR-RELEASE',
        agentId: 'Gabriel',
        inputs: c2Inputs,
        tool: c2Tool,
        executionContext: {
          missionId,
          phaseId: c2ReplayPhase,
          expectedMissionVersion: c2.mission.version,
        },
      });

      expect(c2Replay.evidenceStatus).toBe('INVALID');
      expect(c2Replay.externalAction?.status).toBe('FAILED');
      expect(c2Replay.externalAction?.failureCode).toBe('RESERVATION_CONFLICT');
      expect(c2Replay.externalAction?.attemptId).toBeNull();
      expect(await countProofComments(pullNumber, c2Key)).toBe(1);

      const attempts = await database.query<{
        attemptId: string;
        adapterId: string;
        operation: string;
        status: string;
        idempotencyKey: string | null;
        receiptId: string | null;
      }>(
        `select
          "attempt_id" as "attemptId",
          "adapter_id" as "adapterId",
          "operation",
          "status",
          "idempotency_key" as "idempotencyKey",
          "receipt_id" as "receiptId"
        from "mcf_external_action_attempts"
        where "mission_id" = $1
        order by "created_at" asc`,
        [missionId],
      );

      expect(attempts.rows).toHaveLength(3);
      expect(attempts.rows.every((attempt) => attempt.status === 'EVIDENCE_VALIDATED')).toBe(true);
      expect(
        attempts.rows.filter((attempt) => attempt.adapterId === 'github-branch-pr-write-v1'),
      ).toHaveLength(2);
      expect(
        attempts.rows.filter((attempt) => attempt.adapterId === 'github-pr-collaboration-write-v1'),
      ).toHaveLength(1);
      expect(attempts.rows.every((attempt) => typeof attempt.receiptId === 'string')).toBe(true);

      const receipts = await database.query<{ count: string }>(
        'select count(*)::text as "count" from "mcf_tool_receipts" where "mission_id" = $1',
        [missionId],
      );
      expect(Number(receipts.rows[0]?.count ?? 0)).toBe(3);

      const persistedMission = await runtime.getMission(missionId);
      expect(persistedMission.version).toBe(c2.mission.version);
      expect(persistedMission.state).toBe('EXECUTING');

      await persistProofArtifact({
        stage: 'COMPLETE',
        missionId,
        repository,
        baseSha,
        headSha,
        branchRef,
        pullRequestNumber: pullNumber,
        pullRequestUrl: c1.receipt?.metadata.pullRequestUrl ?? null,
        authSource,
        runtimeLifecycle: {
          createdVersion: mission.version,
          c1Version: c1.mission.version,
          c1ReplayVersion: c1Replay.mission.version,
          c2Version: c2.mission.version,
          persistedVersion: persistedMission.version,
        },
        c1: {
          adapterId: c1.receipt?.metadata.adapterId ?? null,
          attemptId: attempts.rows[0]?.attemptId ?? null,
          receiptId: c1.receipt?.receiptId ?? null,
          externalId: c1.receipt?.externalId ?? null,
          readBackVerified: c1.receipt?.metadata.readBackVerified ?? null,
          replayAttemptId: attempts.rows[1]?.attemptId ?? null,
          replayReceiptId: c1Replay.receipt?.receiptId ?? null,
          replayExternalId: c1Replay.receipt?.externalId ?? null,
          replayReadBackVerified: c1Replay.receipt?.metadata.readBackVerified ?? null,
          replayDidNotDuplicatePullRequest: c1Replay.receipt?.externalId === c1.receipt?.externalId,
          proofPullRequestCount: 1,
        },
        c2: {
          adapterId: c2.receipt?.metadata.adapterId ?? null,
          attemptId: attempts.rows[2]?.attemptId ?? null,
          receiptId: c2.receipt?.receiptId ?? null,
          mutationExternalId: c2.receipt?.metadata.mutationExternalId ?? null,
          mutationUrl: c2.receipt?.metadata.mutationUrl ?? null,
          readBackVerified: c2.receipt?.metadata.readBackVerified ?? null,
          duplicateReplayStatus: c2Replay.externalAction?.status ?? null,
          duplicateReplayFailure: c2Replay.externalAction?.failureCode ?? null,
          duplicateReplayAttemptId: c2Replay.externalAction?.attemptId ?? null,
          proofCommentCount: 1,
        },
        ledger: {
          attempts: attempts.rows,
          receiptCount: Number(receipts.rows[0]?.count ?? 0),
        },
        production: 'BLOCKED',
      });
    } finally {
      await database.onModuleDestroy();
    }
  });
});
