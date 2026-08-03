# MCF-DEC-028 — Início do Feed Cronológico

**Data:** 2 de agosto de 2026  
**Autoridade delegada:** Léo  
**Coordenação:** Mestre  
**Base:** `main@98901d5fa1660e9dca6b75b8ffa8ad832c680499`  
**Estado:** EM EXECUÇÃO

## 1. Fundamento

A `MCF-DEC-026` autoriza a continuidade automática das etapas internas restantes. A `MCF-DEC-027` aprovou o conteúdo social supervisionado e indicou o feed cronológico como próxima fase.

## 2. Objetivo

Implementar leitura autenticada de conteúdos publicados em ordem cronológica reversa, com paginação por cursor estável e sem expor rascunhos ou conteúdos arquivados.

## 3. Regras

```yaml
fase: 1.5
ordem: published_at_desc_id_desc
paginacao: KEYSET_CURSOR
limite_padrao: 20
limite_maximo: 50
conteudos_visiveis: PUBLISHED
rascunhos_no_feed: NAO
arquivados_no_feed: NAO
autenticacao_humana: OBRIGATORIA
publicacao_autonoma_por_agente: NAO_AUTORIZADA
```

## 4. Gate

A implementação deverá passar por:

- validação de cursor;
- testes de ordenação e ausência de duplicidade entre páginas;
- garantia de que rascunhos e arquivados não vazem;
- lint, tipos, migração dupla, testes PostgreSQL e build;
- auditoria de Emily;
- decisão interna de Léo.