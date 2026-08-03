# BRUNO-RFC-001 — Arquitetura Pública e Runtime

**Data:** 3 de agosto de 2026  
**Responsável:** Bruno — Plataforma, DevOps e SRE  
**Consultados:** Sofia, Manoel, Ricardo, Lucas e Emily  
**Issue de origem:** #37  
**Estado:** RECOMENDAÇÃO CONCLUÍDA

## Decisão recomendada

```yaml
web:
  provedor: Vercel
  plano_recomendado_para_uso_profissional: Pro

api:
  provedor: Fly.io
  regiao: gru
  runtime: Docker
  processo: persistente

worker:
  provedor: Fly.io
  regiao: gru
  runtime: Docker
  processo: persistente_e_separado_da_api

database:
  provedor: Supabase
  projeto: dedicado
  regiao: sa-east-1
  plano_recomendado_para_producao: Pro
  conexao_runtime: pooler_session_mode_se_ipv4
  conexao_migracao_backup: direct_connection_quando_ipv6_disponivel

fallback_runtime:
  provedor: Railway
  regiao: us-east

reuse_de_banco_de_outro_produto: PROIBIDO
conversao_da_api_para_serverless: NAO_RECOMENDADA
```

## Motivos principais

1. A aplicação já foi validada como API NestJS/Fastify persistente, worker separado e imagens Docker.
2. Fly.io oferece região em São Paulo, reduzindo latência para usuários brasileiros e para o Supabase em `sa-east-1`.
3. Railway e Render não oferecem região brasileira no inventário atual.
4. Fly.io suporta Docker, processos separados, health checks e estratégias de implantação compatíveis com o desenho existente.
5. Converter a API para funções serverless agora criaria retrabalho no ciclo de vida, conexões PostgreSQL, worker e observabilidade.
6. Supabase fornece PostgreSQL dedicado por projeto e modos de conexão adequados para backend persistente.
7. Vercel permanece adequado para a interface web, CDN, TLS e previews.

## Comparação resumida

| Critério | Fly.io | Railway | Render |
|---|---|---|---|
| Docker persistente | Sim | Sim | Sim |
| Worker separado | Sim | Sim | Sim |
| Região São Paulo | Sim (`gru`) | Não | Não |
| Health checks | Sim | Sim | Sim |
| Rollback/implantação controlada | Sim | Sim | Sim |
| Complexidade operacional | Média | Baixa | Baixa |
| Adequação regional | Alta | Média-baixa | Média-baixa |
| Papel recomendado | Principal | Fallback | Não selecionado |

## Estimativa mensal inicial

### Produção controlada recomendada

```yaml
vercel_pro: USD_20_mes
supabase_pro_micro: USD_25_mes
fly_api_2x_1GB: aproximadamente_USD_11_84_mes
fly_worker_512MB: aproximadamente_USD_3_32_mes
subtotal_estimado: aproximadamente_USD_60_16_mes
custos_variaveis:
  - egress
  - dominio
  - armazenamento_externo_de_backup
  - observabilidade_adicional
  - suporte_pago_opcional
```

### Piloto técnico não recomendado como produção definitiva

```yaml
vercel_hobby: USD_0_mes_somente_uso_pessoal_nao_comercial
supabase_free: USD_0_mes_com_limites_e_sem_garantias_de_producao
fly_api_512MB: aproximadamente_USD_3_32_mes
fly_worker_256MB: aproximadamente_USD_2_02_mes
subtotal_estimado: aproximadamente_USD_5_34_mes
```

O piloto barato serve apenas para validação restrita. Usuários reais e operação profissional devem usar a configuração de produção controlada.

## Conexão com Supabase

```yaml
runtime_persistente_com_ipv6:
  modo: direct
  uso: api_e_worker

runtime_persistente_ipv4_only:
  modo: shared_pooler_session
  porta: 5432

migracoes_e_backup:
  modo_preferencial: direct

serverless_temporario:
  modo: transaction_pooler
  aplicacao_neste_projeto: NAO_PLANEJADA
```

## Configuração inicial de capacidade

```yaml
api:
  maquinas: 2
  cpu: shared_1x_cada
  memoria: 1GB_cada
  healthcheck: /health/ready
  estrategia: rolling_ou_canary

worker:
  maquinas: 1
  cpu: shared_1x
  memoria: 512MB
  endpoint_publico: nenhum

banco:
  compute: micro
  backups: diarios
  restore_testado: obrigatorio
```

## Riscos

- Fly.io exige cartão e maior domínio operacional que Railway.
- Uma única região continua sendo ponto regional único de falha.
- O tráfego entre Fly.io e Supabase deve usar TLS e modo de conexão compatível com IPv4/IPv6.
- Vercel Hobby não é apropriado para uso comercial.
- Supabase Free não deve ser tratado como banco de produção definitivo.
- Custos aumentam com réplicas, egress, suporte e observabilidade.

## Fallback

Se Fly.io não puder ser contratado ou apresentar indisponibilidade de capacidade em `gru`, usar Railway em US East sem alterar o código da aplicação. A imagem Docker, os probes e as variáveis existentes devem permanecer iguais.

## Próximo gate material

Antes da criação de recursos, Leandro deve confirmar:

1. orçamento mensal aproximado de US$ 60;
2. criação de um projeto Supabase dedicado;
3. criação de organização/aplicativos Fly.io com cobrança;
4. upgrade ou criação do projeto Vercel Pro;
5. domínio público a ser utilizado.

Nenhum recurso externo foi criado por esta RFC.