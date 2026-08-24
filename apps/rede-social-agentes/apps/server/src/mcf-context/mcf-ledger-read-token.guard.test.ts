import type { ExecutionContext } from '@nestjs/common';
import { ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import {
  loadMcfLedgerReadIngressToken,
  MCF_LEDGER_READ_HEADER,
  McfLedgerReadTokenGuard,
} from './mcf-ledger-read-token.guard.js';

const ledgerToken = 'mcf-ledger-ingress-token-for-readonly-lab-0001';
const contextToken = 'mcf-context-ingress-token-for-triview-lab-0002';
const bearerToken = 'ledger-provider-bearer-token-for-readonly-lab-0003';

function context(
  headers: Record<string, string | string[] | undefined>,
  rawHeaders?: string[],
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers, raw: rawHeaders === undefined ? undefined : { rawHeaders } }),
    }),
  } as unknown as ExecutionContext;
}

describe('Cognitive Ledger ingress token configuration', () => {
  it('accepts only a bounded token distinct from TriView and provider Bearer credentials', () => {
    expect(
      loadMcfLedgerReadIngressToken({
        MCF_COGNITIVE_LEDGER_INGRESS_TOKEN: ledgerToken,
        MCF_CONTEXT_READ_TOKEN: contextToken,
        MCF_COGNITIVE_LEDGER_BEARER_TOKEN: bearerToken,
      }),
    ).toBe(ledgerToken);

    for (const candidate of [
      undefined,
      'short',
      contextToken,
      bearerToken,
      `${ledgerToken}\n`,
      `${ledgerToken},duplicate`,
      'x'.repeat(4_097),
    ]) {
      expect(
        loadMcfLedgerReadIngressToken({
          MCF_COGNITIVE_LEDGER_INGRESS_TOKEN: candidate,
          MCF_CONTEXT_READ_TOKEN: contextToken,
          MCF_COGNITIVE_LEDGER_BEARER_TOKEN: bearerToken,
        }),
      ).toBeNull();
    }
  });
});

describe('McfLedgerReadTokenGuard', () => {
  it('accepts exactly one dedicated Ledger ingress header', () => {
    const guard = new McfLedgerReadTokenGuard(ledgerToken);
    expect(
      guard.canActivate(
        context({ [MCF_LEDGER_READ_HEADER]: ledgerToken }, [MCF_LEDGER_READ_HEADER, ledgerToken]),
      ),
    ).toBe(true);
  });

  it('rejects missing, TriView, malformed and duplicated credentials', () => {
    const guard = new McfLedgerReadTokenGuard(ledgerToken);
    const invalid = [
      context({}, []),
      context({ [MCF_LEDGER_READ_HEADER]: contextToken }, [MCF_LEDGER_READ_HEADER, contextToken]),
      context({ [MCF_LEDGER_READ_HEADER]: [ledgerToken, ledgerToken] }),
      context({ [MCF_LEDGER_READ_HEADER]: `${ledgerToken}, ${ledgerToken}` }, [
        MCF_LEDGER_READ_HEADER,
        ledgerToken,
        MCF_LEDGER_READ_HEADER,
        ledgerToken,
      ]),
    ];
    for (const executionContext of invalid) {
      expect(() => guard.canActivate(executionContext)).toThrow(UnauthorizedException);
    }
  });

  it('is disabled when ingress or provider configuration is invalid', () => {
    const guard = new McfLedgerReadTokenGuard(null);
    expect(() => guard.canActivate(context({}))).toThrow(ServiceUnavailableException);
  });
});
