import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

import type { AuthenticatedHumanRequest } from './authenticated-request.js';
import { IDENTITY_REPOSITORY, type IdentityRepository } from './identity.repository.js';
import { SessionTokenService } from './session-token.service.js';

function extractBearerToken(request: FastifyRequest): string | null {
  const authorization = request.headers.authorization;
  if (!authorization) {
    return null;
  }

  const match = /^Bearer\s+([^\s]+)$/iu.exec(authorization);
  return match?.[1] ?? null;
}

function unauthorized(correlationId: string): UnauthorizedException {
  return new UnauthorizedException({
    code: 'INVALID_SESSION',
    message: 'A valid session is required.',
    correlationId,
  });
}

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    @Inject(IDENTITY_REPOSITORY) private readonly repository: IdentityRepository,
    @Inject(SessionTokenService) private readonly tokens: SessionTokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const token = extractBearerToken(request);

    if (!token) {
      throw unauthorized(request.id);
    }

    const authenticatedHuman = await this.repository.findActiveSessionByTokenHash(
      this.tokens.hash(token),
    );

    if (!authenticatedHuman) {
      throw unauthorized(request.id);
    }

    (request as AuthenticatedHumanRequest).authenticatedHuman = authenticatedHuman;
    return true;
  }
}
