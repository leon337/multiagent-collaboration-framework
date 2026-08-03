import type { AccountStatus } from '@rsa/contracts';

export const IDENTITY_REPOSITORY = Symbol('IDENTITY_REPOSITORY');

export interface HumanAccountRecord {
  id: string;
  email: string;
  displayName: string;
  status: AccountStatus;
  passwordHash: string;
  createdAt: Date;
}

export interface AuthenticatedHumanRecord {
  accountId: string;
  email: string;
  displayName: string;
  sessionId: string;
  sessionExpiresAt: Date;
}

export interface CreateHumanAccountInput {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  correlationId: string;
}

export interface CreateSessionInput {
  sessionId: string;
  accountId: string;
  tokenHash: string;
  expiresAt: Date;
  correlationId: string;
}

export interface RevokeSessionInput {
  sessionId: string;
  accountId: string;
  correlationId: string;
}

export interface IdentityRepository {
  createHumanAccount(input: CreateHumanAccountInput): Promise<HumanAccountRecord>;
  findHumanAccountByEmail(email: string): Promise<HumanAccountRecord | null>;
  createSession(input: CreateSessionInput): Promise<void>;
  findActiveSessionByTokenHash(tokenHash: string): Promise<AuthenticatedHumanRecord | null>;
  revokeSession(input: RevokeSessionInput): Promise<boolean>;
}
