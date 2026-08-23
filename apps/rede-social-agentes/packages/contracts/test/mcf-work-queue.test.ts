import { describe, expect, expectTypeOf, it } from 'vitest';

import type {
  McfClaimedWorkJob,
  McfWorkFailure,
  McfWorkGateDecision,
  McfWorkJobResponse,
  McfWorkJobSpec,
  McfWorkJobStatus,
} from '../src/index.js';

describe('MCF durable work queue contracts', () => {
  it('represents a bounded repository job without accepting an arbitrary command', () => {
    const spec: McfWorkJobSpec = {
      dispatchId: 'dispatch-contract-001',
      objective: 'Implement the durable queue contract without changing the existing runtime.',
      acceptanceCriteria: ['contracts compile', 'no arbitrary command is accepted'],
      repositoryKey: 'mcf',
      baseRef: 'refs/heads/main',
      expectedBaseSha: 'a'.repeat(40),
      riskClass: 'B',
      writeScopeProfile: 'source',
      verificationProfiles: ['focused'],
      maxAttempts: 3,
    };

    expect(spec).not.toHaveProperty('command');
    expect(spec).not.toHaveProperty('cwd');
    expect(spec.repositoryKey).toBe('mcf');
    expectTypeOf<keyof McfWorkJobSpec>().not.toEqualTypeOf<'command'>();
  });

  it('exposes terminal, gated, retry and authentication states', () => {
    expectTypeOf<McfWorkJobStatus>().toEqualTypeOf<
      | 'WAITING_GATE'
      | 'QUEUED'
      | 'RUNNING'
      | 'RETRY_WAIT'
      | 'BLOCKED_AUTH'
      | 'BLOCKED_POLICY'
      | 'SUCCEEDED'
      | 'FAILED'
      | 'DEAD'
      | 'CANCELLED'
    >();
  });

  it('binds gate decisions and claims to the immutable specification digest', () => {
    const decision: McfWorkGateDecision = {
      decision: 'APPROVE',
      specDigest: 'b'.repeat(64),
      actor: 'LEANDRO',
      reason: 'Approved for isolated local execution.',
      expiresAt: '2026-08-23T00:00:00.000Z',
    };
    const claim = {} as McfClaimedWorkJob;

    expect(decision.specDigest).toHaveLength(64);
    expectTypeOf(claim.leaseToken).toEqualTypeOf<string>();
    expectTypeOf<McfWorkJobResponse['result']>().not.toEqualTypeOf<undefined>();
  });

  it('distinguishes retryable failures from authentication and policy blockers', () => {
    const failure: McfWorkFailure = {
      code: 'CODEX_RATE_LIMITED',
      message: 'Codex temporarily rejected the request.',
      kind: 'TRANSIENT',
      retryable: true,
      statusCode: 429,
    };

    expect(failure).toMatchObject({ kind: 'TRANSIENT', retryable: true });
  });
});
