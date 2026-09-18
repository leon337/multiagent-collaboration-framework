# Google Photos Bridge — MCP App V1

Integração mobile-first do ChatGPT com o Google Photos Picker.

## Objetivo

Permitir que LEANDRO, pelo telefone, autorize a conta Google, selecione fotos pelo Picker oficial e disponibilize apenas os itens explicitamente escolhidos para análise no ChatGPT.

## Endpoints

- `/mcp` — MCP Streamable HTTP
- `/healthz` — health check
- `/setup` — estado público de configuração, sem segredos
- `/oauth/google/callback` — callback OAuth

## Ferramentas MCP

- `photos_bridge_status`
- `photos_connect`
- `photos_connection_status`
- `photos_picker_start`
- `photos_picker_status`
- `photos_list_items`
- `photos_get_image`
- `photos_picker_close`

## Segurança do MVP

- Usa somente o escopo Google Photos Picker de leitura.
- Não afirma nem implementa leitura irrestrita da biblioteca.
- Tokens OAuth permanecem no servidor e não são entregues ao widget.
- `state` OAuth é assinado com HMAC e possui TTL.
- Toda leitura de mídia verifica que o item pertence à sessão Picker da mesma conexão.
- O armazenamento do MVP é efêmero em memória: reiniciar o serviço exige reconectar.
- Nenhuma credencial ou token deve ser commitado.

## Variáveis

Copie `.env.example`. São necessárias para o fluxo real:

- `PUBLIC_BASE_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `APP_STATE_SECRET`

Sem as credenciais Google, o serviço inicia deliberadamente em **setup mode**, permitindo validar deploy, health check, MCP e UI antes do gate OAuth.

## Validação

```bash
npm install
npm run check
npm start
```

A UI fica em `ui://google-photos-bridge/v1.html` e foi desenhada para operação no celular dentro do ChatGPT. As telas oficiais de consentimento OAuth e do Photos Picker permanecem sob controle do Google.
