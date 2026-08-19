# MCF-GOVERNANCE-EVOLUTION-001 — Governance Evolution, Versioning and Cold-Start

**Status:** `PROPOSED — NOT_CURRENT — NOT_IMPLEMENTATION_AUTHORIZED`  
**Repository:** `leon337/multiagent-collaboration-framework`  
**Baseline branch:** `main`  
**Baseline SHA:** `5d79f488407c77f7b9f21ecfefb41ddfb3a52aef`  
**Risk class:** `C`  
**Human authority:** `LEANDRO`  
**Operational authority:** `LÉO`  
**Coordinator:** `MESTRE`

> This document is a proposal for independent architectural audit. It is not the current MCF methodology, does not authorize implementation, does not authorize merge, release or production, and MUST NOT supersede current governance merely by existing in a branch or pull request.

---

## 1. Problem statement

The MCF already contains strong but distributed primitives for continuity and compatibility, including:

- `methodologyPin` with `version` + immutable reference;
- explicit `schemaVersion` on v1.1 artifacts;
- transferable checkpoints;
- `MCF-RECOVER-CONTEXT`;
- `ContinuityRecoveryService` with `FAST_RESUME`, `RECONCILE` and `RECOVER_MCF_PROJECT`;
- Git SHA baselines;
- migration/compatibility rules preserving v1.0 projects;
- live GitHub/provider precedence over stale historical volatile facts.

The missing governance contract is broader:

> When the MCF itself changes, how is the change born, how is it versioned, how do concurrent chats/missions reconcile, when does the change become current, how are old projects preserved, and how can a zero-context agent recover the correct active continuity from only `owner/repo`?

This proposal exists to close that gap without creating a parallel runtime, checkpoint engine, methodology database or recovery subsystem.

---

## 2. Architectural principle

```text
REUSE_BEFORE_NEW_PRIMITIVE
EXTEND_BEFORE_REPLACE
VERSION_BEFORE_BREAK
```

The proposal MUST extend existing MCF primitives rather than create:

- a second checkpoint engine;
- a second continuity/recovery engine;
- a parallel methodology state database;
- a second event ledger;
- a parallel registry that becomes a competing source of truth.

Expected foundation:

```text
Git
+ methodologyPin
+ checkpoints
+ MCF-RECOVER-CONTEXT
+ ContinuityRecoveryService
+ decisions
+ release/current-state documentation
```

---

## 3. Version taxonomy to design

The MCF currently has several independent version dimensions. The governance must distinguish them explicitly instead of collapsing them into a single ambiguous number.

```text
A. FRAMEWORK RELEASE
   Example: v1.1.0

B. METHODOLOGY VERSION
   The current governed set of operational rules.

C. PROTOCOL / CONTRACT VERSION
   Example: operational protocol 1.1, checkpoint contract 1.1.

D. ARTIFACT SCHEMA VERSION
   Example: PIP 1.0, PRR 1.0.

E. IMMUTABLE IMPLEMENTATION REF
   Exact Git SHA.
```

The final design MUST define the relationship between those identities, which one is authoritative for each question, and which changes require each identity to advance.

`SEMVER_POLICY` remains `DESIGN_REQUIRED`; this proposal does not yet freeze PATCH/MINOR/MAJOR rules.

---

## 4. Proposed lifecycle for changes to the MCF

A change to the MCF MUST NOT become current simply because it exists in a branch or PR.

Proposed states:

```text
PROPOSED
  ↓
DESIGNED
  ↓
VALIDATED
  ↓
AUDITED
  ↓
APPROVED_FOR_INTEGRATION
  ↓
MERGED
  ↓
QUALIFIED
  ↓
CURRENT
```

Additional terminal/non-current states:

```text
SUPERSEDED
REJECTED
BLOCKED
```

Core invariant:

```text
BRANCH != CURRENT
PR != CURRENT
MERGED != QUALIFIED
QUALIFIED != PRODUCTION_AUTHORIZED
```

---

## 5. Baseline and concurrent change reconciliation

Every MCF-evolution mission should bind itself to an exact live baseline:

```yaml
baseline:
  repository: leon337/multiagent-collaboration-framework
  branch: main
  sha: <EXACT_SHA>
```

Before integration, the executor must compare the original baseline with current `main`.

```text
baseline SHA A
      vs
live main SHA B
```

If `A != B`, the result is not automatically a conflict. It is:

```text
RECONCILIATION_REQUIRED
```

The drift must be classified as one of:

```text
IRRELEVANT
COMPATIBLE
OVERLAPPING
CONFLICTING
INVALIDATING
```

No integration may silently proceed from a stale methodological baseline when drift is material.

---

## 6. Cold-start discovery

The observed clean-room experiment showed that a new ChatGPT project with isolated memory, receiving only the repository identity, was able to discover the active Control Bridge continuity from GitHub without a manually generated handoff prompt.

The architectural conclusion is not to create another recovery engine. Instead, formalize a discovery stage before the existing recovery machinery:

```text
owner/repo
   ↓
COLD_START_DISCOVERY
   ↓
GitHub/provider live
   ↓
default branch + active PRs/branches + checkpoints/state
   ↓
resolve the most authoritative current continuity
   ↓
MCF-RECOVER-CONTEXT
   ↓
ContinuityRecoveryService
   ↓
FAST_RESUME | RECONCILE | RECOVER_MCF_PROJECT
```

The protocol must explicitly prevent conversational/project memory from overriding stronger live repository/provider evidence.

This proposal records the observed experiment as evidence of feasibility, not as a universal guarantee that every model will always infer the correct state without a deterministic protocol.

---

## 7. Compatibility constraints

The proposal must preserve the v1.1 migration principles already established by the MCF:

```text
NO_MASS_MIGRATION
NO_SILENT_UPGRADE
NO_HISTORICAL_REWRITE
EXPLICIT_UPGRADE_BOUNDARY
LEGACY_SUPPORT_REQUIRED
FAIL_CLOSED_ON_CONFLICTING_VERSION_STATE
```

A project pinned to an older methodology must not be silently promoted merely because a newer MCF version exists.

Historical artifacts must remain historically truthful.

---

## 8. GOV-P0 — production-governance blocker

**Blocking issue:** `#140 — [P1][GOV] Prevent production auto-deploy before LEANDRO HUMAN_GATE`

The current finding states that plain `main` updates can cause Render production to advance after checks pass, violating the intended separation:

```text
MERGE_OR_MAIN_UPDATE != PRODUCTION_AUTHORIZATION
NO_PRODUCTION_WITHOUT_LEANDRO_HUMAN_GATE
```

Therefore:

```yaml
GOV-P0:
  blocks_merge_of_this_governance_change_to_main: true
  blocks_release: true
  blocks_production: true

  does_not_block:
    design: true
    independent_audit: true
    proposal_branch: true
    draft_pull_request: true
```

The existence of this proposal branch MUST NOT be interpreted as permission to resolve or bypass #140 silently.

---

## 9. Proposed mission phases

```text
GOV-0 — Baseline & Reality
  Freeze baseline and authoritative sources.

GOV-1 — Version Taxonomy
  Release × methodology × protocol × schema × SHA.

GOV-2 — Governance Change Protocol
  Formal lifecycle for changes to the MCF itself.

GOV-3 — Baseline Drift & Concurrency
  Reconciliation rules for simultaneous chats/missions.

GOV-4 — Cold Start Recovery
  owner/repo → verifiable continuity discovery.

GOV-5 — Current-State Reconciliation
  Resolve current documentation/version identity drift.

GOV-6 — Compatibility & Qualification
  Unit, integration and clean-room qualification.

GOV-P0 — Production Governance
  Mandatory blocker before integration to main.
```

---

## 10. Qualification expectations

Documentation alone is insufficient for declaring this governance current.

### Unit/contract tests expected

```text
version classification rules
methodologyPin does not change silently
legacy pin remains valid
branch/PR cannot self-declare CURRENT
material baseline drift forces reconciliation
historical methodology remains immutable
```

### Integration tests expected

```text
main@A
  ↓
start governance change based on A
  ↓
main advances to B
  ↓
attempt integration
  ↓
RECONCILIATION_REQUIRED
```

### Clean-room recovery test expected

```text
new isolated ChatGPT/project
no prior chat memory
input = owner/repo only
  ↓
discover live repository state
  ↓
find active continuity/checkpoint/gate
  ↓
no manually generated handoff prompt required
```

The clean-room scenario must be repeated after the protocol is implemented so that the future test measures deterministic governance rather than a one-off successful inference.

---

## 11. Completion criteria

The governance cannot be declared complete while any of these remain ambiguous:

- Which MCF version is current?
- Which exact SHA represents that current version?
- Which methodology is a project pinned to?
- Which protocol/schema versions does it use?
- How does an MCF change begin?
- How is its version bump determined?
- How do concurrent changes reconcile?
- When does a change become `CURRENT`?
- How does an older project remain valid?
- How does a memory-isolated agent recover current continuity from `owner/repo`?
- How can implementation code be rolled back without falsifying methodology history?
- How is `merge/main update` technically prevented from implying production authorization?

---

## 12. Explicit non-authorizations

```yaml
implementation_authorized: false
runtime_change_authorized: false
schema_change_authorized: false
branch_is_current_methodology: false
pull_request_is_current_methodology: false
merge_authorized: false
release_authorized: false
production_authorized: false
issue_140_bypass_authorized: false
```

---

## 13. Independent audit mandate

The next intended action is an independent architectural audit of this proposal against the actual live MCF repository.

The auditor should attempt to falsify the proposal, with particular attention to:

1. duplicated primitives already present in the MCF;
2. ambiguity among release, methodology, protocol and schema versions;
3. incorrect or unsafe use of SemVer;
4. `methodologyPin` compatibility and historical immutability;
5. concurrent change / baseline drift failure modes;
6. whether cold-start discovery can be deterministic rather than heuristic;
7. compatibility with v1.0/v1.1 projects and checkpoints;
8. whether GOV-P0 is sufficient to block unsafe integration;
9. any path where branch/PR state could be mistaken for `CURRENT`;
10. missing tests, rollback or fail-closed behavior.

The auditor must compare this proposal with live repository evidence and current decisions, not review this document in isolation.

---

## 14. Current proposal state

```text
MCF-GOVERNANCE-EVOLUTION-001

BASELINE
main@5d79f488407c77f7b9f21ecfefb41ddfb3a52aef

EXISTING-STATE AUDIT................ DONE
ARCHITECTURAL DESIGN................ PROPOSED
INDEPENDENT AUDIT................... PENDING
IMPLEMENTATION...................... NOT AUTHORIZED
MERGE............................... BLOCKED
RELEASE............................. BLOCKED
PRODUCTION.......................... BLOCKED
GOV-P0 / ISSUE #140................. OPEN BLOCKER
```
