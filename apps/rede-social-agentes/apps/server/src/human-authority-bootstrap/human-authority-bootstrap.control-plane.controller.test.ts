import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { HumanAuthorityBootstrapControlPlaneController } from './human-authority-bootstrap.control-plane.controller.js';
import type { HumanAuthorityBootstrapService } from './human-authority-bootstrap.service.js';
import type { HumanAuthorityRuntimeVerifier } from './human-authority-runtime-verifier.js';

const intentRef = randomUUID();
const claimRef = randomUUID();
const request = { id: 'corr', bootstrapControlPlane: { principalFingerprint: 'p' } } as never;

describe('HumanAuthorityBootstrapControlPlaneController evidence boundary', () => {
  it('does not expose a BOUND result contract before behavioral E2E verification exists', async () => {
    const service = { finalizeIntent: vi.fn() } as unknown as HumanAuthorityBootstrapService;
    const verifier = {} as HumanAuthorityRuntimeVerifier;
    const controller = new HumanAuthorityBootstrapControlPlaneController(service, verifier);
    await expect(
      controller.result(
        intentRef,
        {
          claimRef,
          outcome: 'BOUND',
          receiptDigest: 'a'.repeat(64),
          behaviorEvidenceDigest: 'b'.repeat(64),
        },
        request,
      ),
    ).rejects.toThrow();
    expect(service.finalizeIntent).not.toHaveBeenCalled();
  });

  it('derives RUNTIME_VERIFIED evidence server-side and rejects caller evidence fields', async () => {
    const service = {
      markRuntimeVerified: vi.fn(async () => undefined),
    } as unknown as HumanAuthorityBootstrapService;
    const verifier = {
      verify: vi.fn(async () => ({
        runtimeEvidenceDigest: 'c'.repeat(64),
        expectedCommitSha: 'x',
        observedCommitSha: 'x',
        ready: true,
        runtime: 'render',
      })),
    } as unknown as HumanAuthorityRuntimeVerifier;
    const controller = new HumanAuthorityBootstrapControlPlaneController(service, verifier);
    await expect(
      controller.runtimeVerified(
        intentRef,
        { claimRef, runtimeEvidenceDigest: 'd'.repeat(64) },
        request,
      ),
    ).rejects.toThrow();
    const result = await controller.runtimeVerified(intentRef, { claimRef }, request);
    expect(result).toMatchObject({ state: 'RUNTIME_VERIFIED', identityDisclosed: false });
    expect(service.markRuntimeVerified).toHaveBeenCalledWith(intentRef, claimRef, 'c'.repeat(64));
  });
});
