# PHASE-STABLE-RELEASE-001 — REPORT

## Estado atual

```yaml
mission: MCF-STABLE-RELEASE-001
issue: 131
pr: 133
state: CORRECTING_IMMUTABLE_PUBLISHER_SEPARATE_HUMAN_GATE_REF
main_sha: 7f741e10d0e745a90c732e084400b11e3f5e6794
candidate_sha: 7f741e10d0e745a90c732e084400b11e3f5e6794
publication_P0_count: 0
publication_P1_count: 2
publication_P2_count: 0
critical_findings: 0
high_findings: 0
stable_v1_0_0: NAO_PUBLICADA
HUMAN_GATE: NAO_APROVADO
READY_FOR_HUMAN_GATE: false
```

## Redesenho aplicado

A arquitetura vigente é `IMMUTABLE_PUBLISHER_SEPARATE_HUMAN_GATE_REF`.

### Publisher

`refs/heads/release/v1.0.0-stable-publish` contém o publication control plane e não armazena mais o estado mutável de HUMAN_GATE. Depois de qualificado, o contrato server-side exige imutabilidade da branch inteira por ruleset de branch com `update` + `deletion`, zero bypass e zero exclusions.

### Approval ref

`refs/heads/release/v1.0.0-human-gate` foi criada como ref separada e mínima. Estado inicial:

```yaml
initial_commit: ec1e2c33ee476cf03f2b698c86eae447978a07c8
state: NAO_APROVADO
approved_receipt_created: false
file: LEANDRO-HUMAN-GATE.yaml
```

Um receipt aprovado futuro só é válido se for commit GitHub Web verificado por LEANDRO e vincular `v1.0.0`, o SHA exato do publisher e RC3 `7f741e10...`.

## Consumo all-or-none

O publisher não é mais movido durante consumo. A transação Git atômica usa a approval ref como autoridade mutável:

1. `--force-with-lease` sobre o commit de aprovação em `release/v1.0.0-human-gate`;
2. avanço dessa ref para commit-lock sem mudança de árvore;
3. criação de `mcf-control/v1.0.0` no mesmo lock;
4. criação de `v1.0.0` em RC3 se ausente.

O lock registra `publisher_head`, `approval_commit`, `candidate_sha`, release e approval ref. Se a approval ref for alterada/revogada antes da transação, o lease falha e nenhuma tag é criada.

## Recovery

Recovery por autoridade consumida é permitido somente quando:

- stable tag == RC3;
- control-lock é válido;
- rulesets obrigatórios estão ativos;
- publisher branch live permanece exatamente no SHA codificado no lock e no workflow run.

Depois do consumo, a approval ref pode mudar sem transferir autoridade a publisher posterior. Tentativa de recovery por SHA diferente do publisher aprovado falha.

O modelo operacional previsto usa re-run do workflow run do mesmo publisher SHA. Nenhum HUMAN_GATE aprovado ou mutação stable foi usado nos testes reais desta correção.

## Requirement antigo superseded

O desenho anterior exigia `branch ruleset + file_path_restriction` para congelar `.github/workflows/**/*` e `scripts/**/*`. Esse requirement foi marcado **SUPERSEDED** após análise das capacidades GitHub aplicáveis ao repositório público atual: file-path restriction pertence a Push Rulesets e não é usado no desenho vigente.

A propriedade de segurança não foi reduzida: o publisher inteiro será imutável server-side, enquanto o HUMAN_GATE foi separado em outra ref.

Nenhum plano pago, mudança para private/internal ou organização foi introduzido como dependência.

## Rulesets mínimos ainda necessários

1. Tag ruleset ativo para `refs/tags/v1.0.0` e `refs/tags/mcf-control/v1.0.0`, regras `update` + `deletion`, zero bypass e zero exclusions.
2. Branch ruleset ativo para `refs/heads/release/v1.0.0-stable-publish`, regras `update` + `deletion`, zero bypass e zero exclusions.

O repositório live continua sem rulesets. Portanto o gate deve permanecer vermelho/fail-closed antes de authorization/publication.

## Evidência técnica do redesenho

```yaml
reference_technical_head: 11d9b4c828e03ca49a55b1c7da0c0398b230739c
stable_publication_gate_run: 31769606221
receipt_tests: PASS_6
ruleset_tests: PASS_10
atomic_git_real_tests: PASS_3
state_machine_tests: PASS_20
total_self_tests: PASS_39
stable_gate_result: EXPECTED_FAILURE_MISSING_SERVER_SIDE_PROTECTION
authorize_publication: SKIPPED
publish_stable: SKIPPED
```

Os 39 testes incluem publisher correto/divergente, approval correto/stale/ausente/inválido, revogação antes do consumo, stable ausente/errada/exact-tag-only, control-lock parcial, falha após consumo, re-run após consumo, recovery com publisher diferente, rulesets ausentes, bypass/exclusions e Release recovery/NOOP.

Esse snapshot é histórico técnico; o SHA terminal final e seus run IDs serão registrados externamente depois da reconciliação documental.

## Findings materiais

### P1 — stable/control-lock refs
Thread `PRRT_kwDOTnz-ks6ZHcv4`. Continua aberto até tag ruleset real e prova live.

### P1 — publisher imutável
Thread `PRRT_kwDOTnz-ks6ZJdRe`. O requirement antigo por paths foi superado. O novo desenho foi implementado/testado, mas o P1 continua aberto até review independente do HEAD exato + branch ruleset real do publisher + prova live.

```yaml
P0: 0
P1: 2
P2: 0
```

## Evidência terminal sem autorreferência

O SHA terminal, runs e review do HEAD final serão registrados no PR #133/Issue #131 após congelamento. Este relatório não cria um commit adicional apenas para registrar seu próprio SHA.

## Auditoria terminal

```yaml
AUGUSTO_TRACE: NOT_RUN
JULIA_CLASS_C: NOT_RUN
EMILY_AUDIT: NOT_RUN
LEO_GATE: NOT_RUN
AUDIT: BLOCKED_BY_PUBLICATION_P1
```

A auditoria multiagente só será renovada depois de `P0=0/P1=0`.

## Próxima ação

Concluir reconciliação documental, congelar HEAD, executar CI e re-run no mesmo SHA, obter revisão independente do HEAD exato e somente então retornar as instruções administrativas mínimas de rulesets. Nenhuma configuração humana é solicitada neste relatório.

Nenhum conteúdo deste relatório autoriza merge, tag, Release, `latest` ou publicação.
