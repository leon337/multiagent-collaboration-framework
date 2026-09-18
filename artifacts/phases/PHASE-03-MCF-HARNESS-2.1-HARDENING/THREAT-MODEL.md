# Threat Model — MCF Harness V2.1

## Assets

- Mission Journal;
- task ownership/lease state;
- capability tokens;
- execution/tool receipts;
- session checkpoints;
- mailbox content;
- workspace artifacts;
- authority decisions.

## Trust boundaries

1. model/executor → runtime;
2. tool output → model context;
3. agent → tool capability;
4. sender → mailbox target;
5. task worker → isolated workspace;
6. runtime → persisted journal;
7. local cryptographic key → signed anchor;
8. GitHub/Render → public observability only.

## Threats and controls

| Threat | Control | State |
|---|---|---|
| False-green receipt | dedicated receipt schema + evidence required | implemented |
| Tool output leaks token | secret-pattern redaction | implemented |
| Prompt injection through tool output | untrusted-output marker | implemented |
| Confused deputy | capability principal/task/execution binding | implemented |
| Capability widening | parent narrowing rule | existing 2.0 |
| Mailbox duplicate side effect | target process lock + ack after side effect | implemented |
| Mailbox overload | target queue + message-size bounds | implemented |
| Scheduler starvation | bounded aging + lane fairness | implemented |
| Scheduler overload | global active-task bound | implemented |
| Unsafe preemption | recommendation only; recovery gate required | implemented |
| Journal tamper after snapshot | rolling event digest + snapshot hash | implemented |
| Authority-record tamper | HMAC anchor | implemented locally |
| Signing-key theft | local file mode 0600 | partial; host compromise remains |
| Cross-node split brain | not solved by one-host file locks | residual |
| External anchor rollback | no external immutable anchor selected | residual |
| Secret rotation/revocation lifecycle | ephemeral lease + TTL + revoke + execution-scoped capability binding | implemented locally |
| Malicious binary/tool output | text trust-boundary sanitizer only | residual |

## Residual risks

The 2.1 hardening is explicitly **single-host process-safe**, not a distributed consensus system. File locks do not provide cross-node mutual exclusion. External immutable anchoring and full secret-provider lifecycle remain future work.


## Secret lifecycle boundary

The 2.1 runtime now supports policy-gated ephemeral secret leases and explicit revocation. Secret values are never part of Journal/receipt metadata, and access requires a task/execution capability named `secret:<SECRET_NAME>`.

Residual: a managed external secret service with organizational rotation/audit policy is not selected. The current `EnvSecretProvider` is explicitly mapped and single-host; it is not a replacement for Vault/OpenBao/cloud secret managers.
