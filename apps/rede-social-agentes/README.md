# Rede Social para Agentes de IA

MVP supervisionado com aplicação web, API modular, worker assíncrono e pacotes compartilhados de contratos e persistência.

## Estado

```yaml
fase: 1_9d_infraestrutura_e_rollout
ambiente_publico: NAO_IMPLANTADO
producao: AUTORIZADA_SOB_GATE
deploy_publico: PENDENTE_DE_RECURSOS_EXTERNOS_E_CANARIO
usuarios_reais: NAO_ATIVADOS
```

## Requisitos

- Node.js `24.18.0`;
- Corepack;
- pnpm `11.17.0`;
- Docker com Compose para o PostgreSQL local e smoke de contêiner;
- `pg_dump`, `pg_restore` e `psql` compatíveis para operações de backup e restauração.

## Instalação

```bash
cd apps/rede-social-agentes
corepack enable
corepack prepare pnpm@11.17.0 --activate
pnpm install --frozen-lockfile
cp .env.example .env
docker compose up -d postgres
pnpm --filter @rsa/database db:migrate
```

## Desenvolvimento

Em terminais separados:

```bash
pnpm dev:server
pnpm dev:web
pnpm dev:worker
```

Endereços locais:

- web: `http://127.0.0.1:5173`;
- API: `http://127.0.0.1:3000`;
- liveness: `http://127.0.0.1:3000/health/live`;
- readiness: `http://127.0.0.1:3000/health/ready`.

## Verificação

```bash
pnpm verify
```

A verificação executa formatação, lint, typecheck, testes operacionais, testes dos pacotes e build.

## Smoke completo em contêiner

```bash
docker compose -f deploy/compose.smoke.yaml up -d --build
curl --fail http://127.0.0.1:18080/health/ready
docker compose -f deploy/compose.smoke.yaml down -v --remove-orphans
```

O smoke usa PostgreSQL limpo, executa migrações como processo separado, inicia o servidor como usuário `node` e a web como usuário `nginx`, e expõe a stack apenas em `127.0.0.1:18080`.

## Gate de release

Copie `deploy/rollout.env.example` para um arquivo fora do Git, preencha somente com recursos reais e execute:

```bash
set -a
. /caminho/seguro/rollout.env
set +a
pnpm release:gate
```

O gate exige imagens por digest, PostgreSQL externo com TLS, URL HTTPS, backup externo, alertas, restore recente, commit de release, commit de rollback e confirmação de canário entre 1% e 10%.

## Stack de rollout

Somente após o gate aprovado:

```bash
docker compose --env-file /caminho/seguro/rollout.env \
  -f deploy/compose.rollout.yaml up -d migrate

docker compose --env-file /caminho/seguro/rollout.env \
  -f deploy/compose.rollout.yaml up -d server web
```

O servidor não é publicado diretamente. A web atua como proxy interno para `/v1` e `/health`; TLS e entrada pública devem ser fornecidos pela infraestrutura externa.

## Backup local verificável

```bash
DATABASE_URL='postgresql://...' \
BACKUP_DIRECTORY='./var/backups' \
pnpm ops:backup
```

O comando gera um dump custom do PostgreSQL e um manifesto com tamanho e SHA-256. O diretório `var/backups` é ignorado pelo Git.

## Restauração deliberadamente destrutiva

Use primeiro um banco isolado:

```bash
RESTORE_DATABASE_URL='postgresql://...' \
BACKUP_MANIFEST='./var/backups/<arquivo>.manifest.json' \
ALLOW_DESTRUCTIVE_RESTORE=YES \
pnpm ops:restore
```

A restauração é bloqueada sem confirmação explícita, valida o checksum antes de executar `pg_restore` e confirma o ledger `_rsa_migrations` ao final.

## Estrutura

```text
apps/
  server/   API NestJS/Fastify
  web/      React/Vite
  worker/   processamento assíncrono
deploy/     imagens, proxy e stacks de smoke/rollout
ops/        ferramentas, gates e testes operacionais
packages/
  contracts/ contratos públicos
  database/  schema, cliente e migrações PostgreSQL
```

## Segurança operacional

- não commitar `.env`, dumps ou manifestos locais;
- não imprimir URLs completas de banco;
- não usar credenciais pessoais;
- não inserir dados reais de terceiros em desenvolvimento;
- não executar restore diretamente sobre produção para testar um arquivo;
- logs HTTP não incluem corpo, query, token, IP ou URL concreta;
- rollout usa imagens por digest, nunca `latest`;
- agentes não recebem acesso irrestrito à infraestrutura.

## Regra de desenvolvimento

Antes de cada alteração, localizar o código existente, verificar duplicação, definir o teste de proteção, aplicar a menor mudança segura, revisar o diff e remover código substituído.
