import { describe, expect, it } from 'vitest';

import { loadRuntimeConfig } from './config.js';

const baseEnvironment = {
  DATABASE_URL: 'postgresql://rsa:rsa_test@127.0.0.1:5432/rsa',
};

describe('loadRuntimeConfig', () => {
  it('rejects the development rate-limit secret in production', () => {
    expect(() =>
      loadRuntimeConfig({
        ...baseEnvironment,
        NODE_ENV: 'production',
      }),
    ).toThrow();
  });

  it('accepts explicit production hardening values', () => {
    expect(
      loadRuntimeConfig({
        ...baseEnvironment,
        NODE_ENV: 'production',
        RATE_LIMIT_KEY_SECRET: 'a-production-secret-with-at-least-32-characters',
        TRUST_PROXY: 'true',
        BODY_LIMIT_BYTES: '131072',
      }),
    ).toMatchObject({
      NODE_ENV: 'production',
      TRUST_PROXY: true,
      BODY_LIMIT_BYTES: 131072,
    });
  });
});
