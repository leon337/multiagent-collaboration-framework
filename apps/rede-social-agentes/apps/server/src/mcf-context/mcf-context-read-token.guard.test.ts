import type { ExecutionContext } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { McfContextReadTokenGuard } from './mcf-context-read-token.guard.js';

function context(headers: Record<string, string | undefined>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
    }),
  } as unknown as ExecutionContext;
}

describe('McfContextReadTokenGuard', () => {
  it('accepts only the dedicated read token', () => {
    const readToken = 'context-read-token-for-laboratory-only-0001';
    const guard = new McfContextReadTokenGuard(readToken);

    expect(guard.canActivate(context({ 'x-mcf-context-token': readToken }))).toBe(true);
    expect(() =>
      guard.canActivate(
        context({ 'x-mcf-context-token': 'runtime-token-must-not-cross-this-boundary-0001' }),
      ),
    ).toThrow(UnauthorizedException);
  });

  it('fails closed when the endpoint token is absent or too short', () => {
    for (const token of [undefined, 'short']) {
      const guard = new McfContextReadTokenGuard(token);
      expect(() => guard.canActivate(context({}))).toThrowError(
        expect.objectContaining({
          response: expect.objectContaining({
            code: 'MCF_CONTEXT_READ_DISABLED',
            message: 'The read-only MCF Context boundary is disabled.',
          }),
        }),
      );
    }
  });

  it('rejects missing and incorrect credentials without exposing the configured token', () => {
    const guard = new McfContextReadTokenGuard('context-read-token-for-laboratory-only-0001');

    expect(() => guard.canActivate(context({}))).toThrowError(
      expect.objectContaining({
        response: expect.objectContaining({
          code: 'MCF_CONTEXT_AUTHENTICATION_FAILED',
          message: 'The MCF Context read token is invalid.',
        }),
      }),
    );
    expect(() =>
      guard.canActivate(context({ 'x-mcf-context-token': 'incorrect-token-value-0000000000000' })),
    ).toThrow(UnauthorizedException);
  });
});
