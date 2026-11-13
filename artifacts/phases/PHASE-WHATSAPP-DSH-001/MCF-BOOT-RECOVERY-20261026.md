# MCF WhatsApp — recuperação após reinício (26/10/2026)

**Escopo:** projeto `apps/mcf-wa-local`, navegador Brave dedicado, leitor Baileys restrito e agente DSH via 9Router.
**Situação:** recuperação operacional e teste de transporte de status aprovados; inferência Step 5 não revalidada neste ciclo.
**Política:** nenhuma cobrança, nenhum contato/grupo acessado, nenhuma sessão reautenticada, nenhum merge na main.

## Diagnóstico no notebook
- Host `leo-N43SM` online via Desktop Commander; sistema Linux Mint reiniciado e já com sessão gráfica X11 aberta.
- `mcf-wa-local-link.service` estava **active** e WhatsApp `phase=connected`; `mcf-9router.service` e `mcf-dsh-runtime.service` em execução. 9Router respondeu HTTP 200 a `GET /v1/models`, o que **não** comprova inferência completa de um modelo.
- Serviço WhatsApp exibiu 14 turnos concluídos e 3 falhas acumuladas. Duas ocorreram após o reinício, com erro `browser_target_not_self`.
- A sessão do WhatsApp Web dedicada não abriu no Brave e o debugger loopback `127.0.0.1:9227` estava ausente. Leitor DOM registrava `browser_inbox_poll_error_fetchfailed` repetidamente.
- A sessão do navegador não foi perdida: após abrir o Brave com `--user-data-dir=/home/leo/.config/mcf-wa-browser`, o WhatsApp Web reconheceu a conta sem pedir QR.
- Divergência de IDs do mesmo titular: Baileys aceita JIDs próprios PN e LID, mas o sender do Brave exigia apenas um único JID. Isso causava falsos bloqueios de respostas ao próprio titular.

## Ações concluídas
1. Restaurado Brave isolado com perfil já autenticado, exatamente uma aba do WhatsApp e CDP apenas em `127.0.0.1:9227`.
2. Criado e habilitado `mcf-wa-brave.service`, com `scripts/ensure-browser.sh`, para supervisionar a disponibilidade do Brave e relançá-lo após reinício ou saída. O serviço iniciou sem duplicar nem reiniciar o navegador em uso. **Ainda falta uma prova de boot futuro completo.**
3. O sender passa a aceitar JIDs alternativos do **próprio** titular, obtidos exclusivamente de `sock.user` e `sock.authState.creds.me` no socket autenticado. Continua exigindo que a conversa no Brave mostre o próprio número e a marca `(você)`. Destinos de contatos e grupos continuam rejeitados.
4. Reduzido spam nos logs: o leitor DOM só registra nova ocorrência de um mesmo erro depois de um intervalo ou mudança de causa, e registra a recuperação.
5. Verificações: JavaScript syntax PASS, **30/30 testes automatizados PASS**, `npm audit --omit=dev` com 0 vulnerabilidades conhecidas.
6. Reiniciada **somente a ponte WhatsApp** após checagem de ociosidade. Ambos os serviços seguem ativos: `mcf-wa-local-link.service` e `mcf-wa-brave.service`.
7. Teste pós-correção pelo próprio WhatsApp Web: enviado `/mestre status` exclusivamente na conversa `Mensagem para você`; a ponte reconheceu `accepted_status` e uma **nova** mensagem `MESTRE: Ativo, conversa pessoal restrita.` apareceu no DOM. Nenhuma chamada ao Step 5 era exigida para esse teste.

## Limites, segurança e próximos critérios
- Status operativo do transporte é **PASS**, mas não equivale a SLA, confirmação de leitura no aparelho, nem prova de uma nova inferência DSH após reinício.
- O Step 5 Preview continua sendo o modelo principal do perfil `mcf-whatsapp-dsh`; disponibilidade, latência e quotas ainda variam. O modelo alternativo NVIDIA investigado antes do reinício **não teve resultado terminal preservado**; não declarar fallback validado.
- Mensagens antigas com `Aguardando mensagem` podem permanecer; o novo envio pelo WhatsApp Web elimina a biblioteca Baileys **da saída**, não repara mensagens criptografadas históricas.
- O transporte via WhatsApp Web e Baileys **não é uma API oficial**. Há risco de incompatibilidade ou bloqueios pela plataforma.
- Somente o chat do próprio titular, depois de `/mestre` inicial, pode ser encaminhado ao modelo; para pausar, `/mestre parar`. Mensagens pessoais guardadas no próprio chat enquanto ativo podem ser processadas pelo modelo; não transmitir informações sigilosas.
- O endpoint de depuração 9227 é apenas loopback, mas aplicativos locais do mesmo computador podem potencialmente acessá-lo. Não expor Tailscale Serve/Funnel nessa porta.
- Prova desejável posterior: uma nova pergunta com resposta LLM do DSH no WhatsApp Web e verificação de inicialização automática num boot futuro, sem manipular outros perfis/sessões.
- Preservados: `nilton-lab`, DSH Web, aplicações restantes do MCF, Meta Cloud API test gateway, credenciais privadas e chats de terceiros.

## Governança
- Branch: `feat/mcf-whatsapp-dsh-20261025`, PR <https://github.com/leon337/multiagent-collaboration-framework/pull/476> ainda aberto.
- Arquivos controlados de implementação: `apps/mcf-wa-local/src/browser-sender.mjs`, `src/browser-inbox.mjs`, `src/server.mjs`, `scripts/ensure-browser.sh`, `systemd/mcf-wa-brave.service` e testes do módulo.
- Chaves do WhatsApp, tokens administrativos e perfil local do Brave permanecem somente no notebook, fora do GitHub.
