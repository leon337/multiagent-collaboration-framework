# MCF-DEC-024-RC-001 — Revisão de Permissões e Autonomia Nível 1

**Data:** 2 de agosto de 2026  
**Revisora:** Emily  
**PR:** #24  
**HEAD técnico auditado:** `7d9b56863adfcebce682ddb94e8a507f7565dde7`  
**Workflow técnico:** `30777158277`  

## 1. Escopo auditado

- catálogo fechado de três permissões internas;
- concessão supervisionada pelo responsável humano ativo;
- escopo global ou por recurso;
- quota opcional e consumo transacional;
- validade, expiração e revogação;
- decisão negada por padrão;
- auditoria de concessões, revogações, aceitações e negações;
- API protegida por sessão humana;
- migração PostgreSQL `0003`;
- testes unitários e de integração.

## 2. Evidências

```yaml
install_frozen_lockfile: PASS
format: PASS
lint: PASS
typecheck: PASS
migration_0003_first_run: PASS
migration_0003_second_run: PASS
unit_tests: PASS
postgres_integration_tests: PASS
build: PASS
workflow_run: 30777158277
```

## 3. Controles confirmados

1. Códigos de permissão são uma união fechada, não texto arbitrário.
2. Permissão ausente resulta em `PERMISSION_NOT_GRANTED`.
3. Agente fora de `ACTIVE` resulta em `AGENT_NOT_ACTIVE`.
4. Grant expirado resulta em `GRANT_EXPIRED`.
5. Quota esgotada resulta em `QUOTA_EXHAUSTED`.
6. Consumo de quota ocorre dentro de transação e sob bloqueio de linha.
7. Concessão, revogação e avaliação via HTTP exigem vínculo responsável ativo.
8. Recursos inexistentes ou sem vínculo usam a mesma resposta pública.
9. Publicação social e execução externa permanecem fora do catálogo.
10. Todas as decisões relevantes geram evento de auditoria correlacionado.

## 4. Reservas não bloqueantes

```yaml
low_1: credencial_propria_de_agente_ainda_nao_existe
low_2: quota_atual_e_acumulada_sem_janela_periodica
low_3: listagem_de_grants_ainda_nao_implementada
low_4: concorrencia_validada_por_transacao_mas_sem_teste_de_carga
low_5: grants_de_moderacao_ou_sistema_ainda_nao_implementados
```

Essas reservas não permitem ampliar autonomia nem acessar sistemas externos. Elas delimitam trabalho futuro.

## 5. Veredito

```yaml
veredito: PASS_WITH_MINOR_RESERVATIONS
critical: 0
high: 0
medium: 0
low: 5
merge_tecnico: APTO
producao: NAO_AUTORIZADA
deploy_publico: NAO_AUTORIZADO
```
