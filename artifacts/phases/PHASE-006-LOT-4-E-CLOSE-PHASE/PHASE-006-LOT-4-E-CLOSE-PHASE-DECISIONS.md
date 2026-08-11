# PHASE-006-LOT-4-E-CLOSE-PHASE — Decisions

## D1 — Baseline verificável

A fase parte de `main@39d2a8b3f1c323792fff9cbcc140d5f2bddc1522`, estado pós-closeout completo do Lot 4-D.

## D2 — Conflito de handoff

O registry documental declarava `MCF-CLOSE-PHASE -> handoff_to: Leandro`. O protocolo v1.1 e o Human Delegation Firewall proíbem Leandro como executor técnico ou destinatário de handoff técnico. O contrato candidato reconcilia o handoff para `Mestre` sem reduzir a autoridade humana final de LEANDRO.

## D3 — Boundary interno

O perfil canônico permanece `SCOPED_WRITE`, porém este incremento só aceita:

```text
internal / close-phase / mcf-agent-runtime
```

Não há autoridade nova para GitHub write, deploy, produção, ambiente, segredo, ação destrutiva ou publicação.

## D4 — Verdade do estado terminal

`ENTREGUE` só é evidência válida quando:

- objetivo atendido;
- zero blocker no checkpoint;
- zero finding não resolvido;
- zero finding bloqueante da auditoria independente;
- verdict da auditoria `PASS`/`PASSED`;
- nenhuma próxima ação pendente;
- `human_action_required=false`;
- decisão explícita de Léo é aprovadora;
- decisão e checkpoint concordam sobre o estado final.

## D5 — Leandro não pode ser responsável técnico implícito

`leo_decision.responsible=Leandro` só é semanticamente válido quando a decisão explícita é `ESCALAR_PARA_LEANDRO`. Essa exceção representa HUMAN_GATE dirigido ao humano final, não handoff técnico. A decisão `ESCALAR_PARA_LEANDRO` deve identificar Leandro como responsável; os demais estados não podem fazê-lo silenciosamente.

O `checkpoint_recipient` técnico permanece obrigatoriamente `Mestre`.

## D6 — Bridge não fabrica closeout

`MCF-CLOSE-PHASE` usa `READY_AGENT`, portanto o chat bridge não pode auto-completar o fechamento nem fabricar PRF, auditoria, gate ou checkpoint.

## D7 — CAF sem blind retry

Falhas de bootstrap/formatação/validação foram corrigidas alterando a causa antes da reexecução. O candidato endurecido `fe96cfc74f268d7e548a5c57bdc401b7d269f618` passou Foundation `31485353192`, Container Smoke `31485353179` e Documentation validation `31485353200` no mesmo estado de código.

## D8 — Gate humano

Nenhum gatilho reservado de HUMAN_GATE surgiu neste incremento interno e reversível. `human_operator_actions=0`. Produção e real provider write permanecem bloqueados.