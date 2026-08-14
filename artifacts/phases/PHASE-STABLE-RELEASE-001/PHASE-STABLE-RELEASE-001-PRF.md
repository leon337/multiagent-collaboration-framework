# PRF — PHASE-STABLE-RELEASE-001

**Missão:** `MCF-STABLE-RELEASE-001`  
**Issue:** #131  
**PR:** #133  
**Classe:** C  
**Estado:** `CORRECTING / BLOCKED_BY_SERVER_SIDE_TAG_PROTECTION`  
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

## Findings materiais vigentes

### P1 — proteção server-side real das refs de publicação

A segurança entre o consumo da autorização e a criação/recovery da Release depende de proteção GitHub real para:

- `refs/tags/v1.0.0`;
- `refs/tags/mcf-control/v1.0.0`.

O contrato exige ruleset de tags `active`, regras `update` + `deletion`, `bypass_actors=[]` e `conditions.ref_name.exclude=[]`, cobrindo explicitamente as duas refs. O GitHub live continua sem rulesets aplicáveis. Estado: `OPEN_EXTERNAL_CONFIGURATION_BLOCKER`.

### P1 — exclusions do ruleset

Thread `PRRT_kwDOTnz-ks6ZHxY7`. O predicado agora rejeita qualquer lista de exclusions não vazia. Foi adicionado fixture negativo dedicado. Estado: `CORRECTED_TESTED_PENDING_INDEPENDENT_REVIEW`.

### P2 — recovery com autoridade já consumida

Thread `PRRT_kwDOTnz-ks6ZHxY8`. O workflow agora tenta `verify-consumed-gate` antes de consultar receipt/título atuais do PR. Estado: `CORRECTED_TESTED_PENDING_INDEPENDENT_REVIEW`.

### P2 — gate deve falhar sem proteção obrigatória

Thread `PRRT_kwDOTnz-ks6ZHxY-`. O Stable Publication Gate agora encerra com erro quando `protection-status` não encontra o ruleset requerido. Estado: `CORRECTED_TESTED_PENDING_INDEPENDENT_REVIEW`.

## Evidência técnica antes do review terminal documental

```yaml
technical_head: 18205054ae1dc517b1d7ad85867bfed64876f1f0
stable_publication_gate_run: 31765039114
stable_publication_gate: EXPECTED_FAILURE_MISSING_SERVER_SIDE_PROTECTION
receipt_predicate_tests: PASS_4
ruleset_predicate_tests: PASS_5
atomic_git_real_tests: PASS_3
real_state_machine_tests: PASS_12
self_tests_total: PASS_24
authorize_publication: SKIPPED
publish_stable: SKIPPED
documentation_validation_run: 31765039112
documentation_validation: PASS
production_readiness_run: 31765039130
production_readiness: PASS
server_side_tag_protection: MISSING_BLOCKER
```

O `FAIL` do Stable Publication Gate é comportamento correto enquanto a proteção obrigatória estiver ausente; não representa regressão de runtime.

## Contagem vigente

```yaml
publication_P0_count: 0
publication_P1_count: 2
publication_P2_count: 2
critical_findings: 0
high_findings: 0
AUDIT: BLOCKED_BY_PUBLICATION_P1
LEO_GATE: BLOCKED_BY_PUBLICATION_P1
HUMAN_GATE: NAO_APROVADO
READY_FOR_HUMAN_GATE: false
stable_v1_0_0: NAO_PUBLICADA
```

Nenhum P1/P2 será encerrado por edição. Para cada thread permanece obrigatório: `ACHADO → CORREÇÃO → TESTE → EVIDÊNCIA → REVISÃO INDEPENDENTE DO HEAD EXATO → RESOLUÇÃO`.

## Próxima ação

Revalidar o HEAD documental final; obter revisão independente desse SHA; configurar e provar ruleset GitHub real; rerodar o boundary. Augusto/Júlia/Emily/LÉO somente depois de `P0=0/P1=0`. O máximo permitido continua `READY_FOR_HUMAN_GATE`.

Nenhum conteúdo deste PRF autoriza merge, tag, Release, `latest` ou publicação.
