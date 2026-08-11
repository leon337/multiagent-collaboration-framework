# PHASE-006-GATE-C-REAL-PROVIDER-WRITE — Decisions

## D-001 — Leandro authorizes controlled Gate C closure work

**Decision:** Execute the real, controlled and reversible GitHub provider proof needed to close Gate C before Gate E.

**Boundaries:** production blocked; no public release; no destructive action.

## D-002 — Mestre isolates real-provider proof

**Decision:** Use a dedicated proof workflow with minimum scoped permissions and an explicit trigger rather than broad automatic real writes.

## D-003 — C2 live registry gap is a blocking debt

**Finding:** C2 adapter existed but was not present in the runtime's live `AdapterRegistry`.

**Decision:** Wire C2 and add a composition regression before accepting Gate C.

## D-004 — HUMAN_GATE for GitHub Actions PR policy

**Finding:** C1 could create a branch but `GITHUB_TOKEN` could not create the required PR.

**Decision:** Escalate only the repository policy change to Leandro. Leandro enabled the policy and confirmed completion.

## D-005 — Real C2 proof accepted

**Evidence:** Real controlled comment on PR #112 by `github-actions[bot]`, with read-back, receipt, ledger and duplicate prevention.

## D-006 — Full proof must use canonical mission lifecycle

**Finding:** A direct `SkillExecutor` harness omitted `persistExecution()` between phases.

**Decision:** Move proof sequencing to `MissionRuntimeService` + canonical repositories.

## D-007 — External test timeout is bounded separately

**Finding:** Vitest's default 5 s timeout was too short for a multi-request live provider proof.

**Decision:** Use a 30 s test timeout only for the dedicated external proof. Runtime timeout and job boundary remain unchanged.

## D-008 — Transient C1 read-back weakness requires code correction

**Finding:** GitHub branch creation succeeded, but one transient post-write GET caused `PARTIAL/UNKNOWN CREATE_BRANCH`.

**Decision:** Preserve single-shot mutations and add bounded GET-only reconciliation. Preserve `UNKNOWN` when proof cannot be recovered.

## D-009 — Cycle 11 technical acceptance

**Evidence:** Run `31535822880` passed full C1+C2 and isolated C2. Artifact `9118718153` is `stage: COMPLETE`.

**Decision:** Technical acceptance criteria are met; proceed to independent audit.

## D-010 — Emily audit

**Status:** PENDING.

## D-011 — Léo gate

**Status:** PENDING.
