# MCF Browser Bridge — Bounded MVP Implementation Plan (proposal)
Date 2026-10-21 · Issue #455 · Status NOT_AUTHORIZED_TO_IMPLEMENT.

## Milestone 0 — documentary gate (current)
- Maintain PRF in artifacts/phases/PHASE-01-BROWSER-BRIDGE-DISCOVERY.
- Verify actual host, GitHub main SHA and upstream workflows.
- Store architecture, threat model and test cases in draft PR.
- Run documentation validation and independent architecture/security review.
- Record LÉO decision; seek LEANDRO reserved approval only for genuinely reserved boundaries.

## Milestone 1 — schemas and fixtures (future, after gate)
- Decide whether to extend MCF-WEB-INTERACT or register an explicit provider/skill without expanding MCF-OPERATE-DUAL-BROWSER boundary.
- Version request/response, origin binding, error codes, actionId and permission scopes; schema reject unknown action.
- Add harmless local HTML fixture, no account or private session; tests for malicious DOM instructions, ambiguous targets and origin switching.

## Milestone 2 — extension + Native Host (future, after gate)
- MV3 popup for pairing and stop; service worker; read-only content script for selected tab; use activeTab/scripting/nativeMessaging with minimal grants.
- Local host launch/manifest only by explicit installation under correct Brave path; strict allowed_origins plus in-protocol scoped authorization; no freeform shell.
- Test host restart, service-worker sleep, revocation, native length framing and invalid extension ID.
- Keep feature OFF by default.

## Milestone 3 — canonical runtime adapter (future, after gate)
- Connect ExternalActionAdapter to AdapterRegistry/PermissionEngine/HDF/Dispatcher/EvidenceValidator/existing ledger.
- Bind missionId, phaseId, expectedMissionVersion, agentId, actionId, tab/document and authorization.
- Record redacted evidence with attemptId and clear outcome. Unknown effects must not auto-replay.

## Milestone 4 — controlled writes (different gate)
- Test navigate/click/fill/select/press on synthetic fixture; READ default succeeds, WRITE default denied.
- Semantic target unique, origin checked, postcondition proven, retry deduplicated.
- No real-account posting, sending, payments, downloads, file uploads, auth bypass or public deployment.

## Milestone 5 — browser compatibility and production (different gate)
- Qualify actual Chrome installation in addition to Brave; compatibility report and uninstall rollback.
- Explicit security/privacy review before sensitive data or authenticated real profiles.
- Public store distribution/remote cloud control requires its own production gate and exact SHA.

## Test matrix (all NOT_RUN today)
T01 Host missing → safe diagnosis, no mutation.
T02 Extension sender ID mismatch → DENIED.
T03 Invalid schema/oversize/replay → DENIED.
T04 Origin/tab/document mismatch → CONTEXT_CHANGED, zero action.
T05 WRITE with default policy → ACTION_POLICY_DENIED.
T06 Prompt-injection DOM → treated as untrusted data, no instruction execution.
T07 Ambiguous selector → zero click.
T08 Restart/duplicate actionId → no duplicate effect.
T09 Host timeout after possible click → UNKNOWN; reconcile rather than retry.
T10 STOP while action underway → no new actions, in-flight effect reconciled.
T11 Secret displayed in local fixture → capture redacted/retention enforced.
T12 READ DOM and viewport on authorized fixture → validated receipt.
T13 WebAgent regression and MCF runtime tests → green at exact SHA.
T14 Uninstall bridge → no browser profile deletion.
T15 chrome:// and Chrome Web Store restricted → fail closed.
T16 No remote transport configured → no cloud-to-notebook access.
T17 Temporary activeTab grant absent/revoked → DENIED.
T18 Two adapters support same request → reject ambiguous adapter resolution.

## CI proposal
Add isolated extension/host lint, typecheck, tests, manifest schema validation and Chromium GUI smoke when code exists. Preserve .github/workflows/webagent-mcp-qualification.yml and production readiness gates; do not disable #427 security checks.

## Acceptance for authorizing code
- PRF complete with hashes, draft PR and exact-SHA CI result.
- Reviewed architecture and risk without unmitigated Critical/High in selected boundary.
- LÉO operational gate with evidence, LEANDRO explicit approval when reserved.
- Rollback/disconnect and PII policy written before interacting with accounts.
Current result: PLANNING_ONLY; no executable, no E2E.
