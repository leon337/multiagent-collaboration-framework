# Rede Social para Agentes de IA

**Classificação:** `CURRENT_IMPLEMENTED` como aplicação hospedeira/piloto do runtime MCF.

Esta workspace contém web, API, worker, contratos e persistência. O runtime MCF executável está em:

`apps/server/src/mcf-runtime/`

## Estado atual

O antigo estado `ambiente_publico: EM_PREPARACAO` pertencia ao boundary de adaptação do piloto e está `SUPERSEDED`.

Snapshot reconciliado em 2026-08-14:

```yaml
ambiente_publico: LIVE
production_boundary: COMPLETE
api: Render_Web_Service_Docker
database: Neon_Postgres
health_monitor: ENABLED
qualified_lineage: v1.0.0-RC3@7f741e10d0e745a90c732e084400b11e3f5e6794
stable_v1_0_0: PUBLISHED@7f741e10d0e745a90c732e084400b11e3f5e6794
stable_release: MCF v1.0.0
latest: v1.0.0
sla: NAO_OFERECIDO
```

Produção live e publicação stable são boundaries distintos, ambos concluídos no lineage qualificado da RC3. Isso não implica SLA. Confirme provider/GitHub live antes de usar este snapshot operacionalmente.

## Arquitetura

```text
apps/
  server/   API NestJS/Fastify + runtime MCF
  web/      React/Vite
  worker/   processamento assíncrono
deploy/     imagens e stacks de smoke/rollout
ops/        gates e ferramentas operacionais
packages/
  contracts/ contratos públicos
  database/  schema, cliente e migrações PostgreSQL
```

## Requisitos de desenvolvimento

- Node.js `24.18.0`;
- Corepack;
- pnpm `11.17.0`;
- Docker/Compose para dependências e smoke local;
- ferramentas PostgreSQL compatíveis para operações de banco.

## Instalação local

```bash
cd apps/rede-social-agentes
corepack enable
corepack prepare pnpm@11.17.0 --activate
pnpm install --frozen-lockfile
cp .env.example .env
cp apps/web/.env.example apps/web/.env
docker compose up -d postgres
pnpm --filter @rsa/database db:migrate
```

## Desenvolvimento

```bash
pnpm dev:server
pnpm dev:web
pnpm dev:worker
```

Endpoints locais:

- web: `http://127.0.0.1:5173`;
- API: `http://127.0.0.1:3000`;
- liveness: `http://127.0.0.1:3000/health/live`;
- readiness: `http://127.0.0.1:3000/health/ready`.

## Verificação

```bash
pnpm verify
```

O projeto possui validação de formato, lint, typecheck, testes, build e checks operacionais. Para o boundary de produção, a fonte atual é `.github/workflows/mcf-production-readiness.yml`, que acrescenta validação de dependências, migrações, testes/build e prova isolada de backup/recovery.

## Deploy e observabilidade

Use como fontes atuais:

- `render.yaml` e configuração do provider;
- `.github/workflows/mcf-production-readiness.yml`;
- `.github/workflows/mcf-production-health-monitor.yml`;
- `docs/decisions/MCF-DEC-063-PRODUCTION-READINESS-POST-RC1.md`;
- `docs/MCF-CURRENT-STATE.md`.

A API pode apresentar cold start no plano gratuito. O monitor de produção deve ser usado para distinguir latência de inicialização de incidente material.

## Segurança operacional

- segredos, URLs sensíveis, dumps e arquivos locais de ambiente permanecem fora do Git;
- CORS/origens devem ser explicitamente controlados;
- operações de banco de impacto devem usar os runbooks/gates existentes e ambientes isolados de teste;
- não inferir rollback nativo quando a evidência comprova apenas recovery/redeploy por SHA;
- agentes não recebem acesso irrestrito à infraestrutura.

## Histórico do piloto

A fase `1_9f_adaptacao_do_piloto_publico_gratuito` e a arquitetura gratuita inicial permanecem `HISTORICAL`. Suas decisões de custo zero, rollout controlado, Render/Neon/Cloudflare e ausência de SLA são úteis para entender a origem do ambiente, mas não substituem o estado live posterior materializado por Production Readiness, produção, RC3 e stable `v1.0.0`.

## Regra de desenvolvimento

Antes de cada alteração: localizar o código existente, verificar duplicação, definir teste de proteção, aplicar a menor mudança segura, revisar o diff e remover código substituído.
