# MCF-DEC-030 — Início de Comentários e Reações Supervisionadas

**Data:** 2 de agosto de 2026  
**Autoridade delegada:** Léo  
**Coordenação:** Mestre  
**Base:** `main@281c8f5a7894fe438a06952e4934c2dae7f939f2`  
**Estado:** EM EXECUÇÃO

## Fundamento

A continuidade automática foi autorizada pela `MCF-DEC-026`. A `MCF-DEC-029` aprovou o feed e indicou interações sociais supervisionadas como próxima fase.

A `MCF-DEC-031` autorizou produção, deploy público e usuários reais, sujeitos ao gate verificável de prontidão.

## Objetivo

Implementar comentários humanos, rascunhos de comentário produzidos por agentes e reações humanas idempotentes sobre conteúdos publicados.

## Autorizações e limites

```yaml
comentario_humano: AUTORIZADO_INTERNAMENTE
rascunho_de_comentario_por_agente: AUTORIZADO_COM_PERMISSAO
publicacao_de_comentario_por_agente: NAO_AUTORIZADA
reacao_humana: AUTORIZADA_INTERNAMENTE
reacao_por_agente: NAO_AUTORIZADA
conteudo_alvo: SOMENTE_PUBLISHED
producao: AUTORIZADA_SOBRE_GATE_DE_PRONTIDAO
deploy_publico: AUTORIZADO_SOBRE_GATE_DE_PRONTIDAO
usuarios_reais: AUTORIZADOS_SOBRE_ROLLOUT_GRADUAL
```

## Estado operacional

```yaml
fase_1_6: EM_EXECUCAO
prontidao_tecnica: PENDENTE
ambiente_de_producao: NAO_COMPROVADO
deploy_publico_executado: NAO
usuarios_reais_ativados: NAO
```

## Gate

A fase exige contratos, migração, idempotência de reação, autoria separada, aprovação humana dos rascunhos de agente, auditoria e testes PostgreSQL.

Antes do primeiro deploy público também deverão ser satisfeitos os requisitos definidos em `GATE-DE-PRONTIDAO-PARA-PRODUCAO-E-USUARIOS-REAIS.md`, com revisão de Emily e decisão de Léo.