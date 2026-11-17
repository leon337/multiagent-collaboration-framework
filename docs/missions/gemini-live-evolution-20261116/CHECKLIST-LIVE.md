# Checklist vivo — contrato de operação e evidências

**Missão:** `MCF-GEMINI-LIVE-EVOLUTION-20261116-001`
**Board único e editável:** [GitHub Issue #527](https://github.com/leon337/multiagent-collaboration-framework/issues/527)
**Roadmap:** [ROADMAP.md](./ROADMAP.md)
**Estado vigente:** ler a Issue e as evidências live; este documento **não é** um espelho estático do checklist.

## Checkpoint vigente para recuperação fria (17/11/2026)

O único checklist com caixas selecionáveis permanece a [Issue #527](https://github.com/leon337/multiagent-collaboration-framework/issues/527). O desenvolvimento local avançou às F1/F2/F3 **sem aprovação automática dos gates anteriores**. Estado técnico verificado, refs exatas, PRs divergentes e próximo ciclo: [SESSION-CONTINUITY-CURRENT.md](./SESSION-CONTINUITY-CURRENT.md) · [JSON de reconciliação](./STATE-RECONCILIATION-20261117.json).

O repositório foi reconciliado com `main e5c0abf`, F0 `b573121`, F1 `8cffb50`, F2 `4579c35` e F3 `5e0118b`; todos iguais aos HEADs remotos observados. Corrigidas por fast-forward as referências locais de main/F0/F1. As 15 alterações WIP de F1 foram preservadas no remoto `wip/gemini-live-f1-response-20261117` (`142cd99`). Não houve merge para main nem deploy público.

F3 é piloto **local** com Playwright MCP, leitura de HTTPS público mediante permissão humana, voz opcional com desafio de quatro dígitos e isolamento da mídia durante autorização; escrita só em TodoMVC. Reexecução: **118/118 Node**, voz 8/8 Chrome mock, interface 9/9 Chrome, MCP real 2/2 (resultados históricos por mídia apropriada); microfone físico não testado. PR #540 e PR #544 **divergem**, não confundir a PR #544 baseada em main com a versão atual do assistente que usa voz.

F0.8, F1.6, F2.6, F3.7 e F4.6 permanecem abertos. Não marcar checkboxes por CI, reviews externas não autenticadas ou simples funcionamento do staging. `Origin` e voz não constituem HDF, e faltam sandbox real de rede e gate de segurança para exposição pública.

## O que significa "vivo" nesta missão

- **Já operacional:** a Issue #527 contém tarefas `- [ ]` clicáveis no GitHub, com IDs estáveis `F0.1` a `F4.6`, que podem ser editadas e vinculadas a comentários, PRs, testes, SHAs, receipts e decisões.
- **Atualização humana/agêntica governada:** a cada PR, falha, evidência, gate ou decisão, o responsável atualiza a Issue com status e referências. A atualização deve ocorrer durante o mesmo ciclo de execução, não só em um resumo retrospectivo.
- **Implementação técnica parcial de F0.7:** script `ops/gemini-live/checklist-sync.mjs` (dry-run por padrão), agora 21/21 testes, revalidação de HEAD/paginação/reconciliação de POST, e workflow com publicação de comentário somente por opt-in. **Não está habilitado em main nem cobre todos os eventos e gates do roadmap**. Nunca marca `[x]` por CI verde.
- **Regra de veracidade:** o campo marcado indica `VALIDADO` e evidência vinculada. Um item em execução continua desmarcado e recebe comentário `EM_EXECUCAO`.
- **Sem duplicação:** não manter um segundo checklist com progresso contraditório em arquivos Markdown/JSON/Notion.

## Registro histórico de 2026-11-16 (superado pelo checkpoint acima)

- Parecer externo Codex CLI sobre SHA `6a714e4`: **RETORNAR_PARA_CORRECAO**; a auditoria sob contrato Emily não representa identidade/canal nativo autenticado.
- Issue #527 reabriu F0.2–F0.7 (`EM_CORRECAO`) pela ausência inicial de evidência primária; somente F0.1 permanece validado na Issue até reteste independente.
- E2E local prévio: 15/15 PASS em mídia sintética; segurança: 12 PASS/3 gaps conhecidos. **Não confundir com validação de dispositivo físico.**
- Resposta às correções: fonte e JSONs sanitizados em `artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-00/repro/`; 21 testes de sync e 9 de telemetria passaram localmente, CI de verificação também passou.
- PRF original permanece com manifest SHA-256 8/8; adendo de correção separado. Gate oficial Emily/LÉO **não executado**.
- A rotação da chave anteriormente compartilhada não foi comprovada; nenhum merge ou deploy de produção autorizado.
- A Issue #527 continua a única fonte de verdade para os checkboxes, e pode conter atualizações posteriores.

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

- GitHub Action com `issues:write` no job opt-in e lógica de postagem limitada à Issue #527 (o token GitHub não permite restringir permissão por Issue).
- `pull_request` atualmente dispara testes; publicação de sinais exige `workflow_dispatch` com opt-in. Consumo de `check_suite`, `workflow_run`, recibos/auditorias permanece **fora do MVP atual**, sem aprovação do escopo reduzido.
- Emissões de **propostas** de mudança quando não houver gate; só `[x]` após evidência validada e decisão de autoridade compatível.
- Operações de comentário idempotentes por hash do conjunto de checks e rechecagem de SHA do PR. **Não há edição do corpo da Issue pelo sincronizador**; controle de concorrência de edição do corpo não se aplica.
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

**O ato de criar a Issue e a documentação não encerra F0 nem concede gates.** A engenharia local F1/F2/F3 está em andamento com os checkboxes canônicos ainda abertos.

## Links de controle

- [Issue canônica e checkboxes](https://github.com/leon337/multiagent-collaboration-framework/issues/527)
- [Política de modelos Google do MCF](../../operations/MCF-GOOGLE-MODEL-ROUTING.md)
- [Protocolo operacional de agentes](../../protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md)
