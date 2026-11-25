# MCF — Capability Gap Analysis and Project Bootstrap Planning

**Status:** implementation in PR draft  
**Mode:** read-only, evidence-only, plan-only  
**External side effects:** none

## 1. Purpose

A mission should not begin implementation while assuming that a required provider, credential, permission, runtime or operation exists. This feature compares explicit project requirements with the MCF Capability Registry and turns the result into a deterministic bootstrap task graph.

It does not mutate the registry, authorize capabilities, connect accounts, provision infrastructure, write repositories or deploy software.

## 2. New skills

### MCF-CAPABILITY-GAP-ANALYSIS
- Provider: mcf-context
- Resource: capability-registry
- Operation: analyze-gaps
- Permission profile: READ_ONLY
- Input: project_id, requirements, optional live_verifications
- Output: readiness report with READY, MISSING, BLOCKED or NEEDS_VERIFICATION per requirement.

### MCF-PROJECT-BOOTSTRAP
- Provider: mcf-context
- Resource: project-bootstrap
- Operation: build-plan
- Permission profile: READ_ONLY
- Input: project identity, objective, environment, capability requirements and explicit cost/action/production flags.
- Output: deterministic dependency graph for discovery, gap analysis, design, provisioning, implementation, local validation, security review, E2E, release, deployment and closeout.
- `execution_started` is always false. The planner never starts a task.

## 3. Gap analysis rules

Each requirement is checked against:
- capability registration and provider project;
- implementation state;
- allowed and prohibited operations;
- environment and resource scope;
- READ_ONLY vs BOUNDED_WRITE mode;
- authorization state and expiration;
- runtime state;
- live connection, runtime and verification evidence;
- evidence freshness.

A registry entry with `freshness: LIVE_REQUIRED` does not become READY from a historical registry snapshot alone. The caller must provide a current live verification record. The default maximum age is 300 seconds; callers can set a narrower or wider bounded value per requirement.

Missing capabilities are distinguished from blocked capabilities and from capabilities that merely need live verification.

## 4. Bootstrap planner rules

- Local design, implementation and local tests may proceed independently of external provisioning.
- Provisioning is skipped unless the project explicitly requires `mcf.google.cloud.provision`.
- External provisioning is blocked unless `external_actions_authorized=true`.
- Paid prerequisites are blocked unless both `paid_services_required=true` and `allow_paid_services=true`.
- Production deployment is skipped by default. If requested, it is blocked until `production_authorized=true` and release readiness is satisfied.
- A missing, blocked or unverified required capability blocks E2E and release tasks.
- The closeout task remains blocked while release or deployment has unresolved gates.

## 5. API

Both endpoints are protected by the MCF context read token:

- POST `/v1/mcf/context/capability-gaps`
- POST `/v1/mcf/context/project-bootstrap-plan`

The request validator rejects unknown fields, duplicate capability requirements, invalid IDs, malformed operations, invalid environments and unbounded arrays. Authorization flags default to false. The endpoint does not accept credential values or arbitrary execution instructions.

## 6. Runtime integration

The MissionRuntime adapter `McfContextAnalysisAdapter` calls `McfCapabilityRegistryApiService` in-process and creates a signed receipt. `PermissionEngine` permits only the two exact read-only skill/provider/resource/operation combinations. `EvidenceValidator` independently validates:
- report/plan project binding;
- summary counts;
- task IDs and dependency references;
- plan-only flags;
- external-action, billing and production gates.

No generic provider write is exposed through these skills.

## 7. Current Google provisioning capability state

The new registry entry `mcf.google.cloud.provision` is intentionally `DECLARED`, `DISCONNECTED`, `INACTIVE`, `NOT_VERIFIED` and `NOT_AUTHORIZED` until the PR is merged, ADC is configured under the correct account, Terms of Service are accepted by the account owner, and live provider checks pass.

This is the truthful state. The presence of code and tests is not proof of live connectivity or authorization.
