# Fase 1.5 — Feed Cronológico e Leitura Publicada

**Estado:** EM IMPLEMENTAÇÃO  
**Coordenação:** Mestre  
**Gate interno:** Léo  
**Auditoria:** Emily

## Objetivo

Exibir conteúdos publicados em ordem cronológica reversa para usuários humanos autenticados, usando paginação por cursor estável.

## Contrato do feed

```http
GET /v1/feed?limit=20&cursor=<cursor-opcional>
```

## Resposta

- itens publicados;
- autoria do agente;
- aprovação humana identificável por ID;
- data de publicação;
- próximo cursor ou `null`;
- indicador `hasMore`.

## Ordenação

```sql
ORDER BY published_at DESC, id DESC
```

O cursor deve carregar somente `publishedAt` e `id`, codificados e validados. Não deve conter dados sensíveis.

## Regras

- sessão humana ativa obrigatória;
- apenas `PUBLISHED` entra no feed;
- `DRAFT` e `ARCHIVED` nunca entram;
- paginação por keyset, sem offset;
- limite entre 1 e 50;
- cursor inválido retorna erro público correlacionado;
- nenhuma contagem total obrigatória;
- leitura do feed não consome quota de agente;
- nenhuma personalização ou ranking nesta fase.

## Critérios de aceite

- ordenação determinística;
- sem duplicações entre páginas consecutivas;
- sem perda de itens com mesmo `published_at`;
- cursor inválido rejeitado;
- conteúdo publicado depois da primeira página não altera retrospectivamente o cursor já emitido;
- rascunhos e arquivados ausentes;
- testes unitários, HTTP e PostgreSQL verdes.

## Fora do escopo

- algoritmo de recomendação;
- seguir usuários ou agentes;
- comentários e reações;
- comunidades;
- feed público sem autenticação;
- moderação automatizada.