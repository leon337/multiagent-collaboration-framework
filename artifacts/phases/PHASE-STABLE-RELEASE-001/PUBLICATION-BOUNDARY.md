# MCF v1.0.0 — Publication Boundary

**Missão:** `MCF-STABLE-RELEASE-001`  
**Issue:** #131  
**PR:** #133  
**Macroestado:** `CORRECTING / IMMUTABLE_PUBLISHER_SEPARATE_HUMAN_GATE_REF`  
**HUMAN_GATE:** NÃO APROVADO  
**Stable `v1.0.0`:** NÃO PUBLICADA

## Invariantes

RC1, RC2 e RC3 permanecem preservadas. O candidato estável continua exclusivamente `v1.0.0-RC3@7f741e10d0e745a90c732e084400b11e3f5e6794`. `main` permanece nesse mesmo SHA durante este boundary. PR #133 é somente publication control plane; PR #134 permanece aberto e não deve ser mergeado antes deste boundary.

## Arquitetura vigente

```yaml
architecture: IMMUTABLE_PUBLISHER_SEPARATE_HUMAN_GATE_REF
publisher_ref: refs/heads/release/v1.0.0-stable-publish
approval_ref: refs/heads/release/v1.0.0-human-gate
stable_ref: refs/tags/v1.0.0
control_lock_ref: refs/tags/mcf-control/v1.0.0
```

O publisher contém workflow/scripts/lógica de publicação e não contém mais o receipt humano mutável. A approval ref separada contém apenas `LEANDRO-HUMAN-GATE.yaml` e foi inicializada em `NAO_APROVADO` no commit `ec1e2c33ee476cf03f2b698c86eae447978a07c8`.

Um receipt aprovado futuro deve ser commit GitHub Web verificado por LEANDRO e vincular explicitamente `release: v1.0.0`, `approved_publisher_head: <SHA EXATO>` e RC3 `7f741e10...`.

## Boundary de consumo

A primeira execução autorizada futura não move o publisher. Ela consome a approval ref por `git push --atomic` + `--force-with-lease` e estabelece, all-or-none:

- avanço de `release/v1.0.0-human-gate` para commit-lock;
- `mcf-control/v1.0.0` no mesmo lock;
- `v1.0.0 -> RC3`, se a stable tag ainda estiver ausente.

Se a approval ref mudar ou for revogada entre leitura e mutação, o lease falha e nenhuma tag é criada.

O commit-lock registra o publisher SHA aprovado. O publisher branch permanece inalterado durante consumo.

## Recovery

Após consumo, recovery exige:

- stable tag exata em RC3;
- control-lock válido;
- mesmo publisher SHA codificado no lock;
- publisher branch live ainda no mesmo SHA;
- proteção server-side ativa.

Recovery com publisher diferente é fail-closed. A approval ref posterior ao consumo não transfere autoridade para outro publisher. O modelo operacional é re-run do workflow run associado ao mesmo publisher SHA.

Existing Release só é NOOP se tag, target RC3, draft/prerelease, título/body e `releases/latest` forem todos exatos.

## Requirement anterior superseded

O desenho anterior de `branch ruleset + file_path_restriction` foi **SUPERSEDED** após a análise de capacidades do GitHub para o repositório público atual. A propriedade de segurança foi preservada congelando a branch inteira do publisher e separando o HUMAN_GATE em outra ref.

Não há requisito de Push Ruleset, private/internal, plano pago ou organização neste desenho.

## Proteção server-side mínima

Antes de qualquer publicação devem existir e ser comprovados no GitHub live:

1. tag ruleset ativo para `refs/tags/v1.0.0` e `refs/tags/mcf-control/v1.0.0`, com `update` + `deletion`, zero bypass e zero exclusions;
2. branch ruleset ativo para `refs/heads/release/v1.0.0-stable-publish`, com `update` + `deletion`, zero bypass e zero exclusions.

Não é exigida file-path restriction.

Como `repository_rulesets=[]` no estado live atual, o Stable Publication Gate deve falhar antes de `authorize-publication`/`publish-stable`.

## Findings materiais

```yaml
P0: 0
P1: 2
P2: 0
CRITICAL: 0
HIGH: 0
```

### P1
- `PRRT_kwDOTnz-ks6ZHcv4`: tag ruleset real das stable/control-lock refs — `OPEN_EXTERNAL_CONFIGURATION_BLOCKER`.
- `PRRT_kwDOTnz-ks6ZJdRe`: publisher imutável server-side — código redesenhado/testado, antigo path restriction superseded; `CORRECTED_TESTED_PENDING_TERMINAL_REVIEW_AND_SERVER_SIDE_PROOF`.

## Testes dedicados

```yaml
reference_technical_head: 11d9b4c828e03ca49a55b1c7da0c0398b230739c
stable_publication_gate_run: 31769606221
receipt_tests: PASS_6
ruleset_tests: PASS_10
atomic_git_real_tests: PASS_3
state_machine_tests: PASS_20
self_tests_total: PASS_39
expected_without_rulesets: FAIL_CLOSED
publish_stable: SKIPPED
```

Esse snapshot é técnico e não terminal. O HEAD final, seus runs e revisão independente serão registrados externamente no PR #133/Issue #131 depois de congelar o HEAD.

## Estado de gates

```yaml
AUDIT: BLOCKED_BY_PUBLICATION_P1
LEO_GATE: BLOCKED_BY_PUBLICATION_P1
HUMAN_GATE: NAO_APROVADO
READY_FOR_HUMAN_GATE: false
stable_v1_0_0: NAO_PUBLICADA
publication_authorized: false
```

Nenhum P1 será zerado sem `ACHADO → CORREÇÃO → TESTE → EVIDÊNCIA → REVISÃO INDEPENDENTE DO HEAD EXATO → RESOLUÇÃO` e prova server-side real quando aplicável.

Nenhum conteúdo deste documento autoriza merge, tag, Release, `latest` ou publicação.
