import { describe, expect, it } from 'vitest';

import { GeminiModelProvider } from './gemini-model.provider.js';
import type { ModelExecutionProvider } from './model-execution.contracts.js';
import { ModelExecutionRegistry } from './model-execution.registry.js';
import { McfRuntimeModule } from './mcf-runtime.module.js';

type FactoryProvider = {
  provide?: unknown;
  inject?: unknown[];
  useFactory?: (...dependencies: unknown[]) => unknown;
};

function stub(): ModelExecutionProvider {
  return {
    providerId: 'google-gemini',
    supports: () => false,
    execute: async () => {
      throw new Error('not used by module composition regression');
    },
  };
}

describe('McfRuntimeModule ModelExecutionRegistry composition', () => {
  it('registers Gemini and wires it into the model execution registry', () => {
    const providers = Reflect.getMetadata('providers', McfRuntimeModule) as unknown[];
    const geminiProvider = providers.find(
      (provider): provider is FactoryProvider =>
        typeof provider === 'object' &&
        provider !== null &&
        (provider as FactoryProvider).provide === GeminiModelProvider,
    );
    expect(geminiProvider).toBeDefined();

    const registryProvider = providers.find(
      (provider): provider is FactoryProvider =>
        typeof provider === 'object' &&
        provider !== null &&
        (provider as FactoryProvider).provide === ModelExecutionRegistry,
    );
    expect(registryProvider).toBeDefined();
    expect(registryProvider?.inject).toEqual([GeminiModelProvider]);

    const registry = registryProvider?.useFactory?.(stub()) as ModelExecutionRegistry;
    expect(registry.listProviderIds()).toEqual(['google-gemini']);
  });
});
