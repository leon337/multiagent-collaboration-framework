import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { McfCapabilityRegistryEntry } from '@rsa/contracts';
import { stringify } from 'yaml';
import { afterEach, describe, expect, it } from 'vitest';

import { CapabilityRegistryLoader } from './capability-registry.loader.js';

const repositoryRoot = fileURLToPath(new URL('../../../../../../', import.meta.url));
const schemaDirectory = join(repositoryRoot, 'schemas/context');
const knownProjectIds = [
  'cloud-infrastructure',
  'cognitive-ledger',
  'multiagent-collaboration-framework',
  'triview-workspace-linux',
];
const canonicalSources = [
  'context/capabilities/cloud-workspace-g2a-read.yaml',
  'context/capabilities/cloud-workspace-g2b-write.yaml',
  'context/capabilities/cognitive-ledger-memory-read.yaml',
  'context/capabilities/mcf-capability-registry-read.yaml',
  'context/capabilities/mcf-context-recovery-read.yaml',
].map((sourceRef) => ({
  source_ref: sourceRef,
  source_revision: 'capability-registry-test-revision',
}));
const temporaryDirectories: string[] = [];

function temporaryRepository(): string {
  const root = mkdtempSync(join(tmpdir(), 'mcf-capability-registry-'));
  temporaryDirectories.push(root);
  return root;
}

function writeYaml(root: string, sourceRef: string, value: unknown): void {
  const path = join(root, sourceRef);
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, stringify(value), 'utf8');
}

function capabilityFixture(): McfCapabilityRegistryEntry {
  return {
    schema_version: 1,
    capability: {
      id: 'fixture.read',
      provider_project_id: 'multiagent-collaboration-framework',
      consumer_project_ids: ['triview-workspace-linux'],
      mode: 'READ_ONLY',
    },
    contract: {
      protocol: 'FIXTURE_V1',
      allowed_operations: ['fixture.read'],
      prohibited_operations: ['fixture.write'],
    },
    scope: { environments: ['lab'], resources: ['fixture'] },
    governance: {
      authorization_state: 'NOT_AUTHORIZED',
      required_gate: 'FIXTURE_GATE',
      expiration: null,
    },
    lifecycle: {
      implementation_state: 'IMPLEMENTED',
      connection_state: 'DISCONNECTED',
      runtime_state: 'INACTIVE',
      verification_state: 'NOT_VERIFIED',
      last_verified_at: null,
    },
    evidence: [{ source_ref: 'fixture', source_revision: 'fixture-revision' }],
    freshness: 'LIVE_REQUIRED',
  };
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('CapabilityRegistryLoader', () => {
  it('loads the honest lifecycle of the current Context and Control Bridge capabilities', () => {
    const result = new CapabilityRegistryLoader({
      repositoryRoot,
      schemaDirectory,
      sources: canonicalSources,
      knownProjectIds,
    }).load();

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.code);
    expect(result.entries.map(({ capability }) => capability.id)).toEqual([
      'cloud.workspace.g2a.read',
      'cloud.workspace.g2b.write',
      'cognitive-ledger.memory.read',
      'mcf.capability.registry.read',
      'mcf.context.recovery.read',
    ]);
    expect(
      result.entries.find(({ capability }) => capability.id === 'cognitive-ledger.memory.read'),
    ).toMatchObject({
      capability: {
        provider_project_id: 'cognitive-ledger',
        consumer_project_ids: ['multiagent-collaboration-framework'],
        mode: 'READ_ONLY',
      },
      governance: { authorization_state: 'AUTHORIZED' },
      lifecycle: {
        implementation_state: 'IMPLEMENTED',
        connection_state: 'CONNECTED',
        runtime_state: 'ACTIVE',
        verification_state: 'VERIFIED',
      },
    });
    expect(
      result.entries.find(({ capability }) => capability.id === 'mcf.context.recovery.read'),
    ).toMatchObject({
      capability: { mode: 'READ_ONLY' },
      governance: { authorization_state: 'AUTHORIZED' },
      lifecycle: {
        connection_state: 'CONNECTED',
        runtime_state: 'ACTIVE',
        verification_state: 'VERIFIED',
      },
    });
    expect(
      result.entries.find(({ capability }) => capability.id === 'cloud.workspace.g2a.read'),
    ).toMatchObject({
      governance: { authorization_state: 'NOT_AUTHORIZED' },
      lifecycle: {
        connection_state: 'DISCONNECTED',
        runtime_state: 'UNKNOWN',
        verification_state: 'HISTORICALLY_VERIFIED',
      },
    });
    expect(
      result.entries.find(({ capability }) => capability.id === 'cloud.workspace.g2b.write'),
    ).toMatchObject({
      governance: {
        authorization_state: 'NOT_AUTHORIZED',
        required_gate: 'G2B_TASKS9_10_AND_SEPARATE_HUMAN_GATE',
      },
      lifecycle: {
        connection_state: 'DISCONNECTED',
        runtime_state: 'BLOCKED',
        verification_state: 'HISTORICALLY_VERIFIED',
      },
    });
  });

  it('fails closed for duplicate capability ids', () => {
    const source = canonicalSources.find(({ source_ref }) =>
      source_ref.endsWith('/mcf-context-recovery-read.yaml'),
    );
    if (!source) throw new Error('fixture source missing');
    const result = new CapabilityRegistryLoader({
      repositoryRoot,
      schemaDirectory,
      sources: [source, { ...source, source_revision: 'another-revision' }],
      knownProjectIds,
    }).load();

    expect(result).toMatchObject({
      ok: false,
      code: 'CAPABILITY_ID_DUPLICATED',
      details: ['mcf.context.recovery.read'],
    });
  });

  it('rejects unknown projects and conflicting allowed/prohibited operations', () => {
    const root = temporaryRepository();
    const sourceRef = 'context/capabilities/fixture.yaml';
    const unknownProject = capabilityFixture();
    unknownProject.capability.provider_project_id = 'unknown-project';
    writeYaml(root, sourceRef, unknownProject);

    expect(
      new CapabilityRegistryLoader({
        repositoryRoot: root,
        schemaDirectory,
        sources: [{ source_ref: sourceRef, source_revision: 'fixture-revision' }],
        knownProjectIds,
      }).load(),
    ).toMatchObject({ ok: false, code: 'CAPABILITY_PROJECT_UNKNOWN' });

    const conflicting = capabilityFixture();
    conflicting.contract.prohibited_operations = ['fixture.read'];
    writeYaml(root, sourceRef, conflicting);
    expect(
      new CapabilityRegistryLoader({
        repositoryRoot: root,
        schemaDirectory,
        sources: [{ source_ref: sourceRef, source_revision: 'fixture-revision' }],
        knownProjectIds,
      }).load(),
    ).toMatchObject({
      ok: false,
      code: 'CAPABILITY_OPERATION_CONFLICT',
      details: ['fixture.read'],
    });
  });

  it('rejects VERIFIED as a label for a disconnected or unauthorized capability', () => {
    const root = temporaryRepository();
    const sourceRef = 'context/capabilities/fixture.yaml';
    const mislabeled = capabilityFixture();
    mislabeled.lifecycle.verification_state = 'VERIFIED';
    mislabeled.lifecycle.last_verified_at = '2026-08-23T08:00:00.000Z';
    writeYaml(root, sourceRef, mislabeled);

    expect(
      new CapabilityRegistryLoader({
        repositoryRoot: root,
        schemaDirectory,
        sources: [{ source_ref: sourceRef, source_revision: 'fixture-revision' }],
        knownProjectIds,
      }).load(),
    ).toMatchObject({
      ok: false,
      code: 'CAPABILITY_SCHEMA_INVALID',
      source_ref: sourceRef,
    });
  });
});
