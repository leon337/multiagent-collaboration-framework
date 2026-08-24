import {
  BadGatewayException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { McfCloudContextReadReceipt } from '@rsa/contracts';
import { describe, expect, it, vi } from 'vitest';

import { McfCloudContextReadController } from './mcf-cloud-context-read.controller.js';
import { McfCloudContextReadUnavailableError } from './mcf-cloud-context-read.service.js';
import type { McfCloudContextReadService } from './mcf-cloud-context-read.service.js';

const receipt: McfCloudContextReadReceipt = {
  schema_version: 1,
  read_only: true,
  material_action: false,
  provider_payload_persisted_by_mcf: false,
  evidence_only: true,
  provider_response: {
    protocol: 'MCF_CLOUD_CONTEXT_READ_RESULT_V1',
    request_id: 'MCF-CLOUD-controller-test',
    project_id: 'cloud-infrastructure',
    operation: 'context.get',
    status: 'PASS',
    result: {},
    error: null,
    freshness: {
      observed_at: '2026-08-23T18:00:00Z',
      operational_state: 'LIVE_REQUIRED',
      workspace_observation: 'LIVE_LOCAL_DISPOSABLE',
      source_mode: 'READ_AT_REQUEST_TIME',
    },
    provenance: {
      repository: 'leon337/cloud-infrastructure',
      adapter_config: 'platform/control-bridge/mcf-cloud-context-read-config.yaml',
      sources: [],
    },
  },
};

function controller(
  readOnly: () => Promise<McfCloudContextReadReceipt>,
): McfCloudContextReadController {
  return new McfCloudContextReadController({ readOnly } as McfCloudContextReadService);
}

describe('McfCloudContextReadController', () => {
  it('exposes only the fixed read-only operation', async () => {
    const readOnly = vi.fn().mockResolvedValue(receipt);

    await expect(controller(readOnly).readOnly({})).resolves.toBe(receipt);
    expect(readOnly).toHaveBeenCalledOnce();
  });

  it('rejects every client-supplied query field before invoking the adapter', async () => {
    const readOnly = vi.fn();

    await expect(
      controller(readOnly).readOnly({ path: '/etc', operation: 'workspace.read' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(readOnly).not.toHaveBeenCalled();
  });

  it('maps disabled and provider failures without exposing internal details', async () => {
    await expect(
      controller(() =>
        Promise.reject(new McfCloudContextReadUnavailableError('MCF_CLOUD_CONTEXT_READ_DISABLED')),
      ).readOnly({}),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);

    await expect(
      controller(() =>
        Promise.reject(new McfCloudContextReadUnavailableError('MCF_CLOUD_CONTEXT_BUSY')),
      ).readOnly({}),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);

    await expect(
      controller(() =>
        Promise.reject(
          new McfCloudContextReadUnavailableError('MCF_CLOUD_CONTEXT_CONTRACT_INVALID'),
        ),
      ).readOnly({}),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });
});
