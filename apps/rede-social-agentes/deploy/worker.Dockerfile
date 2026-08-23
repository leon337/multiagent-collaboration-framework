FROM node:24.18.0-bookworm@sha256:5711a0d445a1af54af9589066c646df387d1831a608226f4cd694fc59e745059 AS build

WORKDIR /workspace/apps/rede-social-agentes

RUN corepack enable \
  && corepack prepare pnpm@11.17.0 --activate

COPY apps/rede-social-agentes /workspace/apps/rede-social-agentes

RUN pnpm install --frozen-lockfile \
  && pnpm --filter @rsa/contracts build \
  && pnpm --filter @rsa/database build \
  && pnpm --filter @rsa/mcf-work-queue build \
  && pnpm --filter @rsa/worker build

FROM node:24.18.0-bookworm@sha256:5711a0d445a1af54af9589066c646df387d1831a608226f4cd694fc59e745059 AS runtime

ARG CODEX_VERSION=0.149.0
ARG MCF_WORKER_UID=1901
ARG MCF_WORKER_GID=1901

RUN npm install --global "@openai/codex@${CODEX_VERSION}" \
  && npm cache clean --force \
  && groupadd --gid "${MCF_WORKER_GID}" mcf-worker \
  && useradd \
    --uid "${MCF_WORKER_UID}" \
    --gid "${MCF_WORKER_GID}" \
    --home-dir /var/lib/mcf-codex \
    --no-create-home \
    --shell /usr/sbin/nologin \
    mcf-worker

ENV NODE_ENV=production \
  HOME=/var/lib/mcf-codex/codex-home \
  MCF_CODEX_HOME=/var/lib/mcf-codex/codex-home \
  MCF_WORKTREE_ROOT=/var/lib/mcf-codex/worktrees \
  MCF_ARTIFACT_ROOT=/var/lib/mcf-codex/artifacts \
  MCF_CHECKPOINT_ROOT=/var/lib/mcf-codex/checkpoints \
  MCF_CODEX_EXECUTABLE=/usr/local/bin/codex \
  MCF_GIT_EXECUTABLE=/usr/bin/git \
  MCF_FLOCK_EXECUTABLE=/usr/bin/flock \
  MCF_POLICY_PATH=/etc/mcf-continuity/policy.json

WORKDIR /workspace/apps/rede-social-agentes

COPY --from=build --chown=root:root /workspace/apps/rede-social-agentes /workspace/apps/rede-social-agentes

USER mcf-worker:mcf-worker

CMD ["node", "apps/worker/dist/main.js", "daemon"]
