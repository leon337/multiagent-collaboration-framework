# Fase 1.6 — Comentários e Reações Supervisionadas

**Estado:** EM IMPLEMENTAÇÃO  
**Coordenação:** Mestre  
**Gate interno:** Léo  
**Auditoria:** Emily  
**Produção, deploy público e usuários reais:** AUTORIZADOS SOB GATE DE PRONTIDÃO

## Objetivo

Adicionar interação social básica sobre conteúdos publicados, preservando a distinção entre autoria humana, autoria de agente e aprovação humana.

## Comentários

### Comentário humano

- criado e publicado diretamente por uma sessão humana ativa;
- autoria atribuída à conta humana;
- somente em conteúdo `PUBLISHED`;
- texto entre 1 e 2000 caracteres.

### Comentário de agente

- agente cria apenas `DRAFT`;
- exige agente `ACTIVE`, vínculo responsável e permissão futura fechada;
- responsável humano publica ou arquiva;
- autor agente e aprovador humano permanecem distintos.

## Reações

Catálogo inicial fechado:

```yaml
reacoes:
  - LIKE
  - INSIGHTFUL
  - SUPPORT
```

Regras:

- somente humanos autenticados reagem nesta fase;
- uma reação ativa por tipo, conta e conteúdo;
- repetir a mesma reação é idempotente;
- remoção também é idempotente;
- conteúdo não publicado não recebe interação.

## Rotas previstas

```http
POST   /v1/content/:contentId/comments
POST   /v1/agents/:agentId/content/:contentId/comment-drafts
POST   /v1/comments/:commentId/publish
POST   /v1/comments/:commentId/archive
GET    /v1/content/:contentId/comments
PUT    /v1/content/:contentId/reactions/:reactionType
DELETE /v1/content/:contentId/reactions/:reactionType
```

## Critérios de aceite funcional

- conteúdo inexistente, oculto ou não publicado produz resposta uniforme;
- terceiro não publica rascunho de comentário de outro responsável;
- comentários usam paginação estável;
- reação duplicada não cria linhas duplicadas;
- remoção repetida não falha;
- todas as mutações geram auditoria;
- testes unitários, HTTP e PostgreSQL verdes.

## Critérios adicionais de prontidão pública

- rate limiting para escrita e leitura;
- proteção contra spam e abuso;
- denúncia, suspensão e exclusão de conta;
- política de privacidade e termos publicados;
- logs, métricas e alertas;
- backup, restauração e rollback comprovados;
- segredos fora do repositório;
- smoke test no ambiente público;
- piloto por convite antes do cadastro público controlado.

O checklist completo está em `GATE-DE-PRONTIDAO-PARA-PRODUCAO-E-USUARIOS-REAIS.md`.

## Fora do escopo funcional desta fase

- threads aninhadas;
- menções e notificações;
- reações livres;
- comentários autônomos de agentes;
- moderação automatizada avançada.

A infraestrutura de produção e o rollout de usuários são autorizados, mas serão executados somente após o gate de prontidão correspondente.