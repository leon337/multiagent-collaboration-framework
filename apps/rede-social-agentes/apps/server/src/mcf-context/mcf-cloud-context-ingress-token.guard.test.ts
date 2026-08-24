import type { ExecutionContext } from '@nestjs/common';
import { ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import {
  loadMcfCloudContextIngressToken,
  MCF_CLOUD_CONTEXT_HEADER,
  McfCloudContextIngressTokenGuard,
} from './mcf-cloud-context-ingress-token.guard.js';

const cloudToken = 'cloud-context-ingress-token-for-local-lab-0001';
const sharedContextToken = 'context-read-token-delivered-to-triview-0001';
const ledgerIngressToken = 'cognitive-ledger-dedicated-ingress-token-0001';
const ledgerBearerToken = 'cognitive-ledger-provider-bearer-token-0001';

function context(
  headers: Record<string, string | string[] | undefined>,
  rawHeaders?: string[],
): ExecutionContext {
  const renderedRawHeaders =
    rawHeaders ??
    Object.entries(headers).flatMap(([name, value]) =>
      typeof value === 'string' ? [name, value] : [],
    );
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers, raw: { rawHeaders: renderedRawHeaders } }),
    }),
  } as unknown as ExecutionContext;
}

function environment(overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    MCF_CONTEXT_READ_TOKEN: sharedContextToken,
    MCF_CLOUD_CONTEXT_INGRESS_TOKEN: cloudToken,
    MCF_COGNITIVE_LEDGER_INGRESS_TOKEN: ledgerIngressToken,
    MCF_COGNITIVE_LEDGER_BEARER_TOKEN: ledgerBearerToken,
    ...overrides,
  };
}

describe('McfCloudContextIngressTokenGuard', () => {
  it('accepts only the dedicated Cloud ingress token and header', () => {
    const guard = new McfCloudContextIngressTokenGuard(
      loadMcfCloudContextIngressToken(environment()),
    );

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
      const guard = new McfCloudContextIngressTokenGuard(
        loadMcfCloudContextIngressToken(
          environment({ MCF_CLOUD_CONTEXT_INGRESS_TOKEN: configuredToken }),
        ),
      );
      expect(() => guard.canActivate(context({}))).toThrow(ServiceUnavailableException);
    }
    expect(() => new McfCloudContextIngressTokenGuard('short').canActivate(context({}))).toThrow(
      ServiceUnavailableException,
    );
  });

  it.each([
    ['Context/TriView', sharedContextToken],
    ['Ledger ingress', ledgerIngressToken],
    ['Ledger bearer', ledgerBearerToken],
  ])('disables Cloud when its token reuses the %s secret', (_label, reusedToken) => {
    expect(
      loadMcfCloudContextIngressToken(
        environment({ MCF_CLOUD_CONTEXT_INGRESS_TOKEN: reusedToken }),
      ),
    ).toBeNull();
  });

  it.each([
    ['leading whitespace', ` ${cloudToken}`],
    ['trailing whitespace', `${cloudToken} `],
    ['comma', `${cloudToken},suffix`],
    ['newline', `${cloudToken}\n`],
  ])('rejects a configured token containing %s', (_label, configuredToken) => {
    expect(
      loadMcfCloudContextIngressToken(
        environment({ MCF_CLOUD_CONTEXT_INGRESS_TOKEN: configuredToken }),
      ),
    ).toBeNull();
  });

  it('requires exactly one raw Cloud header occurrence', () => {
    const guard = new McfCloudContextIngressTokenGuard(cloudToken);
    expect(() =>
      guard.canActivate(
        context({ [MCF_CLOUD_CONTEXT_HEADER]: cloudToken }, [
          MCF_CLOUD_CONTEXT_HEADER,
          cloudToken,
          MCF_CLOUD_CONTEXT_HEADER,
          cloudToken,
        ]),
      ),
    ).toThrow(UnauthorizedException);
    expect(() =>
      guard.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({ headers: { [MCF_CLOUD_CONTEXT_HEADER]: cloudToken } }),
        }),
      } as unknown as ExecutionContext),
    ).toThrow(UnauthorizedException);
    expect(() =>
      guard.canActivate(context({ [MCF_CLOUD_CONTEXT_HEADER]: [cloudToken, cloudToken] })),
    ).toThrow(UnauthorizedException);
  });

  it('does not expose either token in authentication failures', () => {
    const guard = new McfCloudContextIngressTokenGuard(cloudToken);

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
