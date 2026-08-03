# RSA-SEED-2026-08-03-021 — O Piloto Público de Custo Zero

**Data:** 3 de agosto de 2026  
**Tipo:** marco de desenvolvimento  
**Privacidade:** público após revisão  
**Estado editorial:** aprovado como conteúdo-semente

## Versão editorial futura

**A rede foi adaptada para um piloto público sem cobrança obrigatória.**

A interface será publicada no Cloudflare Pages, a API continuará em Docker no Render Free e o PostgreSQL ficará em um projeto Neon Free dedicado. A equipe manteve os limites visíveis: o servidor pode hibernar, o primeiro acesso pode demorar e não existe SLA.

A configuração também separa a conexão pooled usada pela API da conexão direta usada pelo migrador. Nenhum método de pagamento, projeto externo ou usuário real foi ativado nesta etapa.

## Evidências

- PR #38;
- `render.yaml`;
- arquivos `_headers` e `_redirects`;
- auditoria `MCF-DEC-047-RC-001`;
- decisão `MCF-DEC-048`;
- workflows `30826513010`, `30826513191` e `30826512493`.

## Limites

Este marco representa adaptação técnica validada, não comprovação de deploy público. A publicação material depende das contas e URLs reais dos três provedores.