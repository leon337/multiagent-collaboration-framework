import { describe, expect, it } from 'vitest';

import { loadRuntimeConfig } from './config.js';

const baseEnvironment = {
  DATABASE_URL: 'postgresql://rsa:rsa_test@127.0.0.1:5432/rsa',
};

describe('Gemini runtime configuration', () => {
  it('keeps Gemini disabled with zero paid fallback by default', () => {
    expect(loadRuntimeConfig(baseEnvironment)).toMatchObject({
      MCF_GEMINI_ENABLED: false,
      MCF_GEMINI_MODEL: '',
      MCF_GEMINI_MODEL_ALLOWLIST: [],
      MCF_GEMINI_PAID_FALLBACK_ALLOWED: false,
    });
  });

  it('fails closed when Gemini is enabled without a server-side API key', () => {
    expect(() =>
      loadRuntimeConfig({
        ...baseEnvironment,
        MCF_GEMINI_ENABLED: 'true',
        MCF_GEMINI_MODEL: 'gemini-test',
        MCF_GEMINI_MODEL_ALLOWLIST: 'gemini-test',
      }),
    ).toThrow(/GEMINI_API_KEY/u);
  });

  it('fails closed when the configured model is outside the allowlist', () => {
    expect(() =>
      loadRuntimeConfig({
        ...baseEnvironment,
        MCF_GEMINI_ENABLED: 'true',
        GEMINI_API_KEY: 'test-only-key',
        MCF_GEMINI_MODEL: 'gemini-not-approved',
        MCF_GEMINI_MODEL_ALLOWLIST: 'gemini-approved',
      }),
    ).toThrow(/allowlist/u);
  });

  it('rejects paid fallback even when the model is otherwise valid', () => {
    expect(() =>
      loadRuntimeConfig({
        ...baseEnvironment,
        MCF_GEMINI_ENABLED: 'true',
        GEMINI_API_KEY: 'test-only-key',
        MCF_GEMINI_MODEL: 'gemini-test',
        MCF_GEMINI_MODEL_ALLOWLIST: 'gemini-test',
        MCF_GEMINI_PAID_FALLBACK_ALLOWED: 'true',
      }),
    ).toThrow(/paid fallback/u);
  });

  it('accepts an enabled allowlisted Gemini model without paid fallback', () => {
    expect(
      loadRuntimeConfig({
        ...baseEnvironment,
        MCF_GEMINI_ENABLED: 'true',
        GEMINI_API_KEY: 'test-only-key',
        MCF_GEMINI_MODEL: 'gemini-test',
        MCF_GEMINI_MODEL_ALLOWLIST: 'gemini-test, gemini-other, gemini-test',
      }),
    ).toMatchObject({
      MCF_GEMINI_ENABLED: true,
      MCF_GEMINI_MODEL: 'gemini-test',
      MCF_GEMINI_MODEL_ALLOWLIST: ['gemini-test', 'gemini-other'],
      MCF_GEMINI_PAID_FALLBACK_ALLOWED: false,
    });
  });
});
