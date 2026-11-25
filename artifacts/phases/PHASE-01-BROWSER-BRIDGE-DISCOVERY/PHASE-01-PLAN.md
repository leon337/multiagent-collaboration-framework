# MCF-BROWSER-BRIDGE-001 — PHASE-01 PLAN
Date: 2026-10-21
Mission: MCF-BROWSER-BRIDGE-001, GitHub issue #455
Status: PLANNING / REVIEW_PENDING / IMPLEMENTATION_NOT_AUTHORIZED
Human authority: LEANDRO. Orchestrator: MESTRE. Operational gate: LÉO.
Risk: B for planning; C for authenticated accounts, private data, autonomous writes and destructive operations.
Baseline: main@460d6e6fc4c5ac8dc8b0962bcf76a62c059a1615 (tree e7b26c4239176b8af3851d601623576b3b4c405a).

## Goal
Plan a Chrome/Brave Manifest V3 extension integrated with the existing MCF governance/runtime, where authorized agents can eventually observe a scoped tab and return verifiable evidence. Do not create another MissionRuntime, permission engine, skill registry or ledger.

## Authorized now
GitHub and host read-only audit; planning documentation on isolated branch and draft PR; threat model; test specification; review preparation.

## Not authorized in this phase
Executable extension/host, installs, background agent control, login, real account operations, browser profile mutation, credentials, cloud-host access, production deployment, public release, purchases, irreversible actions or CAPTCHA/2FA bypass.

## Sources
- docs/MCF-CURRENT-STATE.md
- docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md
- docs/protocols/MCF-PROTOCOLO-DUAL-BROWSER-RUNTIME-DISCOVERY.md
- docs/contracts/MCF-UI-SEMANTIC-CONTRACT.json
- apps/rede-social-agentes/apps/server/src/mcf-runtime/
- apps/webagent-mcp/
- Issue #367, #365, #381, #434, #439, #427; PR #371, #435, #440.

## Reuse strategy
MissionRuntime -> SkillExecutor/PermissionEngine/HDF -> ExternalActionDispatcher -> AdapterRegistry -> FUTURE Browser Bridge adapter -> FUTURE local Native Messaging host -> FUTURE MV3 extension -> allowed browser tab; returns receipt through EvidenceValidator and canonical ledger.
Native Messaging is LOCAL transport, not a remote cloud-to-notebook channel.

## Candidate MVP
- Brave first (present on host), Chrome only when actually installed.
- Explicit user-gesture tab permission and one allowed tab/origin.
- Health/capabilities, tab status, bounded DOM snapshot and viewport capture on synthetic fixture.
- Agent/mission identity display, explicit stop, permission revocation and evidence redaction.
- No real-world clicks/writes in the read-only MVP; fixture-only writes require separate gate.

## Planned stages
P0: planning PRF, independent audit, operational gate.
P1: design schemas and local harmless fixtures after implementation gate.
P2: implement MV3 + Native Messaging local read-only component, feature flag OFF by default.
P3: integrate into existing MCF runtime, receipt/ledger and post-action validation.
P4: authorize fixture-only semantic writes, prove idempotency and recovery.
P5: separate Chrome compatibility and real-account/security gates.

## Acceptance checklist for P0
- [x] Live baseline, core code, Chrome extension API and affected issues inspected.
- [x] Host browser/runtime inventory without secrets.
- [x] Candidate architecture, security boundaries and tests documented.
- [x] Rollback/fail-closed plan.
- [ ] Exact-head draft PR CI/document validation.
- [ ] Independent security and architectural review with attributable evidence.
- [ ] Operational gate by LÉO documented. LEANDRO only if a reserved boundary is reached.

## Team selection (proposal ONLY)
MESTRE coordinates; Miriam sources; Sofia/Rafael architecture; Beatriz agent behavior; Júlia security; Renato tests; Augusto trace; Carmem PRF; Emily independent audit; Gabriel Git/CI; LÉO gate. No specialist agent execution or handoff is asserted without tool evidence.
