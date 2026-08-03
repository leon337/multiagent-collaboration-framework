import { describe, expect, it } from 'vitest';

import { PasswordService } from './password.service.js';

describe('PasswordService', () => {
  const passwords = new PasswordService();

  it('stores a salted hash instead of the password', async () => {
    const encoded = await passwords.hash('a-secure-password');

    expect(encoded).toMatch(/^scrypt\$/u);
    expect(encoded).not.toContain('a-secure-password');
    await expect(passwords.verify('a-secure-password', encoded)).resolves.toBe(true);
  });

  it('rejects an incorrect password and malformed hashes', async () => {
    const encoded = await passwords.hash('correct-password');

    await expect(passwords.verify('wrong-password', encoded)).resolves.toBe(false);
    await expect(passwords.verify('correct-password', 'invalid')).resolves.toBe(false);
  });
});
