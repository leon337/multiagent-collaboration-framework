import { createHash, randomBytes, randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

const sessionLifetimeMilliseconds = 7 * 24 * 60 * 60 * 1000;

export interface IssuedSessionToken {
  sessionId: string;
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

@Injectable()
export class SessionTokenService {
  issue(now = new Date()): IssuedSessionToken {
    const token = randomBytes(32).toString('base64url');

    return {
      sessionId: randomUUID(),
      token,
      tokenHash: this.hash(token),
      expiresAt: new Date(now.getTime() + sessionLifetimeMilliseconds),
    };
  }

  hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
