# F3 — Fronteira de segurança MCP

Controles reais: somente loopback, Chrome isolado, allowlist curta de origens HTTPS, bloqueio de URLs locais/privadas, revisão de origem após navegação, aprovação por ação, botões de rejeição, limite de argumentos e TTL, nenhuma ferramenta de código arbitrário, upload ou navegador autenticado. O modelo não pode autoaprovar um gate da UI. Request/receipt IDs não são prova nativa do HDF MCF.

Lacunas importantes:
1. Headers HTTP Origin e X-MCF-UI-Intent não autenticam uma pessoa ou processo local. Outro processo local malicioso poderia falsificar headers. Exigir autenticação e vinculação ao runtime MCF antes de uso externo.
2. --allowed-origins do Playwright MCP não é um limite formal contra todos redirecionamentos. Mesmo com origem observada pós-fato e lista curta de sites, ainda é necessária uma barreira real de rede/egress em container/proxy para bloquear SSRF em hosts/endereços privados.
3. Texto de sites pode conter prompt injection. Etiqueta de conteúdo não confiável não prova resistência completa do modelo; manter política que nunca executa JS arbitrário.
4. Clique/digitação são não idempotentes. Somente TodoMVC de teste e confirmação humana. Não habilitar em sites com contas, pagamentos, publicação, dados pessoais ou ações irreversíveis antes de PermissionEngine + HDF e recibos assinados.
5. Falha/timeout de ferramenta pode já ter causado efeito. Resultado indeterminado retorna UNKNOWN e não pode ser repetido automaticamente.
6. Um único browser por backend, sem isolamento multiusuário, sem durabilidade de receipts, sem gestão de sessão do MCF. Não expor porta local em Internet.
7. Perfil isolado não é sandbox antimalware: pacote MCP e transitive deps estão pinados e receberam audit de dependências, mas exigem revisão contínua.

Status: SOMENTE PILOTO LOCAL, SEM F3 GATE APROVADO, SEM MERGE/DEPLOY.

## Riscos adicionais de voz e egress
O Playwright sem lista estatica de origens ainda nao possui isolamento de rede contra SSRF, DNS rebinding ou redirecionamento intermediario. Voice recognition nao prova pessoa nem liveness; outros usuarios ou replays sao riscos. Web Speech API pode usar processamento online. Nunca usar a voz como autenticacao HDF para dinheiro, publicacao ou contas.
