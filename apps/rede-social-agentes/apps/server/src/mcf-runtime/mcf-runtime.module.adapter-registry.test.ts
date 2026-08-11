import { describe, expect, it } from 'vitest';

import { AdapterRegistry } from './adapter-registry.js';
import type { ExternalActionAdapter } from './external-action.contracts.js';
import { GitHubBranchPullRequestAdapter } from './github-branch-pr.adapter.js';
import { GitHubCiQueryAdapter } from './github-ci-query.adapter.js';
import { GitHubCodeReviewAdapter } from './github-code-review.adapter.js';
import { GitHubPullCollaborationAdapter } from './github-pr-collaboration.adapter.js';
import { McfRuntimeModule } from './mcf-runtime.module.js';

type FactoryProvider = {
  provide?: unknown;
  inject?: unknown[];
  useFactory?: (...dependencies: unknown[]) => unknown;
};

function stub(adapterId: string): ExternalActionAdapter {
  return {
    adapterId,
    supports: () => false,
    execute: async () => {
      throw new Error('not used by module composition regression');
    },
  };
}

describe('McfRuntimeModule AdapterRegistry composition', () => {
  it('wires the C1 and C2 GitHub write adapters into the live runtime registry', () => {
    const providers = Reflect.getMetadata('providers', McfRuntimeModule) as unknown[];
    const registryProvider = providers.find(
      (provider): provider is FactoryProvider =>
        typeof provider === 'object' &&
        provider !== null &&
        (provider as FactoryProvider).provide === AdapterRegistry,
    );

    expect(registryProvider).toBeDefined();
    expect(registryProvider?.inject).toEqual([
      GitHubCodeReviewAdapter,
      GitHubCiQueryAdapter,
      GitHubBranchPullRequestAdapter,
      GitHubPullCollaborationAdapter,
    ]);

    const registry = registryProvider?.useFactory?.(
      stub('github-code-review-read-v1'),
      stub('github-ci-query-read-v1'),
      stub('github-branch-pr-write-v1'),
      stub('github-pr-collaboration-write-v1'),
    ) as AdapterRegistry;

    expect(registry.listAdapterIds()).toContain('github-branch-pr-write-v1');
    expect(registry.listAdapterIds()).toContain('github-pr-collaboration-write-v1');
  });
});
