# MCF Browser Bridge — Threat Model v0.1
Mission #455 · Status PROPOSED / SECURITY_REVIEW_PENDING · No code or penetration test performed.

## Assets
Authenticated browsing sessions, tab DOM, screenshots, form contents, URLs, downloads, mission authority, agent identity, native host, extension, canonical action ledger and receipts.

## Attack scenarios → defenses to implement and test
1. **Prompt injection via DOM:** a page instructs the agent to exfiltrate cookies/ignore authority. Keep page content as untrusted data; model never receives tools capable of arbitrary JS, OS commands or unbounded export. Test adversarial fixture.
2. **Forged extension/content-script messages:** page, iframe, other extension or malware submits fake action request. Verify sender, origin, extension ID, protocol version, session binding, nonce/expiry and mission authorization on host. Negative tests.
3. **Native host impersonation / local attacker:** allowed_origins alone is NOT a complete authentication boundary. Use signed or scoped capability/session and least privilege; no raw privileged socket. Test spoofing.
4. **Cross-tab/context swap:** extension executes in wrong tab/document after user switches or site redirects. Require tabId + documentId/origin binding and immediate revalidation; fail-closed if mismatch.
5. **Semantic target ambiguity/TOCTOU:** two matching buttons or stale node. Cardinality 1, stable canonical semantic ID, revalidation, postcondition; otherwise zero side effects.
6. **Silent destructive click:** generic click triggers transfer, payment, delete, send or publish. Classify semantic effects; block DESTRUCTIVE and reserved operations until a real HUMAN_GATE. Never infer from click verb alone.
7. **Privacy leakage:** screenshots, ARIA and excerpts reveal secrets/PII. Limit capture to authorized scope; redaction and retention policy, encrypted storage if persisted, no cookies/tokens in logs/issues.
8. **Interruption and duplicate effects (#365):** ChatGPT response abort does not necessarily cancel host work. Durable action IDs, leases, explicit cancel, UNKNOWN reconciliation before retry, read-after-write only where safe.
9. **DoS/crash:** oversized DOM, loops, worker restart, host stdout corruption. Budgets/timeouts/size, bounded queues, error containment, no unbounded retries.
10. **Website safeguards:** CAPTCHA/2FA/Cloudflare/OAuth blocking is not a bug to bypass. Use legitimate user interaction or mark BLOCKED.

## Security gates for implementation
G0 read-only isolated fixture: threat review, no real profiles, default deny writes.
G1 extension-host: origin/authn/authz, deny unknown messages, anti-replay, no local control without pairing.
G2 MCF adapter: PermissionEngine and HDF tested, ledger/evidence durable as applicable, negative security tests.
G3 private browsing: specific consent/scope/TTL/PII design, independent security review.
G4 real external writes: separate high-risk authorization, confirmed postcondition, no unsafe retries.
G5 remote connectivity: TLS, outbound-host session, principal binding, revocation and replay protection; independent gate.

## Existing risks not to erase
Issue #427 security CI debt stays separate; the WebAgent PR #371 proof is not proof of the extension. The Dual Browser Agent Bridge is not permission to drive arbitrary browser profiles.

## Residual status
HIGH, NOT MITIGATED for unattended real-account mutation. Do not connect authenticated accounts until the applicable gates are independently demonstrated and approved.
MEDIUM, UNVALIDATED for local Native Messaging authentication, worker lifecycle and screenshots.
LOW for this read-only documentation branch, if no credentials are committed.
