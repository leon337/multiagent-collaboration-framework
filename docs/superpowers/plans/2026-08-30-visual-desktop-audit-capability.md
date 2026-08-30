# Visual Desktop Audit Capability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the proven T20 desktop visual-audit experiment into a reusable, governed MCF skill that can execute a complete authorized desktop audit in one operational call and produce verifiable evidence.

**Architecture:** Add `MCF-AUDIT-VISUAL-DESKTOP` to the canonical skill registry and executable runtime, with a SentinelX-specific permission boundary and semantic receipt validation. Keep X11/Tesseract/Pillow outside the NestJS server in a deterministic Node CLI adapter under the existing ops workspace; the CLI invokes host capabilities only when available and emits a machine-readable result that can be signed as the external tool receipt.

**Tech Stack:** TypeScript 6, NestJS runtime, Vitest 4, Node.js 24.18, Node `node:test`, SentinelX/X11 (`scrot`, `xdotool`, `xclip`), Tesseract OCR, Python/Pillow only as the host image primitive.

**Spec:** `project-instructions/MCF-T20-VISUAL-AUDIT-EFFICIENCY.md`

## Global Constraints

- Repository source of truth is current `main` of `leon337/multiagent-collaboration-framework`.
- Preserve TEAM_FIRST: Leandro is not the technical operator.
- A successful audit must preserve raw, annotated and verification artifacts.
- The requested operational unit (window/surface) governs the primary geometry; physical monitors are secondary context.
- Structured sources are preferred; OCR is a fallback and must not fabricate content.
- The server runtime must not require X11/Tesseract/Pillow at startup or in headless CI.
- External desktop mutation is scoped write and requires `authorizedScope=true`.
- Completion requires semantic evidence, not merely a successful command exit.
- No direct writes to `main`; integrate through PR with green CI.

---

### Task 1: Governed Runtime Contract

**Files:**
- Modify: `skills/registry.yaml`
- Modify: `apps/rede-social-agentes/apps/server/src/mcf-runtime/skill-executor.ts`
- Modify: `apps/rede-social-agentes/apps/server/src/mcf-runtime/permission-engine.ts`
- Modify: `apps/rede-social-agentes/apps/server/src/mcf-runtime/evidence-validator.ts`
- Test: `apps/rede-social-agentes/apps/server/src/mcf-runtime/skill-executor-expanded.test.ts`
- Test: `apps/rede-social-agentes/apps/server/src/mcf-runtime/skill-registry.loader.test.ts`

**Interfaces:**
- Consumes: external signed receipt with provider `SentinelX`, operation `audit-desktop-visual`, resource `authorized-desktop-session`.
- Produces: executable skill `MCF-AUDIT-VISUAL-DESKTOP` owned by Augusto/Beatriz and semantic validation of visual-audit evidence.

- [ ] Add failing loader/executor tests proving the new skill is absent/non-executable before implementation.
- [ ] Run the targeted Vitest files and verify RED for the missing feature.
- [ ] Register the skill with SCOPED_WRITE, explicit inputs/evidence/steps and SentinelX/Remote Desktop Commander tools.
- [ ] Add it to the executable skill set but not the internal skill set.
- [ ] Add permission boundary: only the visual-audit operation/resource is accepted for SentinelX execution and external scope authorization remains mandatory.
- [ ] Add semantic receipt validation requiring distinct artifact paths, matching surface inventory/count, non-empty visible labels, empty critical failures, `openVerified=true`, and elapsed time within an optional requested budget.
- [ ] Run targeted tests and verify GREEN.
- [ ] Commit the governed runtime contract.

### Task 2: One-Call Desktop Audit Adapter

**Files:**
- Create: `apps/rede-social-agentes/ops/visual-desktop-audit.mjs`
- Create: `apps/rede-social-agentes/ops/visual-desktop-audit.test.mjs`

**Interfaces:**
- Consumes CLI options: `--output-dir`, `--window-pattern`, `--expected-surfaces`, `--open-surface`, `--time-budget-ms`.
- Produces JSON: `{ requestedUnit, physicalMonitors, surfaces, artifacts, elapsedMs, openVerified, criticalFailures, interpretationMode, verdict }`.

- [ ] Write failing `node:test` cases for wmctrl parsing/sorting, OCR label sanitization, result validation, and safe CLI option validation.
- [ ] Run the new ops test and verify RED because the module does not exist.
- [ ] Implement pure parsing/validation helpers first.
- [ ] Implement the live pipeline: inventory -> raw capture -> narrow representative crops -> parallel OCR -> annotation -> clipboard/open -> double Enter -> verification capture.
- [ ] Fail closed when dependencies, expected surfaces, artifacts or final open verification are missing.
- [ ] Emit only machine-readable JSON on stdout and diagnostics on stderr.
- [ ] Run ops tests and verify GREEN.
- [ ] Commit the adapter.

### Task 3: Live Repeatability and T20 Evidence

**Files:**
- Create: `artifacts/T20-VISUAL-AUDIT-CAPABILITY-RUN-2026-08-30.md`

**Interfaces:**
- Consumes: the real authorized `leo-N43SM` desktop session with three Brave surfaces.
- Produces: at least five comparable executions with paths, timing, verification state, and aggregate reliability evidence.

- [ ] Restore a comparable three-surface GROK BOT desktop state.
- [ ] Execute the CLI five times without Leandro operating the desktop.
- [ ] Require 5/5 valid runs, no surface confusion, no missing artifacts, and no fabricated labels.
- [ ] Independently inspect at least the final annotated and verification PNGs.
- [ ] Record min/median/max time, all artifact paths, and any observed OCR defects.
- [ ] Commit the evidence record.

### Task 4: Full Verification and Integration

**Files:**
- Modify only if verification exposes defects in files above.

**Interfaces:**
- Consumes: completed runtime skill + adapter + live evidence.
- Produces: reviewed PR and merge to `main` only after complete verification.

- [ ] Run format check, lint, typecheck, targeted runtime tests, all ops tests and build using Node 24.18/pnpm 11.17.
- [ ] Review `git diff` for scope, secrets, accidental artifacts and unsupported platform assumptions.
- [ ] Push branch and open PR with the live evidence summary.
- [ ] Wait for Production Readiness CI and inspect failures if any.
- [ ] Merge only with green CI and unchanged expected head SHA.
- [ ] Verify the registry entry, adapter and evidence record on `main` after merge.
