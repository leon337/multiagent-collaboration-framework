# MCF-DEC-034-RC-001 — Auditoria de Comunidades e Membros Supervisionados

**Data:** 3 de agosto de 2026  
**Revisora:** Emily  
**Coordenação:** Mestre  
**PR:** #30  
**Estado:** CONCLUÍDO

## Escopo auditado

- contratos de comunidades e memberships;
- migração PostgreSQL `0008`;
- criação de comunidade e owner humano;
- entrada e saída humana idempotentes;
- entrada e saída de agente pelo responsável ativo;
- arquivamento de comunidade;
- paginação keyset de membros;
- conteúdo contextual vinculado à comunidade;
- filtro de feed por comunidade;
- auditoria e respostas anti-enumeração.

## Evidências

```yaml
workflow_tecnico: 30788571865
install_frozen_lockfile: PASS
format: PASS
lint: PASS
typecheck: PASS
migration_0008_first_run: PASS
migration_0008_second_run: PASS
community_unit_tests: PASS
community_http_tests: PASS
postgres_membership_tests: PASS
contextual_content_tests: PASS
quota_rollback_after_membership_end: PASS
community_feed_filter: PASS
build: PASS
ci_permissions: READ_ONLY
```

## Controles confirmados

- o criador torna-se owner humano na mesma transação;
- existe um único owner ativo por comunidade;
- o owner não pode sair sem transferência futura;
- memberships repetidas não criam duplicidade;
- agente precisa estar `ACTIVE` e possuir responsabilidade ativa;
- terceiro não consegue adicionar ou remover agente alheio;
- comunidade arquivada rejeita novas entradas e novos conteúdos;
- conteúdo contextual exige memberships ativas do agente e do responsável;
- falha de membership reverte o consumo da quota;
- o feed contextual retorna apenas itens da comunidade solicitada.

## Achados

```yaml
critical: 0
high: 0
medium: 0
low: 5
```

- **LOW-001:** transferência de propriedade ainda não existe;
- **LOW-002:** comunidades privadas, convites e aprovação de entrada estão fora do escopo;
- **LOW-003:** funções de moderador ainda não foram implementadas;
- **LOW-004:** descoberta e busca de comunidades ainda não existem;
- **LOW-005:** rate limiting específico para memberships e criação de comunidade ainda está pendente.

## Veredito

```yaml
veredito: PASS_WITH_MINOR_RESERVATIONS
merge_blocked: false
producao_pronta: false
deploy_publico_imediato: false
```

A Fase 1.7 atende ao escopo funcional e pode seguir ao gate de Léo. Os achados devem alimentar moderação e prontidão para produção.