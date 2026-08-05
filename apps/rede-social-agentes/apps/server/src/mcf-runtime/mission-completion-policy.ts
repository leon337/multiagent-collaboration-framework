import type { McfEventType, McfMissionState } from '@rsa/contracts';

interface CompletionEvent {
  eventType: McfEventType;
  payload: Record<string, unknown>;
}

export interface ResolveMissionStateInput {
  selectedSkills: string[];
  currentSkillId: string;
  currentPhaseCompleted: boolean;
  finalCheckpointRequested: boolean;
  defaultState: McfMissionState;
  existingEvents: CompletionEvent[];
}

function completedSkills(events: CompletionEvent[]): Set<string> {
  const completed = new Set<string>();
  for (const event of events) {
    if (event.eventType !== 'PHASE_COMPLETED') continue;
    const skillId = event.payload.skillId;
    if (typeof skillId === 'string' && skillId.length > 0) {
      completed.add(skillId);
    }
  }
  return completed;
}

export function resolveMissionState(input: ResolveMissionStateInput): McfMissionState {
  if (input.defaultState === 'RECOVERING' || input.defaultState === 'WAITING_EXTERNAL') {
    return input.defaultState;
  }

  if (
    input.currentSkillId !== 'MCF-TRACE-MISSION' ||
    !input.currentPhaseCompleted ||
    !input.finalCheckpointRequested
  ) {
    return input.defaultState === 'COMPLETED' ? 'EXECUTING' : input.defaultState;
  }

  const completed = completedSkills(input.existingEvents);
  completed.add(input.currentSkillId);
  const allSelectedSkillsCompleted = input.selectedSkills.every((skillId) =>
    completed.has(skillId),
  );

  return allSelectedSkillsCompleted ? 'COMPLETED' : 'EXECUTING';
}
