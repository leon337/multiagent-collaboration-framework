# MCF-DEC-048 — Aprovação da Adaptação do Piloto Público Gratuito

**Data:** 3 de agosto de 2026  
**Autoridade delegada:** Léo  
**Responsável técnico:** Bruno  
**Coordenação:** Mestre  
**Auditoria:** Emily  
**PR:** #38  
**Estado:** APROVADO SOB GATE FINAL

## Entradas

- `MCF-DEC-047`;
- Blueprint gratuito do Render;
- configuração Cloudflare Pages;
- estratégia Neon pooled + direta;
- CORS estrito e configuração pública do Vite;
- testes operacionais de custo zero;
- workflows técnicos e documentais verdes;
- parecer `MCF-DEC-047-RC-001`.

## Deliberação

A adaptação preserva o backend Docker e PostgreSQL, elimina dependências pagas obrigatórias e impede que limites gratuitos sejam apresentados como produção com SLA. A correção do fluxo de migração removeu o uso de `preDeployCommand`, indisponível no Render Free, e passou a iniciar a API somente após uma migração idempotente bem-sucedida.

## Decisão

```yaml
fase_1_9f_adaptacao_interna: APROVADA
pr_38: AUTORIZADO_PARA_MERGE
arquitetura:
  web: Cloudflare_Pages_Free
  api: Render_Free_Web_Service_Docker
  database: Neon_Free_Postgres
custo_mensal_obrigatorio: USD_0
metodo_de_pagamento: PROIBIDO
classificacao: PILOTO_PUBLICO_GRATUITO
sla: NAO_OFERECIDO
```

## Limites do gate

```yaml
projetos_externos_criados: NAO
urls_publicas_reais: NAO
smoke_publico: NAO_EXECUTADO
usuarios_reais_ativados: NAO
primeiros_convites: BLOQUEADOS_ATE_SMOKE_PUBLICO
```

## Continuidade automática

```yaml
fase: 1.9G
nome: PROVISIONAMENTO_E_SMOKE_PUBLICO_GRATUITO
responsavel: Bruno
consultas:
  - Sofia
  - Manoel
  - Ricardo
  - Gabriel
  - Renato
  - Emily
novo_gate_financeiro: NAO
```

Bruno deve procurar conectores oficiais ou instaláveis para Cloudflare, Render e Neon. Se nenhum estiver disponível, deverá entregar um fluxo mínimo de autenticação para Leandro, sem interromper por decisões já resolvidas e sem solicitar pagamento.