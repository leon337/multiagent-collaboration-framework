# F3 — Fronteira de segurança MCP

Controles reais: somente loopback, Chrome isolado, validação textual de URL HTTPS pública antes do consentimento (sem allowlist de domínios), bloqueio de URLs locais/privadas, revisão de origem após navegação, aprovação por ação, botões de rejeição, limite de argumentos e TTL, nenhuma ferramenta de código arbitrário, upload ou navegador autenticado. O modelo não pode autoaprovar um gate da UI. Request/receipt IDs não são prova nativa do HDF MCF.

Lacunas importantes:
1. Headers HTTP Origin e X-MCF-UI-Intent não autenticam uma pessoa ou processo local. Outro processo local malicioso poderia falsificar headers. Exigir autenticação e vinculação ao runtime MCF antes de uso externo.
2. --allowed-origins do Playwright MCP não é um limite formal contra todos redirecionamentos. Mesmo com origem observada pós-fato e confirmação humana por URL, ainda é necessária uma barreira real de rede/egress em container/proxy para bloquear SSRF em hosts/endereços privados.
3. Texto de sites pode conter prompt injection. Etiqueta de conteúdo não confiável não prova resistência completa do modelo; manter política que nunca executa JS arbitrário.
4. Clique/digitação são não idempotentes. Somente TodoMVC de teste e confirmação humana. Não habilitar em sites com contas, pagamentos, publicação, dados pessoais ou ações irreversíveis antes de PermissionEngine + HDF e recibos assinados.
5. Falha/timeout de ferramenta pode já ter causado efeito. Resultado indeterminado retorna UNKNOWN e não pode ser repetido automaticamente.
6. Um único browser por backend, sem isolamento multiusuário, sem durabilidade de receipts, sem gestão de sessão do MCF. Não expor porta local em Internet.
7. Perfil isolado não é sandbox antimalware: pacote MCP e transitive deps estão pinados e receberam audit de dependências, mas exigem revisão contínua.

Status: SOMENTE PILOTO LOCAL, SEM F3 GATE APROVADO, SEM MERGE/DEPLOY.


## Remediação do piloto
Cada endSession invalida epoch antes de fechar o cliente MCP, inclusive durante
connect. decide verifica epoch após waits, não devolve SUCCESS tardio e nunca repete
operações desconhecidas. O Live invalida mcpEpoch ao cancelar lotes, desconectar ou
fechar WS. Escrita exige path exato /todomvc/, referência eN, snapshot imediatamente
anterior e inspeção do alvo real. Residual: Origin+header local não autenticam pessoa
e falta isolamento de rede robusto contra SSRF. Por isso produção pública continua
não autorizada tecnicamente, mesmo com pedido explícito de merge e deploy.
