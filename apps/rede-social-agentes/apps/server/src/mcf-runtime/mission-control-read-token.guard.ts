import { createHash, timingSafeEqual } from 'node:crypto';

import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

import { loadRuntimeConfig } from '../config.js';

function digest(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

function bearer(headers: Record<string, string | string[] | undefined>): string | null {
  const raw = headers.authorization;
  const authorization = Array.isArray(raw) ? raw[0] : raw;
  if (!authorization) return null;
  return /^Bearer\s+([^\s]+)$/iu.exec(authorization)?.[1] ?? null;
}

/**
 * Separate service identity for read-only Mission Control snapshots.
 *
 * Never falls back to the operational MCF_MISSION_CONTROL_TOKEN (dispatch).
 * Without a configured token the endpoint is disabled, not made public.
 */
@Injectable()
export class McfMissionControlReadTokenGuard implements CanActivate {
  private readonly expected: Buffer | null;

  constructor() {
    const config = loadRuntimeConfig();
    this.expected = config.MCF_MISSION_CONTROL_READ_TOKEN
      ? digest(config.MCF_MISSION_CONTROL_READ_TOKEN)
      : null;
  }

  canActivate(context: ExecutionContext): boolean {
    if (this.expected === null) {
      throw new ServiceUnavailableException({
        code: 'MCF_MISSION_CONTROL_READ_NOT_CONFIGURED',
        message: 'Mission Control read-only access is not configured.',
      });
    }

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();
    const token = bearer(request.headers);
    if (!token || !timingSafeEqual(digest(token), this.expected)) {
      throw new UnauthorizedException({
        code: 'MCF_MISSION_CONTROL_READ_AUTHENTICATION_FAILED',
        message: 'The Mission Control read-only credential is invalid.',
      });
    }
    return true;
  }
}
