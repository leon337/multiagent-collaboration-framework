import { describe, expect, it } from 'vitest';

import type { ModelExecutionRequest } from './model-execution.contracts.js';
import {
  GeminiModelProvider,
  type GeminiClient,
  type GeminiClientResponse,
  type GeminiModelProviderConfig,
} from './gemini-model.provider.js';

const request: ModelExecutionRequest = {
  provider: 'google',
  model: 'gemini-test',
  operation: 'generate',
  input: 'Say only OK',
  executor: 'MESTRE',
  missionId: 'MCF-GAMA-FUND-2026-001',
  phaseId: 'G3',
};

function fakeClient(
  result: GeminiClientResponse | Error,
): GeminiClient & { readonly calls: number } {
  let calls = 0;
  return {
    get calls() {
      return calls;
    },
    async generateContent() {
      calls += 1;
      if (result instanceof Error) throw result;
      return result;
    },
  };
}

function providerFor(
  client: GeminiClient,
  overrides: Partial<GeminiModelProviderConfig> = {},
): GeminiModelProvider {
  return new GeminiModelProvider(client, {
    enabled: true,
    modelAllowlist: ['gemini-test'],
    paidFallbackAllowed: false,
    ...overrides,
  });
}

describe('GeminiModelProvider', () => {
  it('fails closed without calling the client when provider is disabled', async () => {
    const client = fakeClient({ text: 'should not be used' });
    const receipt = await providerFor(client, { enabled: false }).execute(request);

    expect(receipt).toMatchObject({
      validationVerdict: 'FAILED',
      failureCode: 'PROVIDER_DISABLED',
    });
    expect(client.calls).toBe(0);
  });

  it('fails closed before network when model is not allowlisted', async () => {
    const client = fakeClient({ text: 'should not be used' });
    const receipt = await providerFor(client, {
      modelAllowlist: ['gemini-approved'],
    }).execute(request);

    expect(receipt.failureCode).toBe('MODEL_NOT_ALLOWED');
    expect(client.calls).toBe(0);
  });

  it('returns sanitized evidence and preserves function calls only as tool intents', async () => {
    const receipt = await providerFor(
      fakeClient({
        text: 'OK',
        functionCalls: [{ name: 'open_pr', args: { branch: 'demo' } }],
        candidates: [{ finishReason: 'STOP' }],
        usageMetadata: {
          promptTokenCount: 3,
          candidatesTokenCount: 1,
          totalTokenCount: 4,
        },
      }),
    ).execute(request);

    expect(receipt.validationVerdict).toBe('PASS');
    expect(receipt.failureCode).toBeUndefined();
    expect(receipt.inputDigest).toMatch(/^[a-f0-9]{64}$/u);
    expect(receipt.outputDigest).toMatch(/^[a-f0-9]{64}$/u);
    expect(receipt.toolIntents).toEqual([
      { name: 'open_pr', arguments: { branch: 'demo' } },
    ]);
    expect(receipt.usage).toEqual({
      promptTokens: 3,
      outputTokens: 1,
      totalTokens: 4,
    });
    expect(receipt).not.toHaveProperty('input');
    expect(receipt).not.toHaveProperty('output');
  });

  it('maps a blocked response to MODEL_BLOCKED', async () => {
    const receipt = await providerFor(
      fakeClient({ promptFeedback: { blockReason: 'SAFETY' } }),
    ).execute(request);

    expect(receipt).toMatchObject({
      validationVerdict: 'BLOCKED',
      failureCode: 'MODEL_BLOCKED',
      finishReason: 'SAFETY',
    });
  });

  it.each([
    [401, 'AUTHENTICATION_REQUIRED'],
    [403, 'AUTHENTICATION_REQUIRED'],
    [429, 'RATE_LIMITED'],
  ] as const)('maps provider status %s to %s without leaking its message', async (status, code) => {
    const error = Object.assign(new Error(`secret-ish provider message ${status}`), { status });
    const receipt = await providerFor(fakeClient(error)).execute(request);

    expect(receipt.failureCode).toBe(code);
    expect(JSON.stringify(receipt)).not.toMatch(/secret-ish/u);
  });

  it('maps timeout and network failures', async () => {
    const timeout = Object.assign(new Error('request timed out'), { name: 'AbortError' });
    const network = Object.assign(new Error('socket reset'), { code: 'ECONNRESET' });

    expect((await providerFor(fakeClient(timeout)).execute(request)).failureCode).toBe(
      'MODEL_TIMEOUT',
    );
    expect((await providerFor(fakeClient(network)).execute(request)).failureCode).toBe(
      'NETWORK_FAILURE',
    );
  });

  it('treats an empty provider response as INVALID_RESPONSE', async () => {
    const receipt = await providerFor(fakeClient({})).execute(request);

    expect(receipt).toMatchObject({
      validationVerdict: 'FAILED',
      failureCode: 'INVALID_RESPONSE',
    });
  });
});
