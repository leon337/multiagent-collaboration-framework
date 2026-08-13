# PRF — PHASE-STABLE-RELEASE-001

**Missão:** `MCF-STABLE-RELEASE-001`  
**Issue:** #131  
**PR:** #133  
**Classe:** C  
**Estado:** `CORRECTING / BLOCKED_FOR_HUMAN_GATE`  
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

PR #133 é somente control plane e não altera RC3.

## P1-1 — stable tag creation race

**Achado:** um writer concorrente poderia criar `v1.0.0` em SHA divergente entre o probe de ausência e `gh release create --target`, permitindo uma release pública incorreta antes da pós-verificação.

**Correção:**
- `refs/tags/v1.0.0` é criada explicitamente pela Git Data API somente em RC3;
- se o create perder corrida, a ref vencedora é relida antes de qualquer release;
- SHA divergente falha fechado;
- SHA exato RC3 entra apenas no caminho controlado;
- `gh release create` usa `--verify-tag`, sem `--target`.

**Testes reais:** o self-test invoca `publish_or_recover` e `create_exact_stable_tag_fail_closed` contra backend fake isolado, cobrindo tag ausente, concorrente divergente, concorrente exata, recovery exato, tag divergente, release incompatível e create sem vencedor exato.

**Estado:** `CORRECTED_TESTED_PENDING_INDEPENDENT_REVIEW`.

## P1-2 — revogação do HUMAN_GATE

**Achado:** comentário mutável da Issue #131 poderia ser editado/apagado após leitura e antes da mutação.

**Environment nativo:** investigado, mas não adotado. O environment observado `main - rsa-api-free` possui `protection_rules: []`; required reviewer não está configurado e este canal não dispõe de ação administrativa para configurá-lo. Nenhuma proteção inexistente é presumida.

**Correção:** comentário deixou de ser autoridade. O futuro receipt é um commit GitHub Web verificado que altera exclusivamente `LEANDRO-HUMAN-GATE.yaml`, com author `leon337`/25374535, committer `web-flow`/19864447, verificação `valid`, mensagem e conteúdo exatos e vínculo ao parent control-head.

O gate/HEAD/RC lineage são reconsumidos **imediatamente antes** da tentativa atômica de criação de `refs/tags/v1.0.0`. Esse create-ref é o publication boundary para estabelecer a identidade stable: revogação ou mudança de HEAD anterior a ele resulta em zero criação de tag e zero release.

**Testes reais:** HUMAN_GATE ausente, App/API/unsigned, receipt stale/alterado, revogação no segundo consumo antes do tag boundary e mudança de PR HEAD antes do tag boundary.

**Estado:** `CORRECTED_TESTED_PENDING_INDEPENDENT_REVIEW`.

## CAF / evidência técnica

Dois ciclos fail-closed melhoraram a prova:

1. run `31726128230`: fixture revelou dependência de `set -e`; predicados passaram a retornar explicitamente;
2. run `31727880589`, head `59df5bcc...`: o self-test real detectou caminhos `|| error` que ainda não propagavam retorno sob contexto condicional; nenhum job de autorização/publicação executou. O código foi endurecido em `f2c7047485beb06806be6c8a7de192314d4d1c17`.

Reteste técnico:

```yaml
technical_head: f2c7047485beb06806be6c8a7de192314d4d1c17
stable_publication_gate_run: 31728317756
validation: PASS
receipt_predicate_tests: PASS_4
real_state_machine_tests: PASS_11
self_tests_total: PASS_15
authorize_publication: PASS_WITH_APPROVED_FALSE
publish_stable: SKIPPED
documentation_validation_run: 31728317747
documentation_validation: PASS
production_readiness_run: 31728317685
production_readiness: PASS
```

## Findings atuais

```yaml
publication_P0_count: 0
publication_P1_count: 2
critical_findings: 0
high_findings: 0
AUDIT: BLOCKED_BY_PUBLICATION_P1
LEO_GATE: BLOCKED_BY_PUBLICATION_P1
HUMAN_GATE: NAO_APROVADO
stable_v1_0_0: NAO_PUBLICADA
```

P1 não será zerado antes da revisão independente do SHA final.

## Threads

HEAD-binding, TOCTOU, tag-race, revogação e documentação só podem ser resolvidos se a cadeia `ACHADO → CORREÇÃO → TESTE DEDICADO → EVIDÊNCIA → REVISÃO INDEPENDENTE → RESOLUÇÃO` estiver completa no desenho atual.

## Produção e monitor

```yaml
production_sha: 7f741e10d0e745a90c732e084400b11e3f5e6794
render_service: rsa-api-free
render_deploy: dep-d9ugl7gae00c73c5snv0
production_state: LIVE
latest_health_run: 31726950466
latest_health_result: SUCCESS
material_incidents_open: 0
```

## Próxima ação

Concluir reconciliação documental, executar CI no HEAD final, reconfirmar RCs/stable/produção/monitor e solicitar revisão independente desse SHA exato. Augusto/Júlia/Emily/LÉO permanecem bloqueados até P0/P1 zero.

Nenhum conteúdo deste PRF autoriza merge, tag, release, `latest` ou publicação.
