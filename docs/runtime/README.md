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
skills_executable: 15
skills_documental: 1
remaining_documental:
  - MCF-CLOSE-PHASE

latest_completed_boundary:
  id: MCF-RUNTIME-006-LOT-4-D-DEBUG-INCIDENT
  issue: 103
  technical_pr: 104
  technical_candidate: dccb41f146f5701f75d8762df89160bf2f1695a7
  technical_merge: 94d8944c25ac26df3facb4f343a7a75c2489d704
  technical_tree_equivalence: PASS
  canonical_pr: 105
  canonical_candidate: 41f2ed1cda3e9cb2812bb7f8e8bee9553a0140b9
  canonical_merge: 59b230e8ad834b88c1dc4363bc9a28499881e1fe
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

Documental restante: `MCF-CLOSE-PHASE`.

## MCF-DEBUG-INCIDENT

```yaml
primary_owner: Patricia
owners: [Patricia, Bruno, Rafael]
planner_state: READY_AGENT
handoff: Renato
permission_profile: SCOPED_WRITE
provider: internal
operation: inspect-debug-incident
resource: mcf-agent-runtime
```

O bridge não auto-completa a skill. O Lot 4-D não amplia autoridade externa: provider externo, GitHub write, environment mutation, deploy/produção, destructive fix, secret/public action e blind retry continuam negados.

`reproduction`, `root_cause` e `recovery_result` precisam ser semanticamente significativos. Recuperação válida exige ação/mitigação, verificação, `blind_retry: false`, `retry_evidence` independente e referência verificável de regressão. Evidência insuficiente retorna `RECOVERING` sem handoff de sucesso.

Objetivos explicitamente de security review continuam em `MCF-SECURITY-REVIEW`, Ricardo e Classe C; os termos genéricos `incidente/incident` não capturam automaticamente a rota de debug.

## Validação integrada

```yaml
foundation_run: 31479541126
foundation: PASS
container_smoke_run: 31479541177
container_smoke: PASS
server_test_files: 122
server_tests: 527
web_tests: 5
ops_tests: 20
failed_tests: 0
technical_manifest: PASS
specialist_reviews: PASS
augusto_trace: PASS
julia_governance: PASS
emily_audit: PASS
leo_technical_gate: PASS
documentation_validation_run: 31481344101
documentation_validation: PASS
documentary_manifest: PASS
documentary_governance: PASS
independent_documentary_audit: PASS
leo_documentary_gate: PASS
canonical_sync: COMPLETE
```

## CAFs

1. formatação canônica corrigida e revalidada;
2. `blind_retry: false` isolado rejeitado como claim booleano, tornando `retry_evidence` semântico obrigatório;
3. roteamento genérico de incidente corrigido para não sobrepor security review Classe C;
4. closeout documental criado pós-merge para remover marcadores pré-merge `IN_PROGRESS/CANDIDATE` da fonte canônica.

## Próximo boundary

`MCF-CLOSE-PHASE`

Este closeout não implementa essa skill.
