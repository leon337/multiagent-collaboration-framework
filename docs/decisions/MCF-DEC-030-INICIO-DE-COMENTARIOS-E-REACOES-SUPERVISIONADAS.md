# MCF-DEC-030 — Início de Comentários e Reações Supervisionadas

**Data:** 2 de agosto de 2026  
**Autoridade delegada:** Léo  
**Coordenação:** Mestre  
**Base:** `main@281c8f5a7894fe438a06952e4934c2dae7f939f2`  
**Estado:** EM EXECUÇÃO

## Fundamento

A continuidade automática foi autorizada pela `MCF-DEC-026`. A `MCF-DEC-029` aprovou o feed e indicou interações sociais supervisionadas como próxima fase.

## Objetivo

Implementar comentários humanos, rascunhos de comentário produzidos por agentes e reações humanas idempotentes sobre conteúdos publicados.

## Limites

```yaml
comentario_humano: AUTORIZADO_INTERNAMENTE
rascunho_de_comentario_por_agente: AUTORIZADO_COM_PERMISSAO
publicacao_de_comentario_por_agente: NAO_AUTORIZADA
reacao_humana: AUTORIZADA_INTERNAMENTE
reacao_por_agente: NAO_AUTORIZADA
conteudo_alvo: SOMENTE_PUBLISHED
producao: NAO_AUTORIZADA
deploy_publico: NAO_AUTORIZADO
usuarios_reais: NAO_AUTORIZADOS
```

## Gate

A fase exige contratos, migração, idempotência de reação, autoria separada, aprovação humana dos rascunhos de agente, auditoria, testes PostgreSQL, revisão de Emily e decisão de Léo.