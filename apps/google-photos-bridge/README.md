# Google Photos Bridge — MCP App V0.4.3

Integração mobile-first do ChatGPT com o Google Photos Picker.

## Objetivo

Permitir que LEANDRO, pelo telefone, autorize a conta Google, selecione fotos pelo Picker oficial e disponibilize apenas os itens explicitamente escolhidos para análise no ChatGPT.

## Endpoints

- `/mcp` — MCP Streamable HTTP
- `/healthz` — health check
- `/setup` — estado público de configuração, sem segredos
- `/.well-known/oauth-protected-resource/mcp` — RFC 9728 quando a proteção MCP está habilitada
- `/oauth/google/callback` — callback OAuth do Google Photos

## Ferramentas MCP

- `photos_bridge_status`
- `photos_connect`
- `photos_connection_status`
- `photos_picker_start`
- `photos_picker_status`
- `photos_list_items`
- `photos_get_image`
- `photos_picker_close`
- `photos_disconnect`

## Segurança

- Usa somente o escopo Google Photos Picker de leitura.
- Não afirma nem implementa leitura irrestrita da biblioteca.
- Tokens Google permanecem no servidor e não são entregues ao widget.
- `state` OAuth é assinado com HMAC e possui TTL.
- Toda leitura de mídia verifica que o item pertence à sessão Picker da mesma conexão.
- Quando o MCP OAuth está habilitado, cada conexão Google é vinculada ao `sub`/identidade autenticada.
- O adaptador OAuth do MCP valida assinatura JWT via JWKS, `iss`, `aud`, `exp`, `nbf` e escopos.
- O armazenamento ainda é efêmero em memória: reiniciar o serviço exige reconectar.
- Nenhuma credencial ou token deve ser commitado.

## Google Photos OAuth

Variáveis obrigatórias para o fluxo real:

- `PUBLIC_BASE_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `APP_STATE_SECRET` com no mínimo 32 caracteres

Sem as credenciais Google, o serviço inicia em **setup mode**.

## Proteção OAuth 2.1 do próprio MCP

A V0.4.3 inclui um adaptador de resource server compatível com o contrato atual da OpenAI/MCP. Ele fica desligado no staging até existir um Authorization Server compatível.

Variáveis:

- `MCP_AUTH_ENABLED=true`
- `MCP_AUTH_ISSUER=https://seu-authorization-server`
- `MCP_AUTH_AUDIENCE=https://mcf-google-photos-bridge.onrender.com/mcp`
- `MCP_AUTH_SCOPES=photos.read`
- `MCP_AUTH_JWKS_URI=` (opcional se o issuer publica discovery)
- `MCP_AUTH_RESOURCE_METADATA_URL=https://mcf-google-photos-bridge.onrender.com/.well-known/oauth-protected-resource/mcp`

Quando habilitado, requisições sem Bearer token recebem `401` com `WWW-Authenticate` apontando para os metadados RFC 9728.

## Validação

```bash
npm install
npm run check
npm start
```

Estado do sandbox V0.4.3: **16/16 testes PASS**.

A UI fica em `ui://google-photos-bridge/v2.html` e foi desenhada para operação no celular dentro do ChatGPT. As telas oficiais de consentimento OAuth e do Photos Picker permanecem sob controle do Google.


## Pacote portátil

O diretório também contém:

- `plugin.json` — manifesto Agent Plugins.
- `mcp.json` — endpoint Streamable HTTP distribuível.
- `skills/google-photos-bridge/SKILL.md` — fluxo canônico de uso.
- `skills/google-photos-bridge/agents/openai.yaml` — dependência MCP da skill.
- `/privacy` e `/terms` — páginas públicas preparadas para revisão.

A existência do pacote não autoriza submissão, merge ou publicação pública.
