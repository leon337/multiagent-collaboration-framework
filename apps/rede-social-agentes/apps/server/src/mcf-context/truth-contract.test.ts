import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type {
  McfContextProvenance,
  McfProjectCapsule,
  McfProjectRegistryEntry,
  McfTruthClaim,
} from '@rsa/contracts';
import { describe, expect, it } from 'vitest';

import { ContextSchemaValidator } from './context-schema.validator.js';
import {
  assessClaimFreshness,
  createDerivedTruthClaim,
  isContextClaimType,
  normalizeCapsuleClaims,
  normalizeRegistryClaims,
  reconcileTruthClaims,
} from './truth-contract.js';

const schemasDirectory = fileURLToPath(
  new URL('../../../../../../schemas/context/', import.meta.url),
);

const registry: McfProjectRegistryEntry = {
  schema_version: 1,
  project: { id: 'multiagent-collaboration-framework', lifecycle: 'REGISTERED' },
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
  project_id: 'multiagent-collaboration-framework',
  purpose: 'Governed multi-agent collaboration.',
  lifecycle: 'ACTIVE',
  snapshot: {
    current_workstream: 'context-fabric-cf0-cf1',
    current_status: 'CF0_CF1_IMPLEMENTATION_IN_PROGRESS',
    next_action: 'Complete repository-native recovery kernel',
    blockers: [],
  },
  sources: { current_state: 'docs/MCF-CURRENT-STATE.md' },
  observed_at: '2026-08-23T00:22:10-03:00',
};

const registryProvenance: McfContextProvenance = {
  source_ref: 'context/projects/multiagent-collaboration-framework.yaml',
  source_revision: 'registry-revision',
};

const capsuleProvenance: McfContextProvenance = {
  source_ref: '.mcf/project-capsule.yaml',
  source_revision: 'capsule-revision',
  observed_at: capsule.observed_at,
};

function claim(overrides: Partial<McfTruthClaim> = {}): McfTruthClaim {
  return {
    claim_key: 'project.id',
    type: 'IDENTITY',
    value: 'multiagent-collaboration-framework',
    owner: 'MCF_PROJECT_REGISTRY',
    source_ref: registryProvenance.source_ref,
    freshness: 'DURABLE',
    provenance: [registryProvenance],
    requires_live_verification: false,
    ...overrides,
  };
}

describe('Context Fabric Truth Contract policy', () => {
  it('normalizes Registry identity and policy as durable claims with provenance', () => {
    const claims = normalizeRegistryClaims(registry, registryProvenance);
    const projectIdentity = claims.find(({ claim_key }) => claim_key === 'project.id');

    expect(projectIdentity).toEqual({
      claim_key: 'project.id',
      type: 'IDENTITY',
      value: 'multiagent-collaboration-framework',
      owner: 'MCF_PROJECT_REGISTRY',
      source_ref: registryProvenance.source_ref,
      freshness: 'DURABLE',
      provenance: [registryProvenance],
      requires_live_verification: false,
    });
    expect(
      claims.find(({ claim_key }) => claim_key === 'freshness.operational_state'),
    ).toMatchObject({
      type: 'NORMATIVE',
      value: 'LIVE_REQUIRED',
      freshness: 'DURABLE',
      requires_live_verification: false,
    });

    const validator = new ContextSchemaValidator(
      join(schemasDirectory, 'truth-contract.schema.json'),
    );
    expect(claims.every((candidate) => validator.validate(candidate).valid)).toBe(true);
  });

  it('normalizes Capsule operational data as timestamped snapshot claims', () => {
    const claims = normalizeCapsuleClaims(capsule, capsuleProvenance);
    const currentStatus = claims.find(({ claim_key }) => claim_key === 'snapshot.current_status');

    expect(currentStatus).toEqual({
      claim_key: 'snapshot.current_status',
      type: 'OPERATIONAL',
      value: 'CF0_CF1_IMPLEMENTATION_IN_PROGRESS',
      owner: 'MCF_PROJECT_CAPSULE',
      source_ref: capsuleProvenance.source_ref,
      freshness: 'SNAPSHOT',
      observed_at: capsule.observed_at,
      provenance: [capsuleProvenance],
      requires_live_verification: false,
    });
    expect(
      claims
        .filter(({ type }) => type === 'OPERATIONAL')
        .every(
          ({ freshness, observed_at }) =>
            freshness === 'SNAPSHOT' && observed_at === capsule.observed_at,
        ),
    ).toBe(true);
    expect(claims.some(({ claim_key }) => claim_key === 'project.operational_lifecycle')).toBe(
      true,
    );
    expect(claims.some(({ claim_key }) => claim_key === 'project.registration_lifecycle')).toBe(
      false,
    );

    const validator = new ContextSchemaValidator(
      join(schemasDirectory, 'truth-contract.schema.json'),
    );
    expect(claims.every((candidate) => validator.validate(candidate).valid)).toBe(true);
  });

  it('requires explicit input provenance for derived values', () => {
    expect(
      createDerivedTruthClaim({
        claim_key: 'project.summary',
        value: 'MCF is active',
        owner: 'MCF_CONTEXT_FABRIC',
        source_ref: 'derived://project.summary',
        inputs: [],
      }),
    ).toEqual({
      ok: false,
      error: { code: 'PROVENANCE_REQUIRED', claim_key: 'project.summary' },
    });

    expect(
      createDerivedTruthClaim({
        claim_key: 'project.summary',
        value: 'MCF is active',
        owner: 'MCF_CONTEXT_FABRIC',
        source_ref: 'derived://project.summary',
        inputs: [claim()],
      }),
    ).toEqual({
      ok: true,
      claim: {
        claim_key: 'project.summary',
        type: 'DERIVED',
        value: 'MCF is active',
        owner: 'MCF_CONTEXT_FABRIC',
        source_ref: 'derived://project.summary',
        freshness: 'DERIVED',
        provenance: [registryProvenance],
        requires_live_verification: false,
      },
    });

    expect(
      createDerivedTruthClaim({
        claim_key: 'deployment.summary',
        value: 'healthy',
        owner: 'MCF_CONTEXT_FABRIC',
        source_ref: 'derived://deployment.summary',
        inputs: [
          claim({
            claim_key: 'deployment.health',
            type: 'OPERATIONAL',
            value: 'unknown',
            owner: 'DEPLOYMENT_PROVIDER',
            source_ref: 'provider://deployment',
            freshness: 'LIVE_REQUIRED',
            requires_live_verification: true,
          }),
        ],
      }),
    ).toEqual({
      ok: false,
      error: {
        code: 'LIVE_VERIFICATION_REQUIRED',
        claim_key: 'deployment.summary',
        input_claim_keys: ['deployment.health'],
      },
    });
  });

  it('marks LIVE_REQUIRED as unavailable without verifier input', () => {
    const liveClaim = claim({
      claim_key: 'deployment.health',
      type: 'OPERATIONAL',
      value: 'unknown',
      owner: 'DEPLOYMENT_PROVIDER',
      source_ref: 'provider://deployment',
      freshness: 'LIVE_REQUIRED',
      requires_live_verification: true,
    });

    expect(assessClaimFreshness(liveClaim)).toEqual({
      classification: 'LIVE_VERIFICATION_REQUIRED',
      reusable_for_read_only: false,
      reusable_for_material_action: false,
      requires_live_verification: true,
    });
  });

  it('uses explicit claim ownership instead of allowing latest timestamp to win', () => {
    const authoritative = claim({ observed_at: '2026-01-01T00:00:00Z' });
    const newerLowerAuthority = claim({
      type: 'OPERATIONAL',
      value: 'renamed-by-inference',
      owner: 'DISCOVERY_INFERENCE',
      source_ref: 'inference://project-id',
      freshness: 'SNAPSHOT',
      observed_at: '2026-08-23T00:22:10-03:00',
      provenance: [
        {
          source_ref: 'inference://project-id',
          source_revision: 'inference-revision',
          observed_at: '2026-08-23T00:22:10-03:00',
        },
      ],
    });

    expect(
      reconcileTruthClaims(
        [newerLowerAuthority, authoritative],
        [
          {
            claim_key: 'project.id',
            claim_type: 'IDENTITY',
            authoritative_owner: 'MCF_PROJECT_REGISTRY',
          },
        ],
      ),
    ).toMatchObject({
      outcome: 'ACCEPTED',
      accepted_claims: [authoritative],
      authority_resolutions: [
        {
          claim_key: 'project.id',
          authoritative_owner: 'MCF_PROJECT_REGISTRY',
          selected_source_ref: registryProvenance.source_ref,
          superseded_source_refs: ['inference://project-id'],
        },
      ],
    });
  });

  it('returns reconciliation metadata for unresolved authoritative conflict', () => {
    const conflicting = claim({
      value: 'different-project-id',
      source_ref: 'context/projects/conflicting.yaml',
      provenance: [
        {
          source_ref: 'context/projects/conflicting.yaml',
          source_revision: 'conflicting-revision',
        },
      ],
    });

    expect(
      reconcileTruthClaims(
        [claim(), conflicting],
        [
          {
            claim_key: 'project.id',
            claim_type: 'IDENTITY',
            authoritative_owner: 'MCF_PROJECT_REGISTRY',
          },
        ],
      ),
    ).toEqual({
      outcome: 'RECONCILIATION_REQUIRED',
      recovery_state: 'RECONCILIATION_REQUIRED',
      conflicts: [
        {
          claim_key: 'project.id',
          reason: 'AUTHORITATIVE_DISAGREEMENT',
          owners: ['MCF_PROJECT_REGISTRY'],
          source_refs: [
            'context/projects/conflicting.yaml',
            'context/projects/multiagent-collaboration-framework.yaml',
          ],
        },
      ],
    });
  });

  it('keeps Context Fabric claim vocabulary isolated from OBSERVED artifact semantics', () => {
    expect(isContextClaimType('OBSERVED')).toBe(false);
    expect(isContextClaimType('DERIVED')).toBe(true);
  });
});
