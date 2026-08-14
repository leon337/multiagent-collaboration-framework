# MCF v1.0.0 — Publication Boundary

**Missão:** `MCF-STABLE-RELEASE-001`  
**Issue:** #131  
**PR:** #133  
**Macroestado:** `CORRECTING / IMMUTABLE_PUBLISHER_SEPARATE_HUMAN_GATE_REF`  
**HUMAN_GATE:** NÃO APROVADO  
**Stable `v1.0.0`:** NÃO PUBLICADA

## Invariantes

RC1, RC2 e RC3 permanecem preservadas. O candidato estável continua exclusivamente `v1.0.0-RC3@7f741e10d0e745a90c732e084400b11e3f5e6794`. `main` permanece nesse mesmo SHA durante este boundary. PR #133 é somente publication control plane; PR #134 permanece aberto/não mergeado.

## Arquitetura vigente

```yaml
architecture: IMMUTABLE_PUBLISHER_SEPARATE_HUMAN_GATE_REF
publisher_ref: refs/heads/release/v1.0.0-stable-publish
approval_ref: refs/heads/release/v1.0.0-human-gate
stable_ref: refs/tags/v1.0.0
control_lock_ref: refs/tags/mcf-control/v1.0.0
```

A approval ref foi inicializada com `NAO_APROVADO` em `ec1e2c33ee476cf03f2b698c86eae447978a07c8`. O publisher não contém mais receipt mutável.

Um receipt aprovado futuro exige commit GitHub Web verificado por LEANDRO, arquivo único e bytes exatos, incluindo newline terminal, vinculando `v1.0.0`, RC3 e o SHA exato do publisher.

## Consumo da autoridade

A primeira execução autorizada futura não move o publisher. Ela usa `git push --atomic` + `--force-with-lease` sobre a approval ref e estabelece all-or-none:

- avanço da approval ref para commit-lock;
- `mcf-control/v1.0.0` no mesmo lock;
- `v1.0.0 -> RC3`, se ausente.

Mudança/revogação da approval ref antes da mutação invalida o lease e nenhuma tag é criada.

## Recovery

Recovery exige stable tag RC3, control-lock válido, proteção server-side e o mesmo publisher SHA registrado no lock. Recovery com publisher diferente é fail-closed. Existing Release só é NOOP se tag, target RC3, draft/prerelease, título/body e `latest` forem exatos.

## Requirement anterior superseded

`branch ruleset + file_path_restriction` é **SUPERSEDED**. O desenho atual congela a branch inteira do publisher e separa o HUMAN_GATE. Não há requirement de Push Ruleset, private/internal, plano pago ou organização.

## Proteção server-side mínima

1. Tag ruleset ativo para `refs/tags/v1.0.0` e `refs/tags/mcf-control/v1.0.0`, com `update` + `deletion`, **sem `creation`**, zero bypass e zero exclusions.
2. Branch ruleset ativo para `refs/heads/release/v1.0.0-stable-publish`, com `update` + `deletion`, zero bypass e zero exclusions.

`creation` é proibida no tag ruleset porque impediria a criação inicial atômica das duas tags quando bypass é zero.

Como `repository_rulesets=[]` no estado live atual, o Stable Publication Gate deve falhar antes de `authorize-publication`/`publish-stable`.

## Findings materiais

```yaml
P0: 0
P1: 2
P2: 2
CRITICAL: 0
HIGH: 0
```

- P1 `PRRT_kwDOTnz-ks6ZHcv4`: tag ruleset real ainda ausente.
- P1 `PRRT_kwDOTnz-ks6ZJdRe`: immutable publisher implementado/testado; pendente review terminal + whole-branch ruleset real.
- P2 `discussion_r3781129491`: exact receipt bytes corrigido/testado, pendente review terminal.
- P2 `discussion_r3781129494`: tag ruleset `creation` corrigido/testado, pendente review terminal.

## Testes dedicados

```yaml
reference_technical_head: 6abb7c88e096c25c45d8457560907846affb57f6
stable_publication_gate_run: 31770534991
receipt_tests: PASS_10
ruleset_tests: PASS_11
atomic_git_real_tests: PASS_3
state_machine_tests: PASS_20
self_tests_total: PASS_44
expected_without_rulesets: FAIL_CLOSED
publish_stable: SKIPPED
```

Esse snapshot é técnico, não terminal. O HEAD final, seus runs e revisão independente serão registrados externamente no PR #133/Issue #131.

## Gates

```yaml
AUDIT: BLOCKED_BY_PUBLICATION_P1
LEO_GATE: BLOCKED_BY_PUBLICATION_P1
HUMAN_GATE: NAO_APROVADO
READY_FOR_HUMAN_GATE: false
stable_v1_0_0: NAO_PUBLICADA
publication_authorized: false
```

Nenhum conteúdo deste documento autoriza merge, tag, Release, `latest`, ruleset ou publicação.
