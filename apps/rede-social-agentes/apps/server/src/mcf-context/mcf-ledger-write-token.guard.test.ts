import type { ExecutionContext } from '@nestjs/common';
import { ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import {
  loadMcfLedgerWriteIngressToken,
  MCF_LEDGER_WRITE_HEADER,
  McfLedgerWriteTokenGuard,
} from './mcf-ledger-write-token.guard.js';

const write = 'mcf-ledger-write-ingress-token-000000000001';
const read = 'mcf-ledger-read-ingress-token-000000000002';
const bearer = 'ledger-write-bearer-token-000000000003';

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

describe('McfLedgerWriteTokenGuard', () => {
  it('loads only a dedicated write ingress token', () => {
    expect(loadMcfLedgerWriteIngressToken({
      MCF_COGNITIVE_LEDGER_WRITE_INGRESS_TOKEN: write,
      MCF_COGNITIVE_LEDGER_WRITE_BEARER_TOKEN: bearer,
      MCF_COGNITIVE_LEDGER_INGRESS_TOKEN: read,
    })).toBe(write);
    expect(loadMcfLedgerWriteIngressToken({
      MCF_COGNITIVE_LEDGER_WRITE_INGRESS_TOKEN: read,
      MCF_COGNITIVE_LEDGER_WRITE_BEARER_TOKEN: bearer,
      MCF_COGNITIVE_LEDGER_INGRESS_TOKEN: read,
    })).toBeNull();
  });

  it('accepts exactly one dedicated header and rejects duplicates', () => {
    const guard = new McfLedgerWriteTokenGuard(write);
    expect(guard.canActivate(
      context({ [MCF_LEDGER_WRITE_HEADER]: write }, [MCF_LEDGER_WRITE_HEADER, write]),
    )).toBe(true);

    for (const c of [
      context({}, []),
      context({ [MCF_LEDGER_WRITE_HEADER]: read }, [MCF_LEDGER_WRITE_HEADER, read]),
      context({ [MCF_LEDGER_WRITE_HEADER]: `${write},${write}` }, [
        MCF_LEDGER_WRITE_HEADER, write, MCF_LEDGER_WRITE_HEADER, write,
      ]),
    ]) {
      expect(() => guard.canActivate(c)).toThrow(UnauthorizedException);
    }
  });

  it('fails closed while configuration is disabled', () => {
    expect(() => new McfLedgerWriteTokenGuard(null).canActivate(context({}))).toThrow(
      ServiceUnavailableException,
    );
  });
});
