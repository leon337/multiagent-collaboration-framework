import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { stringify } from 'yaml';
import { afterEach, describe, expect, it } from 'vitest';

import {
  McfContextRecoveryApiService,
  McfContextRecoveryUnavailableError,
} from './mcf-context-recovery-api.service.js';

const repositoryRoot = fileURLToPath(new URL('../../../../../../', import.meta.url));
const schemaDirectory = join(repositoryRoot, 'schemas/context');
const temporaryDirectories: string[] = [];

function temporaryDirectory(prefix: string): string {
  const root = mkdtempSync(join(tmpdir(), prefix));
  temporaryDirectories.push(root);
  return root;
}

function writeYaml(root: string, sourceRef: string, value: unknown): void {
  const path = join(root, sourceRef);
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, stringify(value), 'utf8');
}

function createConfiguration(): string {
  const registryRoot = temporaryDirectory('mcf-api-registry-');
  const projectRoot = temporaryDirectory('mcf-api-project-');
  const registryRef = 'context/projects/cognitive-ledger.yaml';
  writeYaml(registryRoot, registryRef, {
    schema_version: 1,
    project: { id: 'cognitive-ledger', lifecycle: 'REGISTERED' },
    identity: {
      canonical_repository: 'leon337/cognitive-ledger',
      aliases: ['Ledger'],
    },
    ownership: { project_owner: 'LEANDRO' },
    context: {
      capsule_path: '.mcf/project-capsule.yaml',
      canonical_entrypoints: ['README.md'],
    },
    freshness: { operational_state: 'LIVE_REQUIRED', project_identity: 'DURABLE' },
  });
  writeYaml(projectRoot, '.mcf/project-capsule.yaml', {
    schema_version: 1,
    project_id: 'cognitive-ledger',
    purpose: 'Read-only cross-chat memory.',
    lifecycle: 'ACTIVE',
    snapshot: {
      current_workstream: 'zero-cost-read-path',
      current_status: 'LAB',
      next_action: 'Validate the read-only integration',
      blockers: [],
    },
    sources: { current_state: 'README.md' },
    observed_at: '2026-08-23T07:00:00Z',
  });
  writeFileSync(join(projectRoot, 'README.md'), '# Cognitive Ledger\n', 'utf8');
  execFileSync('git', ['init', '--quiet', projectRoot]);
  execFileSync('git', ['-C', projectRoot, 'add', '.']);
  execFileSync('git', [
    '-C',
    projectRoot,
    '-c',
    'user.name=MCF Test',
    '-c',
    'user.email=mcf-test@example.invalid',
    'commit',
    '--quiet',
    '-m',
    'fixture',
  ]);
  const projectRevision = execFileSync('git', ['-C', projectRoot, 'rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim();

  return JSON.stringify({
    registry_repository_root: registryRoot,
    schema_directory: schemaDirectory,
    registry_sources: [
      {
        source_ref: registryRef,
        source_revision: 'a'.repeat(40),
      },
    ],
    project_repositories: {
      'cognitive-ledger': {
        repository_root: projectRoot,
        source_revision: projectRevision,
      },
    },
  });
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('McfContextRecoveryApiService', () => {
  it('recovers a cross-repository Capsule through the configured read-only API boundary', async () => {
    const service = McfContextRecoveryApiService.fromEnvironment({
      MCF_CONTEXT_CONFIG_JSON: createConfiguration(),
    });

    const receipt = await service.recoverReadOnly('Ledger', false);

    expect(receipt).toMatchObject({
      project_id: 'cognitive-ledger',
      recovery_state: 'RECOVERED',
      read_only: true,
      material_action: false,
      evidence_only: true,
    });
    expect(receipt.sources).toContainEqual(
      expect.objectContaining({
        role: 'CAPSULE',
        source_ref: 'repo://leon337/cognitive-ledger/.mcf/project-capsule.yaml',
      }),
    );
  });

  it('performs local Git freshness verification when explicitly requested', async () => {
    const service = McfContextRecoveryApiService.fromEnvironment({
      MCF_CONTEXT_CONFIG_JSON: createConfiguration(),
    });

    const receipt = await service.recoverReadOnly('cognitive-ledger', true);

    expect(receipt.recovery_state).toBe('RECOVERED');
    expect(receipt.sources).toContainEqual(
      expect.objectContaining({
        role: 'LIVE_VERIFICATION',
        source_ref: 'repo://leon337/cognitive-ledger/.git/HEAD',
      }),
    );
  });

  it('stays disabled for absent or malformed environment configuration', async () => {
    for (const env of [
      {},
      { MCF_CONTEXT_CONFIG_JSON: '{"unexpected":true}' },
      {
        MCF_CONTEXT_CONFIG_JSON: JSON.stringify({
          registry_repository_root: '/missing/mcf-registry',
          registry_sources: [
            {
              source_ref: 'context/projects/missing.yaml',
              source_revision: 'a'.repeat(40),
            },
          ],
          project_repositories: {},
        }),
      },
    ]) {
      const service = McfContextRecoveryApiService.fromEnvironment(env);
      await expect(service.recoverReadOnly('MCF', false)).rejects.toBeInstanceOf(
        McfContextRecoveryUnavailableError,
      );
    }
  });
});
