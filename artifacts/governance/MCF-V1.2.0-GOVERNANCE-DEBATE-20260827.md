# MCF v1.2.0 — Consolidação do Debate de Governança

```yaml
artifact: MCF_V1_2_0_GOVERNANCE_DEBATE
status: CONSOLIDATED
date: 2026-08-27
panel:
  - LEO
  - BEATRIZ
  - RENATO
  - AUGUSTO
  - EMILY
coordinator: Mestre
human_authority: Leandro
```

## Questão inicial

Oficializar o comportamento observado quando Leandro emitiu `humano no controle`: interrupção imediata, preservação de estado, checkpoint e espera por retomada explícita.

## Pareceres independentes iniciais

| Papel | Veredito | SemVer inicial | Release imediata |
|---|---|---|---|
| LÉO | ADOPT | v1.1.1 | YES |
| Beatriz | ADOPT | v1.2.0 | YES com condições documentais |
| Renato | ADOPT_WITH_CONDITIONS | v1.1.1 | NO antes de testes/enforcement coerente |
| Augusto | ADOPT_WITH_CONDITIONS | v1.2.0 se capacidade observável | NO antes de testes |
| Emily | ADOPT_WITH_CONDITIONS | v1.1.1 | NO antes de regressão/retomada |

Não houve consenso artificial. O desacordo central era se `HUMANO NO CONTROLE` isoladamente constituía patch de segurança ou feature minor.

## Condições materiais levantadas

- precedência absoluta do gate sobre TEAM_FIRST e autorização anterior;
- normalização do comando sem disparar falsos positivos em citações/logs;
- preservação do estado e retomada explícita;
- auditabilidade do checkpoint;
- não alegar enforcement no MissionRuntime quando a API correspondente não existe;
- testes de regressão antes da publicação.

## Novo achado validado em campo

Após o debate inicial, Leandro explicitou que o comportamento esperado inclui trabalho **visível e auditável**. O Mestre:

1. abriu terminais/painéis visíveis no desktop;
2. declarou que as ações reais vinham de SentinelX/automação, sem fingir digitação manual;
3. organizou ChatGPT em modo app junto ao terminal;
4. sob autorização, digitou `hello word` sem enviar;
5. repetiu e enviou `hello word`;
6. o texto chegou ao chat como novo turno, fechando o round-trip.

Leandro então confirmou que esse era o alinhamento comportamental que buscava e ordenou sua incorporação à nova release.

## Resolução de SemVer

A candidata deixa de ser apenas um refinamento do HDF. Ela passa a incluir:

- Human Control Gate formal;
- Visible Copresence;
- operação de GUI autorizada como superfície governada;
- obrigação de verdade sobre o mecanismo de automação;
- testes específicos de GUI/auditabilidade.

Isso é uma **capacidade nova retrocompatível**, portanto a consolidação adota **v1.2.0**.

## Limitação preservada

O `MissionRuntime` de referência continua sem API genérica persistente de pause/resume por mensagem textual humana. A decisão é normativa/operacional para agentes e superfícies autorizadas; enforcement universal dentro de processos do runtime não é alegado.

## Gate de publicação

```yaml
candidate_semver: v1.2.0
human_authorization_to_main_and_release: GRANTED_BY_LEANDRO
publication_conditions:
  - exact_candidate_validation_pass
  - repository_regression_suite_pass
  - no_critical_or_high_blocker
  - exact_head_preserved_through_merge
```
