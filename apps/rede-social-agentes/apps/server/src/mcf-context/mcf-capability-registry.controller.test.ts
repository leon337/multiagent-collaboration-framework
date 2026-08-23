import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import type { McfCapabilityRegistrySnapshot } from '@rsa/contracts';
import { describe, expect, it, vi } from 'vitest';

import {
  McfCapabilityRegistryUnavailableError,
  type McfCapabilityRegistryApiService,
} from './mcf-capability-registry-api.service.js';
import { McfCapabilityRegistryController } from './mcf-capability-registry.controller.js';

const snapshot: McfCapabilityRegistrySnapshot = {
  schema_version: 1,
  retrieved_at: '2026-08-23T08:00:00.000Z',
  project_id: null,
  read_only: true,
  evidence_only: true,
  entries: [],
  sources: [],
};

describe('McfCapabilityRegistryController', () => {
  it('exposes only the read-only listing shape', () => {
    const listReadOnly = vi.fn().mockReturnValue(snapshot);
    const controller = new McfCapabilityRegistryController({
      listReadOnly,
    } as unknown as McfCapabilityRegistryApiService);

    expect(controller.listReadOnly('triview-workspace-linux')).toBe(snapshot);
    expect(listReadOnly).toHaveBeenCalledWith('triview-workspace-linux');
  });

  it('rejects malformed project identifiers', () => {
    const controller = new McfCapabilityRegistryController({
      listReadOnly: vi.fn(),
    } as unknown as McfCapabilityRegistryApiService);

    for (const value of ['', ' TriView ', 'TriView', '../triview']) {
      expect(() => controller.listReadOnly(value)).toThrow(BadRequestException);
    }
  });

  it('returns a controlled unavailable response when sources are not configured', () => {
    const controller = new McfCapabilityRegistryController({
      listReadOnly: () => {
        throw new McfCapabilityRegistryUnavailableError();
      },
    } as unknown as McfCapabilityRegistryApiService);

    expect(() => controller.listReadOnly(undefined)).toThrow(ServiceUnavailableException);
  });
});
