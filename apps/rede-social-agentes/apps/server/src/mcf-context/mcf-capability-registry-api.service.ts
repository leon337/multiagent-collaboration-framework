import { join } from 'node:path';

import { Injectable } from '@nestjs/common';
import type { McfCapabilityRegistrySnapshot, McfProjectRegistryEntry } from '@rsa/contracts';

import { CapabilityRegistryLoader } from './capability-registry.loader.js';
import { ContextSchemaValidator } from './context-schema.validator.js';
import { loadMcfContextApiConfiguration } from './mcf-context-recovery-api.service.js';
import { RepositoryContextSource } from './repository-context-source.js';

export class McfCapabilityRegistryUnavailableError extends Error {
  constructor() {
    super('MCF capability registry is not configured or its repository sources are invalid.');
    this.name = 'McfCapabilityRegistryUnavailableError';
  }
}

@Injectable()
export class McfCapabilityRegistryApiService {
  constructor(
    private readonly loader: CapabilityRegistryLoader | null,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  static fromEnvironment(
    env: NodeJS.ProcessEnv = process.env,
    now?: () => string,
  ): McfCapabilityRegistryApiService {
    const configuration = loadMcfContextApiConfiguration(env);
    if (configuration === null || configuration.capability_sources === undefined) {
      return new McfCapabilityRegistryApiService(null, now);
    }

    try {
      const registrySource = new RepositoryContextSource({
        repositoryRoot: configuration.registry_repository_root,
      });
      const schemaDirectory =
        configuration.schema_directory ??
        join(configuration.registry_repository_root, 'schemas/context');
      const registryValidator = new ContextSchemaValidator(
        join(schemaDirectory, 'project-registry-entry.schema.json'),
      );
      const knownProjectIds: string[] = [];
      for (const configuredSource of configuration.registry_sources) {
        const loaded = registrySource.loadYaml(
          configuredSource.source_ref,
          configuredSource.source_revision,
        );
        if (!loaded.ok || !registryValidator.validate(loaded.document).valid) {
          return new McfCapabilityRegistryApiService(null, now);
        }
        knownProjectIds.push((loaded.document as unknown as McfProjectRegistryEntry).project.id);
      }

      return new McfCapabilityRegistryApiService(
        new CapabilityRegistryLoader({
          repositoryRoot: configuration.registry_repository_root,
          schemaDirectory,
          sources: configuration.capability_sources,
          knownProjectIds,
        }),
        now,
      );
    } catch {
      return new McfCapabilityRegistryApiService(null, now);
    }
  }

  listReadOnly(projectId?: string): McfCapabilityRegistrySnapshot {
    if (this.loader === null) throw new McfCapabilityRegistryUnavailableError();
    const result = this.loader.load();
    if (!result.ok) throw new McfCapabilityRegistryUnavailableError();

    return {
      schema_version: 1,
      retrieved_at: this.now(),
      project_id: projectId ?? null,
      read_only: true,
      evidence_only: true,
      entries:
        projectId === undefined
          ? result.entries
          : result.entries.filter(
              ({ capability }) =>
                capability.provider_project_id === projectId ||
                capability.consumer_project_ids.includes(projectId),
            ),
      sources: result.sources,
    };
  }
}
