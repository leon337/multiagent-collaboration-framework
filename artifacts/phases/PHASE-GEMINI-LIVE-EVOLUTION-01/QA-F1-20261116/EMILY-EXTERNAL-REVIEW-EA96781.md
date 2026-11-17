**Parecer Emily-profile EXTERNO: RETORNAR_PARA_CORRECAO.** A implementação tem validação parcial consistente, mas não há evidência suficiente para concluir F1. Há falhas reproduzíveis de controle do playback e recuperação de conexão, além dos requisitos físicos e de longa duração ainda pendentes.

**1. Executor, escopo e resultados**

Executor: **Codex CLI, revisor externo**, aplicando o contrato normativo de Emily. Esta execução não constitui sessão nativa/autenticada de Emily nem decisão de LÉO.

Commit auditado: `ea96781d7897b67f7d2b1f546a96a71fa45614e4`.

Foram lidos os contratos solicitados, roadmap, PRF, manifestos, incidente, implementação, testes e workflow. Toda execução foi local e offline, sem escrita, rede, credenciais, captura de mídia ou browser. O worktree permaneceu limpo e o HEAD não mudou. Estados de GitHub, CI e PRs **não foram consultados**; referências a esses estados são declarações documentais locais.

Comandos efetivamente executados e resultados relevantes:

| Comando | Resultado |
|---|---|
| `git rev-parse HEAD`; `git status --short` | SHA acima; worktree limpo no início e no fim |
| `node --version` | `v24.22.2` |
| `node --test tests/gemini-live-f1/capture-worklet.test.mjs tests/gemini-live-f1/telemetry.test.mjs` | Exit 0; resumo de dois arquivos aprovados |
| Mesmo comando com `--test-reporter=tap` | Exit 0; dois arquivos aprovados |
| Mesmo comando com `--test-isolation=none --test-reporter=tap` | **12 testes aprovados, zero falhas** |
| `node --check` em `app.js`, `capture-worklet.js` e `telemetry.js` | Exit 0 |
| `sha256sum -c PHASE-01-SOURCE-MANIFEST.sha256` | **17/17 entradas OK** |
| `sha256sum -c PHASE-01-ARTIFACT-MANIFEST.sha256` | **10/10 entradas OK** |
| `node` via heredoc, usando `fs`/`vm` e dependências simuladas | Sondagens de fechamento, negociação, reconexão, resampling e vínculo dos hashes |

SHA-256 dos manifestos:

```text
SOURCE:   6fbbbe22c5fbee745c3b11eed82a615a99c23d4237435a0cd4c019cf9ca78e9f
ARTIFACT: cbae5f86ff3c1947beb66569aece82344330ca418df66eb246f8a31ba56ff940
```

Os testes de browser e provedor foram **inspecionados, não reexecutados**.

**2. Achados classificados**

**CRÍTICO — nenhum confirmado neste recorte.**

**ALTO — A1. Fechamento definitivo deixa áudio pendente sem controles disponíveis na interface.**
O `onclose` preserva os buffers e chama `setButtons(false)`, que desabilita tanto mute quanto desconexão. Em fechamento não recuperável, `wantConnected` também se torna falso. A sondagem offline reproduziu:

```text
queuedSources=1
disconnectDisabled=true
muteDisabled=true
connected=false
wantConnected=false
```

Preservar fala recebida corrige o truncamento anterior, mas o usuário precisa continuar podendo interrompê-la. Referências: [app.js:15](/tmp/mcf-f1-qa/pr529/apps/gemini-live-studio/public/app.js:15), [app.js:98](/tmp/mcf-f1-qa/pr529/apps/gemini-live-studio/public/app.js:98), [app.js:209](/tmp/mcf-f1-qa/pr529/apps/gemini-live-studio/public/app.js:209).

**Exigência:** manter cancelamento acessível enquanto houver áudio pendente, inclusive após falha definitiva e durante reconexão; cobrir o cenário por regressão.

**ALTO — A2. Conexão e negociação não possuem prazo de expiração.**
A obtenção de token tem cancelamento manual, mas não timeout. Também não há watchdog para WebSocket que não abre ou servidor que não envia `setupComplete`. A sondagem após obtenção do token, sem completar negociação, mostrou `connecting=true` e **zero timers de watchdog**. A sessão pode permanecer indefinidamente em negociação sem acionar recuperação. Referência: [app.js:61](/tmp/mcf-f1-qa/pr529/apps/gemini-live-studio/public/app.js:61).

**Exigência:** definir prazos para token, abertura e setup; invalidar callbacks vencidos, liberar recursos e aplicar recuperação limitada.

**ALTO — A3. O limite de reconexões não limita ciclos de instabilidade após setup.**
`scheduleReconnect` limita falhas consecutivas, mas cada `setupComplete` zera `retries`. Uma conexão que negocia e cai repetidamente pode renovar tokens e sockets indefinidamente. A sondagem completou seis ciclos com seis agendamentos, `retries=0` e `wantConnected=true`. Referências: [app.js:49](/tmp/mcf-f1-qa/pr529/apps/gemini-live-studio/public/app.js:49), [app.js:123](/tmp/mcf-f1-qa/pr529/apps/gemini-live-studio/public/app.js:123).

**Exigência:** adicionar limite acumulado por janela ou orçamento de recuperação; reiniciar o contador somente após estabilidade comprovada, com estado terminal explícito.

**ALTO — A4. Requisitos obrigatórios do gate F1 permanecem sem evidência.**
O roadmap exige hardware real, falhas induzidas, comparação antes/depois e sessão longa. O checkpoint declara explicitamente ausência de áudio físico, sessão longa, GoAway real e comprovação semântica da retomada. Isso impede concluir confiabilidade F1, independentemente dos testes unitários aprovados. Referências: [ROADMAP.md:56](/tmp/mcf-f1-qa/pr529/docs/missions/gemini-live-evolution-20261116/ROADMAP.md:56), [PHASE-01-CHECKPOINT.yaml:37](/tmp/mcf-f1-qa/pr529/artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-01/PHASE-01-CHECKPOINT.yaml:37).

**MÉDIO — M1. As filas ainda não oferecem garantia demonstrada de latência e recursos limitados.**
O worklet publica frames continuamente, sem timestamp, confirmação de consumo ou limite de mensagens pendentes. O controle de `bufferedAmount` acontece depois, na thread principal: ele não limita o backlog do `MessagePort` durante travamento da UI. Na saída, a fila aceita crescimento e apenas emite aviso acima de 12 segundos.

São riscos identificados por inspeção, sem reprodução de exaustão nesta execução. Referências: [capture-worklet.js:27](/tmp/mcf-f1-qa/pr529/apps/gemini-live-studio/public/capture-worklet.js:27), [app.js:17](/tmp/mcf-f1-qa/pr529/apps/gemini-live-studio/public/app.js:17), [app.js:180](/tmp/mcf-f1-qa/pr529/apps/gemini-live-studio/public/app.js:180).

**Exigência:** medir idade e profundidade dos frames, testar bloqueio prolongado da UI e definir comportamento limitado para sobrecarga, preservando cancelamento e evitando truncamento silencioso.

**MÉDIO — M2. Resampling sem filtro antialias.**
A interpolação linear não remove frequências acima de 8 kHz antes da redução para 16 kHz. Uma sondagem com seno de 12 kHz a 48 kHz produziu 16.000 amostras com RMS ≈ `0,35355`, compatível com alias em 4 kHz praticamente sem atenuação. Os unitários atuais verificam DC e seno de 1 kHz, sem cobertura espectral. Referência: [capture-worklet.js:39](/tmp/mcf-f1-qa/pr529/apps/gemini-live-studio/public/capture-worklet.js:39).

**Exigência:** filtrar antes da decimação e verificar rejeição espectral em 44,1/48 kHz.

**MÉDIO — M3. Telemetria não demonstra latência de resposta por voz nem custo/p95 estável.**
`first_audio` usa o timestamp de `sendPrompt`, portanto mede o caminho textual, não fim da fala→primeiro áudio. É registrado antes do início efetivo da reprodução. A janela compartilhada de 500 eventos também pode expulsar amostras e contadores durante streaming. Falta estimativa de custo por uso classificado e correlação por sessão/turno. Referências: [app.js:169](/tmp/mcf-f1-qa/pr529/apps/gemini-live-studio/public/app.js:169), [app.js:332](/tmp/mcf-f1-qa/pr529/apps/gemini-live-studio/public/app.js:332), [telemetry.js:19](/tmp/mcf-f1-qa/pr529/apps/gemini-live-studio/public/telemetry.js:19).

**MÉDIO — M4. Integridade dos arquivos não equivale a qualificação integral do HEAD.**

- O browser 17/17 e a regressão de playback vinculam `app.js` ao hash atual.
- O adversarial 6/6 registra **outro hash de `app.js`**.
- Os dois drains não registram hash de fonte/script; o drain “25” nem identifica o modelo no JSON.
- O incidente informa corretamente que os drains antecederam a última alteração de `onclose`.

Referências: [EVIDENCE-F1-ADVERSARIAL.json:5](/tmp/mcf-f1-qa/pr529/artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-01/EVIDENCE-F1-ADVERSARIAL.json:5), [audio-drain.cjs:10](/tmp/mcf-f1-qa/pr529/tests/gemini-live-f1/audio-drain.cjs:10), [PHASE-01-AUDIO-INCIDENT.md:36](/tmp/mcf-f1-qa/pr529/artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-01/PHASE-01-AUDIO-INCIDENT.md:36).

**BAIXO — B1. PRF conserva resultados superados sem separação inequívoca.**
O smoke ainda apresenta descarte acima de 1,6 s como PASS; a validação expandida conserva o caso antigo de fila limitada. As notas finais explicam a substituição, mas o leitor encontra critérios incompatíveis no mesmo pacote. Referências: [PHASE-01-SMOKE.txt:8](/tmp/mcf-f1-qa/pr529/artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-01/PHASE-01-SMOKE.txt:8), [PHASE-01-VALIDATION-FULL.txt:13](/tmp/mcf-f1-qa/pr529/artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-01/PHASE-01-VALIDATION-FULL.txt:13).

**3. Matriz de suficiência**

| Item | Parecer | Evidência e bloqueios |
|---|---|---|
| **F1.1 — Captura/resampling** | **PARCIAL** | Seis unitários aprovados; geração e cleanup protegem inicialização do mic. Faltam antialias e qualificação sob atraso da UI/hardware. |
| **F1.2 — VAD/barge-in/cancelamento** | **PARCIAL** | Cancelamento por `interrupted`, mute e desconexão implementado; VAD congelado por sessão. A1 bloqueia controle após falha; eco e interrupção física não qualificados. |
| **F1.3 — Playback/turnos** | **PARCIAL** | Evidência de timeline monotônica e remoção do descarte destrutivo. Faltam limites operacionais, audição física e reconciliação semântica de resposta/turnos. |
| **F1.4 — Resiliência** | **PARCIAL** | Handle e reconexão registrados. A2/A3 pendentes; sem sessão longa, GoAway real ou continuidade contextual comprovada. |
| **F1.5 — Hardware/benchmark** | **INSUFICIENTE** | Sem microfone/alto-falante reais, comparação antes/depois, latência de voz robusta ou custo medido. |
| **F1.6 — PRF/auditoria/gate** | **PARCIAL** | Manifestos íntegros e este parecer externo entregue. Persistem divergências documentais, cobertura anterior ao HEAD e gates formais pendentes. |

O teste “sem duplicação” compara quantidade de entradas visuais do usuário; não comprova deduplicação no provedor. GoAway verifica contador injetado e encerra logo depois. Os drains comprovam callbacks e agendamento, sem validar conteúdo falado, inteligibilidade ou conclusão da frase solicitada. Referências: [browser-e2e.cjs:95](/tmp/mcf-f1-qa/pr529/tests/gemini-live-f1/browser-e2e.cjs:95), [audio-drain.cjs:55](/tmp/mcf-f1-qa/pr529/tests/gemini-live-f1/audio-drain.cjs:55).

O [workflow:23](/tmp/mcf-f1-qa/pr529/.github/workflows/mcf-gemini-live-f1.yml:23) executa unitários, sintaxe, scanner e manifestos. **Não executa browser, hardware ou sessões longas.**

**4. Decisão exclusivamente auditiva**

**RETORNAR_PARA_CORRECAO.** Os resultados sustentam uma implementação experimental parcialmente validada. Não sustentam fechamento F1, aprovação de hardware ou confiabilidade prolongada.

O cancelamento por interrupção existe e as antigas corridas de mic/socket receberam correções verificáveis por inspeção. Entretanto, A1–A3 exigem remediação; A4 exige evidência real. O checkpoint local também mantém F0 em correção e F0.8 pendente. Não há base nesta auditoria para superar esses gates.

**5. Exigências para submissão ao gate delegado de LÉO**

1. Corrigir A1–A3 e apresentar regressões no SHA candidato final: cancelamento após falha definitiva, timeout de token/open/setup e limite de reconexão sob instabilidade recorrente.
2. Resolver M1–M4 ou registrar plano e aceitação formal aplicável para os médios; reconciliar os documentos superados.
3. Reexecutar as regressões relevantes no SHA final, registrando fonte, script, modelo, ambiente, horários, resultados e limitações. Vincular os drains ao código realmente executado.
4. Produzir QA autorizado com mic/alto-falante reais: resposta a entrada por voz, integridade audível, eco, barge-in, mute, desligamento e cancelamento durante recuperação.
5. Produzir sessão longa de **10+ minutos**, incluindo compressão, retomada contextual verificável, falhas de rede e ciclo completo de GoAway. Distinguir eventos reais de injeções.
6. Apresentar baseline e comparação antes/depois, tamanho da amostra, p50/p95 de fim da fala→primeiro áudio reproduzido, underruns, cortes, reconexões e custo estimado com premissas explícitas.
7. Reconciliar F0/F0.8 e obter os pareceres/receipts exigidos pelos contratos. Este parecer externo pode compor o pacote, sem ser apresentado como autenticação de Emily.
8. LÉO deverá registrar sua própria decisão, justificativa, próximo estado, próxima ação e responsável, vinculados ao SHA final. Merge, deploy e exposição pública permanecem sujeitos às autorizações aplicáveis.

**Entrega desta auditoria: ENTREGUE. Fase F1: suficiência não aprovada; retorno recomendado ao MESTRE para correção e qualificação.**
