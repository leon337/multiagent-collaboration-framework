# MCF WhatsApp ↔ DeepSeek Harness — MVP local

**Estado:** gateway isolado implementado, testes offline aprovados; conexão pública com Meta e teste real de conversa ainda dependem da configuração da conta. O DSH real inicializou, mas o modelo gratuito atualmente escolhido devolveu HTTP 429/QUOTA em 25/10/2026.

## Fluxo

WhatsApp Cloud API (webhook HTTPS) → verificação SHA-256 + allowlist → fila durável por ID → DeepSeek Harness `mcf-whatsapp-dsh` (modo headless, JSON) → sessão persistida → Graph API de envio.

Esta integração utiliza o DSH de verdade, **não** um cliente direto a outro provedor de IA. O provedor/modelo vêm do perfil DSH Web instalado no notebook (9Router) e são copiados localmente pelo instalador do perfil. Nenhum segredo é incluído no Git.

### Operação segura

- Escuta apenas em `127.0.0.1:38764`; não há túnel público automático.
- Antes de entrar na fila, o webhook deve passar HMAC `X-Hub-Signature-256`, confirmação `hub.verify_token` e lista de remetentes `WA_ALLOW_FROM`.
- O perfil DSH é separado de `web` e `nilton-lab`. Shell, filesystem, subagentes, web, jobs e outras ferramentas de execução estão desativados.
- O gateway não permite que mensagens recebidas acionem execução de comandos. Ele envia apenas respostas textuais.
- Uma conversa usa o mesmo ID de sessão do DSH para suas mensagens posteriores.
- IDs de mensagens recebidas são persistidos para evitar respostas repetidas. A fila usa serialização global; não há envios em massa.
- Resposta de modelo sem sucesso ou envio incerto é classificado como falha e **não** é reenviado automaticamente.
- O estado local pode conter números e IDs privados, armazenados fora do repositório com permissão 0600. Textos de entrada são retirados depois de processados.
- A primeira versão aceita apenas mensagens de texto. Não suporta áudios, mídias, grupos ou comandos de shell.

## Instalação no notebook

Execute no diretório `apps/mcf-whatsapp-dsh`:

```bash
node scripts/install-profile.mjs
node scripts/check-profile.mjs
npm test
```

O instalador lê apenas as seções de provedor/modelo da configuração DSH `web` existente e cria `~/.dsh/profiles/mcf-whatsapp-dsh`, sem editar o `web` nem o `nilton-lab`. O perfil privado tem permissão 0600.

### Meta — número de teste autorizado; aguardando credenciais da conta

Em 25/10/2026, LEANDRO autorizou exclusivamente o **número de teste fornecido pela Meta**, sem migrar seu número pessoal. É necessária uma conta Meta for Developers com caso de uso WhatsApp, número remetente de teste, token de acesso temporário, App Secret, Phone Number ID de teste e versão de Graph API suportada. O telefone pessoal é apenas destinatário autorizado de teste e precisa ser verificado no painel Meta (até cinco destinatários em modo teste).

O arquivo privado `~/.config/mcf-whatsapp-dsh/env` já foi criado no notebook, com `WA_META_TEST_MODE=1` e token aleatório de verificação; permanecem vazios apenas os campos que exigem o cadastro Meta. Execute `node scripts/prepare-meta-test.mjs` para revisar os nomes dos campos pendentes sem exibir segredos. **Não use um número real como remetente nesta fase.** `WA_ALLOW_FROM` deve conter **somente** o número autorizado em formato internacional, dígitos apenas (Brasil: 55 + DDD + número). Não envie esses segredos pelo chat nem faça commit.

Exemplo para iniciar manualmente com o arquivo privado:

```bash
cd /home/leo/Projetos/mcf-whatsapp-dsh-20261025/apps/mcf-whatsapp-dsh
node --env-file=/home/leo/.config/mcf-whatsapp-dsh/env src/main.mjs
```

Endpoint local `http://127.0.0.1:38764/webhook`. Para receber mensagens reais, configurar um **HTTPS público confiável** encaminhando apenas a rota `/webhook` ao serviço local, com a validação de assinatura habilitada. Não apontar o WhatsApp diretamente ao endereço Tailscale privado; a Meta precisa acessar a URL. Confirme handshake GET, webhook POST assinado e resposta de ida e volta antes de habilitar inicialização automática.

A resposta só é enviada para o número da mensagem recebida que tenha sido autorizado. A janela de atendimento de WhatsApp e as regras oficiais da Meta aplicam-se ao envio.

### Validação

```bash
npm test                     # testes locais com simulador do subprocesso DSH e da Cloud API
node scripts/check-profile.mjs   # valida restrições efetivas do perfil DSH instalado
curl -s http://127.0.0.1:38764/health  # depois que o serviço estiver iniciado
```

**Os testes offline não substituem** um teste real de resposta da IA via 9Router e um teste real de entrega WhatsApp. Os logs de sessão do DSH mostram erro de provedor `QUOTA / HTTP 429 / FreeUsageLimitError` para os modelos gratuitos `oc/` e `INVALID_REQUEST / HTTP 400 / Model is unavailable` para a alternativa `ocg/space-bunny-free`. A sessão e a requisição **foram criadas no DSH real**, mas **nenhum modelo retornou resposta**. O adaptador foi corrigido para ler `status.phase=turn_end` e `reason.error.code` e distinguir ​`dsh_quota_exhausted` de `dsh_model_unavailable`. Nenhuma rota paga foi selecionada para contornar a cota.

## Limites e rollback

O serviço não está habilitado no boot até a conexão WhatsApp e o modelo estarem validados. Para interromper a aplicação, encerre apenas o processo `node src/main.mjs` desse projeto. Para rollback do perfil: pare a aplicação e remova apenas `~/.dsh/profiles/mcf-whatsapp-dsh` após verificar a propriedade. Não reinicie nem altere os serviços `mcf-dsh-runtime` ou `nilton-dsh-lab`.

Casos incompletos deliberadamente: resposta incerta depois de falha de transporte (exige reconciliação manual), retenção histórica definida por operação, autenticação e TLS do proxy público, credenciais Meta e setup da conta. Nenhum desses itens foi declarado aprovado.
