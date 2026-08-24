import type { ExecutionContext } from '@nestjs/common';
import { ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { McfCloudContextIngressTokenGuard } from './mcf-cloud-context-ingress-token.guard.js';

const cloudToken = 'cloud-context-ingress-token-for-local-lab-0001';
const sharedContextToken = 'context-read-token-delivered-to-triview-0001';

function context(headers: Record<string, string | undefined>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
    }),
  } as unknown as ExecutionContext;
}

describe('McfCloudContextIngressTokenGuard', () => {
  it('accepts only the dedicated Cloud ingress token and header', () => {
    const guard = new McfCloudContextIngressTokenGuard(cloudToken, sharedContextToken);

    expect(guard.canActivate(context({ 'x-mcf-cloud-context-token': cloudToken }))).toBe(true);
    expect(() => guard.canActivate(context({ 'x-mcf-context-token': sharedContextToken }))).toThrow(
      UnauthorizedException,
    );
    expect(() =>
      guard.canActivate(context({ 'x-mcf-cloud-context-token': sharedContextToken })),
    ).toThrow(UnauthorizedException);
  });

  it('fails closed when the Cloud token is absent, short or reused from Context/TriView', () => {
    for (const configuredToken of [undefined, 'short', sharedContextToken]) {
      const guard = new McfCloudContextIngressTokenGuard(configuredToken, sharedContextToken);
      expect(() => guard.canActivate(context({}))).toThrow(ServiceUnavailableException);
    }
  });

  it('does not expose either token in authentication failures', () => {
    const guard = new McfCloudContextIngressTokenGuard(cloudToken, sharedContextToken);

    try {
      guard.canActivate(context({ 'x-mcf-cloud-context-token': 'incorrect-token-value' }));
      throw new Error('guard unexpectedly accepted an invalid token');
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedException);
      expect(JSON.stringify(error)).not.toContain(cloudToken);
      expect(JSON.stringify(error)).not.toContain(sharedContextToken);
    }
  });
});
