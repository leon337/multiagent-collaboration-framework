import { createHash, timingSafeEqual } from 'node:crypto';

import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { loadRuntimeConfig } from '../config.js';

function hash(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

function bearer(headers: Record<string, string | string[] | undefined>): string | null {
  const raw = headers.authorization;
  const header = Array.isArray(raw) ? raw[0] : raw;
  if (!header) return null;
  return /^Bearer\s+([^\s]+)$/iu.exec(header)?.[1] ?? null;
}

/**
 * Dedicated READ-only credential for the Mission Control observation route.
 * This token is intentionally not accepted by the dispatch guard.
 * Missing configuration disables the new route (fail closed).
 */
@Injectable()
export class McfMissionControlReadTokenGuard implements CanActivate {
  private readonly expected: Buffer | null;

  constructor() {
    const readToken = loadRuntimeConfig().MCF_MISSION_CONTROL_READ_TOKEN;
    this.expected = readToken ? hash(readToken) : null;
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();
    const token = bearer(request.headers);
    if (!this.expected || !token || !timingSafeEqual(hash(token), this.expected)) {
      throw new UnauthorizedException({
        code: 'MCF_MISSION_CONTROL_READ_AUTHENTICATION_FAILED',
        message: 'The Mission Control read credential is missing or invalid.',
      });
    }
    return true;
  }
}
