from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def path(relative: str) -> Path:
    return ROOT / relative


def replace_once(relative: str, old: str, new: str) -> None:
    target = path(relative)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{relative}: expected one anchor, found {count}: {old[:80]!r}")
    target.write_text(text.replace(old, new, 1))


def insert_before(relative: str, anchor: str, content: str) -> None:
    replace_once(relative, anchor, content + anchor)


# ---------------------------------------------------------------------------
# Primary workflow correlation: mission + phase are durable non-secret inputs.
# ---------------------------------------------------------------------------
workflow = ".github/workflows/mcf-runtime-staging-deploy.yml"
replace_once(
    workflow,
    "run-name: MCF staging deploy ${{ inputs.request_id || 'push' }} ${{ inputs.release_sha || github.sha }}\n",
    "run-name: MCF staging deploy ${{ inputs.request_id || 'push' }} ${{ inputs.release_sha || github.sha }} ${{ inputs.mission_id || 'push' }} ${{ inputs.phase_id || 'push' }}\n",
)
replace_once(
    workflow,
    "      request_id:\n        description: Non-secret MCF idempotency/correlation key for runtime-controlled staging dispatch.\n        required: false\n        type: string\n",
    "      request_id:\n        description: Non-secret MCF idempotency/correlation key for runtime-controlled staging dispatch.\n        required: false\n        type: string\n      mission_id:\n        description: Non-secret MCF mission UUID used only for callback correlation.\n        required: false\n        type: string\n      phase_id:\n        description: Non-secret MCF phase UUID used only for callback correlation.\n        required: false\n        type: string\n",
)
replace_once(
    workflow,
    "      REQUEST_ID: ${{ github.event_name == 'workflow_dispatch' && inputs.request_id || 'push' }}\n",
    "      REQUEST_ID: ${{ github.event_name == 'workflow_dispatch' && inputs.request_id || 'push' }}\n      MISSION_ID: ${{ github.event_name == 'workflow_dispatch' && inputs.mission_id || 'push' }}\n      PHASE_ID: ${{ github.event_name == 'workflow_dispatch' && inputs.phase_id || 'push' }}\n",
)
replace_once(
    workflow,
    "            [[ \"$REQUEST_ID\" =~ ^[A-Za-z0-9][A-Za-z0-9._:-]{15,127}$ ]]\n",
    "            [[ \"$REQUEST_ID\" =~ ^[A-Za-z0-9][A-Za-z0-9._:-]{15,127}$ ]]\n            [[ \"$MISSION_ID\" =~ ^[0-9a-fA-F-]{36}$ ]]\n            [[ \"$PHASE_ID\" =~ ^[0-9a-fA-F-]{36}$ ]]\n",
)

callback_workflow = r'''name: MCF Runtime Staging Deploy Callback

on:
  workflow_run:
    workflows:
      - MCF Runtime Staging Deploy
    types:
      - completed

permissions:
  contents: read

jobs:
  reconcile:
    if: github.event.workflow_run.event == 'workflow_dispatch'
    runs-on: ubuntu-latest
    timeout-minutes: 7
    env:
      MCF_RUNTIME_URL: ${{ secrets.MCF_RUNTIME_URL }}
      MCF_RUNTIME_TOKEN: ${{ secrets.MCF_RUNTIME_TOKEN }}
      SOURCE_RUN_ID: ${{ github.event.workflow_run.id }}
      SOURCE_TITLE: ${{ github.event.workflow_run.display_title }}
      SOURCE_REPOSITORY: ${{ github.repository }}
      SOURCE_COMPLETED_AT: ${{ github.event.workflow_run.updated_at }}

    steps:
      - name: Parse governed staging correlation
        id: correlation
        shell: bash
        run: |
          set -euo pipefail
          test -n "$MCF_RUNTIME_URL"
          test -n "$MCF_RUNTIME_TOKEN"
          read -r word1 word2 word3 request_id release_sha mission_id phase_id extra <<<"$SOURCE_TITLE"
          test "$word1 $word2 $word3" = "MCF staging deploy"
          test -z "${extra:-}"
          [[ "$request_id" =~ ^[A-Za-z0-9][A-Za-z0-9._:-]{15,127}$ ]]
          [[ "$release_sha" =~ ^[a-f0-9]{40}$ ]]
          [[ "$mission_id" =~ ^[0-9a-fA-F-]{36}$ ]]
          [[ "$phase_id" =~ ^[0-9a-fA-F-]{36}$ ]]
          printf 'request_id=%s\n' "$request_id" >>"$GITHUB_OUTPUT"
          printf 'release_sha=%s\n' "$release_sha" >>"$GITHUB_OUTPUT"
          printf 'mission_id=%s\n' "$mission_id" >>"$GITHUB_OUTPUT"
          printf 'phase_id=%s\n' "$phase_id" >>"$GITHUB_OUTPUT"

      - name: Reconcile durable UNKNOWN attempt
        shell: bash
        env:
          REQUEST_ID: ${{ steps.correlation.outputs.request_id }}
          RELEASE_SHA: ${{ steps.correlation.outputs.release_sha }}
          MISSION_ID: ${{ steps.correlation.outputs.mission_id }}
          PHASE_ID: ${{ steps.correlation.outputs.phase_id }}
        run: |
          set -euo pipefail
          endpoint="${MCF_RUNTIME_URL%/}/v1/mcf/callbacks/staging-deploy"
          payload=$(jq -cn \
            --arg missionId "$MISSION_ID" \
            --arg phaseId "$PHASE_ID" \
            --arg requestId "$REQUEST_ID" \
            --arg releaseSha "$RELEASE_SHA" \
            --arg workflowRunId "$SOURCE_RUN_ID" \
            --arg repository "$SOURCE_REPOSITORY" \
            --arg completedAt "$SOURCE_COMPLETED_AT" \
            --arg stagingRuntimeUrl "$MCF_RUNTIME_URL" \
            '{missionId:$missionId,phaseId:$phaseId,requestId:$requestId,releaseSha:$releaseSha,workflowRunId:$workflowRunId,repository:$repository,completedAt:$completedAt,stagingRuntimeUrl:$stagingRuntimeUrl}')
          response=$(mktemp)
          for attempt in $(seq 1 60); do
            status=$(curl --silent --show-error --output "$response" --write-out '%{http_code}' \
              --request POST \
              --header 'Content-Type: application/json' \
              --header "x-mcf-runtime-token: $MCF_RUNTIME_TOKEN" \
              --data "$payload" \
              "$endpoint" || true)
            if [[ "$status" =~ ^2[0-9][0-9]$ ]]; then
              cat "$response"
              exit 0
            fi
            sleep 5
          done
          cat "$response" >&2
          exit 1
'''
path(".github/workflows/mcf-runtime-staging-deploy-callback.yml").write_text(callback_workflow)

# ---------------------------------------------------------------------------
# Adapter: bind title/dispatch to mission+phase and mark only new dispatches as
# automatically reconcilable. Add a read-only terminal reconciliation method.
# ---------------------------------------------------------------------------
adapter = "apps/rede-social-agentes/apps/server/src/mcf-runtime/github-staging-deploy.adapter.ts"
replace_once(
    adapter,
    "interface DeployTarget {\n  repository: string;\n  releaseSha: string;\n  idempotencyKey: string;\n  expectedRunTitle: string;\n  runTitlePrefix: string;\n}\n",
    "interface DeployTarget {\n  repository: string;\n  releaseSha: string;\n  idempotencyKey: string;\n  missionId: string;\n  phaseId: string;\n  expectedRunTitle: string;\n  runTitlePrefix: string;\n}\n\nexport interface StagingDeployReconciliationOptions {\n  expectedRunId: number;\n  previousSha: string;\n  stagingRuntimeUrl: string;\n}\n",
)
replace_once(
    adapter,
    "  return {\n    repository,\n    releaseSha,\n    idempotencyKey,\n    expectedRunTitle: `MCF staging deploy ${idempotencyKey} ${releaseSha}`,\n    runTitlePrefix: `MCF staging deploy ${idempotencyKey} `,\n  };\n",
    "  return {\n    repository,\n    releaseSha,\n    idempotencyKey,\n    missionId: request.context.missionId,\n    phaseId: request.context.phaseId,\n    expectedRunTitle: `MCF staging deploy ${idempotencyKey} ${releaseSha} ${request.context.missionId} ${request.context.phaseId}`,\n    runTitlePrefix: `MCF staging deploy ${idempotencyKey} `,\n  };\n",
)
replace_once(
    adapter,
    "    reason: string,\n    budget: RequestBudget,\n  ): McfToolReceipt {\n",
    "    reason: string,\n    budget: RequestBudget,\n    reconciliationEligible = false,\n  ): McfToolReceipt {\n",
)
replace_once(
    adapter,
    "        unknownReason: reason,\n        requestBudget: { requests: budget.requests, limit: MAX_REQUESTS },\n",
    "        unknownReason: reason,\n        reconciliationEligible,\n        requestBudget: { requests: budget.requests, limit: MAX_REQUESTS },\n",
)
replace_once(
    adapter,
    "              release_sha: target.releaseSha,\n              request_id: target.idempotencyKey,\n",
    "              release_sha: target.releaseSha,\n              request_id: target.idempotencyKey,\n              mission_id: target.missionId,\n              phase_id: target.phaseId,\n",
)

# Calls after a possible new dispatch are eligible iff this invocation did not
# start from an already-existing run. Preflight/legacy replay calls remain false.
post_dispatch_anchor = "    let completed: GitHubWorkflowRun | null;\n"
post_dispatch_pos = path(adapter).read_text().index(post_dispatch_anchor)
text = path(adapter).read_text()
head, tail = text[:post_dispatch_pos], text[post_dispatch_pos:]
tail = tail.replace("          budget,\n        );", "          budget,\n          !runWasExisting,\n        );")
tail = tail.replace("        budget,\n      );", "        budget,\n        !runWasExisting,\n      );")
path(adapter).write_text(head + tail)

# Dispatch-correlation UNKNOWN calls occur before the post-dispatch anchor and
# are new-attempt ambiguity with a durable healthy previous SHA.
text = path(adapter).read_text()
dispatch_start = text.index("    if (!run) {\n")
completion_start = text.index(post_dispatch_anchor, dispatch_start)
segment = text[dispatch_start:completion_start]
segment = segment.replace("          budget,\n        );", "          budget,\n          true,\n        );")
segment = segment.replace("        budget,\n      );", "        budget,\n        true,\n      );")
path(adapter).write_text(text[:dispatch_start] + segment + text[completion_start:])

reconcile_method = r'''

  async reconcile(
    request: ExternalActionRequest,
    options: StagingDeployReconciliationOptions,
  ): Promise<McfToolReceipt> {
    const target = resolveTarget(request);
    const previousSha = exactSha(options.previousSha, 'reconciliation previous SHA');
    if (!Number.isSafeInteger(options.expectedRunId) || options.expectedRunId < 1) {
      throw new ExternalActionAdapterError(
        'INVALID_CONTEXT',
        'reconciliation workflow run id must be a positive integer',
        false,
      );
    }
    const stagingRuntimeUrl = publicHttpsBaseUrl(options.stagingRuntimeUrl);
    const deadlineAt = Date.now() + this.timeoutMs;
    const budget: RequestBudget = { requests: 0 };
    const before: StagingObservation = { commitSha: previousSha, ready: true, readyStatus: 200 };

    let run: GitHubWorkflowRun | null;
    try {
      run = await this.findRun(target, deadlineAt, budget);
    } catch (error) {
      return this.unknownReceipt(
        request,
        target,
        before,
        null,
        `automatic staging reconciliation could not identify a unique run: ${error instanceof Error ? error.message : 'unknown run lookup error'}`,
        budget,
        true,
      );
    }
    if (!run || run.id !== options.expectedRunId || run.status.toLowerCase() !== 'completed') {
      return this.unknownReceipt(
        request,
        target,
        before,
        run,
        'automatic staging reconciliation did not observe the exact completed workflow run',
        budget,
        true,
      );
    }

    const conclusion = normalizedConclusion(run.conclusion);
    if (!conclusion) {
      return this.unknownReceipt(
        request,
        target,
        before,
        run,
        'automatic staging reconciliation observed an unsupported workflow conclusion',
        budget,
        true,
      );
    }

    let outcome: DeploymentOutcome | null;
    try {
      outcome = await this.readMarkerOutcome(target, run.id, deadlineAt, budget);
    } catch (error) {
      return this.unknownReceipt(
        request,
        target,
        before,
        run,
        `automatic staging reconciliation could not verify the deployment marker: ${error instanceof Error ? error.message : 'unknown marker error'}`,
        budget,
        true,
      );
    }
    if (!outcome) {
      return this.unknownReceipt(
        request,
        target,
        before,
        run,
        'automatic staging reconciliation requires exactly one trusted deployment result marker',
        budget,
        true,
      );
    }

    let after: StagingObservation;
    try {
      after = await this.client.observeStaging(stagingRuntimeUrl, deadlineAt, budget);
    } catch (error) {
      return this.unknownReceipt(
        request,
        target,
        before,
        run,
        `automatic staging reconciliation could not verify final staging state: ${error instanceof Error ? error.message : 'unknown staging observation error'}`,
        budget,
        true,
      );
    }

    if (
      (outcome === 'DEPLOYED' || outcome === 'NOOP') &&
      conclusion === 'success' &&
      after.ready &&
      after.commitSha === target.releaseSha &&
      (outcome !== 'NOOP' || previousSha === target.releaseSha)
    ) {
      return this.receipt(request, target, before, after, run, outcome, budget);
    }
    if (
      outcome === 'RECOVERED' &&
      conclusion === 'failure' &&
      after.ready &&
      previousSha !== target.releaseSha &&
      after.commitSha === previousSha
    ) {
      return this.receipt(request, target, before, after, run, outcome, budget);
    }
    return this.unknownReceipt(
      request,
      target,
      before,
      run,
      'automatic staging reconciliation found workflow/staging state inconsistency',
      budget,
      true,
    );
  }
'''
replace_once(adapter, "\n  async execute(request: ExternalActionRequest): Promise<McfToolReceipt> {\n", reconcile_method + "\n  async execute(request: ExternalActionRequest): Promise<McfToolReceipt> {\n")

# ---------------------------------------------------------------------------
# Evidence title now binds request + SHA + mission + phase.
# ---------------------------------------------------------------------------
evidence = "apps/rede-social-agentes/apps/server/src/mcf-runtime/github-staging-deploy.evidence.ts"
replace_once(
    evidence,
    "  const expectedTitle = `MCF staging deploy ${idempotencyKey} ${releaseSha}`;\n",
    "  const governed = current?.executionContext;\n  if (!governed) reject('staging deployment workflow title requires governed execution context');\n  const expectedTitle = `MCF staging deploy ${idempotencyKey} ${releaseSha} ${governed.missionId} ${governed.phaseId}`;\n",
)

# ---------------------------------------------------------------------------
# Durable ledger lookup for the original UNKNOWN attempt + its first eligible
# PARTIAL receipt. This survives a later ledger receipt_id transition.
# ---------------------------------------------------------------------------
ledger = "apps/rede-social-agentes/apps/server/src/mcf-runtime/external-action-ledger.ts"
insert_before(
    ledger,
    "interface AttemptStateRow extends AttemptRow {\n",
    "export interface StagingDeployReconciliationAttempt {\n  attemptId: string;\n  status: ExternalAttemptStatus;\n  expectedMissionVersion: number;\n  agentId: string;\n  skillId: string;\n  resource: string;\n  previousSha: string | null;\n  reconciliationEligible: boolean;\n}\n\ninterface StagingDeployReconciliationRow {\n  attemptId: string;\n  status: ExternalAttemptStatus;\n  expectedMissionVersion: number;\n  agentId: string;\n  skillId: string;\n  resource: string;\n  initialMetadata: unknown;\n}\n\n",
)
ledger_method = r'''

  async loadStagingDeployReconciliationAttempt(
    missionId: string,
    phaseId: string,
    idempotencyKey: string,
  ): Promise<StagingDeployReconciliationAttempt | null> {
    const result = await this.database.query<StagingDeployReconciliationRow>(
      `select
         a."attempt_id" as "attemptId",
         a."status" as "status",
         a."expected_mission_version" as "expectedMissionVersion",
         a."agent_id" as "agentId",
         a."skill_id" as "skillId",
         a."resource" as "resource",
         (
           select r."metadata"
           from "mcf_tool_receipts" r
           where r."mission_id" = a."mission_id"
             and r."phase_id" = a."phase_id"
             and r."status" = 'PARTIAL'
             and r."metadata"->>'reconciliationEligible' = 'true'
             and r."metadata"->>'idempotencyKey' = $3
           order by r."created_at" asc
           limit 1
         ) as "initialMetadata"
       from "mcf_external_action_attempts" a
       where a."mission_id" = $1
         and a."phase_id" = $2
         and a."adapter_id" = 'github-actions-staging-deploy-v1'
         and a."provider" = 'github'
         and a."operation" = 'deploy-staging'
       limit 2`,
      [missionId, phaseId, idempotencyKey],
    );
    if (result.rows.length === 0) return null;
    if (result.rows.length !== 1) {
      throw new ExternalActionAdapterError(
        'LEDGER_FAILURE',
        'staging deploy reconciliation found multiple durable attempts',
        false,
      );
    }
    const row = result.rows[0]!;
    const metadata =
      typeof row.initialMetadata === 'object' && row.initialMetadata !== null && !Array.isArray(row.initialMetadata)
        ? (row.initialMetadata as Record<string, unknown>)
        : null;
    const previousSha = metadata?.previousSha;
    return {
      attemptId: row.attemptId,
      status: row.status,
      expectedMissionVersion: row.expectedMissionVersion,
      agentId: row.agentId,
      skillId: row.skillId,
      resource: row.resource,
      previousSha: typeof previousSha === 'string' ? previousSha : null,
      reconciliationEligible: metadata?.reconciliationEligible === true,
    };
  }
'''
replace_once(ledger, "\n  async recordExecuting(attemptId: string): Promise<void> {\n", ledger_method + "\n  async recordExecuting(attemptId: string): Promise<void> {\n")

# ---------------------------------------------------------------------------
# Reconciliation service: authenticated callback is only a trigger; trusted
# evidence is regenerated by read-only GitHub/staging observation.
# ---------------------------------------------------------------------------
service_content = r'''import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import type { McfCiCallbackResponse, McfEventType } from '@rsa/contracts';

import type { ExternalActionRequest } from './external-action.contracts.js';
import { ExternalActionLedger } from './external-action-ledger.js';
import { GitHubActionsStagingDeployAdapter } from './github-staging-deploy.adapter.js';
import { HumanDelegationGuard } from './human-delegation-guard.js';
import {
  McfEvidenceRejectedError,
  McfMissionNotFoundError,
  McfPermissionDeniedError,
  McfPhaseNotFoundError,
} from './mcf-runtime.errors.js';
import { resolveMissionState } from './mission-completion-policy.js';
import {
  MCF_RUNTIME_REPOSITORY,
  type McfEventInput,
  type McfRuntimeRepository,
} from './mcf-runtime.repository.js';
import { SkillExecutor } from './skill-executor.js';
import { SkillRegistryLoader } from './skill-registry.loader.js';

export interface McfStagingDeployCallbackRequest {
  missionId: string;
  phaseId: string;
  requestId: string;
  releaseSha: string;
  workflowRunId: string;
  repository: string;
  completedAt: string;
  stagingRuntimeUrl: string;
}

function requiredInput(inputs: Record<string, unknown>, key: string): string {
  const value = inputs[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new McfEvidenceRejectedError(`staging callback requires persisted ${key}`);
  }
  return value;
}

function callbackEvent(input: {
  missionId: string;
  phaseId: string;
  agentId: string;
  eventType: McfEventType;
  payload: Record<string, unknown>;
  idempotencyKey: string;
  occurredAt: Date;
}): McfEventInput {
  return { id: randomUUID(), ...input };
}

@Injectable()
export class StagingDeployReconciliationService {
  private readonly humanDelegation = new HumanDelegationGuard();

  constructor(
    @Inject(MCF_RUNTIME_REPOSITORY) private readonly repository: McfRuntimeRepository,
    private readonly executor: SkillExecutor,
    private readonly registry: SkillRegistryLoader,
    private readonly ledger: ExternalActionLedger,
    private readonly adapter: GitHubActionsStagingDeployAdapter,
  ) {}

  async accept(request: McfStagingDeployCallbackRequest): Promise<McfCiCallbackResponse> {
    const mission = await this.repository.findMission(request.missionId);
    if (!mission) throw new McfMissionNotFoundError(request.missionId);
    const phase = await this.repository.findPhase(request.missionId, request.phaseId);
    if (!phase) throw new McfPhaseNotFoundError(request.missionId, request.phaseId);
    if (phase.skillId !== 'MCF-DEPLOY-VALIDATE') {
      throw new McfPermissionDeniedError(
        'staging deploy callbacks may complete only MCF-DEPLOY-VALIDATE phases',
      );
    }

    const repository = requiredInput(phase.inputs, 'repository');
    const releaseSha = requiredInput(phase.inputs, 'artifact_or_commit').toLowerCase();
    const requestId = requiredInput(phase.inputs, 'idempotency_key');
    if (
      repository.toLowerCase() !== request.repository.toLowerCase() ||
      releaseSha !== request.releaseSha.toLowerCase() ||
      requestId !== request.requestId ||
      requiredInput(phase.inputs, 'target_environment').toLowerCase() !== 'staging'
    ) {
      throw new McfEvidenceRejectedError('staging callback correlation does not match persisted phase inputs');
    }

    const attempt = await this.ledger.loadStagingDeployReconciliationAttempt(
      request.missionId,
      request.phaseId,
      request.requestId,
    );
    if (!attempt || !attempt.reconciliationEligible || !attempt.previousSha) {
      throw new McfEvidenceRejectedError(
        'durable staging UNKNOWN attempt is not yet eligible for automatic reconciliation',
      );
    }
    if (attempt.skillId !== phase.skillId || attempt.agentId !== phase.agentId) {
      throw new McfEvidenceRejectedError('staging callback attempt does not match persisted phase identity');
    }
    if (!['UNKNOWN', 'EVIDENCE_VALIDATED', 'EVIDENCE_REJECTED'].includes(attempt.status)) {
      throw new McfEvidenceRejectedError(`staging callback cannot reconcile attempt status ${attempt.status}`);
    }

    const skill = await this.registry.load(phase.skillId);
    const externalRequest: ExternalActionRequest = {
      skill,
      agentId: phase.agentId,
      inputs: phase.inputs,
      tool: { provider: 'github', operation: 'deploy-staging', resource: repository },
      context: {
        missionId: request.missionId,
        phaseId: request.phaseId,
        expectedMissionVersion: attempt.expectedMissionVersion,
      },
    };
    const workflowRunId = Number(request.workflowRunId);
    const receipt = await this.adapter.reconcile(externalRequest, {
      expectedRunId: workflowRunId,
      previousSha: attempt.previousSha,
      stagingRuntimeUrl: request.stagingRuntimeUrl,
    });
    if (receipt.status !== 'SUCCEEDED') {
      throw new McfEvidenceRejectedError(
        'staging workflow completed but final provider state is still ambiguous',
      );
    }

    const outcome = await this.executor.execute({
      skillId: phase.skillId,
      agentId: phase.agentId,
      inputs: phase.inputs,
      tool: {
        provider: 'github',
        operation: 'deploy-staging',
        resource: repository,
        externalReceipt: receipt,
      },
      executionContext: externalRequest.context,
    });
    if (!outcome.receipt || outcome.evidenceStatus === 'PENDING') {
      throw new McfEvidenceRejectedError('staging reconciliation did not produce terminal evidence');
    }
    if (outcome.handoffTo) {
      this.humanDelegation.assertHandoffTarget(outcome.handoffTo, mission.contract.selectedAgents);
    }

    if (attempt.status === 'UNKNOWN') {
      if (outcome.evidenceStatus === 'VALID') {
        await this.ledger.recordEvidenceValidated(attempt.attemptId, outcome.receipt.receiptId);
      } else {
        await this.ledger.recordEvidenceRejected(
          attempt.attemptId,
          outcome.receipt.receiptId,
          outcome.rejectionReason ?? 'staging deployment evidence rejected',
        );
      }
    }

    const missionState = resolveMissionState({
      selectedSkills: mission.contract.selectedSkills,
      currentSkillId: outcome.skill.skillId,
      currentPhaseCompleted: outcome.phaseState === 'COMPLETED',
      finalCheckpointRequested: false,
      defaultState: outcome.missionState,
      existingEvents: [],
    });
    const now = new Date();
    const callbackKey = `staging-deploy:${request.workflowRunId}:${request.requestId}`;
    const handoff = outcome.handoffTo
      ? {
          id: randomUUID(),
          fromAgentId: phase.agentId,
          toAgentId: outcome.handoffTo,
          objectiveState: {
            missionState,
            phaseState: outcome.phaseState,
            workflowRunId: request.workflowRunId,
          },
          delivered: outcome.skill.requiredEvidence,
          evidenceReceiptIds: [outcome.receipt.receiptId],
          openFindings: [],
          nextAction: `Continue ${outcome.handoffTo} from the reconciled staging checkpoint`,
          acceptanceForNextAction:
            outcome.skill.acceptanceCriteria[0] ?? 'Preserve reconciled staging evidence',
          createdAt: now,
        }
      : null;

    const events: McfEventInput[] = [
      callbackEvent({
        missionId: request.missionId,
        phaseId: request.phaseId,
        agentId: phase.agentId,
        eventType: 'CI_CALLBACK_RECEIVED',
        payload: {
          kind: 'STAGING_DEPLOY_RECONCILIATION',
          workflowRunId: request.workflowRunId,
          requestId: request.requestId,
          releaseSha: request.releaseSha,
          completedAt: request.completedAt,
        },
        idempotencyKey: callbackKey,
        occurredAt: now,
      }),
      callbackEvent({
        missionId: request.missionId,
        phaseId: request.phaseId,
        agentId: phase.agentId,
        eventType: 'TOOL_RECEIPT_RECORDED',
        payload: { receiptId: outcome.receipt.receiptId, provider: outcome.receipt.provider },
        idempotencyKey: `receipt:${outcome.receipt.receiptId}:recorded`,
        occurredAt: now,
      }),
      callbackEvent({
        missionId: request.missionId,
        phaseId: request.phaseId,
        agentId: phase.agentId,
        eventType: outcome.evidenceStatus === 'VALID' ? 'EVIDENCE_VALIDATED' : 'EVIDENCE_REJECTED',
        payload: { receiptId: outcome.receipt.receiptId, reason: outcome.rejectionReason },
        idempotencyKey: `phase:${request.phaseId}:staging-evidence:${request.workflowRunId}`,
        occurredAt: now,
      }),
    ];
    if (handoff) {
      events.push(
        callbackEvent({
          missionId: request.missionId,
          phaseId: request.phaseId,
          agentId: phase.agentId,
          eventType: 'HANDOFF_CREATED',
          payload: { from: phase.agentId, to: handoff.toAgentId },
          idempotencyKey: `phase:${request.phaseId}:staging-handoff:${request.workflowRunId}`,
          occurredAt: now,
        }),
        callbackEvent({
          missionId: request.missionId,
          phaseId: request.phaseId,
          agentId: phase.agentId,
          eventType: 'PHASE_COMPLETED',
          payload: { workflowRunId: request.workflowRunId, skillId: phase.skillId },
          idempotencyKey: `phase:${request.phaseId}:staging-completed:${request.workflowRunId}`,
          occurredAt: now,
        }),
      );
    } else {
      events.push(
        callbackEvent({
          missionId: request.missionId,
          phaseId: request.phaseId,
          agentId: phase.agentId,
          eventType: 'RECOVERY_STARTED',
          payload: { workflowRunId: request.workflowRunId, fallback: outcome.skill.fallback },
          idempotencyKey: `phase:${request.phaseId}:staging-recovery:${request.workflowRunId}`,
          occurredAt: now,
        }),
      );
    }

    const completed = await this.repository.completePendingPhase({
      missionId: request.missionId,
      phaseId: request.phaseId,
      receipt: outcome.receipt,
      evidenceStatus: outcome.evidenceStatus,
      missionState,
      phaseState: outcome.phaseState,
      nextAgentId: handoff?.toAgentId ?? null,
      handoff,
      callbackIdempotencyKey: callbackKey,
      events,
    });

    return {
      accepted: true,
      duplicate: completed.duplicate,
      evidenceStatus: outcome.evidenceStatus,
      missionState: completed.mission.state,
    };
  }
}
'''
path("apps/rede-social-agentes/apps/server/src/mcf-runtime/staging-deploy-reconciliation.service.ts").write_text(service_content)

controller_content = r'''import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  Inject,
  NotFoundException,
  Post,
  Req,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import type { McfCiCallbackResponse } from '@rsa/contracts';
import { z } from 'zod';

import { parseBody } from '../http/parse-body.js';
import {
  McfEvidenceRejectedError,
  McfMissionNotFoundError,
  McfPermissionDeniedError,
  McfPhaseNotFoundError,
} from './mcf-runtime.errors.js';
import { McfRuntimeTokenGuard } from './runtime-token.guard.js';
import {
  type McfStagingDeployCallbackRequest,
  StagingDeployReconciliationService,
} from './staging-deploy-reconciliation.service.js';

const stagingDeployCallbackSchema = z.object({
  missionId: z.string().uuid(),
  phaseId: z.string().uuid(),
  requestId: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{15,127}$/u),
  releaseSha: z.string().regex(/^[a-f0-9]{40}$/u),
  workflowRunId: z.string().regex(/^[1-9][0-9]*$/u),
  repository: z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u),
  completedAt: z.string().datetime({ offset: true }),
  stagingRuntimeUrl: z.string().url().max(2048),
});

@Controller('v1/mcf/callbacks')
@UseGuards(McfRuntimeTokenGuard)
export class McfStagingDeployCallbackController {
  constructor(
    @Inject(StagingDeployReconciliationService)
    private readonly reconciliation: StagingDeployReconciliationService,
  ) {}

  @Post('staging-deploy')
  @HttpCode(202)
  async accept(
    @Body() body: unknown,
    @Req() request: { id: string },
  ): Promise<McfCiCallbackResponse> {
    const input = parseBody<McfStagingDeployCallbackRequest>(
      stagingDeployCallbackSchema,
      body,
      request.id,
    );
    try {
      return await this.reconciliation.accept(input);
    } catch (error) {
      if (error instanceof McfMissionNotFoundError || error instanceof McfPhaseNotFoundError) {
        throw new NotFoundException({ code: 'MCF_RESOURCE_NOT_FOUND', message: error.message });
      }
      if (error instanceof McfPermissionDeniedError) {
        throw new ForbiddenException({ code: 'MCF_PERMISSION_DENIED', message: error.message });
      }
      if (error instanceof McfEvidenceRejectedError) {
        throw new UnprocessableEntityException({
          code: 'MCF_STAGING_RECONCILIATION_PENDING',
          message: error.message,
        });
      }
      throw error;
    }
  }
}
'''
path("apps/rede-social-agentes/apps/server/src/mcf-runtime/staging-deploy-callback.controller.ts").write_text(controller_content)

# ---------------------------------------------------------------------------
# Module: adapter is injectable for callback reconciliation but deliberately
# remains absent from AdapterRegistry (live provider execution stays disabled).
# ---------------------------------------------------------------------------
module = "apps/rede-social-agentes/apps/server/src/mcf-runtime/mcf-runtime.module.ts"
replace_once(
    module,
    "import { GitHubCodeReviewAdapter } from './github-code-review.adapter.js';\n",
    "import { GitHubCodeReviewAdapter } from './github-code-review.adapter.js';\nimport { GitHubActionsStagingDeployAdapter } from './github-staging-deploy.adapter.js';\n",
)
replace_once(
    module,
    "import { SocialTimelineController } from './social-timeline.controller.js';\n",
    "import { SocialTimelineController } from './social-timeline.controller.js';\nimport { McfStagingDeployCallbackController } from './staging-deploy-callback.controller.js';\nimport { StagingDeployReconciliationService } from './staging-deploy-reconciliation.service.js';\n",
)
replace_once(
    module,
    "    McfCiCallbackController,\n",
    "    McfCiCallbackController,\n    McfStagingDeployCallbackController,\n",
)
insert_before(
    module,
    "    {\n      provide: AdapterRegistry,\n",
    "    {\n      provide: GitHubActionsStagingDeployAdapter,\n      useFactory: (evidence: EvidenceValidator) => new GitHubActionsStagingDeployAdapter(evidence),\n      inject: [EvidenceValidator],\n    },\n",
)
replace_once(
    module,
    "    SocialTimelineService,\n",
    "    StagingDeployReconciliationService,\n    SocialTimelineService,\n",
)

# ---------------------------------------------------------------------------
# Unit regression: timeout UNKNOWN from a newly dispatched workflow can be
# reconciled later without a second dispatch.
# ---------------------------------------------------------------------------
test = "apps/rede-social-agentes/apps/server/src/mcf-runtime/github-staging-deploy.adapter.test.ts"
replace_once(
    test,
    "    hang?: boolean;\n",
    "    hang?: boolean;\n    finishAfterTimeout?: boolean;\n",
)
replace_once(
    test,
    "  let runExists = options.existing ?? false;\n",
    "  let runExists = options.existing ?? false;\n  let hang = options.hang ?? false;\n",
)
replace_once(test, "      const status = options.hang ? 'in_progress' : 'completed';\n", "      const status = hang ? 'in_progress' : 'completed';\n")
replace_once(test, "      const conclusion = options.hang ? null : outcome === 'RECOVERED' ? 'failure' : 'success';\n", "      const conclusion = hang ? null : outcome === 'RECOVERED' ? 'failure' : 'success';\n")
replace_once(test, "      if (!options.hang && !options.inconsistentFinal) {\n", "      if (!hang && !options.inconsistentFinal) {\n")
replace_once(test, "      if (options.hang)\n", "      if (hang)\n")
replace_once(
    test,
    "    requests,\n  };\n}\n",
    "    requests,\n    finish() {\n      hang = false;\n      currentSha = outcome === 'RECOVERED' ? PREVIOUS_SHA : RELEASE_SHA;\n      ready = true;\n    },\n  };\n}\n",
)
reconcile_test = r'''

  it('automatically reconciles a workflow that finishes after the adapter deadline without redispatch', async () => {
    const provider = fakeProvider({ hang: true });
    const instance = adapter(provider, 25);
    const initial = await instance.execute(request());

    expect(provider.dispatches).toBe(1);
    expect(initial.status).toBe('PARTIAL');
    expect(initial.metadata.deploymentOutcome).toBe('UNKNOWN');
    expect(initial.metadata.reconciliationEligible).toBe(true);
    expect(initial.metadata.previousSha).toBe(PREVIOUS_SHA);

    provider.finish();
    const reconciled = await instance.reconcile(request(), {
      expectedRunId: RUN_ID,
      previousSha: PREVIOUS_SHA,
      stagingRuntimeUrl: 'https://staging.example',
    });

    expect(provider.dispatches).toBe(1);
    expect(reconciled.status).toBe('SUCCEEDED');
    expect(reconciled.metadata.deploymentOutcome).toBe('DEPLOYED');
    expect(reconciled.metadata.previousSha).toBe(PREVIOUS_SHA);
    expect(reconciled.metadata.verifiedSha).toBe(RELEASE_SHA);
  });
'''
insert_before(test, "\n  it('does not mutate when staging is unhealthy before dispatch', async () => {\n", reconcile_test)

# Static workflow test covers async callback and no Render secret in callback.
static_test = "apps/rede-social-agentes/ops/staging-workflow-correlation.test.mjs"
replace_once(
    static_test,
    "assert.match(workflow, /run-name:\\s*MCF staging deploy \\${{ inputs\\.request_id \\|\\| 'push' }} \\${{ inputs\\.release_sha \\|\\| github\\.sha }}/u);\n",
    "assert.match(workflow, /run-name:\\s*MCF staging deploy .*inputs\\.request_id.*inputs\\.release_sha.*inputs\\.mission_id.*inputs\\.phase_id/u);\n",
)
insert_before(
    static_test,
    "console.log('staging workflow correlation tests passed');\n",
    "const callbackWorkflow = readFileSync(resolve(repoRoot, '.github/workflows/mcf-runtime-staging-deploy-callback.yml'), 'utf8');\nassert.match(callbackWorkflow, /workflow_run:/u);\nassert.match(callbackWorkflow, /MCF Runtime Staging Deploy/u);\nassert.match(callbackWorkflow, /MCF_RUNTIME_TOKEN/u);\nassert.match(callbackWorkflow, /v1\\/mcf\\/callbacks\\/staging-deploy/u);\nassert.doesNotMatch(callbackWorkflow, /RENDER_DEPLOY_HOOK_URL/u);\nassert.match(workflow, /mission_id:/u);\nassert.match(workflow, /phase_id:/u);\n",
)

print('Gate D long-workflow reconciliation patch applied')
