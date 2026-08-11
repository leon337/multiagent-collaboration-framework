import { describe, expect, it } from 'vitest';

import { EvidenceValidator } from './evidence-validator.js';
import { McfPermissionDeniedError } from './mcf-runtime.errors.js';
import { PermissionEngine } from './permission-engine.js';
import { SkillExecutor } from './skill-executor.js';
import { SkillRegistryLoader } from './skill-registry.loader.js';

function createExecutor(): SkillExecutor {
  return new SkillExecutor(
    new SkillRegistryLoader(),
    new PermissionEngine(),
    new EvidenceValidator(),
  );
}

function validInputs(): Record<string, unknown> {
  return {
    behavior_or_configuration: 'Evaluate routing behavior for the current agent contract.',
    criteria: ['consistent handoff', 'evidence fidelity'],
    execution_evidence: {
      test_cases: [
        { id: 'routing-1', input: 'handoff after evaluation', expected: 'Emily' },
        { id: 'evidence-1', input: 'missing scorecard', expected: 'RECOVERING' },
      ],
      scores: { consistency: 0.96, evidence_fidelity: 0.94 },
      regressions: [],
    },
  };
}

describe('SkillExecutor Lot 4B MCF-EVALUATE-AGENTS', () => {
  it('completes a reproducible governed agent evaluation and hands off to Emily', async () => {
    const result = await createExecutor().execute({
      skillId: 'MCF-EVALUATE-AGENTS',
      agentId: 'Beatriz',
      inputs: validInputs(),
      tool: {
        provider: 'internal',
        operation: 'inspect-agent-evaluation',
        resource: 'mcf-agent-runtime',
      },
    });

    expect(result).toMatchObject({
      evidenceStatus: 'VALID',
      phaseState: 'COMPLETED',
      missionState: 'EXECUTING',
      handoffTo: 'Emily',
      rejectionReason: null,
    });
    expect(result.receipt?.metadata.executionEvidence).toMatchObject({
      scores: { consistency: 0.96, evidence_fidelity: 0.94 },
      regressions: [],
    });
  });

  it('accepts Tiago as a canonical owner', async () => {
    const result = await createExecutor().execute({
      skillId: 'MCF-EVALUATE-AGENTS',
      agentId: 'Tiago',
      inputs: validInputs(),
      tool: {
        provider: 'internal',
        operation: 'inspect-agent-evaluation',
        resource: 'mcf-agent-runtime',
      },
    });

    expect(result.evidenceStatus).toBe('VALID');
  });

  it('moves to recovery when execution evidence is absent', async () => {
    const result = await createExecutor().execute({
      skillId: 'MCF-EVALUATE-AGENTS',
      agentId: 'Beatriz',
      inputs: {
        behavior_or_configuration: 'Evaluate behavior.',
        criteria: ['reproducible'],
      },
      tool: {
        provider: 'internal',
        operation: 'inspect-agent-evaluation',
        resource: 'mcf-agent-runtime',
      },
    });

    expect(result).toMatchObject({
      evidenceStatus: 'INVALID',
      phaseState: 'RECOVERING',
      handoffTo: null,
    });
    expect(result.rejectionReason).toMatch(/execution_evidence/u);
  });

  it('rejects placeholder test cases', async () => {
    const inputs = validInputs();
    inputs.execution_evidence = {
      test_cases: [''],
      scores: { consistency: 0.9 },
      regressions: [],
    };

    const result = await createExecutor().execute({
      skillId: 'MCF-EVALUATE-AGENTS',
      agentId: 'Beatriz',
      inputs,
      tool: {
        provider: 'internal',
        operation: 'inspect-agent-evaluation',
        resource: 'mcf-agent-runtime',
      },
    });

    expect(result.phaseState).toBe('RECOVERING');
    expect(result.rejectionReason).toMatch(/test_cases/u);
  });

  it('rejects an empty scorecard', async () => {
    const inputs = validInputs();
    inputs.execution_evidence = {
      test_cases: [{ id: 'case-1', expected: 'pass' }],
      scores: {},
      regressions: [],
    };

    const result = await createExecutor().execute({
      skillId: 'MCF-EVALUATE-AGENTS',
      agentId: 'Beatriz',
      inputs,
      tool: {
        provider: 'internal',
        operation: 'inspect-agent-evaluation',
        resource: 'mcf-agent-runtime',
      },
    });

    expect(result.phaseState).toBe('RECOVERING');
    expect(result.rejectionReason).toMatch(/scores/u);
  });

  it('requires regressions evidence even when no regression exists', async () => {
    const inputs = validInputs();
    inputs.execution_evidence = {
      test_cases: [{ id: 'case-1', expected: 'pass' }],
      scores: { consistency: 1 },
    };

    const result = await createExecutor().execute({
      skillId: 'MCF-EVALUATE-AGENTS',
      agentId: 'Beatriz',
      inputs,
      tool: {
        provider: 'internal',
        operation: 'inspect-agent-evaluation',
        resource: 'mcf-agent-runtime',
      },
    });

    expect(result.phaseState).toBe('RECOVERING');
    expect(result.rejectionReason).toMatch(/regressions/u);
  });

  it('rejects a non-owner evaluator', async () => {
    await expect(
      createExecutor().execute({
        skillId: 'MCF-EVALUATE-AGENTS',
        agentId: 'Rafael',
        inputs: validInputs(),
        tool: {
          provider: 'internal',
          operation: 'inspect-agent-evaluation',
          resource: 'mcf-agent-runtime',
        },
      }),
    ).rejects.toBeInstanceOf(McfPermissionDeniedError);
  });

  it('rejects external provider execution for the governed evaluation skill', async () => {
    await expect(
      createExecutor().execute({
        skillId: 'MCF-EVALUATE-AGENTS',
        agentId: 'Beatriz',
        inputs: validInputs(),
        tool: { provider: 'github', operation: 'inspect-code', resource: 'repository' },
      }),
    ).rejects.toBeInstanceOf(McfPermissionDeniedError);
  });
});
