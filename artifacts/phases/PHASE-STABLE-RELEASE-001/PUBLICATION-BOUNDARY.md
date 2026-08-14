# MCF v1.0.0 — Publication Boundary

**Missão:** `MCF-STABLE-RELEASE-001`  
**Issue:** #131  
**PR:** #133  
**Macroestado:** `CORRECTING / BLOCKED_BY_SERVER_SIDE_PUBLICATION_PROTECTION`  
**HUMAN_GATE:** NÃO APROVADO  
**Stable `v1.0.0`:** NÃO PUBLICADA

## Invariantes

RC1, RC2 e RC3 permanecem preservadas. O candidato estável continua exclusivamente `v1.0.0-RC3@7f741e10d0e745a90c732e084400b11e3f5e6794`. `main` permanece nesse mesmo SHA durante este boundary. PR #133 é somente control plane; nenhuma CI, review ou documentação constitui aprovação humana.

## Proteção server-side obrigatória

Antes de qualquer autorização/publicação o GitHub deve comprovar simultaneamente:

1. ruleset de tags ativo para `refs/tags/v1.0.0` e `refs/tags/mcf-control/v1.0.0`, com `update` + `deletion`, zero bypass e zero exclusions;
2. ruleset do control branch `refs/heads/release/v1.0.0-stable-publish`, ativo, zero bypass/exclusions e impedindo mudanças em `.github/workflows/**/*` e `scripts/**/*`.

O GitHub live ainda retorna `rulesets=[]`; portanto `server_side_publication_protection=MISSING_BLOCKER` e o Stable Publication Gate deve falhar antes de `authorize-publication`/`publish-stable`.

## Findings materiais

```yaml
P0: 0
P1: 3
P2: 3
CRITICAL: 0
HIGH: 0
```

### P1
- `PRRT_kwDOTnz-ks6ZHcv4`: proteção real das stable/control-lock refs — `OPEN_EXTERNAL_CONFIGURATION_BLOCKER`.
- `PRRT_kwDOTnz-ks6ZHxY7`: exclusions de ruleset rejeitadas fail-closed — `CORRECTED_TESTED_PENDING_INDEPENDENT_REVIEW`.
- `PRRT_kwDOTnz-ks6ZJdRe`: recovery consumido deve executar somente control-plane code protegido — `CORRECTED_TESTED_PENDING_SERVER_SIDE_CONFIGURATION_AND_INDEPENDENT_REVIEW`.

### P2
- `PRRT_kwDOTnz-ks6ZHxY8`: consumed authority é avaliada antes de metadados mutáveis — `CORRECTED_TESTED_PENDING_INDEPENDENT_REVIEW`.
- `PRRT_kwDOTnz-ks6ZHxY-`: Stable Gate falha sem proteção server-side — `CORRECTED_TESTED_PENDING_INDEPENDENT_REVIEW`.
- `PRRT_kwDOTnz-ks6ZJdRg`: NOOP/recovery valida Release completa e `latest` — `CORRECTED_TESTED_PENDING_INDEPENDENT_REVIEW`.

## Boundary de consumo

A autorização direta futura é consumida por uma transação Git `--atomic` que avança o control branch para um commit-lock não-noop e estabelece as refs de publicação. A mesma transação usa `--force-with-lease` no HEAD aprovado. Após o consumo, a Release só pode ocorrer em execução posterior e depende das refs consumidas + proteções server-side reais.

## Recovery

Estados incompatíveis permanecem fail-closed. Exact RC3 tag sem Release pode entrar em adoção apenas sob autorização direta ainda válida e proteção server-side; refs consumidas/protegidas permitem recovery posterior. Existing Release só é NOOP se tag, target RC3, draft/prerelease, título, body e `releases/latest` forem todos exatos.

## Evidência técnica atual

```yaml
technical_head: a2841407d07165ac9a4573f3db98e3e8788e9b5b
stable_publication_gate_run: 31766055608
stable_publication_gate: EXPECTED_FAILURE_MISSING_SERVER_SIDE_PROTECTION
receipt_tests: PASS_4
server_side_protection_tests: PASS_9
atomic_git_real_tests: PASS_3
state_machine_tests: PASS_14
self_tests_total: PASS_30
authorize_publication: SKIPPED
publish_stable: SKIPPED
documentation_validation_run: 31766055514
documentation_validation: PASS
```

## Estado de gates

```yaml
AUDIT: BLOCKED_BY_PUBLICATION_P1
LEO_GATE: BLOCKED_BY_PUBLICATION_P1
HUMAN_GATE: NAO_APROVADO
READY_FOR_HUMAN_GATE: false
stable_v1_0_0: NAO_PUBLICADA
publication_authorized: false
```

Nenhum P1/P2 será zerado e nenhum thread será resolvido antes da cadeia `ACHADO → CORREÇÃO → TESTE → EVIDÊNCIA → REVISÃO INDEPENDENTE DO HEAD EXATO → RESOLUÇÃO`.

Nenhum conteúdo deste documento autoriza merge, tag, Release, `latest` ou publicação.
