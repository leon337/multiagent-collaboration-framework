# VoiceHub Linux — persistência operacional

Registro vinculado à missão [#215](https://github.com/leon337/multiagent-collaboration-framework/issues/215).

## Objetivo

Preservar o VoiceHub como serviço local de voz do operador, sem incorporar credenciais,
tokens ou configuração secreta ao repositório.

Estado validado em 2026-09-18:

- saída de áudio padrão em 100%, sem mute;
- `voicehub-linux.service` habilitado e ativo;
- `Restart=always` com `RestartSec=2`;
- `loginctl Linger=yes` para o usuário local;
- restauração best-effort do volume na inicialização do serviço.
## Boundary de segurança

O VoiceHub permanece um serviço local auxiliar. Este registro:

- não autoriza publicação de chaves de API;
- não transforma VoiceHub em fonte de autoridade do MCF;
- não altera os HUMAN_GATEs do MCF;
- não prova independência cognitiva de agentes;
- não autoriza deploy de produção do runtime.

Arquivos locais em `~/.config/voicehub-linux/` que contenham credenciais permanecem fora do Git.
## Unit sanitizada de referência

```ini
[Unit]
Description=VoiceHub Linux - Painel de Controle de Voz
After=graphical-session.target

[Service]
Type=simple
WorkingDirectory=%h/.local/share/voicehub-linux
ExecStart=/usr/bin/python3 %h/.local/share/voicehub-linux/voicehub_server.py
Restart=always
RestartSec=2
Environment=VOICEHUB_PORT=8788
Environment=DISPLAY=:0
Environment=XDG_RUNTIME_DIR=/run/user/1000
Environment=DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus
Environment=PULSE_SERVER=unix:/run/user/1000/pulse/native
ExecStartPost=-/usr/bin/pactl set-sink-mute @DEFAULT_SINK@ 0
ExecStartPost=-/usr/bin/pactl set-sink-volume @DEFAULT_SINK@ 100%

[Install]
WantedBy=default.target
```

A unit acima é documentação sanitizada. O caminho real do usuário e qualquer configuração
de provider de voz devem permanecer locais.

## Validação operacional

```text
service enabled: yes
service active: yes
restart policy: always
linger: yes
sink volume: 100%
mute: no
```
