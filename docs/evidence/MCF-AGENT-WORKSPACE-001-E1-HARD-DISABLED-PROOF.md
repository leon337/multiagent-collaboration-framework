# MCF-AGENT-WORKSPACE-001 — E1 Hard-Disabled Production Integration Proof

Date: 2026-09-26

Product implementation SHA:
27c7f058a1e021f4ff46c57552353ce9d7849b33

Product evidence SHA:
be3cbe8367b98456c551b78efffb417ea1b14787

Product gate SHA:
8e28eaa404127f644746a5fbb262a0f4d383f239

Decision:
PASS_HARD_DISABLED_INTEGRATION_ONLY

## Scope

The real Session Focus may contain structural E1 wiring while all real mutation remains unreachable.

Real E1 effect remains prohibited.

## Evidence

Regression:
- npm run check PASS
- npm test 66/66 PASS
- offline positive E1 candidate PASS
- offline negative harness 14/14 PASS

Real Patrícia read-only smoke:
- real Session Focus ATTACHED;
- hard-disabled preload READY;
- realMutationAuthorized=false;
- zero stage requests;
- unique real ProseMirror composer;
- composer HTML stable;
- composer text stable;
- user-message count stable;
- no page-visible agentWorkspace/mcf/ipcRenderer;
- no renderer E1 trigger;
- Preview Only / EXECUTION NOT AUTHORIZED remained visible.

URL compatibility hardening:
- ChatGPT strips the decorative GPT slug in-place;
- compatibility accepts only slugged<->slugless with exact host + GPT ID + conversation ID + query + hash;
- identity-changing differences remain fail-closed.

Handoff:
- Workspace exit;
- external zero-handle verification;
- 2 stores released;
- fallback READY;
- final zero handles.

## Audit

Sofia:
PASS_HARD_DISABLED_INTEGRATION_ONLY
Critical 0 / High 0 / Medium 0 within scope.

Emily:
PASS_HARD_DISABLED_INTEGRATION_ONLY
Critical none / High none / blocking Medium none.

## Boundary

Authorized:
- keep hard-disabled structural E1 integration as inert baseline;
- design the next real-mutation experiment authorization package.

Not authorized:
- real execCommand;
- real composer mutation;
- bypass/removal of hard-disable;
- operational E1;
- real staging experiment;
- E2 / Enter / Send;
- production/cutover.
