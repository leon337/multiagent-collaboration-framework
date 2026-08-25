# Evidência E2E — Canal MESTRE ↔ Ox via DeepSeek Harness (2026-08-25)

Status: **EVIDENCE** (observação datada; ids/valores aqui são efêmeros — não usar como configuração).
Spec canônica: [`../MCF-HARNESS-MESTRE-OX-CHANNEL.md`](../MCF-HARNESS-MESTRE-OX-CHANNEL.md).
Mission ID: `MCF-HARNESS-COMMS-DOC-001`. Fuso das marcações de tempo: `-03:00`.

## 1. Ambiente observado (deployment)

| Fato | Valor observado | Como foi verificado |
|---|---|---|
| Host DSH | VPS, hostname `vmi3506102` | `hostname` |
| Processo | `node .../@deepseek-ai/dsh/lib/bin.js web --host 127.0.0.1 --port 3080 --no-open` | `ps` do PID registrado no pidfile local |
| Bind | escuta exclusiva `127.0.0.1:3080` | `ss -tln` |
| Versão | `@deepseek-ai/dsh` 0.1.1-rc.2 (pacotes `dsh-*` alinhados) | manifest dos pacotes instalados |
| Workspace do agente | `/opt/sentinelx-cloud-core/mcf-labs/multiagent-collaboration-framework` | cwd reportado por `session.list` |
| Persistência | `home/sessions/<cwd-slug>/<sessionId>/session.jsonl.zstd` (eventos por sessão) | inspeção do layout de arquivos |

Credenciais do provider existem no home do DSH com permissão `600` e **não foram lidas** nesta
verificação — nenhum segredo transitou por esta evidência.

## 2. Sondagens vivas da API (read-only, via POST JSON)

- `agentPreset.list` → presets `standard`, `code`, `minimal`, `cordis` (system, **isDefault:true**),
  `mcf` (**user**, persona MCF + skills `mcf-start-mission`/`mcf-operating-protocol`). Nenhum com `broken`.
- `session.list` → 20 itens; maioria `agentPreset:"mcf"`; campo `running` presente por item.
- `session.models` (sessão desta missão) → corrente `{provider:"opencode-zen-direct", model:"x-preview-f-free"}`,
  `routable:true`; grupos adicionais observados: `deepseek-official`, `google`, `opencode-zen`,
  `google-vertex`. Nenhuma chave exposta nas respostas.
- `session.search` → erro de negócio `ok:false`, código `internal`,
  mensagem: *"session search is disabled: this deployment configures the session-query index with
  openAt \"never\""* — limitação registrada na spec (§9/§11).

## 3. Prova máquina-a-máquina (sessões reais, ids efêmeros)

Todas as entradas abaixo foram lidas dos logs persistidos (`session.jsonl.zstd`) em 2026-08-25.

| session_id (EFÊMERO) | Papel na prova | Marcadores verificados |
|---|---|---|
| `session-2cadd376-2cb1-4364-97d7-10116282f27f` | Primeiro teste de conectividade do MESTRE pela API DSH | `user/message` seq=7 @ 08:33:13: *"Mensagem de teste do MESTRE do MCF, enviada diretamente pela API do DeepSeek Harness…"*; 1 turno |
| `session-3b58c1d4-5e1e-4438-884b-bc9c8ffaa10c` | Conversa contínua multi-turno MESTRE↔Ox (continuidade de contexto) | 22 eventos `turn/start`; última atividade ~09:03; inclui recado de autoridade ("quem manda no MCF é LEANDRO") |
| `session-5c2bf7ad-8fd8-4909-8cf8-4ed1c72e2689` | Missão corretiva independente sobre relatório de descoberta do Harness | evento `agent-preset/selected {agentPreset:"mcf"}`; primeiro `user/message` seq=8 @ 09:33:09 |
| `session-f9298584-1222-4f6f-947b-a17bff1f8d74` | Sessão Ox com missão trazida pelo usuário/MESTRE (descoberta) | `assistant/message` seq=8841 @ 04:41:04 citando a missão recebida |
| `session-101f2fac-1434-431c-9344-c4ed81cf8dae` | **Esta missão de documentação** (`[MESTRE → OX \| MCF-HARNESS-COMMS-DOC-001]`) | `user/message` seq=8 @ 09:50:27; `running:true` durante a execução |

Outras sessões (`0a925d07…`, `9e411e81…`, `0a0bbbff…`, `8ce04772…`) contêm traços relacionados
(resultados de ferramentas citando material do canal) e não foram caracterizadas em profundidade
nesta evidência.

## 4. O que esta evidência prova

1. **Canal máquina-a-máquina**: prompts originados fora do navegador do DSH (via API HTTP) foram
   recebidos, executados e respondidos pelo agente (`user/message` + turnos completos nos logs).
2. **Conversa contínua**: mesma `session_id` sustentando 22+ turnos com contexto preservado.
3. **Preset explícito**: uso real de seleção `mcf` (evento `agent-preset/selected`) em sessão de
   missão; default do sistema permanece `cordis`.
4. **Descoberta e errata**: o ciclo "relatório de descoberta → revisão corretiva independente"
   aconteceu por este canal em sessões distintas, sem reuso indevido de sessão anterior.
5. **Observabilidade audit-safe**: todos os fatos acima são verificáveis por eventos versionados
   (`seq` monotônico) persistidos por sessão — nenhuma narrativa retrospectiva foi necessária.

## 5. O que esta evidência NÃO prova

- Comportamento em outra instalação/host/porta (valores aqui são deployment-specific).
- Versionamento futuro do DSH (contratos válidos para 0.1.1-rc.2; revalidar depois).
- Uso operacional de `subagent.*`/`goal.*` dentro deste canal (existem na API; não exercitados).
