# PHASE-MCF-TRUST-BOUNDARY-RESEARCH-001

- **Mission:** MCF-TRUST-BOUNDARY-RESEARCH-001
- **Issue:** #469
- **Class:** C
- **State:** RESEARCH_COMPLETE / INTEGRATION_BLOCKED
- **Human authority:** LEANDRO
- **Orchestrator:** MESTRE
- **Baseline:** `main@460d6e6fc4c5ac8dc8b0962bcf76a62c059a1615`
- **Qualified research head:** `6e79bd00b2e3058d9f5b71d57de663718ce8d432`
- **Working branch:** `research/mcf-trust-boundary-001`
- **Draft PR:** #470
- **Follow-up:** #471
- **Production mutation:** NONE
- **Merge authorization:** NOT_GRANTED

## Objective

Qualify three trust-boundary hypotheses without changing canonical runtime semantics:

1. textual/compacted content must not acquire human authority;
2. production authorization must remain exactly bound to the governed candidate;
3. authenticated-account-to-mission binding must be characterized before multi-tenant assumptions are made.

## Exact qualification evidence

Dedicated workflow:

- workflow: `MCF Trust Boundary Research`
- run: `39897827058`
- head: `6e79bd00b2e3058d9f5b71d57de663718ce8d432`
- formatting: **PASS**
- targeted test file: **1 PASS**
- targeted tests: **13/13 PASS**
- provider mutation: **NONE**

The broad repository workflows are not usable as a clean verdict for this mission because the current baseline contains known unrelated blockers. On the research PR they failed before the normal test phase due to:

- pre-existing syntax error in `agent-execution.contracts.test.ts`;
- pre-existing type errors in `provider-adapter.registry.ts`;
- dependency audit findings already tracked by Issue #427.

PR #470 changes only:

1. `.github/workflows/mcf-trust-boundary-research.yml`;
2. `apps/rede-social-agentes/apps/server/src/mcf-runtime/trust-boundary-research.test.ts`;
3. this phase artifact.

Therefore the dedicated exact-head workflow is the admissible focused evidence for the three experiments, while Issue #427 remains the blocker for broad repository qualification.

## Experiment 1 — MCF-PROVENANCE-COMPACTION-001

### Result: PASS — current structured authority path resists authority-by-text

Verified cases:

- attacker-controlled text containing `LEANDRO approved` does not satisfy a `HUMAN_GATE`;
- fake authority claims inside `evidenceRefs` do not replace a structured human gate decision;
- a structured-looking approval without canonical account provenance is rejected.

### Architectural interpretation

The current canonical runtime does not contain a general context-compaction pipeline. This experiment therefore proves the **authority boundary**, not safety of a compactor that does not exist.

The remaining NextGen/DSH concern stands: any future compaction or cognitive execution path must preserve typed provenance and may not translate external text into human authority.

**Finding F-001:** `NO_AUTHORITY_BY_TEXT` is supported by current structured gates.

## Experiment 2 — MCF-ADMISSION-BINDING-001

### Result: PASS — production boundary fails closed under candidate mutation

Starting from a valid persisted production authorization, the test mutated each dimension independently:

- project;
- mission;
- action class;
- environment;
- exact release-SHA boundary;
- reserved human account;
- persisted phase skill;
- LÉO gate target SHA.

All mutated candidates were rejected.

### Architectural interpretation

The production path is materially stronger than a generic boolean `ALLOW`. It binds persisted human provenance and LÉO gate evidence to the governed mission/phase and exact SHA.

**Finding F-002:** `NO_EXECUTION_WITHOUT_EXACT_BINDING` is supported for the current production-promotion boundary.

This finding must **not** be generalized automatically to every `SCOPED_WRITE`, `SENSITIVE_CONTROLLED` or `HUMAN_GATE` path.

## Experiment 3 — MCF-MISSION-TENANCY-001

### Result: CHARACTERIZATION CONFIRMED — account ownership is not part of the current mission model

The test reproduced both current behaviors:

1. `getMission(missionId)` has no authenticated-account operand at the service boundary;
2. ordinary `executePhase(..., authenticatedHuman)` does not bind the supplied authenticated human identity to ownership of the persisted mission.

The persisted `McfMissionRecord` contains no `ownerAccountId` or `tenantId`.

### Security interpretation

This is a **real architectural gap**, but exploit severity depends on reachable deployment semantics.

- If MissionRuntime is deliberately single-authority/single-tenant, that invariant must be explicit and mechanically enforced at ingress/deployment.
- If more than one ordinary authenticated human can reach MissionRuntime, the finding becomes horizontal-authorization exposure and should be treated as P0.

The follow-up design issue is **#471 — MCF-MISSION-TENANCY-002**.

**Finding F-003:** account ↔ mission tenancy binding is **NOT IMPLEMENTED** in the inspected runtime boundary.

## Governance conclusions

### Preserved

- LEANDRO remains final human authority.
- Production exact-SHA authorization remains unchanged.
- Cognitive Ledger write boundary remains unchanged/read-only from the inspected MCF capability.
- No provider or production mutation occurred.
- No NextGen Authority Envelope was implemented.
- No runtime semantics were changed by this research branch.

### Not authorized by this mission

- merge of PR #470;
- tenancy schema migration;
- generic Authority Envelope implementation;
- production deployment;
- public release;
- weakening of Issue #427 dependency/security gates.

## Checklist

- [x] Mission Issue created
- [x] Isolated branch created from exact baseline
- [x] Provenance authority-text tests added
- [x] Exact-binding mutation tests added
- [x] Mission-tenancy characterization added
- [x] Dedicated exact-head CI created
- [x] Research-file formatting PASS
- [x] 13/13 targeted tests PASS
- [x] Broad CI blockers separated from mission diff
- [x] Tenancy finding preserved in follow-up Issue #471
- [ ] Independent named-agent audit with attributable execution evidence
- [ ] LÉO integration gate
- [ ] Merge authorization
- [ ] Any runtime hardening implementation

## Checkpoint

```yaml
mission: MCF-TRUST-BOUNDARY-RESEARCH-001
state: RESEARCH_COMPLETE
integration_state: BLOCKED
qualified_head: 6e79bd00b2e3058d9f5b71d57de663718ce8d432
targeted_tests: 13
targeted_tests_passed: 13
provenance_text_authority: PASS_FAIL_CLOSED
production_exact_binding: PASS_FAIL_CLOSED
mission_tenancy_binding: NOT_IMPLEMENTED
follow_up_issue: 471
baseline_ci_blocker: 427
merge_authorized: false
production_touched: false
next_action: decide tenancy contract before authorizing runtime hardening
```

`CLAIM <= EVIDENCE`

`NO AUTHORITY BY TEXT`

`NO EXECUTION WITHOUT EXACT BINDING`
