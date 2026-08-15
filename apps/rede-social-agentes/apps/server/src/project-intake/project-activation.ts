export type McfActivationState = 'NOT_ACTIVE' | 'ACTIVATING' | 'ACTIVE';

export type McfActivationEvent = 'BEGIN_ACTIVATION' | 'COMPLETE_ACTIVATION';

export interface McfActivationTransition {
  previousState: McfActivationState;
  event: McfActivationEvent;
  state: McfActivationState;
  laterOperationalSkill: 'MCF-START-MISSION';
  implementationAuthorized: false;
}

export class McfActivationTransitionError extends Error {
  constructor(state: McfActivationState, event: McfActivationEvent) {
    super(`invalid MCF activation transition: ${state} + ${event}`);
    this.name = 'McfActivationTransitionError';
  }
}

export function transitionMcfActivation(
  state: McfActivationState,
  event: McfActivationEvent,
): McfActivationTransition {
  const next =
    state === 'NOT_ACTIVE' && event === 'BEGIN_ACTIVATION'
      ? 'ACTIVATING'
      : state === 'ACTIVATING' && event === 'COMPLETE_ACTIVATION'
        ? 'ACTIVE'
        : null;

  if (next === null) {
    throw new McfActivationTransitionError(state, event);
  }

  return {
    previousState: state,
    event,
    state: next,
    laterOperationalSkill: 'MCF-START-MISSION',
    implementationAuthorized: false,
  };
}
