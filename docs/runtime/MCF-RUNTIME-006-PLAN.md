# MCF-RUNTIME-006 — Plano canônico

## 1. Objetivo

Expandir o MCF para execução real governada por contratos de permissão, evidência verificável, recuperação, observabilidade, handoffs persistentes e gates proporcionais ao risco.

## 2. Invariantes

```yaml
source_of_truth: GitHub
human_final_authority: Leandro
orchestrator: Mestre
internal_gate_authority: Leo
human_delegation_firewall: ACTIVE
success_without_evidence: FORBIDDEN
stale_sha_gate_evidence: FORBIDDEN
team_first: REQUIRED
production: BLOCKED
live_staging_adapter: DISABLED
gate_c_real_provider_write: NOT_AUTHORIZED
```

## 3. Estado canônico

```yaml
skills_registered: 16
skills_executable: 16
skills_documental: 0
remaining_documental: []
canonical_sync_lot_4e: COMPLETE
```

## 4. Roadmap

| Boundary | Situação |
|---|---|
| Fundação / estabilização | COMPLETE |
| Gate A — contrato comum de adapters | COMPLETE |
| Gate B — leitura externa | COMPLETE |
| A1 — Code Review Read Only | COMPLETE |
| A2 — CI Query Read Only | COMPLETE |
| C1/C2 — escrita reversível | IMPLEMENTED |
| Gate C — real provider write | PARTIAL / NOT AUTHORIZED |
| Gate D — staging | COMPLETE |
| Observabilidade | COMPLETE |
| Lot 4-A — Recover/Product/UX/Architecture | COMPLETE |
| Lot 4-B — Evaluate Agents | COMPLETE |
| Lot 4-C — Security Review | COMPLETE |
| Lot 4-D — Debug Incident | COMPLETE |
| Lot 4-E — `MCF-CLOSE-PHASE` | COMPLETE |
| Release Candidate / Gate E | NEXT BOUNDARY |
| Produção | BLOCKED |

## 5. Lot 4-E — Close Phase

```yaml
mission: MCF-RUNTIME-006-LOT-4-E-CLOSE-PHASE
issue: 107
risk_class: C
baseline_main: 39d2a8b3f1c323792fff9cbcc140d5f2bddc1522
technical_pr: 108
technical_candidate: 3b202d26b08d8acb72538db77e0e3b86d540dc97
technical_merge: 6cf9af35407b97d84028078ab6843570b47103fe
technical_tree_equivalence: PASS
canonical_pr: 109
canonical_candidate: 7d571a4a19234b5e479b4e3b615e07ebb81d29a3
canonical_merge: d0f4624a1c4f4b31eb625ddadadf523a4578b972
canonical_sync: COMPLETE
```

### Skill

```yaml
skill_id: MCF-CLOSE-PHASE
primary_owner: Carmem
owners: [Carmem, Emily, Leo, Mestre]
required_inputs: [phase_execution, acceptance_results]
permission_profile: SCOPED_WRITE
planner_state: READY_AGENT
provider: internal
operation: close-phase
resource: mcf-agent-runtime
handoff_to: Mestre
required_evidence: [phase_pack, audit_verdict, leo_decision, checkpoint]
acceptance_criteria: [traceability_complete, objective_state_truthful]
```

### Boundary

```yaml
external_write: FORBIDDEN
github_provider_write: FORBIDDEN
environment_mutation: FORBIDDEN
deploy: FORBIDDEN
production_action: FORBIDDEN
destructive_action: FORBIDDEN
secret_access: FORBIDDEN
public_action: FORBIDDEN
leandro_as_technical_executor: FORBIDDEN
leandro_as_technical_handoff: FORBIDDEN
```

### Verdade do closeout

`ENTREGUE` exige simultaneamente:

- objetivo atendido;
- zero blocker no checkpoint;
- zero finding não resolvido;
- zero finding bloqueante da auditoria independente;
- verdict da auditoria `PASS`/`PASSED`;
- nenhuma próxima ação pendente;
- `human_action_required=false`;
- decisão explícita e aprovadora de Léo;
- estado seguinte de Léo igual ao estado final do checkpoint.

`leo_decision.responsible=Leandro` só é aceito quando a decisão é explicitamente `ESCALAR_PARA_LEANDRO`. Isso representa HUMAN_GATE e nunca substitui o handoff técnico, que permanece para Mestre.

## 6. Evidência técnica final

```yaml
final_candidate: 3b202d26b08d8acb72538db77e0e3b86d540dc97
foundation_run: 31485695643
foundation: PASS
container_smoke_run: 31485695636
container_smoke: PASS
documentation_validation_run: 31485695606
documentation_validation: PASS
server_test_files: 125
server_tests: 562
ops_tests: 20
web_tests: 5
failed_tests: 0
close_phase_executor_tests: 28
close_phase_planner_tests: 4
close_phase_mission_runtime_tests: 2
hdf_tests: 11
vitest_artifact: 9099033106
artifact_digest: sha256:0a7893b7f4eb7e84c2d8b85c68b94cfb9eb23edb34df4f620f354cf1d56803db
prf_manifest_audit_run: 31485724987
prf_manifest_audit: PASS
sofia_architecture: PASS
renato_validation: PASS
augusto_trace: PASS
carmem_prf: PASS
julia_governance: PASS
emily_independent_audit: PASS
leo_technical_gate: PASS
technical_merge: COMPLETE
technical_tree_equivalence: PASS
technical_post_merge_documentation_run: 31486181380
technical_post_merge_documentation: PASS
technical_post_merge_staging_run: 31486181369
technical_post_merge_staging: PASS_DEPLOYED
```

## 7. Canonical documentation sync

```yaml
documentary_pr: 109
documentary_candidate: 7d571a4a19234b5e479b4e3b615e07ebb81d29a3
documentation_validation_run: 31486782247
documentation_validation: PASS
documentary_manifest_audit_run: 31486845037
documentary_manifest_audit: PASS
carmem_review: PASS
julia_governance: PASS
emily_independent_audit: PASS
leo_documentary_gate: PASS
documentary_merge: d0f4624a1c4f4b31eb625ddadadf523a4578b972
post_merge_documentation_run: 31487031172
post_merge_documentation: PASS
canonical_sync: COMPLETE
```

## 8. CAFs do Lot 4-E

1. bootstrap inicial falhou antes de mutação; o mecanismo foi substituído antes de reexecução;
2. formatação corrigida pelo Prettier pinado do repositório;
3. `PASS` de audit verdict foi aceito somente como valor de controle contextual, sem enfraquecer a rejeição de placeholders;
4. hardening passou a rejeitar `ENTREGUE` com finding bloqueante ou auditoria não-PASS;
5. hardening passou a impedir Leandro como responsável técnico implícito;
6. nenhum resultado de SHA supersedido foi usado como gate final;
7. o estado documental pós-merge foi reconciliado separadamente para remover os marcadores `IN_PROGRESS/CANDIDATE`.

## 9. Próximo boundary

**Release Candidate / Gate E**.

O Lot 4-E está concluído. Isso não autoriza produção. Produção permanece `BLOCKED` até gate material próprio.