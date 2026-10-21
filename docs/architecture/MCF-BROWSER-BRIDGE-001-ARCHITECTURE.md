# MCF Browser Bridge — Architecture Candidate v0.1
Mission #455 · Base main@460d6e6fc4c5ac8dc8b0962bcf76a62c059a1615 · Status: PROPOSED, NOT IMPLEMENTED.

## Decision
Reuse canonical runtime and adapters. Do not clone the WebAgent Playwright runtime into the extension. Do not treat the Electron Dual Browser or future Agent Workspace as a browser profile equivalent.

## Proposed topology
LEANDRO (human authorization, reserved HUMAN_GATE)
  → MESTRE / MissionRuntime (mission, phase, agent)
  → SkillExecutor + HumanDelegationGuard + PermissionEngine
  → ExternalActionDispatcher → AdapterRegistry → canonical ExternalActionLedger
  → BrowserBridgeAdapter (FUTURE, disabled by default)
  → Native Messaging host (FUTURE, local Linux, restricted extension ID)
  → MV3 extension service worker (FUTURE)
  → scoped content script in a user-authorized Brave/Chrome tab
  → receipt, redacted evidence and postconditions
  → EvidenceValidator / existing MCF ledger

## Adapter and policy integration points
- external-action.contracts.ts already defines ExternalActionAdapter, supports(request), execute(request, mutationBoundary) and McfToolReceipt.
- adapter-registry.ts rejects zero/ambiguous matches by returning null or error. New adapter must be the only one matching the declared provider/action.
- permission-engine.ts enforces skill ownership, allowedTools, action/prohibitions, sensitive flags and HumanDelegationGuard. New provider/skill must be explicitly reviewed.
- external-action-dispatcher.ts reserves an external action before execution and distinguishes EXECUTED, UNKNOWN, FAILED. Its durableExecutionBoundaryAdapters set requires deliberate review for an adapter with material effects.
- mcf-runtime.module.ts wires actual adapters explicitly. This wiring is currently absent for BrowserBridgeAdapter.
- skill-executor.ts treats MCF-OPERATE-DUAL-BROWSER as a scoped internal Cockpit skill; MCF-WEB-INTERACT remains EXPERIMENTAL in registry. Do not expand Cockpit authority to Brave/Chrome just by reusing the skill label.

## Local communication proposal
Extension has nativeMessaging, scripting and activeTab permissions. NativeMessaging is only allowed from service worker/extension pages; content scripts cannot connect directly to host. Host manifest uses absolute Linux path, exact allowed_origins extension IDs and native stdio protocol. Any logs must go to stderr, not protocol stdout.

Native Messaging by itself provides neither strong local caller authentication nor remote MCF→laptop reachability. Add a host-side authenticated session bound to extension identity, missionId, phaseId, expiry, origin and allowed action. Treat extension IDs as necessary but insufficient when local attacker is in threat scope. Remote access via an outbound authenticated host-initiated channel is a separate, security-reviewed future milestone.

## Candidate request/response model (NOT IMPLEMENTED)
Request fields:
protocolVersion, missionId, phaseId, expectedMissionVersion, agentId, actionId, targetSurface, tabId, documentId, expectedOrigin, permissionGrantRef, requestedAction, actionRisk, precondition, postcondition, expiry, budget.
Response fields:
actionId, attemptId, observedOrigin, observedDocumentId, state [VALIDATED|DENIED|FAILED|UNKNOWN], timestamp, effects, evidenceRef, receiptRef, failureCode.
Require schema validation, message size caps, timeout, nonce/expiry, idempotency, and host verification. Never allow arbitrary shell or arbitrary page JavaScript submitted by a model.

## Trust boundaries and UX
- Page text/DOM is untrusted data and can contain prompt injection.
- activeTab is transient and generally requires user gesture; it is not an unrestricted remote automation grant.
- Tab identity and origin are rechecked immediately before action and after effect.
- For critical DOM targets use versioned semantic ID, unique match, stale target revalidation and postcondition. AMBIGUOUS is zero action.
- A click can cause an irreversible side effect; risk classifier must distinguish READ_PUBLIC, READ_AUTHENTICATED_SENSITIVE, WRITE_REVERSIBLE and DESTRUCTIVE_OR_EXTERNAL_COMMIT.
- Screenshot/ARIA may contain credentials or PII even when fill values are redacted in timeline. Design bounded capture, minimization, TTL and access control.
- Unknown-effect state demands reconciliation before retry; stop command blocks further dispatch but does not imply undo of already dispatched work (#365).
- No CAPTCHA/2FA/anti-bot bypass; legitimate human authentication handled separately.
- Chrome Web Store and internal chrome:// pages are restricted surfaces, not guaranteed script targets.

## Trade-offs
Preferred: Native Messaging local host for private MVP, no exposed listening socket.
Alternative HTTP loopback: defer pending threat model for Origin/CSRF/local malware.
Playwright headless: continues independently for public research; cannot claim existing user browser control.
Electron Cockpit: preserves its own isolation/discovery and remains fallback, not successor of the extension.

## Phasing and rollback
M0 documentation review and gate.
M1 schema/tests/fixture.
M2 read-only Brave extension+host.
M3 canonical MCF adapter/receipts.
M4 controlled synthetic writes.
M5 Chrome compatibility, explicit real-account gate.
Rollback: feature flag OFF, revoke pairing, unregister only project-owned host manifest, uninstall extension, preserve existing browser profile and audited receipts. All gates tied to exact commit SHA.

References: Issue #455; #365; #367; #381; #434; #439; docs/protocols/MCF-PROTOCOLO-DUAL-BROWSER-RUNTIME-DISCOVERY.md; developer.chrome.com/docs/extensions/develop/concepts/native-messaging.
