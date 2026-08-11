# MCF-RUNTIME-006 — Plano canônico

## 1. Objetivo

Expandir o MCF de um runtime persistente e governado para uma plataforma capaz de executar capacidades reais com contratos de permissão, evidência verificável, recuperação, observabilidade, handoffs persistentes e gates proporcionais ao risco.

Este plano é um índice canônico de estado. Evidência detalhada permanece nos PRFs, Issues, PRs e decisões correspondentes.

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

## 3. Arquitetura de execução

```text
Objective
→ ChatMissionPlanner
→ ChatRuntimeBridge
→ MissionRuntime
→ SkillRegistryLoader
→ HumanDelegationGuard
→ PermissionEngine
→ SkillExecutor
→ EvidenceValidator
→ Tool / Internal governed execution
→ Receipt + Event Ledger
→ Handoff / Recovery
→ Final trace
```

## 4. Estado canônico

```yaml
skills_registered: 16
skills_executable: 15
skills_documental: 1
remaining_documental:
  - MCF-CLOSE-PHASE
```

O próximo boundary ainda não implementado é `MCF-CLOSE-PHASE`.

## 5. Roadmap do RUNTIME-006

| Boundary | Situação |
|---|---|
| Fundação / estabilização | COMPLETE |
| Gate A — contrato comum de adapters | COMPLETE |
| Gate B — leitura externa | COMPLETE |
| A1 — Code Review Read Only | COMPLETE |
| A2 — CI Query Read Only | COMPLETE |
| Recibos + validação semântica | COMPLETE |
| C1 — branch/PR | IMPLEMENTED |
| C2 — colaboração em PR | IMPLEMENTED |
| Gate C — real provider write | PARTIAL / NOT AUTHORIZED |
| Gate D — staging | COMPLETE |
| Observabilidade de missão bloqueada | COMPLETE |
| Lot 4-A — Recover/Product/UX/Architecture | COMPLETE |
| Lot 4-B — Evaluate Agents | COMPLETE |
| Lot 4-C — Security Review | COMPLETE |
| Lot 4-D — Debug Incident | TECHNICALLY INTEGRATED; CANONICAL SYNC IN PROGRESS |
| Close Phase | PENDING / OUT OF LOT 4-D |
| agentes isolados / validação multiagente | PENDING conforme roadmap posterior |
| Release Candidate | PENDING |
| Produção | BLOCKED |

## 6. Lot 4-D — Executable Debug Incident

### Identificação

```yaml
mission: MCF-RUNTIME-006-LOT-4-D-DEBUG-INCIDENT
issue: 103
technical_pr: 104
risk_class: C
baseline_main: 79c1a1644742cf22af60384b64685adbb1f017a3
technical_candidate: dccb41f146f5701f75d8762df89160bf2f1695a7
technical_merge: 94d8944c25ac26df3facb4f343a7a75c2489d704
candidate_tree: 39d2cd29b5990d4261e23655c272691c8a60b4e7
merge_tree: 39d2cd29b5990d4261e23655c272691c8a60b4e7
candidate_merge_tree_equivalence: PASS
canonical_sync: IN_PROGRESS
```

### Skill

```yaml
skill_id: MCF-DEBUG-INCIDENT
name: Diagnosticar incidente
primary_owner: Patricia
owners:
  - Patricia
  - Bruno
  - Rafael
required_inputs:
  - symptom_or_evidence
permission_profile: SCOPED_WRITE
planner_state: READY_AGENT
provider: internal
operation: inspect-debug-incident
resource: mcf-agent-runtime
handoff_to: Renato
required_evidence:
  - reproduction
  - root_cause
  - recovery_result
acceptance_criteria:
  - cause_supported
  - regression_test_added
```

### Boundary restrito

`SCOPED_WRITE` permanece no contrato canônico, mas o Lot 4-D não concede escrita externa genérica.

```yaml
external_write: FORBIDDEN
github_provider_write: FORBIDDEN
environment_mutation: FORBIDDEN
deploy: FORBIDDEN
production_action: FORBIDDEN
destructive_fix: FORBIDDEN
secret_access: FORBIDDEN
public_action: FORBIDDEN
blind_retry: FORBIDDEN
```

Nenhuma regra global do `PermissionEngine` é relaxada para a skill.

### Semântica de evidência

`reproduction` precisa conter sintoma, método de reprodução/caracterização e referência verificável. `root_cause` precisa conter causa e evidência de suporte.

`recovery_result` só é válido quando contém:

1. ação, isolamento ou mitigação;
2. verificação semanticamente significativa;
3. `blind_retry: false`;
4. `retry_evidence` independente demonstrando que não ocorreu blind retry;
5. referência verificável do teste de regressão.

Ausência, vazio, whitespace, placeholder, objeto vazio ou booleano usado como substituto de evidência gera `RECOVERING`, nunca sucesso fabricado.

### Planner e ownership

- objetivos inequívocos de debug selecionam `MCF-DEBUG-INCIDENT`;
- Patricia é o primary owner do planner;
- Bruno e Rafael também são owners válidos de execução;
- non-owner é negado;
- o bridge não auto-completa a skill;
- handoff para Renato só ocorre após evidência válida.

Objetivos explicitamente de security review continuam em `MCF-SECURITY-REVIEW`, Ricardo e Classe C. Os termos genéricos `incidente/incident` não capturam automaticamente a rota de debug.

## 7. Validação técnica do Lot 4-D

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
vitest_artifact: 9096661981
vitest_digest: sha256:e689b3f6453666992509676f30f63f98d49a33582ca8adcf378c732f3f36848f
manifest_audit: PASS
beatriz_review: PASS
vinicius_review: PASS
ricardo_review: PASS
renato_validation: PASS
augusto_trace: PASS
julia_governance: PASS
carmem_prf: PASS
emily_independent_audit: PASS
leo_technical_gate: PASS
```

Todas as evidências acima pertencem ao SHA técnico exato `dccb41f146f5701f75d8762df89160bf2f1695a7`.

## 8. CAFs do Lot 4-D

### CAF #1 — formatação

- candidato `3ea30e9a...` falhou em `Verify formatting`;
- SHA diagnóstico `81c1f1c9...` foi usado apenas para revelar o diff do Prettier;
- novo SHA foi criado e revalidado;
- o diagnóstico nunca foi candidato de gate.

### CAF #2 — prova de ausência de blind retry

- o primeiro PRF `9ebedbaa...` tinha CI verde;
- Vinicius identificou que `blind_retry: false` isolado era claim booleano;
- gate foi bloqueado;
- `retry_evidence` semântico tornou-se obrigatório;
- CI/reviews anteriores foram invalidados pelo novo HEAD.

### CAF #3 — roteamento de incidente

- Beatriz identificou que termos genéricos de incidente podiam sobrepor security review;
- os termos genéricos foram removidos da inferência de debug;
- regressão Classe C foi adicionada;
- uma limitação do conector na atualização completa do planner foi recuperada por commit Git granular, fast-forward e sem force-push.

## 9. Integração técnica

O PR técnico `#104` foi mesclado por squash somente após:

```text
exact-head Foundation + Container Smoke
→ manifest audit
→ specialist reviews
→ Augusto trace
→ Julia governance
→ Emily audit
→ Leo gate
→ final base/head check
→ expected-head protected squash merge
```

A equivalência foi comprovada por tree Git exata:

```yaml
candidate_sha: dccb41f146f5701f75d8762df89160bf2f1695a7
candidate_tree: 39d2cd29b5990d4261e23655c272691c8a60b4e7
merge_sha: 94d8944c25ac26df3facb4f343a7a75c2489d704
merge_tree: 39d2cd29b5990d4261e23655c272691c8a60b4e7
equivalence: PASS
```

## 10. Canonical documentation sync

O sync documental é separado do PR técnico. Ele deve:

- atualizar contagem para `16 / 15 / 1`;
- registrar `MCF-DEBUG-INCIDENT` como integrado;
- apontar somente `MCF-CLOSE-PHASE` como skill documental restante;
- reconciliar este plano, `README.md`, `docs/runtime/README.md` e o PRF do Lot 4-D;
- regenerar e auditar o manifesto SHA-256;
- validar documentação no HEAD exato;
- obter gate documental;
- executar merge protegido e provar equivalência de tree;
- somente então encerrar a Issue #103.

## 11. Condições que permanecem bloqueadas

```yaml
production: BLOCKED
live_staging_adapter: DISABLED
gate_c_real_provider_write: NOT_AUTHORIZED
human_operator_actions: 0
human_gate_leandro: NOT_REQUIRED_FOR_LOT_4D
```

## 12. Próximo boundary

Após o fechamento verificável do canonical sync e da Issue #103:

`MCF-CLOSE-PHASE`

Esse boundary deve ser aberto e executado separadamente. O Lot 4-D não o implementa.
