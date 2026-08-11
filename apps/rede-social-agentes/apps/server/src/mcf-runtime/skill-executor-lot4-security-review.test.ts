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
    system_or_change: 'Internal MCF runtime security boundary for executable skills.',
    sensitiveAuthorization: true,
    execution_evidence: {
      threats: [
        { id: 'T1', threat: 'Unauthorized sensitive execution', severity: 'critical' },
        { id: 'T2', threat: 'Secret exposure in evidence', severity: 'high' },
      ],
      controls: [
        { threat_id: 'T1', control: 'SENSITIVE_CONTROLLED authorization and owner enforcement' },
        { threat_id: 'T2', control: 'Internal-only evidence with no secret material' },
      ],
      residual_risk: {
        level: 'low',
        critical_unaddressed: false,
        note: 'External sensitive tools remain out of scope.',
      },
    },
  };
}

describe('SkillExecutor Lot 4C MCF-SECURITY-REVIEW', () => {
  it('completes an internally authorized security review and hands off to Emily', async () => {
    const result = await createExecutor().execute({
      skillId: 'MCF-SECURITY-REVIEW',
      agentId: 'Ricardo',
      inputs: validInputs(),
      tool: {
        provider: 'internal',
        operation: 'inspect-security-review',
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
      residual_risk: { level: 'low', critical_unaddressed: false },
    });
  });

  it('accepts Julia as a canonical owner', async () => {
    const result = await createExecutor().execute({
      skillId: 'MCF-SECURITY-REVIEW',
      agentId: 'Julia',
      inputs: validInputs(),
      tool: {
        provider: 'internal',
        operation: 'inspect-security-review',
        resource: 'mcf-agent-runtime',
      },
    });

    expect(result.evidenceStatus).toBe('VALID');
  });

  it('denies execution without explicit sensitive authorization', async () => {
    const inputs = validInputs();
    inputs.sensitiveAuthorization = false;

    await expect(
      createExecutor().execute({
        skillId: 'MCF-SECURITY-REVIEW',
        agentId: 'Ricardo',
        inputs,
        tool: {
          provider: 'internal',
          operation: 'inspect-security-review',
          resource: 'mcf-agent-runtime',
        },
      }),
    ).rejects.toThrow(/explicit sensitive authorization/u);
  });

  it('moves to recovery when semantic evidence is absent', async () => {
    const result = await createExecutor().execute({
      skillId: 'MCF-SECURITY-REVIEW',
      agentId: 'Ricardo',
      inputs: {
        system_or_change: 'Review internal boundary.',
        sensitiveAuthorization: true,
      },
      tool: {
        provider: 'internal',
        operation: 'inspect-security-review',
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

  it('rejects placeholder threats or controls', async () => {
    const inputs = validInputs();
    inputs.execution_evidence = {
      threats: [{ threat: '   ' }],
      controls: [{ control: 'permission enforcement' }],
      residual_risk: {
        level: 'low',
        critical_unaddressed: false,
      },
    };

    const result = await createExecutor().execute({
      skillId: 'MCF-SECURITY-REVIEW',
      agentId: 'Ricardo',
      inputs,
      tool: {
        provider: 'internal',
        operation: 'inspect-security-review',
        resource: 'mcf-agent-runtime',
      },
    });

    expect(result.phaseState).toBe('RECOVERING');
    expect(result.rejectionReason).toMatch(/threats/u);
  });

  it('rejects empty residual risk evidence', async () => {
    const inputs = validInputs();
    inputs.execution_evidence = {
      threats: ['authorization bypass'],
      controls: ['permission enforcement'],
      residual_risk: {},
    };

    const result = await createExecutor().execute({
      skillId: 'MCF-SECURITY-REVIEW',
      agentId: 'Ricardo',
      inputs,
      tool: {
        provider: 'internal',
        operation: 'inspect-security-review',
        resource: 'mcf-agent-runtime',
      },
    });

    expect(result.phaseState).toBe('RECOVERING');
    expect(result.rejectionReason).toMatch(/residual_risk/u);
  });

  it('rejects unstructured residual risk that cannot prove critical-risk disposition', async () => {
    const inputs = validInputs();
    inputs.execution_evidence = {
      threats: ['authorization bypass'],
      controls: ['permission enforcement'],
      residual_risk: 'critical risk remains unaddressed',
    };

    const result = await createExecutor().execute({
      skillId: 'MCF-SECURITY-REVIEW',
      agentId: 'Ricardo',
      inputs,
      tool: {
        provider: 'internal',
        operation: 'inspect-security-review',
        resource: 'mcf-agent-runtime',
      },
    });

    expect(result.phaseState).toBe('RECOVERING');
    expect(result.handoffTo).toBeNull();
    expect(result.rejectionReason).toMatch(/structured meaningful residual_risk/u);
  });

  it('requires explicit critical_unaddressed boolean evidence', async () => {
    const inputs = validInputs();
    inputs.execution_evidence = {
      threats: ['authorization bypass'],
      controls: ['permission enforcement'],
      residual_risk: { level: 'low' },
    };

    const result = await createExecutor().execute({
      skillId: 'MCF-SECURITY-REVIEW',
      agentId: 'Ricardo',
      inputs,
      tool: {
        provider: 'internal',
        operation: 'inspect-security-review',
        resource: 'mcf-agent-runtime',
      },
    });

    expect(result.phaseState).toBe('RECOVERING');
    expect(result.handoffTo).toBeNull();
    expect(result.rejectionReason).toMatch(/critical_unaddressed boolean/u);
  });

  it('requires critical residual risk to be addressed or explicitly blocked', async () => {
    const executionEvidence = {
      threats: [{ id: 'T1', threat: 'Critical authorization bypass' }],
      controls: [{ threat_id: 'T1', control: 'Block sensitive execution' }],
      residual_risk: {
        level: 'critical',
        critical_unaddressed: true,
        blocked: false,
      },
    };
    const inputs = validInputs();
    inputs.execution_evidence = executionEvidence;

    const rejected = await createExecutor().execute({
      skillId: 'MCF-SECURITY-REVIEW',
      agentId: 'Ricardo',
      inputs,
      tool: {
        provider: 'internal',
        operation: 'inspect-security-review',
        resource: 'mcf-agent-runtime',
      },
    });

    expect(rejected.phaseState).toBe('RECOVERING');
    expect(rejected.handoffTo).toBeNull();
    expect(rejected.rejectionReason).toMatch(/critical residual risks/u);

    executionEvidence.residual_risk.blocked = true;
    const blocked = await createExecutor().execute({
      skillId: 'MCF-SECURITY-REVIEW',
      agentId: 'Ricardo',
      inputs,
      tool: {
        provider: 'internal',
        operation: 'inspect-security-review',
        resource: 'mcf-agent-runtime',
      },
    });

    expect(blocked.evidenceStatus).toBe('VALID');
    expect(blocked.handoffTo).toBe('Emily');
  });

  it('rejects explicitly forbidden secret exposure and unrestricted write operations', async () => {
    for (const operation of ['secret_exposure', 'unrestricted_write']) {
      await expect(
        createExecutor().execute({
          skillId: 'MCF-SECURITY-REVIEW',
          agentId: 'Ricardo',
          inputs: validInputs(),
          tool: {
            provider: 'internal',
            operation,
            resource: 'mcf-agent-runtime',
          },
        }),
      ).rejects.toBeInstanceOf(McfPermissionDeniedError);
    }
  });

  it('rejects a non-owner security reviewer', async () => {
    await expect(
      createExecutor().execute({
        skillId: 'MCF-SECURITY-REVIEW',
        agentId: 'Rafael',
        inputs: validInputs(),
        tool: {
          provider: 'internal',
          operation: 'inspect-security-review',
          resource: 'mcf-agent-runtime',
        },
      }),
    ).rejects.toBeInstanceOf(McfPermissionDeniedError);
  });

  it('rejects external provider execution in this restricted increment', async () => {
    await expect(
      createExecutor().execute({
        skillId: 'MCF-SECURITY-REVIEW',
        agentId: 'Ricardo',
        inputs: validInputs(),
        tool: {
          provider: 'github',
          operation: 'inspect-code',
          resource: 'repository',
        },
      }),
    ).rejects.toBeInstanceOf(McfPermissionDeniedError);
  });
});
