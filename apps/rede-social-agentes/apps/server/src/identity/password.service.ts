import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

import { Injectable } from '@nestjs/common';

const scrypt = promisify(scryptCallback);
const keyLength = 64;

@Injectable()
export class PasswordService {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16);
    const derivedKey = (await scrypt(password, salt, keyLength)) as Buffer;

    return ['scrypt', salt.toString('base64url'), derivedKey.toString('base64url')].join('$');
  }

  async verify(password: string, encodedHash: string): Promise<boolean> {
    const [algorithm, saltValue, expectedValue] = encodedHash.split('$');

    if (algorithm !== 'scrypt' || !saltValue || !expectedValue) {
      return false;
    }

    const salt = Buffer.from(saltValue, 'base64url');
    const expected = Buffer.from(expectedValue, 'base64url');
    const actual = (await scrypt(password, salt, expected.length)) as Buffer;

    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }
}
