import { Injectable } from '@nestjs/common';
import type {
  McfEvidenceValidationStatus,
  McfMissionState,
  McfPhaseState,
  McfSkillDefinition,
  McfToolReceipt,
} from '@rsa/contracts';

import {
  McfEvidenceRejectedError,
  McfPermissionDeniedError,
  McfSkillInputError,
  McfSkillNotExecutableError,
} from './mcf-runtime.errors.js';
import { EvidenceValidator } from './evidence-validator.js';
import { PermissionEngine, type McfToolRequest } from './permission-engine.js';
import { SkillRegistryLoader } from './skill-registry.loader.js';

const executableSkills = new Set([
  'MCF-START-MISSION',
  'MCF-IMPLEMENT-CHANGE',
  'MCF-RUN-TESTS',
]);

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
}

function hasInput(inputs: Record<string, unknown>, key: string): boolean {
  return Object.hasOwn(inputs, key) && inputs[key] !== undefined && inputs[key] !== null;
}

@Injectable()
export class SkillExecutor {
  constructor(
    private readonly registry: SkillRegistryLoader,
    private readonly permissions: PermissionEngine,
    private readonly evidence: EvidenceValidator,
  ) {}

  async execute(input: ExecuteSkillInput): Promise<ExecuteSkillOutcome> {
    const skill = await this.registry.load(input.skillId);
    if (!executableSkills.has(skill.skillId)) {
      throw new McfSkillNotExecutableError(skill.skillId);
    }

    const missingInputs = skill.requiredInputs.filter((required) => !hasInput(input.inputs, required));
    if (missingInputs.length > 0) {
      throw new McfSkillInputError(skill.skillId, missingInputs);
    }

    if (input.tool.provider === 'internal' && skill.skillId !== 'MCF-START-MISSION') {
      throw new McfPermissionDeniedError(
        'internal execution is restricted to MCF-START-MISSION in the MVP runtime',
      );
    }

    this.permissions.assertAllowed(skill, input.agentId, input.tool, input.inputs);

    if (input.tool.provider === 'internal') {
      const receipt = this.evidence.createInternalReceipt(input.tool, {
        skillId: skill.skillId,
        skillVersion: skill.version,
        agentId: input.agentId,
        requiredInputs: skill.requiredInputs,
        executionSteps: skill.executionSteps,
      });
      this.evidence.verify(receipt, input.tool);
      return {
        skill,
        receipt,
        evidenceStatus: 'VALID',
        phaseState: 'COMPLETED',
        missionState: 'EXECUTING',
        handoffTo: skill.handoffTo,
        rejectionReason: null,
      };
    }

    if (!input.tool.externalReceipt) {
      return {
        skill,
        receipt: null,
        evidenceStatus: 'PENDING',
        phaseState: 'WAITING_EVIDENCE',
        missionState: 'WAITING_EXTERNAL',
        handoffTo: null,
        rejectionReason: null,
      };
    }

    try {
      this.evidence.verify(input.tool.externalReceipt, input.tool);
      if (input.tool.externalReceipt.status !== 'SUCCEEDED') {
        return {
          skill,
          receipt: input.tool.externalReceipt,
          evidenceStatus: 'INVALID',
          phaseState: 'RECOVERING',
          missionState: 'RECOVERING',
          handoffTo: null,
          rejectionReason: `tool receipt status is ${input.tool.externalReceipt.status}`,
        };
      }

      return {
        skill,
        receipt: input.tool.externalReceipt,
        evidenceStatus: 'VALID',
        phaseState: 'COMPLETED',
        missionState: skill.skillId === 'MCF-RUN-TESTS' ? 'COMPLETED' : 'EXECUTING',
        handoffTo: skill.handoffTo,
        rejectionReason: null,
      };
    } catch (error) {
      if (!(error instanceof McfEvidenceRejectedError)) {
        throw error;
      }
      return {
        skill,
        receipt: input.tool.externalReceipt,
        evidenceStatus: 'INVALID',
        phaseState: 'RECOVERING',
        missionState: 'RECOVERING',
        handoffTo: null,
        rejectionReason: error.message,
      };
    }
  }
}
