import { createHash, timingSafeEqual } from 'node:crypto';

import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

export const MCF_LEDGER_WRITE_INGRESS_TOKEN = Symbol('MCF_LEDGER_WRITE_INGRESS_TOKEN');
export const MCF_LEDGER_WRITE_HEADER = 'x-mcf-ledger-write-token';

function digest(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

export function loadMcfLedgerWriteIngressToken(env: NodeJS.ProcessEnv): string | null {
  const token = env.MCF_COGNITIVE_LEDGER_WRITE_INGRESS_TOKEN;
  const peers = [
    env.MCF_COGNITIVE_LEDGER_WRITE_BEARER_TOKEN,
    env.MCF_COGNITIVE_LEDGER_INGRESS_TOKEN,
    env.MCF_COGNITIVE_LEDGER_BEARER_TOKEN,
    env.MCF_CONTEXT_READ_TOKEN,
    env.MCF_CLOUD_CONTEXT_INGRESS_TOKEN,
  ].filter((v): v is string => Boolean(v));
  if (
    !token ||
    token.length < 32 ||
    token.length > 4096 ||
    token !== token.trim() ||
    /[\r\n,]/u.test(token) ||
    peers.includes(token)
  ) return null;
  return token;
}

function countHeader(rawHeaders: readonly string[] | undefined): number {
  if (rawHeaders === undefined) return 1;
  let count = 0;
  for (let i = 0; i < rawHeaders.length; i += 2) {
    if (rawHeaders[i]?.toLowerCase() === MCF_LEDGER_WRITE_HEADER) count += 1;
  }
  return count;
}

@Injectable()
export class McfLedgerWriteTokenGuard implements CanActivate {
  private readonly expected: Buffer | null;

  constructor(@Inject(MCF_LEDGER_WRITE_INGRESS_TOKEN) configured: string | null) {
    this.expected = configured === null ? null : digest(configured);
  }

  canActivate(context: ExecutionContext): boolean {
    if (this.expected === null) {
      throw new ServiceUnavailableException({
        code: 'MCF_LEDGER_WRITE_DISABLED',
        message: 'The Cognitive Ledger write boundary is disabled.',
      });
    }
    const req = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      raw?: { rawHeaders?: string[] };
    }>();
    const supplied = req.headers[MCF_LEDGER_WRITE_HEADER];
    if (
      countHeader(req.raw?.rawHeaders) !== 1 ||
      typeof supplied !== 'string' ||
      supplied.length < 32 ||
      supplied.length > 4096 ||
      supplied !== supplied.trim() ||
      /[\r\n,]/u.test(supplied) ||
      !timingSafeEqual(digest(supplied), this.expected)
    ) {
      throw new UnauthorizedException({
        code: 'MCF_LEDGER_WRITE_AUTHENTICATION_FAILED',
        message: 'The Cognitive Ledger write token is invalid.',
      });
    }
    return true;
  }
}
