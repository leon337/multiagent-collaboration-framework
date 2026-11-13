# MCF — Gemini 3.8 no CodeBuddy Code

**Missão:** continuação de `MCF-CODEBUDDY-CONTROL-001`
**Escopo:** `leo-N43SM`, integração local em branch isolada; sem merge ou deploy do MCF central.
**Arquitetura:** CodeBuddy Code CLI/PWA + modelos personalizados em `~/.codebuddy/models.json` + adaptador MCF Live autenticado já existente.

## Modelos

| Seleção no CodeBuddy | Modelo remoto | Transporte | Escopo |
|---|---|---|---|
| `custom-local:gemini-3.8-flash` | `gemini-3.8-flash` | Google OpenAI-compatible `/v1beta/openai/chat/completions` | Texto, ferramentas, imagem quando suportada pela API |
| `custom-local:gemini-3.8-live` | `gemini-3.8-live` | Gateway MCF `127.0.0.1:3100/v1/chat/completions` | **Apenas texto adaptado de Live** |
| `custom-local:gemini-3.8-live-extended-thinking` | `gemini-3.8-live-extended-thinking` | Mesmo gateway, roteamento Extended + controle de ferramentas existente | Texto adaptado de Live, raciocínio prolongado |

**Separação de modalidades:** Custom Models no CodeBuddy utilizam OpenAI Chat Completions; não transportam áudio bidirecional nativo. Conversação de voz/áudio em tempo real continua no DSH/MESTRE Live, que usa a API Live Google. Não vender compatibilidade textual como áudio nativo da PWA. O adaptador existente oferece endpoint `/health` e exige bearer token para modelos/chats; `--auth password` protege a UI web do CodeBuddy, em outro serviço/porta.

A seleção `gemini-3.8-flash` *nativa* do CodeBuddy foi negada pela política da conta `personal_free_user`; usar o **`custom-local:`** para a tentativa via Google API do usuário. O modelo padrão de fallback continua `fast-model` até os testes diretos passarem. A disponibilidade efetiva de modelo e quota deve ser provada com teste de resposta — listagem no CLI não prova execução.

## Configuração e segurança

Arquivos do host:

- `~/.codebuddy/models.json`: cadastro, sem segredos embutidos; o `apiKey` usa referências de ambiente como `${MCF_CODEBUDDY_LIVE_TOKEN}`.
- `~/.config/codebuddy/mcf-gemini38.env`: credenciais locais, permissão `0600`, fora do Git.
- `~/.config/systemd/user/codebuddy-web.service`: carrega o arquivo de ambiente, mantém `127.0.0.1:46514` e `--auth password`.
- `~/.local/share/mcf-gemini38-agent/secrets/`: fonte existente de credenciais, não mover para repositório nem incluir em logs.
- `~/.codebuddy/backups/mcf-codebuddy-gemini38/<UTC timestamp>/`: cópias privadas e manifesto de hashes para rollback.
- `~/agent-sandbox/bin/mcf-codebuddy`: controlador que carrega credenciais apenas na chamada específica por modelo.

Código versionado: `tools/mcf-codebuddy-control/gemini38_models.py` (cadastro/backup/rollback) e `mcf-codebuddy.py` (controle).

## Comandos

```bash
CB=/home/leo/agent-sandbox/bin/mcf-codebuddy

"$CB" doctor
"$CB" prompt "Responda somente OK." --model custom-local:gemini-3.8-flash
"$CB" prompt "Responda somente OK." --model custom-local:gemini-3.8-live
"$CB" prompt "Responda somente OK." --model custom-local:gemini-3.8-live-extended-thinking
```

O CodeBuddy respeita sua própria política de permissões; **não** usar `--dangerously-skip-permissions`. Qualquer mudança sensível (contas, produção, merge ou deploy) permanece subordinada aos gates do MCF.

## Reinstalação e rollback

```bash
python3 tools/mcf-codebuddy-control/gemini38_models.py apply
systemctl --user daemon-reload
systemctl --user restart codebuddy-web.service

python3 tools/mcf-codebuddy-control/gemini38_models.py inspect
python3 tools/mcf-codebuddy-control/gemini38_models.py rollback --backup /home/leo/.codebuddy/backups/mcf-codebuddy-gemini38/TIMESTAMP
systemctl --user daemon-reload
systemctl --user restart codebuddy-web.service
```

O rollback exige checksum idêntico ao estado instalado, evitando sobrescrever mudanças posteriores. Não remover `~/.codebuddy` nem desativar a UI; os demais modelos ficam preservados.

## Validação

- Inventariar modelos sem copiar configurações privadas para logs: `codebuddy --help` mostra os três identificadores `custom-local:`.
- `python3 -m unittest discover -s tools/mcf-codebuddy-control/tests -v`.
- `mcf-codebuddy doctor` e `curl http://127.0.0.1:3100/health`.
- Verificar HTTP 200 na UI de `127.0.0.1:46514`.
- Executar prompt mínimo real de cada modelo; registrar `ok`, `session_id` e resposta, sem armazenar materiais confidenciais em evidências públicas.
- Regressão `fast-model` após a mudança.

## Resultado verificado — 2026-11-13, `leo-N43SM`

| Modelo | Cadastro | API upstream | E2E CodeBuddy | Critério |
|---|---|---|---|---|
| `gemini-3.8-flash` (Google personalizado) | PASS | **TIMEOUT** pela API nativa (22 s), OpenAI-compatible (62 s) | **TIMEOUT** (80 s) | Disponível no catálogo do projeto Google, mas **não qualificado para uso agora** |
| `gemini-3.8-live` | PASS | HTTP 200 + marcador esperado | **PASS** após correção de truncamento | `VALIDACAO_GEMINI_38_OK` + sessão criada |
| `gemini-3.8-live-extended-thinking` | PASS | HTTP 200 + marcador esperado | **PASS** após correção de truncamento | `VALIDACAO_GEMINI_38_OK` + sessão criada |

**Causa e correção do CodeBuddy Live:** uma requisição CodeBuddy real enviou 13.604 caracteres em `messages[].content`. O adaptador recortava `messageToText(m).slice(0,6500)` para mensagens de usuário, removendo a instrução mais recente no final. Agora usa `clipMessage(role,...)` e preserva **os últimos** 6.500 caracteres em mensagens de usuário, mantendo o início das mensagens de assistente. Metadados da inspeção foram exibidos sem registrar conteúdo de prompt nem token. A correção está em `tools/mcf-dsh-live/app/message-window.mjs` e `dsh-native-adapter.mjs`.

**Testes:** 11/11 testes do adaptador Live; 20/20 testes Python do CodeBuddy; `mcf-codebuddy doctor` confirmou `ready: true` e gateway local HTTP 200. Ambos Live passaram pelo CLI após correção; `fast-model` continua padrão operacional, pois Flash permanece não validado. Não realizar fallback silencioso.

**Rollback independente do reparo Live:**

```bash
python3 tools/mcf-codebuddy-control/rollback-live-window.py \
  --backup /home/leo/.local/share/mcf-gemini38-agent/backups/mcf-codebuddy-live-window-20261113T035315Z
```

A conta Google lista também `gemini-3.8-flash-tts` e `gemini-3.8-flash-lite-tts`; esses são modelos de áudio, não foram cadastrados como LLMs de chat do CodeBuddy. O DSH/Voice mantém a responsabilidade de voz. Não afirmar que a integração textual Live do CodeBuddy entrega áudio bidirecional.

**Pendente externo:** esclarecer timeout do Gemini 3.8 Flash com o provedor/quota. Ele está cadastrado, mas não possui evidência de resposta; a configuração do CodeBuddy não substitui autorização e disponibilidade do endpoint.
