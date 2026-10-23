# PHASE-MCF-TRUST-BOUNDARY-RESEARCH-001

- **Mission:** MCF-TRUST-BOUNDARY-RESEARCH-001
- **Issue:** #469
- **Class:** C
- **State:** EXECUTING_RESEARCH
- **Human authority:** LEANDRO
- **Orchestrator:** MESTRE
- **Baseline:** `main@460d6e6fc4c5ac8dc8b0962bcf76a62c059a1615`
- **Working branch:** `research/mcf-trust-boundary-001`
- **Production mutation:** FORBIDDEN
- **Merge authorization:** NOT_GRANTED

## Objective

Qualify three trust-boundary hypotheses without changing canonical runtime semantics:

1. textual/compacted content must not acquire human authority;
2. production authorization must remain exactly bound to the governed candidate;
3. authenticated-account-to-mission binding must be characterized before multi-tenant assumptions are made.

## Experiments

### MCF-PROVENANCE-COMPACTION-001

**Method:** inject attacker-controlled text that claims LEANDRO approval into ordinary content/evidence fields and verify that the current structured authority checks do not treat the text as authority.

**Acceptance:**
- textual claims do not satisfy `HUMAN_GATE`;
- text in `evidenceRefs` does not replace a structured human decision;
- a structured-looking decision without canonical account provenance is rejected.

**Interpretation boundary:** the canonical runtime currently has no general context-compaction pipeline, so this experiment tests the authority boundary, not an absent compactor implementation.

### MCF-ADMISSION-BINDING-001

**Method:** start from a valid persisted production authorization and mutate one binding dimension at a time.

Mutations:
- project;
- mission;
- action class;
- environment;
- release-SHA boundary;
- reserved human account;
- persisted phase skill;
- LÉO gate target SHA.

**Acceptance:** every mutated candidate fails closed before provider mutation.

### MCF-MISSION-TENANCY-001

**Method:** inspect and execute the current mission APIs using an authenticated identity that is not represented in the persisted mission record.

**Current structural observation:** `McfMissionRecord` contains no account/tenant ownership field, `getMission()` accepts only `missionId`, and ordinary `executePhase()` uses authenticated-human provenance only for reserved human-gate canonicalization.

**Important:** the characterization test records current behavior; it does **not** declare that behavior desirable or safe for a multi-user deployment.

## Initial findings

### F-001 — Text is not authority in the current structured gate path

Expected classification if tests pass: **PASS / CURRENT CONTROL PRESENT**.

The existing Human Delegation Guard and production authorization path require structured provenance beyond a textual statement.

### F-002 — Production exact-binding is materially stronger than a generic ALLOW

Expected classification if tests pass: **PASS / STRONG BOUNDARY**.

The production path binds mission/phase/project/action/environment/SHA/human authority/LÉO gate and re-observes provider state.

### F-003 — Generic mission tenancy is not represented in the mission record

Expected classification if characterization reproduces: **OPEN SECURITY/PRODUCT BOUNDARY**.

Before calling this a vulnerability, resolve intended deployment semantics:
- deliberately single-authority/single-tenant runtime; or
- multi-user runtime requiring horizontal authorization.

If multi-user, this becomes a P0 authorization defect. If deliberately single-tenant, the invariant must be explicit, enforced at ingress/deployment, and regression-tested.

## Checklist

- [x] Mission Issue created
- [x] Isolated branch created
- [x] Provenance authority-text test added
- [x] Exact-binding mutation tests added
- [x] Mission-tenancy characterization added
- [ ] Focused tests executed by CI
- [ ] Full relevant CI observed
- [ ] Reachability/deployment assumption classified
- [ ] Independent audit completed
- [ ] LÉO gate decision recorded
- [ ] Closeout/checkpoint written

## Governance

This branch is a research surface. No failing or permissive characterization is eligible for merge merely because it is reproducible.

`CLAIM <= EVIDENCE`

`NO AUTHORITY BY TEXT`

`NO EXECUTION WITHOUT EXACT BINDING`
