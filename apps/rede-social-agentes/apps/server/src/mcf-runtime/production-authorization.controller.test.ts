import { describe, expect, it, vi } from 'vitest';

import { ProductionAuthorizationController } from './production-authorization.controller.js';
import type { ProductionAuthorizationService } from './production-authorization.service.js';

const missionId = '11111111-1111-4111-8111-111111111111';
const phaseId = '22222222-2222-4222-8222-222222222222';
const releaseSha = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

function harness() {
  const service = {
    recordLeoOperationalGate: vi.fn(async () => ({
      accepted: true as const,
      duplicate: false,
      operationalGate: 'LEO' as const,
      targetSha: releaseSha,
    })),
    resolveProductionAuthorization: vi.fn(async () => ({
      state: 'BLOCKED' as const,
      reason: 'OPERATIONAL_GATE_REQUIRED' as const,
      targetSha: releaseSha,
    })),
  } as unknown as ProductionAuthorizationService;

  return {
    controller: new ProductionAuthorizationController(service),
    service,
  };
}

const gateBody = {
  missionId,
  phaseId,
  releaseSha,
  decision: 'APPROVE',
  sourceRef: 'leo:production-gate:approve',
  evidenceRef: 'evidence:leo:approve',
};

describe('ProductionAuthorizationController', () => {
  it('rejects caller-supplied LÉO identity or authority fields', async () => {
    const { controller, service } = harness();

    await expect(
      controller.recordOperationalGate(
        {
          ...gateBody,
          actor: 'LEO',
          operationalAuthority: 'LEO',
        },
        { id: 'correlation-1' },
      ),
    ).rejects.toThrow();

    expect(service.recordLeoOperationalGate).not.toHaveBeenCalled();
  });

  it('forwards only validated gate fields to the service', async () => {
    const { controller, service } = harness();

    await expect(
      controller.recordOperationalGate(gateBody, { id: 'correlation-2' }),
    ).resolves.toEqual({
      accepted: true,
      duplicate: false,
      operationalGate: 'LEO',
      targetSha: releaseSha,
    });
    expect(service.recordLeoOperationalGate).toHaveBeenCalledWith(gateBody);
  });

  it('resolves authorization using mission, phase and exact SHA only', async () => {
    const { controller, service } = harness();
    const input = { missionId, phaseId, releaseSha };

    await expect(controller.resolve(input, { id: 'correlation-3' })).resolves.toEqual({
      state: 'BLOCKED',
      reason: 'OPERATIONAL_GATE_REQUIRED',
      targetSha: releaseSha,
    });
    expect(service.resolveProductionAuthorization).toHaveBeenCalledWith(input);
  });
});
