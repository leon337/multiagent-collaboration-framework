# F0.8 — Segunda revisão técnica independente externa

**Executor:** Codex CLI em sessão isolada, não agente nativo Emily nem LÉO.
**Thread:** `01a1e5e9-d113-7131-93bd-221c13bdf4b2`.
**SHA revisado:** `7697e628ae6107e6072530e6cea045dc718549bb`.
**Parecer:** `RETORNAR_PARA_CORRECAO`.

---

**Recomendação: RETORNAR_PARA_CORRECAO.** As correções ampliaram a evidência disponível, mas ainda não sustentam o encerramento de F0.

**1. Identidade e verificações efetivas**

Executor externo **Codex CLI**, nesta sessão de revisão, aplicando o método de [EMILY.md](/tmp/mcf-gemini-f0-review-527/docs/agentes/EMILY.md). Não constitui Agent Session Emily autenticada no runtime MCF nem gate de LÉO.

SHA confirmado por `git rev-parse HEAD`, no início e ao final:

`7697e628ae6107e6072530e6cea045dc718549bb`

Conferências realizadas, sem rede, leitura de chave ou alteração de arquivos:

- Leitura do parecer anterior, remediação, PRF, documentos obrigatórios, fonte, scripts e JSONs versionados.
- Node `v24.22.2`: `node --test` passou, reportando **dois resultados agregados por arquivo**. Execução direta confirmou **21/21 testes do sincronizador e 9/9 da telemetria**.
- `sha256sum -c`: **8/8 artefatos do PRF OK**.
- `node --check`: seis arquivos JavaScript passaram.
- Comparação dos arquivos disponíveis com os hashes do snapshot.
- Testes adversariais adicionais em memória, com transporte falso.
- Verificação dos 16 arquivos rastreados de reprodução pelos padrões de credenciais usados no workflow: nenhum padrão encontrado. Isso não equivale a certificação de ausência de segredos.

Os arquivos auditados não apresentaram diferenças contra HEAD. Arquivos não rastreados de revisões foram excluídos da evidência.

**Não foram conferidos:** CI remoto, estado atual da PR/Issue, autenticação oficial de agentes, API Google, hardware físico, custos ou rotação efetiva da credencial.

**2. Achados revalidados**

| Achado anterior | Resultado |
|---|---|
| P2/Médio — classificação incompleta de checks | **Resolvido:** conclusões desconhecidas ficam pendentes; `action_required`, `startup_failure` e `stale` contam como falha. |
| P2/Médio — PR fechado e mudança de HEAD | **Parcial:** casos anteriores agora são bloqueados; permanece uma janela de corrida descrita abaixo. |
| P2/Médio — paginação e digest | **Resolvido no MVP:** múltiplas páginas e marcador por conteúdo dos checks. Teste adicional confirmou bloqueio após dez páginas completas. |
| P2/Médio — POST incerto | **Resolvido no cenário unitário:** consulta posterior e ausência de segundo POST; autenticidade da evidência encontrada ainda é parcial. |
| P2/Médio — workflow sem validação do PRF | **Resolvido no código:** caminhos incluem o PRF; workflow verifica hashes, sintaxe e testes. Execução remota não comprovada. |
| P2/Médio — telemetria sem implementação disponível | **Resolvido quanto à disponibilidade:** código e nove testes presentes; aceite completo permanece parcial. |
| Baixo — descrição contraditória do sincronizador | **Resolvido:** documentação distingue MVP e escopo futuro. |

Referências: [sincronizador](/tmp/mcf-gemini-f0-review-527/ops/gemini-live/checklist-sync.mjs:13), [testes](/tmp/mcf-gemini-f0-review-527/ops/gemini-live/checklist-sync.test.mjs:1), [workflow](/tmp/mcf-gemini-f0-review-527/.github/workflows/mcf-gemini-live-f0-checklist.yml:3).

Persistem os seguintes achados:

**P1/Alto — vínculo entre fonte, snapshot e execução parcialmente demonstrado.**

O `SNAPSHOT.json` possui exatamente o hash documental `af54e8a3…56b0162`. Entretanto, entre os oito arquivos nele enumerados:

| Correspondência | Arquivos |
|---|---|
| Hash coincide | `public/style.css`, `start.sh` |
| Hash diverge | `README.md`, `public/app.js`, `public/index.html`, `server.js` |
| Ausente | `live-connection-test.cjs`, `ui-test.cjs` |

A inclusão posterior de telemetria explica plausivelmente parte das diferenças, mas falta um manifesto posterior vinculado à execução final. O manifesto do PRF cobre oito documentos; **não cobre `repro/`, scripts nem JSONs**. A presença no commit identifica os bytes atuais, mas não comprova que foram os bytes executados no teste histórico.

O script disponível testa setup de 2.5 e 3.8; não localizei, no pacote obrigatório, script/resultado específico que comprove o handshake separado do Extended.

Referências: [snapshot](/tmp/mcf-gemini-f0-review-527/artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-00/repro/f0/SNAPSHOT.json:1), [manifesto](/tmp/mcf-gemini-f0-review-527/artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-00/PHASE-00-ARTIFACT-MANIFEST.sha256:1).

**P1/Alto — F0.5 continua sem satisfazer o aceite; asserções sintéticas também são insuficientes para algumas alegações.**

O `15/15` agora é inspecionável, mas:

- PCM, câmera e tela verificam alternância ON/OFF, sem afirmar quantidade ou validade dos payloads enviados.
- `REAL_TEXT_TURN` verifica apenas conexão ativa.
- `FUNCTION_CALL_REAL` verifica contador genérico, sem exigir `get_current_time` ou validar sua resposta.
- `AUDIO_RESPONSE_SIGNAL` aceita `turnComplete` **ou** transcrição, sem exigir áudio.
- `CLEAN_SHUTDOWN` verifica referências nulas, sem conferir `readyState` das tracks preservadas.

Esses testes podem passar com comportamentos aquém dos nomes e alegações. Não reproduzi o E2E nesta auditoria.

Hardware físico, interrupção, imagem e demais cenários do aceite original continuam sem comprovação suficiente. A transferência para F1 é proposta pendente, conforme a própria remediação.

Referências: [asserções do smoke](/tmp/mcf-gemini-f0-review-527/artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-00/repro/f0/baseline-smoke.cjs:41), [aceite original](/tmp/mcf-gemini-f0-review-527/docs/missions/gemini-live-evolution-20261116/ROADMAP.md:45), [remediação](/tmp/mcf-gemini-f0-review-527/artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-00/PHASE-00-REMEDIATION-CYCLE2.md:10).

**P1/Alto — rotação/revogação da credencial segue não comprovada.**

A remediação reconhece a pendência. Ausência de chave no pacote não demonstra revogação da anterior. A exposição histórica permanece informação documental, não incidente confirmado por esta sessão.

O servidor permite confirmar por inspeção `uses:1` e tempos solicitados, mas não sua aplicação pelo provedor. Permanecem ausência de autenticação própria e de restrição do token ao modelo.

Referências: [pendência de rotação](/tmp/mcf-gemini-f0-review-527/artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-00/PHASE-00-REMEDIATION-CYCLE2.md:11), [servidor](/tmp/mcf-gemini-f0-review-527/artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-00/repro/server.js:24).

**P2/Médio — sincronizador ainda tem limites adversariais e escopo incompleto.**

Reproduzi uma troca de HEAD durante a consulta dos comentários: houve `COMMENT_ONLY` para o SHA anterior. A segunda leitura do PR ocorre **antes** dessa consulta, deixando uma janela até o POST.

Também reproduzi `ALREADY_RECORDED` com comentário de autor não confiável contendo somente o marcador citado. A reconciliação de POST incerto usa o mesmo critério, sem validar autoria ou corpo completo.

O impacto atual limita-se a comentários; não altera checkboxes. Não há garantia de idempotência entre execuções simultâneas. Eventos amplos, receipts e gates seguem fora do MVP, sem reconciliação formal do escopo.

Referência: [revalidação e publicação](/tmp/mcf-gemini-f0-review-527/ops/gemini-live/checklist-sync.mjs:57).

**P2/Médio — telemetria implementada, contrato F0.6 ainda parcial.**

Os nove testes sustentam filtragem de campos, buffer de 500 entradas, cópias e percentis. Não sustentam o contrato completo: faltam correlação por sessão/requisição, modo, erros estruturados, reconexões, duração de streaming e consentimento. O `model` registrado na conexão não acompanha cada evento.

`n=1` permanece exploratório; nenhum custo foi comprovado. O export completo inclui conversa, embora os eventos de telemetria filtrem conteúdo.

Referências: [módulo](/tmp/mcf-gemini-f0-review-527/artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-00/repro/public/telemetry.js:5), [export](/tmp/mcf-gemini-f0-review-527/artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-00/repro/public/app.js:113).

**P2/Médio — rastreabilidade operacional ainda parcial.**

O adendo reconhece limites e preserva o histórico. Contudo, resumo retrospectivo e JSONs gerados pelo executor não substituem registros verificáveis de execução, CAF e handoffs exigidos pelo protocolo. A integridade dos oito documentos não valida automaticamente suas afirmações.

Referência: [remediação e handoff](/tmp/mcf-gemini-f0-review-527/artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-00/PHASE-00-REMEDIATION-CYCLE2.md:15).

**3. Classificação de suficiência**

| Item | Classificação | Fundamentação |
|---|---|---|
| F0.1 | **SUFICIENTE** | Contrato e critérios documentais disponíveis; estado vivo não conferido. |
| F0.2 | **PARCIAL** | Fonte disponível, mas vínculo com snapshot/execução incompleto. |
| F0.3 | **PARCIAL** | Probe e JSON presentes; disponibilidade atual e terceiro handshake não comprovados. |
| F0.4 | **PARCIAL** | Diagnóstico inspecionável; rotação e controles residuais pendentes. |
| F0.5 | **INSUFICIENTE** | Asserções fracas, hardware ausente e redução de aceite sem decisão formal. |
| F0.6 | **PARCIAL** | MVP testado; contrato original incompleto. |
| F0.7 | **PARCIAL** | Correções reproduzidas; concorrência, evidência de postagem e escopo pendentes. |
| F0.8 | **INSUFICIENTE** | PRF íntegro, mas pendências altas e decisões oficiais ausentes. |

**4. Recomendação final**

**RETORNAR_PARA_CORRECAO**, para conclusão de F0. A segunda revisão reconhece correções efetivas, mas mantém os bloqueios de suficiência descritos acima.

Este parecer não constitui gate oficial, autorização de merge, deploy ou avanço de fase.

**5. Ações restantes, em ordem**

1. **MESTRE:** vincular fonte final, scripts e resultados por manifesto e execução identificada; esclarecer diferenças do snapshot e fornecer evidência específica do Extended.
2. **MESTRE:** fortalecer asserções do E2E; corrigir/retestar a janela de HEAD e validação dos comentários; concluir os critérios restantes ou preparar proposta formal de alteração de aceite.
3. **LEANDRO**, com apoio do MESTRE: providenciar revogação/rotação no ambiente autorizado e evidência sanitizada; realizar validação física supervisionada caso mantida no aceite.
4. **Emily oficial:** revalidar o novo SHA e evidências, incluindo CI remoto quando autorizado, registrando identidade e independência verificáveis.
5. **LÉO:** decidir formalmente sobre suficiência, riscos e eventual alteração de escopo; escalar a LEANDRO matérias reservadas.
6. **MESTRE:** atualizar Issue e checkpoint conforme as decisões efetivamente obtidas, sem marcar como validado o que permanece pendente.
