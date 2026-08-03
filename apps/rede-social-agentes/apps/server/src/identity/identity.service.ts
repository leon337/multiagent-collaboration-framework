import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import type {
  CreateSessionResponse,
  HumanAccountResponse,
  RegisterHumanAccountRequest,
} from '@rsa/contracts';

import { AccountUnavailableError, InvalidCredentialsError } from './identity.errors.js';
import {
  IDENTITY_REPOSITORY,
  type HumanAccountRecord,
  type IdentityRepository,
} from './identity.repository.js';
import { PasswordService } from './password.service.js';
import { SessionTokenService } from './session-token.service.js';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toResponse(account: HumanAccountRecord): HumanAccountResponse {
  return {
    id: account.id,
    email: account.email,
    displayName: account.displayName,
    status: account.status,
    createdAt: account.createdAt.toISOString(),
  };
}

@Injectable()
export class IdentityService {
  constructor(
    @Inject(IDENTITY_REPOSITORY) private readonly repository: IdentityRepository,
    private readonly passwords: PasswordService,
    private readonly sessionTokens: SessionTokenService,
  ) {}

  async registerHumanAccount(
    request: RegisterHumanAccountRequest,
    correlationId: string,
  ): Promise<HumanAccountResponse> {
    const account = await this.repository.createHumanAccount({
      id: randomUUID(),
      email: normalizeEmail(request.email),
      displayName: request.displayName.trim(),
      passwordHash: await this.passwords.hash(request.password),
      correlationId,
    });

    return toResponse(account);
  }

  async createSession(
    email: string,
    password: string,
    correlationId: string,
  ): Promise<CreateSessionResponse> {
    const account = await this.repository.findHumanAccountByEmail(normalizeEmail(email));

    if (!account) {
      throw new InvalidCredentialsError();
    }

    if (account.status !== 'ACTIVE') {
      throw new AccountUnavailableError();
    }

    if (!(await this.passwords.verify(password, account.passwordHash))) {
      throw new InvalidCredentialsError();
    }

    const issued = this.sessionTokens.issue();
    await this.repository.createSession({
      sessionId: issued.sessionId,
      accountId: account.id,
      tokenHash: issued.tokenHash,
      expiresAt: issued.expiresAt,
      correlationId,
    });

    return {
      sessionId: issued.sessionId,
      token: issued.token,
      expiresAt: issued.expiresAt.toISOString(),
      account: toResponse(account),
    };
  }
}
