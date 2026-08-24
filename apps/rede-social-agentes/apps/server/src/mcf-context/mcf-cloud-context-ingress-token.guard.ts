import { createHash, timingSafeEqual } from 'node:crypto';

import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

import { MCF_CONTEXT_READ_TOKEN } from './mcf-context-read-token.guard.js';

export const MCF_CLOUD_CONTEXT_INGRESS_TOKEN = Symbol('MCF_CLOUD_CONTEXT_INGRESS_TOKEN');

function digest(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

function validToken(value: string | undefined): value is string {
  return value !== undefined && value.length >= 32 && value.length <= 4096;
}

@Injectable()
export class McfCloudContextIngressTokenGuard implements CanActivate {
  private readonly expectedDigest: Buffer | null;

  constructor(
    @Inject(MCF_CLOUD_CONTEXT_INGRESS_TOKEN) configuredToken: string | undefined,
    @Inject(MCF_CONTEXT_READ_TOKEN) sharedContextToken: string | undefined,
  ) {
    this.expectedDigest =
      validToken(configuredToken) &&
      (!validToken(sharedContextToken) ||
        !timingSafeEqual(digest(configuredToken), digest(sharedContextToken)))
        ? digest(configuredToken)
        : null;
  }

  canActivate(context: ExecutionContext): boolean {
    if (this.expectedDigest === null) {
      throw new ServiceUnavailableException({
        code: 'MCF_CLOUD_CONTEXT_INGRESS_DISABLED',
        message: 'The local Cloud context ingress is disabled.',
      });
    }

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();
    const supplied = request.headers['x-mcf-cloud-context-token'];
    const token = Array.isArray(supplied) ? supplied[0] : supplied;
    if (!token || !timingSafeEqual(digest(token), this.expectedDigest)) {
      throw new UnauthorizedException({
        code: 'MCF_CLOUD_CONTEXT_AUTHENTICATION_FAILED',
        message: 'The local Cloud context token is invalid.',
      });
    }
    return true;
  }
}
