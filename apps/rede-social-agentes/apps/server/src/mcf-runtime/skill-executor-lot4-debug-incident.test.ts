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
    reproduction: {
      symptom: 'Mission remains in RECOVERING after the callback reaches the ledger.',
      method: 'Replayed the persisted callback against the same mission and phase version.',
      evidence_reference: 'debug-trace:mission-42:callback-17',
    },
    root_cause: {
      cause: 'A stale expected mission version was reused after the callback persisted its event.',
      supporting_evidence: 'event-ledger:mission-42:version-transition-7-to-8',
    },
    recovery_result: {
      action_or_mitigation:
        'Isolated the stale-version path and recomputed the expected version from persistence.',
      verification:
        'The deterministic reproduction now completes exactly once and emits the expected handoff.',
      blind_retry: false,
      regression_test_added: {
        reference: 'mission-runtime-lot4-debug-incident.integration.test.ts#stale-version-recovery',
      },
    },
  };
}

function validInputs(): Record<string, unknown> {
  return {
    symptom_or_evidence: 'Mission stuck in RECOVERING after a valid callback.',
    execution_evidence: validEvidence(),
  };
}

async function execute(inputs: Record<string, unknown> = validInputs(), agentId = 'Patricia') {
  return createExecutor().execute({
    skillId: 'MCF-DEBUG-INCIDENT',
    agentId,
    inputs,
    tool: {
      provider: 'internal',
      operation: 'inspect-debug-incident',
      resource: 'mcf-agent-runtime',
    },
  });
}

describe('SkillExecutor Lot 4D MCF-DEBUG-INCIDENT', () => {
  it('completes semantic internal evidence, preserves SCOPED_WRITE and hands off to Renato', async () => {
    const result = await execute();

    expect(result).toMatchObject({
      evidenceStatus: 'VALID',
      phaseState: 'COMPLETED',
      missionState: 'EXECUTING',
      handoffTo: 'Renato',
      rejectionReason: null,
    });
    expect(result.skill.permissionProfile).toBe('SCOPED_WRITE');
    expect(result.receipt?.provider).toBe('internal');
    expect(result.receipt?.metadata.executionEvidence).toMatchObject({
      recovery_result: { blind_retry: false },
    });
  });

  it.each(['Patricia', 'Bruno', 'Rafael'])('accepts canonical owner %s', async (agentId) => {
    const result = await execute(validInputs(), agentId);
    expect(result.evidenceStatus).toBe('VALID');
    expect(result.handoffTo).toBe('Renato');
  });

  it('rejects a non-owner', async () => {
    await expect(execute(validInputs(), 'Ricardo')).rejects.toBeInstanceOf(
      McfPermissionDeniedError,
    );
  });

  it.each([
    [
      'external provider',
      { provider: 'github', operation: 'inspect-debug-incident', resource: 'repo' },
    ],
    [
      'GitHub write',
      { provider: 'internal', operation: 'github-write', resource: 'mcf-agent-runtime' },
    ],
    [
      'environment mutation',
      { provider: 'internal', operation: 'environment-mutation', resource: 'mcf-agent-runtime' },
    ],
    [
      'destructive fix',
      { provider: 'internal', operation: 'destructive-fix', resource: 'mcf-agent-runtime' },
    ],
    [
      'blind retry',
      { provider: 'internal', operation: 'blind-retry', resource: 'mcf-agent-runtime' },
    ],
  ])('rejects forbidden boundary operation: %s', async (_label, tool) => {
    await expect(
      createExecutor().execute({
        skillId: 'MCF-DEBUG-INCIDENT',
        agentId: 'Patricia',
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
    ['destructive_fix', true],
    ['secret_access', true],
    ['public_action', true],
    ['blind_retry', true],
  ])('rejects forbidden intent input %s', async (key, value) => {
    const inputs = { ...validInputs(), [key]: value };
    await expect(execute(inputs)).rejects.toBeInstanceOf(McfPermissionDeniedError);
  });

  it('moves to RECOVERING when execution_evidence is absent', async () => {
    const result = await execute({ symptom_or_evidence: 'timeout' });
    expect(result).toMatchObject({
      evidenceStatus: 'INVALID',
      phaseState: 'RECOVERING',
      missionState: 'RECOVERING',
      handoffTo: null,
    });
    expect(result.rejectionReason).toMatch(/execution_evidence/u);
  });

  it.each([
    [
      'empty reproduction',
      {
        reproduction: {},
        root_cause: validEvidence().root_cause,
        recovery_result: validEvidence().recovery_result,
      },
    ],
    [
      'whitespace reproduction field',
      {
        ...validEvidence(),
        reproduction: { symptom: '   ', method: 'replay request', evidence_reference: 'trace:1' },
      },
    ],
    [
      'placeholder reproduction field',
      {
        ...validEvidence(),
        reproduction: { symptom: 'TODO', method: 'replay request', evidence_reference: 'trace:1' },
      },
    ],
    ['boolean reproduction', { ...validEvidence(), reproduction: true }],
    ['empty root cause', { ...validEvidence(), root_cause: {} }],
    [
      'placeholder root cause',
      { ...validEvidence(), root_cause: { cause: 'unknown', supporting_evidence: 'trace:2' } },
    ],
    [
      'boolean root cause evidence',
      { ...validEvidence(), root_cause: { cause: 'race condition', supporting_evidence: true } },
    ],
    ['empty recovery', { ...validEvidence(), recovery_result: {} }],
    [
      'recovery without verification',
      {
        ...validEvidence(),
        recovery_result: {
          action_or_mitigation: 'isolated stale state',
          blind_retry: false,
          regression_test_added: 'debug.test.ts',
        },
      },
    ],
    [
      'recovery without regression test',
      {
        ...validEvidence(),
        recovery_result: {
          action_or_mitigation: 'isolated stale state',
          verification: 'reproduction stopped under deterministic test',
          blind_retry: false,
        },
      },
    ],
    [
      'blind retry masked as recovery',
      {
        ...validEvidence(),
        recovery_result: {
          action_or_mitigation: 'retry request',
          verification: 'second attempt returned 200',
          blind_retry: true,
          regression_test_added: 'debug.test.ts',
        },
      },
    ],
    [
      'boolean regression evidence',
      {
        ...validEvidence(),
        recovery_result: {
          action_or_mitigation: 'isolated stale state',
          verification: 'verified by deterministic test',
          blind_retry: false,
          regression_test_added: true,
        },
      },
    ],
    [
      'placeholder regression evidence',
      {
        ...validEvidence(),
        recovery_result: {
          action_or_mitigation: 'isolated stale state',
          verification: 'verified by deterministic test',
          blind_retry: false,
          regression_test_added: 'done',
        },
      },
    ],
  ])('rejects insufficient semantic evidence: %s', async (_label, execution_evidence) => {
    const result = await execute({
      symptom_or_evidence: 'runtime incident',
      execution_evidence,
    });

    expect(result.evidenceStatus).toBe('INVALID');
    expect(result.phaseState).toBe('RECOVERING');
    expect(result.handoffTo).toBeNull();
    expect(result.rejectionReason).toBeTruthy();
  });
});
