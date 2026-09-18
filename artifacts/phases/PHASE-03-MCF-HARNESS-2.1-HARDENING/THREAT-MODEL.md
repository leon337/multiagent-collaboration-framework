# Threat Model — MCF Harness V2.1

## Assets

- Mission Journal;
- task ownership/lease state;
- capability tokens;
- execution/tool receipts;
- session checkpoints;
- mailbox content;
- workspace artifacts;
- authority decisions;
- secret references and ephemeral leases;
- snapshot/anchor digests.

## Trust boundaries

1. model/executor → runtime;
2. tool output → model context;
3. agent → tool/capability;
4. execution → secret broker;
5. sender → mailbox target;
6. task worker → isolated workspace;
7. runtime → persisted journal;
8. local cryptographic key → signed anchor;
9. MCF repository → external publication provider;
10. GitHub/Render → public observability, not runtime authority.

## Threats and controls

| Threat | Control | State |
|---|---|---|
| False-green receipt | dedicated `mcf_receipt/v1` + evidence required | implemented |
| Receipt tamper | canonical receipt digest validation | implemented |
| Tool output leaks token | typed secret-pattern redaction | implemented |
| Prompt injection through tool output | untrusted-output marker | implemented |
| Oversized tool output | deterministic truncation | implemented |
| Confused deputy | capability + agent + task + execution binding | implemented |
| Capability widening | child-token narrowing rule | existing 2.0 |
| Unauthorized secret access | exact secret-name policy + `secret:<name>` capability | implemented |
| Secret value persistence | ephemeral lease + metadata-only audit | implemented |
| Secret reuse after expiry/revoke | TTL + revoke + best-effort mutable-buffer overwrite | implemented; process-memory erasure is not guaranteed |
| Arbitrary environment lookup | explicit name→environment mapping only | implemented |
| Ambiguous mailbox side effect after crash | durable delivery attempt + no blind retry + explicit reconciliation with evidence | implemented |
| Mailbox overload | per-target queue + message-size limits | implemented |
| Mailbox reordering | ordered target dispatcher | implemented |
| Scheduler starvation | bounded aging + lane fairness | implemented |
| Scheduler overload | global active-task backpressure | implemented |
| Unsafe preemption | recommendation only; recovery gate required | implemented |
| Lease before dependency completion | dependency gate before lease | implemented |
| Journal tamper after snapshot | rolling prefix digest + snapshot hash | implemented |
| Authority-record tamper | local HMAC anchor | implemented |
| Schema upgrade by accident | explicit adjacent migration registry | implemented |
| Schema downgrade | fail closed | implemented |
| Cross-family migration | fail closed | implemented |
| Missing migration hop | fail closed | implemented |
| External anchor misrepresented as immutable | publication receipt forces `immutability_claimed=false` | implemented |
| Signing-key theft | local restricted permissions | partial; host compromise remains |
| Cross-node split brain | one-host locks do not provide distributed consensus | residual |
| Managed secret-provider compromise | provider-specific control not selected | residual |
| External publication deletion/edit | GitHub publication is auditable but mutable | residual |
| Malicious binary/tool output | sanitizer protects text boundary only | residual |

## Residual risks

### R1 — Single-host coordination

The 2.1 hardening is process-safe on one host. File locks and SQLite/WAL do not implement distributed consensus. Cross-node coordination requires a separate design.

### R2 — External publication is not immutable

GitHub Issue/PR publication can provide an external timestamped audit reference but can be edited or removed by authorized actors. The runtime must never label that surface an immutable transparency ledger.

### R3 — Managed secret service

The runtime has the provider contract, policy gates, ephemeral lease lifecycle, TTL, revocation and metadata-only audit. A managed organizational provider such as OpenBao/Vault/cloud secret management has not been selected.

### R4 — Host compromise

If the local host and signing key are compromised simultaneously, local HMAC anchors cannot independently prove historical authenticity. External digest publication reduces ambiguity but does not solve full host compromise.

### R5 — Non-text tool payloads

The current sanitizer governs the text/serialized boundary. Native binary/file malware analysis is outside this phase.

## Security posture

The MCF V2.1 hardening fails closed on authority/capability/schema ambiguity and explicitly distinguishes:

- **implemented control**;
- **single-host guarantee**;
- **external audit publication**;
- **residual distributed/provider risk**.

No control is upgraded from “auditably published” to “immutable” without an independent immutable provider.
