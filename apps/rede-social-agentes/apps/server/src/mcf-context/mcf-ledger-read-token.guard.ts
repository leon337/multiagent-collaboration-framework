import { createHash, timingSafeEqual } from 'node:crypto';

import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

export const MCF_LEDGER_READ_INGRESS_TOKEN = Symbol('MCF_LEDGER_READ_INGRESS_TOKEN');
export const MCF_LEDGER_READ_HEADER = 'x-mcf-ledger-read-token';

function digest(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

export function loadMcfLedgerReadIngressToken(env: NodeJS.ProcessEnv): string | null {
  const ingressToken = env.MCF_COGNITIVE_LEDGER_INGRESS_TOKEN;
  const contextToken = env.MCF_CONTEXT_READ_TOKEN;
  const cloudIngressToken = env.MCF_CLOUD_CONTEXT_INGRESS_TOKEN;
  const providerBearer = env.MCF_COGNITIVE_LEDGER_BEARER_TOKEN;
  if (
    !ingressToken ||
    ingressToken.length < 32 ||
    ingressToken.length > 4096 ||
    ingressToken !== ingressToken.trim() ||
    /[\r\n,]/u.test(ingressToken) ||
    ingressToken === contextToken ||
    ingressToken === cloudIngressToken ||
    ingressToken === providerBearer
  ) {
    return null;
  }
  return ingressToken;
}

function rawHeaderCount(rawHeaders: readonly string[] | undefined): number {
  if (rawHeaders === undefined) return 1;
  let count = 0;
  for (let index = 0; index < rawHeaders.length; index += 2) {
    if (rawHeaders[index]?.toLowerCase() === MCF_LEDGER_READ_HEADER) count += 1;
  }
  return count;
}

@Injectable()
export class McfLedgerReadTokenGuard implements CanActivate {
  private readonly expectedDigest: Buffer | null;

  constructor(@Inject(MCF_LEDGER_READ_INGRESS_TOKEN) configuredToken: string | null) {
    this.expectedDigest = configuredToken === null ? null : digest(configuredToken);
  }

  canActivate(context: ExecutionContext): boolean {
    if (this.expectedDigest === null) {
      throw new ServiceUnavailableException({
        code: 'MCF_LEDGER_READ_DISABLED',
        message: 'The Cognitive Ledger read boundary is disabled.',
      });
    }

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      raw?: { rawHeaders?: string[] };
    }>();
    const supplied = request.headers[MCF_LEDGER_READ_HEADER];
    const hasExactlyOneHeader = rawHeaderCount(request.raw?.rawHeaders) === 1;
    if (
      !hasExactlyOneHeader ||
      typeof supplied !== 'string' ||
      supplied.length < 32 ||
      supplied.length > 4096 ||
      supplied !== supplied.trim() ||
      /[\r\n,]/u.test(supplied) ||
      !timingSafeEqual(digest(supplied), this.expectedDigest)
    ) {
      throw new UnauthorizedException({
        code: 'MCF_LEDGER_READ_AUTHENTICATION_FAILED',
        message: 'The Cognitive Ledger read token is invalid.',
      });
    }
    return true;
  }
}
