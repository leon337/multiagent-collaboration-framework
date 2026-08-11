# PHASE-006-LOT-4-E-CLOSE-PHASE — Plan

## Mission

`MCF-RUNTIME-006-LOT-4-E-CLOSE-PHASE`

Issue: `#107`  
Baseline: `main@39d2a8b3f1c323792fff9cbcc140d5f2bddc1522`  
Risk class: `C`

## Objective

Promote `MCF-CLOSE-PHASE` from a documental contract to a governed runtime capability that consolidates closeout evidence, validates truthful terminal state, requires an explicit Léo gate decision, emits a checkpoint and hands the result back to Mestre without delegating technical execution to LEANDRO.

## Source of truth

- `skills/registry.yaml`
- `docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md`
- `docs/runtime/MCF-RUNTIME-006-PLAN.md`
- Issue `#107`

## Scope

- add `MCF-CLOSE-PHASE` to executable runtime contracts;
- route explicit close-phase intent as `READY_AGENT`;
- primary planner owner Carmem;
- preserve owners Carmem, Emily, Leo and Mestre;
- restrict this increment to internal provider / `close-phase` / `mcf-agent-runtime`;
- require semantic `phase_pack`, `audit_verdict`, `leo_decision`, `checkpoint` evidence;
- reject fabricated `ENTREGUE` with pending action, blocker, unresolved finding or unapproved gate;
- reconcile `handoff_to: Leandro` to `handoff_to: Mestre`;
- preserve Human Delegation Firewall;
- persist receipt, evidence, events, phase completion and Mestre handoff through MissionRuntime;
- add unit/planner/integration regression coverage;
- produce a Class C PRF.

## Out of scope

- production release;
- Release Candidate / Gate E approval;
- Gate C real provider write authorization;
- real deploy/redeploy/rollback;
- external publication;
- changes to reserved HUMAN_GATE triggers.

## Acceptance criteria

```yaml
skills_registered: 16
skills_executable_target: 16
skills_documental_target: 0
planner_state: READY_AGENT
primary_owner: Carmem
valid_owners: [Carmem, Emily, Leo, Mestre]
handoff_to: Mestre
leandro_as_technical_executor: FORBIDDEN
semantic_closeout_evidence: REQUIRED
false_delivered_state: REJECTED
mission_runtime_persistence: REQUIRED
foundation_exact_head: PASS_REQUIRED
container_smoke_exact_head: PASS_REQUIRED
prf_class_c: REQUIRED
specialist_reviews: PASS_REQUIRED
augusto_trace: PASS_REQUIRED
julia_governance: PASS_REQUIRED
emily_independent_audit: PASS_REQUIRED
leo_gate: PASS_REQUIRED
production: BLOCKED
live_staging_adapter: DISABLED
gate_c_real_provider_write: NOT_AUTHORIZED
human_operator_actions_target: 0
```

## Execution flow

Mestre → Miriam → Sofia → implementation → Renato → Augusto → Carmem → Julia → Emily → Léo → Mestre.

## Validation strategy

1. exact-head Foundation;
2. exact-head Container Smoke;
3. focused close-phase tests;
4. full server regression suite;
5. Class C PRF manifest audit;
6. specialist review and mission trace;
7. governance review;
8. independent audit;
9. Léo technical gate;
10. expected-head protected integration only after all gates pass.

No success will be inferred from an action alone. Every gate remains bound to the exact candidate SHA.