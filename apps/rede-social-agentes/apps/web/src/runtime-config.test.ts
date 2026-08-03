import { describe, expect, it } from 'vitest';

import { resolveApiBaseUrl } from './runtime-config';

describe('resolveApiBaseUrl', () => {
  it('accepts an exact HTTPS origin in production', () => {
    expect(resolveApiBaseUrl('https://rsa-api-free.onrender.com', true)).toBe(
      'https://rsa-api-free.onrender.com',
    );
  });

  it('returns null while the external API has not been connected', () => {
    expect(resolveApiBaseUrl(undefined, true)).toBeNull();
    expect(resolveApiBaseUrl('   ', true)).toBeNull();
  });

  it.each([
    'http://rsa-api-free.onrender.com',
    'https://rsa-api-free.onrender.com/v1',
    'https://user:secret@rsa-api-free.onrender.com',
  ])('rejects an unsafe production API origin: %s', (origin) => {
    expect(() => resolveApiBaseUrl(origin, true)).toThrow();
  });
});
