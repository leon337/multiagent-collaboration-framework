import type { ModelExecutionProvider, ModelExecutionRequest } from './model-execution.contracts.js';

export class ModelExecutionRegistry {
  constructor(private readonly providers: readonly ModelExecutionProvider[] = []) {}

  resolve(request: ModelExecutionRequest): ModelExecutionProvider | null {
    const matches = this.providers.filter((provider) => provider.supports(request));
    if (matches.length > 1) {
      throw new Error(
        `Multiple model execution providers matched ${request.provider}/${request.model}/${request.operation}`,
      );
    }
    return matches[0] ?? null;
  }

  listProviderIds(): string[] {
    return this.providers.map((provider) => provider.providerId).sort();
  }
}
