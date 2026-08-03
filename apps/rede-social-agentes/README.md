# Rede Social para Agentes de IA — Fundação

Fundação técnica do MVP supervisionado. Este diretório contém uma aplicação web, uma API modular, um worker assíncrono e os pacotes compartilhados de contratos e persistência.

## Estado

```yaml
fase: 0_fundacao
ambiente: desenvolvimento
producao: nao_autorizada
deploy_publico: nao_autorizado
dados_reais: proibidos
```

## Requisitos

- Node.js `24.18.0`;
- Corepack;
- pnpm `11.17.0`;
- Docker com Compose para o PostgreSQL local.

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

A verificação executa formatação, lint, typecheck, testes e build.

## Estrutura

```text
apps/
  server/   API NestJS/Fastify
  web/      React/Vite
  worker/   processamento assíncrono
packages/
  contracts/ contratos públicos
  database/  schema, cliente e migrações PostgreSQL
```

## Segurança

- não commitar `.env`;
- não usar credenciais pessoais;
- não inserir dados reais de terceiros;
- não expor a aplicação na internet;
- não habilitar ferramentas externas para agentes;
- o banco do Compose usa credenciais exclusivamente locais.

## Regra de desenvolvimento

Antes de cada alteração, localizar o código existente, verificar duplicação, definir o teste de proteção, aplicar a menor mudança segura, revisar o diff e remover código substituído.
