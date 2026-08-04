import { describe, expect, it } from 'vitest';

import { resolveMissionState } from './mission-completion-policy.js';

function completed(skillId: string) {
  return {
    eventType: 'PHASE_COMPLETED' as const,
    payload: { skillId },
  };
}

describe('resolveMissionState', () => {
  it('does not complete a mission after tests when later skills remain', () => {
    expect(
      resolveMissionState({
        selectedSkills: ['MCF-START-MISSION', 'MCF-RUN-TESTS', 'MCF-TRACE-MISSION'],
        currentSkillId: 'MCF-RUN-TESTS',
        currentPhaseCompleted: true,
        finalCheckpointRequested: false,
        defaultState: 'COMPLETED',
        existingEvents: [completed('MCF-START-MISSION')],
      }),
    ).toBe('EXECUTING');
  });

  it('completes only at a final trace after every selected skill has completed', () => {
    expect(
      resolveMissionState({
        selectedSkills: ['MCF-START-MISSION', 'MCF-SELECT-AGENTS', 'MCF-TRACE-MISSION'],
        currentSkillId: 'MCF-TRACE-MISSION',
        currentPhaseCompleted: true,
        finalCheckpointRequested: true,
        defaultState: 'EXECUTING',
        existingEvents: [
          completed('MCF-START-MISSION'),
          completed('MCF-SELECT-AGENTS'),
        ],
      }),
    ).toBe('COMPLETED');
  });

  it('keeps the mission executing when the final trace detects a missing skill', () => {
    expect(
      resolveMissionState({
        selectedSkills: [
          'MCF-START-MISSION',
          'MCF-IMPLEMENT-CHANGE',
          'MCF-TRACE-MISSION',
        ],
        currentSkillId: 'MCF-TRACE-MISSION',
        currentPhaseCompleted: true,
        finalCheckpointRequested: true,
        defaultState: 'EXECUTING',
        existingEvents: [completed('MCF-START-MISSION')],
      }),
    ).toBe('EXECUTING');
  });

  it('preserves recovery and waiting states', () => {
    expect(
      resolveMissionState({
        selectedSkills: ['MCF-RUN-TESTS'],
        currentSkillId: 'MCF-RUN-TESTS',
        currentPhaseCompleted: false,
        finalCheckpointRequested: false,
        defaultState: 'RECOVERING',
        existingEvents: [],
      }),
    ).toBe('RECOVERING');
    expect(
      resolveMissionState({
        selectedSkills: ['MCF-RUN-TESTS'],
        currentSkillId: 'MCF-RUN-TESTS',
        currentPhaseCompleted: false,
        finalCheckpointRequested: false,
        defaultState: 'WAITING_EXTERNAL',
        existingEvents: [],
      }),
    ).toBe('WAITING_EXTERNAL');
  });
});
