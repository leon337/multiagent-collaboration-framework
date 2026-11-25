import type { McfContextFreshness, McfContextProvenance } from './mcf-context.js';

export type McfCapabilityMode = 'READ_ONLY' | 'BOUNDED_WRITE';
export type McfCapabilityImplementationState = 'DECLARED' | 'IMPLEMENTED';
export type McfCapabilityConnectionState = 'DISCONNECTED' | 'CONNECTED';
export type McfCapabilityAuthorizationState = 'NOT_AUTHORIZED' | 'AUTHORIZED';
export type McfCapabilityRuntimeState = 'UNKNOWN' | 'INACTIVE' | 'ACTIVE' | 'BLOCKED';
export type McfCapabilityVerificationState = 'NOT_VERIFIED' | 'HISTORICALLY_VERIFIED' | 'VERIFIED';

export interface McfCapabilityRegistryEntry {
  schema_version: 1;
  capability: {
    id: string;
    provider_project_id: string;
    consumer_project_ids: string[];
    mode: McfCapabilityMode;
  };
  contract: {
    protocol: string;
    allowed_operations: string[];
    prohibited_operations: string[];
  };
  scope: {
    environments: Array<'dev' | 'lab' | 'staging'>;
    resources: string[];
  };
  governance: {
    authorization_state: McfCapabilityAuthorizationState;
    required_gate: string | null;
    expiration: string | null;
  };
  lifecycle: {
    implementation_state: McfCapabilityImplementationState;
    connection_state: McfCapabilityConnectionState;
    runtime_state: McfCapabilityRuntimeState;
    verification_state: McfCapabilityVerificationState;
    last_verified_at: string | null;
  };
  evidence: McfContextProvenance[];
  freshness: McfContextFreshness;
}

export interface McfCapabilityRegistrySnapshot {
  schema_version: 1;
  retrieved_at: string;
  project_id: string | null;
  read_only: true;
  evidence_only: true;
  entries: McfCapabilityRegistryEntry[];
  sources: McfContextProvenance[];
}


export type McfCapabilityGapStatus = 'READY' | 'MISSING' | 'BLOCKED' | 'NEEDS_VERIFICATION';

export type McfCapabilityGapCode =
  | 'CAPABILITY_NOT_REGISTERED'
  | 'IMPLEMENTATION_NOT_READY'
  | 'CONNECTION_NOT_READY'
  | 'AUTHORIZATION_REQUIRED'
  | 'AUTHORIZATION_EXPIRED'
  | 'RUNTIME_NOT_READY'
  | 'RUNTIME_BLOCKED'
  | 'OPERATION_NOT_ALLOWED'
  | 'OPERATION_PROHIBITED'
  | 'ENVIRONMENT_OUT_OF_SCOPE'
  | 'RESOURCE_OUT_OF_SCOPE'
  | 'MODE_INSUFFICIENT'
  | 'LIVE_VERIFICATION_REQUIRED'
  | 'LIVE_VERIFICATION_STALE'
  | 'LIVE_CONNECTION_NOT_READY'
  | 'LIVE_RUNTIME_NOT_READY'
  | 'LIVE_VERIFICATION_NOT_CONFIRMED';

export interface McfCapabilityGapRequirement {
  capability_id: string;
  required_operations?: string[];
  environment?: 'dev' | 'lab' | 'staging';
  resource?: string;
  mode?: McfCapabilityMode;
  require_live_verification?: boolean;
  max_verification_age_seconds?: number;
}

export interface McfCapabilityLiveVerification {
  capability_id: string;
  connection_state: McfCapabilityConnectionState;
  runtime_state: McfCapabilityRuntimeState;
  verification_state: McfCapabilityVerificationState;
  observed_at: string;
  source_ref: string;
}

export interface McfCapabilityGap {
  code: McfCapabilityGapCode;
  blocking: boolean;
  recommended_action: string;
  required_gate: string | null;
}

export interface McfCapabilityGapItem {
  capability_id: string;
  status: McfCapabilityGapStatus;
  gaps: McfCapabilityGap[];
  provider_project_id: string | null;
  mode: McfCapabilityMode | null;
  allowed_operations: string[];
  source_refs: string[];
}

export interface McfCapabilityGapRequest {
  project_id: string;
  requirements: McfCapabilityGapRequirement[];
  live_verifications?: McfCapabilityLiveVerification[];
}

export interface McfCapabilityGapReport {
  schema_version: 1;
  analyzed_at: string;
  project_id: string;
  read_only: true;
  evidence_only: true;
  summary: {
    total: number;
    ready: number;
    missing: number;
    blocked: number;
    needs_verification: number;
  };
  requirements: McfCapabilityGapItem[];
}

export interface McfProjectBootstrapRequest extends McfCapabilityGapRequest {
  project_name: string;
  objective: string;
  environment: 'dev' | 'lab' | 'staging';
  paid_services_required?: boolean;
  allow_paid_services?: boolean;
  external_actions_authorized?: boolean;
  production_requested?: boolean;
  production_authorized?: boolean;
}

export interface McfProjectBootstrapTask {
  id: string;
  phase: 'DISCOVERY' | 'GAP_ANALYSIS' | 'DESIGN' | 'PROVISIONING' | 'IMPLEMENTATION' | 'VALIDATION' | 'RELEASE' | 'DEPLOYMENT' | 'CLOSEOUT';
  skill_id: string;
  depends_on: string[];
  status: 'READY' | 'BLOCKED' | 'SKIPPED';
  gate: string | null;
  exit_criteria: string[];
  rationale: string;
}

export interface McfProjectBootstrapPlan {
  schema_version: 1;
  generated_at: string;
  project_id: string;
  project_name: string;
  objective: string;
  environment: 'dev' | 'lab' | 'staging';
  read_only: true;
  evidence_only: true;
  execution_started: false;
  summary: {
    total_tasks: number;
    ready: number;
    blocked: number;
    skipped: number;
    requires_human_gates: number;
  };
  capability_gaps: McfCapabilityGapReport;
  tasks: McfProjectBootstrapTask[];
}
