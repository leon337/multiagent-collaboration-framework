# MCF WhatsApp / Meta Test — Continuidade de 25/10/2026

## Confirmado em execução

- Meta test-only callback **público, TLS válido**, verificado contra desafio real:
  https://mcf-leo-n43sm.tail582305.ts.net/webhook
- Somente o caminho /webhook está exposto pelo Tailscale Funnel na porta 443.
- Sem credenciais Meta, o bootstrap **não processa mensagens**; POST resulta em 503.
- Serviço systemd user: mcf-whatsapp-meta-test.service; iniciado e persistente no boot.
- Portal privado (Tailscale Serve, não Funnel público) HTTPS 8498:
  https://mcf-leo-n43sm.tail582305.ts.net:8498/
- Serviço de portal mcf-whatsapp-meta-setup.service, autenticado por token aleatório guardado
  em ~/.config/mcf-whatsapp-dsh/setup-token (0600). Acesso via link com fragmento #token.
- O formulário exige autenticação, validação de Origin e dos cinco campos da Meta; não expõe App Secret nem access token depois de armazená-los.
- Os dados vão para ~/.config/mcf-whatsapp-dsh/env (0600). O portal força WA_ACTIVATE_CHAT=0.
- Testes: **15/15 PASS**, teste local do portal de autenticação/origin: PASS, desafio HTTPS público da Meta: PASS.
- Teste externo do portal a partir do celular **ainda não verificado**; requisição a partir do próprio notebook via nome da tailnet expirou (potencial hairpin / resolução pública do hostname). O recurso é tailnet-only: requer Tailscale ativo no celular.

## Provedor e DSH

- MESTRE atendeu à solicitação de LEANDRO de usar o modelo **nvidia/stepfun-ai/step-5-preview**.
- Perfil DSH isolado: ~/.dsh/profiles/mcf-whatsapp-dsh
- O instalador seleciona Step 5 via a configuração já presente no provedor mcf-9router (http://127.0.0.1:20128/v1).
- Logs reais do 9Router confirmaram POST de DSH encaminhado para Step 5 via NVIDIA, modo streaming.
- **Nenhuma resposta final do Step 5 foi recebida**: 60 segundos e 130 segundos terminaram por timeout.
- Um POST HTTP manual sem a chave do 9Router retornou 401; isso **não equivale ao DSH estar sem chave**, pois os logs provam encaminhamento autenticado da sessão DSH.
- As restrições de 23 componentes com ferramentas potencialmente perigosas seguem verificadas no perfil dedicado.
- Nenhuma alteração nos perfis DSH web/nilton-lab ou no sistema Nilton.

## Meta Developers — o que ainda exige titular

1. Login oficial no Facebook / Meta for Developers; o Cockpit foi autenticado e navegou até a tela de login, onde não há sessão de titular.
2. Se ainda não houver app com caso de uso WhatsApp, criar app Meta de teste (atividade da conta do titular).
3. No WhatsApp API Setup, obter o Phone Number ID de teste, token temporário e destinatário de teste verificado. Obter App Secret em configuração básica do app.
4. No portal privado, inserir dados do Meta e copiar o token de verificação gerado.
5. Em Meta Webhooks, cadastrar o callback HTTPS acima e selecionar subscription messages.
6. Somente depois de resposta real de Step 5 e sucesso da integração Meta, ativar WA_ACTIVATE_CHAT=1 e reiniciar o serviço.

Não envie credenciais Meta para o ChatGPT ou GitHub. O portal privado é a interface recomendada.

## Reversibilidade

- Desligar somente o webhook Meta: tailscale funnel --https=443 --set-path=/webhook off
- Desligar somente o portal Tailscale: tailscale serve --https=8498 off
- Parar serviços: systemctl --user stop mcf-whatsapp-meta-test.service mcf-whatsapp-meta-setup.service
- Não usar tailscale reset, nem reiniciar serviços de Nilton, nem publicar o Cockpit na internet.
- GitHub PR #476 permanece draft e não autorizado a merge/produção.

## Atualização verificada de 25/10/2026 — ciclo 5

O comando DSH `--profile mcf-whatsapp-dsh --json -` recebeu uma resposta real final `OK` com `turn_end:completed` após ~78 segundos via Step5/9Router; problema anterior de timeout foi intermitente. O gateway passa a admitir `MCF_DSH_TIMEOUT_MS` 120000–300000, padrão 240000. Isso NÃO conclui a entrega pelo WhatsApp, pois a Meta recusou duas vezes a criação do remetente grátis. OAuth do Meta WhatsApp Business Tools MCP oficial concluiu no cliente isolado; WhatsApp Messaging Accounts do Cheap Delivery retornaram 0. Para prova por WhatsApp sem WABA própria, investigar Vonage Sandbox (cadastro/opt-in do titular) ou Twilio Sandbox, sem cobrança automática. Detalhes no dossiê de alternativas do PRF.
