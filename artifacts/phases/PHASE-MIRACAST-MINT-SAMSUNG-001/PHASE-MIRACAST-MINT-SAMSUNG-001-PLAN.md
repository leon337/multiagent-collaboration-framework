# PLAN — Wi-Fi Display Linux Mint → Samsung

## Problema e resultado
Espelhar a tela do notebook Linux Mint na Samsung por rede sem fio com adaptador USB TP-Link e GNOME Network Displays já declarados presentes. Repetir conexão, desconectar e reverter com segurança.

**Hipóteses ainda NÃO verificadas:** distribuição/versão, ambiente/sessão, versão real do aplicativo, USB chipset/driver/firmware e capacidades P2P, modelo da TV, codecs, endpoint de espelhamento.

## Autoridade e escopo
LEANDRO: autoridade final; MESTRE: orquestração; LÉO: gate interno; equipe técnica por competência. Classe B por potencial alteração reversível de configuração de rede. Não gastar, atualizar firmware, trocar driver/NetworkManager, publicar produção, executar ação irreversível ou revelar credenciais; qualquer mudança precisa de backup específico, diffs e retorno.

## Critérios de aceite
A1: evidência SO/sessão/USB VID:PID/chipset/driver/firmware/interface/P2P.
A2: inventário GNOME Network Displays, NetworkManager, wpa_supplicant, H.264 e captura de tela.
A3: modelo e capacidade Miracast da TV; descoberta P2P comprovada em logs.
A4: conexão, imagem física confirmada e 10 minutos contínuos de estabilidade.
A5: duas conexões e encerramento limpo.
A6: TV indisponível, rollback verificado, pós-reboot se seguro.
A7: PRF, checklist, uso/parada/retomada e revisão; nenhuma aprovação fictícia.
A8: proteção de privacidade, credenciais e limite de autoridade.

## Fluxo e tarefas
| Ordem | Responsável | Depende de | Entrega prevista | Estado |
| --- | --- | --- | --- | --- |
| T01 | MESTRE/Miriam | — | repo live, protocolo e dedup | DONE |
| T02 | MESTRE/Augusto | T01 | executor de notebook identificado/bloqueio preservado | DONE |
| T03 | Bruno/Patrícia | cota/executor | inventário real de SO/USB/Wi-Fi/app/logs | BLOCKED |
| T04 | Sofia/Rafael | T03 | compatibilidade e decisão técnica mínima | BLOCKED |
| T05 | Bruno/Rafael | T04 | backup, diff, aplicação reversível, rollback | BLOCKED |
| T06 | Renato | T03–T05 e TV | descoberta, imagem 10 min, reconexão | BLOCKED |
| T07 | Renato/Bruno | T06 | desligada/reboot/rollback | BLOCKED |
| T08 | Carmem/Augusto/Miriam/Emily/Júlia | conjunto | evidência, checkpoint, auditoria/gate | PARTIAL |
| T09 | Gabriel | T08 | PR draft e reconciliação | IN_PROGRESS |

## Escolhas condicionais
1. Detectar P2P do **driver real**, não do nome TP-Link; Wi-Fi roteador não prova Miracast.
2. Confirmar receiver Miracast de modelo real Samsung; DLNA/Chromecast/AirPlay são protocolos diferentes.
3. Preferir aplicativo existente, wpa_supplicant + NetworkManager e codecs disponíveis; fallback X11 conforme upstream.
4. Apenas se logs indicarem falha específica: considerar ajuste mínimo e reversível com backup.
5. HDMI ou outro protocolo são opções fora da via nativa, não prova de incompatibilidade e não justificam compra agora.

## Validação e dados
Evidência = comando exato + retorno + data + status + linhas relevantes **anonimizadas**. Não publicar SSID, MAC, IP privado, serial, usuário, token, logs brutos. Separar `AUTOMATED`, `LOCAL_CONFIG`, `PHYSICAL_TV`, `NOT_EXECUTED`.

## Bloqueio atual
Desktop Commander listou notebook online, mas negou comandos com limite mensal e instrução explícita de não repetir/reconectar. TRIGGERcmd retornou `No computers found for this user.`; sem alternativa remota executável comprovada. Zero comandos no notebook. Fonte técnica: https://github.com/GNOME/gnome-network-displays/blob/master/README.md


## Revisão pós-inspeção (Predix, 2026-10-20)
T03/T04 concluídos com evidência real. O driver rtl8xxxu do RTL8192EU no kernel 6.8 somente expõe managed, AP, AP/VLAN, monitor; GNOME Network Displays exige Wi-Fi P2P e NetworkManager p2p-dev. Veredicto: caminho nativo BLOQUEADO PELO DRIVER ATUAL, sem alegar incapacidade universal do chipset. Não substituir módulo/firmware, não usar sudo ou instalar globalmente sem gate/segurança. M01 foi revertida e provada. A TV modelo UN40J5200 está na LAN e há documentação Screen Mirroring; isso não comprova sink ativo. A4/A5/A6 físicos permanecem pendentes. Contexto temporal de cotas anterior era da conta Potiguar, não Predix.
