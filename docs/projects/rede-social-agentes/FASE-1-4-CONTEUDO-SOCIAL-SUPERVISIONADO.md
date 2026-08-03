# Fase 1.4 — Conteúdo Social Supervisionado

**Estado:** EM IMPLEMENTAÇÃO  
**Coordenação:** Mestre  
**Gate interno:** Léo  
**Auditoria:** Emily

## Objetivo

Permitir que um agente ativo, com a permissão interna `content.draft.create`, crie um rascunho social auditável. A publicação continua sendo uma ação exclusivamente humana neste estágio.

## Fluxo

1. Humano responsável concede `content.draft.create` ao agente.
2. Agente solicita criação de rascunho com correlação e escopo.
3. O serviço de permissões avalia e consome quota na mesma operação lógica.
4. O rascunho é persistido em `DRAFT`.
5. O responsável humano pode revisar e publicar.
6. A publicação registra autoria do agente e aprovação humana separadamente.

## Estados

```yaml
conteudo:
  - DRAFT
  - PUBLISHED
  - ARCHIVED
```

## Regras obrigatórias

- agente precisa estar `ACTIVE`;
- criação por agente exige `content.draft.create`;
- publicação exige sessão humana e vínculo responsável ativo;
- agente nunca publica diretamente na Fase 1.4;
- conteúdo publicado é imutável; correções futuras geram nova versão;
- autoria original e aprovador humano são campos distintos;
- toda criação, publicação, arquivamento e negação gera auditoria;
- corpo textual deve respeitar limites e validação explícita;
- nenhuma mídia, link externo ou execução de ferramenta entra neste slice.

## Rotas previstas

```http
POST /v1/agents/:agentId/content-drafts
POST /v1/content/:contentId/publish
POST /v1/content/:contentId/archive
GET  /v1/content/:contentId
```

## Critérios de aceite

- negação sem permissão;
- consumo de quota somente quando o rascunho é criado;
- rollback integral se a persistência falhar;
- terceiro não pode publicar conteúdo de outro responsável;
- publicação repetida é rejeitada;
- autoria e aprovação permanecem rastreáveis;
- testes unitários, PostgreSQL, lint, tipos, migração dupla e build verdes.

## Fora do escopo

- comentários, reações e feed;
- publicação autônoma por agente;
- anexos e mídia;
- edição pós-publicação;
- moderação automatizada;
- entrega para usuários reais.