# PHASE-006-LOT-4-D-DEBUG-INCIDENT — Decisions

## D1 — GitHub vence o checkpoint transferido

O início da missão revalidou `main`, Issue `#103`, registry, protocolo, runtime plan e encerramento do Lot 4-C. Não foi encontrada divergência material, branch ou PR pré-existente do Lot 4-D.

## D2 — Planner usa Patricia como primary owner

O contrato canônico registra Patricia, Bruno e Rafael como owners e Patricia como domínio primário. O planner, portanto, roteia a skill para Patricia e preserva handoff para Renato.

## D3 — READY_AGENT, nunca auto-completion pelo bridge

`MCF-DEBUG-INCIDENT` usa provider interno, mas não é uma operação de bootstrap. O planner marca a fase como `READY_AGENT`; o bridge executa somente as capacidades internas de bootstrap já autorizadas.

## D4 — SCOPED_WRITE permanece canônico

O Lot 4-D não altera o `permission_profile` do registry. O `PermissionEngine` acrescenta um boundary específico para a skill e não torna a política global mais permissiva.

## D5 — Internal-only no Lot 4-D

A única combinação autorizada é:

```text
internal / inspect-debug-incident / mcf-agent-runtime
```

Qualquer provider externo, escrita GitHub, mutação de ambiente, deploy, ação de produção, destructive fix, acesso a segredo, ação pública ou blind retry permanece fora do boundary.

## D6 — Evidência semântica é estruturada

Foi adotada estrutura que obriga conteúdo verificável:

- reproduction: `symptom`, `method`, `evidence_reference`;
- root_cause: `cause`, `supporting_evidence`;
- recovery_result: `action_or_mitigation`, `verification`, `blind_retry: false`, `regression_test_added`.

Strings vazias, whitespace, placeholders, objetos vazios e booleanos usados como evidência não autorizam sucesso.

## D7 — Evidência insuficiente recupera, não fabrica sucesso

Falha semântica retorna `RECOVERING`, `handoffTo: null` e não produz `PHASE_COMPLETED` nem handoff de sucesso.

## D8 — CAF de formatação preservado no trace

O SHA `3ea30e9aadac9600b701902f14d08a3881251692` falhou no Foundation run `31476698797`. Um SHA diagnóstico temporário `81c1f1c9ad58a895db02b70b0dafec5e7ba9349d` foi usado somente para obter o diff exato do Prettier e nunca será tratado como candidato. O candidato corrigido `933c8f72dd19219eea6112adfdd8db7c43112f2c` passou Foundation e Container Smoke.

## D9 — Evidência pré-PRF não vale como gate do PRF

Os runs do candidato `933c8f72...` ficam registrados como pré-PRF. A criação do PRF altera o HEAD; por isso Foundation, Container Smoke, manifesto, reviews, auditoria e gate serão vinculados ao novo SHA exato.

## D10 — Nenhum HUMAN_GATE nesta fase

Não surgiu gatilho reservado a LEANDRO. `human_operator_actions` permanece `0`; questões técnicas seguem `TEAM_FIRST`.
