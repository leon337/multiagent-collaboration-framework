# Ciclo de QA F1-Q3

Relatorio: F1-Q3-REPORT.md.
- BROWSER-REAL-API.json: E2E real Google + midia virtual, 17/17.
- MIC-PHYSICAL-REAL.json: microfone real via AudioWorklet, sem persistencia de voz.
- UNDERRUN-CLASSIFIER.json: evento de gap real versus pausa entre turnos, 3/3.
- LATENCY-TURNS.json: benchmark da API real, 19 turnos e 18 respostas com audio, p50/p95 exploratorios e um timeout.
- Relatorio e source/test hashes versionados; revisoes externas devem ler a evidencia e o SHA exato.

## Capture prolongada do microfone real (60 segundos)
Teste no mesmo codigo F1-Q3: 1.494 frames x 640 samples = 956.160 amostras a 16kHz (59,76s de PCM) em captura de ~60s, 0 drops no Worklet. Foi utilizado getUserMedia no Chrome com dispositivo padrao real e AudioWorklet FIR; o audio bruto e a transcricao nao foram salvos. JSON MIC-PHYSICAL-60S.json inclui SHA256 do app e do worklet, comparados com a branch. Esta evidência nao comprova eco/barge-in natural, nem qualidade de som nos alto-falantes.

Cycle 2 findings and validation:
- Q3-REMEDIATION-CYCLE2.md — first external Q3 audit findings, fixes and remaining issues.
- MIC-PHYSICAL-60S.json — latest Worklet source, ~60s real mic input, no raw audio retained.
- STALE-WATCHDOG.json — 3/3 adversarial validation of stale mic rejection, frame count and no-auto-retry timeout.
- BROWSER-REAL-API.json updated to final source: 17/17 PASS.
The LATENCY-TURNS.json remains historical for previous Q3 source, not a retest on cycle2.
