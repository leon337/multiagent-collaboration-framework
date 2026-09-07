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

### Task 2: Create the universal continuity protocol

**Files:**
- Create: `docs/protocols/MCF-PROTOCOLO-CONTINUIDADE-MULTI-IA-V1.2.md`

**Interfaces:**
- Consumes: Task 1 decision.
- Produces: deterministic bootstrap/resume algorithm and machine-readable field contract for registered projects.

- [ ] **Step 1:** Define authority-by-domain resolution and freshness rules.
- [ ] **Step 2:** Define remote and local/live state snapshots as separate objects.
- [ ] **Step 3:** Define governance states (`NOT_AUTHORIZED`, `AUTHORIZED`, `CANONICALIZATION_PENDING`, `CANONICAL`) and evidence states (`UNVERIFIED`, `IN_PROGRESS`, `PASS`, `FAIL`, `STALE`).
- [ ] **Step 4:** Define canonicalization flow from human approval to persisted/verified canonical state.
- [ ] **Step 5:** Define concurrency guard using `base_sha`, current remote head, open overlapping work and domain/file overlap.
- [ ] **Step 6:** Define fresh-client bootstrap: identify project -> locate registry -> read project capsule -> read canonical entrypoints -> inspect open work -> re-observe live state when required -> detect stale/conflict -> open mission contract -> continue from next executable gate.
- [ ] **Step 7:** Define evidence validity bound to commit, environment and observation time; define PASS/FAIL per criterion.
- [ ] **Step 8:** Define checkpoint persistence events (material decision, critical FAIL, direction change, gate, external dependency, conflict, mission close) and explicitly reject per-click Git persistence.
- [ ] **Step 9:** State that cross-chat visual succession is delegated to the existing succession/window protocol rather than duplicated.
- [ ] **Step 10:** Commit the protocol.

### Task 3: Wire the protocol into MCF bootstrap and project registry

**Files:**
- Modify: `project-instructions/MCF-PROJECT-OPERATING-INSTRUCTIONS.md`
- Modify: `project-instructions/MCF-STARTUP-CHECKLIST.yaml`
- Modify: `project-instructions/MCF-CHAT-BOOTSTRAP-TESTS.md`
- Modify: `context/projects/project-memory.yaml`

**Interfaces:**
- Consumes: Task 2 protocol.
- Produces: discoverable/required continuity behavior for new chats and an explicit overlay pointer for `project-memory`.

- [ ] **Step 1:** Add the continuity protocol to mandatory references and add the fresh-project continuation sequence to operating instructions without changing existing precedence.
- [ ] **Step 2:** Extend startup checklist with project registry resolution, domain authority resolution, remote/local freshness, pending canonicalization and conflict detection fields.
- [ ] **Step 3:** Add bootstrap test scenarios that fail when a fresh client relies on chat memory, conflates remote/local state, treats approval as canonical before persistence, or ignores a changed remote head.
- [ ] **Step 4:** Extend `context/projects/project-memory.yaml` with a continuity section pointing to the universal protocol and project-local overlay while preserving the existing canonical repository and entrypoints.
- [ ] **Step 5:** Commit bootstrap/registry wiring.

### Task 4: Static integration validation

**Files:**
- Validate: files created/modified in Tasks 1-3.

**Interfaces:**
- Consumes: all MCF Gate 3 changes.
- Produces: evidence that references and invariants are internally consistent before PR review.

- [ ] **Step 1:** Re-read every modified file from the branch and verify all referenced paths exist or are explicitly cross-repository overlay references.
- [ ] **Step 2:** Confirm no statement makes chat memory authoritative or makes MCF owner of runtime/project technical state.
- [ ] **Step 3:** Confirm the existing cross-chat/window protocol is referenced as complementary, not superseded.
- [ ] **Step 4:** Compare branch against `main` and inspect the complete diff for accidental unrelated changes.
- [ ] **Step 5:** Open a draft PR with explicit acceptance criteria and dependency on the `project-memory` overlay PR.

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