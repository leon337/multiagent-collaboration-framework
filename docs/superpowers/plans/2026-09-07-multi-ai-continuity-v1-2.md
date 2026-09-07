# Multi-AI Continuity v1.2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a universal MCF continuity protocol that lets a fresh AI/client resume a registered project from canonical sources without treating chat memory as authoritative.

**Architecture:** MCF owns universal continuity/governance rules and project discovery. Each registered project remains owner of its technical state through project-local canonical documents and an optional continuity overlay. Runtime/live state remains outside Git and must be re-observed when freshness requires it.

**Tech Stack:** Markdown, YAML, GitHub repository metadata and existing MCF bootstrap/governance documents.

**Spec:** Gate 3 architecture explicitly approved by LEANDRO on 2026-09-07; materialized by Task 1 in `docs/decisions/MCF-DEC-067-CONTINUIDADE-MULTI-IA-POR-DOMINIO.md` and Task 2 in `docs/protocols/MCF-PROTOCOLO-CONTINUIDADE-MULTI-IA-V1.2.md`.

## Global Constraints

- MCF governs continuity and discovery; it does not become owner of project runtime state.
- Registered project canonical documents remain authoritative for project-specific technical truth.
- Chat/model memory is never an authoritative source.
- Remote canonical state and local/live state are distinct and must not be silently conflated.
- Governance state and evidence state are independent axes.
- Human approval before persistence yields `CANONICALIZATION_PENDING`, not canonical truth.
- Concurrent AI/chat work must detect stale base refs and material overlap before publication.
- Existing `MCF-PROTOCOLO-SUCESSAO-CROSS-CHAT-E-CONTROLE-DE-JANELAS.md` remains valid and complementary.
- Existing `HUMANO NO CONTROLE`, HDF, ESEV, CAF and precedence rules remain in force.
- No tag, release, production deployment or destructive action is authorized by this plan.

---

### Task 1: Persist the architectural decision

**Files:**
- Create: `docs/decisions/MCF-DEC-067-CONTINUIDADE-MULTI-IA-POR-DOMINIO.md`

**Interfaces:**
- Consumes: approved Gate 3 architecture and existing MCF precedence/bootstrap rules.
- Produces: normative decision that defines responsibility boundaries and state axes used by Task 2.

- [ ] **Step 1:** Create the decision with scope, rationale, ownership split (`MCF` / `project` / `runtime`), authority-by-domain, remote-vs-local separation, governance/evidence axes, pending canonicalization, concurrency checks and relationship to existing cross-chat succession.
- [ ] **Step 2:** Verify the decision does not redefine `HUMANO NO CONTROLE`, HDF, ESEV, CAF, or project-specific runtime semantics.
- [ ] **Step 3:** Commit the decision on the Gate 3 branch.

### Task 2-V2: Implement and qualify the universal continuity kernel

**Files:**
- Create: `docs/protocols/MCF-PROTOCOLO-CONTINUIDADE-MULTI-IA-V1.2.md`
- Create: `schemas/mcf-multi-ai-continuity-v1.schema.json`
- Create: `schemas/fixtures/mcf-multi-ai-continuity.valid.json`
- Create: `schemas/fixtures/mcf-multi-ai-continuity.invalid.json`
- Create: `.github/scripts/mcf-multi-ai-continuity-qualification.mjs`

**Interfaces:**
- Consumes: Task 1 decision and the Task-2-V2 design contract in `.superpowers/sdd/2026-09-07-multi-ai-continuity-v1-2/task-2-v2-brief.md`.
- Produces: a minimal normative protocol, a small machine contract, valid/invalid fixtures, and deterministic executable qualification. Task 2-V2 is `CLEAN` only when all five artifacts satisfy the contract and the qualification script exits zero.

- [ ] **Step 1:** Define the minimal normative kernel: authority-by-domain; strict remote-vs-local/live separation; exactly four governance states (`NOT_AUTHORIZED`, `AUTHORIZED`, `CANONICALIZATION_PENDING`, `CANONICAL`); exactly five evidence states (`UNVERIFIED`, `IN_PROGRESS`, `PASS`, `FAIL`, `STALE`); approval never implying `PASS`; and canonicalization only after persistence plus objective verification.
- [ ] **Step 2:** Define immutable `observation_id` and `evaluation_id` identities, with deterministic negative tests for attempted identity mutation; timestamps are data only and never identity or join keys; timing policy is independently varied from source kind. Require non-empty applicable evidence dimensions; prohibit `PASS` when zero required bindings apply. Require every derived result to reference exact operand IDs, one `evaluation_id`, and a non-empty immutable `evaluator_version`; reject missing/wrong operand IDs, missing/empty evaluator versions, incomplete operand sets, cross-evaluation operands, and mixed evaluations.
- [ ] **Step 3:** Define publication as a new attempt that reacquires both remote-head and open-work observations and binds both exact IDs to that publication's single `evaluation_id`. Apply `EQUAL`-only canonical commit/head qualification. Fail closed on stale or reused remote-head, stale or reused open-work, missing or incomplete operands, mixed-evaluation operands, remote-head mismatch, domain overlap, or normalized file overlap. Executably reject every non-`EQUAL` canonical-head relation.
- [ ] **Step 4:** Fully specify repository-relative POSIX path normalization and an executable vector table covering: POSIX absolute paths, Windows drive roots, UNC roots, URI forms, control characters, root escape, empty input/result, repeated slashes, `.` and `..`, case preservation, backslash conversion, exact canonical equality, and non-overlap for directory-prefix-only paths. Define domain identifiers as trimmed, non-empty exact UTF-8 strings, case-sensitive, with no case folding or Unicode normalization; include positive and negative vectors.
- [ ] **Step 5:** Define the exact fresh-client bootstrap order: identify project -> locate registry -> read project capsule -> read canonical entrypoints -> inspect open work -> re-observe live state when required -> detect stale/conflict -> open mission contract -> continue from next executable gate. Executably accept only this nine-step order; reject every pairwise swap and missing, extra, duplicate, or substituted entries.
- [ ] **Step 6:** Define exactly seven checkpoint classes: material decision, critical `FAIL`, direction change, gate, external dependency, conflict, mission close. Executably accept only this exact set and reject missing, extra, substituted, and per-click checkpoint classes. Delegate cross-chat succession to the existing succession/window protocol rather than duplicating it.
- [ ] **Step 7:** Implement the small Draft 2020-12 JSON Schema and valid/invalid fixtures. Keep protocol semantics normative; encode the trace envelope and enforceable structural invariants without inventing alternate semantics. Qualification must validate fixtures against the delivered schema itself—not merely parse JSON—accept the valid fixture, reject the invalid fixture and schema-targeted mutations, and assert schema/semantic-validator agreement, using a dependency-free narrow validator for the delivered schema or an already-present validator.
- [ ] **Step 8:** Implement a deterministic, dependency-free qualification script that validates artifact presence and all contract regressions. Exact executable coverage includes all four governance states, all five evidence states, the nine bootstrap steps (canonical order plus every pairwise swap and missing/extra/duplicate/substituted cases), and all seven checkpoint classes (exact set plus missing/extra/substituted/per-click rejection). Also cover identity/binding negatives; timestamp/source-timing independence; stale/reused remote-head and open-work; missing/incomplete/mixed-evaluation publication operands; every non-`EQUAL` relation; required evidence dimensions/bindings; overlap failures; canonicalization rules; schema validation/agreement; and every required path/domain normalization vector.
- [ ] **Step 9:** Run `.github/scripts/mcf-multi-ai-continuity-qualification.mjs`; require deterministic PASS including delivered Draft 2020-12 schema validation; re-read all five artifacts; record Task 2-V2 `CLEAN` only after every exact state/order/class, publication, identity/binding, path/domain, and fixture-schema regression passes. Do not start Task 3 before `CLEAN`.
- [ ] **Step 10:** Commit the five Task 2-V2 artifacts only after the Task 2-V2 gate is `CLEAN`.

### Task 3: Wire the qualified protocol into MCF bootstrap and project registry

**Files:**
- Modify: `project-instructions/MCF-PROJECT-OPERATING-INSTRUCTIONS.md`
- Modify: `project-instructions/MCF-STARTUP-CHECKLIST.yaml`
- Modify: `project-instructions/MCF-CHAT-BOOTSTRAP-TESTS.md`
- Modify: `context/projects/project-memory.yaml`

**Interfaces:**
- Consumes: Task 2-V2 only after its qualification gate is `CLEAN`.
- Produces: discoverable/required continuity behavior for new chats and an explicit overlay pointer for `project-memory`; does not redefine or relocate Task 2-V2 semantics.

- [ ] **Step 1:** Add the continuity protocol to mandatory references and add the fresh-project continuation sequence to operating instructions without changing existing precedence.
- [ ] **Step 2:** Extend startup checklist with project registry resolution, domain authority resolution, remote/local freshness, pending canonicalization and conflict detection fields.
- [ ] **Step 3:** Add bootstrap test scenarios that fail when a fresh client relies on chat memory, conflates remote/local state, treats approval as canonical before persistence, or ignores a changed remote head.
- [ ] **Step 4:** Extend `context/projects/project-memory.yaml` with a continuity section pointing to the universal protocol and project-local overlay while preserving the existing canonical repository and entrypoints.
- [ ] **Step 5:** Commit bootstrap/registry wiring.

### Task 4: Static integration and formal conformance validation

**Files:**
- Validate: files created/modified in Tasks 1-3.

**Interfaces:**
- Consumes: CLEAN Task 2-V2 artifacts plus Task 1 and Task 3 changes.
- Produces: static cross-file integration evidence and formal conformance evidence before PR review; does not redefine or relocate Task 2-V2 semantics.

- [ ] **Step 1:** Re-read every modified file from the branch and verify all referenced paths exist or are explicitly cross-repository overlay references.
- [ ] **Step 2:** Run `.github/scripts/mcf-multi-ai-continuity-qualification.mjs` and require deterministic PASS; validate the schema and both fixtures against the protocol contract.
- [ ] **Step 3:** Confirm cross-file preservation of authority-by-domain, remote/local separation, exact state sets, exact bootstrap order, exact checkpoint classes, evidence identity/binding rules, `EQUAL`-only publication policy, fail-closed overlap, and cross-chat delegation. Report drift; do not repair it by moving semantics into Task 3 or Task 4.
- [ ] **Step 4:** Confirm no statement makes chat memory authoritative, makes MCF owner of runtime/project technical state, treats approval as `PASS`, or permits canonicalization before persistence and objective verification.
- [ ] **Step 5:** Confirm the existing cross-chat/window protocol is referenced as complementary, not superseded.
- [ ] **Step 6:** Compare branch against `main` and inspect the complete diff for accidental unrelated changes.
- [ ] **Step 7:** Open a draft PR with explicit acceptance criteria, Task 2-V2 qualification evidence, and dependency on the `project-memory` overlay PR.

### Task 5: Cross-repository acceptance gate

**Files:**
- Review: MCF PR and `project-memory` Gate 3 PR.

**Interfaces:**
- Consumes: both repository PRs.
- Produces: Gate 3 ready-for-merge verdict.

- [ ] **Step 1:** Verify both branches still derive from compatible current `main` heads; if either head moved, inspect overlap before updating.
- [ ] **Step 2:** Verify the MCF registry pointer matches the exact project overlay path.
- [ ] **Step 3:** Verify the project capsule marks Gate 3 as `CANONICALIZATION_PENDING` until merge/verification.
- [ ] **Step 4:** Record PASS/FAIL per acceptance criterion.
- [ ] **Step 5:** Merge only after CI/static checks pass and human merge authorization is available under current governance; otherwise leave both PRs open with checkpoint.