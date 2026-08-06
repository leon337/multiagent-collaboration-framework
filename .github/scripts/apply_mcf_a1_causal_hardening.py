from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


ledger_path = ROOT / "apps/rede-social-agentes/apps/server/src/mcf-runtime/external-action-ledger.ts"
ledger = ledger_path.read_text()
ledger = replace_once(
    ledger,
    "interface AttemptRow {\n  attemptId: string;\n}\n",
    """interface AttemptRow {
  attemptId: string;
}

type ExternalAttemptStatus =
  | 'ALLOWED'
  | 'EXECUTED'
  | 'FAILED'
  | 'EVIDENCE_VALIDATED'
  | 'EVIDENCE_REJECTED';

interface AttemptStateRow extends AttemptRow {
  status: ExternalAttemptStatus;
}

const allowedTransitions: Record<ExternalAttemptStatus, ExternalAttemptStatus[]> = {
  ALLOWED: ['EXECUTED', 'FAILED'],
  EXECUTED: ['EVIDENCE_VALIDATED', 'EVIDENCE_REJECTED'],
  FAILED: [],
  EVIDENCE_VALIDATED: [],
  EVIDENCE_REJECTED: [],
};
""",
    "ledger attempt state types",
)

event_start = ledger.index(
    '        await client.query(\n          `insert into "mcf_events" (',
    ledger.index('insert into "mcf_external_action_attempts"'),
)
event_end_marker = "\n        );\n      });"
event_end = ledger.index(event_end_marker, event_start) + len("\n        );")
preflight = '''        const preflightEvents = [
          {
            eventType: 'PHASE_STARTED',
            payload: { skillId: request.skill.skillId, cycle: 1 },
            idempotencyKey: `phase:${request.context.phaseId}:started`,
          },
          {
            eventType: 'SKILL_SELECTED',
            payload: { skillId: request.skill.skillId, version: request.skill.version },
            idempotencyKey: `phase:${request.context.phaseId}:skill-selected`,
          },
          {
            eventType: 'PERMISSION_GRANTED',
            payload: {
              profile: request.skill.permissionProfile,
              provider: request.tool.provider,
            },
            idempotencyKey: `phase:${request.context.phaseId}:permission-granted`,
          },
          {
            eventType: 'TOOL_REQUESTED',
            payload: {
              provider: request.tool.provider,
              operation: request.tool.operation,
              resource: request.tool.resource,
            },
            idempotencyKey: `phase:${request.context.phaseId}:tool-requested`,
          },
          {
            eventType: 'EXTERNAL_ACTION_REQUESTED',
            payload: {
              attemptId,
              adapterId,
              skillId: request.skill.skillId,
              provider: request.tool.provider,
              operation: request.tool.operation,
              resource: request.tool.resource,
              expectedMissionVersion: request.context.expectedMissionVersion,
            },
            idempotencyKey: `external-action:${attemptId}:requested`,
          },
          {
            eventType: 'EXTERNAL_ACTION_ALLOWED',
            payload: {
              attemptId,
              adapterId,
              permissionProfile: request.skill.permissionProfile,
              provider: request.tool.provider,
              operation: request.tool.operation,
              resource: request.tool.resource,
            },
            idempotencyKey: `external-action:${attemptId}:allowed`,
          },
        ];

        for (const item of preflightEvents) {
          await client.query(
            `insert into "mcf_events" (
              "id", "mission_id", "phase_id", "agent_id", "event_type", "payload",
              "idempotency_key", "occurred_at"
            ) values ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)`,
            [
              randomUUID(),
              request.context.missionId,
              request.context.phaseId,
              request.agentId,
              item.eventType,
              JSON.stringify(item.payload),
              item.idempotencyKey,
              occurredAt,
            ],
          );
        }'''
ledger = ledger[:event_start] + preflight + ledger[event_end:]

transition_start = ledger.index("  private async transition(")
class_end = ledger.rfind("\n}")
new_transition = '''  private async transition(input: {
    attemptId: string;
    status: 'EXECUTED' | 'FAILED' | 'EVIDENCE_VALIDATED' | 'EVIDENCE_REJECTED';
    eventType:
      | 'EXTERNAL_ACTION_EXECUTED'
      | 'EXTERNAL_ACTION_FAILED'
      | 'EXTERNAL_ACTION_EVIDENCE_VALIDATED';
    receiptId: string | null;
    failure: ExternalActionFailure | null;
    payload: Record<string, unknown>;
  }): Promise<void> {
    const occurredAt = new Date();

    try {
      await this.database.transaction(async (client) => {
        const current = await client.query<AttemptStateRow>(
          `select "attempt_id" as "attemptId", "status"
           from "mcf_external_action_attempts"
           where "attempt_id" = $1
           for update`,
          [input.attemptId],
        );
        const attempt = current.rows[0];
        if (!attempt) {
          throw new ExternalActionAdapterError(
            'LEDGER_FAILURE',
            `External action attempt ${input.attemptId} was not found`,
            false,
          );
        }
        if (attempt.status === input.status) {
          return;
        }
        if (!allowedTransitions[attempt.status].includes(input.status)) {
          throw new ExternalActionAdapterError(
            'LEDGER_FAILURE',
            `Invalid external action transition ${attempt.status} -> ${input.status}`,
            false,
          );
        }

        const updated = await client.query<AttemptRow>(
          `update "mcf_external_action_attempts"
           set "status" = $1,
               "receipt_id" = coalesce($2, "receipt_id"),
               "failure_code" = $3,
               "failure_message" = $4,
               "updated_at" = $5
           where "attempt_id" = $6 and "status" = $7
           returning "attempt_id" as "attemptId"`,
          [
            input.status,
            input.receiptId,
            input.failure?.code ?? null,
            input.failure?.message ?? null,
            occurredAt,
            input.attemptId,
            attempt.status,
          ],
        );
        if (!updated.rows[0]) {
          throw new ExternalActionAdapterError(
            'LEDGER_FAILURE',
            `External action attempt ${input.attemptId} changed during transition`,
            true,
          );
        }

        await client.query(
          `insert into "mcf_events" (
            "id", "mission_id", "phase_id", "agent_id", "event_type", "payload",
            "idempotency_key", "occurred_at"
          )
          select $1, "mission_id", "phase_id", "agent_id", $2, $3::jsonb, $4, $5
          from "mcf_external_action_attempts"
          where "attempt_id" = $6
          on conflict ("idempotency_key") do nothing`,
          [
            randomUUID(),
            input.eventType,
            JSON.stringify({ attemptId: input.attemptId, ...input.payload }),
            `external-action:${input.attemptId}:${input.status.toLowerCase()}`,
            occurredAt,
            input.attemptId,
          ],
        );
      });
    } catch (error) {
      if (error instanceof ExternalActionAdapterError) {
        throw error;
      }
      throw new ExternalActionAdapterError(
        'LEDGER_FAILURE',
        error instanceof Error ? error.message : 'Failed to persist external action transition',
        true,
      );
    }
  }
'''
ledger = ledger[:transition_start] + new_transition + ledger[class_end:]
ledger_path.write_text(ledger)

service_path = ROOT / "apps/rede-social-agentes/apps/server/src/mcf-runtime/mission-runtime.service.ts"
service = service_path.read_text()
execute_start = service.index("  async executePhase(")
block_start = service.index("    const events: McfEventInput[] = [", execute_start)
block_end = service.index("\n\n    if (outcome.receipt)", block_start)
old_block = service[block_start:block_end]
prefix = "    const events: McfEventInput[] = [\n"
suffix = "\n    ];"
if not old_block.startswith(prefix) or not old_block.endswith(suffix):
    raise RuntimeError("mission preflight event block did not match expected structure")
inner = old_block[len(prefix) : -len(suffix)]
new_block = (
    "    const events: McfEventInput[] = [];\n"
    "    if (!outcome.externalAction?.attemptId) {\n"
    "      events.push(\n"
    + inner
    + "\n      );\n"
    "    }"
)
service = service[:block_start] + new_block + service[block_end:]
service_path.write_text(service)

repository_path = ROOT / "apps/rede-social-agentes/apps/server/src/mcf-runtime/postgres-mcf-runtime.repository.ts"
repository = repository_path.read_text()
repository = replace_once(
    repository,
    '       order by "occurred_at" asc, "id" asc',
    '       order by "sequence" asc',
    "timeline causal order",
)
repository_path.write_text(repository)

test_path = ROOT / "apps/rede-social-agentes/apps/server/src/mcf-runtime/external-action-ledger.integration.test.ts"
test = test_path.read_text()
test = replace_once(
    test,
    """      expect(reserved.rows.map((row) => row.eventType)).toEqual([
        'EXTERNAL_ACTION_REQUESTED',
        'EXTERNAL_ACTION_ALLOWED',
      ]);

      const evidence = new EvidenceValidator();
""",
    """      expect(reserved.rows.map((row) => row.eventType)).toEqual([
        'PHASE_STARTED',
        'SKILL_SELECTED',
        'PERMISSION_GRANTED',
        'TOOL_REQUESTED',
        'EXTERNAL_ACTION_REQUESTED',
        'EXTERNAL_ACTION_ALLOWED',
      ]);

      await expect(
        ledger.recordEvidenceValidated(attemptId, 'receipt-before-execution'),
      ).rejects.toMatchObject({
        code: 'LEDGER_FAILURE',
        retryable: false,
      });

      const evidence = new EvidenceValidator();
""",
    "reserved causal events and invalid transition",
)
test = replace_once(
    test,
    """      await ledger.recordExecuted(attemptId, receipt);
      await ledger.recordEvidenceValidated(attemptId, receipt.receiptId);
""",
    """      await ledger.recordExecuted(attemptId, receipt);
      await ledger.recordExecuted(attemptId, receipt);
      await ledger.recordEvidenceValidated(attemptId, receipt.receiptId);
      await ledger.recordEvidenceValidated(attemptId, receipt.receiptId);
""",
    "idempotent transitions",
)
test = replace_once(
    test,
    """      expect(completed.rows.map((row) => row.eventType)).toEqual([
        'EXTERNAL_ACTION_REQUESTED',
        'EXTERNAL_ACTION_ALLOWED',
        'EXTERNAL_ACTION_EXECUTED',
        'EXTERNAL_ACTION_EVIDENCE_VALIDATED',
      ]);
""",
    """      expect(completed.rows.map((row) => row.eventType)).toEqual([
        'PHASE_STARTED',
        'SKILL_SELECTED',
        'PERMISSION_GRANTED',
        'TOOL_REQUESTED',
        'EXTERNAL_ACTION_REQUESTED',
        'EXTERNAL_ACTION_ALLOWED',
        'EXTERNAL_ACTION_EXECUTED',
        'EXTERNAL_ACTION_EVIDENCE_VALIDATED',
      ]);
""",
    "complete causal lifecycle",
)
test_path.write_text(test)
