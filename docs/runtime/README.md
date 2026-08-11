# MCF Runtime

Este diretório documenta o recorte executável do Multiagent Collaboration Framework.

A fonte canônica de comportamento continua distribuída entre:

- `skills/registry.yaml` — contratos das skills;
- `docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md` — protocolo operacional;
- `docs/runtime/MCF-RUNTIME-006-PLAN.md` — plano vigente do RUNTIME-006;
- `artifacts/phases/` — evidência por fase;
- código e testes em `apps/rede-social-agentes/apps/server/src/mcf-runtime/`.

## Arquitetura executável

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

O bridge só autoexecuta o bootstrap interno explicitamente classificado como `PLANNED_INTERNAL`. Skills de domínio governadas usam `READY_AGENT` e exigem entrega real do owner com evidência semântica.

## Estado atual

```yaml
runtime: MCF-RUNTIME-006
skills_registered: 16
skills_executable: 15
skills_documental: 1
remaining_documental:
  - MCF-CLOSE-PHASE

latest_integrated_boundary:
  id: MCF-RUNTIME-006-LOT-4-D-DEBUG-INCIDENT
  issue: 103
  technical_pr: 104
  technical_candidate: dccb41f146f5701f75d8762df89160bf2f1695a7
  technical_merge: 94d8944c25ac26df3facb4f343a7a75c2489d704
  candidate_merge_tree_equivalence: PASS
  canonical_sync: IN_PROGRESS

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

## Lot 4-D — MCF-DEBUG-INCIDENT

Contrato canônico confirmado no registry:

```yaml
skill_id: MCF-DEBUG-INCIDENT
primary_owner: Patricia
owners:
  - Patricia
  - Bruno
  - Rafael
required_input:
  - symptom_or_evidence
permission_profile: SCOPED_WRITE
required_evidence:
  - reproduction
  - root_cause
  - recovery_result
acceptance_criteria:
  - cause_supported
  - regression_test_added
handoff_to: Renato
```

### Planner e bridge

- objetivo inequívoco de debug seleciona `MCF-DEBUG-INCIDENT`;
- primary owner do planner: Patricia;
- estado: `READY_AGENT`;
- handoff: Renato;
- provider: `internal`;
- operação: `inspect-debug-incident`;
- recurso: `mcf-agent-runtime`;
- o `ChatRuntimeBridge` não fabrica completion da skill.

Termos genéricos `incidente`/`incident` não são suficientes para capturar uma missão de debug. Objetivos explicitamente de segurança continuam roteando para `MCF-SECURITY-REVIEW`, Ricardo e Classe C.

### Boundary operacional

Apesar do perfil canônico `SCOPED_WRITE`, o Lot 4-D permanece `internal_only`.

São bloqueados:

- provider externo;
- GitHub write;
- environment mutation;
- deploy e produção;
- destructive fix;
- secret access;
- public action;
- blind retry.

Nenhuma semântica global do `PermissionEngine` foi relaxada.

### Evidência semântica

`reproduction` exige sintoma, método e referência verificável. `root_cause` exige causa e evidência de suporte. `recovery_result` exige:

1. ação, isolamento ou mitigação;
2. verificação significativa do resultado;
3. `blind_retry: false`;
4. `retry_evidence` semântico independente;
5. referência verificável de teste de regressão.

Strings vazias, whitespace, placeholders, objetos vazios e booleanos usados como substitutos de evidência não autorizam sucesso.

Evidência insuficiente produz `RECOVERING`, sem `PHASE_COMPLETED` nem handoff de sucesso para Renato.

### Evidência técnica integrada

```yaml
candidate_sha: dccb41f146f5701f75d8762df89160bf2f1695a7
foundation_run: 31479541126
foundation: PASS
container_smoke_run: 31479541177
container_smoke: PASS
server_test_files: 122
server_tests: 527
web_tests: 5
ops_tests: 20
failed_tests: 0
vitest_artifact: 9096661981
vitest_digest: sha256:e689b3f6453666992509676f30f63f98d49a33582ca8adcf378c732f3f36848f
manifest_audit: PASS
specialist_reviews: PASS
augusto_trace: PASS
julia_governance: PASS
emily_independent_audit: PASS
leo_technical_gate: PASS
technical_merge: 94d8944c25ac26df3facb4f343a7a75c2489d704
technical_tree: 39d2cd29b5990d4261e23655c272691c8a60b4e7
candidate_merge_tree_equivalence: PASS
```

## Recuperações do Lot 4-D

Três CAFs permaneceram visíveis:

- **CAF #1:** falha de formatação; corrigida pelo diff canônico do Prettier e revalidada;
- **CAF #2:** `blind_retry: false` isolado era apenas claim booleano; `retry_evidence` semântico tornou-se obrigatório;
- **CAF #3:** termos genéricos de incidente podiam sobrepor o roteamento de security review; foram removidos e cobertos por regressão Classe C.

SHAs superseded e CI produzidos antes das correções permanecem históricos e não foram reutilizados no gate final.

## Limites que continuam ativos

```yaml
production: BLOCKED
live_staging_adapter: DISABLED
gate_c_real_provider_write: NOT_AUTHORIZED
publicacao_social_automatica: false
human_operator_actions: 0
human_gate_leandro: NOT_REQUIRED_FOR_LOT_4D
```

## Próximo boundary

Depois da conclusão documental do Lot 4-D, o próximo boundary será formalizado separadamente para `MCF-CLOSE-PHASE`.

Este sync **não implementa** `MCF-CLOSE-PHASE`.
