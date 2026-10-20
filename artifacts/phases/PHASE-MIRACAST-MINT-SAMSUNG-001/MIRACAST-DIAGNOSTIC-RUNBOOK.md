# Runbook seguro — diagnóstico antes de qualquer alteração

**STATUS: PREPARADO; NENHUM COMANDO ABAIXO EXECUTADO NO NOTEBOOK.** Os comandos são para o operador técnico após recuperação legítima do executor, não uma solicitação automática de trabalho para LEANDRO.

## 0. Segurança e registro
Usar shell **sem sudo** sempre que possível; capturar exit code, data e mensagem. Nunca commitar stdout bruto em GitHub público (filtrar SSIDs, MACs, IPs, serial USB, usernames/paths e log pessoal). Não desconectar rede nem reiniciar NetworkManager. Cada comando abaixo é de observação; nenhum aplica mudança. Não repassar dados sensíveis a chat ou Issue.

## 1. Inventário SO, sessão e dispositivos
```bash
date -Is
cat /etc/os-release
uname -sr
printf 'DESKTOP=%s TYPE=%s SESSION=%s DISPLAY=%s WAYLAND=%s\n' "$XDG_CURRENT_DESKTOP" "$XDG_SESSION_TYPE" "$DESKTOP_SESSION" "$DISPLAY" "$WAYLAND_DISPLAY"
loginctl list-sessions
loginctl show-session "${XDG_SESSION_ID:-self}" -p Type -p Desktop -p State
lsusb -nn
lsusb -t
nmcli --version
nmcli -f DEVICE,TYPE,STATE device status
iw dev
```
Não pressupor qual interface pertence ao USB TP-Link: cruzar VID:PID, `lsusb -t`, `udevadm info -q property -p /sys/class/net/<iface>` e driver.
```bash
readlink -f /sys/class/net/<iface>/device/driver
ethtool -i <iface>
udevadm info -q property -p /sys/class/net/<iface>
iw phy
```
`iw phy`: conferir modos `P2P-client`, `P2P-GO`, `P2P-device`, combinações válidas e eventual simultaneidade com managed. Ausência de P2P, por si só, exige reconciliação com driver/chipset. Não trocar módulo à cegas.

## 2. Software e capacidades Miracast
```bash
command -v gnome-network-displays || true
dpkg-query -W gnome-network-displays network-manager wpasupplicant 2>/dev/null || true
flatpak list --app --columns=application,version 2>/dev/null
nmcli -f DEVICE,TYPE,STATE device status
systemctl is-active NetworkManager
systemctl is-active wpa_supplicant
gdbus call --system --dest fi.w1.wpa_supplicant1 --object-path /fi/w1/wpa_supplicant1 --method org.freedesktop.DBus.Properties.Get fi.w1.wpa_supplicant1 Capabilities
gdbus call --system --dest fi.w1.wpa_supplicant1 --object-path /fi/w1/wpa_supplicant1 --method org.freedesktop.DBus.Properties.Get fi.w1.wpa_supplicant1 WFDIEs
gst-inspect-1.0 x264enc
gst-inspect-1.0 openh264enc
```
Verificar serviço `iwd` (não suportado pelo caminho P2P do NetworkManager conforme upstream) sem desabilitá-lo automaticamente. Verificar portal PipeWire e permissões de screencast se logs indicarem falha de captura.

## 3. Identificar Samsung
Obter modelo no menu **Configurações > Suporte > Sobre esta TV** ou etiqueta (sem expor serial); verificar manual oficial por modelo para recepção Miracast / Screen Mirroring / Smart View. Ativar tela de recepção na TV **somente se necessário**. Estar no mesmo roteador não comprova Wi-Fi Direct. SSDP/DLNA ou Chromecast encontrados não comprovam sink Miracast.

## 4. Descoberta e conexão (após A1/A2)
- Abrir GNOME Network Displays na sessão gráfica autorizada. Para o binário nativo, usar `G_MESSAGES_DEBUG=all gnome-network-displays` e acompanhar **somente** linhas sanitizadas relativas a `NdNMDeviceRegistry`, `WFDP2PProvider`, criação de grupo, RTSP/codec.
- Não iniciar um segundo processo se aplicação já estiver em execução sem antes verificar instância existente.
- Se flatpak, verificar primeiro ID real (`flatpak list`) e lançar com `flatpak run <id-confirmado>` conforme instalação, nunca supor mesmo comando.
- Encontrar sink Samsung; antes do clique registrar peer de forma anonimizada e, durante, distinguir DISCOVERY → WAIT_P2P → WAIT_SOCKET → STREAMING.
- Confirmar imagem na TV e manter 10 minutos monitorados, com início/fim e contagem de falhas; reconectar após disconnect; fechar app e verificar conectividade normal.
- TV desligada: verificar que não aparece ou falha de forma limpa; não confundir ausência com defeito Wi-Fi.
- Reboot somente se seguro, autorizado e recuperável; sem evidência rotular `NOT_EXECUTED`.

## 5. Diagnóstico de falhas, sem mutações especulativas
- Sem `p2p-dev-*`: driver/hardware ou wpa_supplicant/NetworkManager; consultar capacidades reais.
- `WFDIEs` em erro: pode faltar suporte WIFI_DISPLAY em wpa_supplicant.
- Encontrado sem conexão: examinar state transitions e DNS/DHCP/RTSP; **não desligar firewall cegamente**.
- Conecta sem vídeo: verificar codec H.264 e portal/captura X11/Wayland.
- Sem som: revisar sink de áudio específico, sem trocar saída padrão persistente sem necessidade.
- Sem Miracast na TV ou driver sem P2P: documentar limitação física; considerar **alternativas existentes** (HDMI ou outro protocolo compatível) somente após comprovação. Não recomendar compra prematuramente.

## 6. Política de alterações, backups e rollback
Antes de toda alteração local: registrar problema e evidência; consultar status atual e pasta afetada; fazer cópia datada, mantendo permissões, em local privado **fora do repositório público**; documentar comando e diff; ajustar uma variável por vez. Exemplo genérico de backup para arquivo **já confirmado**: `cp -a -- /caminho/arquivo /caminho/arquivo.bak-AAAAMMDD-HHMMSS` (usar caminhos reais, tratar ownership). Alterações efêmeras somente da sessão têm rollback por sair do app/reverter perfil; mudanças de serviços exigem restaurar backup e revalidar conectividade.

**Hoje rollback local = NÃO APLICÁVEL**, pois nenhum comando local ou alteração foi executado. Na branch Git, rollback = manter PR draft/fechar sem merge e descartar branch se aprovado; não alterar main.

Fonte upstream: https://github.com/GNOME/gnome-network-displays/blob/master/README.md


## Resultado real de 2026-10-20 (Predix; supersede STATUS PREPARADO acima)
Os comandos diagnósticos foram executados com Predix. Foi identificado TL-WN821N v5/v6 2357:0107, RTL8192EU rev B e rtl8xxxu. A Wi-Fi estava soft blocked e foi habilitada temporariamente com backup privado prévio. Após conexão Wi-Fi normal, `nmcli` não apresentou `p2p-dev-*`. Um `iw` obtido do apt oficial e executado em pasta privada (SHA256 conferido) reportou exclusivamente managed, AP, AP/VLAN e monitor — nenhum modo P2P. GNOME Network Displays 0.92.1 em Cinnamon/X11 não criou P2P provider. A TV Samsung UN40J5200 respondeu em SSDP/DIAL/UPnP na LAN. Manual da J5200: MENU > Network > Screen Mirroring ou SOURCE > Screen Mirroring, mas esse menu não foi inspecionado fisicamente. Wifi radio foi desativado de novo (`nmcli radio wifi off`) e a interface ficou unavailable/soft blocked como originalmente; Ethernet permaneceu conectada; GND normal restaurado e os extratos iw eliminados. Sem necessidade de instalar scripts/serviços nem de trocar driver. Para usar Miracast nativo depois, é preciso driver/hardware que realmente anuncie P2P; isso não foi alcançado nesta missão. `DLNA`/`DIAL` permitem mídia/aplicativos mas não equivalem ao objetivo de espelhamento da tela completa. **Jamais dizer que o usuário já consegue espelhar.**
