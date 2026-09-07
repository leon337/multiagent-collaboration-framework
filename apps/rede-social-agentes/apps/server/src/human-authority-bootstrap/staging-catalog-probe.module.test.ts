import { describe, expect, it } from 'vitest';

import { BootstrapIssuerModule } from './bootstrap-issuer.module.js';
import { McfRuntimeModule } from '../mcf-runtime/mcf-runtime.module.js';
import { StagingCatalogProbeController } from './staging-catalog-probe.controller.js';
import { StagingCatalogProbeService } from './staging-catalog-probe.service.js';

describe('staging catalog probe module wiring', () => {
  it('registers the probe controller and database-backed service provider', () => {
    const controllers = Reflect.getMetadata('controllers', BootstrapIssuerModule) as unknown[];
    const providers = Reflect.getMetadata('providers', BootstrapIssuerModule) as unknown[];

    expect(controllers).toContain(StagingCatalogProbeController);
    expect(
      providers.some((provider) => {
        if (provider === StagingCatalogProbeService) return true;
        if (typeof provider !== 'object' || provider === null) return false;
        return Reflect.get(provider as object, 'provide') === StagingCatalogProbeService;
      }),
    ).toBe(true);
    const runtimeControllers = Reflect.getMetadata('controllers', McfRuntimeModule) as unknown[];
    expect(runtimeControllers).not.toContain(StagingCatalogProbeController);
  });
});
