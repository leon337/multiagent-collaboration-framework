# MCF-AGENT-WORKSPACE-001 — Local/GitHub Reconciliation

Date: 2026-09-26

## Repositories

Product:
- local: /home/leo/Projetos/mcf-agent-workspace
- GitHub: leon337/mcf-agent-workspace
- branch: main
- reconciled HEAD/origin: 7823927100edc3ef5af0f219510978d74d60f24b
- ahead/behind after reconciliation: 0/0
- working tree after reconciliation: clean

MCF:
- local worktree: /home/leo/mcf-worktrees/agent-workspace-001
- branch: mission/mcf-agent-workspace-001
- local/origin before this reconciliation: ec706137ed54c2566425bc8e9423a4ba678ba7cd
- ahead/behind: 0/0
- state was stale relative to the product after the hard-disabled gate.

## Broken local WIP found and isolated

Five uncommitted product files existed after 7823927:
- experimental/e1-real/egress-seal.mjs
- experimental/e1-real/persistence-scan.mjs
- experimental/e1-real/preload.cjs
- experimental/e1-real/synthetic-main.cjs
- tests/e1-real-candidate.test.mjs

The WIP failed npm run check because experimental/e1-real/preload.cjs contained an invalid regular expression.

It was not promoted to mission state and was not committed.

The diff was preserved outside the repository under:
~/.local/state/mcf-agent-workspace/reconciliation/broken-e1-real-wip-20260926-201642/wip.patch

The product worktree was restored to exact HEAD == origin/main == 7823927....

## Product history reconciled

Already committed/pushed product milestones beyond the previous MCF hard-disabled state:

1. f487e793f827e07cd1aabe3ab427fc0fc3ad414e
   - E1 controlled real-mutation experiment design.

2. Design gate:
   - aggregate: CONDITIONAL_E1_REAL_EXPERIMENT_DESIGN_ONLY
   - Sofia: PASS_E1_REAL_EXPERIMENT_DESIGN_ONLY
   - Emily: CONDITIONAL_E1_REAL_EXPERIMENT_DESIGN_ONLY
   - open Medium: non-HTTP/persistent send containment must be closed before any real-experiment authorization.

3. 7823927100edc3ef5af0f219510978d74d60f24b
   - hard-disabled real-experiment implementation candidate.
   - candidate remains disconnected from normal product and cannot mutate chatgpt.com at this SHA.

## Exact clean-SHA validation

Re-run on reconciled 7823927...:
- npm run check: PASS
- npm test: 74/74 PASS
- node experimental/e1-real/real-runner.mjs: exits 73 with NOT_AUTHORIZED, realExperimentHardDisabled=true, realMutationAuthorized=false
- npm run test:e1-real-synthetic: PASS

Synthetic containment evidence:
- fixed sentinel and frozen Patrícia target;
- POST/fetch blocked after seal;
- WebSocket upgrade blocked after seal;
- server HTTP count stable;
- server WebSocket upgrade count stable;
- page API remains hidden;
- synthetic staging fixture verifies digest/bytes;
- submit count remains zero;
- user-message count remains stable.

This is synthetic evidence only. It does not authorize a real effect.

## GitHub tracking before reconciliation

Issue #381, draft PR #382 and product issue #1 were updated only through PASS_HARD_DISABLED_INTEGRATION_ONLY.

They did not yet reflect:
- completed E1 real-experiment design gate;
- product candidate SHA 7823927....

## Canonical boundary after reconciliation

Recognized as completed:
- hard-disabled production E1 gate;
- controlled real-experiment design package;
- design gate with one Medium;
- hard-disabled implementation candidate prepared;
- synthetic/adversarial candidate evidence PASS.

Still not authorized:
- real execCommand against ChatGPT;
- real composer mutation;
- execution of the Patrícia experiment;
- operational E1 enablement;
- E2 / Enter / Send;
- production/cutover.

## Exact next gate from committed product evidence

The committed product preflight explicitly authorizes:
exact-SHA E1 REAL_EXPERIMENT IMPLEMENTATION/AUTHORIZATION GATE

for product SHA:
7823927100edc3ef5af0f219510978d74d60f24b

That gate must decide whether the non-HTTP containment Medium is closed.

No real experiment may occur before that gate produces a separate explicit authorization.
