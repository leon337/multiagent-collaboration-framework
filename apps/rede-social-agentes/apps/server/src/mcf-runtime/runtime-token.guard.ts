import { createHash, timingSafeEqual } from 'node:crypto';

import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { loadRuntimeConfig } from '../config.js';

function tokenDigest(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

@Injectable()
export class McfRuntimeTokenGuard implements CanActivate {
  private readonly expectedDigest = tokenDigest(loadRuntimeConfig().MCF_RUNTIME_TOKEN);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();
    const supplied = request.headers['x-mcf-runtime-token'];
    const token = Array.isArray(supplied) ? supplied[0] : supplied;

    if (!token || !timingSafeEqual(tokenDigest(token), this.expectedDigest)) {
      throw new UnauthorizedException({
        code: 'MCF_RUNTIME_AUTHENTICATION_FAILED',
        message: 'The MCF runtime token is invalid.',
      });
    }

    return true;
  }
}
