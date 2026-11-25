import { createHash, timingSafeEqual } from 'node:crypto';

import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

export const MCF_APPHUB_READ_TOKEN = Symbol('MCF_APPHUB_READ_TOKEN');
export const MCF_APPHUB_READ_HEADER = 'x-mcf-apphub-read-token';

function digest(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

function validToken(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length >= 32 &&
    value.length <= 4096 &&
    value.trim() === value &&
    !/[\r\n,]/u.test(value)
  );
}

export function loadMcfAppHubReadToken(env: NodeJS.ProcessEnv): string | null {
  const provided = env.MCF_APPHUB_READ_TOKEN;
  if (!validToken(provided)) return null;
  for (const forbidden of [
    env.MCF_CONTEXT_READ_TOKEN,
    env.MCF_CLOUD_CONTEXT_INGRESS_TOKEN,
    env.MCF_COGNITIVE_LEDGER_INGRESS_TOKEN,
    env.MCF_COGNITIVE_LEDGER_BEARER_TOKEN,
  ]) {
    if (typeof forbidden === 'string' && timingSafeEqual(digest(provided), digest(forbidden))) {
      return null;
    }
  }
  return provided;
}

function rawHeaderCount(rawHeaders: readonly string[] | undefined): number {
  if (!rawHeaders || rawHeaders.length % 2 !== 0) return 0;
  let found = 0;
  for (let i = 0; i < rawHeaders.length; i += 2) {
    if (rawHeaders[i]?.toLowerCase() === MCF_APPHUB_READ_HEADER) found++;
  }
  return found;
}

@Injectable()
export class McfAppHubInventoryReadTokenGuard implements CanActivate {
  private readonly expectedDigest: Buffer | null;

  constructor(@Inject(MCF_APPHUB_READ_TOKEN) configuredToken: string | null) {
    this.expectedDigest = validToken(configuredToken) ? digest(configuredToken) : null;
  }

  canActivate(context: ExecutionContext): boolean {
    if (this.expectedDigest === null) {
      throw new ServiceUnavailableException({
        code: 'MCF_APPHUB_INGRESS_DISABLED',
        message: 'The App Hub read ingress is disabled.',
      });
    }
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      raw?: { rawHeaders?: string[] };
    }>();
    const token = request.headers[MCF_APPHUB_READ_HEADER];
    if (
      rawHeaderCount(request.raw?.rawHeaders) !== 1 ||
      !validToken(token) ||
      !timingSafeEqual(digest(token), this.expectedDigest)
    ) {
      throw new UnauthorizedException({
        code: 'MCF_APPHUB_AUTHENTICATION_FAILED',
        message: 'The App Hub read token is invalid.',
      });
    }
    return true;
  }
}
