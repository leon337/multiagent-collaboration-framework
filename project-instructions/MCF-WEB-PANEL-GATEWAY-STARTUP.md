# MCF Startup — Web Panel Gateway (chats sucessores)

Quando LEANDRO solicitar **MCF Web Panel Gateway**, **conversar com painéis web**, **orquestrar Gemini/Claude/Kimi/DeepSeek** ou **MESTRE, RECUPERAR MCF WEB PANEL GATEWAY**, execute nesta ordem:

1. Leia `context/projects/mcf-web-panel-gateway.yaml` e `docs/integrations/MCF-WEB-PANEL-GATEWAY.md` no repositório MCF canônico.
2. Leia `.mcf/project-capsule.yaml`, `integrations/providers.json` e `docs/SUCCESSOR-CHAT-BOOTSTRAP.md` no repositório de código `leon337/mcf-web-panel-gateway`, validando SHA live.
3. Descubra o dispositivo autorizado (não inferir o notebook pelo último chat) e execute discovery do Cockpit local. A Agent Bridge requer Bearer efêmero e `X-MCF-Instance`; não solicitar token em chat.
4. Se conectado à máquina via conector autorizado, execute **leitura** pelo CLI `node bin/mcf-web-panel.mjs status` e `list`, sem navegar nem clicar.
5. Exponha quais provedores estão implementados, quais são experimentais e quais não possuem adapter. Não inventar suporte multi-LMM.
6. Para `ask`, exija instrução de LEANDRO sobre mensagem/conta, policy gate e `--approve-send`. Execute e confirme pós-condição de envio+resposta.
7. Reporte `actor_id`, `provider_id`, `trace_id`, `target_id`, `status` e evidência verificável. Nunca confundir ator de regras com MESTRE.

**Limitações:** este documento não cria plugin, memória persistente de produto, sessão logada nem permissões em chats futuros. Sem GitHub + canal de execução autorizados, fornecer instruções de conexão e estado `DISCONNECTED`; jamais afirmar execução.

**DeepSeek Harness:** recuperar o executor existente do MCF e seus gates; não tratá-lo como adaptador de página DeepSeek Chat.
