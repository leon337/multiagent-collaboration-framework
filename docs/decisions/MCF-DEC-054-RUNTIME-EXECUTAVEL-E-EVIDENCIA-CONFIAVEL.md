# MCF-DEC-054 — Runtime Executável, Evidência Confiável e Estado Persistente

**Data:** 4 de agosto de 2026  
**Autoridade humana:** Leandro  
**Autoridade operacional:** Léo  
**Coordenação:** Mestre  
**Estado:** implementado em candidato de release  
**Relacionadas:** MCF-DEC-016, MCF-DEC-017, MCF-DEC-050, MCF-DEC-051, MCF-DEC-052 e MCF-DEC-053

## 1. Problema

O MCF possuía protocolo, skills, permissões, evidências e handoffs documentados, mas não possuía um runtime que aplicasse essas regras em código. Isso permitia que uma resposta textual declarasse execução sem que um componente automático verificasse recibos, versão do estado ou permissões.

## 2. Decisão

Adotar um recorte vertical executável com os seguintes componentes:

```text
MissionRuntime
├── SkillRegistryLoader
├── PermissionEngine
├── SkillExecutor
├── EvidenceValidator
├── MissionRepository
├── EventLedger
├── Handoff persistente
├── recuperação CAF
├── callback autenticado de CI
└── projeção social DRAFT_REVIEW
```

## 3. Skills executáveis do MVP

- `MCF-START-MISSION`;
- `MCF-IMPLEMENT-CHANGE`;
- `MCF-RUN-TESTS`.

As demais skills continuam registradas e normativas, mas o runtime deve rejeitar sua execução até que recebam adapter, testes e critérios de evidência próprios.

## 4. Invariantes executáveis

```yaml
skill_must_exist: true
skill_must_be_enabled_in_runtime: true
agent_must_be_selected_by_mission: true
agent_must_own_skill: true
required_inputs_must_exist: true
tool_must_be_allowed_by_skill: true
permission_profile_must_pass: true
direct_main_write: forbidden
destructive_or_public_action: human_gate
external_success_without_receipt: forbidden
receipt_signature: HMAC_SHA256
receipt_payload_digest: SHA256
mission_update: optimistic_versioning
callback: idempotent
handoff: persisted
failure_recovery: CAF
social_publication: never_automatic
```

## 5. Persistência

O runtime passa a persistir:

- missões;
- fases;
- recibos de ferramentas;
- handoffs;
- event ledger.

O ledger é a fonte de auditoria. A tabela de missão representa o estado materializado para retomada rápida.

## 6. Evidência

Uma operação externa só pode mudar o estado para executado quando houver recibo assinado e compatível com:

- provedor;
- operação;
- recurso;
- digest dos metadados;
- janela temporal;
- identificadores específicos do provedor.

GitHub exige `externalId` ou `commitSha`. GitHub Actions exige ID do workflow, SHA e conclusão.

## 7. Recuperação

Recibo inválido ou resultado externo falho move a fase e a missão para `RECOVERING`, registra `EVIDENCE_REJECTED` e `RECOVERY_STARTED`, preservando o fallback da skill.

O runtime não reinicia a missão automaticamente e não apaga evidências anteriores.

## 8. CI/CD

O workflow `MCF Runtime Integration` aceita:

- `workflow_dispatch`;
- `repository_dispatch` com tipo `mcf-run-tests`.

Ele executa `pnpm verify` e envia o resultado para o callback autenticado do MissionRuntime. O resultado de teste continua determinando o resultado final do workflow.

## 9. Timeline social

Eventos `PHASE_COMPLETED` e `MISSION_COMPLETED` podem ser projetados como candidatos sociais. Todo candidato nasce em `DRAFT_REVIEW`.

Não existe publicação automática. Aprovação humana continua obrigatória.

## 10. Limites declarados

Este recorte não é um substituto integral do Codex. Ele é um runtime de orquestração, estado, permissões e evidência para três skills.

A expansão para as demais skills exige adapters confiáveis e novos testes. A ativação do callback requer configurar `MCF_RUNTIME_URL` e `MCF_RUNTIME_TOKEN` no GitHub.

## 11. Gate

A integração na `main` depende de:

- migrations idempotentes;
- format, lint e typecheck aprovados;
- testes aprovados;
- build aprovado;
- auditoria independente;
- nenhuma alegação de execução sem recibo.
