# Relatório de execução — MCF-WHATSAPP-DSH-001

**Estado:** AGUARDANDO_DEPENDENCIA_EXTERNA. **Data:** 2026-10-25.

## Execução sequencial / ESEV

1. **MESTRE — descoberta.** Consultados `README.md`, `docs/MCF-CURRENT-STATE.md` e `docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md` do MCF. Notebook `leo-N43SM` acessado via Remote Desktop Commander (conta Predix).
2. **MESTRE — arquitetura.** Confirmados DSH `@deepseek-ai/dsh@0.2.0-rc.2`, perfis `web`/`nilton-lab` ativos, 9Router local e gateway MCF. Headless oficial oferece `--json`, `--session-id` e JSONL final sem automação de UI.
3. **MESTRE — isolamento.** Feito fetch live da `main` GitHub e worktree nova `feat/mcf-whatsapp-dsh-20261025`, base `460d6e6`. Nenhum worktree existente foi modificado.
4. **MESTRE — implementação.** Criado `apps/mcf-whatsapp-dsh/`: gateway HTTP local fail-closed, validação assinatura HMAC raw-body, token de challenge, whitelist, armazenamento atômico de sessões/IDs de mensagens, envio Graph API, subprocesso headless DSH e testes mockados.
5. **MESTRE — primeira validação.** 12/12 testes Node passaram. `node --check` dos módulos passou.
6. **MESTRE — correção de segurança.** Composição DSH detectou referência a plugin `tool-present` inexistente. Referência removida do patch antes de aceitar a política. Nova inspeção do `--dump-config` confirmou 23 componentes de ferramentas desabilitados e zero warnings.
7. **MESTRE — provedor real.** Perfil `mcf-whatsapp-dsh` instalado em `~/.dsh/profiles/`, modo 0600, copiando privadamente provedor/modelo já configurados no DSH `web`. O teste alcançou o provedor do 9Router, mas terminou com erro 429 `FreeUsageLimitError`/`QUOTA`. **Nenhuma resposta LLM real validada.**
8. **MESTRE — reteste.** 12/12 testes passaram. `npm audit --offline --omit=dev` analisou 1 pacote, total vulnerabilidades=0. Perfil efetivo auditado por script.
9. **MESTRE — fechamento limitado.** Gateway externo não iniciado/implantado; sem token, Phone Number ID, App Secret, webhook URL nem número de destino configurados. Produção e Nilton intocados.

## Falhas e CAF

- FALHA: plugin não existente no overlay → classificada como erro de composição parcial → removeu-se referência → validada configuração resultante sem warning.
- FALHA EXTERNA: free 9Router respondeu 429 → classificada quota dependência externa → nenhum fallback pago ou repetição automática → aguardando reposição de cota ou outra rota gratuita validada.

## Evidências

`apps/mcf-whatsapp-dsh/`, teste `npm test` (12/12), `node scripts/check-profile.mjs` (PASS, 23 restrições), `npm audit --offline --omit=dev` (0 vulnerabilidades), diagnóstico local DSH (429/QUOTA).

## Limites

Não houve envio WhatsApp verdadeiro, teste público HTTPS, revisão multiagente independente, implantação nem merge. A configuração externa permanece bloqueada até acesso legítimo às credenciais Meta e ao modelo.

## Continuidade / ciclo 2 — autorização número teste

10. LEANDRO autorizou o número de teste da Meta. Criou-se a configuração privada `~/.config/mcf-whatsapp-dsh/env` com modo teste e token de verificação aleatório (0600); campos de API não foram inventados. Tailscale Funnel está disponível no notebook, mas não se abriu nova exposição pública e não se alteraram os demais serviços.
11. Foram inspecionados os registros locais do DSH das tentativas (sem revelar segredos): quatro `turn/end` com `QUOTA`/429 e uma com `INVALID_REQUEST`/400, `Model is unavailable`. Portanto o modelo foi efetivamente chamado pelo DSH, mas os provedores recusaram resposta.
12. Corrigiu-se `src/dsh-runner.mjs`, que consultava incorretamente `event.status.error.code`: o contrato do DSH utiliza `event.phase=turn_end` e `event.reason.error.code`. Adicionados casos de teste simulando erros reais. 12/12 testes continuam aprovados.
13. Nenhuma Meta app test ID, token temporário, segredo ou número de destinatário foi identificado neste novo projeto. Sem esses dados, o webhook oficial e a conversa real permanecem pendentes.

## Ciclo 3 — Step 5, Cockpit e Meta Funnel (25/10/2026)

14. LEANDRO solicitou Step 5 Preview, API local 9Router, uso do Cockpit Agent Bridge e Funnel; a implementação foi mantida em branch isolada.
15. O endpoint autenticado GET /v1/discovery do Agent Bridge confirmou instância notebook e panes. O navegador workspace foi aberto primeiro na Meta Developers e depois no login Facebook, que exige titular. Warnings de Agent Sessions ausentes não impedem automação direta de pane.
16. O perfil WhatsApp passou a selecionar nvidia/stepfun-ai/step-5-preview via mcf-9router, preservando web e nilton-lab. Logs do 9Router confirmam requisições STREAM encaminhadas ao upstream NVIDIA, mas chamadas DSH terminaram em timeout de 60s e 130s. Um POST manual ao 9Router sem chave gerou HTTP 401, caso separado da chamada DSH autenticada.
17. Funnel novo HTTPS 443 com mount único /webhook criado sem alterar o Funnel preexistente 10000. Callback respondeu ao desafio de verificação em HTTPS público com token privado e negou requisição sem token HTTP 403. POST bootstrap HTTP 503.
18. Serviços user systemd novos: mcf-whatsapp-meta-test.service (porta local 38764) e mcf-whatsapp-meta-setup.service (porta local 38765). Portal setup Tailscale Serve HTTPS 8498 é tailnet-only, token de acesso separado, checagem de Origin e armazenamento privado; nenhuma credencial Meta foi adicionada. Teste local do portal PASS, teste remoto a partir do telefone ainda não realizado; self-test no notebook expirou.
19. Modo WA_ACTIVATE_CHAT permanece desligado até modelo e Meta E2E comprovados. Testes focados 15/15 PASS. Nenhum merge, implantação pública do agente ou modificação Nilton.

## Continuidade — ciclo 4, provisionamento Meta

20. LEANDRO aceitou os termos Meta no aplicativo Caldinho da Lu. A Etapa 1 abriu com Cheap Delivery associado. Duas chamadas do botão Reivindicar número de teste produziram erro genérico do provedor. Recarregamento posterior confirma ausência de Phone Number ID, WABA teste e token.
21. O app teladeloginsocial foi restaurado para comparação mas não oferece produto WhatsApp. Não se tentou registro de número real nem ativação de pagamento.
22. O bug report oficial foi aberto em modo somente leitura, mas o seletor de aplicativos ativos apareceu vazio; não foi enviada notificação associada ao aplicativo errado. Registros detalhados no documento de investigação separado.

## Ciclo 5 — exploração de alternativas e resposta real do modelo

23. Validado endpoint MCP oficial Meta WhatsApp Business Tools (streamable HTTP e OAuth), conexão autenticada via Codex isolado. `whatsapp_biz_businesses(action=list)` retornou Cheap Delivery 117417843155171; `whatsapp_biz_accounts(business_id=117417843155171)` retornou 0 Messaging Accounts. `whatsapp_biz_phone_numbers` indisponível na sessão beta; isso não prova número de WAAC zero em qualquer outro sistema.
24. Teste **real** do modelo Step5 via DSH CLI resultou em `status turn_end reason completed`, `final OK`, exit 0, 78,72s. O log 9Router confirma rota Step5 para upstream NVIDIA. Os testes anteriores de timeout não provam indisponibilidade permanente; latência extrema pode afetar UX.
25. Timeout padrão do gateway dedicado alterado de 120 para 240s (validado entre 120-300s), mantendo todas as restrições DSH e sem ativar o canal Meta. Testes locais 15/15 PASS, teste público de challenge HTTPS PASS.
26. Identificada rota para prova de conversa WhatsApp sem WABA Meta: Vonage Messages API Sandbox 100 msgs/mês e WhatsApp opt-in, ou Twilio trial 100 msgs/30 dias como fallback. Vonage login foi aberto no Cockpit; não há credenciais/titular autenticado nesse provedor, nenhuma mensagem foi enviada e nenhum sandbox foi criado.
27. Relatório comparativo e próximos gates: `PHASE-WHATSAPP-DSH-001-ALTERNATIVAS-20261025.md`.

## Ciclo 6 — 26/10/2026 — bridge própria WhatsApp local
28. MCF implementou bridge própria `apps/mcf-wa-local` com Baileys (WhatsApp Web não oficial), persistência privada e isolamento exclusivo de self-chat para comandos `/mestre`. Nenhum fornecedor novo, número ou Meta WABA exigido.
29. WhatsApp pareado pelo titular via QR local no Cockpit; primeira mensagem processada e `sendMessage` resolveu: `reply_success`, sessão DSH persistida (PASS inicial). Não foi verificado recibo de leitura WhatsApp pelo telefone.
30. Segunda mensagem aceita pelo DSH, mas Step 5 excedeu 240 segundos e gerou `reply_failed:dsh_timeout` (FAIL de confiabilidade). O serviço não caiu e permaneceu conectado.
31. Adicionada confirmação após 12s de processamento + mensagem de timeout; 18/18 testes locais PASS. Atualização reiniciada e WhatsApp reconectou sem QR, contador preservado. Esse fluxo melhorado ainda não foi testado com terceira mensagem real.
32. Identificado log bruto de estado criptográfico da biblioteca WhatsApp na execução inicial. Bloqueadas stdout/stderr para journald no serviço, eventos próprios sanitizados em arquivo privado 0600; nenhum journal compartilhado foi apagado. Removida necessidade de fornecedor externo, mas riscos de protocolo WhatsApp não oficial permanecem.
33. Evidência detalhada: `MCF-LOCAL-WHATSAPP-20261026.md`; PR #476 permanece draft, sem merge, sem alteração no Nilton.

## Ciclo 7 — MCF WhatsApp conversa natural (26/10/2026)
34. Descoberta falha UX na bridge que ignorava qualquer mensagem do autochat sem `/mestre`. Implementado estado naturalMode persistente após primeiro comando explícito, com exclusão de mensagens do bot (`MESTRE:`) e preservação de isolamento de contatos/grupos/histórico.
35. Confirmadas 7 respostas concluídas, 1 timeout histórico, zero novas falhas após correção. Serviço reconectado automaticamente após reinício autorizado somente em estado ocioso.
36. 21/21 testes passaram. Sonda de modelo oc/deepseek-v4.1-flash-free: UNKNOWN_MODEL no perfil DSH; oc/nemotron-3.5-lightning-free: QUOTA. Step 5 Preview mantido, sem modelo pago.
37. Autoenvio de mensagem de diagnóstico bloqueado por política do conector remoto; funcionalidade extra retirada. MCF segue com ponte mínima. Evidência detalhada no MCF-LOCAL-WHATSAPP-20261026.md.
