import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import type { McfContextRecoveryReceipt } from '@rsa/contracts';
import { describe, expect, it, vi } from 'vitest';

import { McfContextRecoveryApiService } from './mcf-context-recovery-api.service.js';
import { McfContextRecoveryController } from './mcf-context-recovery.controller.js';

const receipt: McfContextRecoveryReceipt = {
  schema_version: 1,
  receipt_id: 'controller-test-receipt',
  project_id: null,
  recovery_state: 'SOURCE_UNAVAILABLE',
  recovered_at: '2026-08-23T07:00:00Z',
  read_only: true,
  material_action: false,
  sources: [],
  claims: [],
  warnings: ['PROJECT_NOT_FOUND:fixture'],
  evidence_only: true,
};

describe('McfContextRecoveryController', () => {
  it('exposes only the read-only recovery shape', async () => {
    const recoverReadOnly = vi.fn().mockResolvedValue(receipt);
    const service = { recoverReadOnly } as unknown as McfContextRecoveryApiService;
    const controller = new McfContextRecoveryController(service);

    await expect(controller.recoverReadOnly('TriView', 'true')).resolves.toBe(receipt);
    expect(recoverReadOnly).toHaveBeenCalledWith('TriView', true);
  });

  it('rejects missing, padded and malformed query values', async () => {
    const controller = new McfContextRecoveryController({
      recoverReadOnly: vi.fn(),
    } as unknown as McfContextRecoveryApiService);

    await expect(controller.recoverReadOnly(undefined, undefined)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(controller.recoverReadOnly(' TriView ', 'false')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(controller.recoverReadOnly('TriView', '1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('returns a controlled unavailable response when the endpoint has no lab configuration', async () => {
    const controller = new McfContextRecoveryController(new McfContextRecoveryApiService(null));

    await expect(controller.recoverReadOnly('MCF', 'false')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
