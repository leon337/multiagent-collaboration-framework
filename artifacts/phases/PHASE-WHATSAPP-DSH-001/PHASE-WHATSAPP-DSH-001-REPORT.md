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
