import { describe, expect, it } from 'vitest';

import type { McfWorkJobSpec } from '@rsa/contracts';

import { computeMcfWorkSpecDigest, normalizeMcfWorkJobSpec } from './spec-digest.js';
import { McfWorkSpecError } from './work-queue.errors.js';

function spec(overrides: Partial<McfWorkJobSpec> = {}): McfWorkJobSpec {
  return {
    dispatchId: 'dispatch-digest-001',
    objective: 'Produce an isolated patch with durable and deterministic evidence.',
    acceptanceCriteria: ['the patch is scoped', 'verification is recorded'],
    repositoryKey: 'mcf',
    baseRef: 'refs/heads/main',
    expectedBaseSha: 'a'.repeat(40),
    riskClass: 'B',
    writeScopeProfile: 'source',
    verificationProfiles: ['focused'],
    ...overrides,
  };
}

describe('MCF work specification normalization and digest', () => {
  it('normalizes optional defaults before computing a deterministic digest', () => {
    const left = normalizeMcfWorkJobSpec(spec());
    const right = normalizeMcfWorkJobSpec({
      ...spec(),
      requiresGate: false,
      priority: 0,
      maxAttempts: 3,
    });

    expect(computeMcfWorkSpecDigest(left)).toBe(computeMcfWorkSpecDigest(right));
    expect(left).toMatchObject({ requiresGate: false, priority: 0, maxAttempts: 3 });
  });

  it('makes risk C fail closed even when requiresGate is false', () => {
    const normalized = normalizeMcfWorkJobSpec(spec({ riskClass: 'C', requiresGate: false }));
    expect(normalized.requiresGate).toBe(true);
  });

  it('changes the digest when a material field changes', () => {
    const left = computeMcfWorkSpecDigest(normalizeMcfWorkJobSpec(spec()));
    const right = computeMcfWorkSpecDigest(
      normalizeMcfWorkJobSpec(spec({ verificationProfiles: ['full'] })),
    );
    expect(left).not.toBe(right);
  });

  it('rejects arbitrary commands, unsafe refs and malformed SHAs at runtime', () => {
    expect(() =>
      normalizeMcfWorkJobSpec({ ...spec(), command: 'rm -rf /' } as McfWorkJobSpec),
    ).toThrow(McfWorkSpecError);
    expect(() => normalizeMcfWorkJobSpec(spec({ baseRef: '../main' }))).toThrow(/baseRef/u);
    expect(() => normalizeMcfWorkJobSpec(spec({ expectedBaseSha: 'A'.repeat(40) }))).toThrow(
      /expectedBaseSha/u,
    );
  });

  it('rejects duplicate policy profiles and out-of-range attempts', () => {
    expect(() =>
      normalizeMcfWorkJobSpec(spec({ verificationProfiles: ['focused', 'focused'] })),
    ).toThrow(/duplicates/u);
    expect(() => normalizeMcfWorkJobSpec(spec({ maxAttempts: 11 }))).toThrow(/maxAttempts/u);
  });
});
