# MCF Google Bridge — MVP local

Bridge local para integrar agentes MCF com Google Gemini, Google Workspace (Drive/Gmail/Calendar) e Google Cloud, sob um conjunto limitado de operações.

## Estado
- MCP stdio para clientes locais; HTTP JSON interno para sistemas que nao falam MCP.
- HTTP restrito a 127.0.0.1 e Bearer local gerado automaticamente (arquivo 0600).
- OAuth Desktop com PKCE S256 e callback loopback; tokens de Workspace criptografados AES-256-GCM em arquivo 0600.
- Google Cloud por Application Default Credentials (ADC) com escopo de leitura.
- Gemini por GOOGLE_API_KEY ou GEMINI_API_KEY (de preferencia auth key restrita a Generative Language API).
- Sem envio de email, criacao/alteracao/exclusao de arquivos, IAM, provisionamento, deploy ou billing.
- Geracao Gemini desligada por padrao: GOOGLE_BRIDGE_ALLOW_GENERATION=true ativa uso possivelmente tarifado.
- O Google controla o consentimento e limites de suas contas; instalar a Bridge nao concede autorizacao.

## Uso
```bash
cd tools/mcf-google-bridge
npm ci
npm run check && npm test
npm start             # MCP stdio, sob demanda
npm run serve         # HTTP local, GET /healthz e POST /v1/execute
```

### Configuracao credenciais
1. Gemini: configurar GOOGLE_API_KEY ou GEMINI_API_KEY no ambiente privado do processo (nao em Git).
2. Workspace: registrar OAuth Client do tipo Desktop no Google Cloud. Definir GOOGLE_OAUTH_CLIENT_ID, opcional GOOGLE_OAUTH_CLIENT_SECRET. Execute `npm run auth`, abra o link **no navegador do mesmo computador** e conclua o consentimento. O callback usa 127.0.0.1 e uma porta aleatoria. Escopos: drive.metadata.readonly, gmail.readonly e calendar.readonly.
3. Google Cloud: usar `gcloud auth application-default login` em sessao local autorizada ou uma identidade de workload preexistente. Verifique IAM/API e billing. Nao copiar service-account keys do host para o Git.
4. Se o Workspace tiver escopos restritos, pode ser necessario publicar/configurar tela de consentimento e verificar o app.

### MCP (configuracao de host)
```json
{
  "mcpServers": {
    "mcf-google": {
      "command": "node",
      "args": ["/home/leo/.local/share/mcf-google-bridge/src/index.mjs"]
    }
  }
}
```

### HTTP interno
A unidade systemd do usuario expoe somente a interface local. Para um cliente autorizado, o Bearer fica em `~/.config/mcf-google-bridge/http-token` (0600); nao copie o token para comandos/logs. Operacao de exemplo: POST /v1/execute com JSON `{"operation":"google.status","args":{}}`. Nunca expor a porta diretamente na internet/Tailscale sem um proxy de autenticacao de nivel superior.

## Operacoes
- google.status — readiness local sem chaves
- google.gemini.models — catalogo retornado pelo Google
- google.gemini.generate — geracao condicionada a opt-in
- google.drive.search — metadados do Drive
- google.gmail.search — IDs de mensagens
- google.calendar.events — proximos eventos
- google.cloud.projects — projetos visiveis via ADC

## Garantias e limites
- Padrão fail-closed, allowlist fixa de operacoes e dominios Google.
- Os logs contêm apenas operation, outcome, trace_id, tempo e timestamp; nao guardam prompt, e-mail nem dados Google.
- Nao ha verificacao criptografica da identidade do agente MCF no modo stdio. Essa etapa exige integracao ao Permission Engine/Human Delegation Firewall e ao ledger do runtime canônico antes de habilitar ferramentas de escrita.
- Chave de criptografia e tokens ficam acessiveis ao mesmo usuario do Linux; isso reduz vazamento acidental, mas nao resiste a comprometimento da conta.
- HTTP neste MVP e uma API JSON local privada, **nao** o transporte MCP Streamable HTTP.
- OAuth pode exigir que o operador crie o client ID e complete consentimento; o Bridge nao provisiona credenciais unilateralmente.
- Modelos Live exigem adapter bidirecional separado; nao tratar endpoints Live como generateContent.
- Sem merge, sem deploy, sem rotacao automatica de service accounts.

## Diagnostico
- `systemctl --user status mcf-google-bridge`
- `curl -fsS http://127.0.0.1:8755/healthz`
- `npm test`
- Traces locais em `~/.config/mcf-google-bridge/audit.jsonl` (nao publica-los).

### Registro do Codex (instalado neste computador)
- Servidor MCP global registrado: mcf-google-bridge, habilitado, stdio.
- Executavel: /home/leo/.nvm/versions/node/v22.23.2/bin/node
- Script estavel: /home/leo/.local/share/mcf-google-bridge/src/index.mjs
- Verificacao: codex mcp get mcf-google-bridge
- A integracao ao dispatcher e ledger do runtime canônico do MCF exige fase separada; nao esta implicitamente ativa.

## Arquivo privado de configuracao compartilhado com Codex e systemd
Criado vazio em /home/leo/.config/mcf-google-bridge/bridge.env, modo 0600.
Adicionar SOMENTE no computador, quando autorizado: GOOGLE_OAUTH_CLIENT_ID, opcional GOOGLE_OAUTH_CLIENT_SECRET, GEMINI_API_KEY (auth key restringida), ou GOOGLE_APPLICATION_CREDENTIALS.
Nao inserir credenciais neste repositorio, nos prompts, nos logs ou no config.toml do Codex.
O registro do Codex usa node --env-file-if-exists=... e le o mesmo bridge.env da unidade systemd.
Com a conta OAuth Desktop configurada, executar npm run auth no computador e concluir o consentimento no navegador local. Nao executar automaticamente a autorizacao.
