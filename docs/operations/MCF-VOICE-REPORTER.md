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
      | a cada 30 s
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

Atualizar o status:

```bash
mcf-voice-status --mission MCF-EXAMPLE-001 --phase testes "Testes concluídos; iniciando auditoria."
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

## Cadência

O loop agenda uma tentativa de fala a cada **30 segundos** usando relógio
monotônico. O tempo de síntese/resposta do provider pode fazer o horário de
conclusão variar alguns segundos.

## Segurança

Nenhuma chave de TTS ou provider é armazenada neste worker. O VoiceHub é o
único responsável pelo roteamento para NVIDIA, Edge ou outro provider já
configurado localmente.
