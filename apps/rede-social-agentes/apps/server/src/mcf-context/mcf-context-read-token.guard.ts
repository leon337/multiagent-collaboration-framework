import { createHash, timingSafeEqual } from 'node:crypto';

import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

export const MCF_CONTEXT_READ_TOKEN = Symbol('MCF_CONTEXT_READ_TOKEN');

function digest(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

@Injectable()
export class McfContextReadTokenGuard implements CanActivate {
  private readonly expectedDigest: Buffer | null;

  constructor(@Inject(MCF_CONTEXT_READ_TOKEN) configuredToken: string | undefined) {
    this.expectedDigest =
      configuredToken !== undefined &&
      configuredToken.length >= 32 &&
      configuredToken.length <= 4096
        ? digest(configuredToken)
        : null;
  }

  canActivate(context: ExecutionContext): boolean {
    if (this.expectedDigest === null) {
      throw new ServiceUnavailableException({
        code: 'MCF_CONTEXT_READ_DISABLED',
        message: 'The read-only Context Recovery endpoint is disabled.',
      });
    }

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();
    const supplied = request.headers['x-mcf-context-token'];
    const token = Array.isArray(supplied) ? supplied[0] : supplied;
    if (!token || !timingSafeEqual(digest(token), this.expectedDigest)) {
      throw new UnauthorizedException({
        code: 'MCF_CONTEXT_AUTHENTICATION_FAILED',
        message: 'The Context Recovery read token is invalid.',
      });
    }
    return true;
  }
}
