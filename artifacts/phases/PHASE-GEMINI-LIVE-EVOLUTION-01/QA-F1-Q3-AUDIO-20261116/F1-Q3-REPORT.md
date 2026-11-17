# F1 Q3 — Qualidade de audio, reamostragem e metricas (2026-11-16)

Missao MCF-GEMINI-LIVE-EVOLUTION-20261116-001, PR #529 em draft.
Estado: EM_CORRECAO / GATE_PENDENTE. Leandro confirmou anteriormente que a versao corrigida estava funcionando; este relato e uma validacao positiva de uso, nao um aceite cronometrado do hardware ou do barge-in.

## Causa dos nove underruns do teste de 632 segundos
O contador anterior marcava como underrun o primeiro chunk de um novo turno quando a fila anterior ja havia terminado. Como nao havia correlacao entre turnos no registro historico, nao e possivel reclassificar retroativamente os nove eventos como todos falsos ou todos reais.
A correcao introduz playbackTurnOpen e um evento separado playback_idle_resume. A regressao numerica 3/3 confirma que uma lacuna no meio da fala conta como underrun e uma pausa depois de generationComplete ou turnComplete conta apenas como retomada ociosa.

## Captura aprimorada
- FIR antialias: 33 taps, janela Blackman, 64 fases, corte em 7100 Hz; algoritmo deterministico 48kHz/44.1kHz para 16kHz PCM16. ~16 samples de atraso de entrada (0,33 ms a 48kHz).
- Filas MessagePort limitadas a 3 blocos pendentes de 40ms e ACK do frontend. Sob bloqueio da thread principal, input mais antigo pode ser descartado e contabilizado; nao se deixa crescer a fila indefinidamente.
- Telemetria first_playback mede texto enviado ao primeiro agendamento da saida (inclui o buffer inicial), nao mede fim da fala humana ao som realmente ouvido.
- Captura real do microfone pelo navegador: 63 blocos de PCM, 40320 amostras a 16kHz; nenhum conteudo do microfone persistido.

## Regressao tecnica
- 17/17 testes unitarios AudioWorklet + telemetria.
- Browser E2E com API Google real e midia virtual: 17/17 PASS; reconexao e handle preservados.
- Classificador de underrun: 3/3 PASS.
- Benchmark real de texto para primeiro audio: 19 turnos tentados, 18 com resposta audivel agendada; p50 1324 ms; p95 4666 ms sobre as 18 amostras. Houve um turno sem conclusao em 16s, com WebSocket ainda conectado. 30 amostras foram solicitadas mas NAO atingidas: nao extrapolar a confiabilidade ou mascarar falhas.
- O benchmark registrou 0 underruns intra-turno e 17 retomadas ociosas normais. Estes numeros pertencem apenas a este teste, nao ao teste antigo de 632s.

## Pendencias para gate
Testes de barge-in natural e comparacao de microfone/headset com voz longa ainda nao foram certificados. Falha/turno silencioso ou lento deve ser investigado; 30+ amostras validas de voz fim-de-fala para primeiro som ainda nao existem. O teste de 632s pertence a SHA anterior (documentado no PRF). Nao se inferiu custo real da conta de API. F0.8 e a chave compartilhada nao revogada ainda sao riscos abertos por instrucao anterior do usuario. Sem merge, deploy ou F2 implementada.
