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
        current_workstream: 'ecosystem-context-fabric-readonly-lab',
        current_status:
          'FOUR_REPOSITORY_CONTEXT_FABRIC_AND_PROVIDER_READ_ADAPTERS_LAB_PASS__MAIN_MERGED__STAGING_EXACT_SHA_VERIFIED__PROVIDER_CAPSULES_SYNCED',
        next_action:
          'Run and record the final read-only 4/4 recovery against the post-sync provider and MCF Capsules; keep local provider capabilities disconnected and inactive, remote G2-A UNKNOWN, and G2-B BLOCKED unless a new human gate authorizes activation.',
        blockers: [
          'cloud.context.local.read and cognitive-ledger.memory.read remain DISCONNECTED, INACTIVE, HISTORICALLY_VERIFIED, and LIVE_REQUIRED after lab teardown.',
          'cloud.workspace.g2a.read remains NOT_AUTHORIZED, DISCONNECTED, UNKNOWN, and LIVE_REQUIRED; cloud.workspace.g2b.write, Tasks 9 and 10 remain NOT_AUTHORIZED, DISCONNECTED, BLOCKED, and LIVE_REQUIRED.',
          'Runtime production and VPS or NODE-01 were not changed; the authorized Vercel publication is static documentation, not agent runtime.',
          'TriView promotion PR 74 remains draft until its separate full physical R7 qualification and human gate are complete.',
        ],
      },
      sources: { current_state: 'docs/MCF-CURRENT-STATE.md' },
      observed_at: '2026-08-24T03:38:21Z',
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
