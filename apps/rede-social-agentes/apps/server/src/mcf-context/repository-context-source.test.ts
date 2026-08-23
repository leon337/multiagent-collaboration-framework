import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import type { McfProjectRegistryEntry } from '@rsa/contracts';
import { afterEach, describe, expect, it } from 'vitest';

import { RepositoryContextSource } from './repository-context-source.js';

const temporaryDirectories: string[] = [];

function createRepository(): string {
  const repositoryRoot = mkdtempSync(join(tmpdir(), 'mcf-context-source-'));
  temporaryDirectories.push(repositoryRoot);
  mkdirSync(join(repositoryRoot, 'context/projects'), { recursive: true });
  mkdirSync(join(repositoryRoot, '.mcf'), { recursive: true });
  return repositoryRoot;
}

function registry(capsulePath = '.mcf/project-capsule.yaml'): McfProjectRegistryEntry {
  return {
    schema_version: 1,
    project: { id: 'multiagent-collaboration-framework', lifecycle: 'REGISTERED' },
    identity: {
      canonical_repository: 'leon337/multiagent-collaboration-framework',
      aliases: ['MCF'],
    },
    ownership: { project_owner: 'LEANDRO' },
    context: {
      capsule_path: capsulePath,
      canonical_entrypoints: ['README.md'],
    },
    freshness: {
      operational_state: 'LIVE_REQUIRED',
      project_identity: 'DURABLE',
    },
  };
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('RepositoryContextSource', () => {
  it('loads Registry YAML by explicit path and preserves immutable source evidence', () => {
    const repositoryRoot = createRepository();
    const sourceRef = 'context/projects/mcf.yaml';
    const sourcePath = join(repositoryRoot, sourceRef);
    const bytes = Buffer.from('schema_version: 1\nproject:\n  id: mcf\n', 'utf8');
    writeFileSync(sourcePath, bytes);

    const result = new RepositoryContextSource({ repositoryRoot }).loadYaml(
      sourceRef,
      'revision-1',
    );

    expect(result).toEqual({
      ok: true,
      document: { schema_version: 1, project: { id: 'mcf' } },
      source: {
        source_ref: sourceRef,
        source_revision: 'revision-1',
        resolved_path: sourcePath,
      },
    });
    expect(readFileSync(sourcePath)).toEqual(bytes);
  });

  it('loads the Capsule only from the Registry capsule_path', () => {
    const repositoryRoot = createRepository();
    const capsulePath = join(repositoryRoot, '.mcf/project-capsule.yaml');
    writeFileSync(capsulePath, 'schema_version: 1\nproject_id: mcf\n');

    const result = new RepositoryContextSource({ repositoryRoot }).loadCapsule(
      registry(),
      'revision-2',
    );

    expect(result).toMatchObject({
      ok: true,
      document: { schema_version: 1, project_id: 'mcf' },
      source: {
        source_ref: '.mcf/project-capsule.yaml',
        source_revision: 'revision-2',
        resolved_path: capsulePath,
      },
    });
  });

  it('returns deterministic INVALID_CONTEXT data for malformed or non-mapping YAML', () => {
    const repositoryRoot = createRepository();
    const source = new RepositoryContextSource({ repositoryRoot });

    for (const [filename, content, code] of [
      ['duplicate.yaml', 'key: one\nkey: two\n', 'MALFORMED_YAML'],
      ['multiple.yaml', 'one: 1\n---\ntwo: 2\n', 'MALFORMED_YAML'],
      ['sequence.yaml', '- one\n- two\n', 'INVALID_DOCUMENT_ROOT'],
    ] as const) {
      writeFileSync(join(repositoryRoot, filename), content);
      expect(source.loadYaml(filename, 'revision-invalid')).toMatchObject({
        ok: false,
        error: {
          recovery_state: 'INVALID_CONTEXT',
          code,
          source_ref: filename,
        },
      });
    }
  });

  it('rejects traversal, absolute paths, backslashes, and symlink escape', () => {
    const repositoryRoot = createRepository();
    const outsideRoot = mkdtempSync(join(tmpdir(), 'mcf-context-outside-'));
    temporaryDirectories.push(outsideRoot);
    const outsidePath = join(outsideRoot, 'outside.yaml');
    writeFileSync(outsidePath, 'outside: true\n');
    symlinkSync(outsidePath, join(repositoryRoot, 'escaped.yaml'));
    symlinkSync(outsideRoot, join(repositoryRoot, 'escaped-directory'));

    const source = new RepositoryContextSource({ repositoryRoot });
    for (const sourceRef of [
      '../outside.yaml',
      outsidePath,
      '..\\outside.yaml',
      'escaped.yaml',
      'escaped-directory/outside.yaml',
    ]) {
      expect(source.loadYaml(sourceRef, 'revision-path'), sourceRef).toMatchObject({
        ok: false,
        error: {
          recovery_state: 'INVALID_CONTEXT',
          source_ref: sourceRef,
        },
      });
    }
  });

  it('rejects invalid UTF-8, unsafe YAML features, controls, and oversized sources', () => {
    const repositoryRoot = createRepository();
    const source = new RepositoryContextSource({ repositoryRoot, maxSourceBytes: 64 });
    const cases: Array<[string, string | Buffer, string]> = [
      ['invalid-utf8.yaml', Buffer.from([0xc3, 0x28]), 'INVALID_UTF8'],
      ['alias.yaml', 'shared: &shared value\ncopy: *shared\n', 'UNSAFE_YAML_FEATURE'],
      ['tag.yaml', 'value: !!str text\n', 'UNSAFE_YAML_FEATURE'],
      ['custom-tag.yaml', 'value: !custom text\n', 'UNSAFE_YAML_FEATURE'],
      ['control.yaml', 'value: bad\u0000value\n', 'INVALID_CONTROL_CHARACTER'],
      ['non-json.yaml', 'value: .nan\n', 'NON_JSON_YAML_VALUE'],
      ['unsafe-integer.yaml', 'value: 9007199254740993\n', 'NON_JSON_YAML_VALUE'],
      ['large.yaml', `value: ${'x'.repeat(80)}\n`, 'SOURCE_TOO_LARGE'],
    ];

    for (const [filename, content, code] of cases) {
      writeFileSync(join(repositoryRoot, filename), content);
      expect(source.loadYaml(filename, 'revision-unsafe'), filename).toMatchObject({
        ok: false,
        error: {
          recovery_state: 'INVALID_CONTEXT',
          code,
          source_ref: filename,
        },
      });
    }
  });

  it('distinguishes unavailable files from invalid context', () => {
    const repositoryRoot = createRepository();

    expect(
      new RepositoryContextSource({ repositoryRoot }).loadYaml('missing.yaml', 'revision-missing'),
    ).toEqual({
      ok: false,
      error: {
        recovery_state: 'SOURCE_UNAVAILABLE',
        code: 'SOURCE_NOT_FOUND',
        source_ref: 'missing.yaml',
        message: 'context source is unavailable',
      },
    });
  });
});
