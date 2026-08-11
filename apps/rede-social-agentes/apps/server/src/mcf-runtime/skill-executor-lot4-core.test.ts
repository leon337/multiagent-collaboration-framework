import type { McfSkillDefinition } from '@rsa/contracts';
import { beforeEach, describe, expect, it } from 'vitest';

import { EvidenceValidator } from './evidence-validator.js';
import { PermissionEngine } from './permission-engine.js';
import { SkillExecutor } from './skill-executor.js';
import type { SkillRegistryLoader } from './skill-registry.loader.js';

function definition(input: {
  skillId: string;
  ownerAgent: string;
  requiredInputs: string[];
  permissionProfile: McfSkillDefinition['permissionProfile'];
  handoffTo: string;
}): McfSkillDefinition {
  return {
    skillId: input.skillId,
    name: input.skillId,
    version: '1.0.0',
    purpose: 'Lot 4 internal core test skill.',
    ownerAgents: [input.ownerAgent],
    requiredInputs: input.requiredInputs,
    allowedTools: ['GitHub', 'Notion'],
    forbiddenTools: ['invent_missing_content'],
    permissionProfile: input.permissionProfile,
    executionSteps: ['execute', 'collect_evidence'],
    requiredEvidence: ['semantic_evidence'],
    acceptanceCriteria: ['semantic_evidence_valid'],
    failureModes: ['evidence_missing'],
    fallback: 'Record a verifiable recovery state.',
    handoffTo: input.handoffTo,
  };
}

const skills = new Map<string, McfSkillDefinition>([
  [
    'MCF-RECOVER-CONTEXT',
    definition({
      skillId: 'MCF-RECOVER-CONTEXT',
      ownerAgent: 'Miriam',
      requiredInputs: ['project_or_mission_reference'],
      permissionProfile: 'READ_ONLY',
      handoffTo: 'Mestre',
    }),
  ],
  [
    'MCF-DEFINE-PRODUCT',
    definition({
      skillId: 'MCF-DEFINE-PRODUCT',
      ownerAgent: 'Leonardo',
      requiredInputs: ['idea_or_problem'],
      permissionProfile: 'READ_AND_PROPOSE',
      handoffTo: 'Sofia',
    }),
  ],
  [
    'MCF-DESIGN-EXPERIENCE',
    definition({
      skillId: 'MCF-DESIGN-EXPERIENCE',
      ownerAgent: 'Evelyn',
      requiredInputs: ['product_requirements'],
      permissionProfile: 'READ_AND_PROPOSE',
      handoffTo: 'Sofia',
    }),
  ],
  [
    'MCF-DESIGN-ARCHITECTURE',
    definition({
      skillId: 'MCF-DESIGN-ARCHITECTURE',
      ownerAgent: 'Sofia',
      requiredInputs: ['requirements', 'constraints'],
      permissionProfile: 'READ_AND_PROPOSE',
      handoffTo: 'Rafael',
    }),
  ],
]);

function createExecutor(): SkillExecutor {
  const registry = {
    load: async (skillId: string) => {
      const skill = skills.get(skillId);
      if (!skill) throw new Error(`missing ${skillId}`);
      return skill;
    },
  } as SkillRegistryLoader;
  return new SkillExecutor(registry, new PermissionEngine(), new EvidenceValidator());
}

beforeEach(() => {
  process.env.DATABASE_URL = 'postgresql://rsa:rsa@127.0.0.1:5432/rsa';
  process.env.MCF_RECEIPT_SECRET = 'test-only-mcf-receipt-secret-lot4-core-0001';
});

describe('SkillExecutor Lot 4 core internal skills', () => {
  it('executes context recovery only with provenance and precedence evidence', async () => {
    const result = await createExecutor().execute({
      skillId: 'MCF-RECOVER-CONTEXT',
      agentId: 'Miriam',
      inputs: {
        project_or_mission_reference: 'MCF-RUNTIME-006',
        execution_evidence: {
          source_references: ['README.md@sha', 'docs/runtime/MCF-RUNTIME-006-PLAN.md@sha'],
          precedence_decisions: ['GitHub main overrides transferred checkpoint when divergent'],
          contradictions: [],
        },
      },
      tool: { provider: 'internal', operation: 'inspect-context', resource: 'mcf-agent-runtime' },
    });

    expect(result).toMatchObject({
      evidenceStatus: 'VALID',
      phaseState: 'COMPLETED',
      missionState: 'EXECUTING',
      handoffTo: 'Mestre',
    });
    expect(result.receipt?.metadata.executionEvidence).toEqual({
      source_references: ['README.md@sha', 'docs/runtime/MCF-RUNTIME-006-PLAN.md@sha'],
      precedence_decisions: ['GitHub main overrides transferred checkpoint when divergent'],
      contradictions: [],
    });
  });

  it('executes product definition with bounded requirements and acceptance evidence', async () => {
    const result = await createExecutor().execute({
      skillId: 'MCF-DEFINE-PRODUCT',
      agentId: 'Leonardo',
      inputs: {
        idea_or_problem: 'Transform an idea into a bounded product definition.',
        execution_evidence: {
          problem_statement: 'The idea lacks an executable and testable product boundary.',
          requirements: ['Define target users', 'Define MVP scope'],
          acceptance_criteria: ['Problem is explicit', 'MVP is bounded'],
        },
      },
      tool: { provider: 'internal', operation: 'plan-product', resource: 'mcf-agent-runtime' },
    });

    expect(result).toMatchObject({ evidenceStatus: 'VALID', handoffTo: 'Sofia' });
  });

  it('executes experience design with flow, screen and accessibility evidence', async () => {
    const result = await createExecutor().execute({
      skillId: 'MCF-DESIGN-EXPERIENCE',
      agentId: 'Evelyn',
      inputs: {
        product_requirements: ['Primary user can complete the critical flow'],
        execution_evidence: {
          flow_reference: 'artifacts/design/user-flow.md',
          screen_reference: { artifact: 'figma-or-wireframe', version: 1 },
          accessibility_findings: [],
        },
      },
      tool: {
        provider: 'internal',
        operation: 'design-experience',
        resource: 'mcf-agent-runtime',
      },
    });

    expect(result).toMatchObject({ evidenceStatus: 'VALID', handoffTo: 'Sofia' });
  });

  it('executes architecture design with decisions and explicit risk evidence', async () => {
    const result = await createExecutor().execute({
      skillId: 'MCF-DESIGN-ARCHITECTURE',
      agentId: 'Sofia',
      inputs: {
        requirements: ['Persist mission state'],
        constraints: ['No production release'],
        execution_evidence: {
          architecture_diagram: 'docs/runtime/architecture.mmd',
          decisions: ['MissionRuntime remains the persistence boundary'],
          risks: ['Evidence cannot be inferred from a signed empty receipt'],
        },
      },
      tool: {
        provider: 'internal',
        operation: 'design-architecture',
        resource: 'mcf-agent-runtime',
      },
    });

    expect(result).toMatchObject({ evidenceStatus: 'VALID', handoffTo: 'Rafael' });
  });

  it('enters recovery instead of fabricating success when semantic evidence is missing', async () => {
    const result = await createExecutor().execute({
      skillId: 'MCF-DEFINE-PRODUCT',
      agentId: 'Leonardo',
      inputs: { idea_or_problem: 'Undefined product.' },
      tool: { provider: 'internal', operation: 'plan-product', resource: 'mcf-agent-runtime' },
    });

    expect(result).toMatchObject({
      receipt: null,
      evidenceStatus: 'INVALID',
      phaseState: 'RECOVERING',
      missionState: 'RECOVERING',
      handoffTo: null,
    });
    expect(result.rejectionReason).toMatch(/execution_evidence/u);
  });

  it('rejects incomplete semantic evidence without creating a handoff', async () => {
    const result = await createExecutor().execute({
      skillId: 'MCF-DESIGN-ARCHITECTURE',
      agentId: 'Sofia',
      inputs: {
        requirements: ['Persist mission state'],
        constraints: ['No production release'],
        execution_evidence: {
          architecture_diagram: 'diagram',
          decisions: [],
          risks: [],
        },
      },
      tool: {
        provider: 'internal',
        operation: 'design-architecture',
        resource: 'mcf-agent-runtime',
      },
    });

    expect(result.evidenceStatus).toBe('INVALID');
    expect(result.handoffTo).toBeNull();
    expect(result.rejectionReason).toMatch(/decisions/u);
  });

  it('blocks external providers at the Lot 4A boundary', async () => {
    await expect(
      createExecutor().execute({
        skillId: 'MCF-RECOVER-CONTEXT',
        agentId: 'Miriam',
        inputs: {
          project_or_mission_reference: 'MCF-RUNTIME-006',
          execution_evidence: {
            source_references: ['README.md@sha'],
            precedence_decisions: ['main wins'],
            contradictions: [],
          },
        },
        tool: {
          provider: 'github',
          operation: 'read',
          resource: 'leon337/multiagent-collaboration-framework',
        },
      }),
    ).rejects.toThrow(/internal provider/u);
  });

  it('normalizes the governed internal provider before selecting the internal execution path', async () => {
    const result = await createExecutor().execute({
      skillId: 'MCF-DEFINE-PRODUCT',
      agentId: 'Leonardo',
      inputs: {
        idea_or_problem: 'Normalize the governed provider boundary.',
        execution_evidence: {
          problem_statement: 'Provider normalization must not change the governed execution path.',
          requirements: ['Keep internal execution governed'],
          acceptance_criteria: ['Canonical internal provider completes with validated evidence'],
        },
      },
      tool: { provider: ' Internal ', operation: 'plan-product', resource: 'mcf-agent-runtime' },
    });

    expect(result).toMatchObject({
      evidenceStatus: 'VALID',
      phaseState: 'COMPLETED',
      handoffTo: 'Sofia',
    });
  });

  it('rejects non-semantic array items instead of accepting placeholder evidence', async () => {
    const result = await createExecutor().execute({
      skillId: 'MCF-DEFINE-PRODUCT',
      agentId: 'Leonardo',
      inputs: {
        idea_or_problem: 'Reject placeholder evidence.',
        execution_evidence: {
          problem_statement: 'Array evidence must contain meaningful items.',
          requirements: [''],
          acceptance_criteria: ['Criterion'],
        },
      },
      tool: { provider: 'internal', operation: 'plan-product', resource: 'mcf-agent-runtime' },
    });

    expect(result).toMatchObject({
      evidenceStatus: 'INVALID',
      phaseState: 'RECOVERING',
      handoffTo: null,
    });
    expect(result.rejectionReason).toMatch(/requirements/u);
  });

  it('preserves owner-agent permission enforcement', async () => {
    await expect(
      createExecutor().execute({
        skillId: 'MCF-DEFINE-PRODUCT',
        agentId: 'Rafael',
        inputs: {
          idea_or_problem: 'Product definition.',
          execution_evidence: {
            problem_statement: 'Problem',
            requirements: ['Requirement'],
            acceptance_criteria: ['Criterion'],
          },
        },
        tool: { provider: 'internal', operation: 'plan-product', resource: 'mcf-agent-runtime' },
      }),
    ).rejects.toThrow(/not an owner/u);
  });
});
