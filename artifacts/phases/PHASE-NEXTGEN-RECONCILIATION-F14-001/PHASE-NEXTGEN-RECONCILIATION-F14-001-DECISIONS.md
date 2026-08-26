# PHASE-NEXTGEN-RECONCILIATION-F14-001 — Registro de decisões

| Seq. | Ciclo | Autoridade/executor                  | Entrada                          | Evidência                                                                                 | Decisão                                                                                                                                                     | Efeito                         | Próximo estado de trabalho (não destinatário ESEV) |
| ---: | ----: | ------------------------------------ | -------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | -------------------------------------------------- |
|    1 |     1 | LEANDRO                              | missão explícita                 | conversa da missão                                                                        | reconciliar NextGen, publicar roadmap no `main` e retornar antes do código                                                                                  | escopo documental autorizado   | contexto raiz                                      |
|    2 |     1 | contexto raiz                        | quatro repos + branch histórica  | Git/GitHub live e SHAs registrados                                                        | partir do `main` atual, não mergear a branch histórica                                                                                                      | lineage preservado             | reconciliação                                      |
|    3 |     1 | contexto raiz                        | Q1–Q16 + v1.1/Context Fabric     | disposition por pergunta                                                                  | confirmar, refinar, reabrir ou marcar maturidade com evidência                                                                                              | Round 2 candidata              | arquitetura                                        |
|    4 |     1 | contexto raiz                        | target histórico + runtime atual | contratos/runtime/ownership atuais                                                        | evoluir o runtime existente, sem segundo runtime/ledger/permissões                                                                                          | F1.4 candidata                 | plano                                              |
|    5 |     1 | LEANDRO                              | restrição financeira             | instrução direta                                                                          | zero custo variável com APIs de IA e zero fallback pago                                                                                                     | hard requirement               | todos os boundaries                                |
|    6 |     2 | revisor Codex independente           | primeiro diff documental         | quatro achados P2                                                                         | preservar gate F1.4, grafo Q15 e work packages Q13/Q14                                                                                                      | correções integradas           | validação                                          |
|    7 |     2 | contexto raiz                        | `main` avançou pelo PR #168      | `main@85ccf418...`                                                                        | rebasear e reconciliar memória/runtime-reality                                                                                                              | baseline atualizado            | revisão 2                                          |
|    8 |     3 | revisor Codex independente           | diff pós-rebase                  | um P1 e quatro P2                                                                         | exigir execução cognitiva real, migração Capsule legível, enum único, schemas 1:1 e audits reais                                                            | findings aceitos               | correção                                           |
|    9 |     3 | contexto raiz + tasks de revisão     | findings validados contra código | loader/schema/runtime/package scripts                                                     | definir Cognitive Execution Request/Receipt, sidecar/pointer v2, `BLOCKED_NO_ELIGIBLE_BINDING`, inventário completo e gates de audit                        | plano corrigido                | revisão terminal                                   |
|   10 |     3 | revisão de conformidade PRF          | DEC-002/050/051 e protocolo      | fase altera repo/testes e possui auditoria                                                | classificar como C e criar PRF sem autoria simulada                                                                                                         | rastreabilidade aberta         | freeze                                             |
|   11 |     3 | contexto raiz                        | Issue #164 e PR #169 mudaram     | 29 managed identities, zero task runs; PR fechado sem merge por ser billable              | preservar o receipt externo, negar crédito de execução e tratar o caminho pago como histórico inelegível                                                    | snapshot reconciliado          | freeze                                             |
|   12 |     3 | contexto raiz                        | controles MCF não executados     | nenhum task run/origin Receipt de Emily/Léo/Augusto/Júlia ou demais gatilhos              | registrar variance aberta; publicar o candidato sem alegar conformidade, gate de Léo ou encerramento da fase                                                | crédito simulado evitado       | retorno humano                                     |
|   13 |     3 | revisão arquitetural read-only       | diff corrigido                   | attestation autoafirmável; pointer/tools/cwd divergentes                                  | vincular attestation a trust root/chave/canal e admissão NX-5; alinhar pointer/tools e Git cwd                                                              | quatro findings corrigidos     | revisão terminal                                   |
|   14 |     3 | contexto raiz                        | Issue #164 e PR #170             | harness zero-cost run `32709898828` rejeitou output Miriam sem heading de handoff         | registrar tentativa real, mas negar artifact/origin/crédito aceitos; manter implementação bloqueada                                                         | snapshot live reconciliado     | freeze                                             |
|   15 |     3 | `/root/terminal_consistency_review`  | árvore cross-document            | authority/binding/placement/Q15/gates/enum/migração/PRF divergentes                       | separar ceiling/envelope, candidate/finalized, TriView downstream, reason code único e rollout sidecar→pointer                                              | desenho reconciliado           | revisão terminal                                   |
|   16 |     3 | contexto raiz                        | PR #170 live                     | run intermediário cancelado; segunda tentativa efetiva chegou a 6/15 e falhou em Tiago    | reconhecer a evidência parcial sem promovê-la a artifact/crédito/origin gate; manter PR fora de `main`                                                      | freeze live atualizado         | validação terminal                                 |
|   17 |     3 | contexto raiz + revisões read-only   | `main`/lineages avançaram        | PR #171 mergeado; draft PR #174; Cloud Hermes não default `23e4e6c`                       | rebasear no PR #171; tratar DSH como adapter candidato; impor equivalence/no-second-writer ao PR #174; negar eligibility/remoto a Hermes                    | baseline/deduplicação fechados | validação terminal                                 |
|   18 |     4 | contexto raiz + auditoria read-only  | `main` avançou até PR #181       | `v1.2.0@5c7f983`; PR #179; `main@42d941b`                                                 | rebasear; preservar release v1.2.0 e distinguir os deltas pós-release #179/#181 sem inferir tag, release ou deploy novo                                     | baseline v1.2 reconciliado     | correção contratual                                |
|   19 |     4 | contexto raiz + auditoria read-only  | Human Control, GUI e autoridade  | primitive interna PR #175; trace PR #179; conta reservada/`sourceRef` server-side PR #181 | separar suspensão, decisão e prova humana; recognizer nominal não autentica; reutilizar trace; manter PR #180 draft não canônico                            | piso de segurança preservado   | arquitetura/plano                                  |
|   20 |     4 | contexto raiz + auditoria contratual | refs, binding, placement e trust | inconsistências cross-document verificadas                                                | exigir identidade resolvível, graph/node binding, Placement union relacional, três eixos, JCS/domain separators, claims críticos e HUMAN_GATE ponta a ponta | catálogo 17/22 endurecido      | validação terminal                                 |
|   21 |     4 | contexto raiz                        | freeze formal 17/22              | parser TypeScript + inventário de nomes/schemas                                           | dar identidade comum a Capsule v2/pointer/Memory Read e manter Completion Contract imutável; completion proof fica no runtime                               | plano executável endurecido    | validação terminal                                 |
|   22 |     4 | revisores read-only                  | diff pré-publicação              | três tasks e `codex review --uncommitted`                                                 | registrar limite de uso sem fabricar PASS: tasks não executaram e a revisão ampla foi interrompida antes do veredicto                                       | variance terminal explícita    | checks objetivos do PR                             |
|   23 |     4 | contexto raiz                        | validação da árvore exata        | `pnpm verify`, diff do adapter, 3 runs isolados, suíte controlada e build                 | não alterar runtime fora do escopo; divulgar a flutuação de deadline do baseline e exigir checks do HEAD exato antes do merge                               | evidência local honesta        | PR regular                                         |

As decisões do ciclo 4 também fixam `HumanControlCheckpoint`, `HumanAuthorityProof`,
`McfTrustedAuthorityBindingRefV1`, trace GUI/window e routing decision record como
primitive/value-object/evidence internos ou vigentes, não contratos públicos 23+. Promotion a
boundary público reabre F1.4, catálogo e contagem.

`contexto raiz` é a sessão ChatGPT/Codex `HOST_MEDIATED_UNVERIFIED`, não um agente MCF. A última
coluna registra continuidade temática, não handoff válido sob DEC-050/ESEV.

## Gates

### Revisão independente por ferramenta

```yaml
executor: codex_review_read_only
distinct_official_agent_identity: false
first_verdict: FINDINGS_CORRECTED
second_verdict: FINDINGS_CORRECTED
terminal_exact_tree_verdict: INTERRUPTED_USAGE_LIMIT_NO_VERDICT
terminal_attempt: INTERRUPTED_USAGE_LIMIT_NO_VERDICT
material_finding_emitted_before_interruption: false
```

### Emily — auditoria nominal

```yaml
verdict: NOT_EXECUTED_NO_TASK_RUN_ORIGIN_RECEIPT
findings: []
credit_assigned: false
```

### Léo — decisão operacional nominal

```yaml
decision: NOT_EXECUTED_NO_TASK_RUN_ORIGIN_RECEIPT
justification: A identidade managed existe no lineage #164, mas nenhum task run de Léo executou esta fase; a publicação documental já possui autorização direta superior de LEANDRO e nenhuma decisão será atribuída ficticiamente.
next_state: USE_LEANDRO_AUTHORIZED_PR_FLOW_WITH_EXTERNAL_CHECK_RECEIPTS
escalate_to_leandro: true
```

### Leandro — autoridade humana

```yaml
mission_and_document_publication_authorized: true
push_and_merge_authorized: true
nextgen_disposition_approved: false
formal_architecture_f1_4_approved: false
implementation_boundary_authorized: false
brainbase_billable_run_authorized_for_this_mission: false
next_decision: REVIEW_EXACT_MAIN_REVISION
```
