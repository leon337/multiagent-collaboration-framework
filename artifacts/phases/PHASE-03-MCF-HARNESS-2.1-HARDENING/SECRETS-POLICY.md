# Secrets Policy — MCF Harness V2.1

1. Secret **values** must not be embedded in Mission Journal, capability tokens, receipts or prompts.
2. Only secret **references/names** may cross the runtime boundary.
3. A task receives a secret reference only when its policy allowlists that exact name.
4. Tool output is sanitized for common credential forms before it can be forwarded to cognitive context.
5. Detected secret values are replaced with typed redaction markers.
6. Capability tokens never authorize arbitrary environment-variable access.
7. Local signing keys use mode `0600`.
8. Secret rotation, provider-backed retrieval and revocation are outside this phase and remain residual hardening work.
