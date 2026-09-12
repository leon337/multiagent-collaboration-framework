import { describe, expect, it } from 'vitest';

import { createGoogleGenAiClient } from './google-genai.client.js';

describe('createGoogleGenAiClient', () => {
  it('constructs the SDK with the server-side key and disables automatic function calling', async () => {
    let constructedWith: unknown;
    let generatedWith: unknown;

    class FakeGoogleGenAI {
      models = {
        generateContent: async (params: unknown) => {
          generatedWith = params;
          return {
            text: 'OK',
            functionCalls: [{ name: 'candidate_tool', args: { x: 1 } }],
          };
        },
      };

      constructor(options: unknown) {
        constructedWith = options;
      }
    }

    const client = await createGoogleGenAiClient('server-secret', async () => ({
      GoogleGenAI: FakeGoogleGenAI,
    }));
    const response = await client.generateContent({
      model: 'gemini-test',
      contents: 'hello',
      disableAutomaticFunctionCalling: true,
    });

    expect(constructedWith).toEqual({ apiKey: 'server-secret' });
    expect(generatedWith).toEqual({
      model: 'gemini-test',
      contents: 'hello',
      config: { automaticFunctionCalling: { disable: true } },
    });
    expect(response.text).toBe('OK');
  });

  it('fails closed when the API key is empty', async () => {
    await expect(
      createGoogleGenAiClient('', async () => {
        throw new Error('must not load');
      }),
    ).rejects.toThrow(/API key/u);
  });
});
