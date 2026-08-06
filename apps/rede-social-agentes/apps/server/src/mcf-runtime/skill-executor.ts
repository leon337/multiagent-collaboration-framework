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
import type { ExternalActionTrace } from './external-action.contracts.js';
import {
  McfEvidenceRejectedError,
  McfPermissionDeniedError,
  McfSkillInputError,
  McfSkillNotExecutableError,
} from './mcf-runtime.errors.js';
import type { PermissionEngine } from './permission-engine.js';
import { type McfToolRequest } from './permission-engine.js';
import type { SkillRegistryLoader } from './skill-registry.loader.js';

const executableSkills = new Set([
  'MCF-START-MISSION',
  'MCF-SELECT-AGENTS',
  'MCF-IMPLEMENT-CHANGE',
  'MCF-REVIEW-CODE',
  'MCF-RUN-TESTS',
  'MCF-GIT-PR-RELEASE',
  'MCF-DEPLOY-VALIDATE',
  'MCF-TRACE-MISSION',
]);

const internalSkills = new Set(['MCF-START-MISSION', 'MCF-SELECT-AGENTS', 'MCF-TRACE-MISSION']);

export interface ExecuteSkillInput {
  skillId: string;
  agentId: string;
  inputs: Record<string, unknown>;
  tool: McfToolRequest & { externalReceipt?: McfToolReceipt | undefined };
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

    if (input.tool.provider === 'internal' && !internalSkills.has(skill.skillId)) {
      throw new McfPermissionDeniedError(
        'internal execution is restricted to planning and observability skills',
      );
    }

    this.permissions.assertAllowed(skill, input.agentId, input.tool, input.inputs);
    const handoffTo = resolveHandoff(skill, input.inputs);

    if (input.tool.provider === 'internal') {
      const receipt = this.evidence.createInternalReceipt(input.tool, {
        skillId: skill.skillId,
        skillVersion: skill.version,
        agentId: input.agentId,
        handoffTo,
        requiredInputs: skill.requiredInputs,
        executionSteps: skill.executionSteps,
        inputKeys: Object.keys(input.inputs).sort(),
      });
      this.evidence.verifyForSkill(receipt, input.tool, skill);
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
            failureCode: dispatched.failure.code,
            retryable: dispatched.failure.retryable,
          },
        };
      }

      if (dispatched.status === 'EXECUTED') {
        receipt = dispatched.receipt;
        externalAction = {
          status: 'EXECUTED',
          adapterId: dispatched.adapterId,
          failureCode: null,
          retryable: null,
        };
      } else {
        externalAction = {
          status: 'NOT_HANDLED',
          adapterId: null,
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
      this.evidence.verifyForSkill(receipt, input.tool, skill);
      if (receipt.status !== 'SUCCEEDED') {
        return {
          skill,
          receipt,
          evidenceStatus: 'INVALID',
          phaseState: 'RECOVERING',
          missionState: 'RECOVERING',
          handoffTo: null,
          rejectionReason: `tool receipt status is ${receipt.status}`,
          externalAction,
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
      return {
        skill,
        receipt,
        evidenceStatus: 'INVALID',
        phaseState: 'RECOVERING',
        missionState: 'RECOVERING',
        handoffTo: null,
        rejectionReason: error.message,
        externalAction,
      };
    }
  }
}
