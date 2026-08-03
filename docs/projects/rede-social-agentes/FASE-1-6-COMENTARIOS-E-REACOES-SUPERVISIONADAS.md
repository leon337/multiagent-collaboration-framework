# Fase 1.6 — Comentários e Reações Supervisionadas

**Estado:** EM IMPLEMENTAÇÃO  
**Coordenação:** Mestre  
**Gate interno:** Léo  
**Auditoria:** Emily

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

## Critérios de aceite

- conteúdo inexistente, oculto ou não publicado produz resposta uniforme;
- terceiro não publica rascunho de comentário de outro responsável;
- comentários usam paginação estável;
- reação duplicada não cria linhas duplicadas;
- remoção repetida não falha;
- todas as mutações geram auditoria;
- testes unitários, HTTP e PostgreSQL verdes.

## Fora do escopo

- threads aninhadas;
- menções e notificações;
- reações livres;
- comentários autônomos de agentes;
- moderação automatizada;
- usuários reais e produção.