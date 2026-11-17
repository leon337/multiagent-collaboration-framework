# Auditoria EXTERNA independente do candidato anterior

Reviewed SHA: 3aa67ab3c899cbc2d8d87d3c61da74b9d42f8750
Executor: Codex CLI READ_ONLY sob contrato EMILY; NAO e Agent Session MCF nativa
Codex thread: 01a1e725-264d-7bd0-9d47-78a2efe44266
Parecer: RETURN_FOR_CORRECTION
Nao audita as alteracoes posteriores de ciclo 2 nem substitui gate LEO.

---

**Parecer: RETURN_FOR_CORRECTION para o candidato de engenharia. F1 não pode ser encerrada; a transição oficial para F2 não está permitida pelas evidências locais.**

Auditoria externa sob contrato EMILY, missão `MCF-GEMINI-LIVE-EVOLUTION-20261116-001`, Issue #527, PR #529. SHA auditado: `3aa67ab3c899cbc2d8d87d3c61da74b9d42f8750`. Thread: `01a1e725-264d-7bd0-9d47-78a2efe44266`. Esta execução não constitui Agent Session nativa MCF nem decisão de LÉO. GitHub não foi consultado, conforme proibição de rede.

**Achados**

- **MEDIUM — resposta já concluída pode gerar falso timeout.** A detecção local continua independente do recebimento e da conclusão da resposta. Reproduzi: energia de voz → áudio válido e ambos os terminais → 760 ms de silêncio → novo watchdog → falso `response_timeout`. O usuário recebe oferta de continuação mesmo após resposta recebida. Corrigir o vínculo entre o episódio de voz e sua resposta antes de armar o timer. Locais: [app.js:321](/tmp/mcf-f1-response-gate/apps/gemini-live-studio/public/app.js:321), [app.js:210](/tmp/mcf-f1-response-gate/apps/gemini-live-studio/public/app.js:210).

- **MEDIUM — eventos do turno anterior encerram o monitor do turno novo.** `pendingTurnSeq` protege callbacks antigos de timer, mas áudio e terminais recebidos não têm proteção equivalente. Reproduzi `voice → text → terminal anterior`: o texto perde seu watchdog e é contado como silencioso; áudio anterior também desarma o texto novo. Isso afeta especialmente a continuação manual enquanto uma resposta antiga ainda pode chegar. Exigir serialização ou reconciliação explícita dos turnos sobrepostos. Locais: [app.js:166](/tmp/mcf-f1-response-gate/apps/gemini-live-studio/public/app.js:166), [app.js:211](/tmp/mcf-f1-response-gate/apps/gemini-live-studio/public/app.js:211), [app.js:240](/tmp/mcf-f1-response-gate/apps/gemini-live-studio/public/app.js:240).

- **MEDIUM — “áudio válido” tem validação insuficiente.** O handler aceita qualquer MIME `audio/`; o decoder assume PCM16/24 kHz e trunca comprimento ímpar. Uma sonda com `audio/wav`, base64 válido e três bytes desarmou o watchdog e registrou o proxy. Validar formato, taxa e alinhamento antes desses efeitos. Base64 sintaticamente inválido permanece corretamente pendente. Locais: [app.js:209](/tmp/mcf-f1-response-gate/apps/gemini-live-studio/public/app.js:209), [app.js:236](/tmp/mcf-f1-response-gate/apps/gemini-live-studio/public/app.js:236).

- **LOW — recuperação permanece visível após áudio tardio.** Após terminal silencioso, `pendingPromptAudio=false`; áudio posterior não oculta o botão porque a limpeza está dentro desse predicado. Reproduzido com áudio válido. Locais: [app.js:211](/tmp/mcf-f1-response-gate/apps/gemini-live-studio/public/app.js:211), [app.js:240](/tmp/mcf-f1-response-gate/apps/gemini-live-studio/public/app.js:240).

- **HIGH para liberação da fase — qualificação física e governança incompletas.** Faltam 30 amostras voz→som ouvido, resposta audível de 30–60 s, comparação antes/depois, barge-in e eco em hardware, F0.8 e controles Classe C. A captura física tem Worklet compatível, mas app.js diferente; seu RMS máximo, `0,016582`, sequer alcançou o limiar local de fala `0,027`. Portanto, não valida o novo detector. Evidências: [captura:5](/tmp/mcf-f1-response-gate/artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-01/QA-F1-RESPONSE-20261116/REAL-MIC-60S.json:5), [relatório:23](/tmp/mcf-f1-response-gate/artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-01/QA-F1-RESPONSE-20261116/REPORT.md:23), [mission trace:18](/tmp/mcf-f1-response-gate/artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-01/PHASE-01-MISSION-TRACE.md:18).

**Verificações positivas e limites**

A fila de reprodução preserva a sequência monotônica e não é cancelada por `generationComplete`/`turnComplete`. Sonda local com três blocos, incluindo terminais entre eles: inícios `1,12 / 2,12 / 3,12 s`, 72.000 amostras agendadas e zero chamadas a `stop()`. Isso comprova agendamento nessa simulação, não audibilidade física.

O timer obsoleto foi corretamente rejeitado pela sequência. O fechamento do socket limpa a pendência; o disconnect explícito invalida a conexão e impede `stopMic()` de armar novo monitor. A continuação exige confirmação e envia um novo turno, sem replay automático.

A heurística RMS ainda precisa de calibração: um único frame acima do limiar inicia o episódio; energia intermediária não zera o silêncio acumulado; durante playback, a detecção de voz fica suspensa. Esses comportamentos não estão qualificados contra ruído, eco e barge-in reais.

A telemetria usa allowlist, buffer de 500 eventos e memória do navegador. O proxy está identificado como energético, sem equivalência acústica. O export solicitado pelo usuário inclui também transcrições e notas; a ausência de conteúdo pessoal vale para a telemetria, não para todo o JSON exportado. A rotação adiada da credencial continua pendência de segurança para exposição pública; não acessei credenciais ou `.private`.

**Testes e rastreabilidade**

Executados, todos com saída zero:

```text
git status --short
git rev-parse HEAD
node --test tests/gemini-live-f1/capture-worklet.test.mjs tests/gemini-live-f1/telemetry.test.mjs
node --test --test-isolation=none --test-reporter=tap tests/gemini-live-f1/capture-worklet.test.mjs tests/gemini-live-f1/telemetry.test.mjs
```

Resultado detalhado: **22/22 PASS**. No diretório `artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-01`:

```text
sha256sum -c PHASE-01-SOURCE-MANIFEST.sha256
sha256sum -c PHASE-01-ARTIFACT-MANIFEST.sha256
```

Resultado: **31/31 fontes e 50/50 artefatos OK**. Também executei sondas Node/VM via stdin, sem arquivos, para as corridas descritas.

Os JSON registram **10/10 navegador simulado** e **17/17 harness com API real**, vinculados aos hashes atuais. Não os reexecutei. A cobertura não inclui as corridas encontradas; o teste de `generationComplete` verifica contagem após limpar a fila, não preservação de áudio pendente ([harness:60](/tmp/mcf-f1-response-gate/tests/gemini-live-f1/browser-e2e.cjs:60)). Os hashes dos harnesses são calculados sobre arquivos em disco, sem comparação independente com os bytes servidos.

O histórico **19 tentativas/18 respostas** continua sendo evidência de uma falha não terminal anterior; o aviso não demonstra sua resolução. A confirmação humana do hotfix antigo não qualifica este candidato.

Recomendo corrigir os achados de engenharia, acrescentar regressões para essas sequências e reapresentar o SHA final. O checkpoint mantém `EM_CORRECAO`, F0.8 pendente e fase aberta ([checkpoint:10](/tmp/mcf-f1-response-gate/artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-01/PHASE-01-CHECKPOINT.yaml:10)); não há base local para liberar F1/F2.

`git status --short` vazio antes e depois; HEAD permaneceu no SHA solicitado. **Zero arquivos alterados. Parecer ENTREGUE.**
