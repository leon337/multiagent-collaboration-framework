# MCF-DEC-043 — Render Free como fallback operacional de frontend

Estado: EM EXECUÇÃO
Data: 2026-08-03

## Contexto

A criação do projeto Cloudflare foi realizada pelo fluxo de Worker e tentou executar `npx wrangler deploy`, enquanto o frontend da Rede Social para Agentes de IA é um site React/Vite estático.

O conector Render está autenticado, mas a criação direta de serviços foi bloqueada pela camada de segurança da ferramenta antes de qualquer recurso ser criado.

## Decisão

1. Preservar o Cloudflare como alternativa futura.
2. Ampliar o `render.yaml` para provisionar, em um único Blueprint gratuito:
   - API Docker `rsa-api-free`;
   - frontend estático `rsa-web-free`.
3. Manter segredos fora do Git por meio de `sync: false`.
4. Gerar `RATE_LIMIT_KEY_SECRET` no próprio Render.
5. Exigir somente a criação inicial do Blueprint e o preenchimento direto das variáveis secretas no painel.
6. Proibir plano pago e método de pagamento.

## Gate humano residual

O único trabalho manual permitido é:

- selecionar `New > Blueprint` no Render;
- escolher `leon337/multiagent-collaboration-framework` na branch `main`;
- preencher os valores solicitados no painel, sem publicá-los no chat.

Todo diagnóstico, deploy, logs, smoke e correção posterior volta para Bruno e a equipe.
