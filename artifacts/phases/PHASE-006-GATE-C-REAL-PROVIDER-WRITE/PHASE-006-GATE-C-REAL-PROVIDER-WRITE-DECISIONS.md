# PHASE-006-GATE-C-REAL-PROVIDER-WRITE — Decisions

## D-001 — Leandro authorizes controlled Gate C closure work

**Decision:** Execute the real, controlled and reversible GitHub provider proof needed to close Gate C before Gate E.

**Boundaries:** production blocked; no public release; no destructive action.

## D-002 — Mestre isolates real-provider proof

**Decision:** Use a dedicated proof workflow with minimum scoped permissions and an explicit trigger rather than broad automatic real writes.

## D-003 — C2 live registry gap is blocking debt

**Finding:** C2 adapter existed but was not present in the runtime live `AdapterRegistry`.

**Decision:** Wire C2 and add a composition regression before accepting Gate C.

## D-004 — HUMAN_GATE for GitHub Actions PR policy

**Finding:** C1 could create a branch but `GITHUB_TOKEN` could not create the required PR.

**Decision:** Escalate only the repository policy change to Leandro. Leandro enabled the policy and confirmed completion.

## D-005 — Full proof must use canonical mission lifecycle

**Finding:** A direct `SkillExecutor` harness omitted `persistExecution()` between phases.

**Decision:** Move proof sequencing to `MissionRuntimeService` plus canonical repositories.

## D-006 — External proof timeout is bounded separately

**Finding:** Vitest default 5 s timeout was too short for a multi-request live provider proof.

**Decision:** Use a 30 s test timeout only for the dedicated external proof. Runtime timeout and job boundary remain unchanged.

## D-007 — Transient C1 read-back weakness requires hardening

**Finding:** GitHub branch creation succeeded, but a transient post-write GET could produce `PARTIAL/UNKNOWN CREATE_BRANCH`.

**Decision:** Preserve single-shot mutation POSTs and add bounded GET-only reconciliation.

## D-008 — Post-write authentication loss must remain UNKNOWN

**Emily/Júlia finding:** After a successful write, loss of credentials before read-back could otherwise surface as a common authentication failure even though the external effect might exist.

**Decision:** Treat post-write read-back inability as ambiguous unless a semantic conflict is proven. Add permanent regressions for branch and PR. Never retry the mutation.

## D-009 — Final real-provider acceptance

**Evidence:** Run `31537057206` passed full C1+C2 and isolated C2 on `f50365eae53c54c0c5b3e929b52f0fe85c1ba4f4`. Artifact `9119190464` is `stage: COMPLETE`.

**Decision:** Real provider acceptance criteria are met.

## D-010 — Remove temporary proof infrastructure

**Decision:** Remove proof trigger, write-capable workflow and both live-provider harness files before merge. Permanent regression tests and PRF evidence remain.

**Evidence:** Compare `f50365e...` → `18f30d47...` contains exactly four removals and no permanent runtime code change. Foundation `31537421860` and Container Smoke `31537421887` pass on the hygiene candidate.

## D-011 — Emily/Júlia audit

**Decision:** `PASS`.

```yaml
blocking_findings: 0
runtime_security: PASS
governance: PASS
fail_safe_unknown_semantics: PASS
temporary_write_path_cleanup: PASS
```

## D-012 — Léo technical gate

**Decision:** `APPROVE_TECHNICAL_GATE_C`.

```yaml
next_state: APPROVED_AWAITING_MERGE
responsible: Mestre
production: BLOCKED
```

## D-013 — Canonical closure remains post-merge

**Decision:** Do not mark Gate C `ENTREGUE` in canonical `main` until PR #112 is merged and a separate documentation sync verifies the resulting main SHA. Gate E remains the next boundary; production remains blocked.
