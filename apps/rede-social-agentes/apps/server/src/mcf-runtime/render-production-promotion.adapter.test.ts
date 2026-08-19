import { describe, expect, it } from 'vitest';

import { RenderProductionPromotionAdapter } from './render-production-promotion.adapter.js';

describe('RenderProductionPromotionAdapter', () => {
  it('exists as the runtime-side production promotion boundary', () => {
    expect(RenderProductionPromotionAdapter).toBeTypeOf('function');
  });
});
