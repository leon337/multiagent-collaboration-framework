export type McfContextClaimType = 'IDENTITY' | 'NORMATIVE' | 'OPERATIONAL' | 'DERIVED';

export type McfContextFreshness = 'DURABLE' | 'SNAPSHOT' | 'LIVE_REQUIRED' | 'DERIVED';

export type McfContextRecoveryState =
  | 'RECOVERED'
  | 'PARTIAL_RECOVERY'
  | 'AMBIGUOUS_CONTEXT'
  | 'SOURCE_UNAVAILABLE'
  | 'INVALID_CONTEXT'
  | 'DRIFT_DETECTED'
  | 'RECONCILIATION_REQUIRED';

export type McfProjectLifecycle =
  'DISCOVERABLE' | 'CANDIDATE' | 'REGISTERED' | 'SUSPENDED' | 'ARCHIVED';

export interface McfProjectRegistryEntry {
  schema_version: 1;
  project: {
    id: string;
    lifecycle: McfProjectLifecycle;
  };
  identity: {
    canonical_repository: string;
    aliases: string[];
  };
  ownership: {
    project_owner: string;
  };
  context: {
    capsule_path: string;
    canonical_entrypoints: string[];
  };
  freshness: {
    operational_state: McfContextFreshness;
    project_identity: McfContextFreshness;
  };
}

export interface McfProjectCapsule {
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
  sources: {
    current_state: string;
  };
  observed_at: string;
}

export interface McfContextProvenance {
  source_ref: string;
  source_revision: string;
  observed_at?: string | undefined;
}

export interface McfTruthClaim {
  claim_key: string;
  type: McfContextClaimType;
  value: unknown;
  owner: string;
  source_ref: string;
  freshness: McfContextFreshness;
  observed_at?: string | undefined;
  provenance: McfContextProvenance[];
  requires_live_verification: boolean;
}

export type McfContextSourceRole = 'REGISTRY' | 'CAPSULE' | 'LIVE_VERIFICATION';

export interface McfContextSourceEvidence {
  role: McfContextSourceRole;
  source_ref: string;
  source_revision: string;
  observed_at?: string | undefined;
}

export interface McfContextRecoveryReceipt {
  schema_version: 1;
  receipt_id: string;
  project_id: string | null;
  recovery_state: McfContextRecoveryState;
  recovered_at: string;
  read_only: boolean;
  material_action: boolean;
  sources: McfContextSourceEvidence[];
  claims: McfTruthClaim[];
  warnings: string[];
  evidence_only: true;
}
