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


## Provisionamento Google Cloud governado (experimental, desabilitado por padrão)

O Bridge agora contém operações de escrita limitadas, destinadas exclusivamente ao adapter do runtime MCF. Elas permanecem desabilitadas até que ambos os flags estejam explicitamente habilitados no runtime/serviço:

- MCF Bridge: MCF_GOOGLE_CLOUD_PROVISION_ENABLED=true
- MCF runtime: MCF_GOOGLE_CLOUD_PROVISION_RUNTIME_ENABLED=true

Operações HTTP locais allowlisted:
- google.cloud.projects.create — cria um projeto com projectId determinístico e labels mcf_managed/mcf_mission; se já existir, só reutiliza quando as labels confirmarem propriedade e missão.
- google.cloud.services.enableMaps — habilita somente apikeys.googleapis.com, geocoding-backend.googleapis.com e routes.googleapis.com.
- google.cloud.apiKeys.createMaps — cria/reconcilia a chave mcf-obras-maps-v1 com API restrictions exatas para Geocoding e Routes; a string é gravada localmente e nunca retornada.
- google.cloud.apiKeys.inspectMaps — consulta metadados e confirma se o secret local está presente com permissões seguras.

O Bridge não implementa billing link, billing account creation, IAM administration, service-account key export, delete, deploy ou public exposure. O projeto é criado sem vincular faturamento. Antes de habilitar APIs Maps ou criar a chave, o Bridge consulta o Cloud Billing API (GET projects/{projectId}/billingInfo) e exige billingEnabled=false e ausência de billingAccountName. Se a consulta não puder ser verificada, o resultado fica PENDING/UNKNOWN; se houver conta vinculada ou billing ativo, a operação é bloqueada. A chave criada restringe os serviços de API; a restrição de IP de aplicação permanece uma etapa de hardening quando o IP de saída do ambiente estiver estabilizado.

### Autorização Cloud ADC

As operações de escrita usam Google Application Default Credentials com escopo cloud-platform. A sessão de OAuth do Workspace (Drive/Gmail/Calendar) não é reutilizada para Cloud. O operador precisa configurar ADC com consentimento explícito e permissões IAM mínimas, por exemplo:

```bash
gcloud auth application-default login --scopes=https://www.googleapis.com/auth/cloud-platform
```

Esse comando requer Google Cloud CLI instalado e autenticação interativa. O Bridge não automatiza consentimento, não aceita Termos de Serviço e não altera billing.

### Segredo Maps local

Após criar/reconciliar a chave, o Bridge grava o valor diretamente em:
`~/.config/agente-logistica-obras/google_maps_api_key`

O diretório é 0700 e o arquivo 0600. O receipt contém apenas alias lógico e SHA-256 fingerprint. Se já existir um arquivo com valor diferente, a operação falha fechada; não sobrescreve silenciosamente.

### Fronteira de execução

As operações mutáveis **não são registradas no MCP stdio genérico**, pois esse transporte não prova identidade do agente ou autorização da missão. Elas só são expostas pelo endpoint HTTP loopback e consumidas pelo adapter MCF, que exige PermissionEngine + Human Delegation Firewall, projeto aprovado, identidade Cloud verificada, aceite de termos e autorização humana/sensível/escopo. O adapter transforma timeouts e resultados pendentes em receipt PARTIAL/UNKNOWN para reconciliação, nunca em retry cego.

O endpoint permanece em 127.0.0.1:8755 e exige Bearer local. Nunca publique essa porta. Mesmo assim, processos locais do mesmo usuário podem acessar o token; use apenas em host confiável e mantenha o usuário do serviço protegido.
