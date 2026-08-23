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
