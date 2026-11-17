# Independent EXTERNAL Emily-profile Codex CLI report

Reviewed SHA: 4e5f3310f11be36cdc8144ffe1a3e042ce725bef
Codex thread: 01a1e6cf-bc1d-7563-9ac5-27075555444c
Executor: CODEX_CLI_EXTERNAL_EMILY_PROFILE
Native MCF Agent Session: FALSE
External reviewer returned for correction, not a final release gate.

---

**Parecer técnico: RETORNAR_PARA_CORRECAO.** O Q3 melhora captura, controle de filas e métricas, mas ainda não sustenta fechamento de F1 nem transição formal para F2.

Executor: **Codex CLI externo, separado, aplicando o perfil normativo EMILY**. Não sou uma Agent Session nativa autenticada MCF e este parecer não substitui a decisão de LÉO.

Missão: `MCF-GEMINI-LIVE-EVOLUTION-20261116-001`. Candidato identificado como PR #529; HEAD local confirmado:

```text
4e5f3310f11be36cdc8144ffe1a3e042ce725bef
```

Li os contratos EMILY/LEO, protocolo unificado, roadmap, PRF, gate anterior, fontes, testes e workflow indicados. Não usei rede, browser, API Google, credenciais, modificações ou atualizações externas. O estado atual do GitHub/CI não foi verificado.

**Verificação efetivamente executada**

| Comando/verificação | Resultado |
|---|---|
| `pwd`; `git rev-parse HEAD`; `git status --short` | Diretório e SHA corretos; árvore limpa |
| `node --version` | `v24.22.2` |
| `node --test --test-isolation=none --test-reporter=tap tests/gemini-live-f1/capture-worklet.test.mjs tests/gemini-live-f1/telemetry.test.mjs` | **17/17 PASS**, zero falhas |
| `node --test tests/gemini-live-f1/capture-worklet.test.mjs tests/gemini-live-f1/telemetry.test.mjs` | Exit 0; nesta execução, saída agregada em dois arquivos aprovados |
| `node --check` em `app.js`, `capture-worklet.js`, `telemetry.js`, `metric-classifier.cjs`, `latency-benchmark.cjs` | Todos aprovados |
| `sha256sum -c PHASE-01-SOURCE-MANIFEST.sha256` | **26/26 OK** |
| `sha256sum -c PHASE-01-ARTIFACT-MANIFEST.sha256` | **34/34 OK** |
| `node` por heredoc, usando `fs`/`crypto` | Cinco hashes de fontes e hash do harness do E2E Q3 coincidem; hash da aplicação no benchmark também coincide |
| `git show <SHA>:apps/gemini-live-studio/public/app.js \| sha256sum` | Vínculos históricos confirmados abaixo |
| Probes adicionais com `node`/`vm`, somente em memória | Conferência espectral, saturação de créditos, classificação de gaps e contagem de perdas |

Os **17/17 E2E**, **3/3 do classificador** e **63 frames físicos** foram examinados como artefatos; não foram reexecutados.

**Achados priorizados**

**P0 — nenhum identificado no escopo examinado.** Isso não representa certificação geral de segurança.

**P1 — impedem recomendar fechamento de F1**

1. **Qualificação física e latência de voz continuam incompletas.** Os 63 frames representam 40.320 amostras, aproximadamente **2,52 segundos de captura**, sem comprovar resposta física contínua de 30–60 segundos, inteligibilidade, eco ou barge-in natural. Faltam comparação antes/depois e **n≥30 medições válidas de fim da fala→primeiro som audível**, com método e falhas registrados. A confirmação “está funcionando” é evidência funcional positiva, sem suprir esses critérios. Evidência: [relatório Q3, pendências](/tmp/mcf-f1-qa/q3-audit/artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-01/QA-F1-Q3-AUDIO-20261116/F1-Q3-REPORT.md:23).

2. **Resposta ausente permanece sem diagnóstico e tratamento demonstrado.** O benchmark registra 19 tentativas, 18 respostas com áudio e um turno sem áudio nem terminal em 16 segundos, embora conectado. Os p50 **1.324 ms** e p95 **4.666 ms** descrevem somente as 18 respostas observadas. Não permitem atribuir a causa ao provedor ou afirmar confiabilidade do diálogo. A aplicação possui watchdog de negociação, mas não demonstra mecanismo equivalente de acompanhamento de resposta por turno. Evidências: [LATENCY-TURNS.json](/tmp/mcf-f1-qa/q3-audit/artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-01/QA-F1-Q3-AUDIO-20261116/LATENCY-TURNS.json) e [envio de prompts](/tmp/mcf-f1-qa/q3-audit/apps/gemini-live-studio/public/app.js:376).

3. **A fila limitada preserva mensagens antigas e perde fala nova sob bloqueio da UI.** O limite de três créditos funciona, mas, quando ocupado, o Worklet descarta **o frame recém-produzido**, mantendo os três anteriores no MessagePort. Em simulação de aproximadamente 600 ms sem ACK: três mensagens pendentes e **11 frames descartados — 440 ms**. Ao retomar, mensagens antigas ainda podem ser processadas, sem timestamp ou descarte por idade. Isso contradiz a descrição de descarte do input mais antigo e pode cortar fala, prejudicar VAD/barge-in e aumentar atraso. Exige política explícita, sinalização e teste integrado sob carga. Fontes: [Worklet](/tmp/mcf-f1-qa/q3-audit/apps/gemini-live-studio/public/capture-worklet.js:52), [ACK da UI](/tmp/mcf-f1-qa/q3-audit/apps/gemini-live-studio/public/app.js:320) e [descrição Q3](/tmp/mcf-f1-qa/q3-audit/artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-01/QA-F1-Q3-AUDIO-20261116/F1-Q3-REPORT.md:12).

4. **Dependências normativas continuam abertas.** F0.8, tratamento da chave anteriormente compartilhada e contribuições reais dos controles Classe C permanecem pendentes no PRF. A postergação da rotação autoriza a continuidade interna nos limites registrados; não comprova remediação nem dispensa os gates. Não acessei a chave. Evidências: [checkpoint](/tmp/mcf-f1-qa/q3-audit/artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-01/PHASE-01-CHECKPOINT.yaml), [mission trace](/tmp/mcf-f1-qa/q3-audit/artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-01/PHASE-01-MISSION-TRACE.md) e [gate anterior RETORNAR](/tmp/mcf-f1-qa/q3-audit/artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-01/QA-F1-20261116/LEO-PROFILE-GATE.md).

**P2 — corrigir ou submeter a tratamento formal aplicável**

5. **Ainda existe falso underrun em fronteira de reconexão.** O fechamento inesperado preserva playback e não reinicializa `playbackTurnOpen`. Sem terminal do turno interrompido, o primeiro áudio de uma nova geração após reconexão pode ser contado como underrun da anterior. Reproduzi offline: gap intrageração incrementou para 1; pausa após terminal manteve 1; nova geração após fechamento sem terminal incrementou indevidamente para 2. O classificador 3/3 cobre a pausa normal após terminal, sem cobrir essa fronteira. Fontes: [socket close](/tmp/mcf-f1-qa/q3-audit/apps/gemini-live-studio/public/app.js:125), [classificação](/tmp/mcf-f1-qa/q3-audit/apps/gemini-live-studio/public/app.js:213) e [teste](/tmp/mcf-f1-qa/q3-audit/tests/gemini-live-f1/metric-classifier.cjs:22).

6. **Telemetria subconta frames perdidos.** `processAudioFrame` registra `input_dropped` com `count: lost`, mas `snapshot()` conta eventos. Reproduzi `count:12` retornando `input_frames_dropped:1`. O contador acumulado `state.workletDrops` conserva outra contagem, enquanto o dashboard usa a métrica subcontada. Fonte: [telemetry.js:23](/tmp/mcf-f1-qa/q3-audit/apps/gemini-live-studio/public/telemetry.js:23).

7. **Benchmark standalone pode terminar com sucesso apesar de falha.** Seu exit code verifica apenas `turns.length<TOTAL`. Um timeout no último turno pode produzir `TOTAL` tentativas, menos respostas completas e **exit 0**. A correlação também usa timestamps e contadores globais; o término aceita `generationComplete`, e o timeout de espera pelo drain é ignorado. Além disso, os scripts novos dependem de caminhos locais absolutos. Corrigir critérios de sucesso, correlação e portabilidade antes de usá-los como gate. O [workflow](/tmp/mcf-f1-qa/q3-audit/.github/workflows/mcf-gemini-live-f1.yml:23) executa unidades e verificações estáticas, sem executar esses ensaios conectados. Fonte: [latency-benchmark.cjs](/tmp/mcf-f1-qa/q3-audit/tests/gemini-live-f1/latency-benchmark.cjs:41).

8. **Antialias confirmado, qualificação espectral ainda limitada.** Há efetivamente FIR de **33 taps, janela Blackman, 64 fases**, e a configuração da aplicação produz PCM16 de **640 amostras/40 ms a 16 kHz**. O teste de 12 kHz passa. Nos probes adicionais, a atenuação relativa a 1 kHz foi aproximadamente **−81 dB em 12 kHz**, mas **−16 dB em 8,5 kHz**, para entrada de 48 kHz; em 44,1 kHz, aproximadamente −87/−17 dB. Isso confirma filtragem, sem estabelecer rejeição uniforme perto de Nyquist. Definir banda e critério experimental, incluindo fases de 44,1 kHz; o limite atual de teste em 12 kHz é apenas cerca de −16,5 dB. Fonte: [capture-worklet.test.mjs](/tmp/mcf-f1-qa/q3-audit/tests/gemini-live-f1/capture-worklet.test.mjs).

9. **Privacidade da telemetria é sustentada; custo e retenção exigem precisão.** A whitelist numérica e o limite de 500 eventos passaram. Entretanto, isso não cobre todo o estado da aplicação: transcrições/notas ficam em memória e podem integrar exportação explícita; não são apagadas por `disconnect()`. Não há custo por modalidade nem limiar de orçamento demonstrados, e métricas derivadas da janela de 500 eventos podem perder histórico. A fila de saída também possui aviso, sem limite demonstrado. Não identifiquei novo vazamento de recursos de captura por inspeção; o cleanup físico completo permanece sustentado por artefato, sem reteste nesta auditoria. Fontes: [cleanup](/tmp/mcf-f1-qa/q3-audit/apps/gemini-live-studio/public/app.js:341), [exportação](/tmp/mcf-f1-qa/q3-audit/apps/gemini-live-studio/public/app.js:382) e [telemetria](/tmp/mcf-f1-qa/q3-audit/apps/gemini-live-studio/public/telemetry.js:4).

**Integridade e vínculo histórico**

Os manifestos estão íntegros. O E2E Q3 vincula cinco fontes e seu harness ao candidato local. O benchmark vincula `app.js`; os JSONs de microfone físico e classificador não incorporam hashes de execução, embora estejam protegidos pelo manifesto do PRF. Integridade do arquivo não comprova, isoladamente, qual fonte foi carregada no ensaio.

Confirmei estes hashes de `app.js`:

| Evidência/versão | SHA-256 |
|---|---|
| Ensaio histórico de 632 s; corresponde a `bef121c…` | `7b41ed8a2c94e7d11f6e7edfdd8e55fa41b26ce74d42c2ec5f953b05f2d6483b` |
| Candidato anterior `361a08b…` | `11666aabc15b690c560d0e72b33d34dd7386e839c6eab16371db55e712296eeb` |
| Candidato Q3 atual | `c897492cde8317f75831ad79ab4687421934dee90102abbe623f40e71587d39a` |

O [relatório consolidado](/tmp/mcf-f1-qa/q3-audit/artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-01/PHASE-01-REPORT.md:62) declara explicitamente que os **632 s pertencem ao código anterior**. Seus nove underruns não podem ser reclassificados retrospectivamente. A qualificação antiga ainda usa linguagem de “final candidate” para o hash intermediário; deve ser contextualizada na consolidação.

**Matriz de aceite**

| Item | Resultado | Evidência primária e limite |
|---|---|---|
| F1.1 — Captura/resampling | **PARCIAL** | Nove unidades de captura aprovadas; FIR/PCM/créditos confirmados; artefato físico de 63 frames. Faltam qualificação sob carga e critérios espectrais. |
| F1.2 — VAD/barge-in | **PARCIAL** | E2E Q3 registra atividade e cancelamento sintéticos. Faltam interrupção natural, eco e calibração física. |
| F1.3 — Playback/turnos | **PARCIAL** | E2E registra burst sem truncamento; classificador 3/3 anexado. Persistem fronteira de reconexão, correlação e qualificação física longa. |
| F1.4 — Resiliência/sessão longa | **PARCIAL** | Reconexão Q3 anexada; 632 s históricos com GoAway real. Falta qualificação longa do candidato final e diagnóstico do turno sem resposta. |
| F1.5 — Hardware/benchmark | **INSUFICIENTE** | Captura física curta; benchmark textual n=18. Faltam voz→som n≥30, antes/depois e resposta física de 30–60 s. |
| F1.6 — PRF/auditoria/gate | **PARCIAL** | Manifestos válidos e auditorias externas rastreáveis. Pendem correções, controles Classe C, F0.8 e novo gate competente. |

**Pré-requisitos para reapresentação ao gate LÉO-perfil**

1. Corrigir perdas/obsolescência de entrada, contagem de frames e fronteiras de geração/reconexão; validar sob bloqueio realista da UI.
2. Investigar o turno silencioso com correlação por turno e recuperação observável, sem replay cego.
3. Corrigir o sucesso/exit code e os vínculos dos harnesses; preservar falhas no denominador.
4. Produzir QA físico supervisionado: resposta de 30–60 s, inteligibilidade, eco, barge-in natural, mute, stop e cleanup.
5. Entregar benchmark antes/depois de voz→som com n≥30, falhas, p50/p95 e custo/uso adequadamente identificados.
6. Qualificar sessão longa no candidato final; reconciliar PRF, controles Classe C, F0.8 e tratamento da credencial.
7. Reauditar o SHA final e obter nova decisão de LÉO com justificativa, próximo estado, ação e responsável.

**Próximo passo seguro:** continuar correções e qualificação interna reversível de F1. Pode-se preparar **somente planejamento de F2**, conforme o [documento de readiness](/tmp/mcf-f1-qa/q3-audit/artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-01/PHASE-01-F2-READINESS.md). Isso não autoriza implementação nem transição formal: o [roadmap exige critérios e gate aprovados](/tmp/mcf-f1-qa/q3-audit/docs/missions/gemini-live-evolution-20261116/ROADMAP.md:140).

Entrega desta auditoria: **ENTREGUE**. Handoff ao MESTRE; estado recomendado da fase: **EM_CORRECAO**. Nenhum gate oficial, arquivo ou estado externo foi alterado.