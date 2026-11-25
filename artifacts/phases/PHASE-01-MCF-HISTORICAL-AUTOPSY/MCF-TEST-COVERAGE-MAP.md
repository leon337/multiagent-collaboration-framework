# MCF runtime — test evidence map

**Snapshot:** main SHA 460d6e6fc4c5ac8dc8b0962bcf76a62c059a1615.  
**Method:** GitHub tree inspection and static reading of selected test files. None of these tests was executed by this audit.

## Inventory

The repository tree has 1,567 entries. Under apps/rede-social-agentes/apps/server/src/mcf-runtime there are 189 TypeScript/TSX files and 126 test/spec files. This is a file inventory, not a coverage percentage or a count of passing tests.

## Test-to-contract mapping

| Control | Test file | Blob SHA | What the source asserts | Not proven by file existence |
|---|---|---|---|---|
| Signed receipt integrity | evidence-validator.test.ts | ebc8b542bf52ea8aef22b8c79b3a4c88c59c2e55 | Accepts an untampered signed receipt; rejects metadata altered after signing; requires GitHub workflow-run and commit identifiers. | Test passes on current HEAD, key handling, every provider's receipt format. |
| Durable external-action lifecycle | external-action-ledger.integration.test.ts | 5e45f4e095327f5a65c573c47beb6b8c4b12c79f | Persists requested/allowed events before execution; rejects a stale mission version without reserving an attempt. | Live persistence works in deployment; every migration/provider combination passes. |
| Ambiguous post-write outcome | external-action-postwrite-unknown.integration.test.ts | abdbd1b1fe2558d56560b33dd694cadff261fc17 | An expired EXECUTING attempt becomes UNKNOWN without releasing its global binding. | Remote postcondition can be reconciled for every integration. |
| Read-only vs write | skill-executor.external-action.test.ts | 6e965e05486e184fafb97c2c54ac9e49d30f89b1 | A registered read-only adapter is receipt-validated; adapter failure does not fabricate evidence; READ_AND_PROPOSE rejects persistent writes before the adapter executes; attempt reservation precedes execution. | Every route and every provider enforces the same restriction. |
| Idempotency | github-branch-pr.idempotency.integration.test.ts | b2444c68dafe3bd79aea21e80fe42980611e987f | Rejects concurrent callbacks and changed-input key reuse; permits compatible replay; checks SHA-256 fingerprints. | All external APIs are idempotent or duplicates are impossible everywhere. |
| Authority provenance | mission-runtime.authority-provenance.test.ts | a88dd175748559df4aa84afcaf73c80953ec0657 | Separates authenticated identity from caller input; authority sourceRef is server-derived; a second account self-claiming the reserved human authority receives 403 without executor invocation. | Full endpoint/role matrix and live identity configuration. |
| Human stop/control | human-control-policy.test.ts | 71af52693b5d3d53d0e7ec968621f9c39ce3e116 | A non-authority actor does not receive the gate; the policy builds a paused checkpoint. | End-to-end pause/cancel propagation across every provider and resume route. |
| No real external write in provider test | github-branch-pr.no-real-write.test.ts | 833d7fbb3bad373a034924573ccb1447564d897f | Dependency injection allows testing without a real GitHub write. | Production tokens/scopes or deployed provider behavior. |

## CI status and validation order

The latest completed MCF Production Readiness run consulted during this audit, run 38340672550, failed after frozen-lockfile install at the dependency vulnerability gate. It reported 27 findings: 16 moderate, 10 high and 1 critical. Test/build gates later in that workflow were skipped, not passed.

Source: https://github.com/leon337/multiagent-collaboration-framework/actions/runs/38340672550  
Tracking issue: https://github.com/leon337/multiagent-collaboration-framework/issues/427

Recommended order:
1. Remediate the vulnerability set on its separate tracked branch without weakening the audit.
2. Rerun dependency audit and preserve lockfile provenance.
3. Execute the focused receipt, authority, read-only, idempotency and UNKNOWN recovery tests on an identified SHA.
4. Run persistence and migration integration tests in an isolated environment.
5. Probe denied writes with external side effects mocked or blocked.
6. Link every reported outcome to the actual runner result; keep skipped steps as NOT RUN.
7. Compare tested source SHA with deployment SHA before making live-runtime claims.

## Conclusion

The repository contains targeted tests for security and execution-state contracts. That is evidence of intended verification, not proof of passing status. Do not infer that the MCF is production-ready while the readiness gate is blocked and the downstream tests are unexecuted.