import { Injectable } from '@nestjs/common';
import type {
  McfEvidenceValidationStatus,
  McfMissionState,
  McfPhaseState,
  McfSkillDefinition,
  McfToolReceipt,
} from '@rsa/contracts';

import type { EvidenceValidator } from './evidence-validator.js';
import type { ExternalActionDispatcher } from './external-action-dispatcher.js';
import type {
  ExternalActionExecutionContext,
  ExternalActionTrace,
} from './external-action.contracts.js';
import { verifyGitHubBranchPrEvidence } from './github-branch-pr.evidence.js';
import { verifyGitHubPrCollaborationEvidence } from './github-pr-collaboration.evidence.js';
import {
  stagingDeploymentOutcome,
  verifyGitHubStagingDeployEvidence,
} from './github-staging-deploy.evidence.js';
import {
  collectInternalExecutionEvidence,
  isGovernedAgentInternalSkill,
  verifyInternalExecutionReceipt,
} from './internal-skill-evidence.js';
import {
  McfEvidenceRejectedError,
  McfPermissionDeniedError,
  McfSkillInputError,
  McfSkillNotExecutableError,
} from './mcf-runtime.errors.js';
import type { PermissionEngine } from './permission-engine.js';
import {
  canonicalizeProvider,
  canonicalizeToolValue,
  type McfToolRequest,
} from './permission-engine.js';
import type { SkillRegistryLoader } from './skill-registry.loader.js';

const executableSkills = new Set([
  'MCF-START-MISSION',
  'MCF-SELECT-AGENTS',
  'MCF-RECOVER-CONTEXT',
  'MCF-DEFINE-PRODUCT',
  'MCF-DESIGN-EXPERIENCE',
  'MCF-DESIGN-ARCHITECTURE',
  'MCF-IMPLEMENT-CHANGE',
  'MCF-REVIEW-CODE',
  'MCF-RUN-TESTS',
  'MCF-GIT-PR-RELEASE',
  'MCF-DEPLOY-VALIDATE',
  'MCF-TRACE-MISSION',
  'MCF-EVALUATE-AGENTS',
  'MCF-SECURITY-REVIEW',
]);

const internalSkills = new Set([
  'MCF-START-MISSION',
  'MCF-SELECT-AGENTS',
  'MCF-RECOVER-CONTEXT',
  'MCF-DEFINE-PRODUCT',
  'MCF-DESIGN-EXPERIENCE',
  'MCF-DESIGN-ARCHITECTURE',
  'MCF-TRACE-MISSION',
  'MCF-EVALUATE-AGENTS',
  'MCF-SECURITY-REVIEW',
]);

type CiQueryConclusion = 'SUCCESS' | 'FAILURE' | 'CANCELLED' | 'IN_PROGRESS';

export interface ExecuteSkillInput {
  skillId: string;
  agentId: string;
  inputs: Record<string, unknown>;
  tool: McfToolRequest & { externalReceipt?: McfToolReceipt | undefined };
  executionContext?: ExternalActionExecutionContext | undefined;
}

export interface ExecuteSkillOutcome {
  skill: McfSkillDefinition;
  receipt: McfToolReceipt | null;
  evidenceStatus: McfEvidenceValidationStatus;
  phaseState: McfPhaseState;
  missionState: McfMissionState;
  handoffTo: string | null;
  rejectionReason: string | null;
  externalAction: ExternalActionTrace | null;
}

function hasInput(inputs: Record<string, unknown>, key: string): boolean {
  return Object.hasOwn(inputs, key) && inputs[key] !== undefined && inputs[key] !== null;
}

function resolveHandoff(skill: McfSkillDefinition, inputs: Record<string, unknown>): string {
  if (skill.handoffTo !== 'selected_domain_agent') {
    return skill.handoffTo;
  }

  const selected = inputs.selected_domain_agent;
  if (typeof selected !== 'string' || selected.trim().length === 0) {
    throw new McfSkillInputError(skill.skillId, ['selected_domain_agent']);
  }
  return selected.trim();
}

function ledgerFailureTrace(trace: ExternalActionTrace | null): ExternalActionTrace {
  return {
    status: 'FAILED',
    adapterId: trace?.adapterId ?? null,
    attemptId: trace?.attemptId ?? null,
    failureCode: 'LEDGER_FAILURE',
    retryable: true,
  };
}

function isRunTestsCiQueryReceipt(receipt: McfToolReceipt, skill: McfSkillDefinition): boolean {
  return (
    skill.skillId === 'MCF-RUN-TESTS' &&
    canonicalizeProvider(receipt.provider) === 'github' &&
    canonicalizeToolValue(receipt.operation) === 'query-ci'
  );
}

function isGitHubBranchPrReceipt(receipt: McfToolReceipt, skill: McfSkillDefinition): boolean {
  return (
    skill.skillId === 'MCF-GIT-PR-RELEASE' &&
    canonicalizeProvider(receipt.provider) === 'github' &&
    canonicalizeToolValue(receipt.operation) === 'create-branch-pr'
  );
}

function isGitHubPrCollaborationReceipt(
  receipt: McfToolReceipt,
  skill: McfSkillDefinition,
): boolean {
  const operation = canonicalizeToolValue(receipt.operation);
  return (
    skill.skillId === 'MCF-GIT-PR-RELEASE' &&
    canonicalizeProvider(receipt.provider) === 'github' &&
    ['comment-pr', 'review-pr-comment', 'update-pr-text-metadata'].includes(operation)
  );
}

function isGitHubStagingDeployReceipt(receipt: McfToolReceipt, skill: McfSkillDefinition): boolean {
  return (
    skill.skillId === 'MCF-DEPLOY-VALIDATE' &&
    receipt.provider === 'github-actions' &&
    canonicalizeToolValue(receipt.operation) === 'deploy-staging'
  );
}

function readCiQueryConclusion(receipt: McfToolReceipt): CiQueryConclusion | null {
  const conclusion = receipt.metadata.conclusion;
  return conclusion === 'SUCCESS' ||
    conclusion === 'FAILURE' ||
    conclusion === 'CANCELLED' ||
    conclusion === 'IN_PROGRESS'
    ? conclusion
    : null;
}

@Injectable()
export class SkillExecutor {
  constructor(
    private readonly registry: SkillRegistryLoader,
    private readonly permissions: PermissionEngine,
    private readonly evidence: EvidenceValidator,
    private readonly externalActions?: ExternalActionDispatcher,
  ) {}

  async execute(input: ExecuteSkillInput): Promise<ExecuteSkillOutcome> {
    const skill = await this.registry.load(input.skillId);
    if (!executableSkills.has(skill.skillId)) {
      throw new McfSkillNotExecutableError(skill.skillId);
    }

    const missingInputs = skill.requiredInputs.filter(
      (required) => !hasInput(input.inputs, required),
    );
    if (missingInputs.length > 0) {
      throw new McfSkillInputError(skill.skillId, missingInputs);
    }

    if (
      canonicalizeProvider(input.tool.provider) === 'internal' &&
      !internalSkills.has(skill.skillId)
    ) {
      throw new McfPermissionDeniedError(
        'internal execution is restricted to planning and observability skills',
      );
    }
    if (
      isGovernedAgentInternalSkill(skill.skillId) &&
      canonicalizeProvider(input.tool.provider) !== 'internal'
    ) {
      throw new McfPermissionDeniedError(
        `${skill.skillId} governed execution is restricted to the internal provider`,
      );
    }

    this.permissions.assertAllowed(skill, input.agentId, input.tool, input.inputs);
    const handoffTo = resolveHandoff(skill, input.inputs);

    if (canonicalizeProvider(input.tool.provider) === 'internal') {
      let executionEvidence: Record<string, unknown> | null;
      try {
        executionEvidence = collectInternalExecutionEvidence(skill, input.inputs);
      } catch (error) {
        if (!(error instanceof McfEvidenceRejectedError)) throw error;
        return {
          skill,
          receipt: null,
          evidenceStatus: 'INVALID',
          phaseState: 'RECOVERING',
          missionState: 'RECOVERING',
          handoffTo: null,
          rejectionReason: error.message,
          externalAction: null,
        };
      }

      const receipt = this.evidence.createInternalReceipt(input.tool, {
        skillId: skill.skillId,
        skillVersion: skill.version,
        agentId: input.agentId,
        handoffTo,
        requiredInputs: skill.requiredInputs,
        executionSteps: skill.executionSteps,
        inputKeys: Object.keys(input.inputs).sort(),
        ...(executionEvidence ? { executionEvidence } : {}),
      });
      try {
        this.evidence.verifyForSkill(receipt, input.tool, skill, input.inputs, {
          agentId: input.agentId,
          executionContext: input.executionContext,
        });
        verifyInternalExecutionReceipt(receipt, skill);
      } catch (error) {
        if (!(error instanceof McfEvidenceRejectedError)) throw error;
        return {
          skill,
          receipt,
          evidenceStatus: 'INVALID',
          phaseState: 'RECOVERING',
          missionState: 'RECOVERING',
          handoffTo: null,
          rejectionReason: error.message,
          externalAction: null,
        };
      }
      return {
        skill,
        receipt,
        evidenceStatus: 'VALID',
        phaseState: 'COMPLETED',
        missionState: 'EXECUTING',
        handoffTo,
        rejectionReason: null,
        externalAction: null,
      };
    }

    let receipt = input.tool.externalReceipt;
    let externalAction: ExternalActionTrace | null = receipt
      ? {
          status: 'EXTERNAL_RECEIPT',
          adapterId: null,
          attemptId: null,
          failureCode: null,
          retryable: null,
        }
      : null;

    if (!receipt && this.externalActions) {
      const dispatched = await this.externalActions.dispatch({
        skill,
        agentId: input.agentId,
        inputs: input.inputs,
        tool: input.tool,
        context: input.executionContext,
      });

      if (dispatched.status === 'FAILED') {
        return {
          skill,
          receipt: null,
          evidenceStatus: 'INVALID',
          phaseState: 'RECOVERING',
          missionState: 'RECOVERING',
          handoffTo: null,
          rejectionReason: `${dispatched.failure.code}: ${dispatched.failure.message}`,
          externalAction: {
            status: 'FAILED',
            adapterId: dispatched.adapterId,
            attemptId: dispatched.attemptId,
            failureCode: dispatched.failure.code,
            retryable: dispatched.failure.retryable,
          },
        };
      }

      if (dispatched.status === 'UNKNOWN') {
        return {
          skill,
          receipt: dispatched.receipt,
          evidenceStatus: 'PENDING',
          phaseState: 'RECOVERING',
          missionState: 'RECOVERING',
          handoffTo: null,
          rejectionReason: `${dispatched.failure.code}: ${dispatched.failure.message}`,
          externalAction: {
            status: 'UNKNOWN',
            adapterId: dispatched.adapterId,
            attemptId: dispatched.attemptId,
            failureCode: dispatched.failure.code,
            retryable: false,
          },
        };
      }

      if (dispatched.status === 'EXECUTED') {
        receipt = dispatched.receipt;
        externalAction = {
          status: 'EXECUTED',
          adapterId: dispatched.adapterId,
          attemptId: dispatched.attemptId,
          failureCode: null,
          retryable: null,
        };
      } else {
        externalAction = {
          status: 'NOT_HANDLED',
          adapterId: null,
          attemptId: null,
          failureCode: null,
          retryable: null,
        };
      }
    }

    if (!receipt) {
      return {
        skill,
        receipt: null,
        evidenceStatus: 'PENDING',
        phaseState: 'WAITING_EVIDENCE',
        missionState: 'WAITING_EXTERNAL',
        handoffTo: null,
        rejectionReason: null,
        externalAction,
      };
    }

    try {
      if (isGitHubBranchPrReceipt(receipt, skill)) {
        this.evidence.verify(receipt, input.tool);
        verifyGitHubBranchPrEvidence(receipt, input.tool, skill, input.inputs, {
          agentId: input.agentId,
          executionContext: input.executionContext,
        });
      } else if (isGitHubPrCollaborationReceipt(receipt, skill)) {
        this.evidence.verify(receipt, input.tool);
        verifyGitHubPrCollaborationEvidence(receipt, input.tool, skill, input.inputs, {
          agentId: input.agentId,
          executionContext: input.executionContext,
        });
      } else if (isGitHubStagingDeployReceipt(receipt, skill)) {
        this.evidence.verify(receipt, input.tool);
        verifyGitHubStagingDeployEvidence(receipt, input.tool, skill, input.inputs, {
          agentId: input.agentId,
          executionContext: input.executionContext,
        });
      } else {
        this.evidence.verifyForSkill(receipt, input.tool, skill, input.inputs, {
          agentId: input.agentId,
          executionContext: input.executionContext,
        });
      }

      if (receipt.status !== 'SUCCEEDED') {
        const reason = `tool receipt status is ${receipt.status}`;
        const ledgerFailure = await this.recordEvidenceRejected(
          externalAction,
          receipt.receiptId,
          reason,
        );
        return {
          skill,
          receipt,
          evidenceStatus: 'INVALID',
          phaseState: 'RECOVERING',
          missionState: 'RECOVERING',
          handoffTo: null,
          rejectionReason: ledgerFailure ?? reason,
          externalAction: ledgerFailure ? ledgerFailureTrace(externalAction) : externalAction,
        };
      }

      if (isRunTestsCiQueryReceipt(receipt, skill)) {
        const conclusion = readCiQueryConclusion(receipt);
        if (conclusion === 'IN_PROGRESS') {
          return {
            skill,
            receipt,
            evidenceStatus: 'PENDING',
            phaseState: 'WAITING_EVIDENCE',
            missionState: 'WAITING_EXTERNAL',
            handoffTo: null,
            rejectionReason: null,
            externalAction,
          };
        }
        if (conclusion !== 'SUCCESS') {
          const reason = conclusion
            ? `CI conclusion ${conclusion} does not satisfy all_critical_tests_pass`
            : 'CI query receipt is missing a supported conclusion';
          const ledgerFailure = await this.recordEvidenceRejected(
            externalAction,
            receipt.receiptId,
            reason,
          );
          return {
            skill,
            receipt,
            evidenceStatus: 'INVALID',
            phaseState: 'RECOVERING',
            missionState: 'RECOVERING',
            handoffTo: null,
            rejectionReason: ledgerFailure ?? reason,
            externalAction: ledgerFailure ? ledgerFailureTrace(externalAction) : externalAction,
          };
        }
      }

      if (
        isGitHubStagingDeployReceipt(receipt, skill) &&
        stagingDeploymentOutcome(receipt) === 'RECOVERED'
      ) {
        const reason = 'staging release was rejected and the previous healthy SHA was restored';
        const ledgerFailure = await this.recordEvidenceRejected(
          externalAction,
          receipt.receiptId,
          reason,
        );
        return {
          skill,
          receipt,
          evidenceStatus: 'INVALID',
          phaseState: 'RECOVERING',
          missionState: 'RECOVERING',
          handoffTo: null,
          rejectionReason: ledgerFailure ?? reason,
          externalAction: ledgerFailure ? ledgerFailureTrace(externalAction) : externalAction,
        };
      }

      const ledgerFailure = await this.recordEvidenceValidated(externalAction, receipt.receiptId);
      if (ledgerFailure) {
        return {
          skill,
          receipt,
          evidenceStatus: 'INVALID',
          phaseState: 'RECOVERING',
          missionState: 'RECOVERING',
          handoffTo: null,
          rejectionReason: ledgerFailure,
          externalAction: ledgerFailureTrace(externalAction),
        };
      }

      return {
        skill,
        receipt,
        evidenceStatus: 'VALID',
        phaseState: 'COMPLETED',
        missionState: 'EXECUTING',
        handoffTo,
        rejectionReason: null,
        externalAction,
      };
    } catch (error) {
      if (!(error instanceof McfEvidenceRejectedError)) {
        throw error;
      }

      const ledgerFailure = await this.recordEvidenceRejected(
        externalAction,
        receipt.receiptId,
        error.message,
      );
      return {
        skill,
        receipt,
        evidenceStatus: 'INVALID',
        phaseState: 'RECOVERING',
        missionState: 'RECOVERING',
        handoffTo: null,
        rejectionReason: ledgerFailure ?? error.message,
        externalAction: ledgerFailure ? ledgerFailureTrace(externalAction) : externalAction,
      };
    }
  }

  private async recordEvidenceValidated(
    trace: ExternalActionTrace | null,
    receiptId: string,
  ): Promise<string | null> {
    if (!this.externalActions || trace?.status !== 'EXECUTED' || !trace.attemptId) {
      return null;
    }
    try {
      await this.externalActions.recordEvidenceValidated(trace.attemptId, receiptId);
      return null;
    } catch (error) {
      return `LEDGER_FAILURE: ${error instanceof Error ? error.message : 'failed to persist evidence validation'}`;
    }
  }

  private async recordEvidenceRejected(
    trace: ExternalActionTrace | null,
    receiptId: string | null,
    reason: string,
  ): Promise<string | null> {
    if (!this.externalActions || trace?.status !== 'EXECUTED' || !trace.attemptId) {
      return null;
    }
    try {
      await this.externalActions.recordEvidenceRejected(trace.attemptId, receiptId, reason);
      return null;
    } catch (error) {
      return `LEDGER_FAILURE: ${error instanceof Error ? error.message : 'failed to persist evidence rejection'}`;
    }
  }
}
