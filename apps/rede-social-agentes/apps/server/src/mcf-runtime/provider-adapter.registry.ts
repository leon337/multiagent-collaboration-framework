import type {
  AgentExecutionCapability,
  AgentExecutionProviderAdapter,
  ExecutionProviderContract,
} from './agent-execution.contracts.js';

export interface ProviderSelection {
  providerId?: string;
  requiredCapabilities?: readonly AgentExecutionCapability[];
}

export class ProviderAdapterRegistry {
  constructor(
    private readonly adapters: readonly AgentExecutionProviderAdapter[] = [],
  ) {}

  resolve(selection: ProviderSelection): AgentExecutionProviderAdapter {
    const candidates = this.adapters.filter((adapter) => {
      if (selection.providerId && adapter.provider.providerId !== selection.providerId) {
        return false;
      }
      const capabilities = new Set(adapter.provider.capabilities);
      return (selection.requiredCapabilities ?? []).every((capability) =>
        capabilities.has(capability),
      );
    });

    if (candidates.length === 0) {
      throw new Error(
        selection.providerId
          ? `No execution provider adapter registered for ${selection.providerId}`
          : 'No execution provider adapter satisfies the requested capabilities',
      );
    }

    if (candidates.length > 1) {
      throw new Error(
        `Multiple execution provider adapters satisfy selection: ${candidates
          .map((candidate) => candidate.provider.providerId)
          .sort()
          .join(', ')}`,
      );
    }

    return candidates[0]!;
  }

  listProviders(): readonly ExecutionProviderContract[] {
    return this.adapters
      .map((adapter) => adapter.provider)
      .sort((left, right) => left.providerId.localeCompare(right.providerId));
  }
}
