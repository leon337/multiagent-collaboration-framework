# F1.6 - Gate externo Codex CLI usando perfil normativo LEO

Missao: MCF-GEMINI-LIVE-EVOLUTION-20261116-001
Reviewed SHA: 361a08b730b24b7fe0ba88e5917634dd3a947d64
Codex thread: 01a1e697-23c5-7af1-a68f-05d56083e38c
Executor: CODEX_CLI_EXTERNAL_LEO_PROFILE
Native authenticated MCF Agent Session: FALSE
Authorization: explicit request from LEANDRO
Execution: read-only; exit 0
Decision: RETORNAR_PARA_CORRECAO
Next state: EM_CORRECAO
No merge, no deploy, no production approval

---

**1. Identidade do executor Codex CLI externo**

Executor distinto **Codex CLI externo, sob perfil normativo LÉO**, autorizado por LEANDRO e coordenado por MESTRE. Esta execução não constitui Agent Session nativa autenticada do MCF.

- **Missão:** `MCF-GEMINI-LIVE-EVOLUTION-20261116-001`
- **Fase:** `PHASE-01-AUDIO-RELIABILITY`
- **SHA revisado:** `361a08b730b24b7fe0ba88e5917634dd3a947d64`
- **Thread:** `01a1e697-23c5-7af1-a68f-05d56083e38c`, obtida de `CODEX_THREAD_ID`.
- **Escopo:** recomendação de gate interno Classe C, somente leitura.

Li integralmente [LEO.md](/tmp/mcf-f1-qa/pr529-gate/docs/agentes/LEO.md), DEC-017, DEC-050, protocolo operacional unificado, contrato Emily, roadmap, PRF, auditorias externas, evidências QA, implementação e testes indicados.

Comandos efetivamente utilizados:

| Comandos | Saída relevante |
|---|---|
| `pwd`; `git rev-parse HEAD`; `git status --short` | Diretório correto, SHA solicitado e nenhuma alteração, no início e no fim |
| `rg --files`, `rg -n`, `cat`, `sed -n`, `nl -ba`, `wc -l` | Descoberta e leitura dos contratos, fontes, testes e evidências |
| `node --version` | `v24.22.2` |
| `node --test --test-isolation=none --test-reporter=tap tests/gemini-live-f1/capture-worklet.test.mjs tests/gemini-live-f1/telemetry.test.mjs` | **12 testes aprovados, zero falhas; exit 0** |
| `node --check` em `app.js`, `capture-worklet.js` e `telemetry.js` | Todos exit 0 |
| `sha256sum -c PHASE-01-SOURCE-MANIFEST.sha256` | **24/24 OK; exit 0** |
| `sha256sum -c PHASE-01-ARTIFACT-MANIFEST.sha256` | **26/26 OK; exit 0** |
| `node` via heredoc, com `fs`/`crypto` | Conferência dos JSONs, contagens e vínculos de hashes descritos abaixo |
| `git diff bef121c8755aceff80d302f8e90bc832665ddab3 HEAD -- apps/gemini-live-studio/public/app.js` | Uma linha alterada: disponibilidade de stop enquanto `wantConnected` |
| `git show bef121c8755aceff80d302f8e90bc832665ddab3:apps/gemini-live-studio/public/app.js \| sha256sum` | Hash anterior coincide com o registrado no teste longo |

Não executei rede, browser, captura física, leitura de credenciais, escrita, merge ou deploy. Os resultados conectados abaixo são **evidências anexadas inspecionadas**, não testes reexecutados nesta thread.

O estado de GitHub/CI foi informado pelo MESTRE: Issue #527 aberta, F0.8 e F1.1–F1.6 desmarcadas; PRs #528/#529 draft, sem merge; `f1-audio` PASS. Não o consultei novamente. O rate limit da Vercel não caracteriza falha de áudio nem autoriza produção.

**2. Contrato F1.1–F1.6**

| Item | Suficiência | Evidência concreta e limite |
|---|---|---|
| **F1.1 — Captura/resampling** | **PARCIAL** | Seis testes offline de captura passaram nesta execução. O [probe físico do browser](/tmp/mcf-f1-qa/pr529-gate/artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-01/QA-F1-20261116/EVIDENCE-PHYSICAL-BROWSER.json) registra 64 frames/40.960 amostras. Faltam filtro/qualificação antialias e limite demonstrado do backlog do MessagePort. |
| **F1.2 — VAD/barge-in/cancelamento** | **PARCIAL** | [Browser atual](/tmp/mcf-f1-qa/pr529-gate/artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-01/QA-F1-20261116/EVIDENCE-BROWSER-E2E-CURRENT.json) registra VAD e interrupção sintéticos. [Adversariais finais](/tmp/mcf-f1-qa/pr529-gate/artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-01/QA-F1-20261116/EVIDENCE-HIGH-FIXES-5.json) registram 5/5, incluindo cancelamento durante backoff. Faltam voz humana natural, eco e calibração física. |
| **F1.3 — Playback/turnos** | **PARCIAL** | [Playback sintético](/tmp/mcf-f1-qa/pr529-gate/artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-01/EVIDENCE-F1-PLAYBACK-REGRESSION.json): 8/8, 200 chunks/20 segundos sem sobreposição ou truncamento no modelo simulado. Os drains registram 41,48 s e 37,68 s de respostas reais em saída virtual. Não comprovam audição física, inteligibilidade ou limites de fila sob sobrecarga. |
| **F1.4 — Resiliência/sessão longa** | **PARCIAL** | [Sessão longa](/tmp/mcf-f1-qa/pr529-gate/artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-01/QA-F1-20261116/EVIDENCE-LONG-SESSION.json): 632 s, compressão/retomada habilitadas, dez turnos concluídos, um GoAway genuíno e uma reconexão bem-sucedida. Nove underruns numéricos. O código testado antecede a correção final. A [retomada semântica](/tmp/mcf-f1-qa/pr529-gate/artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-01/QA-F1-20261116/EVIDENCE-SEMANTIC-RESUME.json) confirma somente um caso de palavra fictícia. |
| **F1.5 — Hardware/benchmark** | **INSUFICIENTE** | Entrada física comprovada: PipeWire com 32.000 amostras e Worklet com 40.960. [Saída física](/tmp/mcf-f1-qa/pr529-gate/artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-01/QA-F1-20261116/EVIDENCE-SPEAKER-MONITOR.json): `paplay_exit=0`, porém **zero amostras monitoradas**. Faltam audição humana, diálogo físico, comparação antes/depois e p50/p95 do fim da fala ao primeiro áudio efetivamente reproduzido. |
| **F1.6 — PRF/regressão/auditoria/gate** | **PARCIAL** | Manifestos íntegros; duas revisões Emily-profile externas; este parecer LÉO-profile externo. A [revisão inicial](/tmp/mcf-f1-qa/pr529-gate/artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-01/QA-F1-20261116/EMILY-EXTERNAL-REVIEW-EA96781.md) retornou A1–A4; a [revisão seguinte](/tmp/mcf-f1-qa/pr529-gate/artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-01/QA-F1-20261116/EMILY-EXTERNAL-REREVIEW-BEF121C.md) reconheceu A1–A3 resolvidos e manteve A4 parcial. Persistem requisitos de aceite, inconsistências documentais e entregas de controle Classe C pendentes. |

Conferi os vínculos atuais: browser **17/17**, com cinco hashes de fontes e hash do harness correspondentes; playback **8/8**, com os dois hashes registrados correspondentes; adversariais finais **5/5**, com hashes de aplicação e harness correspondentes.

**3. Inventário de riscos e dependências obrigatórias**

**Altos — impedem fechamento/promoção:**

1. **Aceite físico e benchmark incompletos — A4 permanece parcial.** Captura de sinal físico não comprova conversa por voz. Saída audível, integridade da fala, eco, barge-in natural e comparação antes/depois continuam sem evidência. A sessão longa resolveu parte importante da lacuna anterior, sem resolver esses requisitos.

2. **Governança Classe C incompleta.** O [mission trace](/tmp/mcf-f1-qa/pr529-gate/artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-01/PHASE-01-MISSION-TRACE.md:18) declara artefatos dos agentes de controle incompletos. Devem existir contribuições reais e rastreáveis de Augusto, Júlia, Miriam e Beatriz conforme os gatilhos normativos; não podem ser substituídas por atribuição retrospectiva. As revisões externas são contribuições válidas no escopo autorizado, sem autenticar sessões nativas.

3. **Credencial anteriormente compartilhada permanece risco aberto.** LEANDRO adiou sua rotação; isso não constitui remediação nem dispensa para produção. Nenhuma credencial foi acessada nesta execução.

**Médios — exigem correção ou plano/aceitação formal aplicável:**

4. **Vínculo parcial da qualificação longa ao candidato.** O hash de `app.js` testado por 632 segundos foi:

   ```text
   7b41ed8a2c94e7d11f6e7edfdd8e55fa41b26ce74d42c2ec5f953b05f2d6483b
   ```

   O candidato final contém:

   ```text
   11666aabc15b690c560d0e72b33d34dd7386e839c6eab16371db55e712296eeb
   ```

   Confirmei que a diferença desde `bef121c` é a linha de controle do stop. O reteste direcionado sustenta essa correção, mas **não equivale a uma execução longa do candidato final**. Os drains antigos também não registram hashes de fonte; o JSON “25” não identifica o modelo.

5. **Filas e qualidade espectral.** O worklet publica continuamente sem controle demonstrado de mensagens pendentes. O playback preserva fala e avisa sobre fila longa, mas não demonstra limite operacional. O resampling usa interpolação linear sem filtro antialias. São pendências mantidas por inspeção e auditoria anterior.

6. **Métricas e atribuição de turnos.** A telemetria atual mede envio textual→recebimento de áudio, antes da reprodução. Não demonstra fim da fala→primeiro som. A janela de 500 eventos pode perder histórico. Não há custo por modalidade nem amostra robusta de 30+ medições. O diagnóstico registra seis sinais terminais, mas apenas cinco primeiros áudios; contadores globais não eliminam atribuição de evento tardio ao turno seguinte.

7. **Nove underruns e compatibilidade limitada.** Os contadores exigem investigação, sem provar nove falhas audíveis. O ensaio longo qualifica uma configuração Gemini 2.5 com prompts textuais espaçados; não demonstra estabilidade equivalente de todos os modelos ou streaming físico contínuo.

8. **PRF contraditório.** O checkpoint conserva `long_10min: PASS_632_SECONDS` junto de `long_sessions: NOT_TESTED`, além de estados incompatíveis de GoAway e captura física. Smoke/validação conservam resultados superados e referências `qa/`. Integridade criptográfica não resolve contradições de conteúdo.

**Dependência separada: F0.8.** Permanece pendente. A autorização explícita permite continuar trabalho interno reversível de F1, conforme o plano; não aprova F0 nem supera seu gate. Não cabe marcar F1 `ENTREGUE` ou promover F2 com os critérios e gates atuais incompletos.

A1–A3 estão remediados por inspeção, coerentes com a segunda auditoria. A correção posterior de stop durante backoff está presente e possui evidência direcionada 5/5. Não os mantenho como altos abertos.

O ensaio inicial de 180 segundos contou apenas `generationComplete`; seus 2/3 não demonstram taxa de falha do provedor. O diagnóstico posterior aceita `generationComplete` ou `turnComplete`, com as limitações de correlação acima. A recuperação de uma palavra fictícia após reconexão não constitui garantia universal de memória.

**4. GATE LÉO-PERFIL**

```yaml
decision: RETORNAR_PARA_CORRECAO
justification: >-
  Há progresso técnico verificável, A1-A3 remediados, cancelamento de
  backoff corrigido e evidência real de GoAway/reconexão em 632 segundos.
  Permanecem incompletos o aceite físico, o benchmark de voz, as entregas
  de controle Classe C e a reconciliação do PRF. O teste longo antecede
  a alteração final de app.js. CI verde não satisfaz esses critérios.
next_state: EM_CORRECAO
next_action: >-
  Continuar a remediação interna reversível de F1, completar qualificação
  e governança, reconciliar F0.8 separadamente e reapresentar o pacote
  no SHA final, sem marcar F1 ENTREGUE nem promover F2.
responsible: MESTRE
reviewed_sha: "361a08b730b24b7fe0ba88e5917634dd3a947d64"
executor_type: CODEX_CLI_EXTERNAL_LEO_PROFILE
native_mcf_agent_session: false
human_action_required: >-
  Não para continuidade interna ou correções rotineiras. A qualificação
  física requer participante humano para audição e interação natural.
  Rotação da chave segue a decisão reservada vigente de LEANDRO;
  produção permanece sem autorização.
required_evidence_for_reconsideration:
  - >-
    QA físico supervisionado: voz pelo microfone, resposta audível,
    integridade, eco, barge-in, mute, stop e cancelamento em recuperação.
  - >-
    Benchmark antes/depois com definição dos eventos, ambiente,
    amostragem justificada, p50/p95 de fim da fala a primeiro áudio
    reproduzido, underruns, cortes, erros e custo por modalidade.
  - >-
    Qualificação longa vinculada ao candidato final e fontes executadas;
    distinguir GoAway real, falhas induzidas, retomada e cleanup.
  - >-
    Correção ou plano e aceitação formal dos médios sobre filas,
    antialias, correlação de turnos, métricas e compatibilidade.
  - >-
    PRF/checkpoint reconciliados, manifestos atualizados e contribuições
    reais dos controles Classe C aplicáveis.
  - >-
    Reavaliação independente das pendências e novo parecer de gate
    vinculado ao SHA final, preservando a identidade externa dos receipts.
  - >-
    Reconciliação documentada de F0.8 antes do fechamento/promoção;
    tratamento da credencial antes de eventual liberação.
```

**5. Entrega/handoff para MESTRE**

**Entrega:** parecer externo concluído nesta resposta, vinculado ao SHA e à thread acima. Nenhum estado oficial do runtime, arquivo, Issue ou PR foi alterado.

**Passagem:** Codex CLI externo LÉO-perfil → **MESTRE**, para a missão e fase identificadas. Estado recomendado de F1: `EM_CORRECAO`.

**Próxima ação segura:** reconciliar checkpoint/PRF e organizar as correções e evidências faltantes, preservando os resultados já comprovados. A continuidade interna está permitida no escopo autorizado; não exige confirmação humana rotineira.

**STOP desta execução externa. Sem merge, push, deploy, aprovação de F0, fechamento oficial de gate nativo ou promoção para F2.**
