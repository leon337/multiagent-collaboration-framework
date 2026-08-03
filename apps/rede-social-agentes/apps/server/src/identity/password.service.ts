import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

import { Injectable } from '@nestjs/common';

const keyLength = 64;
const parameters = {
  cost: 16_384,
  blockSize: 8,
  parallelization: 1,
  maxMemory: 64 * 1024 * 1024,
} as const;

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password,
      salt,
      keyLength,
      {
        N: parameters.cost,
        r: parameters.blockSize,
        p: parameters.parallelization,
        maxmem: parameters.maxMemory,
      },
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(derivedKey);
      },
    );
  });
}

@Injectable()
export class PasswordService {
  private readonly dummySalt = randomBytes(16);

  async hash(password: string): Promise<string> {
    const salt = randomBytes(16);
    const derivedKey = await deriveKey(password, salt);

    return [
      'scrypt',
      'v1',
      String(parameters.cost),
      String(parameters.blockSize),
      String(parameters.parallelization),
      salt.toString('base64url'),
      derivedKey.toString('base64url'),
    ].join('$');
  }

  async verify(password: string, encodedHash: string): Promise<boolean> {
    const [algorithm, version, cost, blockSize, parallelization, saltValue, expectedValue] =
      encodedHash.split('$');

    if (
      algorithm !== 'scrypt' ||
      version !== 'v1' ||
      Number(cost) !== parameters.cost ||
      Number(blockSize) !== parameters.blockSize ||
      Number(parallelization) !== parameters.parallelization ||
      !saltValue ||
      !expectedValue
    ) {
      return false;
    }

    const salt = Buffer.from(saltValue, 'base64url');
    const expected = Buffer.from(expectedValue, 'base64url');
    const actual = await deriveKey(password, salt);

    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }

  async consumeVerificationCost(password: string): Promise<void> {
    await deriveKey(password, this.dummySalt);
  }
}
