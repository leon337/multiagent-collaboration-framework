# MCF-GOVERNANCE-EVOLUTION-001 — GOV-1 Design

**Status:** `DESIGN_ONLY — AUTHORIZED_BY_LEANDRO — NOT_CURRENT — NOT_IMPLEMENTATION_AUTHORIZED`  
**Parent proposal:** `MCF-GOVERNANCE-EVOLUTION-001.md`  
**Reaudit input:** `MCF-GOVERNANCE-EVOLUTION-001-V2-REAUDIT-SYNTHESIS.md`  
**Audited v2 SHA:** `4e4132a1041707840b4aab369d81f95a1f89899b`  
**Phase:** `GOV-1 — Version Taxonomy & Axis-Specific Currentity`

> GOV-1 defines how MCF version axes and currentity axes are classified. It does not change any runtime contract, schema, methodology pin, release, `main` or production state.

---

## 1. Objective

GOV-1 must make two questions deterministic:

1. **Which version axis changes when an MCF change occurs?**
2. **Which exact artifact/decision is currently applicable on each currentity axis?**

The design must eliminate automation-facing `maybe` decisions and preserve this invariant:

```text
VERSION_AXES ARE RELATED
BUT NOT AUTOMATICALLY COUPLED
```

---

## 2. Version axes

The canonical axes are:

```text
A. framework_release
B. methodology
C. protocol_contract
D. artifact_schema
E. immutable_implementation_ref
```

### 2.1 Framework release

Describes the packaged/released framework capability set.

```text
PATCH
→ released correction with no new externally governed capability and no contract break

MINOR
→ released backward-compatible framework capability

MAJOR
→ released breaking framework behavior/public compatibility break
```

A branch or PR does not gain a release version merely by existing.

### 2.2 Methodology

Describes governed operating semantics.

```text
PATCH
→ clarification/correction with no change to decisions, authority, evidence requirements, gates or lifecycle semantics

MINOR
→ additive backward-compatible governance semantics for applicable new work

MAJOR
→ breaking authority/gate/evidence/lifecycle/compatibility semantics
```

### 2.3 Protocol / contract

Describes typed behavioral or serialized interfaces shared across components.

```text
PATCH
→ non-semantic correction only where the contract family uses patch semantics

MINOR
→ additive backward-compatible contract capability

MAJOR
→ breaking contract compatibility
```

Existing historical `1.0` / `1.1` identities remain valid; GOV-1 does not normalize old versions retroactively.

### 2.4 Artifact schema

Versioned independently per serialized artifact family.

```text
MINOR
→ additive backward-compatible field/value representation

MAJOR
→ breaking serialized representation or validation semantics
```

A schema family that historically uses `1.0` / `1.1` may continue doing so; GOV-1 governs future impact classification, not historical rewriting.

### 2.5 Immutable implementation ref

Git SHA is not SemVer. Every repository content change naturally creates a new immutable implementation ref.

```text
SHA_CHANGED
!=
METHODOLOGY_CHANGED
!=
CONTRACT_CHANGED
!=
SCHEMA_CHANGED
!=
RELEASE_PUBLISHED
```

---

## 3. Deterministic impact classifier

The earlier v2 matrix used `maybe` for some axes. GOV-1 removes that ambiguity by requiring a sequence of yes/no classifiers.

For every change, answer independently:

### Q1 — Framework capability

```text
Will this change be included in a framework release?
NO  → framework_release = NONE for this proposal/change event
YES → does it break externally supported behavior?
       YES → MAJOR
       NO  → does it add externally supported capability?
              YES → MINOR
              NO  → PATCH
```

### Q2 — Methodology semantics

```text
Does the change alter governed authority, gates, evidence requirements,
required lifecycle behavior, default methodology eligibility, or compatibility semantics?
NO  → methodology = NONE
YES → is existing governed work made incompatible without explicit upgrade?
       YES → MAJOR
       NO  → additive rule/capability = MINOR
             pure clarification with identical semantics = PATCH
```

### Q3 — Protocol / contract

```text
Does the change alter a typed behavioral or serialized interface?
NO  → protocol_contract = NONE
YES → is previous valid consumer/producer behavior broken?
       YES → MAJOR
       NO  → MINOR
```

### Q4 — Artifact schema

```text
Does the change alter the shape/validation of a serialized artifact family?
NO  → artifact_schema = NONE
YES → can old valid artifacts/consumers remain valid without silent reinterpretation?
       YES → MINOR on the affected schema family
       NO  → MAJOR on the affected schema family
```

### Q5 — Project repin / upgrade

```text
Does the applicable project methodology identity change?
NO  → no repin
YES → explicit upgrade/activation boundary required
```

There is no `maybe` terminal result. Missing evidence yields:

```text
CLASSIFICATION_UNKNOWN
→ RECONCILE / AUDIT
→ never classify downward automatically
```

---

## 4. Canonical change-impact matrix

The table below gives deterministic outcomes for common archetypes.

| Change archetype | Framework release | Methodology | Protocol/contract | Artifact schema | Repin/upgrade |
|---|---|---|---|---|---|
| Non-semantic docs correction, not released | `NONE` | `NONE` | `NONE` | `NONE` | no |
| Non-semantic correction included in release | `PATCH` | `NONE` | `NONE` | `NONE` | no |
| Backward-compatible runtime capability, no contract/governance change | `MINOR` | `NONE` | `NONE` | `NONE` | no |
| Backward-compatible typed contract capability, no governance change | `MINOR` when released | `NONE` | `MINOR` | `NONE` unless artifact representation changes | no |
| Additive governance rule with no representation change | `MINOR` when released | `MINOR` | `NONE` | `NONE` | new eligible work may use new default; old pins preserved |
| Additive governance rule represented by new optional contract field | `MINOR` when released | `MINOR` | `MINOR` | `MINOR` on affected artifact family | explicit activation for new default; no silent migration |
| Breaking authority/gate/evidence semantics with unchanged wire shape | `MAJOR` when released | `MAJOR` | `NONE` | `NONE` | explicit upgrade boundary |
| Additive optional serialized field with no governance semantic change | `MINOR` when released | `NONE` | `MINOR` if part of contract | `MINOR` on affected family | no silent migration |
| Breaking serialized contract with no methodology semantic change | `MAJOR` when released | `NONE` | `MAJOR` | `MAJOR` on affected family | explicit migration boundary |
| Breaking serialized contract plus governance semantic break | `MAJOR` | `MAJOR` | `MAJOR` | `MAJOR` on affected family | explicit upgrade/migration boundary |

The conditional phrases are predicates, not `maybe`: the classifier must determine whether the predicate is true before assigning the result.

---

## 5. Axis-specific currentity

No global `CURRENT` is allowed.

Canonical axes:

```yaml
currentity_axes:
  methodology_for_new_work:
    question: Which methodology is eligible as the default for newly started applicable work?

  main_implementation:
    question: What exact SHA is currently at repository main?

  stable_release:
    question: What exact stable release identity has been published?

  production_deployment:
    question: What exact implementation/release identity is deployed in production?

  protocol_contract_identity:
    question: Which protocol/contract version applies to this mission/artifact/interface?

  artifact_schema_identity:
    question: Which schema version applies to this serialized artifact family?
```

These may differ simultaneously without contradiction.

---

## 6. Methodology identity is not methodology eligibility

The v2 reaudit identified an important distinction.

### 6.1 Identity validity

`IDENTITY_VALID` means the claimed methodology identity can be resolved and verified against its repository/SHA/artifact/digest contract.

It answers:

> “Is this really the methodology artifact it claims to be?”

### 6.2 Eligibility

`METHODOLOGY_ELIGIBLE` answers a different question:

> “May this verified methodology be used for this project or for new work under the current governance decision?”

A methodology may be authentic and immutable but superseded for new work.

```text
IDENTITY_VALID = true
METHODOLOGY_ELIGIBLE_FOR_NEW_WORK = false
```

### 6.3 Eligibility is derived, not a new registry

Eligibility MUST be derived from existing evidence:

```text
verified methodology identity
+ activation/supersession decision
+ applicable scope/axis
+ project methodology pin when resuming existing work
+ explicit upgrade decision when changing a pin
```

No methodology database or parallel registry is authorized.

Conceptual derived classifications:

```text
ELIGIBLE_DEFAULT_FOR_NEW_WORK
ELIGIBLE_FOR_EXISTING_PINNED_WORK
SUPERSEDED_FOR_NEW_WORK
INELIGIBLE_FOR_SCOPE
ELIGIBILITY_UNKNOWN
```

These are human-readable design classifications, not a new persisted state engine.

### 6.4 Unknown eligibility

```text
identity valid
+
activation/supersession evidence unavailable or contradictory
→ ELIGIBILITY_UNKNOWN
→ fail closed for new-work default selection
→ existing valid project pin is not silently rewritten
```

---

## 7. Activation / supersession requirements

A methodology cannot become the default for new work merely because:

- it exists on `main`;
- a PR is merged;
- CI is green;
- a release exists;
- it has the highest semantic version;
- it is the newest branch/document;
- its identity is cryptographically valid.

The `methodology_for_new_work` axis requires explicit applicable authority evidence.

Conceptual activation evidence must identify at least:

```yaml
methodology_activation:
  methodology_identity: <verified identity>
  applicable_axis: methodology_for_new_work
  scope: <repository/project/global boundary as applicable>
  authority: LEANDRO when material governance semantics change
  decision_ref: <durable evidence>
  supersedes: <prior default identity if applicable>
```

A superseded methodology remains historically valid for projects still legitimately pinned to it unless an explicit compatibility/upgrade rule says otherwise.

---

## 8. `AMBIGUOUS_CONTINUITY` contract decision

The current runtime contract contains three resume routes:

```text
FAST_RESUME
RECONCILE
RECOVER_MCF_PROJECT
```

GOV-1 explicitly decides:

```text
AMBIGUOUS_CONTINUITY
= cold-start discovery/resolution status
!= fourth McfResumeRoute under the current contract
```

Therefore, under the current no-schema-change boundary:

```text
multiple equally authoritative continuity candidates
→ stop before selecting resumeRouteHint
→ return candidate set + evidence through design-level recovery handoff
→ require authority/reconciliation decision
```

### 8.1 Future representation rule

If future GOV-4 implementation requires `AMBIGUOUS_CONTINUITY` to be serialized into an existing typed contract or enum, that change must be classified before implementation:

```text
additive enum/value in backward-compatible affected contract
→ protocol_contract MINOR
→ affected artifact_schema MINOR when persisted in that schema
→ framework release MINOR when shipped
→ methodology bump only if governance semantics themselves change
```

No such schema/contract change is authorized by GOV-1.

---

## 9. Legacy and new-work interaction

GOV-1 preserves:

```text
NO_MASS_MIGRATION
NO_SILENT_UPGRADE
NO_SILENT_DOWNGRADE
NO_HISTORICAL_REWRITE
EXPLICIT_UPGRADE_BOUNDARY
```

Examples:

```text
project pinned to methodology 1.1.0
new default becomes methodology 1.2.0
→ project remains on 1.1.0 until explicit upgrade/reconciliation
```

```text
methodology 1.1.0 superseded for new work
project has valid historical 1.1.0 pin
→ identity may remain valid
→ eligibility for existing pinned work may remain valid
→ eligibility as new-work default is false
```

---

## 10. GOV-1 failure modes

GOV-1 fails closed when:

- version impact cannot be classified from available evidence;
- a change is simultaneously labeled semantic and non-semantic without resolution;
- a methodology identity is valid but activation/supersession evidence is contradictory;
- a global `CURRENT` claim attempts to collapse axes;
- branch/PR/release recency is used as methodology eligibility;
- a schema/contract value is added without corresponding impact classification;
- a project is silently repinned because a newer methodology exists;
- a superseded methodology is treated as the default solely because its artifact still validates.

---

## 11. GOV-1 acceptance criteria

GOV-1 design is complete when:

- all version axes are independently defined;
- classifier questions produce `NONE/PATCH/MINOR/MAJOR` or `CLASSIFICATION_UNKNOWN`, never `maybe`;
- Git SHA is explicitly separate from SemVer axes;
- currentity axes remain independent;
- methodology identity and methodology eligibility are distinct;
- eligibility is derived from existing activation/supersession/pin evidence, not a new registry;
- `AMBIGUOUS_CONTINUITY` is explicitly not a fourth resume route under the current contract;
- future serialization of ambiguity is pre-classified as an additive contract/schema change when applicable;
- legacy project pins are not silently upgraded or rewritten.

---

## 12. Future test contract

GOV-1 is design-only. Future qualification must include at least:

### Unit / classifier

- every canonical archetype maps to deterministic version-axis results;
- no terminal `maybe` result;
- uncertain evidence → `CLASSIFICATION_UNKNOWN`;
- framework release bump does not automatically bump methodology;
- methodology bump does not automatically bump artifact schemas;
- SHA change alone does not imply any semantic version change.

### Eligibility

- valid active methodology → eligible for applicable new work;
- valid superseded methodology → not eligible as new-work default;
- valid historical pin → may remain eligible for existing pinned project;
- valid identity + missing activation evidence → eligibility unknown / fail closed;
- higher version number alone never establishes eligibility.

### Compatibility / negative

- new optional enum value classified before schema implementation;
- old v1.0/v1.1 artifacts remain historically valid;
- project pin does not change without explicit upgrade boundary;
- PR Draft + green CI does not activate methodology axis.

These are `TEST_REQUIRED` / `TEST_DESIGNED`, not implemented or passed by this design document.

---

## 13. Non-authorizations

```yaml
runtime_implementation: false
schema_change: false
protocol_contract_change: false
methodology_pin_change: false
methodology_activation: false
project_repin: false
merge_pr_142: false
release: false
production: false
```

---

## 14. GOV-1 exit state

```text
GOV-1 DESIGN....................... COMPLETE AS PROPOSAL ARTIFACT
VERSION TAXONOMY................... DETERMINISTIC AT DESIGN LEVEL
CURRENTITY AXES.................... DEFINED
IDENTITY vs ELIGIBILITY............ SEPARATED
AMBIGUOUS_CONTINUITY............... NOT A FOURTH CURRENT RESUME ROUTE
IMPLEMENTATION..................... NOT AUTHORIZED
QUALIFICATION...................... NOT EXECUTED
ACTIVATION......................... NOT AUTHORIZED
```

GOV-2 and later phases remain outside the current authorization boundary.