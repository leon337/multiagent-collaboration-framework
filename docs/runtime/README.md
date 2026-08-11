# MCF Runtime

Este diretório documenta o recorte executável do Multiagent Collaboration Framework.

Fontes canônicas relacionadas:

- `skills/registry.yaml` — contratos das skills;
- `docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md` — protocolo operacional;
- `docs/runtime/MCF-RUNTIME-006-PLAN.md` — plano vigente;
- `artifacts/phases/` — evidência por fase;
- `apps/rede-social-agentes/apps/server/src/mcf-runtime/` — código e testes.

## Arquitetura

```text
Chat objective
→ ChatMissionPlanner
→ ChatRuntimeBridge
→ MissionRuntime
→ SkillRegistryLoader
→ HumanDelegationGuard
→ PermissionEngine
→ SkillExecutor
→ EvidenceValidator
→ Persistence / Event Ledger
→ Handoff / Recovery
```

## Estado atual

```yaml
runtime: MCF-RUNTIME-006
skills_registered: 16
skills_executable: 16
skills_documental: 0
remaining_documental: []

latest_completed_boundary:
  id: MCF-RUNTIME-006-LOT-4-E-CLOSE-PHASE
  issue: 107
  technical_pr: 108
  technical_candidate: 3b202d26b08d8acb72538db77e0e3b86d540dc97
  technical_merge: 6cf9af35407b97d84028078ab6843570b47103fe
  technical_tree_equivalence: PASS
  canonical_pr: 109
  canonical_candidate: 7d571a4a19234b5e479b4e3b615e07ebb81d29a3
  canonical_merge: d0f4624a1c4f4b31eb625ddadadf523a4578b972
  canonical_sync: COMPLETE

production: BLOCKED
live_staging_adapter: DISABLED
gate_c_real_provider_write: NOT_AUTHORIZED
human_operator_actions: 0
```

## Skills executáveis

1. `MCF-START-MISSION`
2. `MCF-SELECT-AGENTS`
3. `MCF-RECOVER-CONTEXT`
4. `MCF-DEFINE-PRODUCT`
5. `MCF-DESIGN-EXPERIENCE`
6. `MCF-DESIGN-ARCHITECTURE`
7. `MCF-IMPLEMENT-CHANGE`
8. `MCF-REVIEW-CODE`
9. `MCF-RUN-TESTS`
10. `MCF-GIT-PR-RELEASE`
11. `MCF-DEPLOY-VALIDATE`
12. `MCF-TRACE-MISSION`
13. `MCF-EVALUATE-AGENTS`
14. `MCF-SECURITY-REVIEW`
15. `MCF-DEBUG-INCIDENT`
16. `MCF-CLOSE-PHASE`

Não há skill documental remanescente no runtime integrado.

## MCF-CLOSE-PHASE

```yaml
primary_owner: Carmem
owners: [Carmem, Emily, Leo, Mestre]
planner_state: READY_AGENT
handoff: Mestre
permission_profile: SCOPED_WRITE
provider: internal
operation: close-phase
resource: mcf-agent-runtime
```

O bridge não auto-completa a skill. O boundary do Lot 4-E não amplia autoridade externa: provider externo, GitHub write, environment mutation, deploy/produção, ação destrutiva, secret/public action continuam negados.

Evidência obrigatória:

- `phase_pack` — artefatos, manifest reference e rastreabilidade completa;
- `audit_verdict` — verdict, referência verificável e blocking findings;
- `leo_decision` — decisão explícita, justificativa, estado seguinte, próxima ação e responsável;
- `checkpoint` — estado final, objetivo, findings, blockers, próxima ação, destinatário e necessidade de ação humana.

`ENTREGUE` só é válido com objetivo atendido, ausência de blockers/findings pendentes ou bloqueantes, auditoria PASS/PASSED, decisão aprovadora de Léo, nenhuma próxima ação pendente, `human_action_required=false` e concordância entre decisão/checkpoint.

O handoff técnico é `Mestre`. Leandro não pode ser executor nem destinatário de handoff técnico; sua participação somente ocorre por `HUMAN_GATE` explícito conforme o protocolo.

## Validação e integração

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
failed_tests: 0
close_phase_executor_tests: 28
close_phase_planner_tests: 4
close_phase_mission_runtime_tests: 2
hdf_regression_tests: 11
prf_manifest_audit_run: 31485724987
prf_manifest_audit: PASS
specialist_reviews: PASS
augusto_trace: PASS
carmem_prf_review: PASS
julia_governance: PASS
emily_independent_audit: PASS
leo_technical_gate: PASS
technical_merge: 6cf9af35407b97d84028078ab6843570b47103fe
technical_tree_equivalence: PASS
technical_post_merge_documentation: PASS
technical_post_merge_staging_run: 31486181369
technical_post_merge_staging: PASS_DEPLOYED
canonical_pr: 109
canonical_candidate: 7d571a4a19234b5e479b4e3b615e07ebb81d29a3
canonical_documentation_run: 31486782247
canonical_documentation: PASS
canonical_manifest_audit_run: 31486845037
canonical_manifest_audit: PASS
canonical_merge: d0f4624a1c4f4b31eb625ddadadf523a4578b972
canonical_post_merge_documentation_run: 31487031172
canonical_post_merge_documentation: PASS
canonical_sync: COMPLETE
```

## CAFs do Lot 4-E

1. bootstrap inicial falhou antes de mutação e o mecanismo foi substituído, sem blind retry;
2. formatação foi corrigida com Prettier pinado do repositório;
3. `PASS` de audit verdict foi contextualizado sem enfraquecer a rejeição genérica de placeholders;
4. o hardening passou a rejeitar `ENTREGUE` com finding bloqueante de auditoria;
5. Leandro não pode tornar-se responsável técnico implícito; somente `ESCALAR_PARA_LEANDRO` representa HUMAN_GATE sem mudar o handoff técnico para Mestre.

## Próximo boundary

**Release Candidate / Gate E**.

O Lot 4-E está concluído. Produção permanece `BLOCKED` e não é autorizada por essa transição.