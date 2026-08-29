import { createHash, timingSafeEqual } from 'node:crypto';

import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
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

@Injectable()
export class McfMissionControlTokenGuard implements CanActivate {
  private readonly expected = digest(loadRuntimeConfig().MCF_MISSION_CONTROL_TOKEN);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();
    const token = bearer(request.headers);

    if (!token || !timingSafeEqual(digest(token), this.expected)) {
      throw new UnauthorizedException({
        code: 'MCF_MISSION_CONTROL_AUTHENTICATION_FAILED',
        message: 'The Mission Control credential is invalid.',
      });
    }
    return true;
  }
}
