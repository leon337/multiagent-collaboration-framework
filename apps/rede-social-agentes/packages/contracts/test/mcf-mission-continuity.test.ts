import { describe, expect, expectTypeOf, it } from 'vitest';

import type {
  McfContinuityMissionClaim,
  McfContinuityMissionSpec,
  McfContinuityMissionStatus,
  McfMissionCheckpointInput,
  McfMissionWorkEventResponse,
} from '../src/index.js';

describe('MCF persistent multi-step mission contracts', () => {
  it('models an ordered policy-bound plan without arbitrary shell fields', () => {
    const spec: McfContinuityMissionSpec = {
      dispatchId: 'mission-continuity-001',
      projectKey: 'cloud-infrastructure',
      title: 'Prove mission continuity on the VPS',
      objective: 'Execute durable steps and resume from the last atomic checkpoint.',
      acceptanceCriteria: ['completed steps are never repeated'],
      repositoryKey: 'cloud-infrastructure',
      baseRef: 'refs/heads/main',
      expectedBaseSha: 'a'.repeat(40),
      riskClass: 'B',
      writeScopeProfile: 'bounded-source',
      verificationProfiles: ['focused'],
      steps: [
        {
          stepKey: 'implement',
          objective: 'Implement the bounded change in the isolated worktree.',
          acceptanceCriteria: ['focused tests pass'],
        },
        {
          stepKey: 'verify',
          objective: 'Verify the persisted result independently.',
          acceptanceCriteria: ['evidence is durable'],
          dependsOn: ['implement'],
        },
      ],
    };

    expect(spec.steps[1]?.dependsOn).toEqual(['implement']);
    expectTypeOf<keyof McfContinuityMissionSpec>().not.toEqualTypeOf<'command'>();
    expectTypeOf<keyof McfContinuityMissionSpec['steps'][number]>().not.toEqualTypeOf<'shell'>();
  });

  it('separates the secret lease from observable mission state', () => {
    const claim = {} as McfContinuityMissionClaim;
    expectTypeOf(claim.leaseToken).toEqualTypeOf<string>();
    expectTypeOf(claim.mission).not.toHaveProperty('leaseToken');
    expectTypeOf(claim.fencingToken).toEqualTypeOf<number>();
  });

  it('exposes resumable states, cursor events and repository checkpoints', () => {
    expectTypeOf<McfContinuityMissionStatus>().toEqualTypeOf<
      | 'QUEUED'
      | 'RUNNING'
      | 'RETRY_WAIT'
      | 'WAITING_GATE'
      | 'BLOCKED_AUTH'
      | 'BLOCKED_POLICY'
      | 'SUCCEEDED'
      | 'FAILED'
      | 'CANCELLED'
    >();
    expectTypeOf<McfMissionWorkEventResponse['sequence']>().toEqualTypeOf<string>();

    const checkpoint: McfMissionCheckpointInput = {
      checkpointKey: 'mission-continuity-001:implement:v1',
      summary: 'The implementation step passed its focused tests.',
      completedAcceptanceCriteria: ['focused tests pass'],
      nextAction: 'Run independent verification.',
      repositoryState: {
        baseSha: 'a'.repeat(40),
        headSha: 'b'.repeat(40),
        patchDigest: 'c'.repeat(64),
        worktreePath: '/var/lib/mcf/worktrees/mission-id',
      },
    };
    expect(checkpoint.nextAction).toMatch(/verification/u);
  });
});
