export interface McfCloudContextSourceDigest {
  path: string;
  sha256: string;
}

export interface McfCloudContextProviderResponse {
  protocol: 'MCF_CLOUD_CONTEXT_READ_RESULT_V1';
  request_id: string;
  project_id: 'cloud-infrastructure';
  operation: 'context.get';
  status: 'PASS';
  result: Record<string, unknown>;
  error: null;
  freshness: {
    observed_at: string;
    operational_state: 'LIVE_REQUIRED';
    workspace_observation: 'LIVE_LOCAL_DISPOSABLE';
    source_mode: 'READ_AT_REQUEST_TIME';
  };
  provenance: {
    repository: 'leon337/cloud-infrastructure';
    adapter_config: 'platform/control-bridge/mcf-cloud-context-read-config.yaml';
    sources: McfCloudContextSourceDigest[];
  };
}

export interface McfCloudContextReadReceipt {
  schema_version: 1;
  read_only: true;
  material_action: false;
  provider_payload_persisted_by_mcf: false;
  evidence_only: true;
  provider_response: McfCloudContextProviderResponse;
}
