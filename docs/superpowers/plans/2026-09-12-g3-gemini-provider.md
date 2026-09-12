# G3 Gemini Provider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a governed Google Gemini model-execution boundary to MCF and qualify it without allowing direct external effects or paid fallback.

**Architecture:** Introduce provider-neutral model execution contracts and a deterministic registry beside the existing external-action boundary. `GeminiModelProvider` owns only inference; tool calls remain intents and never execute material actions. Configuration is fail-closed, server-side, allowlisted and disabled by default.

**Tech Stack:** TypeScript 6, NestJS 11, Vitest 4, `@google/genai`, Zod.

**Spec:** `artifacts/phases/PHASE-GAMA-02-GOOGLE-GEMINI-DESIGN/PHASE-GAMA-02-REPORT.md`

## Global Constraints
- `MODEL_TOOL_INTENT != MATERIAL_EXTERNAL_EFFECT`.
- `GEMINI_API_KEY` never enters Git, logs, receipts or browser payloads.
- `MCF_GEMINI_ENABLED=false` by default.
- `MCF_GEMINI_PAID_FALLBACK_ALLOWED=false` by default.
- Model ID is configurable and explicitly allowlisted.
- Live qualification stops if paid billing is required.

---

### Task 1: Model execution contracts and registry
**Files:** create `model-execution.contracts.ts`, `model-execution.registry.ts`, `model-execution.registry.test.ts` under server `mcf-runtime`.
- [ ] Write failing tests for zero, one and duplicate provider matches.
- [ ] Run targeted Vitest and verify RED.
- [ ] Implement minimal contracts and registry.
- [ ] Verify GREEN and commit.

### Task 2: Gemini configuration boundary
**Files:** modify `apps/rede-social-agentes/apps/server/src/config.ts`, `.env.example`, and config tests.
- [ ] Write failing tests for disabled-by-default, missing key when enabled, allowlist and paid fallback false.
- [ ] Verify RED.
- [ ] Implement minimal schema/refinement and env example.
- [ ] Verify GREEN and commit.

### Task 3: Gemini provider behavior
**Files:** create `gemini-model.provider.ts` and tests; modify server `package.json` and lockfile.
- [ ] Write failing tests for disabled provider, model outside allowlist, sanitized receipt and tool-intent-only behavior.
- [ ] Verify RED.
- [ ] Add exact official SDK dependency and minimal provider with injectable client boundary.
- [ ] Verify GREEN.
- [ ] Add failing tests for auth, 429, timeout/network/invalid response/block mapping.
- [ ] Implement minimal failure mapping and verify GREEN.
- [ ] Commit.

### Task 4: Runtime wiring and qualification
**Files:** modify `mcf-runtime.module.ts`; add module test; create `artifacts/phases/PHASE-GAMA-03-GEMINI-INTEGRATION/` PRF.
- [ ] Write failing module test for provider/registry wiring.
- [ ] Implement DI wiring and verify targeted tests.
- [ ] Run server typecheck/tests and relevant workspace verification.
- [ ] Check for Gemini API credential presence without printing it.
- [ ] If credential exists, make one harmless live free-tier call and persist sanitized evidence; otherwise record `BLOCKED_BY_EXTERNAL_CREDENTIAL`.
- [ ] Generate PRF with exact outputs, model ID, receipt digest and zero-paid-fallback evidence.
