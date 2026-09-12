import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { McfProjectRegistryEntry } from '@rsa/contracts';
import { describe, expect, it } from 'vitest';

import { ContextSchemaValidator } from './context-schema.validator.js';
import { resolveProject } from './project-resolver.js';
import { RepositoryContextSource } from './repository-context-source.js';

const repositoryRoot = fileURLToPath(new URL('../../../../../../', import.meta.url));
const schemaDirectory = join(repositoryRoot, 'schemas/context');
const sourceRef = 'context/projects/arvore-presente-digital-twin.yaml';

function loadRegistryEntry(): McfProjectRegistryEntry {
  const source = new RepositoryContextSource({ repositoryRoot });
  const validator = new ContextSchemaValidator(
    join(schemaDirectory, 'project-registry-entry.schema.json'),
  );
  const loaded = source.loadYaml(sourceRef, 'arvore-presente-registry-test-revision');
  expect(loaded.ok).toBe(true);
  if (!loaded.ok) throw new Error(loaded.error.code);
  expect(validator.validate(loaded.document)).toEqual({ valid: true, errors: [] });
  return loaded.document as unknown as McfProjectRegistryEntry;
}

describe('Arvore Presente Digital Twin Context Fabric registry', () => {
  it('registers the durable project identity with LIVE_REQUIRED operational freshness', () => {
    const entry = loadRegistryEntry();

    expect(entry).toMatchObject({
      schema_version: 1,
      project: { id: 'arvore-presente-digital-twin', lifecycle: 'REGISTERED' },
      identity: {
        canonical_repository: 'leon337/arvore-presente-digital-twin',
        aliases: ['Árvore Presente', 'Arvore Presente', 'Arvore Presente Digital Twin'],
      },
      ownership: { project_owner: 'LEANDRO' },
      context: {
        capsule_path: '.mcf/project-capsule.yaml',
        canonical_entrypoints: ['README.md', 'CHECKLIST.md', 'ROADMAP.md', 'docs/CHANGELOG.md'],
      },
      freshness: { operational_state: 'LIVE_REQUIRED', project_identity: 'DURABLE' },
    });
  });

  it.each([
    'arvore-presente-digital-twin',
    'leon337/arvore-presente-digital-twin',
    'Árvore Presente',
    'Arvore Presente',
    'Arvore Presente Digital Twin',
  ])('resolves %s deterministically to the project', (hint) => {
    const entry = loadRegistryEntry();
    expect(resolveProject([entry], hint)).toMatchObject({
      outcome: 'RESOLVED',
      project_id: 'arvore-presente-digital-twin',
    });
  });
});
