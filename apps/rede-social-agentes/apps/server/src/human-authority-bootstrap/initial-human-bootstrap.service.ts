import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';

import type { CreateSessionResponse } from '@rsa/contracts';
import type { PasswordService } from '../identity/password.service.js';
import type { SessionTokenService } from '../identity/session-token.service.js';

export interface InitialHumanBootstrapCreateInput {
  accountId: string;
  email: string;
  displayName: string;
  passwordHash: string;
  sessionId: string;
  tokenHash: string;
  expiresAt: Date;
  now: Date;
  correlationId: string;
}

export type InitialHumanBootstrapCreateResult =
  { status: 'CREATED'; createdAt: Date } | { status: 'ALREADY_INITIALIZED' };

export interface InitialHumanBootstrapRepository {
  createInitialHuman(
    input: InitialHumanBootstrapCreateInput,
  ): Promise<InitialHumanBootstrapCreateResult>;
}

export class InitialHumanBootstrapRegistrationTokenError extends Error {
  constructor() {
    super('Initial human registration token is invalid or registration is disabled.');
  }
}

export class InitialHumanBootstrapAlreadyInitializedError extends Error {
  constructor() {
    super('The initial human authority account has already been initialized.');
  }
}

function tokenMatches(expected: string, presented: string): boolean {
  const expectedDigest = createHash('sha256').update(expected).digest();
  const presentedDigest = createHash('sha256').update(presented).digest();
  return timingSafeEqual(expectedDigest, presentedDigest);
}

export class InitialHumanBootstrapService {
  constructor(
    private readonly repository: InitialHumanBootstrapRepository,
    private readonly passwords: Pick<PasswordService, 'hash'>,
    private readonly tokens: Pick<SessionTokenService, 'issue'>,
    private readonly configuredEmail?: string,
    private readonly registrationToken?: string,
  ) {}

  async register(
    input: { password: string; displayName: string },
    presentedToken: string,
    now = new Date(),
    correlationId: string = randomUUID(),
  ): Promise<CreateSessionResponse> {
    if (
      !this.configuredEmail ||
      !this.registrationToken ||
      !tokenMatches(this.registrationToken, presentedToken)
    ) {
      throw new InitialHumanBootstrapRegistrationTokenError();
    }

    const email = this.configuredEmail.trim().toLowerCase();
    const displayName = input.displayName.trim();
    const passwordHash = await this.passwords.hash(input.password);
    const issued = this.tokens.issue(now);
    const accountId = randomUUID();
    const created = await this.repository.createInitialHuman({
      accountId,
      email,
      displayName,
      passwordHash,
      sessionId: issued.sessionId,
      tokenHash: issued.tokenHash,
      expiresAt: issued.expiresAt,
      now,
      correlationId,
    });

    if (created.status !== 'CREATED') throw new InitialHumanBootstrapAlreadyInitializedError();

    return {
      sessionId: issued.sessionId,
      token: issued.token,
      expiresAt: issued.expiresAt.toISOString(),
      account: {
        id: accountId,
        email,
        displayName,
        status: 'ACTIVE',
        createdAt: created.createdAt.toISOString(),
      },
    };
  }
}
