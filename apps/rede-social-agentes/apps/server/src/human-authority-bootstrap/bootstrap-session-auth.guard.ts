import {
  Inject,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import type { DatabaseRow } from '@rsa/database';

import { SessionTokenService } from '../identity/session-token.service.js';
import { BootstrapDatabaseService } from './bootstrap-database.service.js';

export interface BootstrapAuthenticatedHuman {
  accountId: string;
}

export interface BootstrapAuthenticatedRequest extends FastifyRequest {
  authenticatedHuman: BootstrapAuthenticatedHuman;
}

interface SessionRow extends DatabaseRow {
  account_id: string;
}

function bearer(request: FastifyRequest): string | null {
  const raw = request.headers.authorization;
  return typeof raw === 'string' ? (/^Bearer\s+([^\s]+)$/iu.exec(raw)?.[1] ?? null) : null;
}

@Injectable()
export class BootstrapSessionAuthGuard implements CanActivate {
  constructor(
    @Inject(BootstrapDatabaseService) private readonly database: BootstrapDatabaseService,
    @Inject(SessionTokenService) private readonly tokens: SessionTokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const token = bearer(request);
    if (!token)
      throw new UnauthorizedException({
        code: 'INVALID_SESSION',
        message: 'A valid MCF session is required.',
        correlationId: request.id,
      });

    const result = await this.database.query<SessionRow>(
      `select a."id" as "account_id"
       from "sessions" s
       inner join "accounts" a on a."id" = s."account_id"
       where s."token_hash" = $1 and s."revoked_at" is null
         and s."expires_at" > now() and a."status" = 'ACTIVE'
       limit 1`,
      [this.tokens.hash(token)],
    );
    const row = result.rows[0];
    if (!row)
      throw new UnauthorizedException({
        code: 'INVALID_SESSION',
        message: 'A valid MCF session is required.',
        correlationId: request.id,
      });

    (request as BootstrapAuthenticatedRequest).authenticatedHuman = { accountId: row.account_id };
    return true;
  }
}
