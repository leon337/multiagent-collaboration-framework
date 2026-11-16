**Parecer: RETORNAR para fechamento de F1.4/F1.5.** As correções de A1–A3 estão presentes e são coerentes por inspeção; A4 continua parcialmente atendido. Os testes offline e os manifestos passaram.

Executor: **Codex, sessão EXTERNA sob o contrato de Emily**. Este parecer não constitui revisão oficial do runtime, sessão nativa MCF ou decisão de LÉO.

- **SHA confirmado:** `bef121c8755aceff80d302f8e90bc832665ddab3`.
- **ID da thread:** não disponibilizado pela interface desta execução; não foi inventado.
- Worktree limpo no início e na verificação final. Nenhum arquivo alterado, acesso de rede, leitura de credenciais ou captura de mídia.

**Matriz de remediação**

| Achado | Estado | Fundamentação |
|---|---|---|
| A1 — playback sem controle após close | **RESOLVIDO** | Stop e mute permanecem habilitados enquanto `sources.size > 0`, mesmo desconectado. |
| A2 — ausência de timeout | **RESOLVIDO** | Token limitado a 12 s; abertura/negociação limitadas a 15 s; callbacks obsoletos são invalidados. |
| A3 — reconexão flapping ilimitada | **RESOLVIDO** | Existe limite acumulado de seis agendamentos em janela móvel de 120 s, além de quatro falhas consecutivas. |
| A4 — hardware, longa duração e gate | **PARCIAL** | Há evidência de captura física e recuperação induzida. Faltam audição real, qualificação longa, continuidade semântica e requisitos restantes do gate. |

**Prova estática das correções**

Em [app.js:15](/tmp/mcf-f1-qa/pr529-bef/apps/gemini-live-studio/public/app.js:15), stop e mute consideram a existência de fontes agendadas. O `onclose` preserva essas fontes e atualiza os controles. Mute chama `clearPlay()`; desconexão também, interrompendo e desconectando as fontes. O último `onended` atualiza os botões quando a fila termina.

Quanto aos timers:

- O timeout do token é cancelado em `finally`, quando a operação resolve ou rejeita. `disconnect()` aborta a requisição; o cancelamento desse timer ocorre após a rejeição resultante.
- O watchdog é cancelado em `setupComplete`, fechamento corrente e desconexão explícita.
- Reconexão pendente é cancelada ao iniciar conexão e em `disconnect()`.
- GoAway anterior é cancelado ao substituí-lo, no fechamento e na desconexão.
- `connectionGeneration` e a identidade do socket impedem callbacks vencidos de restaurar a sessão.

Esses controles estão em [app.js:72](/tmp/mcf-f1-qa/pr529-bef/apps/gemini-live-studio/public/app.js:72) e [app.js:352](/tmp/mcf-f1-qa/pr529-bef/apps/gemini-live-studio/public/app.js:352). `generationComplete` conserva a sessão e o áudio pendente; não representa desconexão.

O cap está explícito em [app.js:51](/tmp/mcf-f1-qa/pr529-bef/apps/gemini-live-studio/public/app.js:51): filtra histórico por `120000` ms e recusa agendamento quando há seis entradas. `setupComplete` zera `retries`, mas preserva esse histórico.

**Evidência 4/4 e vínculo ao SHA — ressalva média**

O JSON registra quatro aprovações, compatíveis com o script inspecionado. Entretanto:

- O cenário de playback monta diretamente o estado desconectado; não percorre um fechamento real.
- O watchdog usa socket simulado que nunca abre.
- O orçamento simula sucessos zerando `retries`.
- Não há teste dedicado de cancelamento de todos os timers e callbacks tardios.

Esses quatro testes foram **inspecionados, não reexecutados**: o script abre browser, usa localhost, depende de instalação externa e grava fora do worktree.

Os manifestos íntegros comprovam os bytes anexados, mas **não comprovam qual código o staging executou**. Os JSONs novos, inclusive o 4/4, não registram SHA do commit nem hashes das fontes servidas e do executor.

Há também evidências antigas incompatíveis com as fontes atuais:

- Browser e playback registram `app.js` com hash `da7d001e…`; o atual é `7b41ed8a…`.
- O adversarial registra `fcd65c46…`.
- O browser também registra hash anterior de `telemetry.js`.

Logo, essas aprovações históricas não qualificam integralmente este SHA.

**Hardware, diagnóstico e sanitização**

Os JSONs examinados não contêm chave, token, PCM, transcrição ou conteúdo de fala. A telemetria usa allowlist de eventos e campos numéricos/modelo. A sanitização é adequada quanto a conteúdo e segredos, embora os físicos conservem hostname e nomes técnicos de dispositivos.

A captura física registra 32.000 amostras no probe e 64 frames/40.960 amostras no browser. Isso sustenta atividade de entrada. **Não demonstra diálogo por voz nem resposta audível.**

Ambos os monitores de saída registram **zero amostras**. `paplay_exit=0` demonstra sucesso do comando, sem comprovar sinal monitorado ou audição humana. A ressalva genérica do JSON sobre “signal proves delivery” não pode ser aplicada a essa captura vazia.

O diagnóstico registra seis critérios de conclusão satisfeitos, porém apenas cinco primeiros áudios; o turno 2 tem `first_audio_ms=null`. A recuperação induzida registra reconexão e presença de handle, sem comprovar preservação semântica.

A evidência longa terminal não está anexada. Nenhuma conclusão favorável sobre ela foi feita.

**Achados adicionais**

**Médio — cancelamento indisponível durante backoff sem áudio.** Após close com fila vazia, `setButtons(false)` desabilita stop. `scheduleReconnect()` mantém a intenção de conexão e agenda nova tentativa sem reabilitá-lo. O usuário fica sem cancelamento pela interface nesse intervalo. Recomendo manter stop disponível enquanto houver conexão desejada ou recuperação pendente.

**Médio — possível atribuição de conclusão ao turno errado.** O [diagnóstico:35](/tmp/mcf-f1-qa/pr529-bef/tests/gemini-live-f1/reliability-diagnostic.cjs:35) aceita incremento global de `generationComplete` **ou** `turnComplete`, sem correlação por turno. Um `turnComplete` tardio do anterior pode satisfazer o seguinte. O turno sem primeiro áudio torna essa ambiguidade relevante; não comprova que isso ocorreu. Recomendo correlacionar envio e eventos e distinguir geração concluída, turno concluído e reprodução drenada.

**Nenhum novo alto confirmado.** A insuficiência de A4 continua impeditiva para fechamento. Permanecem as ressalvas anteriores sobre filas, antialias e métricas de voz/custo.

**Comandos efetivamente executados**

Validações:

```bash
git status --short --branch
git status --porcelain=v2 --branch
node --test --test-isolation=none --test-reporter=tap tests/gemini-live-f1/capture-worklet.test.mjs tests/gemini-live-f1/telemetry.test.mjs
```

No diretório `artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-01`:

```bash
sha256sum -c PHASE-01-SOURCE-MANIFEST.sha256
sha256sum -c PHASE-01-ARTIFACT-MANIFEST.sha256
```

Resultados: **12/12 testes**, **23/23 entradas SOURCE** e **19/19 entradas ARTIFACT**, todos com exit 0.

As leituras usaram `pwd`, `rg --files`, `rg -n`, `cat`, `nl -ba` e `sed -n` nos contratos, roadmap, implementação, testes e PRF citados. A tentativa `cat .git/HEAD` falhou porque `.git` não é diretório; o SHA foi confirmado por `git status --porcelain=v2 --branch`, sem seguir caminhos externos.

**Recomendação ao gate LÉO**

Reconhecer A1–A3 como remediados por inspeção, com evidência anexada compatível, mantendo F1.4/F1.5 abertas. Antes do fechamento: sanar ou aceitar formalmente os médios; vincular novas execuções às fontes efetivamente servidas; comprovar saída audível e interação física; anexar sessão longa terminal com retomada contextual e GoAway; completar benchmark e reconciliar F0.8.

**Veredito: RETORNAR. Parecer externo ENTREGUE; gate não aplicado.**
