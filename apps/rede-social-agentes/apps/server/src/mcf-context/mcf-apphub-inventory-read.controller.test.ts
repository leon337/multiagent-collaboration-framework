import {
  BadGatewayException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { McfAppHubInventoryReadController } from './mcf-apphub-inventory-read.controller.js';
import {
  McfAppHubInventoryUnavailableError,
  type McfAppHubInventoryReadService,
} from './mcf-apphub-inventory-read.service.js';

function controller(reader: () => Promise<unknown>): McfAppHubInventoryReadController {
  return new McfAppHubInventoryReadController({
    readOnly: reader,
  } as McfAppHubInventoryReadService);
}

describe('McfAppHubInventoryReadController', () => {
  it('rejects user-controlled project, location and other query parameters', async () => {
    const readOnly = vi.fn();
    const c = controller(readOnly);
    await expect(c.readOnly({ project: 'other-project' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(c.readOnly({ location: 'us-east1' })).rejects.toBeInstanceOf(BadRequestException);
    expect(readOnly).not.toHaveBeenCalled();
  });
  it('uses fixed service with no query arguments', async () => {
    const readOnly = vi.fn().mockResolvedValue({ read_only: true });
    await expect(controller(readOnly).readOnly({})).resolves.toEqual({ read_only: true });
    expect(readOnly).toHaveBeenCalledExactlyOnceWith();
  });
  it('maps disabled, unauthorized upstream and unexpected failures without revealing secrets', async () => {
    await expect(
      controller(() =>
        Promise.reject(new McfAppHubInventoryUnavailableError('MCF_APPHUB_READ_DISABLED')),
      ).readOnly({}),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    await expect(
      controller(() =>
        Promise.reject(new McfAppHubInventoryUnavailableError('MCF_APPHUB_AUTH_FAILED')),
      ).readOnly({}),
    ).rejects.toBeInstanceOf(BadGatewayException);
    await expect(
      controller(() => Promise.reject(new Error('secrets'))).readOnly({}),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });
});
