# Secrets Policy — MCF Harness V2.1

1. Secret **values** must not be embedded in Mission Journal, capability tokens, receipts or prompts.
2. Only secret **references/names** may cross the runtime boundary.
3. A task receives a secret reference only when policy allowlists the exact name.
4. Secret access for an execution additionally requires a capability named `secret:<SECRET_NAME>` bound to the same agent, task and execution.
5. Arbitrary environment-variable lookup is denied; providers expose only explicit name → source mappings.
6. Secret values are acquired through ephemeral `SecretLease` buffers.
7. A lease supports TTL expiry, explicit revoke and best-effort overwrite of its mutable buffer on close. This is not a guarantee that all Python string copies are erased from process memory.
8. Audit records contain provider/name/version/timestamps only and declare `value_persisted=false`.
9. Tool output is sanitized for common credential forms before it can be forwarded to cognitive context.
10. Detected values are replaced with typed redaction markers; suspicious instruction-like tool output is marked untrusted.
11. Capability tokens never contain secret values.
12. Local signing/provider keys use restricted filesystem permissions where applicable.

## Current provider

`EnvSecretProvider` is an explicitly mapped single-host provider used to validate the lifecycle. It is not arbitrary environment access.

## Residual risk

A managed organizational secret service such as OpenBao/Vault/cloud secret management is **not** selected by this phase. Provider-level rotation, centralized revocation, cross-host policy and organization-wide audit remain future integration work.

The MCF lifecycle contract is ready for such a provider without changing the rule that secret values must not enter Journal, receipts or prompts.
