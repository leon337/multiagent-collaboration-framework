# VoiceHub Multi-Agent Concurrency Protocol

Issue canônica: #226.

## Objetivo

Serializar toda saída de voz local para impedir sobreposição entre agentes,
preservando identificação de origem e rastreabilidade de projeto/missão.

## Arquitetura

```text
MESTRE / AUGUSTO / outros produtores
                |
                v
      GET /api/speech/queue
                |
                v
POST /api/speech/enqueue  -> fila FIFO
                |
                v
         worker único
                |
                v
 lock de áudio entre processos (flock)
                |
                v
       provider TTS + player local
```

## Regras para reportes de missão

Todo reporte identificado deve incluir:

- `agent`
- `project`
- `mission`
- `phase`
- `source`

O texto reproduzido ganha prefixo automático:

```text
<AGENTE>. Projeto <PROJETO>. Missão <MISSÃO>. Fase <FASE>. <MENSAGEM>
```

## Endpoints

### Estado da fila

```http
GET /api/speech/queue
```

Resposta inclui:

- `busy`
- `current`
- `pending_count`
- `recent`

### Enfileirar reporte identificado

```http
POST /api/speech/enqueue
Content-Type: application/json
```

Exemplo:

```json
{
  "text": "QA concluído.",
  "agent": "MESTRE",
  "project": "MCF VoiceHub",
  "mission": "MCF-VOICEHUB-CONCURRENCY-001",
  "phase": "qualificação",
  "source": "mestre",
  "wait": true
}
```

O endpoint rejeita reportes identificados sem os quatro metadados obrigatórios.

### Compatibilidade

`POST /api/speak` permanece disponível. Ele também passa pela fila central.
Clientes legados deixam de sobrepor áudio mesmo sem migração imediata.

## AUGUSTO

O AUGUSTO V2 agora:

1. consulta a fila;
2. se `busy=true`, adia o reporte;
3. quando livre, usa `/api/speech/enqueue`;
4. informa projeto, missão e fase;
5. só salva o fingerprint como falado após job `DONE`.

Isso combina deduplicação com anti-overlap.

## Lock entre processos

`voicehub_router.py` usa um lock com `flock` em:

```text
~/.local/state/voicehub-linux/audio.lock
```

A fila resolve concorrência HTTP. O lock cobre também processos separados que
chamem o router diretamente.

## Segurança do provider NVIDIA

A síntese NVIDIA deixou de passar credencial e texto em argumentos de processo
do `curl`. A requisição multipart é feita em processo Python, com o segredo
apenas em memória/configuração local protegida.

Nenhuma credencial é versionada no MCF.

## Radio FX

O snapshot preserva a evolução concorrente `radio_fx`. O metadado
`radio_fx=true` pode adicionar um efeito curto antes/depois de uma fala sem
alterar a serialização da fila.

## Persistência

O serviço continua sob `systemd --user`, `Restart=always` e `Linger=yes`.
A fila é intencionalmente em memória: após reboot não existem jobs antigos para
reproduzir. Isso evita replay de voz obsoleto.
