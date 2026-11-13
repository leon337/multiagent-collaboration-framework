# MCF CodeBuddy Control

Adapter **local** para o CodeBuddy Code já instalado, com controle por CLI sem bypass de permissões e gateway de autenticação por senha em loopback.

## Instalação

```bash
bash tools/mcf-codebuddy-control/install-local.sh
/home/leo/agent-sandbox/bin/mcf-codebuddy doctor
```

## Uso

```bash
/home/leo/agent-sandbox/bin/mcf-codebuddy prompt "Responda o estado do projeto"
/home/leo/agent-sandbox/bin/mcf-codebuddy resume SESSION_ID "Continue"
```

Outros comandos: `status`, `doctor`, `start`, `restart`. O `--model fast-model` é o padrão da bridge e não muda a escolha global do CodeBuddy.

## Validação

```bash
python3 -m unittest discover -s tools/mcf-codebuddy-control/tests -v
bash -n tools/mcf-codebuddy-control/install-local.sh
bash -n tools/mcf-codebuddy-control/rollback-local.sh
```

Manual operacional: [MCF-CODEBUDDY-CONTROL](../../docs/operations/MCF-CODEBUDDY-CONTROL.md). Reversão para estado anterior: `bash tools/mcf-codebuddy-control/rollback-local.sh --baseline`.

## MCP remoto comprovado

SentinelX sentinel_exec pode chamar sudo -H -u leo python3 /home/leo/agent-sandbox/bin/mcf-codebuddy doctor ou prompt. O wrapper seleciona Node v22 mesmo que o agente remoto inicie com Node v18; rota validada por resposta real. O Remote Desktop Commander também pode invocar o wrapper.

## Família Gemini 3.8

Cadastro reversível via `gemini38_models.py apply` e verificação via `gemini38_models.py inspect`. Executar após `systemctl --user daemon-reload && systemctl --user restart codebuddy-web.service`. O instalador preserva modelos existentes, mantém chaves fora do Git e configura as entradas `custom-local:gemini-3.8-flash`, `custom-local:gemini-3.8-live` e `custom-local:gemini-3.8-live-extended-thinking`. Para áudio nativo, utilizar o ambiente MESTRE Live/DSH; o CodeBuddy consome o adaptador textual do Live.

**E2E local:** Live e Extended Thinking passaram no CLI após correção do recorte das mensagens extensas do adaptador `mcf-dsh-live`. Flash está cadastrado, mas o endpoint Google não retornou dentro do timeout — não promovê-lo a padrão. Detalhes, backup e rollback em [MCF-CODEBUDDY-GEMINI38](../../docs/operations/MCF-CODEBUDDY-GEMINI38.md).
