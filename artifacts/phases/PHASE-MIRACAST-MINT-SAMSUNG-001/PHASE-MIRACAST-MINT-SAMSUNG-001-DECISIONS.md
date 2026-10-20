# DECISIONS — 2026-10-20

- **D01 (MESTRE / LÉO):** tratar como risco B, diagnóstico prioritário, escrita local somente reversível e fundamentada; fundamento: escopo autorizado e protocolo unificado v1.1.
- **D02 (Miriam):** state live do GitHub prevalece sobre snapshots históricos; `main@460d6e6` foi consultado. Dados de hardware serão `UNKNOWN` até saída real.
- **D03 (Sofia/Rafael):** Wi-Fi normal não equivale a Wi-Fi Direct/P2P; não presumir suporte por marca TP-Link ou Samsung. A alternativa primária é GNOME Network Displays, condicionada a capacidades efetivas.
- **D04 (Augusto/Bruno):** erro explícito de limite mensal Desktop Commander: não repetir nem reconectar. Sem execução local e sem falsificar logs ou aceite.
- **D05 (Julia):** publicar apenas procedimentos/evidência sanitizada num repositório público; nunca SSID, IP/MAC, serial, user home, token, senhas ou journal bruto.
- **D06 (Gabriel):** documentação em branch e PR draft; não escrever direto em main, não fazer merge nem publicar produção sem gates.
- **D07 (Renato/Emily):** teste de imagem e estabilidade exige prova e possivelmente confirmação física; nenhum critério técnico passa por documentação apenas.
- **D08 (LÉO / MESTRE):** estado `BLOCKED` / `AGUARDANDO_DEPENDENCIA_EXTERNA`; não transferir ações técnicas para LEANDRO antes de esgotar execução por ferramenta legitimamente disponível.


## Decisões da retomada Predix (2026-10-20)
- D09 (MESTRE): conta correta é Predix; a indicação anterior de cota Potiguar não era gate real para a missão; executar diagnóstico pela conta Predix.
- D10 (Bruno): rádio desativado por software; antes de mudar guardar estado privado, ligar temporariamente sem reiniciar NM, validar; se falhar, restaurar.
- D11 (Rafael): `iw` não disponível e sudo não-interativo bloqueado; obter binário Ubuntu autêntico via apt-get download, SHA256 e extração privada, sem instalação global.
- D12 (Sofia): `iw phy` confirma ausência de P2P no driver rtl8xxxu atual; não trocar driver ou firmware às cegas; Miracast via GND bloqueado neste ambiente. A Samsung UN40J5200 foi encontrada em rede por SSDP; o manual J5200 documenta Screen Mirroring, mas isso não prova sessão real.
- D13 (Patrícia): GND reiniciado para debug após verificar sem sessão TCP estabelecida; NetworkManager disponível, nenhum p2p-dev; falta de portal ScreenCast pode ter fallback X11, não causa primária comprovada.
- D14 (Renato): rollback local PASS, testes físicos NOT_EXECUTED, aceitabilidade global não atingida. Não confundir conexão Wi-Fi convencional e SSDP com Wi-Fi Direct.
- D15 (Júlia/Emily/LÉO — verificação coordenada sem independência real): logs brutos e identificadores privados não publicados; limpar pacote de diagnóstico, preservar backup privado; manter Issue/PR draft sem merge, gate de integração reprovado por auditoria de dependências não relacionadas.


## Decisões do ciclo 4 — "/autonomous-run" e "/run"
- D16: diagnosticar alternativas existentes sem troca de driver/kernel, compra ou perda de rede. O único TL-WN821N reconhecido no notebook ainda não anuncia P2P. HDMI existe mas sem ligação física.
- D17: explorar protocolo UPnP/DLNA somente após GetProtocolInfo da Samsung UN40J5200 e prova local GStreamer. TV anuncia AVC_TS_MP_SD_AAC_MULT5_ISO; software H264/AAC/TS disponível. Usar padrão sintético, não dados da tela real.
- D18: M05 enviado SOAP Set URI/Play, TV TRANSITIONING sem byte de mídia; aguardar STOPPED pós-limpeza. Não confundir Play aceito com reprodução.
- D19: M06 único reteste com DIDL-Lite e ISO 188-byte TS, TV enviou somente HEAD, GET 0, bytes 0; encerrar rota DLNA sem simular sucesso ou insistir em ações visíveis repetidas.
- D20: TV retornou status STOPPED por nova consulta; não afirmar que fonte de entrada anterior foi restaurada. No notebook, serviços testes encerrados, rede preservada.
- D21: Por recursos limitados (<1 GiB RAM disponível e swap cheio), não iniciar screen streaming contínuo de alta resolução. Não instalar executar tv-cast de terceiros porque portal ScreenCast indisponível em Cinnamon; link estudado como arquitetura, não solução validada.
