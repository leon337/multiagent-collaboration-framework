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
import { PermissionEngine } from './permission-engine.js';
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
  return JSON.stringify({
    title: 'MCF-RUNTIME-006 Gate C real provider write proof',
    objective: 'Prove governed reversible GitHub writes through the MCF Runtime provider path.',
    expectedOutcome: 'C1 and C2 real writes verified with receipts, ledger and idempotency.',
    scope: ['controlled reversible GitHub branch/PR write', 'controlled PR comment'],
    outOfScope: ['production', 'direct main write', 'merge', 'destructive action'],
    acceptanceCriteria: [
      'C1 real provider write read-back verified',
      'C1 replay does not duplicate PR',
      'C2 real provider write read-back verified',
      'C2 durable idempotency prevents duplicate comment',
      'receipts and ledger evidence validated',
    ],
    riskClass: 'C',
    selectedAgents: ['Mestre', 'Gabriel', 'Renato', 'Emily', 'Leo'],
    selectedSkills: ['MCF-GIT-PR-RELEASE'],
    sourceOfTruth: ['GitHub', 'Issue #111'],
  });
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

function safeExecutionDiagnostic(execution: Awaited<ReturnType<SkillExecutor['execute']>>) {
  return {
    evidenceStatus: execution.evidenceStatus,
    phaseState: execution.phaseState,
    missionState: execution.missionState,
    rejectionReason: execution.rejectionReason,
    externalAction: execution.externalAction,
    receipt: execution.receipt
      ? {
          receiptId: execution.receipt.receiptId,
          provider: execution.receipt.provider,
          operation: execution.receipt.operation,
          resource: execution.receipt.resource,
          externalId: execution.receipt.externalId,
          commitSha: execution.receipt.commitSha,
          status: execution.receipt.status,
          metadata: {
            adapterId: execution.receipt.metadata.adapterId ?? null,
            resultStatus: execution.receipt.metadata.resultStatus ?? null,
            readBackVerified: execution.receipt.metadata.readBackVerified ?? null,
            unknownStage: execution.receipt.metadata.unknownStage ?? null,
            branchRef: execution.receipt.metadata.branchRef ?? null,
            branchSha: execution.receipt.metadata.branchSha ?? null,
            pullRequestNumber: execution.receipt.metadata.pullRequestNumber ?? null,
            mutationExternalId: execution.receipt.metadata.mutationExternalId ?? null,
          },
        }
      : null,
  };
}

describe('MCF Gate C real GitHub provider proof', () => {
  it('executes C1 and C2 through PermissionEngine -> Dispatcher -> Ledger -> real adapters', async () => {
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
    const executor = new SkillExecutor(
      new SkillRegistryLoader(),
      new PermissionEngine(),
      evidence,
      dispatcher,
    );

    const missionId = randomUUID();
    const c1Phase = randomUUID();
    const c1ReplayPhase = randomUUID();
    const c2Phase = randomUUID();
    const c2ReplayPhase = randomUUID();
    const branchRef = `mcf/gate-c-proof-${headSha.slice(0, 12)}`;
    const c1Key = `gate-c-c1-${headSha.slice(0, 24)}`;
    const c2Key = `gate-c-c2-${headSha.slice(0, 24)}`;
    const now = new Date();

    try {
      await database.query(
        `insert into "mcf_missions" (
          "id", "contract", "state", "current_phase_id", "current_agent_id",
          "version", "created_at", "updated_at"
        ) values ($1, $2::jsonb, 'EXECUTING', null, 'Gabriel', 1, $3, $3)`,
        [missionId, proofContract(), now],
      );

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

      const c1 = await executor.execute({
        skillId: 'MCF-GIT-PR-RELEASE',
        agentId: 'Gabriel',
        inputs: c1Inputs,
        tool: c1Tool,
        executionContext: { missionId, phaseId: c1Phase, expectedMissionVersion: 1 },
      });

      if (c1.evidenceStatus !== 'VALID') {
        const diagnostic = safeExecutionDiagnostic(c1);
        await persistProofArtifact({
          stage: 'C1_DIAGNOSTIC',
          missionId,
          repository,
          baseSha,
          headSha,
          branchRef,
          authSource,
          c1: diagnostic,
          production: 'BLOCKED',
        });
        console.error(`MCF_GATE_C_C1_DIAGNOSTIC ${JSON.stringify(diagnostic)}`);
        throw new Error(`C1 real-provider proof did not reach VALID: ${c1.evidenceStatus}`);
      }

      expect(c1.externalAction?.status).toBe('EXECUTED');
      expect(c1.receipt?.status).toBe('SUCCEEDED');
      expect(c1.receipt?.metadata.readBackVerified).toBe(true);
      expect(c1.receipt?.commitSha).toBe(headSha);
      const pullNumber = Number(c1.receipt?.metadata.pullRequestNumber);
      expect(Number.isInteger(pullNumber) && pullNumber > 0).toBe(true);

      const c1Replay = await executor.execute({
        skillId: 'MCF-GIT-PR-RELEASE',
        agentId: 'Gabriel',
        inputs: c1Inputs,
        tool: c1Tool,
        executionContext: { missionId, phaseId: c1ReplayPhase, expectedMissionVersion: 1 },
      });

      expect(c1Replay.evidenceStatus).toBe('INVALID');
      expect(c1Replay.externalAction?.status).toBe('FAILED');
      expect(c1Replay.externalAction?.failureCode).toBe('RESERVATION_CONFLICT');
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

      const c2 = await executor.execute({
        skillId: 'MCF-GIT-PR-RELEASE',
        agentId: 'Gabriel',
        inputs: c2Inputs,
        tool: c2Tool,
        executionContext: { missionId, phaseId: c2Phase, expectedMissionVersion: 1 },
      });

      if (c2.evidenceStatus !== 'VALID') {
        const diagnostic = safeExecutionDiagnostic(c2);
        await persistProofArtifact({
          stage: 'C2_DIAGNOSTIC',
          missionId,
          repository,
          baseSha,
          headSha,
          branchRef,
          pullRequestNumber: pullNumber,
          authSource,
          c1: safeExecutionDiagnostic(c1),
          c2: diagnostic,
          production: 'BLOCKED',
        });
        console.error(`MCF_GATE_C_C2_DIAGNOSTIC ${JSON.stringify(diagnostic)}`);
        throw new Error(`C2 real-provider proof did not reach VALID: ${c2.evidenceStatus}`);
      }

      expect(c2.externalAction?.status).toBe('EXECUTED');
      expect(c2.receipt?.status).toBe('SUCCEEDED');
      expect(c2.receipt?.metadata.readBackVerified).toBe(true);
      expect(c2.receipt?.commitSha).toBe(headSha);

      const c2Replay = await executor.execute({
        skillId: 'MCF-GIT-PR-RELEASE',
        agentId: 'Gabriel',
        inputs: c2Inputs,
        tool: c2Tool,
        executionContext: { missionId, phaseId: c2ReplayPhase, expectedMissionVersion: 1 },
      });

      expect(c2Replay.evidenceStatus).toBe('INVALID');
      expect(c2Replay.externalAction?.status).toBe('FAILED');
      expect(c2Replay.externalAction?.failureCode).toBe('RESERVATION_CONFLICT');
      expect(await countProofComments(pullNumber, c2Key)).toBe(1);

      const attempts = await database.query<{
        adapterId: string;
        operation: string;
        status: string;
        idempotencyKey: string | null;
        receiptId: string | null;
      }>(
        `select
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

      expect(attempts.rows).toHaveLength(2);
      expect(attempts.rows.every((attempt) => attempt.status === 'EVIDENCE_VALIDATED')).toBe(true);
      expect(
        attempts.rows.filter((attempt) => attempt.adapterId === 'github-branch-pr-write-v1'),
      ).toHaveLength(1);
      expect(
        attempts.rows.filter((attempt) => attempt.adapterId === 'github-pr-collaboration-write-v1'),
      ).toHaveLength(1);
      expect(attempts.rows.every((attempt) => typeof attempt.receiptId === 'string')).toBe(true);

      const receipts = await database.query<{ count: string }>(
        'select count(*)::text as "count" from "mcf_tool_receipts" where "mission_id" = $1',
        [missionId],
      );
      expect(Number(receipts.rows[0]?.count ?? 0)).toBe(2);

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
        c1: {
          adapterId: c1.externalAction?.adapterId ?? null,
          attemptId: c1.externalAction?.attemptId ?? null,
          receiptId: c1.receipt?.receiptId ?? null,
          externalId: c1.receipt?.externalId ?? null,
          readBackVerified: c1.receipt?.metadata.readBackVerified ?? null,
          duplicateReplayStatus: c1Replay.externalAction?.status ?? null,
          duplicateReplayFailure: c1Replay.externalAction?.failureCode ?? null,
          proofPullRequestCount: 1,
        },
        c2: {
          adapterId: c2.externalAction?.adapterId ?? null,
          attemptId: c2.externalAction?.attemptId ?? null,
          receiptId: c2.receipt?.receiptId ?? null,
          mutationExternalId: c2.receipt?.metadata.mutationExternalId ?? null,
          mutationUrl: c2.receipt?.metadata.mutationUrl ?? null,
          readBackVerified: c2.receipt?.metadata.readBackVerified ?? null,
          duplicateReplayStatus: c2Replay.externalAction?.status ?? null,
          duplicateReplayFailure: c2Replay.externalAction?.failureCode ?? null,
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
