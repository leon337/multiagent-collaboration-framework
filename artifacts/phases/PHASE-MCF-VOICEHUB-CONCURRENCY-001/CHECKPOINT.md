# PHASE-MCF-VOICEHUB-CONCURRENCY-001 — Checkpoint

- Issue: #226
- Base main: `bb4269729ea43473aa8f96bac6302357bdb7ea3b`
- Status local: `QUALIFIED`

## Achado

O servidor usava `ThreadingHTTPServer` e cada `/api/speak` podia chamar o
router em uma thread distinta. Requisições simultâneas podiam disputar o
dispositivo de áudio.

Também foi observado que outro agente modificou o VoiceHub durante esta missão,
adicionando `radio_fx`. A implementação foi reconciliada em vez de
sobrescrita.

## Implementação

- fila FIFO server-side;
- worker único;
- status da fila via API;
- jobs identificados;
- lock `flock` entre processos;
- `/api/speak` legado também serializado;
- AUGUSTO queue-aware;
- provider NVIDIA sem credencial em argv;
- radio_fx preservado.

## Teste determinístico

```json
{
  "queue_fifo": true,
  "max_simultaneous_execute": 1,
  "identity_required": true,
  "cross_process_lock": true
}
```

O trace do lock foi:

```text
P1 start
P1 end
P2 start
P2 end
```

Sem sobreposição.

## Teste real do Hub

Fila verificada como livre antes do envio.

Job real:

```text
id      b197e65a85bf403895b72b48ffda1998
status  DONE
agent   MESTRE
project MCF VoiceHub
mission MCF-VOICEHUB-CONCURRENCY-001
phase   qualificação
```

O reporte foi reproduzido com identidade automática e sem sobreposição.

## Boundary

Nenhuma credencial foi adicionada ao repositório. Nenhum release ou deploy do
runtime MCF foi realizado por esta missão.
