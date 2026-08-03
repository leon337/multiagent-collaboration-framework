import { describe, expect, it } from 'vitest';

import { loadRuntimeConfig } from './config.js';

const baseEnvironment = {
  DATABASE_URL: 'postgresql://rsa:rsa_test@127.0.0.1:5432/rsa',
};

const productionEnvironment = {
  ...baseEnvironment,
  NODE_ENV: 'production',
  RATE_LIMIT_KEY_SECRET: 'a-production-secret-with-at-least-32-characters',
  TRUST_PROXY: 'true',
  BODY_LIMIT_BYTES: '131072',
};

describe('loadRuntimeConfig', () => {
  it('rejects the development rate-limit secret in production', () => {
    expect(() =>
      loadRuntimeConfig({
        ...baseEnvironment,
        NODE_ENV: 'production',
        ALLOWED_ORIGINS: 'https://rsa-pilot.pages.dev',
      }),
    ).toThrow();
  });

  it('accepts explicit production hardening values and exact HTTPS origins', () => {
    expect(
      loadRuntimeConfig({
        ...productionEnvironment,
        ALLOWED_ORIGINS:
          'https://rsa-pilot.pages.dev, https://preview.rsa-pilot.pages.dev, https://rsa-pilot.pages.dev',
      }),
    ).toMatchObject({
      NODE_ENV: 'production',
      TRUST_PROXY: true,
      BODY_LIMIT_BYTES: 131072,
      ALLOWED_ORIGINS: [
        'https://rsa-pilot.pages.dev',
        'https://preview.rsa-pilot.pages.dev',
      ],
    });
  });

  it.each([
    'http://rsa-pilot.pages.dev',
    'https://rsa-pilot.pages.dev/path',
    'https://user:password@rsa-pilot.pages.dev',
  ])('rejects an unsafe production origin: %s', (origin) => {
    expect(() =>
      loadRuntimeConfig({
        ...productionEnvironment,
        ALLOWED_ORIGINS: origin,
      }),
    ).toThrow();
  });
});
