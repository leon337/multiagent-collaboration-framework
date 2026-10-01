import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import {
  McfLedgerMemoryWriteInvalidError,
  type McfLedgerWriteApiService,
  McfLedgerMemoryWriteUnavailableError,
} from './mcf-ledger-write-api.service.js';
import { McfLedgerWriteController } from './mcf-ledger-write.controller.js';

describe('McfLedgerWriteController', () => {
  it('returns Receipt-only response from explicit registration', async () => {
    const response = {
      schema_version: 1 as const,
      provider_project_id: 'cognitive-ledger' as const,
      operation: 'registrar_memoria' as const,
      explicit_confirmation: true as const,
      memory_payload_persisted_by_mcf: false as const,
      receipt: {
        schema: 'cognitive_ledger_memory_receipt/v1' as const,
        operacao: 'registrar_memoria' as const,
        evento_id: 'ec-1',
        provider_status: 'criado' as const,
        read_back: 'verified' as const,
        event_sha256: 'a'.repeat(64),
        receipt_sha256: 'b'.repeat(64),
      },
    };
    const registerExplicit = vi.fn().mockResolvedValue(response);
    const controller = new McfLedgerWriteController({
      registerExplicit,
    } as unknown as McfLedgerWriteApiService);
    await expect(controller.registerExplicit({ confirmacao_explicita: true })).resolves.toBe(response);
  });

  it('maps invalid input to 400 and upstream failure to generic 503', async () => {
    const invalid = new McfLedgerWriteController({
      registerExplicit: vi.fn().mockRejectedValue(new McfLedgerMemoryWriteInvalidError()),
    } as unknown as McfLedgerWriteApiService);
    await expect(invalid.registerExplicit({})).rejects.toBeInstanceOf(BadRequestException);

    const unavailable = new McfLedgerWriteController({
      registerExplicit: vi.fn().mockRejectedValue(
        new Error('secret-token:private-memory-fragment'),
      ),
    } as unknown as McfLedgerWriteApiService);
    const error = await unavailable.registerExplicit({}).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ServiceUnavailableException);
    expect(JSON.stringify((error as ServiceUnavailableException).getResponse())).not.toContain(
      'private-memory-fragment',
    );
  });
});
