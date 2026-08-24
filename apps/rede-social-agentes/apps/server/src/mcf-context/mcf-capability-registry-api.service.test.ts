import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  McfCapabilityRegistryApiService,
  McfCapabilityRegistryUnavailableError,
} from './mcf-capability-registry-api.service.js';

const repositoryRoot = fileURLToPath(new URL('../../../../../../', import.meta.url));
const revision = 'a'.repeat(40);
const registrySources = [
  'context/projects/cloud-infrastructure.yaml',
  'context/projects/cognitive-ledger.yaml',
  'context/projects/multiagent-collaboration-framework.yaml',
  'context/projects/triview-workspace-linux.yaml',
];
const capabilitySources = [
  'context/capabilities/cloud-context-local-read.yaml',
  'context/capabilities/cloud-workspace-g2a-read.yaml',
  'context/capabilities/cloud-workspace-g2b-write.yaml',
  'context/capabilities/mcf-capability-registry-read.yaml',
  'context/capabilities/mcf-context-recovery-read.yaml',
];

function configuration(includeCapabilities = true): string {
  return JSON.stringify({
    registry_repository_root: repositoryRoot,
    registry_sources: registrySources.map((source_ref) => ({
      source_ref,
      source_revision: revision,
    })),
    ...(includeCapabilities
      ? {
          capability_sources: capabilitySources.map((source_ref) => ({
            source_ref,
            source_revision: revision,
          })),
        }
      : {}),
    project_repositories: {},
  });
}

describe('McfCapabilityRegistryApiService', () => {
  it('returns a read-only evidence snapshot and filters by project id', () => {
    const service = McfCapabilityRegistryApiService.fromEnvironment(
      { MCF_CONTEXT_CONFIG_JSON: configuration() },
      () => '2026-08-23T08:00:00.000Z',
    );

    const snapshot = service.listReadOnly();
    expect(snapshot).toMatchObject({
      schema_version: 1,
      retrieved_at: '2026-08-23T08:00:00.000Z',
      project_id: null,
      read_only: true,
      evidence_only: true,
      entries: expect.arrayContaining([
        expect.objectContaining({
          capability: expect.objectContaining({ id: 'mcf.context.recovery.read' }),
        }),
      ]),
      sources: expect.arrayContaining([
        expect.objectContaining({
          source_ref: 'context/capabilities/mcf-context-recovery-read.yaml',
          source_revision: revision,
        }),
      ]),
    });
    expect(snapshot.sources).toEqual(
      capabilitySources.map((source_ref) => ({ source_ref, source_revision: revision })),
    );
    expect(snapshot.sources.every((source) => !('resolved_path' in source))).toBe(true);

    const triView = service.listReadOnly('triview-workspace-linux');
    expect(triView.project_id).toBe('triview-workspace-linux');
    expect(triView.entries.map(({ capability }) => capability.id)).toEqual([
      'cloud.workspace.g2a.read',
      'mcf.capability.registry.read',
      'mcf.context.recovery.read',
    ]);

    const mcf = service.listReadOnly('multiagent-collaboration-framework');
    expect(mcf.entries.map(({ capability }) => capability.id)).toContain(
      'cloud.context.local.read',
    );
  });

  it('stays disabled unless explicit capability sources are configured', () => {
    for (const env of [
      {},
      { MCF_CONTEXT_CONFIG_JSON: configuration(false) },
      { MCF_CONTEXT_CONFIG_JSON: '{"unexpected":true}' },
      {
        MCF_CONTEXT_CONFIG_JSON: JSON.stringify({
          registry_repository_root: '/missing/mcf-registry',
          registry_sources: [
            {
              source_ref: 'context/projects/missing.yaml',
              source_revision: revision,
            },
          ],
          capability_sources: [
            {
              source_ref: 'context/capabilities/missing.yaml',
              source_revision: revision,
            },
          ],
          project_repositories: {},
        }),
      },
    ]) {
      const service = McfCapabilityRegistryApiService.fromEnvironment(env);
      expect(() => service.listReadOnly()).toThrow(McfCapabilityRegistryUnavailableError);
    }
  });
});
