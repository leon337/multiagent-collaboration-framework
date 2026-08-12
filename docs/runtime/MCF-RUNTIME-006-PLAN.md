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
stable_v1_0_0: BLOCKED
live_staging_adapter: DISABLED
gate_c_mutation_retry: NEVER
gate_c_unprovable_postwrite_state: PARTIAL_UNKNOWN
```

## 3. Estado canônico

```yaml
skills_registered: 16
skills_executable: 16
skills_documental: 0
remaining_documental: []
canonical_sync_lot_4e: COMPLETE
gate_c_technical_merge: 0b060539eb152f0cf92bd146b853562407ab0a64
gate_c_canonical_state: COMPLETE
gate_c_mission_state: ENTREGUE
gate_e: COMPLETE
release_candidate: v1.0.0-RC1
release_candidate_state: PUBLISHED_PRERELEASE
release_target: 9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8
production: BLOCKED
stable_v1_0_0: BLOCKED
```

## 4. Roadmap

| Boundary | Situação |
|---|---|
| Fundação / estabilização | COMPLETE |
| Gate A — contrato comum de adapters | COMPLETE |
| Gate B — leitura externa | COMPLETE |
| A1 — Code Review Read Only | COMPLETE |
| A2 — CI Query Read Only | COMPLETE |
| C1/C2 — escrita reversível | COMPLETE |
| Gate C — real provider write | COMPLETE |
| Gate D — staging | COMPLETE |
| Observabilidade | COMPLETE |
| Lot 4-A — Recover/Product/UX/Architecture | COMPLETE |
| Lot 4-B — Evaluate Agents | COMPLETE |
| Lot 4-C — Security Review | COMPLETE |
| Lot 4-D — Debug Incident | COMPLETE |
| Lot 4-E — `MCF-CLOSE-PHASE` | COMPLETE |
| Release Candidate / Gate E | COMPLETE |
| `v1.0.0-RC1` | PUBLISHED_PRERELEASE |
| Produção | BLOCKED |
| `v1.0.0` estável | BLOCKED |

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

## 6. Evidência técnica final do Lot 4-E

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

## 7. Canonical documentation sync do Lot 4-E

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

## 9. Gate C — real provider write

```yaml
mission: MCF-RUNTIME-006-GATE-C-REAL-PROVIDER-WRITE
issue: 111
risk_class: C
technical_pr: 112
technical_merge: 0b060539eb152f0cf92bd146b853562407ab0a64
real_provider_proof_head: f50365eae53c54c0c5b3e929b52f0fe85c1ba4f4
real_provider_proof_run: 31537057206
artifact_id: 9119190464
artifact_digest: sha256:6122eb9398ae0c1420e9257667f42d60badc995fe928459f3672815bf5ab84c2
artifact_stage: COMPLETE
proof_pr: 117
proof_comment_id: 5258957980
c1: PASS
c2: PASS
read_back: PASS
idempotency: PASS
ledger_receipts: PASS
julia_governance: PASS
emily_independent_audit: PASS
leo_technical_gate: APPROVE_TECHNICAL_GATE_C
technical_post_merge_documentation_run: 31538142320
technical_post_merge_documentation: PASS
technical_post_merge_staging_run: 31538142312
technical_post_merge_staging: PASS_DEPLOYED
canonical_pr: 118
canonical_candidate: 9ba3bee76ca6572848b3d95a71d109f4be10ff31
canonical_documentation_run: 31539053960
canonical_documentation: PASS
canonical_merge: 3feff116a3bf66427cfdfcb10894c0f76f79ee11
canonical_post_merge_documentation_run: 31539238013
canonical_post_merge_documentation: PASS
closeout_pr: 119
closeout_merge: 303a4385aed51c531993613ca9d664d1599f538e
closeout_post_merge_documentation_run: 31540925137
closeout_post_merge_documentation: PASS
canonical_state: COMPLETE
mission_state: ENTREGUE
production: BLOCKED
```

### Fail-safe permanente

```yaml
mutation_post_retry: NEVER
read_back_reconciliation: BOUNDED_GET_ONLY
transient_branch_read_back: PASS
transient_pr_read_back: PASS
postwrite_branch_auth_loss: PARTIAL_UNKNOWN
postwrite_pr_auth_loss: PARTIAL_UNKNOWN
unknown_when_unprovable: PRESERVED
```

C2 está conectado ao `AdapterRegistry` vivo. O adapter de staging continua fora desse registry, preservando o boundary do Gate D.

A infraestrutura temporária do teste real foi removida antes do merge técnico. Os três workflows temporários de closeout introduzidos pelo PR #119 foram removidos pela correção final antes do encerramento da Issue #111.

## 10. Sincronização canônica e closeout do Gate C

```yaml
canonical_sync: COMPLETE
objective_met: true
blocking_findings: 0
pending_actions: 0
human_action_required: false
historical_next_boundary: RELEASE_CANDIDATE_GATE_E
production: BLOCKED
```

Gate C está `COMPLETE/ENTREGUE`. O boundary que era então futuro, Gate E, foi posteriormente executado e concluído conforme a seção seguinte.

## 11. Gate E — Release Candidate

```yaml
mission: MCF-RELEASE-CANDIDATE-GATE-E
issue: 121
risk_class: C
technical_pr: 122
baseline_main: c5758c2e38b599ae1673cda2691ef2ce0dc2a411
audited_candidate: 13b5cb4f6b7a8369b0493fc3a51367d64b09c705
candidate_merge_tree_equivalence: PASS
merge_release_target: 9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8
```

### Qualificação final do candidate

```yaml
documentation_run: 31553244652
documentation: PASS
container_smoke_run: 31553244682
container_smoke: PASS
foundation_run: 31553244654
foundation: PASS
final_qualification_run: 31553369253
final_qualification: PASS
prf_manifest: PASS
migrations_twice: PASS
skills_registered: 16
skills_executable: 16
skills_documental: 0
final_staging_run: 31553461208
final_staging: PASS_DEPLOYED
final_staging_recovery: false
miriam: PASS
sofia: PASS
renato: PASS
beatriz: PASS
ricardo: PASS
augusto: PASS
carmem: PASS
julia: PASS_PRE_PUBLICATION
emily_independent_audit: PASS
leo_gate: PASS
critical_findings_open: 0
high_findings_open: 0
blocking_process_findings_open: 0
```

### Revalidação pós-merge

```yaml
merge_sha: 9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8
candidate_merge_tree_equivalence: PASS
post_merge_documentation_run: 31554021692
post_merge_documentation: PASS
post_merge_readonly_qualification_run: 31554089586
post_merge_readonly_qualification: PASS
post_merge_manifest: PASS
post_merge_migrations_twice: PASS
post_merge_skills: 16_16_0
post_merge_external_writes_from_readonly_helper: 0
post_merge_human_operator_actions: 0
post_merge_staging_run: 31554021695
post_merge_staging: PASS_DEPLOYED
post_merge_staging_recovery: false
```

### Publicação da RC1

```yaml
publication_run: 31554462243
publication_result: PASS
tag: v1.0.0-RC1
tag_target: 9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8
github_release_id: 368946304
release_name: MCF v1.0.0-RC1
draft: false
prerelease: true
release_candidate_state: PUBLISHED_PRERELEASE
```

A tag da RC1 permanece ligada ao SHA qualificado `9b4a759...`. O closeout documental pós-publicação não deve retargetar a release.

### CAFs do Gate E

1. falsos negativos dos helpers de qualificação foram classificados como defeitos auxiliares sem impacto no candidate e corrigidos antes do gate final;
2. o PRF Classe C incompleto foi tratado como blocker de processo e somente fechado após manifest íntegro;
3. a primeira e a segunda tentativa auxiliar de publicação falharam antes de criar tag/release válida;
4. a causa da publicação foi isolada na detecção incorreta de HTTP `404` pelo corpo da resposta;
5. após correção por exit status, a tag e a prerelease foram criadas/verificadas no target exato;
6. os helpers temporários foram removidos após PASS;
7. nenhum trabalho técnico foi delegado a LEANDRO.

## 12. Estado final do RUNTIME-006 e Gate E

```yaml
runtime_006: COMPLETE
gate_a: COMPLETE
gate_b: COMPLETE
gate_c: COMPLETE
gate_d: COMPLETE
gate_e: COMPLETE
skills_registered: 16
skills_executable: 16
skills_documental: 0
release_candidate: v1.0.0-RC1
release_candidate_state: PUBLISHED_PRERELEASE
critical_findings_open: 0
high_findings_open: 0
human_action_required: false
production: BLOCKED
stable_v1_0_0: BLOCKED
```

## 13. Boundary posterior

Nenhum boundary posterior é autorizado por este closeout.

A `v1.0.0-RC1` está publicada como prerelease e o Gate E está concluído. Produção permanece `BLOCKED` e a versão estável `v1.0.0` permanece `BLOCKED`. Qualquer promoção estável, produção ou nova missão exige boundary próprio e autorização aplicável fora desta missão de Gate E.
