# F1 — Recuperação de respostas de voz e evidência técnica

Mission: MCF-GEMINI-LIVE-EVOLUTION-20261116-001.
Stage: branch isolada fix/gemini-live-f1-response-gate.
Status: EM_CORRECAO, F0.8 still pending; F2 implementation NOT started.

## Problema e correção
LEANDRO relatou anteriormente que a saída de áudio se sobrepunha/cortava; confirmou que o hotfix de playback funciona. Auditorias posteriores encontraram ausência de acompanhamento de respostas iniciadas por voz e turno sem resposta.

- Heurística local de fim de voz após 760ms de silêncio RMS arma aviso de atraso em 20s para voz, incluindo VAD manual e parada intencional do microfone depois de fala. Não é fim de fala confirmado pelo provedor.
- Aviso para texto continua em 16s. Seq de turno e timers são encerrados ao receber áudio válido, concluir turno, interromper ou desconectar. Áudio base64 inválido não é tratado como resposta válida.
- Sem retry automático/replay cego. UI tem botão Pedir reinício seguro (manual), com confirmação explícita. Ao desligar a sessão, mic não cria timer novo.
- Telemetria numérica agregada separa timeouts, interrupções, silenciosos e voice_to_audio_proxy (p50/p95). Proxy é fim de energia local até primeiro áudio recebido, NAO é latência fim de fala→som ouvido.
- Mantida a fila PCM24kHz monotônica aprovada anteriormente, sem interrupção automática em generationComplete.

## Testes com hashes vinculados
- 13/13 testes de navegação com fake WebSocket: WATCHDOG-BROWSER.json, hashes de app, HTML e telemetry verificados.
- 17/17 E2E com API Gemini Live real e mídia virtual: GEMINI-REAL-E2E.json, todos os cinco hashes de fonte e script.
- 23/23 testes offline AudioWorklet e telemetria com duas novas regressões, sem dados pessoais.
- Captura do microfone físico ~60s: 1493 frames x 640, 955520 amostras PCM a 16kHz, zero Worklet drops, sem persistir áudio: REAL-MIC-60S.json. SHA do Worklet confere com a fonte final; SHA de app coincide com o candidato final = false. O ensaio mede captura, não conversação ou áudio dos alto-falantes.

## Bloqueios documentados
- Teste supervisionado de voz real e headset/speaker, barge-in natural, eco, respostas de 30–60s e 30 medições válidas de voz até som audível, comparação antes/depois, p50/p95 e falhas.
- Turno silencioso real do provedor tem aviso e reinício seguro opcional, mas NÃO foi demonstrada recuperação automática segura.
- F0.8 e controles de segurança/custo e agente Classe C; chave anteriormente compartilhada segue sem rotação por opção de LEANDRO, barrando uso público.
- Sem merge na main, deploy de produção ou transição formal para F2 até aprovação de gates.

Original local 18371 e F1 funcional 18372 preservados; testes executados em servidor isolado 18373.
