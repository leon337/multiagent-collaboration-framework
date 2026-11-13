# MCF WhatsApp — alternativas verificadas (ciclo 5, 25/10/2026)

## Conclusão principal (evidências de runtime)
1. **DSH com Step 5 Preview via 9Router passou no teste real.** Prompt `Responda em uma única palavra: OK`, comando `dsh --profile mcf-whatsapp-dsh --json -`, retornou eventos `status:turn_end reason:completed` e `final:"OK"` em 78,72s; processo encerrou exit 0. O log 9Router registrou requisições STEP5 upstream NVIDIA às 23:42 e ao menos uma conclusão rápida de 64 tokens; somente o evento final DSH comprova resposta do usuário.
2. **Meta oficial continua sem remetente.** App antigo recuperado Caldinho da Lu ID 282011559918249, business Cheap Delivery ID 117417843155171, termos WhatsApp Cloud API aceitos pelo titular. Duas tentativas anteriores de `Reivindicar número de teste` retornaram literalmente `Ocorreu um erro ao criar a conta de teste. Tente novamente.` Painel continua `Nenhum número de telefone disponível para este app.`
3. **MCP WhatsApp Business Tools oficial da Meta AUTENTICADO via OAuth** em cliente Codex isolado no notebook. Endpoint `https://mcp.facebook.com/whatsapp_business_tools`; ferramenta `whatsapp_biz_businesses` com `action:list` encontrou somente Cheap Delivery, ID 117417843155171; `whatsapp_biz_accounts` com `business_id:117417843155171` retornou **0 Messaging Accounts**, sem erro. `whatsapp_biz_phone_numbers` não estava exposta na sessão beta; **não declarar zero WAAC/phone IDs em absoluto**. Preservar a distinção arquitetural WAAC/PMA.
4. **Meta bug reporter**, `https://developers.facebook.com/support/bugs/report/`, aberto na sessão autenticada, mas seletor inicial de `Seus aplicativos ativos` estava vazio. Não enviar relato associado ao app errado. Meta Support Home mostrou restrição de gestão de ativos na conta pessoal desde 07/07/2021; NÃO foi confirmado que isso causou o erro de número teste (outros relatos externos semelhantes).
5. **Infra testada:** Tailscale Funnel HTTPS GET callback com verify token retorna 200; token inválido 403; gateway POST fail-closed 503. DSH 23 ferramentas de ação desativadas, 15/15 testes PASS. `MCF_DSH_TIMEOUT_MS` default aumentado de 120000 para 240000ms, validado 120000 a 300000ms, sem ativar WhatsApp, sem modelo pago, sem merge.

## Canais legais de desenvolvimento que dispensam WABA própria no piloto
| Via | Teste gratuito e limite | Requisito do titular | Característica/risco |
|---|---|---|---|
| **Vonage Messages API Sandbox** (preferido) | Gratuito, 100 mensagens/mês, 1 msg/s. | Criar/entrar em conta Vonage, associar telefone WhatsApp ao sandbox pelo painel. | Usa remetente compartilhado, não depende WABA Meta do Cheap Delivery; webhook inbound/outbound e endpoint sandbox separado. Sessão de atendimento 24h, respeitar assinatura de webhook e allowlist. |
| **Twilio WhatsApp Sandbox** | Trial sem cartão, 100 msgs WhatsApp, 30 dias; sandbox tarifado após trial/upgrades. | Criar conta, verificar e-mail/telefone, enviar `join <código>` ao número do sandbox. | Trial pode limitar entrega internacional/Brasil; webhook inbound, 24h. |
| **Infobip sandbox** | Trial de WhatsApp limitado (verificar limites vigentes no cadastro, sem pressupor crédito perpétuo). | Conta e telefone teste verificado. | Remetente compartilhado, integra via webhooks. |
| **360dialog Sandbox** | Sandbox com cotas e destinatários restritos; confirmar plano/limite antes do uso. | Conta e associação de destinatário, sem cartões não autorizados. | Somente prova de conceito. |
| **Meta Cloud API test number** | Número gratuito próprio do app (até 5 destinatários testados). | Resolver erro Meta ou administrador de empresa elegível. | Canal preferido a médio prazo para produção, bloqueado atualmente. |
| **WhatsApp BSP, número real e coexistência** | Não é a rota gratuita inicialmente solicitada. | Titular e número sob controle, verificação, possíveis cobranças. | Requer autorização específica e análise da continuidade do app móvel; não cadastrar agora. |
| **WhatsApp Web automation não oficial** | Sem API oficial, baixo custo aparente. | Sessão WhatsApp própria. | Instável, risco de bloqueio e violação de regras; **descartada** para o telefone pessoal. |
| **Webchat local/PWA com Tailscale** | Sem custo adicional e já compatível com DSH. | Acesso ao endereço do notebook. | Não é WhatsApp, mas permite validar conversação imediatamente, separada da dependência Meta. |

Fontes principais:
- https://developer.vonage.com/pt/messages/concepts/messages-api-sandbox
- https://www.twilio.com/docs/whatsapp/sandbox
- https://www.twilio.com/docs/usage/tutorials/how-to-use-your-free-trial-account
- https://developers.facebook.com/documentation/mcp/whatsapp-business-tools-mcp
- https://developers.facebook.com/support/bugs/report/
- https://build.nvidia.com/stepfun-ai/step-5-preview/build
- https://developers.meta.com/resources/videos/whatsapp-account-model-evolution/

## Plano mínimo reversível
- **Agora:** usar Vonage Sandbox, somente após o titular criar a conta/entrar e dar opt-in ao seu WhatsApp. Adaptar um gateway sandbox separado com JWT/HMAC verificado, allowlist, armazenamento mínimo e saída exclusiva para o remetente de teste. Não reutilizar Meta APP_SECRET nem expor 9Router.
- **Plano B:** Twilio Sandbox se Vonage exigir verificação intransponível; webhooks assinados Twilio. Não efetuar upgrade.
- **Paralelo:** manter o webhook Meta separado e exigir prova real de WABA, Phone Number ID e token, sem insistir em provisionamento repetitivo. Se abrir pedido formal de bug, usar somente app correto, screenshot redigida e sem segredos. Outra conta pessoal só se for titular real/administrador já autorizado, nunca identidade fictícia.
- **DSH:** usar Step5 via 9Router (agora comprovado), timeout máximo 240s e observar latência real. Os 15 testes existentes **não comprovam** WhatsApp E2E.
- **Governança:** não alterar Nilton Bebidas, app Meta antigo de terceiros, perfis DSH existentes, nem dar merge até critérios de segurança e canal externo aprovados.

## Estado persistente
- Worktree isolado MCF WhatsApp branch feat/mcf-whatsapp-dsh-20261025, draft PR #476.
- Config oficial Meta MCP num diretório isolado em `/home/leo/Projetos/meta-whatsapp-mcp-diagnostico-20261025`, configurações não versionadas. A autenticação permite somente operar dentro dos ativos autorizados pelo titular.
- Login Vonage aberto no Cockpit; o titular precisará realizar autenticação/cadastro (não exigir credenciais via chat).
- Não houve compra, mensagem externa, alteração em número pessoal, WABA criada nem integração WhatsApp comprovada.

Status: **PASS DSH MODEL / BLOCKED META TEST SENDER / VONAGE ACCOUNT HUMAN LOGIN REQUIRED**.
