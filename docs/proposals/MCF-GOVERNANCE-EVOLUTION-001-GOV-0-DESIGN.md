# MCF-GOVERNANCE-EVOLUTION-001 — GOV-0 Design

**Status:** `DESIGN_ONLY — AUTHORIZED_BY_LEANDRO — NOT_CURRENT — NOT_IMPLEMENTATION_AUTHORIZED`  
**Parent proposal:** `MCF-GOVERNANCE-EVOLUTION-001.md`  
**Reaudit input:** `MCF-GOVERNANCE-EVOLUTION-001-V2-REAUDIT-SYNTHESIS.md`  
**Audited v2 SHA:** `4e4132a1041707840b4aab369d81f95a1f89899b`  
**Original baseline:** `main@5d79f488407c77f7b9f21ecfefb41ddfb3a52aef`  
**Phase:** `GOV-0 — Baseline, Audit Synthesis & Concurrency Reality`

> GOV-0 defines how an MCF governance-evolution mission establishes a trustworthy starting picture before later design, implementation or integration. It does not create runtime behavior, schemas, permissions, recovery engines or provider enforcement.

---

## 1. Objective

GOV-0 must produce one explicit, auditable baseline package that answers:

1. which repository and `main` SHA were observed;
2. which proposal/mission SHA is being evaluated;
3. which blockers, concurrent missions and provider facts are relevant;
4. which sources are immutable evidence and which are volatile observations;
5. where material human decisions are durably captured;
6. what happens when two missions share the same baseline and no objective integration precedence exists.

GOV-0 is analogous to freezing the parts list and work orders before an assembly line changes tooling: the team may continue designing, but nobody may pretend that yesterday's inventory is today's verified state.

---

## 2. Source precedence contract

GOV-0 reuses the existing MCF precedence model and makes its baseline use explicit:

```text
1. current explicit LEANDRO instruction applicable to the boundary
2. GitHub/provider LIVE volatile facts
3. code/tests/workflows/evidence bound to exact applicable SHA
4. current decisions/protocols/methodology pins
5. canonical mission/checkpoint/design artifacts
6. Issues/PR comments and derived indexes
7. historical documentation
8. chat memory / unsupported inference
```

Lower-precedence sources may explain higher-precedence facts, but cannot silently override them.

### 2.1 Audit synthesis status

An audit synthesis is always a **derived index/interpretation**, never an independent source of truth.

```text
AUDIT_SYNTHESIS
→ useful navigation + consolidated risk model
→ MUST preserve references to source audits when material
→ MUST NOT defeat live repository/provider evidence
```

---

## 3. Evidence classes

GOV-0 distinguishes evidence by mutability.

### 3.1 Immutable or pin-capable evidence

Examples:

- Git commit SHA;
- immutable tag resolved to SHA when verified;
- repository artifact at exact SHA + path + digest;
- exact workflow run/check result bound to commit SHA;
- checkpoint/artifact ref with immutable identity;
- explicit human decision artifact bound to an exact target where applicable.

### 3.2 Volatile evidence

Examples:

- current `main` SHA;
- PR open/draft/mergeability state;
- Issue open/closed state;
- branch protection settings;
- Render/provider deployment settings;
- current production deployment;
- current CI queue state;
- provider health/availability.

Volatile evidence must carry an observation time or equivalent freshness context whenever it influences a gate.

### 3.3 Freshness rule

```text
VOLATILE_FACT used for gate/integration/production reasoning
→ re-read at the decision boundary
→ stale snapshot cannot be silently promoted to current truth
```

Provider unavailability does not justify inference from an old snapshot:

```text
required volatile provider fact unavailable
→ affected axis = UNKNOWN / BLOCKED
→ never infer currentity or authorization from stale evidence alone
```

This rule is the GOV-0 input for later External Effect Closure qualification.

---

## 4. GOV-0 baseline package — conceptual contract

No schema change is authorized. The following YAML is a **design contract**, not a serialized artifact specification.

```yaml
gov0_baseline_package:
  repository:
    stable_identity: <verified repository id when available>
    full_name: leon337/multiagent-collaboration-framework
    default_branch: main

  observed_main:
    sha: <exact live main sha>
    observed_at: <timestamp/evidence receipt>

  mission_or_proposal_target:
    kind: <proposal|mission|release|other>
    identifier: <PR/issue/artifact id>
    exact_sha: <if applicable>
    baseline_sha: <exact baseline>

  concurrent_work:
    - identifier: <issue/pr/mission>
      boundary: <discovery|design|implementation|release|other>
      baseline_sha: <exact sha if known>
      touches_shared_governance_primitives: <true|false|unknown>
      material_state_ref: <canonical artifact/ref or declared gap>

  blockers:
    - identifier: <issue/finding>
      severity: <class>
      immutable_evidence_ref: <ref or self-contained fact>
      volatile_recheck_required: <true|false>

  provider_sensitive_facts:
    - provider: <name>
      fact: <setting/deployment/effect path>
      observed_at: <timestamp/evidence receipt>
      freshness_required_before_reserved_effect: true

  unresolved_gaps:
    - <explicit gap; never hidden inference>
```

---

## 5. Material decision durability

The v2 reaudit exposed a real case: Issue #141 contains material discovery decisions in comments while branch artifacts may lag.

GOV-0 therefore defines:

```text
Issue / PR comment
= conversation, deliberation, discovery evidence

Material human decision
= must eventually be represented by canonical versioned artifact
  OR immutable evidence reference sufficient for deterministic recovery
```

### 5.1 What counts as material

A decision is material when it changes at least one of:

- mission objective or scope;
- authority/gate boundary;
- accepted requirement or architecture direction;
- version/methodology choice;
- implementation authorization;
- release/production authorization;
- blocker disposition;
- concurrency/integration precedence;
- rollback or compatibility decision.

### 5.2 Comment-only gap behavior

If cold-start finds material decisions only in comments and no canonical capture exists:

```text
comment evidence found
+
canonical material-state ref absent
→ declare MATERIAL_STATE_CAPTURE_GAP
→ do not invent final state from partial conversation
→ route through recovery/reconciliation/authority as appropriate
```

Comments remain evidence; they simply are not allowed to be the only durable checkpoint for material state.

---

## 6. Concurrent mission contract

GOV-0 records concurrent work without using branch recency or naming as precedence.

For Issue #141 and PR #142:

```yaml
relationship:
  mode: PARALLEL_DISCOVERY_WITH_SHARED_BASELINE
  baseline: main@5d79f488407c77f7b9f21ecfefb41ddfb3a52aef
  automatic_precedence_by_branch_name: forbidden
  automatic_precedence_by_recency: forbidden
  competing_governance_primitive: forbidden
  main_or_shared_contract_change: RECONCILIATION_REQUIRED
```

### 6.1 Positive fallback authority

The absence of an automatic precedence rule must not leave a hidden tie-breaker.

```text
multiple concurrent candidates
+
no objective compatibility/precedence rule resolves them
→ NO AUTOMATIC WINNER
→ LÉO decides within delegated boundary
→ escalate to LEANDRO when material/reserved
```

The decision must be evidence-backed and bound to the actual candidate states being compared.

### 6.2 Shared semantic surface

Two branches may modify different files while still touching the same semantic governance contract.

Therefore overlap is not path-only:

```text
non-overlapping files
+
shared authority/version/recovery/schema semantics
→ semantic overlap exists
→ later GOV-3 reconciliation required before integration
```

---

## 7. Current GOV-0 live snapshot for this mission

At the authorized design boundary:

```text
repository......................... leon337/multiagent-collaboration-framework
main............................... 5d79f488407c77f7b9f21ecfefb41ddfb3a52aef
v2 audited target.................. 4e4132a1041707840b4aab369d81f95a1f89899b
PR #142............................ OPEN / DRAFT / NOT MERGED at reaudit
Issue #140......................... OPEN — production governance blocker
Issue #141......................... OPEN / DISCOVERY_IN_PROGRESS
v2 CI.............................. Documentation validation SUCCESS
                                    MCF Production Readiness SUCCESS
```

This snapshot is historical evidence for the GOV-0 design. Any later gate must re-read volatile facts live.

---

## 8. GOV-0 failure modes

GOV-0 must fail closed when:

- repository identity cannot be verified;
- live default branch cannot be resolved;
- baseline SHA is unknown or contradictory;
- a blocking reference is broken and the blocking fact is not self-contained;
- concurrent material work exists but its latest durable state cannot be established;
- required provider facts are unavailable and materially affect the decision;
- a comment-derived human decision conflicts with a versioned canonical artifact;
- an audit synthesis conflicts with source audit evidence or live repository facts.

Failure does not mean inventing a replacement truth. It means declaring the gap and routing to reconciliation/authority.

---

## 9. GOV-0 acceptance criteria

GOV-0 design is complete when all of the following are explicit:

- source precedence is deterministic;
- immutable and volatile evidence are distinguished;
- volatile provider facts have freshness semantics;
- baseline package fields are defined conceptually;
- Issue/PR comments cannot be the only durable material-state checkpoint;
- #141↔#142 concurrency has no hidden recency/branch-name precedence;
- absence of objective precedence routes to LÉO/LEANDRO, not to guessing;
- semantic overlap is broader than changed-file overlap;
- no new checkpoint/recovery/event/permission engine is introduced.

---

## 10. Future qualification requirements

GOV-0 is design-only now. Future qualification must include at least:

### Unit/contract

- evidence-class classifier: immutable vs volatile;
- source-precedence conflict cases;
- material-decision classification cases;
- provider unavailable → affected fact unknown/blocked;
- audit synthesis never outranks original/live evidence.

### Integration

- Issue comments newer than branch artifact → capture gap declared;
- two concurrent missions, same baseline, no objective winner → human precedence required;
- different files but shared semantic governance primitive → overlap detected;
- stale provider snapshot contradicted by live provider state → live state wins.

### Clean-room

Input only `owner/repo` with noisy branches/issues/comments must not silently select comment recency or branch recency as authority.

These are `TEST_REQUIRED` / `TEST_DESIGNED`, not `TEST_IMPLEMENTED` or `TEST_PASSED` by this document.

---

## 11. Non-authorizations

```yaml
runtime_implementation: false
schema_change: false
skill_contract_change: false
checkpoint_engine_change: false
recovery_engine_change: false
permission_engine_change: false
merge_pr_142: false
release: false
production: false
render_change: false
branch_protection_change: false
```

---

## 12. GOV-0 exit state

```text
GOV-0 DESIGN....................... COMPLETE AS PROPOSAL ARTIFACT
GOV-0 IMPLEMENTATION............... NOT AUTHORIZED
GOV-0 QUALIFICATION................ NOT EXECUTED
GOV-0 ACTIVATION................... NOT AUTHORIZED
```

The next permitted design artifact under the same authorization is GOV-1.