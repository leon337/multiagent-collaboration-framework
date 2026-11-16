# Checklist vivo — contrato de operação e evidências

**Missão:** `MCF-GEMINI-LIVE-EVOLUTION-20261116-001`  
**Board único e editável:** [GitHub Issue #527](https://github.com/leon337/multiagent-collaboration-framework/issues/527)  
**Roadmap:** [ROADMAP.md](./ROADMAP.md)  
**Estado vigente:** ler a Issue e as evidências live; este documento **não é** um espelho estático do checklist.

## O que significa "vivo" nesta missão

- **Já operacional:** a Issue #527 contém tarefas `- [ ]` clicáveis no GitHub, com IDs estáveis `F0.1` a `F4.6`, que podem ser editadas e vinculadas a comentários, PRs, testes, SHAs, receipts e decisões.
- **Atualização humana/agêntica governada:** a cada PR, falha, evidência, gate ou decisão, o responsável atualiza a Issue com status e referências. A atualização deve ocorrer durante o mesmo ciclo de execução, não só em um resumo retrospectivo.
- **Automação futura (F0.7):** sincronizador de sinais CI/PR e reconciliação de status; **não implementado na abertura da missão**. Automação não poderá marcar `[x]` porque um workflow está verde.
- **Regra de veracidade:** o campo marcado indica `VALIDADO` e evidência vinculada. Um item em execução continua desmarcado e recebe comentário `EM_EXECUCAO`.
- **Sem duplicação:** não manter um segundo checklist com progresso contraditório em arquivos Markdown/JSON/Notion.

## Contrato de atualização

Evento: `new_phase | commit | pr_opened | ci_finished | e2e | blocker | security_finding | audit | gate | closeout`.

Formato recomendado de comentário da Issue:

```yaml
checklist_event:
  mission_id: MCF-GEMINI-LIVE-EVOLUTION-20261116-001
  item_id: F1.4
  phase_id: PHASE-01-AUDIO-RELIABILITY
  state_before: PLANEJADO
  state_after: EM_EXECUCAO
  occurred_at_utc: "YYYY-MM-DDTHH:MM:SSZ"
  actor: <agente-ou-autoridade-real>
  evidence:
    - type: github_pr|commit|test|receipt|log_sanitized|audit|gate
      ref: "<url-ou-identificador-verificável>"
  qa_result: PENDING|PASS|FAIL|NAO_APLICAVEL
  independent_review: PENDING|PASS|FAIL|NAO_APLICAVEL
  gate_decision: PENDING|APROVAR|APROVAR_COM_RESSALVAS|RETORNAR_PARA_CORRECAO|BLOQUEAR|ESCALAR_PARA_LEANDRO
  blocker: null
  next_action: "<verbo + atividade concreta>"
```

### Estados permitidos

| Estado | Quando usar | Marcar checkbox? |
|---|---|---|
| `PLANEJADO` | Apenas planejado, não executado | Não |
| `EM_EXECUCAO` | Trabalho real iniciado e identificado | Não |
| `BLOQUEADO` | Dependência externa, risco ou falha não resolvida | Não |
| `EM_REVISAO` | PR/testes concluídos, aguardando revisão | Não |
| `GATE_PENDENTE` | Evidência preparada, decisão aplicável pendente | Não |
| `VALIDADO` | Critério do item atendido, verificado e referenciado | **Sim** |
| `ENTREGUE` | Fase encerrada segundo protocolo, com PRF e gate | Sim para itens fechados |

## Regras de reconciliação

1. Ler estado atual da Issue antes de escrever, para não sobrescrever atualização concorrente.
2. Associar o item ao hash/artefato real; CI sem PR/commit correspondente não muda aceite.
3. Adicionar evidência nova e preservar histórico em comentário; não apagar achados bloqueantes sem justificativa.
4. Em teste falho, reabrir item `[ ]` caso a evidência anterior tenha sido invalidada e registrar CAF.
5. Para links GitHub, usar issue/PR reais, SHAs exatos e checks da revisão corrente.
6. Para o sistema local, usar somente artefatos sanitizados; não enviar credenciais nem URLs de token efêmero, fotos privadas ou transcrições sem necessidade.
7. Encerrar fase apenas após teste/smoke, PRF, auditoria Emily, gate LÉO e checkpoint de Miriam/Carmem quando aplicáveis.
8. `HUMAN_GATE` permanece reservado ao LEANDRO nos gatilhos do protocolo oficial, inclusive custo material, exposição pública e efeitos irreversíveis.

## Requisitos do sincronizador F0.7 (roadmap, ainda não implementado)

- GitHub App/Action com `issues:write` escopado à Issue e leitura restrita de PR/workflow, sem alteração de código nem deploy.
- Consumo de eventos `pull_request`, `check_suite`, `workflow_run` e comentários/gates que realmente possuam evidence refs.
- Emissões de **propostas** de mudança quando não houver gate; só `[x]` após evidência validada e decisão de autoridade compatível.
- Operações idempotentes e `expected_head_sha`/versão da Issue antes de editar para prevenir perda de edição humana.
- Audit trail com `event_id`, `source_sha`, `item_id`, `checked_by`, `evidence_refs` e diffs.
- Testes negativos: resultado stale, CI de outro branch, PR reaberto, gate bloqueado, receipt inválido, commit rebaseado, falha de rede após update e ação duplicada.
- Segredos do sincronizador apenas em armazenamento oficial; nenhuma chave de Gemini no workflow.
- **Aceite de F0.7:** automação testada em dry-run e revisão de segurança, sem falsos positivos em casos adversariais; ativação guardada por gate.

## Contratos de fase e documentos

O `ROADMAP.md` contém objetivos e dependências; os artefatos da fase Class C ficam em `artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-XX/`, incluindo:

- `PLAN` — objetivo, baseline, risco, autorização;
- `REPORT` — execução cronológica ESEV/CAF, decisões e achados;
- `VALIDATION` e `VALIDATION-FULL` — resumo/log sanitizado;
- `SMOKE` — evidência end-to-end ou NAO_APLICAVEL justificado;
- `CHECKPOINT` — estado/handoff;
- `DECISIONS` — auditoria Emily, gate LÉO, escalonamento LEANDRO se aplicável;
- `MANIFEST.sha256` — integridade do pacote;
- `README` — ordem de leitura.

**O ato de criar a Issue e a documentação não encerra F0.** A missão permanece PLANEJADO até que baseline e governança sejam verificadas.

## Links de controle

- [Issue canônica e checkboxes](https://github.com/leon337/multiagent-collaboration-framework/issues/527)
- [Política de modelos Google do MCF](../../operations/MCF-GOOGLE-MODEL-ROUTING.md)
- [Protocolo operacional de agentes](../../protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md)
