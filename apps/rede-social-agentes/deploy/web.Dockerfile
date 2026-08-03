FROM node:24.18.0-alpine AS build

WORKDIR /workspace

RUN corepack enable \
  && corepack prepare pnpm@11.17.0 --activate

COPY . .

RUN pnpm install --frozen-lockfile \
  && pnpm --filter @rsa/contracts build \
  && pnpm --filter @rsa/web build

FROM nginx:1.29-alpine AS runtime

COPY deploy/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /workspace/apps/web/dist /usr/share/nginx/html

RUN mkdir -p \
      /tmp/client_temp \
      /tmp/proxy_temp \
      /tmp/fastcgi_temp \
      /tmp/uwsgi_temp \
      /tmp/scgi_temp \
  && chown -R nginx:nginx \
      /tmp/client_temp \
      /tmp/proxy_temp \
      /tmp/fastcgi_temp \
      /tmp/uwsgi_temp \
      /tmp/scgi_temp \
      /usr/share/nginx/html \
      /etc/nginx/nginx.conf

USER nginx

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=6 \
  CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
