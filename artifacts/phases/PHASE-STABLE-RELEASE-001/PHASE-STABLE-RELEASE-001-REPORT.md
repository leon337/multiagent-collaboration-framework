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
publication_P2_count: 2
critical_findings: 0
high_findings: 0
stable_v1_0_0: NAO_PUBLICADA
HUMAN_GATE: NAO_APROVADO
READY_FOR_HUMAN_GATE: false
```

## Arquitetura vigente

`IMMUTABLE_PUBLISHER_SEPARATE_HUMAN_GATE_REF`

- publisher: `refs/heads/release/v1.0.0-stable-publish`;
- approval ref: `refs/heads/release/v1.0.0-human-gate`;
- approval initial commit: `ec1e2c33ee476cf03f2b698c86eae447978a07c8`, `NAO_APROVADO`;
- stable: `refs/tags/v1.0.0`;
- control-lock: `refs/tags/mcf-control/v1.0.0`.

O publisher não armazena mais HUMAN_GATE mutável. O receipt futuro deve ser commit GitHub Web verificado por LEANDRO e vincular release, RC3 e SHA exato do publisher.

A validação do receipt compara Base64 do conteúdo GitHub sem decodificar para command substitution, preservando a distinção entre newline terminal correto, newline ausente e linhas em branco extras.

## Consumo e recovery

A autorização futura é consumida por `git push --atomic` + lease da approval ref, avançando essa ref e criando control-lock + stable RC3 sem mover o publisher. Revogação antes do consumo faz o lease falhar e nenhuma tag é criada.

O lock vincula publisher SHA + approval commit + RC3. Recovery só é permitido para o mesmo publisher SHA e sob proteção server-side válida.

## Requirement antigo superseded

`branch ruleset + file_path_restriction` permanece registrado como **SUPERSEDED**. O desenho vigente usa whole-branch immutability do publisher e não depende de Push Ruleset, private/internal, plano pago ou organização.

## Rulesets mínimos ainda necessários

1. **Tag ruleset:** `refs/tags/v1.0.0` + `refs/tags/mcf-control/v1.0.0`, active, `update` + `deletion`, **sem `creation`**, zero bypass/exclusions.
2. **Publisher branch ruleset:** `refs/heads/release/v1.0.0-stable-publish`, active, `update` + `deletion`, zero bypass/exclusions.

A regra `creation` é explicitamente incompatível com o tag ruleset porque bloquearia a criação inicial das publication tags sem bypass.

GitHub live continua `repository_rulesets=[]`; o Stable Gate permanece fail-closed.

## Evidência técnica após os dois P2 do review

```yaml
reference_technical_head: 6abb7c88e096c25c45d8457560907846affb57f6
stable_publication_gate_run: 31770534991
receipt_tests: PASS_10
ruleset_tests: PASS_11
atomic_git_real_tests: PASS_3
state_machine_tests: PASS_20
total_self_tests: PASS_44
stable_gate_result: EXPECTED_FAILURE_MISSING_SERVER_SIDE_PROTECTION
authorize_publication: SKIPPED
publish_stable: SKIPPED
```

Os novos testes rejeitam bytes finais divergentes tanto no receipt aprovado quanto no pai e rejeitam tag ruleset com `creation`.

## Findings materiais

### P1 — stable/control-lock refs
`PRRT_kwDOTnz-ks6ZHcv4`: aberto até tag ruleset real + prova live.

### P1 — publisher imutável
`PRRT_kwDOTnz-ks6ZJdRe`: redesigned/testado, pendente review terminal + publisher branch ruleset real/prova live.

### P2 — exact receipt bytes
`discussion_r3781129491`: `CORRECTED_TESTED_PENDING_TERMINAL_REVIEW`.

### P2 — tag ruleset creation
`discussion_r3781129494`: `CORRECTED_TESTED_PENDING_TERMINAL_REVIEW`.

## Evidência terminal

O HEAD final, runs e review independente serão registrados externamente no PR #133/Issue #131. Após review limpo, os P2 podem ser formalmente resolvidos sem novo commit; P1 permanece diferente de zero até prova server-side real.

## Auditoria

```yaml
AUGUSTO_TRACE: NOT_RUN
JULIA_CLASS_C: NOT_RUN
EMILY_AUDIT: NOT_RUN
LEO_GATE: NOT_RUN
AUDIT: BLOCKED_BY_PUBLICATION_P1
```

Nenhum conteúdo deste relatório autoriza merge, tag, Release, `latest`, ruleset ou publicação.
