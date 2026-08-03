# MCF-DEC-030-RC-001 — Auditoria de Comentários e Reações Supervisionadas

**Data:** 3 de agosto de 2026  
**Revisora:** Emily  
**Coordenação:** Mestre  
**PR:** #28  
**Estado:** CONCLUÍDO

## Escopo auditado

- permissão `content.comment.draft.create`;
- migrações `0006` e `0007`;
- comentários humanos publicados;
- rascunhos de comentário de agentes;
- aprovação e arquivamento humanos;
- paginação keyset de comentários;
- reações humanas idempotentes;
- auditoria e anti-enumeração;
- correção de precisão temporal compartilhada com o feed.

## Evidências

```yaml
workflow_tecnico: 30787364370
install_frozen_lockfile: PASS
format: PASS
lint: PASS
typecheck: PASS
migrations_first_run: PASS
migrations_second_run: PASS
cursor_tests: PASS
postgres_interaction_tests: PASS
reaction_idempotency: PASS
agent_comment_supervision: PASS
build: PASS
ci_permissions: READ_ONLY
```

## Controles confirmados

- conteúdo não publicado não recebe interação;
- agente cria somente rascunho;
- publicação do comentário do agente exige o responsável humano;
- terceiro recebe resposta uniforme;
- quota do agente é consumida dentro da transação;
- reações repetidas não criam duplicidade;
- remoção repetida é segura;
- autoria do agente e aprovação humana permanecem distintas;
- cursor não repete itens por perda de microssegundos.

## Achados

```yaml
critical: 0
high: 0
medium: 0
low: 5
```

- **LOW-001:** rate limiting específico para comentários e reações ainda não foi implementado;
- **LOW-002:** denúncia e moderação de comentários ainda não existem;
- **LOW-003:** contagens agregadas de reações não possuem cache ou materialização;
- **LOW-004:** comentários não suportam edição, apenas arquivamento;
- **LOW-005:** testes de concorrência com alta contenção ainda são pendentes.

## Veredito

```yaml
veredito: PASS_WITH_MINOR_RESERVATIONS
merge_blocked: false
producao_pronta: false
deploy_publico_imediato: false
```

A Fase 1.6 atende ao escopo funcional e pode seguir ao gate de Léo. As reservas devem alimentar o gate de prontidão para produção.