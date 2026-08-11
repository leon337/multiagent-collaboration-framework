# Multiagent Collaboration Framework

Framework experimental para colaboração entre múltiplos agentes de IA com papéis definidos, seleção por competência, execução sequencial visível, loop orientado a objetivo, passagem de bastão contínua, skills versionadas, runtime persistente, evidência verificável, auditoria e gates governados.

## Governança

- **Leandro** é a autoridade humana final e não entra na contagem dos agentes.
- **Léo** é a autoridade delegada de continuidade operacional e gates internos.
- **Mestre** coordena a equipe, mantém o mapa da missão e apresenta o fluxo completo.
- Existem **29 agentes nomeados**, selecionados dinamicamente por competência.
- O protocolo operacional vigente está em `docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md`.

## Regras centrais

- ESEV obrigatório: atuação real deve ser exposta cronologicamente;
- CAF obrigatório para falhas recuperáveis;
- PRF rastreável para fases Classe B/C;
- sucesso sem evidência é proibido;
- evidência de gate pertence ao SHA exato;
- Leandro não é executor técnico padrão nem destinatário de handoff técnico;
- produção permanece bloqueada até gate material próprio.

## Runtime executável

```text
objetivo conversacional
→ Chat-to-Runtime Bridge
→ MissionRuntime
→ SkillRegistryLoader
→ Human Delegation Firewall
→ PermissionEngine
→ SkillExecutor
→ EvidenceValidator
→ PostgreSQL / Event Ledger
→ Handoff / CAF
→ trace final verificado
```

## Estado canônico

```yaml
skills_registradas: 16
skills_executaveis: 16
skills_documentais: 0
remaining_documental: []

runtime_006_lote_4e:
  canonical_sync: COMPLETE

gate_c_real_provider_write:
  issue: 111
  technical_pr: 112
  technical_merge: 0b060539eb152f0cf92bd146b853562407ab0a64
  proof_head: f50365eae53c54c0c5b3e929b52f0fe85c1ba4f4
  proof_run: 31537057206
  proof_artifact: 9119190464
  proof_stage: COMPLETE
  c1_real_write: PASS
  c2_real_write: PASS
  read_back: PASS
  idempotency: PASS
  ledger_receipts: PASS
  independent_audit: PASS
  leo_technical_gate: PASS
  technical_post_merge_documentation: PASS
  technical_post_merge_staging: PASS_DEPLOYED
  canonical_state: CANONICAL_SYNC_CANDIDATE

production: BLOCKED
live_staging_adapter: DISABLED
human_operator_actions: 1_HUMAN_GATE_ACTIONS_POLICY
```

## Skills executáveis

1. `MCF-START-MISSION`
2. `MCF-SELECT-AGENTS`
3. `MCF-RECOVER-CONTEXT`
4. `MCF-DEFINE-PRODUCT`
5. `MCF-DESIGN-EXPERIENCE`
6. `MCF-DESIGN-ARCHITECTURE`
7. `MCF-IMPLEMENT-CHANGE`
8. `MCF-REVIEW-CODE`
9. `MCF-RUN-TESTS`
10. `MCF-GIT-PR-RELEASE`
11. `MCF-DEPLOY-VALIDATE`
12. `MCF-TRACE-MISSION`
13. `MCF-EVALUATE-AGENTS`
14. `MCF-SECURITY-REVIEW`
15. `MCF-DEBUG-INCIDENT`
16. `MCF-CLOSE-PHASE`

Não há skill documental remanescente no runtime integrado.

## Gate C — real provider write

A capacidade de escrita GitHub do runtime foi comprovada em provider real e integrada tecnicamente.

### Evidência final

```yaml
technical_merge: 0b060539eb152f0cf92bd146b853562407ab0a64
final_proof_head: f50365eae53c54c0c5b3e929b52f0fe85c1ba4f4
proof_run: 31537057206
artifact_id: 9119190464
artifact_digest: sha256:6122eb9398ae0c1420e9257667f42d60badc995fe928459f3672815bf5ab84c2
proof_pr: 117
proof_comment_id: 5258957980
c1_read_back: PASS
c1_replay_no_duplicate_pr: PASS
c2_read_back: PASS
c2_duplicate_replay: RESERVATION_CONFLICT_BEFORE_NEW_ATTEMPT
ledger_attempts: 3_EVIDENCE_VALIDATED
receipts: 3
julia_governance: PASS
emily_independent_audit: PASS
leo_technical_gate: PASS
post_merge_documentation_run: 31538142320
post_merge_documentation: PASS
post_merge_staging_run: 31538142312
post_merge_staging: PASS_DEPLOYED
```

As mutações permanecem single-shot: o runtime nunca repete `POST` para tentar adivinhar o estado externo. A reconciliação pós-write é limitada a leituras `GET`; quando o efeito não pode ser provado, o estado permanece `PARTIAL/UNKNOWN`.

A infraestrutura temporária usada apenas para a prova real foi removida antes do merge. Permanecem o runtime corrigido e os testes permanentes de regressão.

## Lot 4-E — Close Phase

`MCF-CLOSE-PHASE` opera como `READY_AGENT`, com Carmem como primary owner e Mestre como handoff técnico. O boundary integrado permanece:

```text
internal / close-phase / mcf-agent-runtime
```

A skill exige evidência semântica estruturada para `phase_pack`, `audit_verdict`, `leo_decision` e `checkpoint`. Um estado `ENTREGUE` é rejeitado se houver objetivo não atendido, blockers, findings não resolvidos ou bloqueantes, auditoria não-PASS, próxima ação pendente, ação humana pendente, decisão não aprovadora de Léo ou divergência entre decisão e checkpoint.

## Documentação canônica

- `docs/runtime/README.md`
- `docs/runtime/MCF-RUNTIME-006-PLAN.md`
- `skills/registry.yaml`
- `docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md`
- `artifacts/phases/PHASE-006-LOT-4-E-CLOSE-PHASE/`
- `artifacts/phases/PHASE-006-GATE-C-REAL-PROVIDER-WRITE/`

## Próximo boundary

**Release Candidate / Gate E**.

O Gate C está tecnicamente integrado e esta branch representa sua sincronização documental canônica. O estado `ENTREGUE` será registrado somente após o merge desta sincronização e um closeout final vinculado ao novo SHA de `main`.

Produção continua fora desse boundary e permanece `BLOCKED`.
