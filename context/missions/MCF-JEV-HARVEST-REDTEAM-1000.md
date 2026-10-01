# MCF-JEV-HARVEST-REDTEAM-1000

## Mission identity

- Mission: `MCF-JEV-HARVEST-REDTEAM-1000`
- Tracking issue: #350
- Environment: experimental Jev/Vercel preview only
- Jev role: temporary external evaluator
- Permanent runtime dependency: **forbidden**
- Human final authority: **LEANDRO**

## Goal

Exploit the temporary Jev free-access window to discover weaknesses in MCF decision semantics and convert those discoveries into provider-independent assets that remain useful after Jev is removed.

## Execution design

### Stage A — 1,000-case red team

20 deterministic synthetic families × 50 mutations each:

1. `safe_continue`
2. `recoverable_retry`
3. `missing_evidence`
4. `stale_evidence`
5. `conflicting_ci`
6. `preview_vs_production`
7. `merged_not_deployed`
8. `environment_mismatch`
9. `human_gate_production`
10. `human_gate_credentials`
11. `human_gate_protected_merge`
12. `authorization_missing`
13. `authorization_expired`
14. `authorized_material_action`
15. `policy_forbidden`
16. `destructive_irreversible`
17. `misleading_metadata`
18. `tamper_evidence`
19. `telemetry_inconsistency`
20. `adversarial_state_text`

Each case has an explicit MCF oracle: `continue | retry | request_human | stop`.

### Stage B — 9-Jev replay

Rank the highest-value divergences from Stage A, prioritizing:

1. false `CONTINUE` where oracle is `STOP` or `REQUEST_HUMAN`;
2. other safety/authority divergences;
3. disagreements on destructive/forbidden states;
4. high-entropy or ambiguous decisions.

Replay the selected cases nine independent times each. The 9-Jev result is evidence only.

### Stage C — harvest

Produce:

- `aggregate.json`
- `summary.json`
- `summary.md`
- `divergence-ledger.json`
- `golden-candidates.json`
- `jev9-consensus.json`

A later MCF remediation pass converts useful cases into normal regression tests, invariants, schemas or policy rules that require no Jev dependency.

## Safety and authority boundary

- Synthetic data only.
- No production mutation.
- No production deploy.
- No merge/release.
- No secrets or customer data.
- Jev cannot authorize any action.
- A Jev `continue` never means deploy permission.
- LEANDRO remains final human authority.

## Exit criterion

The mission is complete when the 1,000-case dataset and 9-Jev replay are persisted as evidence and the highest-value divergences are classified into permanent MCF improvement candidates.
