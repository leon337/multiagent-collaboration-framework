from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")


def replace_once(path: str, old: str, new: str) -> None:
    content = read(path)
    count = content.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one occurrence, found {count}: {old[:100]!r}")
    write(path, content.replace(old, new, 1))


RESERVATION = "apps/rede-social-agentes/apps/server/src/mcf-runtime/external-action-reservation.ts"
write(
    RESERVATION,
    '''import { randomUUID } from 'node:crypto';

import type { DatabaseTransaction } from '@rsa/database';

export const EXTERNAL_ACTION_LEASE_MS = 10 * 60_000;

interface MissionReservationRow {
  activeExternalAttemptId: string | null;
}

interface AttemptReservationRow {
  status: string;
  leaseExpiresAt: Date;
  phaseId: string;
  agentId: string;
}

export async function reconcileExpiredExternalReservation(
  client: DatabaseTransaction,
  missionId: string,
  now: Date = new Date(),
): Promise<string | null> {
  const mission = await client.query<MissionReservationRow>(
    `select "active_external_attempt_id" as "activeExternalAttemptId"
     from "mcf_missions"
     where "id" = $1
     for update`,
    [missionId],
  );
  const activeAttemptId = mission.rows[0]?.activeExternalAttemptId ?? null;
  if (!activeAttemptId) {
    return null;
  }

  const attemptResult = await client.query<AttemptReservationRow>(
    `select
       "status",
       "lease_expires_at" as "leaseExpiresAt",
       "phase_id" as "phaseId",
       "agent_id" as "agentId"
     from "mcf_external_action_attempts"
     where "attempt_id" = $1
     for update`,
    [activeAttemptId],
  );
  const attempt = attemptResult.rows[0];
  if (attempt && attempt.leaseExpiresAt.getTime() > now.getTime()) {
    return null;
  }

  if (attempt) {
    await client.query(
      `update "mcf_external_action_attempts"
       set "status" = 'ABANDONED',
           "failure_code" = 'RESERVATION_EXPIRED',
           "failure_message" = 'External action reservation lease expired before mission persistence',
           "updated_at" = $1
       where "attempt_id" = $2`,
      [now, activeAttemptId],
    );
  }

  await client.query(
    `insert into "mcf_events" (
      "id", "mission_id", "phase_id", "agent_id", "event_type", "payload",
      "idempotency_key", "occurred_at"
    ) values ($1, $2, $3, $4, 'EXTERNAL_ACTION_ABANDONED', $5::jsonb, $6, $7)
    on conflict ("idempotency_key") do nothing`,
    [
      randomUUID(),
      missionId,
      attempt?.phaseId ?? null,
      attempt?.agentId ?? null,
      JSON.stringify({
        attemptId: activeAttemptId,
        previousStatus: attempt?.status ?? 'MISSING',
        reason: attempt ? 'RESERVATION_EXPIRED' : 'MISSING_LEDGER_ATTEMPT',
      }),
      `external-action:${activeAttemptId}:abandoned`,
      now,
    ],
  );

  await client.query(
    `update "mcf_missions"
     set "active_external_attempt_id" = null
     where "id" = $1 and "active_external_attempt_id" = $2`,
    [missionId, activeAttemptId],
  );

  return activeAttemptId;
}
''',
)

MIGRATION = "apps/rede-social-agentes/packages/database/migrations/0018_mcf_external_action_reservation_lease.sql"
write(
    MIGRATION,
    '''alter table "mcf_external_action_attempts"
  add column if not exists "lease_expires_at" timestamptz;

update "mcf_external_action_attempts"
set "lease_expires_at" = coalesce("lease_expires_at", "updated_at" + interval '10 minutes')
where "lease_expires_at" is null;

alter table "mcf_external_action_attempts"
  alter column "lease_expires_at" set not null;

alter table "mcf_external_action_attempts"
  drop constraint if exists "mcf_external_action_attempts_status_check";

alter table "mcf_external_action_attempts"
  add constraint "mcf_external_action_attempts_status_check"
  check (
    "status" in (
      'ALLOWED',
      'EXECUTED',
      'FAILED',
      'EVIDENCE_VALIDATED',
      'EVIDENCE_REJECTED',
      'ABANDONED'
    )
  );

create index if not exists "mcf_external_action_attempts_lease_idx"
  on "mcf_external_action_attempts" ("lease_expires_at")
  where "status" in ('ALLOWED', 'EXECUTED', 'FAILED', 'EVIDENCE_VALIDATED', 'EVIDENCE_REJECTED');
''',
)

CONTRACTS = "apps/rede-social-agentes/packages/contracts/src/mcf-runtime.ts"
replace_once(
    CONTRACTS,
    "  | 'EXTERNAL_ACTION_EVIDENCE_VALIDATED'\n  | 'HANDOFF_CREATED'",
    "  | 'EXTERNAL_ACTION_EVIDENCE_VALIDATED'\n  | 'EXTERNAL_ACTION_ABANDONED'\n  | 'HANDOFF_CREATED'",
)

LEDGER = "apps/rede-social-agentes/apps/server/src/mcf-runtime/external-action-ledger.ts"
replace_once(
    LEDGER,
    "} from './external-action.contracts.js';\n",
    "} from './external-action.contracts.js';\nimport {\n  EXTERNAL_ACTION_LEASE_MS,\n  reconcileExpiredExternalReservation,\n} from './external-action-reservation.js';\n",
)
replace_once(
    LEDGER,
    "type ExternalAttemptStatus =\n  'ALLOWED' | 'EXECUTED' | 'FAILED' | 'EVIDENCE_VALIDATED' | 'EVIDENCE_REJECTED';",
    "type ExternalAttemptStatus =\n  | 'ALLOWED'\n  | 'EXECUTED'\n  | 'FAILED'\n  | 'EVIDENCE_VALIDATED'\n  | 'EVIDENCE_REJECTED'\n  | 'ABANDONED';",
)
replace_once(
    LEDGER,
    "  EVIDENCE_REJECTED: [],\n};",
    "  EVIDENCE_REJECTED: [],\n  ABANDONED: [],\n};",
)
replace_once(
    LEDGER,
    "    const occurredAt = new Date();\n\n    try {\n      await this.database.transaction(async (client) => {\n        const mission = await client.query<MissionVersionRow>(",
    "    const occurredAt = new Date();\n    const leaseExpiresAt = new Date(occurredAt.getTime() + EXTERNAL_ACTION_LEASE_MS);\n\n    try {\n      await this.database.transaction(async (client) => {\n        await reconcileExpiredExternalReservation(client, request.context!.missionId, occurredAt);\n        const mission = await client.query<MissionVersionRow>(",
)
replace_once(
    LEDGER,
    '''            "expected_mission_version", "status", "created_at", "updated_at"
          ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ALLOWED', $11, $11)`,''',
    '''            "expected_mission_version", "status", "lease_expires_at", "created_at", "updated_at"
          ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ALLOWED', $11, $12, $12)`,''',
)
replace_once(
    LEDGER,
    '''            request.context.expectedMissionVersion,
            occurredAt,
          ],''',
    '''            request.context.expectedMissionVersion,
            leaseExpiresAt,
            occurredAt,
          ],''',
)
replace_once(
    LEDGER,
    "    const occurredAt = new Date();\n\n    try {\n      await this.database.transaction(async (client) => {\n        const current = await client.query<AttemptStateRow>(",
    "    const occurredAt = new Date();\n    const leaseExpiresAt = new Date(occurredAt.getTime() + EXTERNAL_ACTION_LEASE_MS);\n\n    try {\n      await this.database.transaction(async (client) => {\n        const current = await client.query<AttemptStateRow>(",
)
replace_once(
    LEDGER,
    '''               "failure_code" = $3,
               "failure_message" = $4,
               "updated_at" = $5
           where "attempt_id" = $6 and "status" = $7
           returning "attempt_id" as "attemptId"`,''',
    '''               "failure_code" = $3,
               "failure_message" = $4,
               "lease_expires_at" = $5,
               "updated_at" = $6
           where "attempt_id" = $7 and "status" = $8
           returning "attempt_id" as "attemptId"`,''',
)
replace_once(
    LEDGER,
    '''            input.failure?.message ?? null,
            occurredAt,
            input.attemptId,
            attempt.status,
          ],''',
    '''            input.failure?.message ?? null,
            leaseExpiresAt,
            occurredAt,
            input.attemptId,
            attempt.status,
          ],''',
)

REPOSITORY = "apps/rede-social-agentes/apps/server/src/mcf-runtime/postgres-mcf-runtime.repository.ts"
replace_once(
    REPOSITORY,
    "} from './mcf-runtime.errors.js';\n",
    "} from './mcf-runtime.errors.js';\nimport { reconcileExpiredExternalReservation } from './external-action-reservation.js';\n",
)
replace_once(
    REPOSITORY,
    "    return this.database.transaction(async (client) => {\n      const updatedMission = await client.query<MissionRow>(",
    "    return this.database.transaction(async (client) => {\n      await reconcileExpiredExternalReservation(client, input.missionId);\n      const updatedMission = await client.query<MissionRow>(",
)
replace_once(
    REPOSITORY,
    '''      const lockedMission = await client.query<MissionRow>(
        `select ${missionColumns} from "mcf_missions" where "id" = $1 for update`,''',
    '''      await reconcileExpiredExternalReservation(client, input.missionId);
      const lockedMission = await client.query<MissionRow>(
        `select ${missionColumns} from "mcf_missions" where "id" = $1 for update`,''',
)

TEST = "apps/rede-social-agentes/apps/server/src/mcf-runtime/external-action-reservation.integration.test.ts"
test = read(TEST)
replace_marker = '''interface ReservationRow {
  activeExternalAttemptId: string | null;
  version: number;
}
'''
replacement = '''interface ReservationRow {
  activeExternalAttemptId: string | null;
  version: number;
}

interface AttemptStatusRow {
  status: string;
}
'''
if test.count(replace_marker) != 1:
    raise RuntimeError("reservation test interface marker mismatch")
test = test.replace(replace_marker, replacement, 1)
extra = r'''

  it('abandons an expired orphan reservation and allows mission progress with an audit event', async () => {
    const missionId = randomUUID();
    const orphanPhaseId = randomUUID();
    const recoveryPhaseId = randomUUID();
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
            title: 'Expired external reservation recovery',
            objective: 'Recover a mission after an external worker interruption.',
            expectedOutcome: 'Expired reservation is abandoned and mission progress resumes.',
            scope: ['runtime reservation lease'],
            outOfScope: ['external write'],
            acceptanceCriteria: ['orphan reservation is auditable and released'],
            riskClass: 'A',
            selectedAgents: ['Vinicius'],
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
            phaseId: orphanPhaseId,
            expectedMissionVersion: 1,
          },
        },
        'github-code-review-read-only-v1',
      );

      await database.query(
        `update "mcf_external_action_attempts"
         set "lease_expires_at" = now() - interval '1 minute'
         where "attempt_id" = $1`,
        [attemptId],
      );

      const phase = {
        id: recoveryPhaseId,
        missionId,
        skillId: skill.skillId,
        agentId: 'Vinicius',
        state: 'COMPLETED' as const,
        cycle: 1,
        inputs: { diff_or_commit: 'PR #71' },
        expectedEvidence: skill.requiredEvidence,
        startedAt: createdAt,
        completedAt: createdAt,
        createdAt,
        updatedAt: createdAt,
      };
      const persisted = await repository.persistExecution({
        missionId,
        expectedMissionVersion: 1,
        externalAttemptId: null,
        phase,
        permissionProfile: 'READ_AND_PROPOSE',
        missionState: 'EXECUTING',
        nextAgentId: null,
        receipt: null,
        evidenceStatus: 'PENDING',
        handoff: null,
        events: [],
      });
      expect(persisted.mission.version).toBe(2);

      const attempt = await database.query<AttemptStatusRow>(
        `select "status" from "mcf_external_action_attempts" where "attempt_id" = $1`,
        [attemptId],
      );
      expect(attempt.rows[0]?.status).toBe('ABANDONED');

      const mission = await database.query<ReservationRow>(
        `select
           "active_external_attempt_id" as "activeExternalAttemptId",
           "version"
         from "mcf_missions"
         where "id" = $1`,
        [missionId],
      );
      expect(mission.rows[0]).toEqual({ activeExternalAttemptId: null, version: 2 });

      const event = await database.query<{ eventType: string; payload: unknown }>(
        `select "event_type" as "eventType", "payload"
         from "mcf_events"
         where "idempotency_key" = $1`,
        [`external-action:${attemptId}:abandoned`],
      );
      expect(event.rows[0]).toMatchObject({
        eventType: 'EXTERNAL_ACTION_ABANDONED',
        payload: {
          attemptId,
          previousStatus: 'ALLOWED',
          reason: 'RESERVATION_EXPIRED',
        },
      });
    } finally {
      await database.query('delete from "mcf_tool_receipts" where "mission_id" = $1', [missionId]);
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
'''
if not test.endswith("});\n"):
    raise RuntimeError("reservation test file ending mismatch")
test = test[:-4] + extra + "});\n"
write(TEST, test)
