import { isDeepStrictEqual } from 'node:util';

import type {
  McfContextClaimType,
  McfContextFreshness,
  McfContextProvenance,
  McfProjectCapsule,
  McfProjectRegistryEntry,
  McfTruthClaim,
} from '@rsa/contracts';

const CONTEXT_CLAIM_TYPES: readonly McfContextClaimType[] = [
  'IDENTITY',
  'NORMATIVE',
  'OPERATIONAL',
  'DERIVED',
];

export interface ClaimFreshnessAssessment {
  classification:
    'DURABLE_REUSABLE' | 'SNAPSHOT_ONLY' | 'LIVE_VERIFICATION_REQUIRED' | 'DERIVED_RECOMPUTABLE';
  reusable_for_read_only: boolean;
  reusable_for_material_action: boolean;
  requires_live_verification: boolean;
}

export interface DerivedTruthClaimInput {
  claim_key: string;
  value: unknown;
  owner: string;
  source_ref: string;
  inputs: readonly McfTruthClaim[];
}

export type DerivedTruthClaimResult =
  | { ok: true; claim: McfTruthClaim }
  | {
      ok: false;
      error: { code: 'PROVENANCE_REQUIRED'; claim_key: string };
    }
  | {
      ok: false;
      error: {
        code: 'LIVE_VERIFICATION_REQUIRED';
        claim_key: string;
        input_claim_keys: string[];
      };
    };

export interface ClaimAuthorityRule {
  claim_key: string;
  claim_type: McfContextClaimType;
  authoritative_owner: string;
}

export type TruthConflictReason =
  | 'NO_APPLICABLE_AUTHORITY'
  | 'AMBIGUOUS_AUTHORITY_RULE'
  | 'AUTHORITATIVE_SOURCE_MISSING'
  | 'AUTHORITATIVE_DISAGREEMENT';

export type TruthReconciliationResult =
  | {
      outcome: 'ACCEPTED';
      accepted_claims: McfTruthClaim[];
      authority_resolutions: Array<{
        claim_key: string;
        authoritative_owner: string;
        selected_source_ref: string;
        superseded_source_refs: string[];
      }>;
    }
  | {
      outcome: 'RECONCILIATION_REQUIRED';
      recovery_state: 'RECONCILIATION_REQUIRED';
      conflicts: Array<{
        claim_key: string;
        reason: TruthConflictReason;
        owners: string[];
        source_refs: string[];
      }>;
    };

function compareText(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function cloneProvenance(provenance: McfContextProvenance): McfContextProvenance {
  return {
    source_ref: provenance.source_ref,
    source_revision: provenance.source_revision,
    ...(provenance.observed_at === undefined ? {} : { observed_at: provenance.observed_at }),
  };
}

function createClaim(options: {
  claimKey: string;
  type: McfContextClaimType;
  value: unknown;
  owner: string;
  freshness: McfContextFreshness;
  provenance: McfContextProvenance;
  observedAt?: string;
}): McfTruthClaim {
  return {
    claim_key: options.claimKey,
    type: options.type,
    value: options.value,
    owner: options.owner,
    source_ref: options.provenance.source_ref,
    freshness: options.freshness,
    ...(options.observedAt === undefined ? {} : { observed_at: options.observedAt }),
    provenance: [cloneProvenance(options.provenance)],
    requires_live_verification: options.freshness === 'LIVE_REQUIRED',
  };
}

function createRegistryClaim(
  claimKey: string,
  type: 'IDENTITY' | 'NORMATIVE',
  value: unknown,
  provenance: McfContextProvenance,
): McfTruthClaim {
  return createClaim({
    claimKey,
    type,
    value,
    owner: 'MCF_PROJECT_REGISTRY',
    freshness: 'DURABLE',
    provenance,
  });
}

function createCapsuleDurableClaim(
  claimKey: string,
  type: 'IDENTITY' | 'NORMATIVE',
  value: unknown,
  provenance: McfContextProvenance,
): McfTruthClaim {
  return createClaim({
    claimKey,
    type,
    value,
    owner: 'MCF_PROJECT_CAPSULE',
    freshness: 'DURABLE',
    provenance,
  });
}

function createCapsuleSnapshotClaim(
  claimKey: string,
  value: unknown,
  capsule: McfProjectCapsule,
  provenance: McfContextProvenance,
): McfTruthClaim {
  return createClaim({
    claimKey,
    type: 'OPERATIONAL',
    value,
    owner: 'MCF_PROJECT_CAPSULE',
    freshness: 'SNAPSHOT',
    provenance,
    observedAt: capsule.observed_at,
  });
}

export function isContextClaimType(value: unknown): value is McfContextClaimType {
  return typeof value === 'string' && CONTEXT_CLAIM_TYPES.includes(value as McfContextClaimType);
}

export function normalizeRegistryClaims(
  registry: McfProjectRegistryEntry,
  provenance: McfContextProvenance,
): McfTruthClaim[] {
  return [
    createRegistryClaim('project.id', 'IDENTITY', registry.project.id, provenance),
    createRegistryClaim(
      'project.registration_lifecycle',
      'NORMATIVE',
      registry.project.lifecycle,
      provenance,
    ),
    createRegistryClaim(
      'identity.canonical_repository',
      'IDENTITY',
      registry.identity.canonical_repository,
      provenance,
    ),
    createRegistryClaim('identity.aliases', 'IDENTITY', [...registry.identity.aliases], provenance),
    createRegistryClaim(
      'ownership.project_owner',
      'NORMATIVE',
      registry.ownership.project_owner,
      provenance,
    ),
    createRegistryClaim(
      'context.capsule_path',
      'NORMATIVE',
      registry.context.capsule_path,
      provenance,
    ),
    createRegistryClaim(
      'context.canonical_entrypoints',
      'NORMATIVE',
      [...registry.context.canonical_entrypoints],
      provenance,
    ),
    createRegistryClaim(
      'freshness.operational_state',
      'NORMATIVE',
      registry.freshness.operational_state,
      provenance,
    ),
    createRegistryClaim(
      'freshness.project_identity',
      'NORMATIVE',
      registry.freshness.project_identity,
      provenance,
    ),
  ];
}

export function normalizeCapsuleClaims(
  capsule: McfProjectCapsule,
  provenance: McfContextProvenance,
): McfTruthClaim[] {
  return [
    createCapsuleDurableClaim('project.id', 'IDENTITY', capsule.project_id, provenance),
    createCapsuleDurableClaim('project.purpose', 'NORMATIVE', capsule.purpose, provenance),
    createCapsuleDurableClaim(
      'sources.current_state',
      'NORMATIVE',
      capsule.sources.current_state,
      provenance,
    ),
    createCapsuleSnapshotClaim(
      'project.operational_lifecycle',
      capsule.lifecycle,
      capsule,
      provenance,
    ),
    createCapsuleSnapshotClaim(
      'snapshot.current_workstream',
      capsule.snapshot.current_workstream,
      capsule,
      provenance,
    ),
    createCapsuleSnapshotClaim(
      'snapshot.current_status',
      capsule.snapshot.current_status,
      capsule,
      provenance,
    ),
    createCapsuleSnapshotClaim(
      'snapshot.next_action',
      capsule.snapshot.next_action,
      capsule,
      provenance,
    ),
    createCapsuleSnapshotClaim(
      'snapshot.blockers',
      [...capsule.snapshot.blockers],
      capsule,
      provenance,
    ),
  ];
}

export function assessClaimFreshness(claim: McfTruthClaim): ClaimFreshnessAssessment {
  switch (claim.freshness) {
    case 'DURABLE':
      return {
        classification: 'DURABLE_REUSABLE',
        reusable_for_read_only: true,
        reusable_for_material_action: true,
        requires_live_verification: false,
      };
    case 'SNAPSHOT':
      return {
        classification: 'SNAPSHOT_ONLY',
        reusable_for_read_only: true,
        reusable_for_material_action: false,
        requires_live_verification: false,
      };
    case 'LIVE_REQUIRED':
      return {
        classification: 'LIVE_VERIFICATION_REQUIRED',
        reusable_for_read_only: false,
        reusable_for_material_action: false,
        requires_live_verification: true,
      };
    case 'DERIVED':
      return {
        classification: 'DERIVED_RECOMPUTABLE',
        reusable_for_read_only: true,
        reusable_for_material_action: false,
        requires_live_verification: false,
      };
  }
}

export function createDerivedTruthClaim(input: DerivedTruthClaimInput): DerivedTruthClaimResult {
  const unverifiedLiveInputs = [
    ...new Set(
      input.inputs
        .filter((claim) => assessClaimFreshness(claim).requires_live_verification)
        .map(({ claim_key }) => claim_key),
    ),
  ].toSorted(compareText);
  if (unverifiedLiveInputs.length > 0) {
    return {
      ok: false,
      error: {
        code: 'LIVE_VERIFICATION_REQUIRED',
        claim_key: input.claim_key,
        input_claim_keys: unverifiedLiveInputs,
      },
    };
  }

  const provenanceByKey = new Map<string, McfContextProvenance>();
  for (const claim of input.inputs) {
    for (const provenance of claim.provenance) {
      const key = JSON.stringify([
        provenance.source_ref,
        provenance.source_revision,
        provenance.observed_at ?? null,
      ]);
      provenanceByKey.set(key, cloneProvenance(provenance));
    }
  }

  const provenance = [...provenanceByKey.entries()]
    .toSorted(([left], [right]) => compareText(left, right))
    .map(([, value]) => value);
  if (provenance.length === 0) {
    return {
      ok: false,
      error: { code: 'PROVENANCE_REQUIRED', claim_key: input.claim_key },
    };
  }

  return {
    ok: true,
    claim: {
      claim_key: input.claim_key,
      type: 'DERIVED',
      value: input.value,
      owner: input.owner,
      source_ref: input.source_ref,
      freshness: 'DERIVED',
      provenance,
      requires_live_verification: false,
    },
  };
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;

  return `{${Object.entries(value)
    .toSorted(([left], [right]) => compareText(left, right))
    .map(([key, child]) => `${JSON.stringify(key)}:${canonicalJson(child)}`)
    .join(',')}}`;
}

function compareClaims(left: McfTruthClaim, right: McfTruthClaim): number {
  const comparisonPairs: Array<readonly [string, string]> = [
    [left.claim_key, right.claim_key],
    [left.owner, right.owner],
    [left.source_ref, right.source_ref],
    [canonicalJson(left.value), canonicalJson(right.value)],
  ];
  for (const [leftValue, rightValue] of comparisonPairs) {
    const order = compareText(leftValue, rightValue);
    if (order !== 0) return order;
  }
  return 0;
}

function conflictMetadata(
  claimKey: string,
  reason: TruthConflictReason,
  claims: readonly McfTruthClaim[],
): {
  claim_key: string;
  reason: TruthConflictReason;
  owners: string[];
  source_refs: string[];
} {
  return {
    claim_key: claimKey,
    reason,
    owners: [...new Set(claims.map(({ owner }) => owner))].toSorted(compareText),
    source_refs: [...new Set(claims.map(({ source_ref }) => source_ref))].toSorted(compareText),
  };
}

export function reconcileTruthClaims(
  claims: readonly McfTruthClaim[],
  authorityRules: readonly ClaimAuthorityRule[],
): TruthReconciliationResult {
  const claimsByKey = new Map<string, McfTruthClaim[]>();
  for (const claim of claims) {
    const group = claimsByKey.get(claim.claim_key) ?? [];
    group.push(claim);
    claimsByKey.set(claim.claim_key, group);
  }

  const acceptedClaims: McfTruthClaim[] = [];
  const authorityResolutions: Array<{
    claim_key: string;
    authoritative_owner: string;
    selected_source_ref: string;
    superseded_source_refs: string[];
  }> = [];
  const conflicts: Array<{
    claim_key: string;
    reason: TruthConflictReason;
    owners: string[];
    source_refs: string[];
  }> = [];

  for (const claimKey of [...claimsByKey.keys()].toSorted(compareText)) {
    const group = (claimsByKey.get(claimKey) ?? []).toSorted(compareClaims);
    const first = group[0];
    if (!first) continue;
    if (group.every(({ value }) => isDeepStrictEqual(value, first.value))) {
      acceptedClaims.push(...group);
      continue;
    }

    const applicableRules = authorityRules.filter((rule) => rule.claim_key === claimKey);
    if (applicableRules.length !== 1) {
      conflicts.push(
        conflictMetadata(
          claimKey,
          applicableRules.length === 0 ? 'NO_APPLICABLE_AUTHORITY' : 'AMBIGUOUS_AUTHORITY_RULE',
          group,
        ),
      );
      continue;
    }

    const rule = applicableRules[0];
    if (!rule) continue;
    const authoritative = group.filter(
      ({ owner, type }) => owner === rule.authoritative_owner && type === rule.claim_type,
    );
    const authoritativeFirst = authoritative[0];
    if (!authoritativeFirst) {
      conflicts.push(conflictMetadata(claimKey, 'AUTHORITATIVE_SOURCE_MISSING', group));
      continue;
    }
    if (!authoritative.every(({ value }) => isDeepStrictEqual(value, authoritativeFirst.value))) {
      conflicts.push(conflictMetadata(claimKey, 'AUTHORITATIVE_DISAGREEMENT', group));
      continue;
    }

    acceptedClaims.push(...authoritative);
    authorityResolutions.push({
      claim_key: claimKey,
      authoritative_owner: rule.authoritative_owner,
      selected_source_ref: authoritativeFirst.source_ref,
      superseded_source_refs: [
        ...new Set(
          group
            .filter((candidate) => !authoritative.includes(candidate))
            .map(({ source_ref }) => source_ref),
        ),
      ].toSorted(compareText),
    });
  }

  if (conflicts.length > 0) {
    return {
      outcome: 'RECONCILIATION_REQUIRED',
      recovery_state: 'RECONCILIATION_REQUIRED',
      conflicts,
    };
  }

  return {
    outcome: 'ACCEPTED',
    accepted_claims: acceptedClaims.toSorted(compareClaims),
    authority_resolutions: authorityResolutions.toSorted((left, right) =>
      compareText(left.claim_key, right.claim_key),
    ),
  };
}
