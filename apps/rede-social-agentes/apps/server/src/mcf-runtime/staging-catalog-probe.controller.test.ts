import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { McfMissionControlTokenGuard } from './mission-control-token.guard.js';
import { StagingCatalogProbeController } from './staging-catalog-probe.controller.js';
import {
  StagingCatalogProbeDisabledError,
  StagingCatalogProbeQueryError,
} from './staging-catalog-probe.service.js';

class ProbeServiceStub {
  constructor(
    private readonly result: unknown,
    private readonly failure?: Error,
  ) {}

  async run() {
    if (this.failure) throw this.failure;
    return this.result;
  }
}

const safeResult = {
  schema: 'mcf-staging-catalog-probe/v1' as const,
  status: 'ok' as const,
  checks: { postgres18OrNewer: true },
};

describe('StagingCatalogProbeController', () => {
  it('is a fixed Mission Control protected staging route with zero inputs', () => {
    expect(Reflect.getMetadata('path', StagingCatalogProbeController)).toBe(
      'v1/mcf/staging/catalog-probe',
    );
    expect(Reflect.getMetadata('__guards__', StagingCatalogProbeController)).toContain(
      McfMissionControlTokenGuard,
    );
    expect(StagingCatalogProbeController.prototype.probe.length).toBe(0);
  });

  it('returns the sanitized service result unchanged', async () => {
    const controller = new StagingCatalogProbeController(new ProbeServiceStub(safeResult) as never);

    await expect(controller.probe()).resolves.toEqual(safeResult);
  });

  it('maps non-staging execution to a fixed not-found response', async () => {
    const controller = new StagingCatalogProbeController(
      new ProbeServiceStub(null, new StagingCatalogProbeDisabledError()) as never,
    );

    let observed: unknown;
    try {
      await controller.probe();
    } catch (error) {
      observed = error;
    }

    expect(observed).toBeInstanceOf(NotFoundException);
    const response = (observed as NotFoundException).getResponse();
    expect(response).toEqual({
      code: 'MCF_STAGING_CATALOG_PROBE_DISABLED',
      message: 'The staging catalog probe is unavailable on this service.',
    });
  });

  it('never exposes raw database failures through the HTTP boundary', async () => {
    const controller = new StagingCatalogProbeController(
      new ProbeServiceStub(
        null,
        new Error('RAW_DATABASE_DETAIL_SHOULD_NOT_LEAK hidden_role'),
      ) as never,
    );

    let observed: unknown;
    try {
      await controller.probe();
    } catch (error) {
      observed = error;
    }

    expect(observed).toBeInstanceOf(ServiceUnavailableException);
    const response = (observed as ServiceUnavailableException).getResponse();
    expect(response).toEqual({
      code: 'MCF_STAGING_CATALOG_PROBE_UNAVAILABLE',
      message: 'The staging catalog probe could not produce sanitized evidence.',
    });
    expect(JSON.stringify(response)).not.toContain('RAW_DATABASE_DETAIL_SHOULD_NOT_LEAK');
  });

  it('maps a sanitized query error to the same fixed unavailable response', async () => {
    const controller = new StagingCatalogProbeController(
      new ProbeServiceStub(null, new StagingCatalogProbeQueryError()) as never,
    );

    await expect(controller.probe()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
