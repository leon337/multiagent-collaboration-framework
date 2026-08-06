# MCF-RUNTIME-006 — Adapters externos confiáveis

## Estado

`PLANEJADO`

## Autorização

Leandro autorizou o início da conclusão do MCF em 5 de agosto de 2026.

## Objetivo

Eliminar a autonomia externa parcial do runtime por meio de adapters versionados, idempotentes, auditáveis e limitados por permissões, transformando as oito skills ainda documentais em capacidades executáveis comprovadas.

## Dependências

1. concluir MCF-STAB-001;
2. reconciliar PR #22 e PR #29;
3. manter o Human Delegation Firewall;
4. preservar o ledger persistente e os recibos assinados;
5. executar somente em staging até gate posterior.

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

## Ordem técnica

### Lote 1 — menor risco

1. adapter de revisão de código;
2. adapter de consulta de CI;
3. recibos e validação semântica desses adapters.

### Lote 2 — escrita reversível

4. adapter de branch e pull request;
5. comentários, reviews e atualização de metadados;
6. prevenção de duplicidade por idempotency key.

### Lote 3 — efeito operacional

7. adapter de deploy para staging;
8. verificação de SHA por health/version;
9. recovery por redeploy do SHA saudável anterior;
10. observabilidade e alertas de missão bloqueada.

### Lote 4 — cobertura total

11. converter as oito skills documentais;
12. executar testes com agentes em contextos separados;
13. auditoria independente;
14. preparar MCF v1.0.0-RC1.

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

## Gates

### Gate A — contrato comum

- dispatcher definido;
- registry definido;
- schema de recibo aprovado;
- testes de permissão e idempotência verdes.

### Gate B — leitura externa

- revisão de código executável;
- CI consultável por SHA exato;
- evidência persistida no ledger.

### Gate C — escrita externa

- PR criado sem duplicidade;
- base, head e SHA confirmados;
- merge não executado automaticamente.

### Gate D — staging

- deploy por SHA aprovado;
- health/version confirmados;
- recovery controlado comprovado;
- nenhuma operação em produção.

### Gate E — RC

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
- segredo aparecer em log.

## Fora do escopo

- publicação irrestrita em produção;
- gastos ou contratação de serviços;
- postagem social automática;
- merge automático sem política específica;
- rollback nativo do Render enquanto não houver comprovação técnica.

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
