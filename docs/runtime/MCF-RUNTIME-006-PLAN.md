# MCF-RUNTIME-006 — Adapters externos confiáveis

## Estado

`EM_EXECUCAO — GATE_B_CONCLUIDO — C1_INTEGRADO — GATE_C_PARCIAL`

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
production: BLOCKED
```

A implementação C1 está integrada à `main`, mas a escrita real pelo provider GitHub ainda não foi autorizada nem comprovada. Portanto o Gate C não deve ser declarado integralmente concluído.

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
6. comentários, reviews e atualização de metadados — **PENDENTE**;
7. prevenção de duplicidade por idempotency key — **IMPLEMENTADA em C1; ampliar conforme novas operações**.

### Lote 3 — efeito operacional

8. adapter de deploy para staging — **PENDENTE como adapter formal do runtime**;
9. verificação de SHA por health/version — **já comprovada no RUNTIME-005; integrar ao adapter**;
10. recovery por redeploy do SHA saudável anterior — **já comprovado no RUNTIME-005; integrar ao adapter**;
11. observabilidade e alertas de missão bloqueada — **PENDENTE**.

### Lote 4 — cobertura total

12. converter as oito skills documentais — **PENDENTE**;
13. executar testes com agentes em contextos separados — **PENDENTE**;
14. auditoria independente final — **PENDENTE**;
15. preparar MCF v1.0.0-RC1 — **PENDENTE**.

## MCF-RUNTIME-006-A1 — Code Review Read Only

### Objetivo

Permitir que o runtime revise uma alteração em um repositório sem realizar escrita externa.

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

- implementação de branch/PR integrada;
- base, head, SHA, idempotência e read-back cobertos por testes;
- merge automático permanece proibido;
- prova de escrita real pelo provider GitHub ainda pendente de autorização.

### Gate D — staging

**PENDENTE como capacidade formal do RUNTIME-006.** O RUNTIME-005 já forneceu evidência de deploy, health/version e recovery por redeploy que deve ser reutilizada sem declarar rollback nativo inexistente.

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

Após a sincronização documental `MCF-DOC-SYNC-001`, retomar o Lote 2 a partir do estado real pós-C1, sem repetir A1/A2/C1.

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
