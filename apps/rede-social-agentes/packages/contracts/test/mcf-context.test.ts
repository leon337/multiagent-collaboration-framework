import { describe, expect, expectTypeOf, it } from 'vitest';

import type {
  McfContextClaimType,
  McfContextFreshness,
  McfContextRecoveryReceipt,
  McfContextRecoveryState,
  McfProjectCapsule,
  McfProjectRegistryEntry,
  McfTruthClaim,
} from '../src/index.js';

type ExpectedRegistryEntry = {
  schema_version: 1;
  project: {
    id: string;
    lifecycle: 'DISCOVERABLE' | 'CANDIDATE' | 'REGISTERED' | 'SUSPENDED' | 'ARCHIVED';
  };
  identity: { canonical_repository: string; aliases: string[] };
  ownership: { project_owner: string };
  context: { capsule_path: string; canonical_entrypoints: string[] };
  freshness: {
    operational_state: McfContextFreshness;
    project_identity: McfContextFreshness;
  };
};

type ExpectedCapsule = {
  schema_version: 1;
  project_id: string;
  purpose: string;
  lifecycle: string;
  snapshot: {
    current_workstream: string;
    current_status: string;
    next_action: string;
    blockers: string[];
  };
  sources: { current_state: string };
  observed_at: string;
};

type ExpectedTruthClaim = {
  claim_key: string;
  type: McfContextClaimType;
  value: unknown;
  owner: string;
  source_ref: string;
  freshness: McfContextFreshness;
  observed_at?: string | undefined;
  provenance: Array<{
    source_ref: string;
    source_revision: string;
    observed_at?: string | undefined;
  }>;
  requires_live_verification: boolean;
};

describe('MCF Context Fabric contracts', () => {
  it('defines isolated truth, freshness, and recovery literals', () => {
    expectTypeOf<McfContextClaimType>().toEqualTypeOf<
      'IDENTITY' | 'NORMATIVE' | 'OPERATIONAL' | 'DERIVED'
    >();
    expectTypeOf<McfContextFreshness>().toEqualTypeOf<
      'DURABLE' | 'SNAPSHOT' | 'LIVE_REQUIRED' | 'DERIVED'
    >();
    expectTypeOf<McfContextRecoveryState>().toEqualTypeOf<
      | 'RECOVERED'
      | 'PARTIAL_RECOVERY'
      | 'AMBIGUOUS_CONTEXT'
      | 'SOURCE_UNAVAILABLE'
      | 'INVALID_CONTEXT'
      | 'DRIFT_DETECTED'
      | 'RECONCILIATION_REQUIRED'
    >();
    expectTypeOf<Extract<McfContextClaimType, 'OBSERVED'>>().toEqualTypeOf<never>();
  });

  it('represents repository-native Registry and Capsule data', () => {
    expectTypeOf<McfProjectRegistryEntry>().toEqualTypeOf<ExpectedRegistryEntry>();
    expectTypeOf<McfProjectCapsule>().toEqualTypeOf<ExpectedCapsule>();

    const registry: McfProjectRegistryEntry = {
      schema_version: 1,
      project: {
        id: 'multiagent-collaboration-framework',
        lifecycle: 'REGISTERED',
      },
      identity: {
        canonical_repository: 'leon337/multiagent-collaboration-framework',
        aliases: ['MCF'],
      },
      ownership: { project_owner: 'LEANDRO' },
      context: {
        capsule_path: '.mcf/project-capsule.yaml',
        canonical_entrypoints: ['README.md', 'docs/MCF-CURRENT-STATE.md'],
      },
      freshness: {
        operational_state: 'LIVE_REQUIRED',
        project_identity: 'DURABLE',
      },
    };
    const capsule: McfProjectCapsule = {
      schema_version: 1,
      project_id: registry.project.id,
      purpose: 'Coordinate governed multi-agent work.',
      lifecycle: 'ACTIVE',
      snapshot: {
        current_workstream: 'context-fabric',
        current_status: 'IMPLEMENTATION_AUTHORIZED',
        next_action: 'Implement CF-0 and minimal CF-1',
        blockers: [],
      },
      sources: { current_state: 'docs/MCF-CURRENT-STATE.md' },
      observed_at: '2026-08-23T00:00:00Z',
    };

    expect(capsule.project_id).toBe(registry.project.id);
  });

  it('represents normalized claims and evidence-only recovery receipts', () => {
    expectTypeOf<McfTruthClaim>().toEqualTypeOf<ExpectedTruthClaim>();
    expectTypeOf<McfContextRecoveryReceipt['evidence_only']>().toEqualTypeOf<true>();
    expectTypeOf<McfContextRecoveryReceipt['project_id']>().toEqualTypeOf<string | null>();

    const claim: McfTruthClaim = {
      claim_key: 'project.id',
      type: 'IDENTITY',
      value: 'multiagent-collaboration-framework',
      owner: 'MCF_PROJECT_REGISTRY',
      source_ref: 'context/projects/multiagent-collaboration-framework.yaml',
      freshness: 'DURABLE',
      provenance: [
        {
          source_ref: 'context/projects/multiagent-collaboration-framework.yaml',
          source_revision: 'a'.repeat(40),
        },
      ],
      requires_live_verification: false,
    };
    const receipt: McfContextRecoveryReceipt = {
      schema_version: 1,
      receipt_id: 'context-recovery-001',
      project_id: 'multiagent-collaboration-framework',
      recovery_state: 'RECOVERED',
      recovered_at: '2026-08-23T00:00:00Z',
      read_only: true,
      material_action: false,
      sources: [
        {
          role: 'REGISTRY',
          source_ref: claim.source_ref,
          source_revision: claim.provenance[0]!.source_revision,
        },
      ],
      claims: [claim],
      warnings: [],
      evidence_only: true,
    };

    expect(receipt.evidence_only).toBe(true);
  });
});
