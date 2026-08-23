import type { McfContinuityMissionSpec } from '@rsa/contracts';
import { describe, expect, it } from 'vitest';

import {
  computeMcfContinuityMissionSpecDigest,
  normalizeMcfContinuityMissionSpec,
} from './mission-continuity-spec.js';

function mission(overrides: Partial<McfContinuityMissionSpec> = {}): McfContinuityMissionSpec {
  return {
    dispatchId: 'continuity-spec-001',
    projectKey: 'cloud-infrastructure',
    title: 'Persistent mission continuity',
    objective: 'Continue the mission from durable checkpoints across ChatGPT sessions.',
    acceptanceCriteria: ['a completed step is never repeated'],
    repositoryKey: 'cloud-infrastructure',
    baseRef: 'refs/heads/main',
    expectedBaseSha: 'a'.repeat(40),
    riskClass: 'B',
    writeScopeProfile: 'bounded-source',
    verificationProfiles: ['focused'],
    steps: [
      {
        stepKey: 'implement',
        objective: 'Implement the isolated bounded change in the persistent worktree.',
        acceptanceCriteria: ['focused tests pass'],
      },
      {
        stepKey: 'verify',
        objective: 'Verify the persisted implementation independently and record evidence.',
        acceptanceCriteria: ['evidence is durable'],
        dependsOn: ['implement'],
      },
    ],
    ...overrides,
  };
}

describe('continuity mission specification', () => {
  it('normalizes inherited policy and produces a stable digest', () => {
    const left = normalizeMcfContinuityMissionSpec(mission());
    const right = normalizeMcfContinuityMissionSpec(mission({ priority: 0 }));
    expect(left.steps[0]).toMatchObject({
      riskClass: 'B',
      writeScopeProfile: 'bounded-source',
      verificationProfiles: ['focused'],
      dependsOn: [],
      requiresGate: false,
      maxAttempts: 3,
    });
    expect(computeMcfContinuityMissionSpecDigest(left)).toBe(
      computeMcfContinuityMissionSpecDigest(right),
    );
  });

  it('rejects unknown dependencies, cycles and duplicate step keys', () => {
    expect(() =>
      normalizeMcfContinuityMissionSpec(
        mission({ steps: [{ ...mission().steps[0]!, dependsOn: ['missing'] }] }),
      ),
    ).toThrow(/unknown dependency/u);
    expect(() =>
      normalizeMcfContinuityMissionSpec(
        mission({
          steps: [
            { ...mission().steps[0]!, dependsOn: ['verify'] },
            { ...mission().steps[1]!, dependsOn: ['implement'] },
          ],
        }),
      ),
    ).toThrow(/cycle/u);
    expect(() =>
      normalizeMcfContinuityMissionSpec(
        mission({ steps: [mission().steps[0]!, mission().steps[0]!] }),
      ),
    ).toThrow(/unique/u);
  });

  it('rejects arbitrary execution fields at mission and step levels', () => {
    expect(() => normalizeMcfContinuityMissionSpec({ ...mission(), command: 'id' } as McfContinuityMissionSpec)).toThrow(
      /forbidden/u,
    );
    expect(() =>
      normalizeMcfContinuityMissionSpec(
        mission({ steps: [{ ...mission().steps[0]!, shell: '/bin/bash' } as never] }),
      ),
    ).toThrow(/forbidden/u);
  });
});
