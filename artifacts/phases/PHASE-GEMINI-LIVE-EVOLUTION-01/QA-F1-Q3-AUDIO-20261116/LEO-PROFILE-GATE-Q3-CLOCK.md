# F1 gate - external Codex CLI under normative LÉO profile

Reviewed code+evidence commit: c6f85b083837b297bd1bf04cba0e6582c5861afe
Codex thread: 01a1e6e0-7292-71b1-8ff2-738d098e268c
Decision: RETORNAR_PARA_CORRECAO
Executor_type: CODEX_CLI_EXTERNAL_LEO_PROFILE
Native authenticated MCF Agent Session: FALSE
Scope: read-only, no merge/deploy
F0.8 state: OPEN
User shared key: rotation previously postponed; no production/public exposure approval

---

**Decisão externa: RETORNAR_PARA_CORRECAO. F1 não fecha; F2 não inicia formalmente.** A correção do clock está sustentada, mas permanecem critérios de aceite e dependências obrigatórias.

Atuei como **Codex CLI externo aplicando o perfil normativo LEO**, conforme autorização informada. Esta execução não autentica identidade de agente nativo MCF. Não usei rede, credenciais ou captura de mídia; não alterei arquivos nem GitHub. O estado remoto de PRs/Issue não foi verificado.

Verificações efetivamente executadas:

| Verificação | Resultado |
|---|---|
| `git rev-parse HEAD` | `c6f85b083837b297bd1bf04cba0e6582c5861afe` |
| `git status --short`, início e fim | Árvore limpa |
| `node --test --test-isolation=none --test-reporter=tap …` | **20/20 PASS**, zero falhas |
| `sha256sum -c`, no diretório PRF | **29/29 fontes + 43/43 artefatos OK** |
| Sintaxe de `app.js`, Worklet e telemetria | PASS |
| Hashes do E2E final | **5 fontes + harness correspondem** |
| Hashes da integração do clock | **App + Worklet correspondem** |

Os **17/17 E2E com Gemini real e mídia virtual** e a integração Chrome com microfone real foram inspecionados como evidências existentes, sem reexecução conectada.

O [Worklet](/tmp/mcf-f1-qa/f1-gate-c6f85b/apps/gemini-live-studio/public/capture-worklet.js:77) usa `currentTime` do contexto mais deslocamento da amostra, compatível com a comparação em [processAudioFrame](/tmp/mcf-f1-qa/f1-gate-c6f85b/apps/gemini-live-studio/public/app.js:270). A integração registrada injeta **650 ms** de atraso e observa **60 frames, zero descartes stale e zero perdas por créditos**.

Também executei uma sonda em memória com essas duas funções atuais: início atrasado encaminhou 60 frames sem perdas; bloqueio simulado de 600 ms rejeitou três pacotes antigos, contabilizou 11 frames perdidos e retomou envios frescos. Isso sustenta o tratamento temporal, sem demonstrar áudio sem perdas. A primeira sonda esperava um frame completo antes de compensar o atraso FIR; ajustada sua duração, passou. Não foi falha do produto.

A matriz de suficiência permanece:

| Item | Resultado | Evidência e limite |
|---|---|---|
| **F1.1 — Captura/resampling** | **PARCIAL** | Clock corrigido, FIR, PCM16 e créditos limitados verificados. Faltam qualificação física integrada do candidato e critérios espectrais completos. |
| **F1.2 — VAD/barge-in** | **PARCIAL** | VAD e cancelamento sintéticos cobertos; faltam interrupção natural, eco e calibração no hardware. |
| **F1.3 — Playback/turnos** | **PARCIAL** | Agendamento monotônico e drain sustentados; faltam qualificação acústica, correlação robusta de turnos e tratamento operacional da fila crescente. |
| **F1.4 — Resiliência** | **PARCIAL** | Reconexão atual registrada; sessão de 632 s pertence a app anterior. Turno sem resposta continua sem recuperação demonstrada. |
| **F1.5 — Hardware/latência** | **INSUFICIENTE** | Não há ≥30 medições físicas de fim da fala→primeiro som audível, comparação antes/depois ou diálogo supervisionado de 30–60 s. |
| **F1.6 — PRF/auditoria/gate** | **PARCIAL** | Integridade confirmada; controles Classe C incompletos, documentação divergente e auditorias Emily Q3 retornando em SHAs anteriores. Este parecer também retorna. |

Achados que determinam a decisão:

- **Alto — aceite físico e desempenho incompletos.** O benchmark histórico tem **19 tentativas, 18 respostas com áudio**, p50 **1.324 ms**, p95 **4.666 ms**, e um turno sem terminal em 16 s. Mede texto→áudio agendado, não voz→som audível. A confirmação humana “está funcionando” continua válida como evidência funcional limitada.
- **Alto — resposta ausente sem tratamento comprovado.** O [watchdog](/tmp/mcf-f1-qa/f1-gate-c6f85b/apps/gemini-live-studio/public/app.js:399) apenas avisa, sem recuperar o turno; não estabelece causa do timeout. Sua cobertura exclusiva de texto é uma lacuna **média** adicional: voz automática/manual não arma essa proteção.
- **Alto — dependências de governança.** F0.8 permanece aberto segundo o pacote/contexto fornecido; o mission trace declara controles Classe C incompletos. As duas auditorias Emily Q3 são externas e rastreáveis, mas retornaram nos SHAs `4e5f331…` e `ae9f76a…`; não constituem aprovação deste candidato.
- **Alto para produção/exposição pública — credencial anteriormente exposta.** A rotação adiada permanece risco conhecido; não foi consultada nem executada.
- **Médios — limites de evidência, custo e privacidade.** O ensaio físico de 60 s registra **1.493 frames/955.520 amostras**, mas usa o Worklet anterior. Os 632 s também são históricos. Faltam custo por modalidade, orçamento e tratamento formal dos limites espectrais/fila de saída. A telemetria numérica passa nos testes; transcrições e notas do app permanecem em memória e integram exportação explícita, portanto essa garantia não abrange todo o estado.
- **Baixo — reconciliação documental.** Persistem referências a 1.494 frames, resultados antigos apresentados como atuais e instruções de laboratório com caminhos fixos. Hash íntegro não resolve divergência de conteúdo.

```yaml
decision: RETORNAR_PARA_CORRECAO
justification: >-
  A correção do domínio temporal está sustentada por inspeção,
  20/20 testes offline, vínculos de hashes e integração documentada.
  Permanecem incompletos aceite físico, latência de voz, tratamento
  de resposta ausente, controles Classe C e reconciliação de F0.8.
  Não há suficiência para fechar F1 ou promover F2.
next_state: EM_CORRECAO
next_action: >-
  Consolidar as pendências de F1, completar correções e qualificação
  direcionadas, reconciliar PRF e F0.8 e reapresentar o candidato final
  para auditoria independente e gate, preservando resultados já válidos.
responsible: MESTRE
reviewed_sha: c6f85b083837b297bd1bf04cba0e6582c5861afe
executor_type: CODEX_CLI_EXTERNAL_LEO_PROFILE
native_mcf_agent_session: false
human_action_required: >-
  Participação humana para audição, fala e barge-in físicos.
  Nenhuma confirmação rotineira para correções internas autorizadas.
  Tratamento da credencial respeita a decisão vigente de LEANDRO;
  esta execução não solicita nem realiza rotação.
required_evidence_for_reconsideration:
  - >-
    QA físico supervisionado de 30–60 segundos no candidato final:
    inteligibilidade, eco, barge-in natural, mute, stop e cleanup.
  - >-
    Pelo menos 30 medições físicas válidas de fim da fala a primeiro
    som audível, p50/p95, comparação antes/depois e falhas no denominador.
  - >-
    Diagnóstico e tratamento observável de resposta ausente, incluindo
    voz, correlação de turnos e recuperação sem replay cego.
  - >-
    Qualificação direcionada de resiliência no candidato final,
    distinguindo evidência histórica de nova execução; justificar
    reutilização por análise de impacto, sem repetir testes sem necessidade.
  - >-
    PRF reconciliado, contribuições reais dos controles Classe C,
    tratamento formal de custo, privacidade, filas e qualidade espectral.
  - >-
    Reavaliação independente das pendências no SHA final e reconciliação
    de F0.8 antes da promoção; credencial tratada antes de produção pública.
```

Podem prosseguir correções internas reversíveis de F1 e **planejamento documental de F2**, conforme o [readiness](/tmp/mcf-f1-qa/f1-gate-c6f85b/artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-01/PHASE-01-F2-READINESS.md). Hardware, provedor e credencial são dependências distintas; não justificam repetição indefinida dos testes já aprovados.

**Handoff ao MESTRE:** parecer entregue nesta resposta; F1 recomendado em `EM_CORRECAO`. **STOP para merge, deploy, exposição pública e implementação/transição formal de F2.** Nenhum estado oficial foi atualizado.

Entrega deste gate externo: **ENTREGUE**.
