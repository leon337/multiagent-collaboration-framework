# PHASE-006-LOT-4-D-DEBUG-INCIDENT — Decisions

## D1 — GitHub como fonte de verdade

A retomada validou `main`, Issue #103, registry, protocolo e encerramento do Lot 4-C antes de criar trabalho novo.

## D2 — Ownership canônico

Patricia é primary owner; Bruno e Rafael também são owners válidos; Renato recebe handoff somente após sucesso válido.

## D3 — READY_AGENT

`MCF-DEBUG-INCIDENT` usa provider interno, mas não é bootstrap. O bridge não a auto-completa.

## D4 — SCOPED_WRITE preservado

O perfil canônico não foi reduzido nem ampliado. O Lot 4-D aplica boundary internal-only específico e não relaxa o `PermissionEngine` global.

## D5 — Evidência semântica

Reprodução, causa raiz e recuperação precisam de conteúdo significativo. Booleano, placeholder, vazio, whitespace e objeto vazio não substituem evidência.

## D6 — Ausência de blind retry precisa ser demonstrada

`blind_retry: false` é declaração complementar. `retry_evidence` semântico independente é obrigatório.

## D7 — Evidência insuficiente recupera

Falha semântica leva a `RECOVERING`, sem `PHASE_COMPLETED` e sem handoff de sucesso.

## D8 — CAF #1 visível

Falha de formatação foi capturada, diagnosticada com SHA não-candidato, corrigida e revalidada.

## D9 — CAF #2 bloqueou gate verde

O primeiro PRF tinha CI verde, mas Vinicius encontrou a lacuna de evidência de retry. O gate foi bloqueado, o código mudou e todo CI/review anterior virou histórico superseded.

## D10 — CAF #3 protege routing de segurança

Termos genéricos `incidente/incident` deixaram de disparar Debug Incident. Security review explícito continua em Ricardo e Classe C.

## D11 — Limitação de conector não gera HUMAN_GATE

Quando a substituição completa do planner foi bloqueada antes de chegar ao GitHub, a equipe usou blob/tree/commit/ref fast-forward, sem force-push e sem transferir trabalho técnico para Leandro.

## D12 — Gate por SHA exato

Foundation, Smoke, manifest audit, reviews, auditoria e gate finais pertencem ao candidato `dccb41f146f5701f75d8762df89160bf2f1695a7`.

## D13 — Merge técnico protegido

PR #104 foi mesclado por squash somente após rechecagem base/head e `expected_head_sha` exato.

## D14 — Equivalência de tree obrigatória

Candidato e merge técnico compartilham a tree `39d2cd29b5990d4261e23655c272691c8a60b4e7`; equivalência `PASS`.

## D15 — Sync documental separado

A documentação canônica não foi misturada ao PR técnico. Branch dedicada parte do merge técnico `94d8944c25ac26df3facb4f343a7a75c2489d704`.

## D16 — Estado canônico alvo

Após o merge documental:

```yaml
skills_registered: 16
skills_executable: 15
skills_documental: 1
remaining_documental:
  - MCF-CLOSE-PHASE
```

`MCF-CLOSE-PHASE` não é implementada pelo Lot 4-D.

## D17 — Issue #103 só fecha após documentação

O merge técnico não encerrou a Issue. O fechamento só é autorizado depois de validação documental, gate documental, merge protegido e prova de equivalência do sync.

## D18 — Limites externos continuam bloqueados

Produção permanece bloqueada, live staging adapter desabilitado e Gate C real provider write não autorizado.

## D19 — Sem HUMAN_GATE

Nenhum gatilho reservado surgiu durante o Lot 4-D. `human_operator_actions=0`.
