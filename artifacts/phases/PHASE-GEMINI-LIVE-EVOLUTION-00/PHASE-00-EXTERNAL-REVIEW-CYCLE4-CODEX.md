# Auditoria independente EXTERNA antes do ciclo 4

Reviewed SHA: 191480d6498b6012909b53289ebc476b370e8d7e
Codex CLI thread: 01a1e6f7-1b06-7ed1-be00-6621b3cc1a9c
Executor externo no contrato normativo Emily, NAO Agent Session MCF nativa
Decisao: RETORNAR_PARA_CORRECAO para F0 integral; recomenda continuidade local com ressalvas sujeita a LEO
Nova correcao strict timestamp foi implementada APOS este SHA. Este parecer nao auditou a correcao posterior.

---

**Parecer: RETORNAR_PARA_CORRECAO para encerramento integral de F0.** Recomendo permitir **CONTINUIDADE LOCAL COM RESSALVAS**, mediante registro por LÉO, preservando as pendências. Este parecer não aprova F0, não comprova início de F2 e não autoriza exposição pública, merge ou deploy.

Missão: `MCF-GEMINI-LIVE-EVOLUTION-20261116-001`, PR #528.
SHA confirmado no início e no final: `191480d6498b6012909b53289ebc476b370e8d7e`.
Codex thread: `01a1e6f7-1b06-7ed1-be00-6621b3cc1a9c`.

Atuei como **Codex CLI externo**, sob o contrato normativo de Emily; não como Agent Session MCF nativa nem autoridade LÉO. Li EMILY, LEO, protocolo unificado, ROADMAP, PRF F0, remediação ciclo 3, handoff e parecer independente anterior. Não usei rede, GitHub API, segredos ou áudio; não alterei arquivos. O estado atual remoto de PR, Issue e CI não foi verificado.

**Verificações executadas**

| Comando/verificação | Resultado observado |
|---|---|
| `git rev-parse HEAD`; `git status --short`, inicial/final | SHA correto; árvore limpa |
| `node --test ops/gemini-live/checklist-sync.test.mjs ops/gemini-live/f0-telemetry.test.mjs` | PASS; saída agregada de dois arquivos |
| `node ops/gemini-live/checklist-sync.test.mjs` | **27/27 PASS** |
| `node ops/gemini-live/f0-telemetry.test.mjs` | **9/9 PASS** |
| `sha256sum -c PHASE-00-ARTIFACT-MANIFEST.sha256` no diretório PRF | **8/8 OK** |
| `sha256sum -c PHASE-00-REMEDIATION-CYCLE3-MANIFEST.sha256` no diretório PRF | **6/6 OK** |
| Script Node com SHA-256 do `REPRO-MANIFEST.json` | **21/21 OK** |
| Script Node conferindo hashes embutidos no smoke forte | **6/6 OK** |
| `node --check` em dez arquivos de código/testes | Todos aprovados |
| Testes adversariais adicionais via `node --input-type=module`, com transportes simulados | Resultados descritos abaixo |

A primeira tentativa dos manifests foi feita incorretamente na raiz e falhou por caminhos relativos; a execução corrigida no diretório PRF passou integralmente. Node observado: `v24.22.2`.

O código de remediação e o workflow têm origem no commit `6af8ae4005f3907615653181232ff45c73b5035e`, incorporado ao SHA auditado.

**F0.7: correção PARCIAL**

| Controle solicitado | Avaliação |
|---|---|
| Autor permitido + corpo completo; terceiro citando marker rejeitado | **RESOLVIDO para terceiro/marker isolado; PARCIAL na normalização** |
| Releitura após paginação e antes do POST | **RESOLVIDO no fluxo de publicação**, com janela residual |
| Concorrência do `publish_signal` | **RESOLVIDO na configuração do workflow**, sem comprovação remota |
| Timeout reconciliado sem segundo POST | **RESOLVIDO no fluxo testado** |
| Nenhuma alteração de checkbox/gate | **Confirmado no código e nos testes** |
| Cobertura completa de eventos, receipts e governança | **PARCIAL; permanece MVP** |

O [sincronizador](/tmp/mcf-f0-gate-191480d/ops/gemini-live/checklist-sync.mjs:10) exige login `leon337` ou `github-actions[bot]`, marker inicial e igualdade do corpo normalizado. Rejeitei experimentalmente terceiro com corpo completo, marker isolado, contagens alteradas e linha adicional de aprovação.

Antes de publicar, o código relê PR e Issue após a paginação: mudança de HEAD/ref, fechamento de PR, fechamento da Issue ou alteração de seu corpo bloqueiam o POST. O caminho `ALREADY_RECORDED` retorna antes dessa releitura final, mas não escreve.

O [workflow](/tmp/mcf-f0-gate-191480d/.github/workflows/mcf-gemini-live-f0-checklist.yml:61) configura grupo fixo de concorrência e `cancel-in-progress: false`, publicação opt-in e dependência de `verify`. Isso serializa os jobs participantes; não constitui fila garantida de todos os dispatches nem cobre CLIs externos.

**Achados por severidade**

- **ALTO — Segurança incompleta.** A fonte confirma chave persistida em JSON plaintext, ausência de autenticação própria e token sem `liveConnectConstraints`. A rotação permanece adiada por LEANDRO, sem comprovação de revogação. Loopback e Origin reduzem exposição, mas não autenticam processos locais. Esses riscos impedem certificar segurança para expansão pública/autônoma; não revogam a continuidade local autorizada.

- **ALTO — Aceite físico original de F0.5 permanece incompleto.** O smoke forte registra 13/13 histórico com mídia sintética e três handshakes. Não comprova hardware físico, qualidade perceptiva ou barge-in. O relato F1 de microfone físico e voz funcionando pertence a outro SHA; não foi reproduzido nem auditado aqui. A transferência de critérios continua dependente de reconciliação formal.

- **MÉDIO — Normalização de recibo é permissiva além de timestamp.** `canonicalReceipt()` aplica `trim()` e substitui todo o conteúdo da linha “Consultado em”, sem validar data. Nos testes adicionais, um recibo de autor permitido foi aceito com timestamp vazio ou substituído por `F0 APROVADA; gate LEO aprovado`. Espaços externos também foram ignorados. Portanto, a promessa de “corpo íntegro, normalizando só timestamp” não está integralmente cumprida. Recomendo validar formato e posição únicos do timestamp e comparar os demais bytes conforme contrato explícito.

- **MÉDIO — Corridas residuais confirmadas em simulação.** Duas reconciliações paralelas com snapshot vazio produziram **dois POSTs**. Mudança imediatamente após a última leitura também permite publicação residual. O workflow reduz a concorrência participante, mas não elimina a janela API nem serializa CLI externo. O efeito é comentário duplicado ou observação desatualizada.

- **MÉDIO — Contratos F0.6/F0.7 e gate F0.8 incompletos.** Telemetria cobre buffer, whitelist e percentis, mas não todo o contrato de correlação, consentimento, custos e demais metadados. O sincronizador continua observador opt-in, sem cobertura ampla de eventos/gates. PRF e hashes não substituem decisão real de LÉO.

- **BAIXO — Proveniência do ator depende somente de login.** Um objeto simulado com login permitido e `id/type/app` arbitrários foi aceito. Isso demonstra o limite do predicado; **não demonstra falsificação de identidade na API real do GitHub**. A confiança em `github-actions[bot]` também não identifica qual workflow originou o comentário.

A falha da normalização pode ocultar texto enganoso dentro da linha ignorada e causar reconhecimento indevido de recibo. **Não observei aprovação automática falsa:** o código somente publica comentários, declara que eles não são aceite/gate e não possui operação de edição dos checkboxes. Não se deve promover esse recibo a prova de aprovação.

**Matriz de evidência F0.2–F0.8**

| Item | Suficiência | Evidência e limite |
|---|---|---|
| F0.2 | **Suficiente documentalmente** | Fonte sanitizada em `repro`, inventário, SHA histórico `a33bdf9…` e manifesto 21/21; não atesta runtime atual. |
| F0.3 | **Parcial** | Seis metadados históricos e três handshakes; disponibilidade atual, quotas, custos e capacidades completas não comprovados. |
| F0.4 | **Parcial** | Threat model e controles disponíveis; rotação, criptografia, autenticação e constraints continuam abertos. |
| F0.5 | **Insuficiente para aceite original** | Smoke histórico sintético 13/13, hashes 6/6, 18 frames PCM, 99 blocos de saída e três tracks encerradas; hardware/interrupção pendentes. F1 de outro SHA exige handoff validado. |
| F0.6 | **Parcial** | Nove testes aprovados; contrato amplo de metadados, consentimento e custos incompleto. |
| F0.7 | **Parcial** | Remediação efetiva, 27 testes aprovados; normalização permissiva, concorrência externa e escopo MVP remanescentes. |
| F0.8 | **Insuficiente** | PRF íntegro e revisão externa entregue; decisão interna aplicável permanece pendente. |

Os hashes vinculam arquivos e resultados publicados, mas não constituem atestação independente de que o processo histórico serviu exatamente aqueles bytes. O E2E/API não foi reexecutado nesta revisão.

**Gate recomendado**

Para **fechamento integral F0: RETORNAR_PARA_CORRECAO**. Corrigir a normalização, registrar testes correspondentes e reconciliar formalmente escopo, aceite físico, telemetria e riscos.

Para **CONTINUIDADE LOCAL: APROVAR_COM_RESSALVAS é tecnicamente recomendável**, como decisão limitada de LÉO, com responsáveis e pendências registrados, manutenção em loopback e sem expansão pública ou deploy. Essa continuidade não equivale ao fechamento de F0.

Antes de avançar formalmente à F2, são necessários os gates aplicáveis de F0/F1, incluindo handoff verificável das evidências de outro SHA e suficiência do gate F1: hardware real, falhas induzidas de rede, comparação antes/depois e PRF. A autorização de LEANDRO para prosseguir quando os gates permitirem permanece preservada.

**ENTREGUE — parecer externo somente leitura; F0 permanece sem aprovação integral e F2 não foi declarada iniciada.**
