# F0 — Contrato de telemetria e observabilidade mínima

**Contrato:** `mcf-live-f0-telemetry/v1` · **Status:** implementado localmente, experimento F0 · **Issue:** [#527](https://github.com/leon337/multiagent-collaboration-framework/issues/527). Não inclui monitoramento em nuvem, tracing distribuído nem persistência automática.

## Implementação realmente observada

- Código em `public/telemetry.js`, carregado antes de `public/app.js`; servido em `/telemetry.js`.
- API local `window.MCFLiveTelemetry.record(event, fields)` e `snapshot()`.
- Somente sinais numéricos/enum validados, buffer em **memória do navegador com máximo de 500 eventos**.
- `snapshot()` permite `p50`/`p95` (nearest-rank) do setup e primeira resposta áudio por mensagem textual. Não há captura de prompt, áudio, transcrição, imagem, token efêmero nem chave API.
- Os eventos são incluídos no JSON **somente quando o usuário clica Exportar**; o export já inclui texto da conversa em outra seção e continua exigindo aviso explícito de privacidade em F2.
- `/api/status` continua endpoint operacional básico; não há auth/métricas de custo no backend.
- A fonte local está versionada em commit `a33bdf9c4681ace0cb582621801bb6608415692a` e nunca subiu segredos ao GitHub MCF.

## Eventos aceitos

| Evento | Campos permitidos | Disparo |
|---|---|---|
| `connect_attempt` | `model` | antes de provisionar token |
| `ws_open` | `elapsed_ms` | socket WebSocket aberto |
| `setup_complete` | `latency_ms` | setup aceito pelo Google |
| `first_audio` | `latency_ms` | primeiro chunk de áudio após prompt textual |
| `disconnect` | `code` | close do socket |
| `text_sent` | `bytes` (caracteres estimados) | envio de mensagem de texto |
| `tool_call` | `count` | chamada de função executada |
| `tokens` | `total_tokens` | campo totalTokenCount recebido |
| `browser_error` | `code` | reservado para instrumentação futura |

Todos os campos são whitelist. **É proibido** enviar `prompt`, `transcript`, `api_key`, `token`, `URL_com_query`, `frame`, `pcm`, `user_id` ou `email` no evento de telemetria.

## Esquema de referência

```json
{
  "schema": "mcf-live-f0-telemetry/v1",
  "scope": "browser-memory-only",
  "events": [
    {"at": "2026-11-16T19:00:00Z", "event": "setup_complete", "latency_ms": 982}
  ],
  "metrics": {
    "setup_latency_ms": {"samples": 1, "p50": 982, "p95": 982},
    "first_audio_latency_ms": {"samples": 1, "p50": 2863, "p95": 2863},
    "ws_disconnects": 0,
    "tool_calls": 1
  }
}
```

Esse JSON é **ilustrativo quanto à data**, mas os valores de latência foram observados em um teste real da F0: `setup=982ms`, `first_audio=2863ms` com **n=1**. `p95` com um único valor **não tem valor estatístico**. Não fixar SLO definitivo antes de >=30 amostras por modelo e perfil de rede.

## Especificação de evolução das métricas (F1)

| Métrica | Unidade | Fórmula | Status |
|---|---|---|---|
| `live_setup_latency_ms` | ms | setupComplete − connect_attempt | **MVP implementado** |
| `first_audio_latency_ms` | ms | primeiro audio chunk − envio de prompt | **MVP implementado para texto** |
| `turn_end_to_first_audio_ms` | ms | chunk inicial de resposta − fim detectado de fala | PLANEJADO |
| `audio_underruns` | contagem | interrupção involuntária de reprodução | PLANEJADO |
| `barge_in_interrupt_latency_ms` | ms | início de interrupção − parada do áudio | PLANEJADO |
| `reconnect_success_rate` | % | reconexões válidas / tentativas | PLANEJADO |
| `websocket_error_rate` | % | sessions com erro / sessions | PARCIAL (disconnect code apenas) |
| `tokens_per_session` | tokens | usageMetadata.totalTokenCount no encerramento | PARCIAL (eventos incrementais) |
| `rate_limit_429` | contagem | HTTP/WebSocket 429 classificado por modelo | PLANEJADO |
| `estimated_provider_cost` | moeda | tokens por modalidade × tarifa confirmada e vigente | **NÃO IMPLEMENTADO; não inventar preço** |
| `tool_execution_success_rate` | % | receipts válidos / requests com trace | PLANEJADO F3 |

## Guardrails

1. Persistir somente com consentimento/retention configuráveis e proteção de dados (F2); F0 não envia eventos a sistemas externos.
2. Para medição, correlacionar identificadores opacos `session_id`/`trace_id`, sem armazenar PII; preservar relação com `mission_id` apenas no gateway de F3.
3. Custos devem ser calculados a partir da tabela vigente do provedor, com preço e timestamp explícitos; exibir `não disponível` se não houver verificação.
4. Limites do painel AI Studio não equivalem a autorização de cobrança. Respeitar `429`, `Retry-After`, limites por projeto e fallback compatível.
5. `p50/p95` só devem ser exibidos como estatística robusta quando `samples >= 30`; para n menor, marcar `exploratório`.

## Testes e resultado

Na regressão local `f0/baseline-smoke.cjs` houve **15/15 PASS**: telemetria presente, valores do setup registrados e ausência de padrões de chave, URL de token ou texto do prompt nos eventos. Esse resultado não prova que todos os cenários de privacidade já estão cobertos.

**Próximo passo F1:** benchmark com amostragem real, captura PCM via AudioWorklet, correlação turn/audio, p50/p95 por modelo e dispositivo e queda de rede induzida.

**Fontes:** [Google Live best practices](https://ai.google.dev/gemini-api/docs/live-api/best-practices), [Session management](https://ai.google.dev/gemini-api/docs/live-api/session-management).


## Adendo de verificabilidade
O código exato da telemetria está versionado como `artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-00/repro/public/telemetry.js`; os testes de contrato estão em `ops/gemini-live/f0-telemetry.test.mjs` (**9/9 PASS local**). O teste confirma whitelist, limite de 500 entradas, amostras e ausência de texto de prompt nos eventos de telemetria. **Não certifica o export completo de conversa nem resolve retenção**, que permanece em F2.
