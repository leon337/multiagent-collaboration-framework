from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    (ROOT / path).write_text(content, encoding="utf-8")


def replace_once(path: str, old: str, new: str) -> None:
    content = read(path)
    count = content.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one occurrence, found {count}: {old[:80]!r}")
    write(path, content.replace(old, new, 1))


MIGRATION = "apps/rede-social-agentes/packages/database/migrations/0017_mcf_external_action_ledger.sql"
migration = read(MIGRATION)
addition = '''

alter table "mcf_missions"
  add column if not exists "active_external_attempt_id" text;

create unique index if not exists "mcf_missions_active_external_attempt_idx"
  on "mcf_missions" ("active_external_attempt_id")
  where "active_external_attempt_id" is not null;
'''
if "active_external_attempt_id" not in migration:
    write(MIGRATION, migration.rstrip() + addition)

LEDGER = "apps/rede-social-agentes/apps/server/src/mcf-runtime/external-action-ledger.ts"
replace_once(
    LEDGER,
    '''interface MissionVersionRow {
  version: number;
}
''',
    '''interface MissionVersionRow {
  version: number;
  activeExternalAttemptId: string | null;
}
''',
)
replace_once(
    LEDGER,
    '''        const mission = await client.query<MissionVersionRow>(
          `select "version"
           from "mcf_missions"
           where "id" = $1
           for update`,
          [request.context?.missionId],
        );
        const persistedVersion = mission.rows[0]?.version;
        if (persistedVersion === undefined) {
          throw new ExternalActionAdapterError(
            'TARGET_NOT_FOUND',
            `Mission ${request.context?.missionId ?? 'unknown'} was not found for external action`,
            false,
          );
        }
        if (persistedVersion !== request.context?.expectedMissionVersion) {
          throw new ExternalActionAdapterError(
            'RESERVATION_CONFLICT',
            `Mission version conflict: expected ${request.context?.expectedMissionVersion}, actual ${persistedVersion}`,
            true,
          );
        }

        await client.query(
''',
    '''        const mission = await client.query<MissionVersionRow>(
          `select
             "version",
             "active_external_attempt_id" as "activeExternalAttemptId"
           from "mcf_missions"
           where "id" = $1
           for update`,
          [request.context?.missionId],
        );
        const persistedMission = mission.rows[0];
        if (!persistedMission) {
          throw new ExternalActionAdapterError(
            'TARGET_NOT_FOUND',
            `Mission ${request.context?.missionId ?? 'unknown'} was not found for external action`,
            false,
          );
        }
        if (persistedMission.version !== request.context?.expectedMissionVersion) {
          throw new ExternalActionAdapterError(
            'RESERVATION_CONFLICT',
            `Mission version conflict: expected ${request.context?.expectedMissionVersion}, actual ${persistedMission.version}`,
            true,
          );
        }
        if (persistedMission.activeExternalAttemptId) {
          throw new ExternalActionAdapterError(
            'RESERVATION_CONFLICT',
            `Mission ${request.context.missionId} already has active external attempt ${persistedMission.activeExternalAttemptId}`,
            true,
          );
        }

        const reservedMission = await client.query<{ id: string }>(
          `update "mcf_missions"
           set "active_external_attempt_id" = $1
           where "id" = $2
             and "version" = $3
             and "active_external_attempt_id" is null
           returning "id"`,
          [
            attemptId,
            request.context.missionId,
            request.context.expectedMissionVersion,
          ],
        );
        if (!reservedMission.rows[0]) {
          throw new ExternalActionAdapterError(
            'RESERVATION_CONFLICT',
            `Mission ${request.context.missionId} changed while reserving external execution`,
            true,
          );
        }

        await client.query(
''',
)

REPOSITORY = "apps/rede-social-agentes/apps/server/src/mcf-runtime/mcf-runtime.repository.ts"
replace_once(
    REPOSITORY,
    '''  expectedMissionVersion: number;
  phase: McfPhaseRecord;
''',
    '''  expectedMissionVersion: number;
  externalAttemptId?: string | null;
  phase: McfPhaseRecord;
''',
)

SERVICE = "apps/rede-social-agentes/apps/server/src/mcf-runtime/mission-runtime.service.ts"
replace_once(
    SERVICE,
    '''      missionId,
      expectedMissionVersion: request.expectedMissionVersion,
      phase,
''',
    '''      missionId,
      expectedMissionVersion: request.expectedMissionVersion,
      externalAttemptId: outcome.externalAction?.attemptId ?? null,
      phase,
''',
)

POSTGRES = "apps/rede-social-agentes/apps/server/src/mcf-runtime/postgres-mcf-runtime.repository.ts"
replace_once(
    POSTGRES,
    '''         set "state" = $1,
             "current_phase_id" = $2,
             "current_agent_id" = $3,
             "version" = "version" + 1,
             "updated_at" = $4
         where "id" = $5 and "version" = $6
         returning ${missionColumns}`,
        [
          input.missionState,
          input.phase.id,
          input.nextAgentId,
          input.phase.updatedAt,
          input.missionId,
          input.expectedMissionVersion,
        ],
''',
    '''         set "state" = $1,
             "current_phase_id" = $2,
             "current_agent_id" = $3,
             "version" = "version" + 1,
             "active_external_attempt_id" = null,
             "updated_at" = $4
         where "id" = $5
           and "version" = $6
           and (
             ($7::text is null and "active_external_attempt_id" is null)
             or (
               "active_external_attempt_id" = $7
               and exists (
                 select 1
                 from "mcf_external_action_attempts" as "attempt"
                 where "attempt"."attempt_id" = $7
                   and "attempt"."mission_id" = "mcf_missions"."id"
                   and "attempt"."phase_id" = $2
                   and "attempt"."status" in (
                     'FAILED',
                     'EVIDENCE_VALIDATED',
                     'EVIDENCE_REJECTED'
                   )
               )
             )
           )
         returning ${missionColumns}`,
        [
          input.missionState,
          input.phase.id,
          input.nextAgentId,
          input.phase.updatedAt,
          input.missionId,
          input.expectedMissionVersion,
          input.externalAttemptId ?? null,
        ],
''',
)
replace_once(
    POSTGRES,
    '''         where "id" = $3
         returning ${missionColumns}`,
        [input.missionState, input.nextAgentId, input.missionId],
      );

      for (const event of input.events) {
''',
    '''         where "id" = $3
           and "active_external_attempt_id" is null
         returning ${missionColumns}`,
        [input.missionState, input.nextAgentId, input.missionId],
      );
      if (!updatedMission.rows[0]) {
        throw new McfMissionVersionConflictError(
          input.missionId,
          lockedMission.rows[0].version,
        );
      }

      for (const event of input.events) {
''',
)

PERMISSIONS = "apps/rede-social-agentes/apps/server/src/mcf-runtime/permission-engine.ts"
replace_once(
    PERMISSIONS,
    '''function normalize(value: string): string {
  return fold(value).trim().toLowerCase().replaceAll('_', '-').replaceAll(' ', '-');
}

function normalizeProvider(value: string): string {
  const normalized = normalize(value);
  return normalized === 'github-actions' ? 'github' : normalized;
}
''',
    '''export function canonicalizeToolValue(value: string): string {
  return fold(value).trim().toLowerCase().replaceAll('_', '-').replaceAll(' ', '-');
}

export function canonicalizeProvider(value: string): string {
  const normalized = canonicalizeToolValue(value);
  return normalized === 'github-actions' ? 'github' : normalized;
}
''',
)
permissions = read(PERMISSIONS)
permissions = permissions.replace(
    "const normalized = normalize(operation);",
    "const normalized = canonicalizeToolValue(operation);",
)
permissions = permissions.replace(
    "const normalized = normalize(value);",
    "const normalized = canonicalizeToolValue(value);",
)
permissions = permissions.replace(
    "const provider = normalizeProvider(tool.provider);",
    "const provider = canonicalizeProvider(tool.provider);",
)
permissions = permissions.replace(
    "skill.allowedTools.map(normalizeProvider)",
    "skill.allowedTools.map(canonicalizeProvider)",
)
permissions = permissions.replace(
    "skill.forbiddenTools.map(normalize)",
    "skill.forbiddenTools.map(canonicalizeToolValue)",
)
permissions = permissions.replace(
    "const operation = normalize(tool.operation);",
    "const operation = canonicalizeToolValue(tool.operation);",
)
permissions = permissions.replace(
    "const resource = normalize(tool.resource);",
    "const resource = canonicalizeToolValue(tool.resource);",
)
if "normalize(" in permissions or "normalizeProvider" in permissions:
    raise RuntimeError("permission-engine.ts still contains legacy normalization references")
write(PERMISSIONS, permissions)

ADAPTER = "apps/rede-social-agentes/apps/server/src/mcf-runtime/github-code-review.adapter.ts"
replace_once(
    ADAPTER,
    '''} from './external-action.contracts.js';

interface GitHubPullResponse {
''',
    '''} from './external-action.contracts.js';
import { canonicalizeProvider, canonicalizeToolValue } from './permission-engine.js';

interface GitHubPullResponse {
''',
)
replace_once(
    ADAPTER,
    '''function normalizeProvider(value: string): string {
  return value.trim().toLowerCase().replaceAll('_', '-').replaceAll(' ', '-');
}

''',
    '',
)
replace_once(
    ADAPTER,
    '''      normalizeProvider(request.tool.provider) === 'github' &&
      normalizeProvider(request.tool.operation) === 'inspect-code'
''',
    '''      canonicalizeProvider(request.tool.provider) === 'github' &&
      canonicalizeToolValue(request.tool.operation) === 'inspect-code'
''',
)
replace_once(
    ADAPTER,
    '''        changedFiles.push(...batch);
        if (batch.length < 100) break;
        if (page === 10) {
''',
    '''        changedFiles.push(...batch);
        const observedPull = await this.client.getJson<GitHubPullResponse>(
          `/repos/${target.repository}/pulls/${pullNumber}`,
        );
        if (observedPull.head?.sha !== pull.head?.sha) {
          throw new ExternalActionAdapterError(
            'RESERVATION_CONFLICT',
            'GitHub pull request head changed during review collection',
            true,
          );
        }
        if (batch.length < 100) break;
        if (page === 10) {
''',
)
replace_once(
    ADAPTER,
    '''      provider: request.tool.provider,
      operation: request.tool.operation,
''',
    '''      provider: canonicalizeProvider(request.tool.provider),
      operation: canonicalizeToolValue(request.tool.operation),
''',
)

EVIDENCE = "apps/rede-social-agentes/apps/server/src/mcf-runtime/evidence-validator.ts"
replace_once(
    EVIDENCE,
    "import type { McfToolRequest } from './permission-engine.js';\n",
    "import {\n  canonicalizeProvider,\n  canonicalizeToolValue,\n  type McfToolRequest,\n} from './permission-engine.js';\n",
)
evidence = read(EVIDENCE)
evidence = evidence.replace(
    "if (receipt.provider !== 'github' || !receipt.commitSha) {",
    "if (canonicalizeProvider(receipt.provider) !== 'github' || !receipt.commitSha) {",
    1,
)
evidence = evidence.replace(
    "if (receipt.provider !== 'github' || !receipt.externalId || !receipt.commitSha) {",
    "if (\n    canonicalizeProvider(receipt.provider) !== 'github' ||\n    !receipt.externalId ||\n    !receipt.commitSha\n  ) {",
    1,
)
old_verify = '''    if (
      receipt.provider !== expected.provider ||
      receipt.operation !== expected.operation ||
      receipt.resource !== expected.resource
    ) {
'''
new_verify = '''    if (
      canonicalizeProvider(receipt.provider) !== canonicalizeProvider(expected.provider) ||
      canonicalizeToolValue(receipt.operation) !==
        canonicalizeToolValue(expected.operation) ||
      receipt.resource !== expected.resource
    ) {
'''
if evidence.count(old_verify) != 1:
    raise RuntimeError("evidence-validator.ts verify comparison not found exactly once")
evidence = evidence.replace(old_verify, new_verify, 1)
write(EVIDENCE, evidence)

ADAPTER_TEST = "apps/rede-social-agentes/apps/server/src/mcf-runtime/github-code-review.adapter.test.ts"
adapter_test = read(ADAPTER_TEST)
if adapter_test.count("expect(fetcher).toHaveBeenCalledTimes(2);") != 1:
    raise RuntimeError("adapter first call count assertion not found")
adapter_test = adapter_test.replace(
    "expect(fetcher).toHaveBeenCalledTimes(2);",
    "expect(fetcher).toHaveBeenCalledTimes(3);",
    1,
)
if adapter_test.count("expect(fetcher).toHaveBeenCalledTimes(11);") != 1:
    raise RuntimeError("adapter pagination call count assertion not found")
adapter_test = adapter_test.replace(
    "expect(fetcher).toHaveBeenCalledTimes(11);",
    "expect(fetcher).toHaveBeenCalledTimes(21);",
    1,
)
extra_adapter_tests = r'''

  it('rejects a pull request when its head changes during paginated collection', async () => {
    const initialSha = 'a'.repeat(40);
    const changedSha = 'b'.repeat(40);
    let metadataCalls = 0;
    const fetcher = vi.fn(async (url: string) => {
      if (url.endsWith('/pulls/70')) {
        metadataCalls += 1;
        return new Response(
          JSON.stringify({
            number: 70,
            html_url: 'https://github.com/leon337/multiagent-collaboration-framework/pull/70',
            head: { sha: metadataCalls === 1 ? initialSha : changedSha },
          }),
          { status: 200 },
        );
      }
      if (url.includes('/pulls/70/files')) {
        return new Response(
          JSON.stringify([
            {
              filename: 'src/runtime.ts',
              status: 'modified',
              additions: 1,
              deletions: 0,
              changes: 1,
              patch: '@@ -1,1 +1,2 @@\n export const safe = true;\n+export const ready = true;',
            },
          ]),
          { status: 200 },
        );
      }
      return new Response('{}', { status: 404 });
    });
    const adapter = new GitHubCodeReviewAdapter(
      new EvidenceValidator(),
      new GitHubReadClient(fetcher, undefined),
    );

    await expect(
      adapter.execute({
        skill,
        agentId: 'Vinicius',
        inputs: {
          repository: 'leon337/multiagent-collaboration-framework',
          diff_or_commit: 'PR #70',
        },
        tool: {
          provider: 'github',
          operation: 'inspect-code',
          resource: 'leon337/multiagent-collaboration-framework',
        },
      }),
    ).rejects.toMatchObject({ code: 'RESERVATION_CONFLICT', retryable: true });
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it('canonicalizes accepted provider and operation aliases in signed evidence', async () => {
    const commitSha = 'c'.repeat(40);
    const fetcher = vi.fn(async (url: string) => {
      if (url.endsWith('/pulls/70')) {
        return new Response(
          JSON.stringify({
            number: 70,
            html_url: 'https://github.com/leon337/multiagent-collaboration-framework/pull/70',
            head: { sha: commitSha },
          }),
          { status: 200 },
        );
      }
      if (url.includes('/pulls/70/files')) {
        return new Response(
          JSON.stringify([
            {
              filename: 'src/runtime.ts',
              status: 'modified',
              additions: 1,
              deletions: 0,
              changes: 1,
              patch: '@@ -1,1 +1,2 @@\n export const safe = true;\n+export const ready = true;',
            },
          ]),
          { status: 200 },
        );
      }
      return new Response('{}', { status: 404 });
    });
    const evidence = new EvidenceValidator();
    const adapter = new GitHubCodeReviewAdapter(
      evidence,
      new GitHubReadClient(fetcher, undefined),
    );
    const request = {
      skill,
      agentId: 'Vinicius',
      inputs: {
        repository: 'leon337/multiagent-collaboration-framework',
        diff_or_commit: 'PR #70',
      },
      tool: {
        provider: ' GitHub ',
        operation: ' INSPECT_CODE ',
        resource: 'leon337/multiagent-collaboration-framework',
      },
    };

    expect(adapter.supports(request)).toBe(true);
    const receipt = await adapter.execute(request);
    evidence.verifyForSkill(receipt, request.tool, skill);
    expect(receipt).toMatchObject({
      provider: 'github',
      operation: 'inspect-code',
      commitSha,
    });
  });
'''
if not adapter_test.endswith("});\n"):
    raise RuntimeError("adapter test file has unexpected ending")
adapter_test = adapter_test[:-4] + extra_adapter_tests + "});\n"
write(ADAPTER_TEST, adapter_test)

RESERVATION_TEST = "apps/rede-social-agentes/apps/server/src/mcf-runtime/external-action-reservation.integration.test.ts"
write(
    RESERVATION_TEST,
    r'''import { randomUUID } from 'node:crypto';

import type { McfSkillDefinition } from '@rsa/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DatabaseService } from '../database.service.js';
import { ExternalActionLedger } from './external-action-ledger.js';
import { PostgresMcfRuntimeRepository } from './postgres-mcf-runtime.repository.js';

interface ReservationRow {
  activeExternalAttemptId: string | null;
  version: number;
}

const skill: McfSkillDefinition = {
  skillId: 'MCF-REVIEW-CODE',
  name: 'Revisar código',
  version: '1.0.0',
  purpose: 'Revisar código sem alteração persistente.',
  ownerAgents: ['Vinicius'],
  requiredInputs: ['diff_or_commit'],
  allowedTools: ['GitHub'],
  forbiddenTools: ['merge_without_gate'],
  permissionProfile: 'READ_AND_PROPOSE',
  executionSteps: ['inspecionar_diff', 'classificar_achados'],
  requiredEvidence: ['file_and_line_references', 'severity', 'recommendation'],
  acceptanceCriteria: ['findings_actionable'],
  failureModes: ['missing_context'],
  fallback: 'Limitar o veredito.',
  handoffTo: 'Rafael',
};

describe('MCF external action mission reservation', () => {
  let database: DatabaseService;
  let ledger: ExternalActionLedger;
  let repository: PostgresMcfRuntimeRepository;

  beforeAll(() => {
    database = new DatabaseService();
    ledger = new ExternalActionLedger(database);
    repository = new PostgresMcfRuntimeRepository(database);
  });

  afterAll(async () => {
    await database.onModuleDestroy();
  });

  it('blocks concurrent mission persistence and releases only for the terminal owning attempt', async () => {
    const missionId = randomUUID();
    const externalPhaseId = randomUUID();
    const concurrentPhaseId = randomUUID();
    const createdAt = new Date();

    try {
      await database.query(
        `insert into "mcf_missions" (
          "id", "contract", "state", "current_phase_id", "current_agent_id",
          "version", "created_at", "updated_at"
        ) values ($1, $2::jsonb, 'EXECUTING', null, 'Vinicius', 1, $3, $3)`,
        [
          missionId,
          JSON.stringify({
            title: 'External reservation ownership',
            objective: 'Prevent concurrent mission advancement during provider execution.',
            expectedOutcome: 'Only the terminal owning attempt may persist and release.',
            scope: ['runtime reservation'],
            outOfScope: ['external write'],
            acceptanceCriteria: ['concurrent persistence blocked'],
            riskClass: 'A',
            selectedAgents: ['Vinicius', 'Rafael'],
            selectedSkills: ['MCF-REVIEW-CODE'],
            sourceOfTruth: ['MCF-RUNTIME-006-A1'],
          }),
          createdAt,
        ],
      );

      const attemptId = await ledger.reserve(
        {
          skill,
          agentId: 'Vinicius',
          inputs: { diff_or_commit: 'PR #71' },
          tool: {
            provider: 'github',
            operation: 'inspect-code',
            resource: 'leon337/multiagent-collaboration-framework',
          },
          context: {
            missionId,
            phaseId: externalPhaseId,
            expectedMissionVersion: 1,
          },
        },
        'github-code-review-read-only-v1',
      );

      const phase = (id: string, state: 'COMPLETED' | 'RECOVERING') => ({
        id,
        missionId,
        skillId: skill.skillId,
        agentId: 'Vinicius',
        state,
        cycle: 1,
        inputs: { diff_or_commit: 'PR #71' },
        expectedEvidence: skill.requiredEvidence,
        startedAt: createdAt,
        completedAt: state === 'COMPLETED' ? createdAt : null,
        createdAt,
        updatedAt: createdAt,
      });

      await expect(
        repository.persistExecution({
          missionId,
          expectedMissionVersion: 1,
          externalAttemptId: null,
          phase: phase(concurrentPhaseId, 'COMPLETED'),
          permissionProfile: 'READ_AND_PROPOSE',
          missionState: 'EXECUTING',
          nextAgentId: null,
          receipt: null,
          evidenceStatus: 'PENDING',
          handoff: null,
          events: [],
        }),
      ).rejects.toMatchObject({ name: 'McfMissionVersionConflictError' });

      const active = await database.query<ReservationRow>(
        `select
           "active_external_attempt_id" as "activeExternalAttemptId",
           "version"
         from "mcf_missions"
         where "id" = $1`,
        [missionId],
      );
      expect(active.rows[0]).toEqual({
        activeExternalAttemptId: attemptId,
        version: 1,
      });

      await ledger.recordFailed(attemptId, {
        code: 'ADAPTER_FAILURE',
        message: 'controlled terminal failure',
        retryable: false,
        statusCode: null,
      });

      const persisted = await repository.persistExecution({
        missionId,
        expectedMissionVersion: 1,
        externalAttemptId: attemptId,
        phase: phase(externalPhaseId, 'RECOVERING'),
        permissionProfile: 'READ_AND_PROPOSE',
        missionState: 'RECOVERING',
        nextAgentId: null,
        receipt: null,
        evidenceStatus: 'INVALID',
        handoff: null,
        events: [],
      });
      expect(persisted.mission.version).toBe(2);

      const released = await database.query<ReservationRow>(
        `select
           "active_external_attempt_id" as "activeExternalAttemptId",
           "version"
         from "mcf_missions"
         where "id" = $1`,
        [missionId],
      );
      expect(released.rows[0]).toEqual({
        activeExternalAttemptId: null,
        version: 2,
      });
    } finally {
      await database.query('delete from "mcf_tool_receipts" where "mission_id" = $1', [
        missionId,
      ]);
      await database.query('delete from "mcf_handoffs" where "mission_id" = $1', [missionId]);
      await database.query('delete from "mcf_phases" where "mission_id" = $1', [missionId]);
      await database.query(
        'delete from "mcf_external_action_attempts" where "mission_id" = $1',
        [missionId],
      );
      await database.query('delete from "mcf_events" where "mission_id" = $1', [missionId]);
      await database.query('delete from "mcf_missions" where "id" = $1', [missionId]);
    }
  });
});
''',
)
