import { describe, expect, it } from 'vitest';

import {
  HUMAN_CONTROL_COMMAND,
  buildHumanControlCheckpoint,
  isHumanControlCommand,
  normalizeHumanControlCommand,
} from './human-control-policy.js';

describe('human control policy', () => {
  it.each([
    'HUMANO NO CONTROLE',
    'humano no controle',
    '  Humano   no   Controle  ',
    'HUMANO\nNO\tCONTROLE',
  ])('normalizes the standalone human-control command: %j', (message) => {
    expect(normalizeHumanControlCommand(message)).toBe(HUMAN_CONTROL_COMMAND);
    expect(isHumanControlCommand('Leandro', message)).toBe(true);
  });

  it.each([
    'o documento diz HUMANO NO CONTROLE',
    'HUMANO NO CONTROLE parcial',
    '`HUMANO NO CONTROLE`',
    'controle humano',
  ])('does not promote descriptive or partial text to a gate: %j', (message) => {
    expect(isHumanControlCommand('Leandro', message)).toBe(false);
  });

  it('does not grant the gate to a non-human-authority actor', () => {
    expect(isHumanControlCommand('Mestre', HUMAN_CONTROL_COMMAND)).toBe(false);
    expect(isHumanControlCommand('Léo', HUMAN_CONTROL_COMMAND)).toBe(false);
  });

  it('builds a paused checkpoint that can only continue through a human gate', () => {
    expect(
      buildHumanControlCheckpoint({
        lastCompletedAction: 'DSH service validation',
        actionInFlight: null,
        preservedState: { dsh: 'active', router: 'active' },
        evidence: ['HTTP 200', 'systemd active'],
        surface: 'local_linux_desktop',
        automationChannel: 'SentinelX',
      }),
    ).toEqual({
      gate: 'HUMAN_CONTROL',
      executionPaused: true,
      lastCompletedAction: 'DSH service validation',
      actionInFlight: null,
      preservedState: { dsh: 'active', router: 'active' },
      evidence: ['HTTP 200', 'systemd active'],
      surface: 'local_linux_desktop',
      automationChannel: 'SentinelX',
      nextAction: 'HUMAN_GATE',
      resumeRequiresExplicitHumanInstruction: true,
    });
  });
});
