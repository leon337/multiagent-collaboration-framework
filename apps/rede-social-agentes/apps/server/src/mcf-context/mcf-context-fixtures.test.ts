import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

import { ContextSchemaValidator } from './context-schema.validator.js';

const repositoryRoot = fileURLToPath(new URL('../../../../../../', import.meta.url));
const schemasDirectory = join(repositoryRoot, 'schemas/context');
const registryPath = join(
  repositoryRoot,
  'context/projects/multiagent-collaboration-framework.yaml',
);
const capsulePath = join(repositoryRoot, '.mcf/project-capsule.yaml');

function readYamlRecord(path: string): Record<string, unknown> {
  return parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
}

function collectKeys(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(collectKeys);
  if (value === null || typeof value !== 'object') return [];

  return Object.entries(value).flatMap(([key, child]) => [key, ...collectKeys(child)]);
}

describe('canonical MCF Context Fabric fixtures', () => {
  it('registers stable MCF identity and repository-native recovery entrypoints', () => {
    const registry = readYamlRecord(registryPath);

    expect(registry).toMatchObject({
      schema_version: 1,
      project: {
        id: 'multiagent-collaboration-framework',
        lifecycle: 'REGISTERED',
      },
      identity: {
        canonical_repository: 'leon337/multiagent-collaboration-framework',
        aliases: expect.arrayContaining(['MCF']),
      },
      ownership: { project_owner: 'LEANDRO' },
      context: {
        capsule_path: '.mcf/project-capsule.yaml',
        canonical_entrypoints: expect.arrayContaining(['README.md', 'docs/MCF-CURRENT-STATE.md']),
      },
      freshness: {
        operational_state: 'LIVE_REQUIRED',
        project_identity: 'DURABLE',
      },
    });
  });

  it('pairs the Capsule with Registry identity and records only a sourced snapshot', () => {
    const registry = readYamlRecord(registryPath);
    const capsule = readYamlRecord(capsulePath);

    expect(capsule.project_id).toBe((registry.project as Record<string, unknown>).id);
    expect(capsule).toMatchObject({
      schema_version: 1,
      project_id: 'multiagent-collaboration-framework',
      lifecycle: 'ACTIVE',
      snapshot: {
        current_workstream: 'context-fabric-cf0-cf1',
        current_status: 'CF0_CF1_IMPLEMENTATION_IN_PROGRESS',
        next_action: 'Complete repository-native recovery kernel',
        blockers: [],
      },
      sources: { current_state: 'docs/MCF-CURRENT-STATE.md' },
      observed_at: '2026-08-23T00:22:10-03:00',
    });

    const forbiddenOperationalKeys = new Set([
      'commit_sha',
      'deployment',
      'deployment_state',
      'health',
      'production',
      'production_health',
      'provider',
      'provider_state',
      'readiness',
      'reported_commit',
    ]);
    expect(collectKeys(capsule).filter((key) => forbiddenOperationalKeys.has(key))).toEqual([]);
  });

  it('validates both canonical documents against their isolated schemas', () => {
    const registryValidator = new ContextSchemaValidator(
      join(schemasDirectory, 'project-registry-entry.schema.json'),
    );
    const capsuleValidator = new ContextSchemaValidator(
      join(schemasDirectory, 'project-capsule.schema.json'),
    );

    expect(registryValidator.validate(readYamlRecord(registryPath))).toEqual({
      valid: true,
      errors: [],
    });
    expect(capsuleValidator.validate(readYamlRecord(capsulePath))).toEqual({
      valid: true,
      errors: [],
    });
  });
});
