FROM node:24.18.0-alpine AS build

WORKDIR /workspace/apps/rede-social-agentes

RUN corepack enable \
  && corepack prepare pnpm@11.17.0 --activate

COPY apps/rede-social-agentes /workspace/apps/rede-social-agentes
COPY skills /workspace/skills

RUN pnpm install --frozen-lockfile \
  && pnpm build:packages \
  && pnpm --filter @rsa/server build

FROM node:24.18.0-alpine AS runtime

ENV NODE_ENV=production \
  HOST=0.0.0.0 \
  PORT=3000

WORKDIR /workspace/apps/rede-social-agentes

COPY --from=build --chown=node:node /workspace /workspace

USER node

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=6 \
  CMD node -e "fetch('http://127.0.0.1:3000/health/live').then((response) => { if (!response.ok) process.exit(1); }).catch(() => process.exit(1));"

CMD ["sh", "-c", "node packages/database/scripts/migrate.mjs && if [ \"$MCF_BOOTSTRAP_ISSUER\" = \"true\" ]; then exec node apps/server/dist/bootstrap-main.js; else exec node apps/server/dist/main.js; fi"]
