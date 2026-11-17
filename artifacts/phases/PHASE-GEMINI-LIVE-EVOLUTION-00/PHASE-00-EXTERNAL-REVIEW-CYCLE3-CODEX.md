# Auditoria independente EXTERNA F0 ciclo 3 (pré-correção)

Reviewed SHA: a8ffca392ba24dd1202866da1c24ece2f75b6a49
Executor: Codex CLI sob contrato normativo EMILY (não é Agent Session nativa)
Codex thread: 01a1e6ef-5cbf-7933-8bfd-48325bd9818d
Parecer: RETORNAR_PARA_CORRECAO
Observação: a correção posterior do sincronizador consta no commit 6af8ae4005f3907615653181232ff45c73b5035e.
Este parecer NÃO foi executado contra esse SHA novo; não considerá-lo um gate após a correção.
Sem autorização de merge para main nem deploy de produção.

---

**Parecer técnico: RETORNAR_PARA_CORRECAO para encerramento de F0, inclusive local.** A evidência melhorou substancialmente, mas persistem critérios não cumpridos ou sem reconciliação formal. Isso não revoga a autorização de LEANDRO para continuar o desenvolvimento local.

**1. Identidade, escopo e execução**

Sou executor externo independente via **Codex CLI**, aplicando o contrato normativo de [EMILY.md](/tmp/mcf-f0-gate-a8ff/docs/agentes/EMILY.md). Não sou Emily nativa, Agent Session autenticada do MCF nem autoridade de gate LÉO.

Missão `MCF-GEMINI-LIVE-EVOLUTION-20261116-001`, Issue #527, PR #528. SHA confirmado no início e no final:

`a8ffca392ba24dd1202866da1c24ece2f75b6a49`

Li EMILY, LEO, protocolo unificado, roadmap, documentação da missão, PRF, duas revisões anteriores, fonte, scripts e resultados sanitizados.

Verificações efetivamente executadas:

| Verificação | Resultado |
|---|---|
| `git status --short` inicial/final | Árvore limpa |
| Comando autorizado `node --test ...` | PASS; **dois resultados agregados por arquivo**, zero falhas |
| Manifesto PRF | **8/8 OK** |
| Manifesto de reprodução | **21/21 OK** |
| Hashes embutidos no smoke: cinco fontes + script | **6/6 OK** |
| `node --check` | **12 arquivos aprovados** |

Os arquivos de teste contêm 21 casos do sincronizador e nove da telemetria; não apresento a saída agregada como 30 resultados individuais observados.

Não executei API, servidor, navegador E2E, captura física ou scripts que gravam resultados. Não usei rede, chaves, `.private`, mídia, edição, merge ou deploy. Não verifiquei o estado atual do GitHub.

**2. Achados classificados**

**ALTO — F0.5 original permanece sem aceite.**
O [smoke forte](/tmp/mcf-f0-gate-a8ff/artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-00/repro/f0/baseline-strong.cjs) corrige várias asserções fracas anteriores: conta envios PCM/JPEG/imagem, exige chamada e resposta nominativas, áudio recebido, transcrição, turno concluído e tracks encerradas. Inclui handshake Extended.

O JSON registra **13/13**, com 18 frames PCM enviados, 99 blocos de áudio recebidos e três tracks encerradas. São resultados históricos inspecionados, **não E2E reproduzido nesta auditoria**.

Continuam ausentes fala/resposta, interrupção e visão em hardware conforme o aceite original. A transferência para F1 permanece proposta, sem decisão formal comprovada.

**ALTO — Segurança continua com lacunas reais.**
A inspeção de [server.js](/tmp/mcf-f0-gate-a8ff/artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-00/repro/server.js) confirma persistência da chave em JSON sem criptografia, ausência de autenticação própria e token sem `liveConnectConstraints`. Loopback e validação de Origin reduzem exposição; não autenticam processos locais.

Rotação/revogação continua sem comprovação. **O adiamento autorizado por LEANDRO não significa revogação da chave**, mas também não deve ser reinterpretado como proibição de continuar o trabalho local já autorizado. Esses riscos bloqueiam expansão pública/autônoma sem tratamento e decisão aplicáveis.

**MÉDIO — Sincronizador corrigido parcialmente; anti-falso-positivo incompleto.**
Foram corrigidos classificação de conclusões, filtro por SHA, paginação, digest dos checks, bloqueio de PR fechado e algumas mudanças de HEAD, além de reconciliação sem repetir POST incerto.

Persistem no [código atual](/tmp/mcf-f0-gate-a8ff/ops/gemini-live/checklist-sync.mjs):

- Rechecagem de HEAD **antes** da leitura paginada de comentários; permanece janela até o POST.
- Deduplicação e recuperação aceitam qualquer comentário contendo o marcador, sem validar autoria ou corpo completo.
- Ausência de exclusão entre execuções concorrentes e cobertura completa dos eventos/receipts/gates especificados.

Essas conclusões decorrem da inspeção; não executei novos testes adversariais. O impacto atual limita-se a comentários: o sincronizador não marca checkboxes.

**MÉDIO — Telemetria ainda não cumpre integralmente F0.6.**
Implementação e testes estão disponíveis. Buffer limitado, filtragem e percentis têm cobertura. Faltam elementos do contrato original: correlação sessão/requisição, modo, erros estruturados, reconexões, duração de streaming, consentimento e custo estimado. O export completo inclui conversa, apesar da filtragem dos eventos de telemetria.

**MÉDIO — Rastreabilidade melhorou, mas não equivale a atestação independente da execução.**
O novo manifesto resolve a ausência de vínculo documental entre fonte publicada e resultado forte: hashes conferem. Entretanto, o script calcula hashes dos arquivos em disco e acessa um servidor já existente; não atesta que aquele processo serviu exatamente esses bytes. Dependências Puppeteer/Chrome também usam caminhos específicos da máquina.

O PRF histórico mantém contagens antigas e `GATE_PENDENTE`; adendos não substituem decisões e handoffs verificáveis.

**BAIXO — Hash de mídia sintética não está registrado.**
Há hashes de código e script, contadores de mídia e geração sintética explícita. **Não há digest dos payloads PCM/JPEG/PNG enviados.** Portanto, “hash de código e mídia sintética” não está integralmente demonstrado. Nenhum desses sinais comprova hardware físico ou qualidade perceptiva.

**3. Matriz de suficiência**

| Item | Parecer | Evidência e limite |
|---|---|---|
| F0.2 | **SUFICIENTE** | Inventário, fonte sanitizada e manifesto 21/21 disponíveis; suficiência documental do snapshot, sem certificar runtime atual. |
| F0.3 | **PARCIAL** | Probe sanitizado e três handshakes registrados, incluindo Extended; quotas/custos e capacidades completas não comprovados. |
| F0.4 | **PARCIAL** | Threat model, fonte e resultado 12 PASS/3 gaps disponíveis; criptografia, login, constraints e rotação pendentes. |
| F0.5 | **INSUFICIENTE** | Smoke sintético fortalecido e vinculado por hashes; hardware/interrupção original sem aceite formal. |
| F0.6 | **PARCIAL** | MVP inspecionável e testes offline aprovados; contrato original incompleto. |
| F0.7 | **PARCIAL** | Correções efetivas; limitações adversariais e redução de escopo ainda pendentes. |
| F0.8 | **INSUFICIENTE** | PRF íntegro e auditoria externa entregue; achados e gate LÉO ainda sem resolução formal. |

Conforme o [registro local versionado](/tmp/mcf-f0-gate-a8ff/docs/missions/gemini-live-evolution-20261116/CHECKLIST-LIVE.md), somente F0.1 permanece validado; F0.2–F0.7 foram reabertos e F0.8 segue pendente. A informação atual de LEANDRO confirma F0.2–F0.8 abertos. Não consultei os checkboxes remotamente.

**4. Decisão para F0 local**

**RETORNAR_PARA_CORRECAO**, porque o aceite físico continua vigente, F0.7 não está completamente corrigido e faltam reconciliações formais de escopo e riscos.

É tecnicamente possível um **APROVAR_COM_RESSALVAS restrito à continuidade local**, com riscos aceitos e pendências explícitas. Isso seria uma decisão de escopo limitado por LÉO, sem declarar F0 integralmente cumprida. A rotação adiada, isoladamente, não justifica bloquear toda atividade local autorizada; tampouco permite certificar segurança ou exposição pública.

**5. Caminho para LÉO e F2 sem bypass**

1. Corrigir as limitações do sincronizador e registrar testes negativos correspondentes.
2. Concluir ou reconciliar formalmente os contratos reduzidos de F0.6/F0.7.
3. Registrar decisão sobre F0.5: executar o aceite original ou transferir requisitos explicitamente, preservando pendências e autoridade aplicável.
4. Receber as novas evidências F1 de outro SHA/branch por **handoff formal**: origem, código, cenários, resultados e correspondência com critérios F0. Não contá-las automaticamente como execução deste SHA.
5. Registrar aceitação local dos riscos, responsáveis e condições; comprovar rotação e controles exigidos antes da exposição pública aplicável.
6. Consolidar PRF/checkpoint, revisão independente aceita e decisão real de LÉO.
7. Antes de iniciar F2, cumprir também o **gate F1**: hardware real, falhas de rede induzidas, comparação antes/depois e PRF. Captura física de mic e relato humano de áudio funcionando são evidências úteis, mas não cobrem todo esse gate.

**Nenhum CI isolado fecha item, fase ou gate.** Este parecer não autoriza merge, deploy ou avanço automático.

**ENTREGUE — parecer externo; F0 permanece pendente de correção e decisão formal.**
