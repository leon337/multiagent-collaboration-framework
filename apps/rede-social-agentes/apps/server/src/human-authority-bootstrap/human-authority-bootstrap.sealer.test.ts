import { generateKeyPair } from 'node:crypto';
import { promisify } from 'node:util';
import { compactDecrypt, exportJWK } from 'jose';
import { describe, expect, it } from 'vitest';

import { HumanAuthorityBindingSealer } from './human-authority-bootstrap.sealer.js';

const generate = promisify(generateKeyPair);

describe('HumanAuthorityBindingSealer', () => {
  it('encrypts the account binding for the control plane without returning plaintext', async () => {
    const { publicKey, privateKey } = await generate('rsa', { modulusLength: 2048 });
    const publicJwk = await exportJWK(publicKey);
    const sealer = new HumanAuthorityBindingSealer(JSON.stringify(publicJwk));
    const payload = { accountId: '11111111-1111-4111-8111-111111111111', target: 'STAGING' };

    const sealed = await sealer.seal(payload);
    expect(sealed).not.toContain(payload.accountId);

    const { plaintext } = await compactDecrypt(sealed, privateKey);
    expect(JSON.parse(new TextDecoder().decode(plaintext))).toEqual(payload);
  });
});
