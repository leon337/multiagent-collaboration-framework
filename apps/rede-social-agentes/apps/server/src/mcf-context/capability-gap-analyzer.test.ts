import { describe, expect, it } from 'vitest';

import type {
  McfCapabilityRegistryEntry,
  McfCapabilityRegistrySnapshot,
} from '@rsa/contracts';

import { McfCapabilityGapAnalyzer } from './capability-gap-analyzer.js';

const now = '2026-11-25T18:00:00.000Z';
function entry(overrides: Record<string, unknown> = {}): McfCapabilityRegistryEntry {
  return {
    capability: {
      id: 'mcf.google.cloud.provision',
      provider_project_id: 'multiagent-collaboration-framework',
      consumer_project_ids: ['cloud-infrastructure'],
      mode: 'BOUNDED_WRITE',
    },
    contract: {
      allowed_operations: ['project.create', 'maps.enable', 'maps.key.create'],
      prohibited_operations: ['billing.link', 'iam.admin', 'project.delete'],
    },
    scope: {
      environments: ['dev', 'lab'],
      resources: ['google-cloud/projects/*'],
    },
    lifecycle: {
      implementation_state: 'IMPLEMENTED',
      connection_state: 'DISCONNECTED',
      runtime_state: 'UNKNOWN',
      verification_state: 'NOT_VERIFIED',
      last_verified_at: null,
    },
    governance: {
      authorization_state: 'AUTHORIZED',
      required_gate: 'HUMAN_GATE',
      expiration: null,
    },
    evidence: [{ source_ref: 'context/capabilities/mcf-google-cloud-provision.yaml', evidence_type: 'registry' }],
    ...overrides,
  } as unknown as McfCapabilityRegistryEntry;
}
function snapshot(entries: McfCapabilityRegistryEntry[]): McfCapabilityRegistrySnapshot {
  return {
    schema_version: 1,
    retrieved_at: now,
    project_id: 'agente-logistica-obras-v1',
    read_only: true,
    evidence_only: true,
    entries,
    sources: [],
  };
}
const requirement = {
  capability_id: 'mcf.google.cloud.provision',
  required_operations: ['project.create', 'maps.enable'],
  environment: 'dev' as const,
  resource: 'google-cloud/projects/mcf-obras-logistica-v1',
  mode: 'BOUNDED_WRITE' as const,
};
const live = {
  capability_id: 'mcf.google.cloud.provision',
  connection_state: 'CONNECTED' as const,
  runtime_state: 'ACTIVE' as const,
  verification_state: 'VERIFIED' as const,
  observed_at: '2026-11-25T17:59:30.000Z',
  source_ref: 'receipt://google-bridge/live-check-001',
};

describe('McfCapabilityGapAnalyzer', () => {
  const analyzer = new McfCapabilityGapAnalyzer();

  it('marks a capability READY only with implementation, authorization, scope and fresh live evidence', () => {
    const report = analyzer.analyze(
      snapshot([entry()]),
      { project_id: 'agente-logistica-obras-v1', requirements: [requirement], live_verifications: [live] },
      now,
    );
    expect(report).toMatchObject({
      read_only: true,
      evidence_only: true,
      summary: { total: 1, ready: 1, missing: 0, blocked: 0, needs_verification: 0 },
      requirements: [{
        capability_id: 'mcf.google.cloud.provision',
        status: 'READY',
        provider_project_id: 'multiagent-collaboration-framework',
      }],
    });
  });

  it('requires live verification by default even when the registry has a historical verified state', () => {
    const historical = entry({
      lifecycle: {
        implementation_state: 'IMPLEMENTED',
        connection_state: 'CONNECTED',
        runtime_state: 'ACTIVE',
        verification_state: 'VERIFIED',
        last_verified_at: '2026-11-25T17:59:59.000Z',
      },
    });
    const report = analyzer.analyze(
      snapshot([historical]),
      { project_id: 'agente-logistica-obras-v1', requirements: [requirement] },
      now,
    );
    expect(report.requirements[0]?.status).toBe('NEEDS_VERIFICATION');
    expect(report.requirements[0]?.gaps.map((item) => item.code)).toContain('LIVE_VERIFICATION_REQUIRED');
  });

  it('marks missing capabilities separately from blocked capabilities', () => {
    const report = analyzer.analyze(
      snapshot([]),
      { project_id: 'agente-logistica-obras-v1', requirements: [requirement] },
      now,
    );
    expect(report.requirements[0]?.status).toBe('MISSING');
    expect(report.requirements[0]?.gaps[0]?.code).toBe('CAPABILITY_NOT_REGISTERED');
  });

  it('blocks unauthorized, out-of-scope and prohibited operations', () => {
    const restricted = entry({
      governance: { authorization_state: 'NOT_AUTHORIZED', required_gate: 'OWNER_APPROVAL', expiration: null },
      scope: { environments: ['lab'], resources: ['google-cloud/projects/other-*'] },
    });
    const report = analyzer.analyze(
      snapshot([restricted]),
      {
        project_id: 'agente-logistica-obras-v1',
        requirements: [{
          ...requirement,
          required_operations: ['billing.link'],
          environment: 'dev',
          resource: 'google-cloud/projects/mcf-obras-logistica-v1',
        }],
        live_verifications: [live],
      },
      now,
    );
    expect(report.requirements[0]?.status).toBe('BLOCKED');
    expect(report.requirements[0]?.gaps.map((item) => item.code)).toEqual(
      expect.arrayContaining([
        'AUTHORIZATION_REQUIRED',
        'ENVIRONMENT_OUT_OF_SCOPE',
        'RESOURCE_OUT_OF_SCOPE',
        'OPERATION_PROHIBITED',
      ]),
    );
  });

  it('treats stale or future live evidence as requiring verification', () => {
    for (const observed_at of ['2026-11-25T17:00:00.000Z', '2026-11-25T18:01:00.000Z']) {
      const report = analyzer.analyze(
        snapshot([entry()]),
        {
          project_id: 'agente-logistica-obras-v1',
          requirements: [{ ...requirement, max_verification_age_seconds: 60 }],
          live_verifications: [{ ...live, observed_at }],
        },
        now,
      );
      expect(report.requirements[0]?.status).toBe('NEEDS_VERIFICATION');
      expect(report.requirements[0]?.gaps.map((item) => item.code)).toContain('LIVE_VERIFICATION_STALE');
    }
  });

  it('blocks expired authorization and runtime-blocked capabilities', () => {
    const expired = entry({
      governance: { authorization_state: 'AUTHORIZED', required_gate: 'OWNER_APPROVAL', expiration: '2026-11-24T18:00:00.000Z' },
      lifecycle: {
        implementation_state: 'IMPLEMENTED',
        connection_state: 'CONNECTED',
        runtime_state: 'BLOCKED',
        verification_state: 'VERIFIED',
        last_verified_at: now,
      },
    });
    const report = analyzer.analyze(
      snapshot([expired]),
      { project_id: 'agente-logistica-obras-v1', requirements: [requirement], live_verifications: [live] },
      now,
    );
    expect(report.requirements[0]?.status).toBe('BLOCKED');
    expect(report.requirements[0]?.gaps.map((item) => item.code)).toEqual(
      expect.arrayContaining(['AUTHORIZATION_EXPIRED', 'RUNTIME_BLOCKED']),
    );
  });
});
