import { describe, expect, it } from 'vitest';

import { HumanDelegationGuard } from './human-delegation-guard.js';

function validRequest(): Record<string, unknown> {
  return {
    humanInterventionRequest: {
      mode: 'TEAM_FIRST',
      trigger: 'PERSONAL_AUTHENTICATION',
      teamExecutionAttempted: true,
      attemptedActions: ['GitHub connector attempted the protected operation'],
      evidence: ['provider required account-owner confirmation'],
      toolLimitation: 'The connector cannot complete personal 2FA confirmation',
      fallbackExhausted: true,
      leoApproved: true,
      actionCount: 1,
      action: 'Confirm the GitHub authentication prompt',
      directLink: 'https://github.com/settings/security',
      navigationPath: '',
      risk: 'Without confirmation the protected operation remains blocked',
      expectedResult: 'GitHub reports the account confirmation as completed',
    },
  };
}

describe('HumanDelegationGuard', () => {
  const guard = new HumanDelegationGuard();

  it('allows normal agent execution without human delegation', () => {
    expect(() => guard.assertAllowed('Gabriel', { authorizedScope: true })).not.toThrow();
  });

  it('blocks Leandro from being used as an executing agent', () => {
    expect(() => guard.assertAllowed('Leandro', {})).toThrow(
      /cannot be used as an executing agent/u,
    );
  });

  it('blocks incomplete human delegation requests', () => {
    expect(() =>
      guard.assertAllowed('Mestre', {
        humanInterventionRequest: {
          mode: 'TEAM_FIRST',
          trigger: 'PERSONAL_AUTHENTICATION',
          teamExecutionAttempted: false,
        },
      }),
    ).toThrow(/real team execution attempt/u);
  });

  it('blocks delegation while an executable fallback remains', () => {
    const inputs = validRequest();
    const request = inputs.humanInterventionRequest as Record<string, unknown>;
    request.fallbackExhausted = false;

    expect(() => guard.assertAllowed('Mestre', inputs)).toThrow(
      /while an executable fallback remains/u,
    );
  });

  it('allows one reserved, evidenced and Léo-approved human action', () => {
    expect(() => guard.assertAllowed('Mestre', validRequest())).not.toThrow();
  });
});
