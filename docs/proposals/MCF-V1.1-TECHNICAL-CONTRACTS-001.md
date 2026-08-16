# MCF v1.1 — Technical Contracts

**ID:** `MCF-V1.1-TECHNICAL-CONTRACTS-001`  
**Status:** `PREIMPLEMENTATION_DESIGN`  
**Depends on:** `MCF-V1.1-PREIMPLEMENTATION-CONFORMANCE-001`

No implementation is authorized by this document.

## 1. Contract versioning rule

All new v1.1 project artifacts use explicit `schemaVersion`. Existing v1.0 mission contracts remain readable when v1.1 fields are absent.

Canonical artifact references use this common shape:

```ts
interface McfArtifactRef {
  artifactType: string;
  schemaVersion: string;
  projectId: string;
  revisionId: string;
  path: string;
  contentDigest: string;       // sha256:<hex>
  repository: string;
  commitSha: string | null;    // null only while LOCAL_UNCHECKPOINTED
}
```

A reference with `commitSha: null` MUST NOT be presented as remotely checkpointed.

## 2. Project Intent Package — PIP v1

Canonical path pattern:

```text
.mcf/intent/pip-<revisionId>.json
```

Contract:

```ts
type IntentDimensionState =
  | 'CLEAR'
  | 'PARTIAL'
  | 'UNKNOWN'
  | 'CONFLICTING'
  | 'NOT_APPLICABLE';

type PipLifecycle =
  | 'DISCOVERY_IN_PROGRESS'
  | 'READY_FOR_ALIGNMENT'
  | 'ALIGNED'
  | 'REOPENED_AFTER_MATERIAL_CHANGE';

type ProvenanceType =
  | 'HUMAN_DIRECT_STATEMENT'
  | 'HUMAN_CONFIRMED_SYNTHESIS'
  | 'PRIOR_VALID_HUMAN_DECISION'
  | 'MACHINE_EVIDENCE'
  | 'MACHINE_INFERENCE'
  | 'TECHNICAL_DELEGATION'
  | 'NOT_APPLICABLE_JUSTIFICATION';

interface ProvenanceRef {
  type: ProvenanceType;
  sourceRef: string;
  capturedAt: string;
  actor: string;
}

interface IntentDimensionRecord {
  state: IntentDimensionState;
  value: unknown;
  provenance: ProvenanceRef[];
  readinessImpact: 'BLOCKING' | 'NON_BLOCKING' | 'NONE';
  notes?: string[];
}

interface HumanDecisionRecord {
  decisionId: string;
  status: 'CURRENT' | 'SUPERSEDED';
  statement: string;
  supersedesDecisionId?: string;
  provenance: ProvenanceRef[];
}

interface ProjectIntentPackageV1 {
  artifactType: 'PROJECT_INTENT_PACKAGE';
  schemaVersion: '1.0';
  projectId: string;
  revisionId: string;
  lifecycle: PipLifecycle;
  methodologyPin: {
    version: string;
    immutableRef: string;
  };
  createdAt: string;
  supersedesRevisionId?: string;
  identity: {
    projectName?: string;
    repository?: string;
  };
  originalIntent: {
    text: string;
    provenance: ProvenanceRef[];
  };
  dimensions: {
    PROBLEM: IntentDimensionRecord;
    MOTIVATION: IntentDimensionRecord;
    DESIRED_OUTCOME: IntentDimensionRecord;
    TARGET_USERS: IntentDimensionRecord;
    CRITICAL_USER_JOURNEYS: IntentDimensionRecord;
    MUST_HAVE: IntentDimensionRecord;
    SHOULD_HAVE: IntentDimensionRecord;
    NON_GOALS: IntentDimensionRecord;
    PRIORITIES_AND_TRADEOFFS: IntentDimensionRecord;
    BUSINESS_RULES: IntentDimensionRecord;
    DATA_AND_SENSITIVITY: IntentDimensionRecord;
    ROLES_AND_PERMISSIONS: IntentDimensionRecord;
    AUTOMATION_LEVEL: IntentDimensionRecord;
    INTEGRATIONS: IntentDimensionRecord;
    PLATFORM_AND_USAGE_CONTEXT: IntentDimensionRecord;
    COST_AND_RESOURCE_CONSTRAINTS: IntentDimensionRecord;
    QUALITY_EXPECTATIONS: IntentDimensionRecord;
    FAILURE_TOLERANCE: IntentDimensionRecord;
    DEFINITION_OF_DONE: IntentDimensionRecord;
    FUTURE_VISION: IntentDimensionRecord;
  };
  humanDecisions: HumanDecisionRecord[];
  technicalDelegations: Array<{
    delegationId: string;
    domain: string;
    scope: string;
    provenance: ProvenanceRef[];
  }>;
  assumptions: Array<{ id: string; statement: string; provenance: ProvenanceRef[] }>;
  unknowns: Array<{ id: string; statement: string; blocking: boolean }>;
  blockers: Array<{ id: string; statement: string }>;
  conflicts: Array<{ id: string; statement: string; sourceRefs: string[] }>;
  readiness: {
    state: 'NOT_READY' | 'CONDITIONALLY_READY' | 'READY_FOR_ALIGNMENT';
    blockingUnknownIds: string[];
    assessedAt: string;
  };
  alignment: {
    status: 'NOT_ALIGNED' | 'ALIGNED' | 'REOPENED';
    receiptRef?: string;
    alignedAt?: string;
  };
  contentDigest: string;
}
```

Invariants:

```text
PIP != CHAT_LOG
PIP != MISSION_CONTRACT
ALIGNED_REVISION_IS_IMMUTABLE
MACHINE_INFERENCE_CANNOT_CREATE_HUMAN_DECISION
READY_FOR_ALIGNMENT != IMPLEMENTATION_AUTHORIZED
```

## 3. Project Reality Report — PRR v1

Canonical path pattern:

```text
.mcf/reality/prr-<revisionId>.json
```

Contract:

```ts
type RealityAssertionKind = 'FACT' | 'INFERENCE' | 'UNKNOWN' | 'CONFLICTING';

interface ProjectRealityReportV1 {
  artifactType: 'PROJECT_REALITY_REPORT';
  schemaVersion: '1.0';
  projectId: string;
  revisionId: string;
  methodologyPin: {
    version: string;
    immutableRef: string;
  };
  createdAt: string;
  baseline: {
    repository: string;
    commitSha: string;
    branch?: string;
    capturedAt: string;
  };
  observations: Array<{
    observationId: string;
    domain: string;
    statement: string;
    kind: RealityAssertionKind;
    evidenceRefs: string[];
    provenance: ProvenanceRef[];
  }>;
  unresolvedFacts: Array<{
    id: string;
    statement: string;
    evidenceNeeded: string[];
  }>;
  realityConfirmation: {
    status: 'PENDING' | 'CONFIRMED_WITH_CORRECTIONS' | 'CONFIRMED';
    confirmedAt?: string;
    correctionRefs?: string[];
  };
  contentDigest: string;
}
```

Invariants:

```text
PRR = AS_IS_ONLY
PRR != PIP
PRR != PLAN
OBSERVABLE_FACT_REQUIRES_EVIDENCE_OR_NON_FACT_CLASSIFICATION
PRR_AUTHORITY_IS_BOUND_TO_EXACT_BASELINE
```

## 4. Intent Alignment Receipt

This is a small canonical artifact, not a new runtime engine.

Canonical path:

```text
.mcf/receipts/intent-alignment-<receiptId>.json
```

```ts
interface IntentAlignmentReceiptV1 {
  artifactType: 'INTENT_ALIGNMENT_RECEIPT';
  schemaVersion: '1.0';
  receiptId: string;
  projectId: string;
  pipRef: McfArtifactRef;
  decision: 'PASS' | 'REJECTED_FOR_CORRECTION';
  humanAuthority: 'LEANDRO';
  confirmedAt: string;
  confirmationSourceRef: string;
  contentDigest: string;
}
```

A PASS receipt is valid only if its `pipRef` identifies the exact aligned PIP revision and digest.

## 5. Project entry and resume routing

```ts
type McfProjectEntryMode =
  | 'NEW_PROJECT'
  | 'ADOPT_EXISTING_PROJECT'
  | 'RESUME_MCF_PROJECT';

type McfProjectRecoveryRoute = 'RECOVER_MCF_PROJECT';

type McfResumeRoute = 'FAST_RESUME' | 'RECONCILE' | 'RECOVER_MCF_PROJECT';
```

`RECOVER_MCF_PROJECT` is a recovery route, not a fourth normal entry mode.

## 6. Additive Mission Contract v1.1 extension

The existing fields remain unchanged. Add optional metadata:

```ts
interface McfMissionContractV11Extension {
  contractSchemaVersion?: '1.1';
  projectId?: string;
  projectEntryMode?: McfProjectEntryMode;
  methodologyPin?: {
    version: string;
    immutableRef: string;
  };
  alignedPipRef?: McfArtifactRef;
  projectRealityReportRef?: McfArtifactRef;
  standingAuthorizations?: McfStandingAuthorization[];
  continuityCheckpointRef?: McfArtifactRef;
}
```

Rules:

- a v1.0 contract without these fields remains valid;
- a v1.1 product implementation mission MUST reference an aligned PIP;
- `ADOPT_EXISTING_PROJECT` with material gaps SHOULD reference a confirmed PRR and the derived Gap Map/plan references when applicable;
- Mission Contract MUST NOT inline or redefine the full PIP.

## 7. Standing Authorization contract

This extends permission/Human Delegation behavior.

```ts
interface McfStandingAuthorization {
  authorizationId: string;
  projectId: string;
  missionId?: string;
  grantedBy: 'LEANDRO';
  grantedAt: string;
  actionClasses: string[];
  environments: string[];
  maximumCost: {
    currency: string;
    amount: number;
    period?: string;
  } | null;
  reversibleOnly: boolean;
  expiresAt?: string;
  boundary?: string;
  exclusions: string[];
  evidenceRequirements: string[];
  sourceDecisionRef: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
}
```

Evaluation rule:

```text
ACTION_ALLOWED_BY_PROFILE
AND ACTION_INSIDE_STANDING_AUTHORIZATION_IF_REQUIRED
AND NOT_NON_DELEGABLE_HUMAN_GATE
```

No wildcard or omitted field may silently broaden scope.

## 8. Transferable checkpoint extension

The existing CAF checkpoint remains the primitive. Its schema must evolve compatibly by adding optional v1.1 fields while accepting legacy artifacts.

Legacy absence means `schemaVersion = 1.0` for compatibility purposes.

Proposed optional fields:

```ts
interface McfCheckpointV11Extension {
  schemaVersion?: '1.1';
  projectId?: string;
  missionId?: string;
  methodologyPin?: { version: string; immutableRef: string };
  alignedPipRef?: McfArtifactRef;
  missionContractRef?: string;
  projectRealityReportRef?: McfArtifactRef;
  pendingHumanGates?: string[];
  activeStandingAuthorizationIds?: string[];
  repositoryState?: {
    repository: string;
    branch: string;
    checkpointSha: string | null;
    capturedAt: string;
    volatile: true;
  };
  resumeRouteHint?: McfResumeRoute;
  transferability?: 'TRANSFERABLE' | 'BLOCKED_LOCAL_ONLY_STATE';
}
```

The legacy checkpoint's existing state/failure/recovery/next-action semantics are preserved.

## 9. Gap Map and Completion Plan

These MUST NOT become independent runtime authority.

Gap Map key:

```text
GAP_MAP_ID = digest(EXACT_PRR_REF + EXACT_ALIGNED_PIP_REF + analysis_version)
```

Completion/Recovery Plan MUST reference its exact Gap Map and remains `WORKING_PROPOSED_ARTIFACT` until applicable human decisions/Mission Contract create execution authority.

## 10. Runtime event extensions

Prefer the existing event ledger. Candidate additive events:

```text
PROJECT_ENTRY_CLASSIFIED
PIP_REVISION_CREATED
PIP_READY_FOR_ALIGNMENT
INTENT_ALIGNMENT_RECORDED
PIP_REOPENED
PRR_REVISION_CREATED
REALITY_CONFIRMATION_RECORDED
RESUME_ROUTE_SELECTED
STANDING_AUTHORIZATION_APPLIED
STANDING_AUTHORIZATION_DENIED
```

Pre-mission artifacts need not be forced into `mcf_events`, because current events are mission-bound. When a mission exists, relevant artifact references may be emitted into the existing ledger.

## 11. Skill mapping

- `MCF-START-MISSION`: extend to require/validate applicable v1.1 project context before creating an implementation mission.
- `MCF-RECOVER-CONTEXT`: extend source resolution to PIP, PRR, transferable checkpoint, standing authorization and live state; return `FAST_RESUME`, `RECONCILE` or `RECOVER_MCF_PROJECT`.
- `MCF-DEFINE-PRODUCT`: reuse as part of Human Intent Discovery; output becomes input to PIP synthesis rather than an independent source of human authority.
- `MCF-TRACE-MISSION`: extend trace output to include authoritative project artifact references and methodology pin.
- other domain skills remain unchanged unless their contract actually needs new project-context inputs.

## 12. Technical contract verdict

```yaml
pip_schema: DEFINED
prr_schema: DEFINED
alignment_receipt: DEFINED
mission_contract_extension: DEFINED
standing_authorization: DEFINED
checkpoint_extension: DEFINED
entry_and_resume_types: DEFINED
runtime_event_strategy: EXTEND_EXISTING_LEDGER
implementation_authorized: false
```
