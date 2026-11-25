import { describe, expect, it } from 'vitest';

import { McfMemoryPolicyService } from './mcf-memory-policy.service.js';

describe('McfMemoryPolicyService', () => {
  it('denies propagation by default', () => {
    const policy = new McfMemoryPolicyService({
      version: 'memory-policy/2026-09-22',
      rules: [],
    });

    expect(
      policy.evaluate({
        operation: 'propagate',
        sourceScope: 'project:mcf',
        targetScope: 'project:other',
      }),
    ).toEqual({
      allowed: false,
      policyVersion: 'memory-policy/2026-09-22',
      reason: 'NO_EXPLICIT_ALLOW_RULE',
    });
  });

  it('allows only an exact source-target-operation rule', () => {
    const policy = new McfMemoryPolicyService({
      version: 'memory-policy/v1',
      rules: [
        {
          operation: 'propagate',
          sourceScope: 'project:mcf',
          targetScope: 'mission:316',
          effect: 'allow',
        },
      ],
    });

    expect(
      policy.evaluate({
        operation: 'propagate',
        sourceScope: 'project:mcf',
        targetScope: 'mission:316',
      }),
    ).toMatchObject({ allowed: true, policyVersion: 'memory-policy/v1' });
    expect(
      policy.evaluate({
        operation: 'propagate',
        sourceScope: 'project:mcf',
        targetScope: 'mission:317',
      }).allowed,
    ).toBe(false);
    expect(
      policy.evaluate({
        operation: 'write',
        sourceScope: 'project:mcf',
        targetScope: 'mission:316',
      }).allowed,
    ).toBe(false);
  });

  it('rejects wildcard rules instead of widening trust boundaries', () => {
    expect(
      () =>
        new McfMemoryPolicyService({
          version: 'memory-policy/v1',
          rules: [
            {
              operation: 'propagate',
              sourceScope: 'project:mcf',
              targetScope: '*',
              effect: 'allow',
            },
          ],
        }),
    ).toThrow(/policy/i);
  });
});
