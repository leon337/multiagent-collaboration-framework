# PRF — PHASE-STABLE-RELEASE-001

**Missão:** `MCF-STABLE-RELEASE-001`  
**Issue:** #131  
**PR:** #133  
**Classe:** C  
**Estado:** `CORRECTING / BLOCKED_BY_SERVER_SIDE_PUBLICATION_PROTECTION`  
**Autoridade humana:** LEANDRO  
**HUMAN_GATE:** NÃO APROVADO  
**Stable `v1.0.0`:** NÃO PUBLICADA

## Candidato preservado

```yaml
main_sha: 7f741e10d0e745a90c732e084400b11e3f5e6794
candidate_sha: 7f741e10d0e745a90c732e084400b11e3f5e6794
rc1: v1.0.0-RC1@9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8
rc2: v1.0.0-RC2@d73d936a63cc9462a95bcf481f4b8e1d4b255719
rc3: v1.0.0-RC3@7f741e10d0e745a90c732e084400b11e3f5e6794
stable_v1_0_0: NAO_PUBLICADA
publication_authorized: false
```

PR #133 permanece somente control plane. PR #134 permanece OPEN e não deve ser mergeado antes do fechamento deste boundary.

## Proteção server-side requerida

O boundary exige duas proteções GitHub reais e verificáveis antes de qualquer autorização mutável:

### 1. Ruleset de tags

Aplicável explicitamente a:

- `refs/tags/v1.0.0`;
- `refs/tags/mcf-control/v1.0.0`.

Contrato: `target=tag`, `enforcement=active`, regras `update` + `deletion`, `bypass_actors=[]` e `conditions.ref_name.exclude=[]`.

### 2. Ruleset do control branch

Aplicável explicitamente a `refs/heads/release/v1.0.0-stable-publish`.

Contrato: `target=branch`, `enforcement=active`, `bypass_actors=[]`, `conditions.ref_name.exclude=[]` e restrição server-side de alteração para `.github/workflows/**/*` e `scripts/**/*`. Assim, após a qualificação do control plane, o receipt pode evoluir, mas o código capaz de autorizar/publicar não pode ser substituído por um HEAD posterior não revisado.

O GitHub live ainda retorna `rulesets=[]`. Portanto esta proteção permanece `MISSING_BLOCKER` e o Stable Publication Gate DEVE falhar fechado.

## Findings materiais vigentes

### P1 — proteção server-side das refs de publicação

Thread `PRRT_kwDOTnz-ks6ZHcv4`. A Release só pode ser criada/reconhecida após stable/control-lock refs estarem protegidas contra update/deletion. Estado: `OPEN_EXTERNAL_CONFIGURATION_BLOCKER`.

### P1 — ruleset exclusions

Thread `PRRT_kwDOTnz-ks6ZHxY7`. O predicado rejeita qualquer lista `conditions.ref_name.exclude` não vazia, com fixture negativo dedicado. Estado: `CORRECTED_TESTED_PENDING_INDEPENDENT_REVIEW`.

### P1 — recovery consumido vinculado ao código aprovado

Thread `PRRT_kwDOTnz-ks6ZJdRe`. O recovery por `CONSUMED_PROTECTED` exige agora, além das refs consumidas, ruleset server-side do control branch que congela `.github/workflows/**/*` e `scripts/**/*` sem bypass/exclusions. Estado: `CORRECTED_TESTED_PENDING_SERVER_SIDE_CONFIGURATION_AND_INDEPENDENT_REVIEW`.

### P2 — recovery com autoridade já consumida

Thread `PRRT_kwDOTnz-ks6ZHxY8`. `verify-consumed-gate` é avaliado antes de receipt/título mutáveis do PR. Estado: `CORRECTED_TESTED_PENDING_INDEPENDENT_REVIEW`.

### P2 — gate deve falhar sem proteção obrigatória

Thread `PRRT_kwDOTnz-ks6ZHxY-`. O Stable Publication Gate termina com erro antes de authorization/publication quando a proteção server-side completa está ausente. Estado: `CORRECTED_TESTED_PENDING_INDEPENDENT_REVIEW`.

### P2 — NOOP de Release exige metadados completos

Thread `PRRT_kwDOTnz-ks6ZJdRg`. Recovery/NOOP agora valida tag, target RC3, draft/prerelease, título, body e `releases/latest`. Release parcial ou incompatível permanece fail-closed. Estado: `CORRECTED_TESTED_PENDING_INDEPENDENT_REVIEW`.

## Evidência técnica atual

```yaml
technical_head: a2841407d07165ac9a4573f3db98e3e8788e9b5b
stable_publication_gate_run: 31766055608
stable_publication_gate: EXPECTED_FAILURE_MISSING_SERVER_SIDE_PROTECTION
receipt_predicate_tests: PASS_4
server_side_protection_predicate_tests: PASS_9
atomic_git_real_tests: PASS_3
real_state_machine_tests: PASS_14
self_tests_total: PASS_30
authorize_publication: SKIPPED
publish_stable: SKIPPED
documentation_validation_run: 31766055514
documentation_validation: PASS
production_readiness_run: 31766055497
production_readiness: SUPERSEDED_BY_TERMINAL_DOC_HEAD_REQUALIFICATION
server_side_publication_protection: MISSING_BLOCKER
```

Os 30 testes cobrem, entre outros: receipt inválido/stale, exclusions/bypass em tag ruleset, ausência de paths protegidos no branch ruleset, HEAD-change na transação Git real, exact-tag adoption, wrong-SHA, recovery consumido, Release incompatível, metadados incorretos e `latest` divergente.

## Contagem vigente antes do review terminal

```yaml
publication_P0_count: 0
publication_P1_count: 3
publication_P2_count: 3
critical_findings: 0
high_findings: 0
AUDIT: BLOCKED_BY_PUBLICATION_P1
LEO_GATE: BLOCKED_BY_PUBLICATION_P1
HUMAN_GATE: NAO_APROVADO
READY_FOR_HUMAN_GATE: false
stable_v1_0_0: NAO_PUBLICADA
```

Nenhum finding será encerrado por edição. Para cada thread permanece obrigatório: `ACHADO → CORREÇÃO → TESTE DEDICADO → EVIDÊNCIA EXECUTÁVEL → REVISÃO INDEPENDENTE DO HEAD EXATO → RESOLUÇÃO FORMAL`.

## Próxima ação

Revalidar o HEAD documental final e obter revisão independente exata. Mesmo com review limpo, `publication_P1` não pode chegar a zero enquanto os rulesets reais não existirem e não forem comprovados no GitHub live. Augusto/Júlia/Emily/LÉO permanecem bloqueados até `P0=0/P1=0`.

Nenhum conteúdo deste PRF autoriza merge, tag, Release, `latest` ou publicação.
