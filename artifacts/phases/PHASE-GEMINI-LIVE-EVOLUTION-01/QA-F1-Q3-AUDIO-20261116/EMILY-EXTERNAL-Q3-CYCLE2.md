# Independent EXTERNAL Emily-profile Codex CLI report

Reviewed SHA: ae9f76add213d545d848b1fd0360ea46e581affc
Codex thread: 01a1e6d8-c776-7523-9064-0eb030ef47d9
Executor: CODEX_CLI_EXTERNAL_EMILY_PROFILE
Native MCF Agent Session: FALSE
External reviewer returned for correction, not a final release gate.

---

**Parecer técnico: RETORNAR_PARA_CORRECAO.** A remediação resolve parte dos achados anteriores, mas introduz um P1 na identificação de áudio obsoleto.

Executor: **Codex CLI externo independente**, aplicando o perfil documental Emily e o protocolo operacional unificado; sem autenticação como agente nativo MCF e sem aplicação do gate LÉO.

Missão: `MCF-GEMINI-LIVE-EVOLUTION-20261116-001`. HEAD confirmado: **`ae9f76add213d545d848b1fd0360ea46e581affc`**. PR #529 draft conforme contexto fornecido; GitHub não consultado por restrição de rede.

**Achados**

1. **P1 / Alto — relógios incompatíveis podem descartar continuamente áudio fresco.**
   Em [capture-worklet.js:17](/tmp/mcf-f1-qa/q3-cycle2-audit/apps/gemini-live-studio/public/capture-worklet.js:17), `inputIndex` começa em zero; o timestamp publicado deriva desse contador. A UI compara esse tempo relativo com `micCtx.currentTime`, em [app.js:270](/tmp/mcf-f1-qa/q3-cycle2-audit/apps/gemini-live-studio/public/app.js:270). O AudioContext pode avançar durante `addModule` e a preparação do processador.

   Reproduzi offline o cenário de início do processador aos **600 ms do contexto**, usando o Worklet e `processAudioFrame` reais: **24 frames frescos, 0 envios PCM, 24 descartes como stale, 1 aviso**. O deslocamento permanece nos frames seguintes. É necessário usar a mesma origem temporal do AudioContext e cobrir inicialização atrasada e congelamento posterior da UI.

   O teste físico de 60 s recebe diretamente do Worklet e contabiliza ACKs; ele não exercita essa rejeição na UI.

2. **P2 / Médio — proteção contra turno silencioso tem cobertura parcial.**
   O watchdog de 16 s é armado somente por `sendPrompt`. Turnos de voz, tanto VAD automático quanto manual, não armam essa proteção. Também dependem de `pendingPromptAudio` os avisos de conclusão sem áudio. Portanto, a correção comprova o caminho textual, mas não cobre silêncio após fala do usuário.

3. **P3 / Baixo — documentação histórica precisa de identificação mais clara.**
   O README Q3 e o relatório ainda citam **1.494 frames / 956.160 amostras**, enquanto o JSON atualizado contém **1.493 / 955.520**. O checkpoint também mistura estados históricos de saída “não verificada” com a confirmação humana positiva posterior. Isso não invalida os hashes, mas dificulta interpretar o estado vigente.

**Reteste dos achados anteriores**

| Achado anterior | Resultado |
|---|---|
| P1: pacotes antigos após congelamento | **Parcial**: limite de 350 ms e aviso existem; o novo problema de origem temporal impede aceitar a correção. |
| P1: turno silencioso sem aviso | **Parcial**: texto tem timeout e registro de conclusão silenciosa; voz permanece descoberta. Sem replay automático. |
| P2: contagem incorreta de descartes | **Resolvido no agregador**: soma `count`; teste unitário passa e evidência adversarial registra 12 + 1 = 13. |
| P2: falso underrun após reconexão | **Resolvido por inspeção**: reset no fechamento do socket e no novo prompt textual; áudio recebido continua drenando. |
| P2: benchmark terminando com falso sucesso | **Resolvido para os critérios solicitados**: amostragem insuficiente ou timeout de drenagem produzem código 1. |
| Portabilidade da fonte do benchmark | **Resolvida por configuração** com `F1_SOURCE_ROOT`; outros caminhos de laboratório continuam fixos em harnesses. |

A chegada do primeiro áudio cancela o watchdog. Confirmei isso em sonda offline: timer pendente `null`, espera por áudio `false`, apenas **1 envio**. Reprodução longa após o primeiro chunk não dispara esse timeout. Pensamento sem primeiro áudio por mais de 16 s gera aviso, sem cancelar a resposta nem reenviar o turno.

**Comandos e resultados efetivamente executados**

- `git rev-parse HEAD`: SHA exato acima. `git status --short`: vazio, inclusive ao final.
- `node --test tests/gemini-live-f1/capture-worklet.test.mjs tests/gemini-live-f1/telemetry.test.mjs`: código **0**; este ambiente apresentou **2 arquivos aprovados**.
- `node --test --test-isolation=none --test-reporter=tap tests/gemini-live-f1/capture-worklet.test.mjs tests/gemini-live-f1/telemetry.test.mjs`: **19 testes, 19 PASS, 0 FAIL**, código **0**.
- `node --check apps/gemini-live-studio/public/app.js`: código **0**.
- No diretório do PRF, `sha256sum -c PHASE-01-SOURCE-MANIFEST.sha256`: **28/28 OK**, código **0**.
- No mesmo diretório, `sha256sum -c PHASE-01-ARTIFACT-MANIFEST.sha256`: **37/37 OK**, código **0**.
- As primeiras chamadas dos manifests foram feitas na raiz e falharam por caminhos relativos; corrigido o diretório, ambos passaram integralmente.
- Sondas `node` via stdin, sem gravação: reprodução temporal descrita acima; cancelamento do watchdog; predicado do benchmark retornando **1 para 19/18**, **1 para 30/30 com drenagem incompleta**, **0 para 30/30 sem esse timeout**.
- Comparação SHA-256 das evidências: browser **5/5 fontes + 1/1 script**, microfone **2/2**, adversarial **2/2** vinculados ao conteúdo atual. Benchmark confirmado como pertencente ao app anterior.

Os arquivos indicados foram inspecionados com `cat`, `rg`, `nl` e `sed`. **Não executei testes conectados, captura de mídia, leitura de segredos/env ou alterações no repositório.**

As evidências documentadas mostram browser **17/17**, adversarial **3/3** e microfone físico de aproximadamente 60 s com **1.493 frames, 955.520 amostras e zero descartes do Worklet**. São resultados inspecionados, não reproduzidos nesta auditoria.

**Matriz de suficiência**

| Critério | Situação |
|---|---|
| F1.1 — captura e reamostragem | **Parcial**: 19/19 offline; P1 temporal aberto e caracterização espectral ainda limitada. |
| F1.2 — VAD e barge-in | **Parcial**: cobertura automatizada; falta diálogo supervisionado com headset por 30–60 s. |
| F1.3 — reprodução e filas | **Parcial**: correções coerentes; falta qualificação acústica integrada. |
| F1.4 — reconexão e estabilidade | **Parcial**: evidência de reconexão; execução de 632 s pertence a SHA anterior. |
| F1.5 — hardware e latência | **Insuficiente**: confirmação humana de saída é positiva; falta voz→som audível p95. |
| F1.6 — PRF, auditoria e gate | **Parcial**: integridade confirmada; esta auditoria retorna para correção e não decide gate LÉO. |

O benchmark permanece em **19 tentativas / 18 respostas**, com p50 **1.324 ms** e p95 **4.666 ms**, medindo texto→áudio agendado no código anterior. Não satisfaz 30 amostras nem mede voz→som audível.

Para F2, permanecem necessários: corrigir o P1, completar a cobertura de silêncio por voz, validar headset/barge-in e latência audível no candidato final, reconciliar **F0.8** e o risco da chave não rotacionada, e obter os gates exigidos. A próxima ação segura é corrigir a origem temporal e acrescentar regressões offline antes de nova rodada conectada autorizada.

Sem aprovação de merge, deploy ou release. Estado da qualificação: **AGUARDANDO_DEPENDENCIA_EXTERNA**.
