import { describe, expect, it } from 'vitest';

import type {
  ModelExecutionProvider,
  ModelExecutionRequest,
} from './model-execution.contracts.js';
import { ModelExecutionRegistry } from './model-execution.registry.js';

const request: ModelExecutionRequest = {
  provider: 'google',
  model: 'gemini-test',
  operation: 'generate',
  input: { prompt: 'hello' },
  executor: 'MESTRE',
};

function provider(
  providerId: string,
  supports: ModelExecutionProvider['supports'],
): ModelExecutionProvider {
  return {
    providerId,
    supports,
    async execute() {
      throw new Error('not used');
    },
  };
}

describe('ModelExecutionRegistry', () => {
  it('returns null when no model provider matches', () => {
    const registry = new ModelExecutionRegistry([provider('other', () => false)]);

    expect(registry.resolve(request)).toBeNull();
  });

  it('returns the single matching model provider', () => {
    const google = provider('google-gemini', (candidate) => candidate.provider === 'google');
    const registry = new ModelExecutionRegistry([google]);

    expect(registry.resolve(request)).toBe(google);
    expect(registry.listProviderIds()).toEqual(['google-gemini']);
  });

  it('fails closed when multiple model providers match', () => {
    const registry = new ModelExecutionRegistry([
      provider('google-a', () => true),
      provider('google-b', () => true),
    ]);

    expect(() => registry.resolve(request)).toThrow(
      'Multiple model execution providers matched google/gemini-test/generate',
    );
  });
});
