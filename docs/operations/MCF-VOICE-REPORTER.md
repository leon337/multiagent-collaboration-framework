# MCF Voice Reporter e MESTRE Voice Checkpoints

Issue canônica original do reporter: #219.

A missão `MCF-PERSISTENT-VOICE-COMMS-001` evolui o reporter para um modelo de comunicação persistente em que **MESTRE** é a identidade padrão dos checkpoints de execução.

O protocolo normativo está em:

`docs/protocols/MCF-MESTRE-VOICE-CHECKPOINTS.md`

## Papéis

### MESTRE Voice Checkpoint

É o caminho principal para comunicação durante uma missão.

Ele:

- registra o estado local da missão;
- envia imediatamente um checkpoint ao VoiceHub;
- prefere áudio já renderizado com `voice_profile=clear`;
- usa TTS do VoiceHub como fallback;
- persiste receipt de entrega;
- atualiza o mesmo fingerprint usado pelo worker persistente, evitando repetição.

Comando:

```bash
mcf-voice-checkpoint \
  --project MCF \
  --mission MCF-EXAMPLE-001 \
  --phase validation \
  --audio ~/.cache/voicehub-linux/generated/checkpoint.mp3 \
  "Validação concluída; iniciando auditoria."
```

### Voice Reporter persistente

É um worker operacional determinístico que observa o último estado sanitizado e entrega mudanças que ainda não foram faladas.

Ele **não é uma LLM independente**, não toma decisões e não possui autoridade sobre missões.

O worker continua útil quando uma tarefa longa atualiza o arquivo de estado sem emitir o checkpoint imediato.

## Arquitetura V3

```text
MESTRE
  |
  | checkpoint imediato
  v
mcf-voice-checkpoint
  |-------------------------------|
  |                               |
  | rendered audio disponível     | sem rendered audio / falha permitida
  v                               v
VoiceHub /api/audio/enqueue        VoiceHub /api/speech/enqueue
  |                               |
  |----------- fila única --------|
                  |
                  v
          saída de áudio local

Estado persistido
  |
  v
~/.local/state/mcf-voice-reporter/status.json
  |
  v
mcf-voice-reporter.service
  |
  | recuperação/deduplicação
  v
VoiceHub
```

## Estado e identidade

O status persistido inclui, entre outros:

- `agent` — padrão `MESTRE`;
- `project`;
- `mission`;
- `phase`;
- `message`;
- `voice_profile` — padrão `clear`;
- `rendered_audio_path` — opcional;
- `allow_tts_fallback`.

Voz e autoria são campos distintos. Um arquivo renderizado com perfil `clear` continua sendo um checkpoint de `agent=MESTRE`.

## Cadência

O checkpoint imediato deve ser emitido em fronteiras úteis:

- missão iniciada;
- fase iniciada;
- progresso material;
- blocker/recovery relevante;
- fase concluída;
- missão concluída.

O worker de recuperação faz polling a cada 30 segundos, mas fala apenas quando:

```text
enabled = true
mission_active = true
mission_state = ACTIVE
fingerprint(status atual) != fingerprint(último status falado)
```

O fingerprint V3 considera `agent`, `mission`, `phase`, `message` e `voice_profile`.

## Instalação local

```bash
mkdir -p ~/.local/share/mcf-voice-reporter ~/.local/state/mcf-voice-reporter ~/.local/bin
install -m 0755 tools/voice-reporter/reporter.py ~/.local/share/mcf-voice-reporter/reporter.py
install -m 0755 tools/voice-reporter/mcf-voice-status.py ~/.local/bin/mcf-voice-status
install -m 0755 tools/voice-reporter/mcf-voice-checkpoint.py ~/.local/bin/mcf-voice-checkpoint
install -m 0644 docs/operations/mcf-voice-reporter.example.service ~/.config/systemd/user/mcf-voice-reporter.service
systemctl --user daemon-reload
systemctl --user enable --now mcf-voice-reporter.service
```

Para persistir fora de uma sessão gráfica, o usuário deve ter `Linger=yes`.

## Operação de estado

Iniciar missão:

```bash
mcf-voice-status --resume --active \
  --agent MESTRE \
  --mission MCF-EXAMPLE-001 \
  --phase build \
  "Implementação iniciada."
```

Encerrar:

```bash
mcf-voice-status --complete
```

Também existem:

```bash
mcf-voice-status --fail
mcf-voice-status --cancel
mcf-voice-status --pause
mcf-voice-status --resume
mcf-voice-status --show
```

## Receipts

Após checkpoint imediato:

```text
~/.local/state/mcf-voice-reporter/last-delivery.json
```

Após qualquer fala deduplicada:

```text
~/.local/state/mcf-voice-reporter/last-spoken.json
```

## Segurança

O reporter não armazena chaves TTS.

Áudio pré-renderizado é entregue pelo VoiceHub e deve estar sob:

```text
~/.cache/voicehub-linux/generated/
```

A validação final do caminho e formato pertence ao VoiceHub. URLs remotas não são aceitas pelo endpoint de áudio.

O mecanismo de voz não pode:

- aprovar HUMAN_GATE;
- criar autorização nova;
- executar merge/release/deploy por conta própria;
- modificar autoridade da missão;
- publicar segredos;
- transformar LEANDRO em operador técnico.

## Compatibilidade com AUGUSTO V2

O nome AUGUSTO foi usado na versão anterior como identidade fixa do reporter. O worker continua sendo a mesma classe de componente determinístico, mas V3 remove a identidade fixa.

Status legados que contenham `agent=AUGUSTO` continuam válidos. Novas missões usam `MESTRE` por padrão.
