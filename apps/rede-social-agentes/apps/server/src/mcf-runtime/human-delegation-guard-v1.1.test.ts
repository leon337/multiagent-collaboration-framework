import { describe, expect, it } from 'vitest';

import type { McfStandingAuthorization } from '@rsa/contracts';

import { HumanDelegationGuard, type McfV11AuthorizationContext } from './human-delegation-guard.js';

function standingAuthorization(
  overrides: Partial<McfStandingAuthorization> = {},
): McfStandingAuthorization {
  return {
    authorizationId: 'AUTH-001',
    projectId: 'project-1',
    missionId: 'mission-1',
    grantedBy: 'LEANDRO',
    grantedAt: '2026-08-16T00:00:00.000Z',
    actionClasses: ['repository-write'],
    environments: ['staging'],
    maximumCost: { currency: 'USD', amount: 25 },
    reversibleOnly: true,
    expiresAt: '2026-09-01T00:00:00.000Z',
    boundary: 'feature-branch-only',
    exclusions: ['merge-main'],
    evidenceRequirements: ['ticket-approved'],
    sourceDecisionRef: 'human:leandro:decision-001',
    status: 'ACTIVE',
    ...overrides,
  };
}

function context(overrides: Partial<McfV11AuthorizationContext> = {}): McfV11AuthorizationContext {
  return {
    projectId: 'project-1',
    missionId: 'mission-1',
    actionClass: 'repository-write',
    environment: 'staging',
    estimatedCost: { currency: 'USD', amount: 5 },
    reversible: true,
    observedAt: '2026-08-16T12:00:00.000Z',
    boundary: 'feature-branch-only',
    evidenceRefs: ['ticket-approved'],
    reservedHumanAuthority: true,
    standingAuthorizations: [standingAuthorization()],
    ...overrides,
  };
}

function assertContext(value: McfV11AuthorizationContext): void {
  new HumanDelegationGuard().assertAllowed('Mestre', {
    v11AuthorizationContext: value,
  });
}

describe('HumanDelegationGuard v1.1 standing authorization', () => {
  it('allows an ordinary action inside a valid standing authorization envelope', () => {
    expect(() => assertContext(context())).not.toThrow();
  });

  it('fails closed for the wrong action class at a reserved human boundary', () => {
    expect(() => assertContext(context({ actionClass: 'release-public' }))).toThrow(
      /human gate.*LEANDRO/iu,
    );
  });

  it('fails closed for the wrong environment', () => {
    expect(() => assertContext(context({ environment: 'production' }))).toThrow(
      /human gate.*LEANDRO/iu,
    );
  });

  it('fails closed for an expired standing authorization', () => {
    expect(() =>
      assertContext(
        context({
          observedAt: '2026-09-02T00:00:00.000Z',
        }),
      ),
    ).toThrow(/human gate.*LEANDRO/iu);
  });

  it('fails closed when estimated cost exceeds the authorized maximum', () => {
    expect(() =>
      assertContext(context({ estimatedCost: { currency: 'USD', amount: 26 } })),
    ).toThrow(/human gate.*LEANDRO/iu);
  });

  it('fails closed when a reversible-only authorization is used for an irreversible action', () => {
    expect(() => assertContext(context({ reversible: false }))).toThrow(/human gate.*LEANDRO/iu);
  });

  it('makes an explicit exclusion win over an otherwise matching authorization', () => {
    expect(() =>
      assertContext(
        context({
          actionClass: 'merge-main',
          standingAuthorizations: [
            standingAuthorization({
              actionClasses: ['repository-write', 'merge-main'],
              exclusions: ['merge-main'],
            }),
          ],
        }),
      ),
    ).toThrow(/human gate.*LEANDRO/iu);
  });

  it('fails closed when required authorization evidence is missing', () => {
    expect(() => assertContext(context({ evidenceRefs: [] }))).toThrow(/human gate.*LEANDRO/iu);
  });

  it('does not treat no response as human approval', () => {
    expect(() =>
      assertContext(
        context({
          standingAuthorizations: [],
          teamFirst: {
            attempted: true,
            evidenceRefs: ['team-attempt:1'],
            fallbackExhausted: true,
          },
        }),
      ),
    ).toThrow(/human gate.*LEANDRO/iu);
  });

  it('requires TEAM_FIRST evidence before accepting a human gate decision', () => {
    expect(() =>
      assertContext(
        context({
          standingAuthorizations: [],
          humanGateDecision: {
            status: 'APPROVED',
            decidedBy: 'LEANDRO',
            sourceRef: 'human-gate:approved:1',
          },
        }),
      ),
    ).toThrow(/TEAM_FIRST/u);
  });

  it('accepts a LEANDRO gate only after TEAM_FIRST is exhausted', () => {
    expect(() =>
      assertContext(
        context({
          standingAuthorizations: [],
          teamFirst: {
            attempted: true,
            evidenceRefs: ['team-attempt:1'],
            fallbackExhausted: true,
          },
          humanGateDecision: {
            status: 'APPROVED',
            decidedBy: 'LEANDRO',
            sourceRef: 'human-gate:approved:1',
          },
        }),
      ),
    ).not.toThrow();
  });

  it('rejects a gate approval attributed to anyone other than LEANDRO', () => {
    expect(() =>
      assertContext(
        context({
          standingAuthorizations: [],
          teamFirst: {
            attempted: true,
            evidenceRefs: ['team-attempt:1'],
            fallbackExhausted: true,
          },
          humanGateDecision: {
            status: 'APPROVED',
            decidedBy: 'LEO',
            sourceRef: 'invalid:approval',
          },
        }),
      ),
    ).toThrow(/LEANDRO/u);
  });

  it('lets an unrelated non-reserved action continue through the existing permission profile', () => {
    expect(() =>
      assertContext(
        context({
          actionClass: 'read-status',
          reservedHumanAuthority: false,
          standingAuthorizations: [],
        }),
      ),
    ).not.toThrow();
  });
});
