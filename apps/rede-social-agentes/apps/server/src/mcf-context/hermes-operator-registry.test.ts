import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { McfProjectRegistryEntry } from '@rsa/contracts';
import { describe, expect, it } from 'vitest';

import { ContextSchemaValidator } from './context-schema.validator.js';
import { resolveProject } from './project-resolver.js';
import { RepositoryContextSource } from './repository-context-source.js';

const repositoryRoot = fileURLToPath(new URL('../../../../../../', import.meta.url));
const schemaDirectory = join(repositoryRoot, 'schemas/context');
const sourceRef = 'context/projects/leon337-hermes-operator.yaml';

function loadHermesRegistryEntry(): McfProjectRegistryEntry {
  const source = new RepositoryContextSource({ repositoryRoot });
  const validator = new ContextSchemaValidator(
    join(schemaDirectory, 'project-registry-entry.schema.json'),
  );
  const loaded = source.loadYaml(sourceRef, 'hermes-operator-registry-test-revision');
  expect(loaded.ok).toBe(true);
  if (!loaded.ok) throw new Error(loaded.error.code);
  expect(validator.validate(loaded.document)).toEqual({ valid: true, errors: [] });
  return loaded.document as unknown as McfProjectRegistryEntry;
}

describe('Hermes Operator Context Fabric registry', () => {
  it('registers the durable project identity with LIVE_REQUIRED operational freshness', () => {
    const entry = loadHermesRegistryEntry();

    expect(entry).toMatchObject({
      schema_version: 1,
      project: { id: 'leon337-hermes-operator', lifecycle: 'REGISTERED' },
      identity: {
        canonical_repository: 'leon337/leon337-hermes-operator',
        aliases: ['Hermes Operator', 'Hermes Agent', 'Hermes'],
      },
      ownership: { project_owner: 'LEANDRO' },
      context: { capsule_path: '.mcf/project-capsule.yaml' },
      freshness: { operational_state: 'LIVE_REQUIRED', project_identity: 'DURABLE' },
    });
  });

  it.each([
    'leon337-hermes-operator',
    'leon337/leon337-hermes-operator',
    'Hermes Operator',
    'Hermes Agent',
    'Hermes',
  ])('resolves %s deterministically to Hermes Operator', (hint) => {
    const entry = loadHermesRegistryEntry();

    expect(resolveProject([entry], hint)).toMatchObject({
      outcome: 'RESOLVED',
      project_id: 'leon337-hermes-operator',
    });
  });
});
