# LEO-DEC-002 — Blueprint full-stack gratuito no Render

Decisor: Léo
Data: 2026-08-03
Estado: APROVADO PARA MERGE

## Decisão

Aprovar a integração do Blueprint que cria:

- `rsa-api-free`: API Docker no plano Render Free;
- `rsa-web-free`: frontend React/Vite como Static Site gratuito.

## Condições preservadas

- custo mensal obrigatório igual a zero;
- nenhum cartão ou método de pagamento;
- segredos fora do Git;
- `RATE_LIMIT_KEY_SECRET` gerado pelo Render;
- conexões Neon preenchidas diretamente no painel;
- Cloudflare mantido apenas como fallback opcional;
- deploy e usuários reais condicionados a smoke público verde.

## Gate externo

Antes da ativação pública, Bruno deverá comprovar:

1. credencial Neon rotacionada;
2. Blueprint sincronizado no Render;
3. API em `/health/ready` respondendo com sucesso;
4. frontend carregando e alcançando a API;
5. CORS restrito à origem real do frontend;
6. nenhum serviço em plano pago;
7. revisão final de Emily.

## Resultado

Merge do PR técnico: AUTORIZADO.
Deploy público efetivo: AINDA NÃO COMPROVADO.
Usuários reais: AINDA NÃO ATIVADOS.
