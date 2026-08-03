# BRUNO-RFC-002 — Arquitetura Pública de Custo Zero

**Data:** 3 de agosto de 2026  
**Responsável:** Bruno — Plataforma, DevOps e SRE  
**Restrição de Leandro:** tudo deve permanecer gratuito  
**Estado:** RECOMENDADO

## Decisão recomendada

```yaml
frontend: Cloudflare_Pages_Free
api: Render_Free_Web_Service_Docker
database: Neon_Free_Postgres
worker_separado: NAO_NECESSARIO_NO_ESTADO_ATUAL
fila_futura: Cloudflare_Queues_Free
backup_externo: Cloudflare_R2_Free_com_dump_criptografado
ci_cd: GitHub_Actions_repositorio_publico
custo_mensal_obrigatorio: USD_0
cartao_obrigatorio_para_stack_principal: NAO
```

## Justificativa

A arquitetura principal preserva a API NestJS/Fastify e os Dockerfiles já validados. O Render Free aceita Docker e não exige pagamento para o primeiro deploy. Sem método de pagamento, a plataforma suspende o serviço em vez de cobrar excedentes.

O Neon Free mantém PostgreSQL, não exige cartão e fornece conexão com pool. Isso evita reescrever o modelo de dados atual para SQLite/D1.

O frontend React/Vite é estático e pode ser publicado no Cloudflare Pages Free. Solicitações de arquivos estáticos são gratuitas e ilimitadas dentro das regras do plano.

O worker atual apenas valida configuração e registra `worker_started`; não existe processamento funcional que exija um segundo serviço permanente. Quando tarefas reais surgirem, deverão usar Cloudflare Queues Free ou execução agendada compatível com custo zero.

## Limites obrigatórios

```yaml
classificacao: PILOTO_PUBLICO_GRATUITO
sla: NAO_OFERECIDO
api_sleep_after_idle: 15_minutos
cold_start_estimado: ate_1_minuto
render_free_hours: 750_por_mes
neon_storage: 0.5_GB
neon_compute: 100_CU_hours_por_mes
neon_transfer: 5_GB_por_mes
cloudflare_pages_builds: 500_por_mes
cloudflare_queues: 10000_operacoes_por_dia
r2_storage_free: 10_GB_month
```

## Controles contra cobrança

- não adicionar método de pagamento ao Render;
- não ativar plano pago no Neon;
- não habilitar Workers Paid ou Containers;
- não ultrapassar R2 Free Tier; se checkout exigir faturamento, R2 fica desativado e o backup será local criptografado;
- usar subdomínios gratuitos `pages.dev`, `onrender.com` e host Neon;
- configurar alertas de uso onde disponíveis;
- falhar por suspensão, nunca por cobrança automática.

## Alternativa futura totalmente edge

Cloudflare Pages + Workers + Queues + Neon via Hyperdrive também pode operar a custo zero, mas exige substituir NestJS/Fastify por runtime compatível com Workers e revisar autenticação, hashing de senha e transações. Não é a primeira escolha porque amplia o escopo e abandona artefatos Docker já validados.

## Opções rejeitadas

### Koyeb Free

Rejeitado porque exige cartão, aplica pré-autorização e pode cobrar plano selecionado durante o cadastro.

### Render Postgres Free

Rejeitado porque expira após 30 dias e não possui backups.

### GitHub Pages

Rejeitado como frontend principal porque as regras do serviço não o destinam a software como serviço. O Cloudflare Pages não impõe essa incompatibilidade ao produto.

### Fly.io, Railway, Vercel Pro e Supabase Pro

Rejeitados por não atenderem ao custo obrigatório de USD 0.

## Gate de implantação

A adaptação interna pode continuar automaticamente. A criação de contas externas ainda pode exigir ação de Leandro para autenticação nos provedores, mas não pode exigir autorização financeira.