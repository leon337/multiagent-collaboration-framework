import { createHash, timingSafeEqual } from 'node:crypto';

import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

export const MCF_CLOUD_CONTEXT_INGRESS_TOKEN = Symbol('MCF_CLOUD_CONTEXT_INGRESS_TOKEN');
export const MCF_CLOUD_CONTEXT_HEADER = 'x-mcf-cloud-context-token';

function digest(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

function validToken(value: string | undefined): value is string {
  return (
    value !== undefined &&
    value.length >= 32 &&
    value.length <= 4096 &&
    value === value.trim() &&
    !/[\r\n,]/u.test(value)
  );
}

export function loadMcfCloudContextIngressToken(env: NodeJS.ProcessEnv): string | null {
  const ingressToken = env.MCF_CLOUD_CONTEXT_INGRESS_TOKEN;
  const forbiddenTokens = [
    env.MCF_CONTEXT_READ_TOKEN,
    env.MCF_COGNITIVE_LEDGER_INGRESS_TOKEN,
    env.MCF_COGNITIVE_LEDGER_BEARER_TOKEN,
  ];
  if (
    !validToken(ingressToken) ||
    forbiddenTokens.some(
      (forbiddenToken) =>
        forbiddenToken !== undefined &&
        timingSafeEqual(digest(ingressToken), digest(forbiddenToken)),
    )
  ) {
    return null;
  }
  return ingressToken;
}

function rawHeaderCount(rawHeaders: readonly string[] | undefined): number {
  if (rawHeaders === undefined || rawHeaders.length % 2 !== 0) return 0;
  let count = 0;
  for (let index = 0; index < rawHeaders.length; index += 2) {
    if (rawHeaders[index]?.toLowerCase() === MCF_CLOUD_CONTEXT_HEADER) count += 1;
  }
  return count;
}

@Injectable()
export class McfCloudContextIngressTokenGuard implements CanActivate {
  private readonly expectedDigest: Buffer | null;

  constructor(@Inject(MCF_CLOUD_CONTEXT_INGRESS_TOKEN) configuredToken: string | null) {
    const candidate = configuredToken ?? undefined;
    this.expectedDigest = validToken(candidate) ? digest(candidate) : null;
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
      raw?: { rawHeaders?: string[] };
    }>();
    const supplied = request.headers[MCF_CLOUD_CONTEXT_HEADER];
    if (
      rawHeaderCount(request.raw?.rawHeaders) !== 1 ||
      typeof supplied !== 'string' ||
      !validToken(supplied) ||
      !timingSafeEqual(digest(supplied), this.expectedDigest)
    ) {
      throw new UnauthorizedException({
        code: 'MCF_CLOUD_CONTEXT_AUTHENTICATION_FAILED',
        message: 'The local Cloud context token is invalid.',
      });
    }
    return true;
  }
}
