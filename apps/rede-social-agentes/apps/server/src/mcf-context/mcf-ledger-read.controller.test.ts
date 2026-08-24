import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import {
  McfLedgerQueryInvalidError,
  type McfLedgerReadApiService,
  McfLedgerReadUnavailableError,
} from './mcf-ledger-read-api.service.js';
import { McfLedgerReadController } from './mcf-ledger-read.controller.js';

describe('McfLedgerReadController', () => {
  it('exposes the ephemeral read-query response without a persistence receipt', async () => {
    const response = {
      schema_version: 1 as const,
      provider_project_id: 'cognitive-ledger' as const,
      operation: 'ler_diario' as const,
      read_only: true as const,
      memory_payload_persisted_by_mcf: false as const,
      result: { estado: 'ok' },
    };
    const queryReadOnly = vi.fn().mockResolvedValue(response);
    const controller = new McfLedgerReadController({
      queryReadOnly,
    } as unknown as McfLedgerReadApiService);
    const body = { operation: 'ler_diario', input: { limite: 2 } };

    await expect(controller.queryReadOnly(body)).resolves.toBe(response);
    expect(queryReadOnly).toHaveBeenCalledWith(body);
  });

  it('maps malformed inputs to a generic 400 response', async () => {
    const controller = new McfLedgerReadController({
      queryReadOnly: vi.fn().mockRejectedValue(new McfLedgerQueryInvalidError()),
    } as unknown as McfLedgerReadApiService);
    await expect(controller.queryReadOnly({ token: 'must-not-echo' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('maps every upstream failure to a generic fail-closed 503 response', async () => {
    for (const failure of [
      new McfLedgerReadUnavailableError(),
      new Error('secret-token:private-memory-fragment'),
    ]) {
      const controller = new McfLedgerReadController({
        queryReadOnly: vi.fn().mockRejectedValue(failure),
      } as unknown as McfLedgerReadApiService);
      const error = await controller
        .queryReadOnly({ operation: 'ler_diario', input: {} })
        .catch((reason: unknown) => reason);
      expect(error).toBeInstanceOf(ServiceUnavailableException);
      expect(JSON.stringify((error as ServiceUnavailableException).getResponse())).not.toContain(
        'secret-token',
      );
      expect(JSON.stringify((error as ServiceUnavailableException).getResponse())).not.toContain(
        'private-memory-fragment',
      );
    }
  });
});
