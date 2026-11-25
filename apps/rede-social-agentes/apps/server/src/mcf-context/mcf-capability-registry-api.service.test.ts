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
  'context/capabilities/cognitive-ledger-memory-read.yaml',
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
    expect(mcf.entries.map(({ capability }) => capability.id)).toEqual(
      expect.arrayContaining(['cloud.context.local.read', 'cognitive-ledger.memory.read']),
    );
  });


  it('analyzes capability gaps using current live verification evidence', () => {
    const service = McfCapabilityRegistryApiService.fromEnvironment(
      { MCF_CONTEXT_CONFIG_JSON: configuration() },
      () => '2026-11-25T18:00:00.000Z',
    );
    const report = service.analyzeGaps({
      project_id: 'triview-workspace-linux',
      requirements: [{
        capability_id: 'mcf.context.recovery.read',
        required_operations: ['context.recover'],
        environment: 'lab',
        resource: 'context/projects/triview-workspace-linux.yaml',
        mode: 'READ_ONLY',
      }],
      live_verifications: [{
        capability_id: 'mcf.context.recovery.read',
        connection_state: 'CONNECTED',
        runtime_state: 'ACTIVE',
        verification_state: 'VERIFIED',
        observed_at: '2026-11-25T17:59:30.000Z',
        source_ref: 'receipt://mcf-context/live-check-001',
      }],
    });
    expect(report).toMatchObject({
      project_id: 'triview-workspace-linux',
      read_only: true,
      evidence_only: true,
      summary: { total: 1, ready: 1, missing: 0, blocked: 0, needs_verification: 0 },
      requirements: [{ capability_id: 'mcf.context.recovery.read', status: 'READY' }],
    });
  });

  it('builds a plan-only bootstrap graph from the capability gap report', () => {
    const service = McfCapabilityRegistryApiService.fromEnvironment(
      { MCF_CONTEXT_CONFIG_JSON: configuration() },
      () => '2026-11-25T18:00:00.000Z',
    );
    const plan = service.buildBootstrapPlan({
      project_id: 'triview-workspace-linux',
      project_name: 'TriView Workspace',
      objective: 'Prepare a governed local project workflow',
      environment: 'lab',
      requirements: [{ capability_id: 'mcf.context.recovery.read' }],
      production_requested: false,
    });
    expect(plan).toMatchObject({
      project_id: 'triview-workspace-linux',
      read_only: true,
      evidence_only: true,
      execution_started: false,
    });
    expect(plan.tasks.find((task) => task.id === 'bootstrap-05-provisioning')?.status).toBe('SKIPPED');
    expect(plan.tasks.find((task) => task.id === 'bootstrap-11-deployment')?.status).toBe('SKIPPED');
  });

  it('keeps analysis disabled when capability sources are not configured', () => {
    const service = McfCapabilityRegistryApiService.fromEnvironment({
      MCF_CONTEXT_CONFIG_JSON: configuration(false),
    });
    expect(() => service.analyzeGaps({
      project_id: 'triview-workspace-linux',
      requirements: [{ capability_id: 'mcf.context.recovery.read' }],
    })).toThrow(McfCapabilityRegistryUnavailableError);
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
