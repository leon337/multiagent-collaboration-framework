# MCF · WhatsApp local (MVP restrito)

**Objetivo:** falar com o agente DSH pelo próprio WhatsApp do celular, sem Meta Cloud API, sem contratar BSP/sandbox e sem registrar outra conta.

**Estado:** serviço local vinculado ao WhatsApp pelo titular em 26/10/2026. Primeiro teste ponta a ponta do comando `/mestre` retornou com sucesso (evento `reply_success` e sessão DSH persistida); uma segunda solicitação terminou por timeout de 240 segundos. Serviço reconectado depois de reinício, ainda sem comprovação de disponibilidade contínua. A integração utiliza Baileys (WhatsApp Web **não oficial**), que não é afiliada à Meta e pode perder compatibilidade ou expor o número a restrições de uso. Não é substituto homologado da Cloud API.

## Como acessar

O notebook abre a tela de pareamento no Cockpit:

`http://127.0.0.1:38766/pair`

O endpoint vincula a sessão exclusivamente por **loopback**. Não publicar esse caminho no Funnel ou em Tailscale Serve; suas imagens de QR contêm material temporário de autenticação.

No celular, abra WhatsApp → **Dispositivos conectados** → **Conectar dispositivo**, e leia o QR exibido no notebook. O painel passa a indicar **WhatsApp conectado** quando o protocolo confirma o pareamento. Nenhuma senha ou código é solicitado em chat.

Depois, abra o próprio chat **Mensagem para você** no WhatsApp e, pela primeira vez, envie:

```text
/mestre oi
```

**Depois, converse normalmente**, com mensagens como `Oi mestre` ou `Tudo bem?`, sem repetir `/mestre`. O modo conversacional permanece ativo até `/mestre parar`. Enquanto estiver ativo, **qualquer nova mensagem de texto enviada por você para essa conversa pessoal pode ser encaminhada ao modelo remoto**. Não use essa conversa para guardar notas ou segredos que não deseja enviar à IA.

A resposta é gerada pelo DSH com o perfil `mcf-whatsapp-dsh`, modelo `nvidia/stepfun-ai/step-5-preview` via 9Router, e aparece **nesse mesmo chat**. O modelo já retornou uma resposta real em 78 segundos pelo DSH; a latência pode variar, com limite de 240 segundos por chamada.

Ao receber uma pergunta demorada, a bridge envia uma confirmação automática após aproximadamente 12 segundos; se o modelo ultrapassar quatro minutos, envia um aviso de tempo limite sem executar ações externas.\n\nComandos: `/mestre status` (consulta imediata), `/mestre parar` (bloqueia novas respostas e resultados pendentes), `/mestre iniciar` (retoma), `/mestre <sua pergunta>` (até 800 caracteres).

## Engenharia e limites

- Processo: `mcf-wa-local-link.service`, Node + `@whiskeysockets/baileys@6.7.24`, escuta só `127.0.0.1:38766`.
- A Baileys cria uma sessão **dispositivo vinculado**, não um novo número WhatsApp. A autenticação do WhatsApp permanece sob o controle do titular.
- **Somente** mensagens originadas de dispositivos do próprio titular no chat `Mensagem para você` podem acionar o agente. O primeiro `/mestre` habilita a conversa natural; depois desse comando, novas mensagens enviadas por você nesse chat são encaminhadas à IA enquanto o modo está ativo. Contatos, grupos, listas, histórico sincronizado e mensagens próprias do bot (`MESTRE:`) são descartados antes da inferência.
- A biblioteca recebe eventos WhatsApp para manter a sessão, mas o MCF não encaminha nem armazena conteúdo de terceiros. Persistimos apenas IDs deduplicados, status de pausa, métricas de processamento e ID da sessão DSH.
- Cada mensagem é reconhecida uma vez, inclusive após reinicialização; não há disparo ou broadcast e nunca há envio a terceiros.
- Limite **3 prompts/minuto**, uma solicitação de modelo em andamento, texto limitado a 800 caracteres, resposta até 2.500 caracteres, timeout DSH 240 segundos. O DSH tem 23 ferramentas perigosas desativadas.
- Nenhuma ferramenta de execução, shell, navegador ou acesso a outros projetos é liberada ao agente.
- Serviço dedicado não altera `whatsapp-business-agent.service`, o painel Meta, os perfis DSH `web`/`nilton-lab` ou o projeto Nilton Bebidas.
- Mensagens com `/mestre parar` impedem que um resultado anterior do DSH seja enviado após o comando, embora o subprocesso em curso possa terminar pelo timeout.
- Proteção admin: QR e botões de controle exigem token no painel administrativo; há um **visor de pareamento separado apenas em loopback**, que nega QR quando enviado Host de Tailscale. Estado e chaves em diretórios `0700`, arquivos `0600`.
- A sessão pode ser desvinculada no aplicativo WhatsApp → **Dispositivos conectados**; isso revoga a autorização criptográfica.

## Monitorar, parar e retomar

```sh
systemctl --user is-active mcf-wa-local-link.service
systemctl --user status mcf-wa-local-link.service
systemctl --user stop mcf-wa-local-link.service
systemctl --user start mcf-wa-local-link.service
```

O serviço é habilitado no boot do usuário. Quando a sessão expira ou é revogada, deixa de responder automaticamente e solicita novo pareamento. Nunca remover as credenciais de outro dispositivo.

Credenciais locais: `~/.local/share/mcf-wa-local/auth/` (Signal) e `~/.config/mcf-wa-local/admin-token`. Não versionar, imprimir, fazer upload ou enviar esses arquivos pelo chat. Se necessário reset explícito, desligar o serviço, revogar o dispositivo no WhatsApp e só então apagar a pasta de autenticação **deste serviço**.

## Provas e limitações

- 21/21 testes de contrato e segurança, incluindo self-JID, replay/histórico, isolamento grupos/contatos, STOP, autorização e proteção do QR, além da confirmação de processamento e ausência de mensagem tardia após resposta rápida.
- `npm audit --omit=dev`: 0 vulnerabilidades registradas no módulo no momento da validação.
- QR de pareamento WhatsApp real gerado na máquina; portal local 200 e QR não autenticado administrativo 401; Host proxy remoto recebe 401.
- **PASS conversacional (26/10/2026):** QR escaneado pelo titular; WhatsApp conectado, comandos reais recebidos e respondidos com `reply_success`, e sessão DSH persistida. Após corrigir o modo natural, o serviço registrou **7 respostas concluídas, 1 falha histórica por `dsh_timeout`** e reconexão automática. O Step 5 continua sujeito a latência variável; não afirmar disponibilidade garantida.\n- **Segurança:** o serviço foi configurado com `StandardOutput=null` e `StandardError=null` para impedir que dumps criptográficos da biblioteca entrem no journal; somente eventos mínimos e higienizados são armazenados em `~/.local/share/mcf-wa-local/events.log` (0600). Históricos anteriores do journal não foram apagados para não impactar outros serviços.

Projeto em branch `feat/mcf-whatsapp-dsh-20261025`, PR #476 **draft**.
