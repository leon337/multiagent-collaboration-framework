# MCF-DEC-047 — Início da Adaptação do Piloto Público Gratuito

**Data:** 3 de agosto de 2026  
**Autoridade delegada:** Léo  
**Responsável técnico:** Bruno  
**Coordenação:** Mestre  
**Base:** `main@a5ff8f92f7858e63b721efcd4b5a6abc5d86a534`  
**Estado:** EM EXECUÇÃO

## Fundamento

Leandro determinou que toda a infraestrutura do primeiro piloto permaneça gratuita. A decisão `LEO-DEC-002` aprovou Cloudflare Pages Free para a web, Render Free Web Service para a API e Neon Free Postgres para persistência.

## Objetivo

Adaptar os artefatos existentes para implantação gratuita, preservando o backend NestJS/Fastify em Docker e o banco PostgreSQL, sem criar dependência paga ou cobrança automática.

## Escopo

```yaml
cloudflare_pages:
  monorepo_build: OBRIGATORIO
  headers_estaticos: OBRIGATORIOS
  fallback_spa: OBRIGATORIO
  api_url_por_variavel: OBRIGATORIA
render_free:
  dockerfile_existente: REUTILIZADO
  health_check: /health/ready
  migracao_pre_deploy: OBRIGATORIA
  segredos_no_git: PROIBIDOS
  auto_deploy: SOMENTE_APOS_CHECKS
neon_free:
  conexao_pooler_tls: RECOMENDADA
  projeto_dedicado: OBRIGATORIO
  reutilizacao_de_outros_bancos: PROIBIDA
aplicacao:
  cors_por_allowlist: OBRIGATORIO
  cold_start_declarado: OBRIGATORIO
  classificacao: PILOTO_PUBLICO_GRATUITO
```

## Limites

```yaml
custo_mensal_obrigatorio: USD_0
sla: NAO_OFERECIDO
render_sleep: ACEITO
neon_limites_gratuitos: ACEITOS
worker_dedicado: ADIADO
contas_externas: PODEM_EXIGIR_LOGIN_DE_LEANDRO
metodo_de_pagamento: PROIBIDO
```

## Gate

A adaptação interna deve continuar até CI, smoke, auditoria de Emily e decisão de Léo. A criação material dos projetos Cloudflare, Render e Neon somente será marcada como concluída após autenticação real nos provedores e obtenção das URLs públicas.