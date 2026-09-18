import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { McfProjectRegistryEntry } from '@rsa/contracts';
import { describe, expect, it } from 'vitest';

import { ContextSchemaValidator } from './context-schema.validator.js';
import { resolveProject } from './project-resolver.js';
import { RepositoryContextSource } from './repository-context-source.js';

const repositoryRoot = fileURLToPath(new URL('../../../../../../', import.meta.url));
const schemaDirectory = join(repositoryRoot, 'schemas/context');
const sourceRef = 'context/projects/curso-instavar.yaml';

function loadRegistryEntry(): McfProjectRegistryEntry {
  const source = new RepositoryContextSource({ repositoryRoot });
  const validator = new ContextSchemaValidator(
    join(schemaDirectory, 'project-registry-entry.schema.json'),
  );
  const loaded = source.loadYaml(sourceRef, 'curso-instavar-registry-test-revision');
  expect(loaded.ok).toBe(true);
  if (!loaded.ok) throw new Error(loaded.error.code);
  expect(validator.validate(loaded.document)).toEqual({ valid: true, errors: [] });
  return loaded.document as unknown as McfProjectRegistryEntry;
}

describe('Curso Instavar Context Fabric registry', () => {
  it('registers the durable project identity with LIVE_REQUIRED operational freshness', () => {
    const entry = loadRegistryEntry();

    expect(entry).toMatchObject({
      schema_version: 1,
      project: { id: 'curso-instavar', lifecycle: 'REGISTERED' },
      identity: {
        canonical_repository: 'leon337/curso-instavar',
        aliases: ['Curso Instavar', 'Instavar Course', 'Instavar AI Platform', 'Instavar V2.5'],
      },
      ownership: { project_owner: 'LEANDRO' },
      context: {
        capsule_path: '.mcf/project-capsule.yaml',
        canonical_entrypoints: [
          '.mcf/mission.yaml',
          'docs/MCF-MISSION-STATE.md',
          'README.md',
          'course-data.mjs',
          'api/agent.mjs',
          'api/transcribe.py',
        ],
      },
      freshness: { operational_state: 'LIVE_REQUIRED', project_identity: 'DURABLE' },
    });
  });

  it.each([
    'curso-instavar',
    'leon337/curso-instavar',
    'Curso Instavar',
    'Instavar Course',
    'Instavar AI Platform',
    'Instavar V2.5',
  ])('resolves %s deterministically to the project', (hint) => {
    const entry = loadRegistryEntry();
    expect(resolveProject([entry], hint)).toMatchObject({
      outcome: 'RESOLVED',
      project_id: 'curso-instavar',
    });
  });
});
