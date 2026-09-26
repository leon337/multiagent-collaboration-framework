import { beforeEach, describe, expect, it } from 'vitest';

import { EvidenceValidator } from './evidence-validator.js';
import type { ExternalActionRequest } from './external-action.contracts.js';
import {
  isPublicIpAddress,
  validatePublicHttpsUrl,
  WebNativeReadAdapter,
  type WebReadTransport,
  type WebTransportResponse,
} from './web-native-read.adapter.js';

class FakeTransport implements WebReadTransport {
  readonly responses = new Map<string, WebTransportResponse | Error>();
  readonly calls: string[] = [];

  async fetch(url: string): Promise<WebTransportResponse> {
    this.calls.push(url);
    const response = this.responses.get(url);
    if (!response) throw new Error(`missing fake response for ${url}`);
    if (response instanceof Error) throw response;
    return response;
  }
}

function response(url: string, body: string): WebTransportResponse {
  return {
    url,
    statusCode: 200,
    contentType: 'text/html; charset=utf-8',
    body,
    byteLength: Buffer.byteLength(body),
    truncated: false,
  };
}

function request(
  skillId: 'MCF-WEB-FETCH' | 'MCF-WEB-MAP' | 'MCF-WEB-COLLECT',
  operation: string,
  resource: string,
  inputs: Record<string, unknown>,
): ExternalActionRequest {
  return {
    skill: {
      skillId,
      name: skillId,
      version: '0.1.0',
      purpose: 'test',
      ownerAgents: ['Miriam'],
      requiredInputs: [],
      allowedTools: ['Web_Native'],
      forbiddenTools: [],
      permissionProfile: 'READ_ONLY',
      executionSteps: ['test'],
      requiredEvidence: ['receipt'],
      acceptanceCriteria: ['traceable'],
      failureModes: ['blocked'],
      fallback: 'fail closed',
      handoffTo: 'Miriam',
    },
    agentId: 'Miriam',
    inputs,
    tool: { provider: 'Web_Native', operation, resource },
  };
}

beforeEach(() => {
  process.env.DATABASE_URL = 'postgresql://rsa:rsa@127.0.0.1:5432/rsa';
  process.env.MCF_RECEIPT_SECRET = 'test-only-mcf-receipt-secret-0000000001';
});

describe('WebNativeReadAdapter', () => {
  it('fetches a public page into a signed read-only receipt', async () => {
    const transport = new FakeTransport();
    transport.responses.set('https://example.com/page', response('https://example.com/page', 'hello'));
    const adapter = new WebNativeReadAdapter(new EvidenceValidator(), transport);

    const receipt = await adapter.execute(
      request('MCF-WEB-FETCH', 'fetch', 'https://example.com/page', {
        url: 'https://example.com/page',
      }),
    );

    expect(receipt).toMatchObject({
      provider: 'web-native',
      operation: 'fetch',
      resource: 'https://example.com/page',
      status: 'SUCCEEDED',
      metadata: {
        readOnly: true,
        coverage: 'COMPLETE',
        contentText: 'hello',
      },
    });
  });

  it('maps only same-origin HTTPS links and reports partial coverage', async () => {
    const transport = new FakeTransport();
    transport.responses.set(
      'https://example.com/',
      response(
        'https://example.com/',
        '<a href="/a">A</a><a href="https://other.test/b">B</a><a href="http://example.com/c">C</a>',
      ),
    );
    const adapter = new WebNativeReadAdapter(new EvidenceValidator(), transport);

    const receipt = await adapter.execute(
      request('MCF-WEB-MAP', 'fetch-map', 'https://example.com/', {
        site_root: 'https://example.com/',
        max_urls: 10,
      }),
    );

    expect(receipt.metadata).toMatchObject({
      coverage: 'PARTIAL',
      discoveredUrls: ['https://example.com/a'],
    });
  });

  it('collects a bounded same-origin queue and records page evidence', async () => {
    const transport = new FakeTransport();
    transport.responses.set(
      'https://example.com/',
      response('https://example.com/', '<a href="/a">A</a><a href="/b">B</a>'),
    );
    transport.responses.set('https://example.com/a', response('https://example.com/a', 'alpha'));
    const adapter = new WebNativeReadAdapter(new EvidenceValidator(), transport);

    const receipt = await adapter.execute(
      request('MCF-WEB-COLLECT', 'fetch-collection', 'https://example.com/', {
        seed_urls_or_site_root: 'https://example.com/',
        max_pages: 2,
      }),
    );

    expect(receipt.metadata).toMatchObject({
      coverage: 'PARTIAL',
      maxPages: 2,
      pageCount: 2,
      queuedButNotVisited: 1,
    });
    expect(transport.calls).toEqual(['https://example.com/', 'https://example.com/a']);
  });

  it('blocks local, private, reserved and credential-bearing targets', () => {
    for (const target of [
      'http://example.com',
      'https://localhost/',
      'https://127.0.0.1/',
      'https://10.0.0.1/',
      'https://169.254.169.254/latest/meta-data/',
      'https://user:pass@example.com/',
      'https://example.com:8443/',
    ]) {
      expect(() => validatePublicHttpsUrl(target)).toThrow();
    }
  });

  it('classifies public and non-public IP literals', () => {
    expect(isPublicIpAddress('8.8.8.8')).toBe(true);
    expect(isPublicIpAddress('1.1.1.1')).toBe(true);
    expect(isPublicIpAddress('127.0.0.1')).toBe(false);
    expect(isPublicIpAddress('192.168.1.1')).toBe(false);
    expect(isPublicIpAddress('::1')).toBe(false);
    expect(isPublicIpAddress('2001:db8::1')).toBe(false);
  });
});
