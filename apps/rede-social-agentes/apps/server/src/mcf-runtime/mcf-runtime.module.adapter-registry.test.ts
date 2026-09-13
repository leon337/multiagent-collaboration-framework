import { describe, expect, it } from 'vitest';

import { AdapterRegistry } from './adapter-registry.js';
import { CodeBuddyExecutorAdapter } from './codebuddy-executor.adapter.js';
import { ExternalActionDispatcher } from './external-action-dispatcher.js';
import { ExternalActionLedger } from './external-action-ledger.js';
import type { ExternalActionAdapter } from './external-action.contracts.js';
import { EvidenceValidator } from './evidence-validator.js';
import { GitHubBranchPullRequestAdapter } from './github-branch-pr.adapter.js';
import { GitHubCiQueryAdapter } from './github-ci-query.adapter.js';
import { GitHubCodeReviewAdapter } from './github-code-review.adapter.js';
import { GitHubExecutionIdentityRegistry } from './github-execution-identity.js';
import { GitHubPullCollaborationAdapter } from './github-pr-collaboration.adapter.js';
import { GitHubActionsStagingDeployAdapter } from './github-staging-deploy.adapter.js';
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
      CodeBuddyExecutorAdapter,
    ]);

    const registry = registryProvider?.useFactory?.(
      stub('github-code-review-read-v1'),
      stub('github-ci-query-read-v1'),
      stub('github-branch-pr-write-v1'),
      stub('github-pr-collaboration-write-v1'),
      stub('codebuddy-implement-change-local-v1'),
    ) as AdapterRegistry;

    expect(registry.listAdapterIds()).toContain('github-branch-pr-write-v1');
    expect(registry.listAdapterIds()).toContain('github-pr-collaboration-write-v1');
    expect(registry.listAdapterIds()).toContain('codebuddy-implement-change-local-v1');
  });
});


describe('McfRuntimeModule GitHub execution identity composition', () => {
  it('shares one GitHubExecutionIdentityRegistry provider across all write paths', () => {
    const providers = Reflect.getMetadata('providers', McfRuntimeModule) as unknown[];
    expect(
      providers.filter(
        (provider) =>
          provider === GitHubExecutionIdentityRegistry ||
          (typeof provider === 'object' &&
            provider !== null &&
            (provider as FactoryProvider).provide === GitHubExecutionIdentityRegistry),
      ),
    ).toHaveLength(1);

    const factoryFor = (token: unknown) =>
      providers.find(
        (provider): provider is FactoryProvider =>
          typeof provider === 'object' &&
          provider !== null &&
          (provider as FactoryProvider).provide === token,
      );

    expect(factoryFor(GitHubBranchPullRequestAdapter)?.inject).toEqual([
      EvidenceValidator,
      GitHubExecutionIdentityRegistry,
    ]);
    expect(factoryFor(GitHubPullCollaborationAdapter)?.inject).toEqual([
      EvidenceValidator,
      GitHubExecutionIdentityRegistry,
    ]);
    expect(factoryFor(GitHubActionsStagingDeployAdapter)?.inject).toEqual([
      EvidenceValidator,
      GitHubExecutionIdentityRegistry,
    ]);
    expect(factoryFor(ExternalActionDispatcher)?.inject).toEqual([
      AdapterRegistry,
      ExternalActionLedger,
      GitHubExecutionIdentityRegistry,
    ]);
  });
});
