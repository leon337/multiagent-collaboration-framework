# MCF-RUNTIME-006 — Adapters externos confiáveis

## Estado

`EM_EXECUCAO — GATE_B_CONCLUIDO — C1_INTEGRADO — C2_INTEGRADO — GATE_C_PARCIAL — GATE_D_INTEGRADO — LOTE_3_CONCLUIDO — OBSERVABILIDADE_INTEGRADA — LOTE_4A_INTEGRADO — LOTE_4B_INTEGRADO — LOTE_4C_INTEGRADO`

## Autorização

Leandro autorizou o início da conclusão do MCF em 5 de agosto de 2026.

## Progresso comprovado

```yaml
mcf_stab_001:
  state: CONCLUIDO
  merge_commit: 893cd03c3157e3b13fd98ad3afcf532efcde6af3
runtime_006_a1:
  capability: CODE_REVIEW_READ_ONLY
  state: INTEGRADO
  merge_commit: 01c0182b9c9837c0dd22306c9bd8918020ecc38b
runtime_006_a2:
  capability: CI_QUERY_READ_ONLY
  state: INTEGRADO
  merge_commit: 9424e024eb62eb9f9dddd30e01d7f14cc58094a3
runtime_006_c1:
  capability: GITHUB_BRANCH_PR_WRITE
  implementation_state: INTEGRADO
  merge_commit: ed67f0459c956146bdb9020a7ef37dfb59137512
  real_provider_write_test: NOT_AUTHORIZED
  gate_c: PARCIAL
runtime_006_c2:
  capability: GITHUB_PR_COLLABORATION_WRITE
  operations:
    - comment-pr
    - review-pr-comment
    - update-pr-text-metadata
  implementation_state: INTEGRADO
  pull_request: 80
  final_review_head: 517f0827e7fc4564cf6fed83d5d6e1fd1a72cf62
  merge_commit: 0a7909b71e1944d1062e8ea1ab13a4bee4abbf88
  independent_review: PASS
  active_p0: 0
  active_p1: 0
  active_p2: 0
  post_merge_staging_run: 31279570577
  post_merge_staging: PASS
  real_provider_write_test: NOT_AUTHORIZED
  gate_c: PARCIAL
runtime_006_gate_d:
  capability: MCF_DEPLOY_VALIDATE_STAGING
  implementation_state: INTEGRADO
  issue: 83
  pull_request: 84
  functional_release_sha: c787179e126a93af96dd67604cb24f91235c4320
  final_closeout_head: ea63828435589a78bafcab916b51b4fc5aea1102
  merge_commit: 2dfeb0e23c5c2e19a2c21e6f2c50a1a4f466d06a
  post_merge_documentation_run: 31442205293
  post_merge_documentation: PASS
  post_merge_staging_run: 31442205251
  post_merge_staging_job: 93629069170
  post_merge_staging: PASS
  post_merge_outcome: DEPLOYED
  exact_sha_health_version: PASS
  readiness: PASS
  recovery_strategy: redeploy_previous_healthy_sha
  live_registry_activation: false
  gate_d: INTEGRADO
runtime_006_observability:
  capability: BLOCKED_MISSION_OBSERVABILITY
  state: INTEGRADO
  issue: 88
  original_pull_request: 89
  original_merge_commit: 16442d9a7baf2ecbc91fb4b297ba21efa4829b38
  late_p2: STALE_BLOCKED_ALERT_RACE
  recovery_pull_request: 92
  recovery_closeout_head: e2aace417295ee33c84826a1b782c7a6fc42f62f
  recovery_merge_commit: 7418fff6e30f6107313a632284266caf04e8b33a
  recovery_foundation_run: 31453781013
  recovery_container_smoke_run: 31453781061
  recovery_server_test_files: 109
  recovery_server_tests: 447
  recovery_observability_tests: 12
  recovery_artifact: 9087290657
  recovery_artifact_digest: sha256:bd80a83aad455fbbfa907a7a8208be41f5970c8bbc64e42ee983f032c81555ce
  recovery_documentation_run: 31454187271
  recovery_documentation: PASS
  recovery_staging_run: 31454187273
  recovery_staging_job: 93664514760
  recovery_staging: PASS
  recovery_outcome: DEPLOYED
  exact_sha_health_version: PASS
  readiness: PASS
  active_p0: 0
  active_p1: 0
  active_p2: 0
runtime_006_lot_4a:
  capability: EXECUTABLE_INTERNAL_CORE_SKILLS
  state: INTEGRADO
  issue: 94
  pull_request: 95
  validated_head: e3e70fbbd2c940ee66a8de9c418e0e8d32a4c668
  merge_commit: 67d20e24fd136f6334bfd835cb775426f6514403
  candidate_tree: def5edf77be8bdc32939d2b4bd5b1fcbcca649ec
  merge_tree: def5edf77be8bdc32939d2b4bd5b1fcbcca649ec
  foundation_run: 31461319193
  container_smoke_run: 31461319181
  server_test_files: 112
  server_tests: 459
  vitest_artifact: 9089891091
  artifact_digest: sha256:84dd346386005a300614558406d20cf6e6bda4943dc95f6e2d4a5e371e4ac375
  independent_audit: PASS
  leo_technical_gate: PASS
  active_p0: 0
  active_p1: 0
  active_p2: 0
  skills_executable: 12
  skills_documental: 4
runtime_006_lot_4b:
  capability: EXECUTABLE_AGENT_EVALUATION
  state: INTEGRADO
  issue: 97
  pull_request: 98
  validated_head: 279a4b1e3b8e8b5b948d95481ec85e5223322278
  merge_commit: 741abdad70432b9232256b7204156d96770c9b4d
  candidate_tree: a0e676152c7070381480b9c5422f103887987eab
  merge_tree: a0e676152c7070381480b9c5422f103887987eab
  foundation_run: 31463802089
  container_smoke_run: 31463802100
  server_test_files: 115
  server_tests: 470
  vitest_artifact: 9090765070
  artifact_digest: sha256:74aec951f4c26e491a406389b6b49c0de83a2d5a3af8ad5b1dab89eda1c11944
  manifest_audit_run: 31463844963
  independent_audit: PASS
  leo_technical_gate: PASS
  active_p0: 0
  active_p1: 0
  active_p2: 0
  skills_executable: 13
  skills_documental: 3
runtime_006_lot_4c:
  capability: EXECUTABLE_SECURITY_REVIEW
  state: INTEGRADO
  issue: 100
  pull_request: 101
  validated_head: 323b69af4616cda0e4f9b1e47516a9cde37a3f0d
  merge_commit: 08c3e19e1b6408a164628e1bfaa5968e2070ccf0
  candidate_tree: 70f07a2c936ce166555e52b36366c810919f5b8c
  merge_tree: 70f07a2c936ce166555e52b36366c810919f5b8c
  foundation_run: 31471615150
  container_smoke_run: 31471615302
  server_test_files: 118
  server_tests: 485
  vitest_artifact: 9093585565
  artifact_digest: sha256:110c2bc438ac9215cbb0c12ca3f0372e3861d5f1c0a7c2965f86de5739339367
  manifest_audit_run: 31471688783
  independent_audit: PASS
  leo_technical_gate: PASS
  active_p0: 0
  active_p1: 0
  active_p2: 0
  permission_profile: SENSITIVE_CONTROLLED
  provider: internal
  skills_executable: 14
  skills_documental: 2
mcf_dec_061:
  state: INTEGRADA_COM_GATE_D
  purpose: GITHUB_ACTIONS_ONE_SHOT_TEAM_FIRST_FALLBACK
  default_personal_token_from_leandro: PROHIBITED
  human_operator_actions_target: 0
production: BLOCKED
```

As implementações C1 e C2 estão integradas à `main`. O C2 passou CI no HEAD exato, revisão independente sem P0/P1/P2 ativos, gate operacional de Léo, merge protegido por HEAD e validação pós-merge em staging. A escrita real pelo provider GitHub do adapter C2 continua não autorizada. Portanto o Gate C permanece parcial e não deve ser declarado integralmente concluído.

O Gate D também está integrado. O candidato funcional foi provado em staging antes do closeout, fechado no HEAD `ea63828435589a78bafcab916b51b4fc5aea1102`, aprovado no gate de integração de Léo e mesclado por squash com proteção de HEAD. O SHA `2dfeb0e23c5c2e19a2c21e6f2c50a1a4f466d06a` passou Documentation validation e o workflow de staging, que implantou e verificou o próprio SHA por `/health/version` e `/health/ready`. A MCF-DEC-061 foi integrada junto com o Gate D.

A observabilidade do Lote 3 também está integrada. O PR #89 entregou a capacidade inicial; um P2 assíncrono pós-merge revelou risco de alerta baseado em snapshot obsoleto, a issue #88 foi reaberta e o PR #92 corrigiu a condição de corrida com lock transacional e rechecagem atômica de estado+versão. O closeout de recuperação `e2aace417295ee33c84826a1b782c7a6fc42f62f` passou 109 arquivos/447 testes, e o merge `7418fff6e30f6107313a632284266caf04e8b33a` passou Documentation validation e staging `PASS/DEPLOYED` no próprio SHA. O Lote 3 está concluído. Produção e ativação do staging adapter no live registry continuam bloqueadas.

O Lot 4-A integrou quatro skills internas de domínio com `READY_AGENT`, evidência semântica e persistência pelo MissionRuntime. O Lot 4-B integrou `MCF-EVALUATE-AGENTS` preservando `READ_ONLY`. O Lot 4-C integrou `MCF-SECURITY-REVIEW` preservando `SENSITIVE_CONTROLLED`, piso Classe C, provider interno, autorização sensível explícita e evidência estruturada. O candidato final do Lot 4-C `323b69af4616cda0e4f9b1e47516a9cde37a3f0d` passou Foundation `31471615150`, Container Smoke `31471615302`, 118 arquivos/485 testes, Manifest Audit R3 `31471688783`, reviews especialistas, auditoria independente e gate de Léo. O merge `08c3e19e1b6408a164628e1bfaa5968e2070ccf0` compartilha a tree `70f07a2c936ce166555e52b36366c810919f5b8c` do candidato validado.

## Objetivo

Eliminar a autonomia externa parcial do runtime por meio de adapters versionados, idempotentes, auditáveis e limitados por permissões, transformando as oito skills ainda documentais em capacidades executáveis comprovadas.

## Dependências

1. MCF-STAB-001: **concluído**;
2. PR #22 e PR #29: **reconciliados pela estabilização**;
3. Human Delegation Firewall: **preservar**;
4. ledger persistente e recibos assinados: **preservar**;
5. staging somente até gate posterior: **vigente**.

## Arquitetura-alvo

```text
MissionRuntime
→ ExternalActionDispatcher
→ PermissionEngine
→ AdapterRegistry
→ Adapter específico
→ serviço externo
→ ReceiptCollector
→ EvidenceValidator
→ EventLedger
→ CAF Recovery/Handoff
```

## Contrato mínimo de adapter

```yaml
adapter_id: string
adapter_version: semver
service: string
action: string
mission_id: string
phase_id: string
agent_id: string
permission_profile: string
idempotency_key: string
expected_state: object
validated_input: object
attempt: integer
started_at: timestamp
finished_at: timestamp
external_reference: string
result_status: SUCCEEDED|FAILED|BLOCKED|UNKNOWN
verified_evidence: object
external_effect: NONE|REVERSIBLE|MATERIAL
recovery_strategy: string
previous_healthy_state: object|null
final_state: object
```

## Regras obrigatórias

- nenhuma ação externa sem permissão compatível;
- nenhuma declaração de sucesso sem evidência externa verificável;
- retries limitados e registrados;
- idempotência obrigatória para operações de escrita;
- timeout explícito;
- segredo somente em ambiente protegido;
- redaction de credenciais e dados sensíveis;
- estado `UNKNOWN` quando o efeito externo não puder ser comprovado;
- ação material exige gate correspondente;
- Leandro não pode ser executor ou destinatário técnico;
- produção permanece bloqueada nesta missão.

## Ordem técnica e estado

### Lote 1 — menor risco

1. adapter de revisão de código — **CONCLUÍDO / A1**;
2. adapter de consulta de CI — **CONCLUÍDO / A2**;
3. recibos e validação semântica — **CONCLUÍDOS para A1/A2**.

### Lote 2 — escrita reversível

4. adapter de branch e pull request — **IMPLEMENTAÇÃO INTEGRADA / C1**;
5. escrita real controlada pelo provider GitHub — **PENDENTE DE AUTORIZAÇÃO/PROVA**;
6. comentários, reviews informativos e atualização de metadados textuais — **IMPLEMENTAÇÃO INTEGRADA / C2**;
7. prevenção de duplicidade por idempotency key — **IMPLEMENTADA e ampliada em C1/C2**, incluindo escopo global persistente, recuperação controlada e tombstone de fingerprint.

### Lote 3 — efeito operacional — CONCLUÍDO

8. adapter de deploy para staging — **IMPLEMENTADO, PROVADO E INTEGRADO / GATE D**;
9. verificação de SHA por health/version — **INTEGRADA E REVALIDADA**;
10. recovery por redeploy do SHA saudável anterior — **INTEGRADO como estratégia controlada; não é rollback nativo do Render**;
11. observabilidade e alertas de missão bloqueada — **IMPLEMENTADA, RECUPERADA E INTEGRADA**, com rechecagem atômica de estado+versão antes do alerta.

### Lote 4 — cobertura total

12. converter as oito skills documentais — **EM EXECUÇÃO / LOT 4-A + LOT 4-B + LOT 4-C INTEGRADOS / 6 DE 8 CONVERTIDAS**;
13. executar testes com agentes em contextos separados — **PENDENTE**;
14. auditoria independente final — **PENDENTE**;
15. preparar MCF v1.0.0-RC1 — **PENDENTE**.

## MCF-RUNTIME-006-A1 — Code Review Read Only

### Objetivo

Permitir que o runtime revise uma alteração em um repositório sem realizar escrita externa.

### Entrada

```yaml
repository:
base_sha:
head_sha:
pull_request_number:
review_scope:
expected_files:
```

### Operações permitidas

- obter metadados do repositório;
- validar base e head;
- listar arquivos alterados;
- obter diff ou patches;
- classificar achados;
- produzir recibo de revisão;
- persistir evidência no ledger.

### Operações proibidas

- comentar no PR;
- aprovar ou solicitar mudanças;
- alterar branch;
- criar commit;
- fazer merge;
- iniciar deploy;
- modificar configuração externa.

### Recibo

```yaml
receipt_type: code_review
adapter_id: github_code_review_read_only
repository:
base_sha:
head_sha:
pull_request_number:
changed_files:
reviewed_files:
findings:
verdict:
provider_observed_at:
payload_digest:
idempotency_key:
```

### Critérios de aceite

```yaml
sha_verified: true
changed_files_listed: true
review_scope_respected: true
findings_classified: true
verdict_explicit: true
receipt_persisted: true
external_write: false
unit_tests: PASS
integration_tests: PASS
security_review: PASS
```

### Estado

```yaml
state: INTEGRADO
merge_commit: 01c0182b9c9837c0dd22306c9bd8918020ecc38b
external_write: false
```

## Critérios de aceite por adapter

```yaml
contract_validation: PASS
permission_tests: PASS
idempotency_tests: PASS
timeout_tests: PASS
retry_tests: PASS
receipt_signature: PASS
evidence_validation: PASS
recovery_test: PASS
integration_staging: PASS
secret_scan: PASS
```

Os critérios acima devem ser avaliados por adapter. Um `PASS` de uma capacidade anterior não transfere automaticamente o resultado para um novo adapter.

## Gates

### Gate A — contrato comum

**CONCLUÍDO no recorte já integrado.**

### Gate B — leitura externa

**CONCLUÍDO** com A1 e A2 integrados.

### Gate C — escrita externa

**PARCIAL.**

- implementação de branch/PR integrada em C1;
- implementação de comentários, review `COMMENT` e metadados `title`/`body` integrada em C2;
- escrita real pelo provider GitHub do C1/C2 permanece `NOT_AUTHORIZED`;
- produção permanece bloqueada.

### Gate D — staging

**CONCLUÍDO E INTEGRADO.**

- issue #83 / PR #84;
- release funcional provado: `c787179e126a93af96dd67604cb24f91235c4320`;
- prova real controlada de Gate D: run `31438199266`, `PASS/DEPLOYED`;
- closeout exact-head: `ea63828435589a78bafcab916b51b4fc5aea1102`;
- merge protegido por `expected_head_sha`, squash, commit `2dfeb0e23c5c2e19a2c21e6f2c50a1a4f466d06a`;
- staging pós-merge `31442205251` PASS, outcome `DEPLOYED`;
- live registry permanece `DISABLED` e produção `BLOCKED`.

### Gate E — RC

**PENDENTE.**

- 16 skills executáveis;
- zero skill apenas documental;
- auditoria sem achados críticos ou altos;
- documentação sincronizada;
- decisão final submetida a Leandro.

## Riscos principais

- adapters declararem sucesso após timeout;
- callback repetido produzir efeito duplicado;
- permissões excessivas;
- divergência entre SHA solicitado e SHA implantado;
- missão-pai ser encerrada após subfluxo;
- recibo sintético ser aceito como evidência externa;
- segredo aparecer em log;
- documentação de estado ficar atrás da implementação e induzir retomada incorreta.

## Fora do escopo

- publicação irrestrita em produção;
- gastos ou contratação de serviços;
- postagem social automática;
- merge automático sem política específica;
- rollback nativo do Render enquanto não houver comprovação técnica.

## Próxima ação

Formalizar o próximo boundary independente para `MCF-DEBUG-INCIDENT`, a partir da `main` canônica após o closeout documental do Lot 4-C. `MCF-CLOSE-PHASE` permanece documental e deve ter incremento próprio. Não repetir A1, A2, C1, C2, Gate D, observabilidade do Lote 3, Lot 4-A, Lot 4-B ou Lot 4-C. A autorização de escrita real pelo provider GitHub continua sendo um gate separado. Produção e ativação do staging adapter no live registry permanecem bloqueadas até gate próprio. Nenhuma Issue Lot 4-D existente é presumida antes de sua formalização.

## Critério de conclusão da missão

```yaml
skills_registradas: 16
skills_executaveis: 16
skills_documentais: 0
adapters_confiaveis: PASS
agentes_isolados: PASS
staging_e2e: PASS
recovery: PASS
auditoria_independente: PASS
pendencias_criticas: 0
pendencias_altas: 0
release_candidate: MCF_v1.0.0_RC1
```
