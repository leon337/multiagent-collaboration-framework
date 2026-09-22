import { describe, expect, it } from 'vitest';

import { EvidenceValidator } from './evidence-validator.js';
import { McfPermissionDeniedError } from './mcf-runtime.errors.js';
import { PermissionEngine } from './permission-engine.js';
import { SkillExecutor } from './skill-executor.js';
import { SkillRegistryLoader } from './skill-registry.loader.js';

process.env.DATABASE_URL ??= 'postgresql://mcf-test:mcf-test@127.0.0.1:5432/mcf_test';

function createExecutor(): SkillExecutor {
  return new SkillExecutor(
    new SkillRegistryLoader(),
    new PermissionEngine(),
    new EvidenceValidator(),
  );
}

function validInputs(): Record<string, unknown> {
  return {
    interaction_goal: 'Navigate the authorized MESTRE Workspace and capture evidence.',
    target_surface: 'notebook-left-workspace',
    authorizedScope: true,
    execution_evidence: {
      target_instance: {
        selection: 'notebook-left-workspace',
        evidence: 'PID/window geometry/Agent Bridge association',
      },
      interaction_policy: {
        semantic_first: true,
        physical_pointer_used: false,
        observation_method: 'ORCA/AT-SPI read-only plus Agent Bridge/IPC',
      },
      actions_performed: [
        'selected target instance by observed process/window/bridge evidence',
        'navigated with Agent Bridge',
        'used semantic find-click',
      ],
      capture_evidence: {
        native: true,
        method: 'workspaceView.webContents.capturePage()',
        reference: 'workspace-native-capture.png',
      },
      privacy_disposition: {
        classification: 'PRIVATE_ONLY',
        secret_exposed: false,
        publication_allowed: false,
      },
      human_gate_state: {
        required: false,
        resolved: false,
        leandro_as_technical_operator: false,
      },
    },
  };
}

describe('MCF-OPERATE-DUAL-BROWSER governed execution', () => {
  it('completes valid semantic-first execution and hands off to Beatriz', async () => {
    const result = await createExecutor().execute({
      skillId: 'MCF-OPERATE-DUAL-BROWSER',
      agentId: 'Mestre',
      inputs: validInputs(),
      tool: {
        provider: 'internal',
        operation: 'operate-dual-browser',
        resource: 'mcf-dual-browser-cockpit',
      },
    });

    expect(result).toMatchObject({
      evidenceStatus: 'VALID',
      phaseState: 'COMPLETED',
      missionState: 'EXECUTING',
      handoffTo: 'Beatriz',
      rejectionReason: null,
    });
  });

  it('requires explicit authorizedScope even for internal execution', async () => {
    const inputs = validInputs();
    inputs.authorizedScope = false;

    await expect(
      createExecutor().execute({
        skillId: 'MCF-OPERATE-DUAL-BROWSER',
        agentId: 'Mestre',
        inputs,
        tool: {
          provider: 'internal',
          operation: 'operate-dual-browser',
          resource: 'mcf-dual-browser-cockpit',
        },
      }),
    ).rejects.toBeInstanceOf(McfPermissionDeniedError);
  });

  it('rejects physical pointer requests', async () => {
    const inputs = validInputs();
    inputs.physical_pointer = true;

    await expect(
      createExecutor().execute({
        skillId: 'MCF-OPERATE-DUAL-BROWSER',
        agentId: 'Mestre',
        inputs,
        tool: {
          provider: 'internal',
          operation: 'operate-dual-browser',
          resource: 'mcf-dual-browser-cockpit',
        },
      }),
    ).rejects.toBeInstanceOf(McfPermissionDeniedError);
  });

  it('moves to recovery when evidence reports a secret exposure', async () => {
    const inputs = validInputs();
    const evidence = inputs.execution_evidence as Record<string, unknown>;
    const privacy = evidence.privacy_disposition as Record<string, unknown>;
    privacy.secret_exposed = true;

    const result = await createExecutor().execute({
      skillId: 'MCF-OPERATE-DUAL-BROWSER',
      agentId: 'Mestre',
      inputs,
      tool: {
        provider: 'internal',
        operation: 'operate-dual-browser',
        resource: 'mcf-dual-browser-cockpit',
      },
    });

    expect(result.phaseState).toBe('RECOVERING');
    expect(result.handoffTo).toBeNull();
    expect(result.rejectionReason).toMatch(/secret_exposed=false/u);
  });

  it('moves to recovery while a HUMAN_GATE remains unresolved', async () => {
    const inputs = validInputs();
    const evidence = inputs.execution_evidence as Record<string, unknown>;
    evidence.human_gate_state = {
      required: true,
      resolved: false,
      reason: 'two_factor_authentication',
      leandro_as_technical_operator: false,
    };

    const result = await createExecutor().execute({
      skillId: 'MCF-OPERATE-DUAL-BROWSER',
      agentId: 'Mestre',
      inputs,
      tool: {
        provider: 'internal',
        operation: 'operate-dual-browser',
        resource: 'mcf-dual-browser-cockpit',
      },
    });

    expect(result.phaseState).toBe('RECOVERING');
    expect(result.rejectionReason).toMatch(/cannot resolve HUMAN_GATE/u);
  });

  it('rejects a self-reported resolved HUMAN_GATE without canonical authenticated proof', async () => {
    const inputs = validInputs();
    const evidence = inputs.execution_evidence as Record<string, unknown>;
    evidence.human_gate_state = {
      required: true,
      resolved: true,
      reason: 'two_factor_authentication',
      leandro_as_technical_operator: false,
    };

    const result = await createExecutor().execute({
      skillId: 'MCF-OPERATE-DUAL-BROWSER',
      agentId: 'Mestre',
      inputs,
      tool: {
        provider: 'internal',
        operation: 'operate-dual-browser',
        resource: 'mcf-dual-browser-cockpit',
      },
    });

    expect(result.phaseState).toBe('RECOVERING');
    expect(result.rejectionReason).toMatch(/authenticated canonical human-gate path/u);
  });

  it('rejects non-native capture evidence', async () => {
    const inputs = validInputs();
    const evidence = inputs.execution_evidence as Record<string, unknown>;
    evidence.capture_evidence = {
      native: false,
      method: 'OS screenshot',
      reference: 'manual-screenshot.png',
    };

    const result = await createExecutor().execute({
      skillId: 'MCF-OPERATE-DUAL-BROWSER',
      agentId: 'Mestre',
      inputs,
      tool: {
        provider: 'internal',
        operation: 'operate-dual-browser',
        resource: 'mcf-dual-browser-cockpit',
      },
    });

    expect(result.phaseState).toBe('RECOVERING');
    expect(result.rejectionReason).toMatch(/native=true/u);
  });

  it('rejects Leandro as routine technical operator in semantic evidence', async () => {
    const inputs = validInputs();
    const evidence = inputs.execution_evidence as Record<string, unknown>;
    const humanGate = evidence.human_gate_state as Record<string, unknown>;
    humanGate.leandro_as_technical_operator = true;

    const result = await createExecutor().execute({
      skillId: 'MCF-OPERATE-DUAL-BROWSER',
      agentId: 'Mestre',
      inputs,
      tool: {
        provider: 'internal',
        operation: 'operate-dual-browser',
        resource: 'mcf-dual-browser-cockpit',
      },
    });

    expect(result.phaseState).toBe('RECOVERING');
    expect(result.rejectionReason).toMatch(/routine technical operator/u);
  });

  it('rejects a non-owner agent', async () => {
    await expect(
      createExecutor().execute({
        skillId: 'MCF-OPERATE-DUAL-BROWSER',
        agentId: 'Rafael',
        inputs: validInputs(),
        tool: {
          provider: 'internal',
          operation: 'operate-dual-browser',
          resource: 'mcf-dual-browser-cockpit',
        },
      }),
    ).rejects.toBeInstanceOf(McfPermissionDeniedError);
  });
});
