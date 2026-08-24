import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { McfProjectRegistryEntry } from '@rsa/contracts';
import { describe, expect, it } from 'vitest';

import { ContextSchemaValidator } from './context-schema.validator.js';
import { normalizeProjectHint, resolveProject } from './project-resolver.js';
import { RepositoryContextSource } from './repository-context-source.js';

const repositoryRoot = fileURLToPath(new URL('../../../../../../', import.meta.url));
const schemaDirectory = join(repositoryRoot, 'schemas/context');
const registryRefs = [
  'context/projects/cloud-infrastructure.yaml',
  'context/projects/cognitive-ledger.yaml',
  'context/projects/multiagent-collaboration-framework.yaml',
  'context/projects/triview-workspace-linux.yaml',
] as const;

function loadRegistryEntries(): McfProjectRegistryEntry[] {
  const source = new RepositoryContextSource({ repositoryRoot });
  const validator = new ContextSchemaValidator(
    join(schemaDirectory, 'project-registry-entry.schema.json'),
  );
  return registryRefs.map((sourceRef) => {
    const loaded = source.loadYaml(sourceRef, 'ecosystem-registry-test-revision');
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) throw new Error(loaded.error.code);
    expect(validator.validate(loaded.document)).toEqual({ valid: true, errors: [] });
    return loaded.document as unknown as McfProjectRegistryEntry;
  });
}

describe('ecosystem Project Registry', () => {
  it('registers the four repositories with stable unique identities', () => {
    const entries = loadRegistryEntries();

    expect(entries.map(({ project }) => project.id).toSorted()).toEqual([
      'cloud-infrastructure',
      'cognitive-ledger',
      'multiagent-collaboration-framework',
      'triview-workspace-linux',
    ]);
    expect(new Set(entries.map(({ project }) => project.id)).size).toBe(entries.length);
    expect(new Set(entries.map(({ identity }) => identity.canonical_repository)).size).toBe(
      entries.length,
    );
    expect(
      entries.every(({ context }) => context.capsule_path === '.mcf/project-capsule.yaml'),
    ).toBe(true);
  });

  it('keeps every id, repository and alias globally unambiguous', () => {
    const entries = loadRegistryEntries();
    const hints = entries.flatMap((entry) => [
      entry.project.id,
      entry.identity.canonical_repository,
      ...entry.identity.aliases,
    ]);
    const normalizedHints = hints.map(normalizeProjectHint);

    expect(new Set(normalizedHints).size).toBe(normalizedHints.length);
    for (const entry of entries) {
      for (const hint of [
        entry.project.id,
        entry.identity.canonical_repository,
        ...entry.identity.aliases,
      ]) {
        expect(resolveProject(entries, hint)).toMatchObject({
          outcome: 'RESOLVED',
          project_id: entry.project.id,
        });
      }
    }
  });
});
