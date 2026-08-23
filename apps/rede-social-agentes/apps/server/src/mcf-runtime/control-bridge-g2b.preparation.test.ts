import { describe, expect, it } from 'vitest';

import {
  ControlBridgeG2bPreparationError,
  type ControlBridgeG2bCommand,
  type ControlBridgeG2bGovernanceContext,
  normalizeControlBridgeG2bResult,
  prepareControlBridgeG2bDispatch,
} from './control-bridge-g2b.preparation.js';

const SOURCE_SHA = 'a'.repeat(40);

function context(
  overrides: Partial<ControlBridgeG2bGovernanceContext> = {},
): ControlBridgeG2bGovernanceContext {
  return {
    mcfMissionId: 'MCF-MISSION-CONTROL-BRIDGE-001',
    phaseId: 'PREPARATION',
    agentId: 'MESTRE',
    permissionProfile: 'SCOPED_WRITE',
    permissionRef: 'permission://mission/control-bridge/preparation',
    permissionGranted: true,
    authorizedScope: true,
    sourceSha: SOURCE_SHA,
    bridgeRequestId: 'MCF-G2B-PREP-0001',
    project: { tenant: 'leon337', name: 'g2a-smoke', environment: 'dev' },
    ...overrides,
  };
}

function prepared(command: ControlBridgeG2bCommand = { operation: 'status' }) {
  return prepareControlBridgeG2bDispatch(context(), command);
}

function bridgeResult(
  dispatch = prepared(),
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    protocol: 'MCF_WORKSPACE_MUTATION_RESULT_V1',
    request_id: dispatch.request.request_id,
    request_digest: 'b'.repeat(64),
    mission_id: dispatch.request.mission_id,
    declared_actor: dispatch.request.declared_actor,
    authority: { grant_id: 'G2B-GRANT-MOCK' },
    transport_principal: { login: 'leon337', actor_id: 1 },
    grant_id: 'G2B-GRANT-MOCK',
    project: dispatch.request.project,
    operation: dispatch.request.operation,
    path: null,
    started_at: '2026-08-22T20:00:00Z',
    finished_at: '2026-08-22T20:00:01Z',
    precondition: null,
    before: null,
    after: null,
    status: 'PASS',
    replayed: false,
    rollback_request_id: null,
    revocation_request_id: null,
    error: null,
    ...overrides,
  };
}

function expectPreparationError(action: () => unknown, code: string): void {
  try {
    action();
    throw new Error(`expected ${code}`);
  } catch (error) {
    expect(error).toBeInstanceOf(ControlBridgeG2bPreparationError);
    expect((error as ControlBridgeG2bPreparationError).code).toBe(code);
  }
}

describe('Control Bridge G2-B preparation contract', () => {
  it('prepares an explicitly permitted bounded operation without adding bridge fields', () => {
    const dispatch = prepared({ operation: 'status' });

    expect(dispatch.request).toEqual({
      protocol: 'MCF_WORKSPACE_MUTATION_V1',
      request_id: 'MCF-G2B-PREP-0001',
      mission_id: 'CONTROL-BRIDGE-G2B-PILOT',
      declared_actor: 'MESTRE_MCF',
      project: { tenant: 'leon337', name: 'g2a-smoke', environment: 'dev' },
      operation: 'status',
      arguments: {},
    });
    expect(dispatch.request).not.toHaveProperty('sourceSha');
    expect(dispatch.request).not.toHaveProperty('permissionRef');
    expect(dispatch.correlation.sourceSha).toBe(SOURCE_SHA);
    expect(dispatch.correlation.agentId).toBe('MESTRE');
  });

  it('rejects a mission without authorization', () => {
    expectPreparationError(
      () =>
        prepareControlBridgeG2bDispatch(context({ permissionGranted: false }), {
          operation: 'status',
        }),
      'MISSION_NOT_AUTHORIZED',
    );
  });

  it('rejects an invalid identity/governance context', () => {
    expectPreparationError(
      () =>
        prepareControlBridgeG2bDispatch(context({ agentId: ' MESTRE ' }), {
          operation: 'status',
        }),
      'INVALID_GOVERNANCE_CONTEXT',
    );
  });

  it('rejects an operation outside the allowlist', () => {
    expectPreparationError(
      () => prepareControlBridgeG2bDispatch(context(), { operation: 'shell.exec' } as never),
      'UNKNOWN_OPERATION',
    );
  });

  it('rejects a project outside the bounded environment scope', () => {
    expectPreparationError(
      () =>
        prepareControlBridgeG2bDispatch(
          context({
            project: {
              tenant: 'leon337',
              name: 'g2a-smoke',
              environment: 'production' as never,
            },
          }),
          { operation: 'status' },
        ),
      'OUT_OF_SCOPE',
    );
  });

  it('rejects an invalid write payload', () => {
    expectPreparationError(
      () =>
        prepareControlBridgeG2bDispatch(context(), {
          operation: 'workspace.write',
          path: 'G2B-PILOT.txt',
          content: 'bounded',
          precondition: { sha256: 'not-a-sha' },
        }),
      'INVALID_PRECONDITION',
    );
  });

  it('builds rollback and revoke commands without performing them', () => {
    const rollback = prepared({
      operation: 'rollback',
      originalRequestId: 'MCF-G2B-WRITE-0001',
    });
    const revoke = prepared({ operation: 'revoke' });

    expect(rollback.request.arguments).toEqual({
      original_request_id: 'MCF-G2B-WRITE-0001',
    });
    expect(revoke.request.arguments).toEqual({});
  });

  it.each([
    ['PASS', 'SUCCESS', true],
    ['REFUSED', 'REJECTED', false],
    ['CONFLICT', 'CONFLICT', false],
    ['FAILED', 'INFRA_ERROR', false],
    ['TIMEOUT', 'TIMEOUT', false],
    ['ROLLED_BACK', 'ROLLED_BACK', true],
    ['REVOKED', 'REVOKED', true],
  ] as const)('normalizes bridge status %s as %s', (status, outcome, receiptEligible) => {
    const dispatch = prepared();
    const normalized = normalizeControlBridgeG2bResult(
      dispatch,
      SOURCE_SHA,
      bridgeResult(dispatch, { status }),
    );

    expect(normalized.outcome).toBe(outcome);
    expect(normalized.receiptEligible).toBe(receiptEligible);
  });

  it('fails closed when evidence digest is absent', () => {
    const dispatch = prepared();
    expectPreparationError(
      () =>
        normalizeControlBridgeG2bResult(
          dispatch,
          SOURCE_SHA,
          bridgeResult(dispatch, { request_digest: null }),
        ),
      'EVIDENCE_MISSING',
    );
  });

  it('fails closed on an inconsistent response', () => {
    const dispatch = prepared();
    expectPreparationError(
      () =>
        normalizeControlBridgeG2bResult(
          dispatch,
          SOURCE_SHA,
          bridgeResult(dispatch, { operation: 'revoke' }),
        ),
      'CORRELATION_MISMATCH',
    );
  });

  it('accepts a declared replay only when correlation remains identical', () => {
    const dispatch = prepared();
    const normalized = normalizeControlBridgeG2bResult(
      dispatch,
      SOURCE_SHA,
      bridgeResult(dispatch, { replayed: true }),
    );
    expect(normalized.replayed).toBe(true);

    expectPreparationError(
      () =>
        normalizeControlBridgeG2bResult(
          dispatch,
          SOURCE_SHA,
          bridgeResult(dispatch, {
            replayed: true,
            request_id: 'MCF-G2B-OTHER-0001',
          }),
        ),
      'CORRELATION_MISMATCH',
    );
  });

  it('rejects a result associated with a different MCF source SHA', () => {
    const dispatch = prepared();
    expectPreparationError(
      () => normalizeControlBridgeG2bResult(dispatch, 'c'.repeat(40), bridgeResult(dispatch)),
      'WRONG_SOURCE_SHA',
    );
  });
});
