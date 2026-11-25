import type { ExecutionContext } from '@nestjs/common';
import { ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import {
  loadMcfAppHubReadToken,
  McfAppHubInventoryReadTokenGuard,
} from './mcf-apphub-inventory-read-token.guard.js';

const apphubToken = 'apphub-unique-token-secret-length-over-thirty-two';
const contextToken = 'context-original-token-secret-length-over-32';

function makeContext(
  token: string | string[] | undefined,
  rawHeaders?: string[],
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: token === undefined ? {} : { 'x-mcf-apphub-read-token': token },
        raw: {
          rawHeaders:
            rawHeaders ?? (typeof token === 'string' ? ['x-mcf-apphub-read-token', token] : []),
        },
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('McfAppHubInventoryReadTokenGuard', () => {
  it('refuses missing, weak, reused, and ambiguous ingress tokens', () => {
    expect(loadMcfAppHubReadToken({})).toBeNull();
    expect(loadMcfAppHubReadToken({ MCF_APPHUB_READ_TOKEN: 'short' })).toBeNull();
    expect(loadMcfAppHubReadToken({ MCF_APPHUB_READ_TOKEN: apphubToken + '\n' })).toBeNull();
    expect(
      loadMcfAppHubReadToken({
        MCF_APPHUB_READ_TOKEN: contextToken,
        MCF_CONTEXT_READ_TOKEN: contextToken,
      }),
    ).toBeNull();
    expect(
      loadMcfAppHubReadToken({
        MCF_APPHUB_READ_TOKEN: apphubToken,
        MCF_CONTEXT_READ_TOKEN: contextToken,
      }),
    ).toBe(apphubToken);
  });

  it('fails closed when missing configured secret, even with a valid caller token', () => {
    const guard = new McfAppHubInventoryReadTokenGuard(null);
    expect(() => guard.canActivate(makeContext(apphubToken))).toThrow(ServiceUnavailableException);
  });

  it('accepts only one exact unambiguous token', () => {
    const guard = new McfAppHubInventoryReadTokenGuard(apphubToken);
    expect(guard.canActivate(makeContext(apphubToken))).toBe(true);
    expect(() => guard.canActivate(makeContext(contextToken))).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(makeContext(undefined))).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(makeContext([apphubToken]))).toThrow(UnauthorizedException);
    expect(() =>
      guard.canActivate(
        makeContext(apphubToken, [
          'x-mcf-apphub-read-token',
          apphubToken,
          'X-Mcf-Apphub-Read-Token',
          apphubToken,
        ]),
      ),
    ).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(makeContext(apphubToken, []))).toThrow(UnauthorizedException);
  });
});
