# PHASE-01 Decisions

1. LEANDRO approved building the interface manual with the four-agent team.
2. Sofia: semantic identity is stable; locator strategy versioned; observation ephemeral.
3. Emily: critical ambiguity must fail closed; post-action evidence is mandatory for action claims.
4. Patrícia: stale selectors that still point to a different node are more dangerous than NOT_FOUND; fresh re-resolution is mandatory.
5. Rafael: manual must be registry/contract, not a second workflow/lifecycle engine.
6. MESTRE: account-specific project hrefs/IDs stay in local 0600 bindings, not in the generic repository.
7. MESTRE: `chatgpt.composer.submit` is stateful and can be `unavailable`.
8. R1 smoke failure is preserved as evidence; contract/test were corrected rather than hiding the failure.
9. R2 read-only semantic smoke passed 44/44.
10. Fresh-chat creation is intentionally deferred until after this manual phase is audited and closed.

11. Emily R1: PASS; Critical=0, High=0; two non-blocking Medium consistency findings and one Low traceability finding.
12. MESTRE accepted the findings and remediated all three before merge.
13. Contract version advanced to 1.0.1 because locator/state metadata changed without changing semantic IDs.
14. Smoke R3 passed 44/44 against contract v1.0.1.
