# MCF — Google Cloud Provisioning Governed by MissionRuntime

**Status:** experimental implementation on PR #583; disabled by default  
**Branch:** feat/mcf-governed-google-cloud-provisioning-20261125  
**Scope:** project creation, Maps API enablement, restricted server key, local secret storage  
**Billing:** read-only verification only; no billing mutations

## 1. Intent

The Google Bridge read skill remains read-only. This document defines a separate provisioning skill with a much narrower write boundary. The capability exists to remove manual setup steps from MCF project missions without turning a local Google token into unrestricted cloud administration.

## 2. Runtime contract

- Skill: MCF-GOOGLE-CLOUD-PROVISION
- Permission profile: HUMAN_GATE
- Provider: mcf-google-bridge
- Resource: google-cloud
- Operations:
  - create-project → google.cloud.projects.create
  - enable-maps-apis → google.cloud.services.enableMaps
  - create-maps-key → google.cloud.apiKeys.createMaps
  - inspect-maps-key → google.cloud.apiKeys.inspectMaps

Required input assertions:
- projectId matches the MCF project ID allowlist pattern and equals approvedProjectId.
- missionId is a stable MCF mission slug.
- humanGateApproved, authorizedScope and sensitiveAuthorization are true.
- cloudAccountVerified and cloudTermsAccepted are true.
- displayName is bounded and required for create-project.

PermissionEngine checks these conditions before dispatch. The runtime adapter forwards only fixed, typed fields; it does not forward arbitrary agent input.

## 3. Provider behavior

### Project
- Uses Cloud Resource Manager v3.
- Project ID is deterministic and must be MCF-managed.
- Adds mcf_managed=true and mcf_mission labels.
- Existing projects are reused only when both ownership labels match.
- A project ID collision without matching labels is never adopted.
- No parent folder, organization, billing account or IAM binding is selected automatically.

### Billing guard
- Uses Cloud Billing API GET projects/{projectId}/billingInfo.
- Requires billingEnabled=false and no billingAccountName.
- If the API or permission is unavailable, the result is PENDING/UNKNOWN; provisioning does not continue.
- If billing is active or linked, the operation is BLOCKED.
- No billing link, unlink, account creation, payment method, or paid plan operation exists in this skill.

### APIs
Only these services can be enabled by the fixed operation:
- geocoding-backend.googleapis.com
- routes.googleapis.com
- apikeys.googleapis.com

No caller-supplied service list is accepted.

### API key
- Deterministic key ID: mcf-obras-maps-v1.
- API restrictions: Geocoding API and Routes API only.
- No arbitrary API targets or unrestricted key option.
- Application/IP restriction is not yet configured because the notebook egress IP has not been verified as stable; this is a production hardening gate.
- The key is server-side only.

### Secret storage
- Fixed path: ~/.config/agente-logistica-obras/google_maps_api_key.
- Parent directory mode: 0700.
- File mode: 0600.
- Owner must match the service process; symlinks and insecure files are rejected.
- Existing different secret is never overwritten.
- The raw key string is never returned to the runtime, tool output, logs, ledger or receipt.
- Receipt contains only a logical alias and SHA-256 fingerprint.

## 4. Transport and identity

Mutating operations are intentionally not registered in generic MCP stdio because that surface does not carry a verified MCF mission identity. They are exposed only through the loopback HTTP bridge and called by GoogleCloudProvisionAdapter from the MissionRuntime.

Both flags are required:
- MCF_GOOGLE_CLOUD_PROVISION_ENABLED=true on the local Bridge service.
- MCF_GOOGLE_CLOUD_PROVISION_RUNTIME_ENABLED=true on the co-located MissionRuntime.

Both remain false/unset by default. Do not expose port 8755 publicly, through tunnels, reverse proxies or remote localhost forwarding.

Cloud operations use Google ADC with cloud-platform scope, separate from Workspace OAuth scopes. The recommended ADC flow requires Google Cloud CLI and interactive user consent. No OAuth token is copied from Drive/Gmail/Calendar scopes.

## 5. Idempotency and recovery

- Project ID and API key ID are deterministic.
- Before create, the Bridge checks the resource by ID and validates MCF ownership labels/restrictions.
- API enablement is reconciled by checking service state before mutation.
- Existing key restrictions must match exactly; the Bridge never silently broadens or rewrites them.
- Timeouts, pending long-running operations and malformed post-write responses produce PARTIAL/UNKNOWN receipts with reconciliationRequired=true.
- The runtime must not blindly retry an UNKNOWN write. It must inspect the deterministic resource and verify ownership, billing state and restrictions first.

## 6. Validation

Bridge package:
- Node tests cover allowlists, ownership labels, idempotency, fixed Maps services, API restrictions, secret redaction, file permissions, billing guard, HTTP authentication and MCP stdio exclusion.
- Syntax checks include cloud-provisioning.mjs.

MissionRuntime:
- Adapter tests cover exact skill/provider/resource/operation, disabled-by-default behavior, project/account/terms/scope gates, safe receipts, billing guard, invalid key restrictions and ambiguous network outcomes.
- PermissionEngine tests cover approved project scope and billing/IAM denial.
- EvidenceValidator independently checks project number, billing status, enabled API allowlist, exact API key resource/restrictions, secret alias and fingerprint.

## 7. Known gates

- Correct Google account identity must be verified in the browser before provisioning.
- Google Cloud Console Terms of Service must be accepted by the account owner; automation must not accept legal terms on the user's behalf.
- ADC cloud-platform consent must be granted interactively.
- Cloud Billing API read permission must be available to verify no billing account is linked.
- Maps application/IP restriction must be completed when egress is stable.
- A live E2E in the authorized host is required before marking this capability production-ready.

## 8. Non-goals

This capability does not create OAuth clients, service accounts, service-account keys, IAM roles, billing accounts, billing links, production deployments, public endpoints, or customer messages. Those are separate skills and authorization boundaries.
