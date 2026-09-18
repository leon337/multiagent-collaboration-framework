# MCF AUGUSTO Voice Reporter

Issue canônica: #219.

## Finalidade

O **AUGUSTO Voice Reporter** é um worker operacional determinístico que anuncia
o estado sanitizado de uma missão pelo VoiceHub local. Ele foi solicitado para
fornecer feedback audível durante trabalhos longos sem exigir que LEANDRO fique
acompanhando continuamente a tela.

Ele **não é uma LLM independente**, não toma decisões e não possui autoridade
sobre missões.

## Arquitetura

```text
MESTRE / operador
      |
      v
mcf-voice-status
      |
      v
~/.local/state/mcf-voice-reporter/status.json
      |
      v
AUGUSTO Voice Reporter (systemd --user)
      |
      | poll a cada 30 s
      | fala somente se a missão estiver ACTIVE
      | e o status tiver mudado
      v
VoiceHub /api/speak
      |
      v
saída de áudio local
```

## Boundary de governança

Pode:

- ler apenas o status local sanitizado;
- anunciar o último status disponível;
- registrar sucesso/erro técnico do envio;
- ser pausado ou retomado pelo operador.

Não pode:

- aprovar HUMAN_GATE;
- executar merge, release ou deploy;
- modificar uma missão;
- inferir fatos ausentes do arquivo de estado;
- publicar chaves, tokens ou segredos;
- substituir MESTRE ou LEANDRO.

## Instalação local

```bash
mkdir -p ~/.local/share/mcf-voice-reporter ~/.local/state/mcf-voice-reporter ~/.local/bin
install -m 0755 tools/voice-reporter/reporter.py ~/.local/share/mcf-voice-reporter/reporter.py
install -m 0755 tools/voice-reporter/mcf-voice-status.py ~/.local/bin/mcf-voice-status
install -m 0644 docs/operations/mcf-voice-reporter.example.service ~/.config/systemd/user/mcf-voice-reporter.service
systemctl --user daemon-reload
systemctl --user enable --now mcf-voice-reporter.service
```

Para persistir fora de uma sessão gráfica, o usuário deve ter `Linger=yes`.

## Operação

Iniciar uma missão com reporte habilitado:

```bash
mcf-voice-status --resume --active   --mission MCF-EXAMPLE-001   --phase testes   "Testes iniciados."
```

Atualizar o progresso da missão:

```bash
mcf-voice-status --phase auditoria "Testes concluídos; iniciando auditoria."
```

O novo texto será falado uma vez. Polls seguintes com o mesmo conteúdo ficam silenciosos.

Encerrar uma missão:

```bash
mcf-voice-status --complete
```

Também existem estados terminais explícitos:

```bash
mcf-voice-status --fail
mcf-voice-status --cancel
```

Ver o status atual:

```bash
mcf-voice-status --show
```

Pausar e retomar a fala:

```bash
mcf-voice-status --pause
mcf-voice-status --resume
```

Parar/iniciar o worker:

```bash
systemctl --user stop mcf-voice-reporter.service
systemctl --user start mcf-voice-reporter.service
```

## Cadência e deduplicação V2

O worker faz **polling a cada 30 segundos**, mas isso não significa falar a
cada 30 segundos.

A fala só é permitida quando:

```text
enabled = true
mission_active = true
mission_state = ACTIVE
fingerprint(status atual) != fingerprint(último status falado)
```

O fingerprint considera `mission`, `phase` e `message`. Após uma fala
bem-sucedida, ele é persistido em
`~/.local/state/mcf-voice-reporter/last-spoken.json`. Isso evita replay do
mesmo estado mesmo após reinício do serviço ou do Linux.

Estados `IDLE`, `COMPLETED`, `FAILED` e `CANCELLED` ficam silenciosos.
`--pause` também silencia o reporter sem parar o serviço `systemd`.

## Segurança

Nenhuma chave de TTS ou provider é armazenada neste worker. O VoiceHub é o
único responsável pelo roteamento para NVIDIA, Edge ou outro provider já
configurado localmente.


## Evidência pós-reboot V2

Em 2026-09-18, após reboot real do notebook, foram observados:

```text
voicehub-linux.service        enabled + active
mcf-voice-reporter.service   enabled + active
Restart                      always
Linger                       yes
VoiceHub 127.0.0.1:8788      listening
reporter                     IDLE / silencioso
```

O reporter V2 reiniciou automaticamente e registrou
`skip_inactive_or_disabled`, sem reproduzir a última mensagem antiga.
A evidência detalhada está em
`artifacts/phases/PHASE-MCF-VOICE-REPORTER-V2-001/CHECKPOINT.md`.
