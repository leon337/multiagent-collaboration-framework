# PHASE-01 Plan — UI Semantic Manual

Mission: `MCF-UI-SEMANTIC-MANUAL-001`  
Issue: #361  
Class: B  
Authority: LEANDRO  
Orchestrator: MESTRE

## Objective
Create durable operating knowledge for ChatGPT/Dual Browser so future sessions use canonical semantic identities instead of rediscovering controls by screenshots, coordinates or ad hoc CSS inspection.

## Scope
- human operating manual;
- machine-readable semantic contract;
- local workstation bindings for account-specific project identities;
- drift/ambiguity/fail-closed policy;
- read-only semantic smoke across Emily, Sofia, Patrícia and Rafael;
- entry-point exposure from `docs/MCF-CURRENT-STATE.md`.

## Out of scope
- deleting old chats;
- creating the next mission's fresh chats;
- implementing a universal click engine;
- changing Cockpit runtime code in this phase.

## Selected agents
- Sofia: architecture/stable-vs-volatile boundary.
- Rafael: engineering/schema/resolver integration proposal.
- Patrícia: adversarial drift/race analysis.
- Emily: independent audit criteria.
- MESTRE: live inventory, consolidation, versioning and smoke.

## Acceptance
- canonical IDs independent of coordinates/DOM order;
- no critical first-match-wins rule;
- local project IDs remain local;
- ambiguity/stale/context drift fail closed;
- critical actions require postconditions;
- future-session entry point is explicit;
- semantic resolution smoke passes in all four panes;
- final Emily audit has no Critical/High blockers for this documentation/manual boundary.
