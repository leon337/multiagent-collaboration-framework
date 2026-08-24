import { join } from 'node:path';

import type { McfCapabilityRegistryEntry } from '@rsa/contracts';

import { ContextSchemaValidator } from './context-schema.validator.js';
import {
  RepositoryContextSource,
  type RepositoryContextSourceEvidence,
} from './repository-context-source.js';

const MAX_CAPABILITY_SOURCES = 128;

export interface CapabilityRegistrySource {
  source_ref: string;
  source_revision: string;
}

export interface CapabilityRegistryLoaderOptions {
  repositoryRoot: string;
  schemaDirectory: string;
  sources: readonly CapabilityRegistrySource[];
  knownProjectIds: readonly string[];
  maxSourceBytes?: number;
}

export type CapabilityRegistryLoadResult =
  | {
      ok: true;
      entries: McfCapabilityRegistryEntry[];
      sources: RepositoryContextSourceEvidence[];
    }
  | {
      ok: false;
      code:
        | 'CAPABILITY_SOURCE_LIMIT_EXCEEDED'
        | 'CAPABILITY_SOURCE_INVALID'
        | 'CAPABILITY_SCHEMA_INVALID'
        | 'CAPABILITY_ID_DUPLICATED'
        | 'CAPABILITY_PROJECT_UNKNOWN'
        | 'CAPABILITY_OPERATION_CONFLICT';
      source_ref: string | null;
      details: string[];
    };

function compareText(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

export class CapabilityRegistryLoader {
  private readonly source: RepositoryContextSource;
  private readonly validator: ContextSchemaValidator;
  private readonly sources: readonly CapabilityRegistrySource[];
  private readonly knownProjectIds: ReadonlySet<string>;

  constructor(options: CapabilityRegistryLoaderOptions) {
    this.source = new RepositoryContextSource({
      repositoryRoot: options.repositoryRoot,
      ...(options.maxSourceBytes === undefined ? {} : { maxSourceBytes: options.maxSourceBytes }),
    });
    this.validator = new ContextSchemaValidator(
      join(options.schemaDirectory, 'capability-registry-entry.schema.json'),
    );
    this.sources = options.sources.map((source) => ({ ...source }));
    this.knownProjectIds = new Set(options.knownProjectIds);
  }

  load(): CapabilityRegistryLoadResult {
    if (this.sources.length > MAX_CAPABILITY_SOURCES) {
      return {
        ok: false,
        code: 'CAPABILITY_SOURCE_LIMIT_EXCEEDED',
        source_ref: null,
        details: [`${this.sources.length}:${MAX_CAPABILITY_SOURCES}`],
      };
    }

    const entries: McfCapabilityRegistryEntry[] = [];
    const sourceEvidence: RepositoryContextSourceEvidence[] = [];
    const capabilityIds = new Set<string>();
    for (const configuredSource of this.sources) {
      const loaded = this.source.loadYaml(
        configuredSource.source_ref,
        configuredSource.source_revision,
      );
      if (!loaded.ok) {
        return {
          ok: false,
          code: 'CAPABILITY_SOURCE_INVALID',
          source_ref: configuredSource.source_ref,
          details: [loaded.error.code],
        };
      }
      const validation = this.validator.validate(loaded.document);
      if (!validation.valid) {
        return {
          ok: false,
          code: 'CAPABILITY_SCHEMA_INVALID',
          source_ref: configuredSource.source_ref,
          details: validation.errors.map(
            ({ instancePath, keyword }) => `${instancePath || '/'}:${keyword}`,
          ),
        };
      }

      const entry = loaded.document as unknown as McfCapabilityRegistryEntry;
      if (capabilityIds.has(entry.capability.id)) {
        return {
          ok: false,
          code: 'CAPABILITY_ID_DUPLICATED',
          source_ref: configuredSource.source_ref,
          details: [entry.capability.id],
        };
      }
      const referencedProjects = [
        entry.capability.provider_project_id,
        ...entry.capability.consumer_project_ids,
      ];
      const unknownProjects = referencedProjects.filter(
        (projectId) => !this.knownProjectIds.has(projectId),
      );
      if (unknownProjects.length > 0) {
        return {
          ok: false,
          code: 'CAPABILITY_PROJECT_UNKNOWN',
          source_ref: configuredSource.source_ref,
          details: [...new Set(unknownProjects)].toSorted(compareText),
        };
      }
      const prohibited = new Set(entry.contract.prohibited_operations);
      const conflicts = entry.contract.allowed_operations.filter((operation) =>
        prohibited.has(operation),
      );
      if (conflicts.length > 0) {
        return {
          ok: false,
          code: 'CAPABILITY_OPERATION_CONFLICT',
          source_ref: configuredSource.source_ref,
          details: conflicts.toSorted(compareText),
        };
      }

      capabilityIds.add(entry.capability.id);
      entries.push(entry);
      sourceEvidence.push(loaded.source);
    }

    return {
      ok: true,
      entries: entries.toSorted((left, right) =>
        compareText(left.capability.id, right.capability.id),
      ),
      sources: sourceEvidence.toSorted((left, right) =>
        compareText(left.source_ref, right.source_ref),
      ),
    };
  }
}
