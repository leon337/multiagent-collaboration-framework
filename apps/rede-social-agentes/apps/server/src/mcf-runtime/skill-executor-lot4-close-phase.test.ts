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

function validEvidence(): Record<string, unknown> {
  return {
    phase_pack: {
      artifacts: [
        'PHASE-006-LOT-4-E-CLOSE-PHASE-PLAN.md',
        'PHASE-006-LOT-4-E-CLOSE-PHASE-REPORT.md',
      ],
      manifest_reference: 'PHASE-006-LOT-4-E-CLOSE-PHASE-ARTIFACT-MANIFEST.sha256',
      traceability_complete: true,
    },
    audit_verdict: {
      verdict: 'PASS',
      evidence_reference: 'audit:lot4e:emily:head-exact',
      blocking_findings: [],
    },
    leo_decision: {
      decision: 'APROVAR',
      justification: 'Acceptance criteria are evidenced and no blocking findings remain.',
      next_state: 'ENTREGUE',
      next_action: 'nenhuma',
      responsible: 'Mestre',
    },
    checkpoint: {
      final_state: 'ENTREGUE',
      objective_met: true,
      unresolved_findings: [],
      blockers: [],
      next_action: 'nenhuma',
      checkpoint_recipient: 'Mestre',
      human_action_required: false,
    },
  };
}

function validInputs(): Record<string, unknown> {
  return {
    phase_execution: 'Lot 4-E governed closeout execution',
    acceptance_results: ['traceability_complete', 'objective_state_truthful'],
    execution_evidence: validEvidence(),
  };
}

async function execute(inputs: Record<string, unknown> = validInputs(), agentId = 'Carmem') {
  return createExecutor().execute({
    skillId: 'MCF-CLOSE-PHASE',
    agentId,
    inputs,
    tool: {
      provider: 'internal',
      operation: 'close-phase',
      resource: 'mcf-agent-runtime',
    },
  });
}

describe('SkillExecutor Lot 4E MCF-CLOSE-PHASE', () => {
  it('completes a truthful closeout and hands off to Mestre', async () => {
    const result = await execute();

    expect(result).toMatchObject({
      evidenceStatus: 'VALID',
      phaseState: 'COMPLETED',
      missionState: 'EXECUTING',
      handoffTo: 'Mestre',
      rejectionReason: null,
    });
    expect(result.skill.permissionProfile).toBe('SCOPED_WRITE');
    expect(result.receipt?.provider).toBe('internal');
  });

  it.each(['Carmem', 'Emily', 'Leo', 'Mestre'])('accepts canonical owner %s', async (agentId) => {
    const result = await execute(validInputs(), agentId);
    expect(result.evidenceStatus).toBe('VALID');
    expect(result.handoffTo).toBe('Mestre');
  });

  it('rejects a non-owner', async () => {
    await expect(execute(validInputs(), 'Rafael')).rejects.toBeInstanceOf(McfPermissionDeniedError);
  });

  it.each([
    ['external provider', { provider: 'github', operation: 'close-phase', resource: 'repo' }],
    [
      'wrong operation',
      { provider: 'internal', operation: 'github-write', resource: 'mcf-agent-runtime' },
    ],
    [
      'wrong resource',
      { provider: 'internal', operation: 'close-phase', resource: 'external-system' },
    ],
  ])('rejects forbidden boundary: %s', async (_label, tool) => {
    await expect(
      createExecutor().execute({
        skillId: 'MCF-CLOSE-PHASE',
        agentId: 'Carmem',
        inputs: validInputs(),
        tool,
      }),
    ).rejects.toBeInstanceOf(McfPermissionDeniedError);
  });

  it.each([
    ['external_write', true],
    ['github_provider_write', true],
    ['environment_mutation', true],
    ['deploy', true],
    ['production_action', true],
    ['destructive_action', true],
    ['secret_access', true],
    ['public_action', true],
  ])('rejects forbidden intent input %s', async (key, value) => {
    await expect(execute({ ...validInputs(), [key]: value })).rejects.toBeInstanceOf(
      McfPermissionDeniedError,
    );
  });

  it('moves to RECOVERING when execution evidence is absent', async () => {
    const result = await execute({
      phase_execution: 'phase execution',
      acceptance_results: ['pending'],
    });

    expect(result).toMatchObject({
      evidenceStatus: 'INVALID',
      phaseState: 'RECOVERING',
      missionState: 'RECOVERING',
      handoffTo: null,
    });
  });

  it.each([
    ['boolean phase pack', { ...validEvidence(), phase_pack: true }],
    [
      'incomplete traceability',
      {
        ...validEvidence(),
        phase_pack: {
          artifacts: ['PLAN.md'],
          manifest_reference: 'manifest.sha256',
          traceability_complete: false,
        },
      },
    ],
    [
      'pending action disguised as delivered',
      {
        ...validEvidence(),
        checkpoint: {
          ...(validEvidence().checkpoint as Record<string, unknown>),
          next_action: 'corrigir teste pendente',
        },
      },
    ],
    [
      'blocker disguised as delivered',
      {
        ...validEvidence(),
        checkpoint: {
          ...(validEvidence().checkpoint as Record<string, unknown>),
          blockers: ['CI vermelho'],
        },
      },
    ],
    [
      'human technical handoff',
      {
        ...validEvidence(),
        checkpoint: {
          ...(validEvidence().checkpoint as Record<string, unknown>),
          checkpoint_recipient: 'Leandro',
        },
      },
    ],
    [
      'blocking audit finding disguised as delivered',
      {
        ...validEvidence(),
        audit_verdict: {
          ...(validEvidence().audit_verdict as Record<string, unknown>),
          blocking_findings: ['P1 open'],
        },
      },
    ],
    [
      'non-passing audit verdict disguised as delivered',
      {
        ...validEvidence(),
        audit_verdict: {
          ...(validEvidence().audit_verdict as Record<string, unknown>),
          verdict: 'FAIL',
        },
      },
    ],
    [
      'Leandro assigned as technical responsible without escalation',
      {
        ...validEvidence(),
        leo_decision: {
          ...(validEvidence().leo_decision as Record<string, unknown>),
          responsible: 'Leandro',
        },
      },
    ],
    [
      'non-approving delivered decision',
      {
        ...validEvidence(),
        leo_decision: {
          ...(validEvidence().leo_decision as Record<string, unknown>),
          decision: 'BLOQUEAR',
        },
      },
    ],
    [
      'mismatched terminal state',
      {
        ...validEvidence(),
        leo_decision: {
          ...(validEvidence().leo_decision as Record<string, unknown>),
          next_state: 'BLOQUEADO_POR_RISCO',
        },
      },
    ],
  ])('rejects invalid closeout evidence: %s', async (_label, execution_evidence) => {
    const result = await execute({
      phase_execution: 'phase execution',
      acceptance_results: ['traceability_complete'],
      execution_evidence,
    });

    expect(result.evidenceStatus).toBe('INVALID');
    expect(result.phaseState).toBe('RECOVERING');
    expect(result.handoffTo).toBeNull();
    expect(result.rejectionReason).toBeTruthy();
  });
});
