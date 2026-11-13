# MCF — Agent Architect Guided Builder (MVP)

**Mission:** MCF-20261023-AGENT-BUILDER-GUIDED-001
**Existing context:** Issue #467, PR #468 (draft)
**Risk class:** B — new local app and private workspace files; no changes to deployed presets without explicit approval
**Owner:** MESTRE; external audit Emily/Beatriz and formal Leo gate NOT claimed.

## /plan
Deliver a guided six-step interface (goal, behavior, tools, workspace, test, review) that supports both **create** and **modify**. Each agent receives its own persistent workspace under a Studio-controlled directory with validated identity, metadata, configuration and version history. Reuse DSH authenticated planner/mentor; allow creation of safe drafts without registering/publishing unknown plugins. For modifications of Hello World, allow proposal/preview through existing safe Studio API. Verify mobile layouts without absolute positioning, save/resume, security and error behavior. Preserve existing Hello World published profile, session, r6 draft and Lab history.

## /tasks
1. Inspect existing app, MCF mission status and user draft.
2. Implement dedicated workspace repository and API with validation and traversal prevention.
3. Implement interactive Agent Architect stepper and optional DSH-backed coaching.
4. Implement safe draft simulation and explicitly distinguished publication gate.
5. Run automated tests, browser E2E including DSH planner when available, capture screenshots and audit UX/accessibility.
6. Reconcile before/after hashes of existing agent profile and user draft; record evidence, PRF and push draft branch. No main merge.

## ./checklist
- [ ] Create/modify choice
- [ ] Guided goals and behavioral requirements
- [ ] Tool allowlist and informed limits
- [ ] Dedicated agent workspace, versioning, restart persistence
- [ ] Step navigation (back/forward) and assistive DSH mentor
- [ ] Preview by simulation without mutating active agent
- [ ] Clear distinction: new draft is NOT installed in DSH
- [ ] Security: input validation, no arbitrary filesystem paths/credentials
- [ ] Responsive and keyboard UX
- [ ] Unit/integration and real browser E2E
- [ ] Main draft, lab history and published profile remain untouched
- [ ] PRF with evidence and explicit governance caveats

## /autonomous-run /run
Execution delegated to MESTRE in this local scoped branch. Stop only when real app is usable or a hard blocker requires explicit user action. Gate: the MVP must not deploy a new arbitrary agent or edit live Hello World without separate approval.
