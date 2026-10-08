# Phase Report — GUI / Window Control Formalization

Mission: `MCF-MESTRE-CROSS-CHAT-SUCCESSION-001`
Phase: `PHASE-GUI-WINDOW-CONTROL-FORMALIZATION`
Status: QUALIFIED — awaiting internal LÉO gate

## Execution summary

The team formalized the approved GUI/window-control candidate while preserving the historical `CROSS_CHAT_SUCCESSION = PASS` and recording the later-discovered GUI/window dimension as `GAP_NOT_TESTED`, consolidated as `MAINTAIN_WITH_GAP`.

### First implementation attempt

An initial candidate branch was derived from the succession audit branch. TDD worked technically: RED run `33102284727` failed as expected and GREEN run `33102608099` passed. When draft PR #178 was opened, integration review found contaminated ancestry: audit/release-ledger artifacts and the v1.2.0 one-shot publisher were included in the PR payload. The PR was classified `INVALID_CANDIDATE_ANCESTRY` and closed without merge.

### Recovery

A clean candidate branch was created directly from exact `main`:
- base: `5c7f9832f037f374ec3fe2d4160342a5f2cf8a06`;
- branch: `ops/mcf-gui-window-control-clean-candidate`.

Clean RED run `33102929696` failed as expected before candidate artifacts existed. The candidate implementation then added the protocol, schema, fixtures, qualifier/workflow and unified-protocol reference. Draft PR #179 was opened for qualification only.

### Quality correction

BEATRIZ found that the negative fixture demonstrated only three failure modes while the candidate defined more gates. The qualifier was hardened to execute 15 independent negative regressions.

Final candidate:
- HEAD: `3a2545237ca1449b4ac2ba44d781c3e4e01be339`;
- tree: `2c1e907612610376a9d7b99d729ab06001ddc59e`;
- base/merge-base: `5c7f9832f037f374ec3fe2d4160342a5f2cf8a06`;
- ahead: 8 commits;
- behind: 0;
- changed files: exactly 7.

## Final candidate files

1. `.github/scripts/mcf-gui-window-control-qualification.mjs`
2. `.github/workflows/mcf-gui-window-control-qualification.yml`
3. `docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md`
4. `docs/protocols/MCF-PROTOCOLO-SUCESSAO-CROSS-CHAT-E-CONTROLE-DE-JANELAS.md`
5. `schemas/fixtures/mcf-gui-window-succession-trace.invalid.json`
6. `schemas/fixtures/mcf-gui-window-succession-trace.valid.json`
7. `schemas/mcf-gui-window-succession-trace-v1.schema.json`

## Qualification

Final HEAD `3a254523...`:
- push GUI/window qualification `33103543742`: SUCCESS;
- PR GUI/window qualification `33103547722`: SUCCESS;
- Documentation validation `33103547784`: SUCCESS;
- Production Readiness `33103547736`: SUCCESS.

Production Readiness passed exact candidate checkout/boundary verification, frozen-lockfile install, dependency vulnerability gate, formatting, lint, typecheck, migrations twice, tests, build, PostgreSQL client, backup + isolated restore and release-readiness contract tests.

## Independent audit

EMILY used independent route `NVIDIA NIM / minimaxai/minimax-m3`.
Initial audit found the candidate acceptable with one blocker: Production Readiness still pending. After readiness SUCCESS on unchanged HEAD, bounded revalidation returned:
- `REVALIDATION_VERDICT = PASS`;
- `EVIDENCE_SUFFICIENCY = SUFFICIENT`;
- `BLOCKING_FINDINGS = NONE`;
- `CANDIDATE_QUALIFICATION = QUALIFIED`;
- `RELEASE_GATE = HELD`.

## Governance result

No mutation of `main` occurred. No merge occurred. No tag or release occurred. No next version was selected. PR #179 remains draft.
