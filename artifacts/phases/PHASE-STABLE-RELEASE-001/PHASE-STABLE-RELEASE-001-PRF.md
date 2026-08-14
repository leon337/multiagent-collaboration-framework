# PRF — PHASE-STABLE-RELEASE-001

**Missão:** `MCF-STABLE-RELEASE-001`  
**Issue:** #131  
**PR:** #133  
**Classe:** C  
**Estado:** `CORRECTING / IMMUTABLE_PUBLISHER_SEPARATE_HUMAN_GATE_REF`  
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

## Arquitetura vigente

### Publisher

```yaml
publisher_ref: refs/heads/release/v1.0.0-stable-publish
security_model: WHOLE_BRANCH_IMMUTABLE_AFTER_TERMINAL_QUALIFICATION
```

O publisher contém workflow, script e lógica de publicação. HUMAN_GATE não é mais armazenado na branch do publisher e nenhum receipt futuro exige commit novo nessa branch.

### Approval ref separada

```yaml
approval_ref: refs/heads/release/v1.0.0-human-gate
initial_commit: ec1e2c33ee476cf03f2b698c86eae447978a07c8
initial_state: NAO_APROVADO
receipt_file: LEANDRO-HUMAN-GATE.yaml
authority: LEANDRO_ONLY
```

O receipt aprovado futuro deve conter literalmente release `v1.0.0`, `approved_publisher_head` igual ao SHA terminal do publisher e RC3 `7f741e10...`, em commit GitHub Web verificado de LEANDRO. Nenhum receipt aprovado foi criado nesta correção.

A validação do receipt compara os bytes exatos do blob GitHub via Base64, inclusive newline terminal e linhas em branco finais; conteúdo normalizado não é aceito como equivalente.

### Consumo da autoridade

A autorização direta é consumida por uma única transação Git `--atomic` que:

1. avança `release/v1.0.0-human-gate` sob `--force-with-lease` do commit de aprovação;
2. cria `mcf-control/v1.0.0` apontando ao commit-lock;
3. cria `v1.0.0` exclusivamente em RC3, se ainda ausente.

O publisher branch não participa como ref mutável da transação. O commit-lock registra `publisher_head`, `approval_commit`, `candidate_sha`, release e approval ref.

Revogação/alteração da approval ref antes do consumo invalida o lease e aborta atomicamente a criação das tags.

### Recovery

Após consumo, recovery exige simultaneamente stable tag exata em RC3, control-lock válido, publisher branch live igual ao `HEAD_SHA` codificado no lock, proteção server-side real das tags e do publisher branch e o mesmo publisher SHA do run/re-run. Publisher SHA divergente é fail-closed.

## Redesenho de capacidade GitHub

O requirement anterior `branch ruleset + file_path_restriction` foi **SUPERSEDED**. `Restrict file paths` pertence a Push Rulesets e não é o mecanismo aplicável ao repositório público atual.

A propriedade de segurança foi preservada por separação de responsabilidades: publisher code em branch inteira imutável, HUMAN_GATE em approval ref separada e recovery vinculado ao publisher SHA registrado no lock. Nenhuma mudança para private/internal, plano pago ou organização é requisito deste desenho.

## Proteção server-side mínima ainda necessária

### 1. Tag ruleset

Aplicável explicitamente a `refs/tags/v1.0.0` e `refs/tags/mcf-control/v1.0.0`.

Contrato: `target=tag`, `enforcement=active`, regras `update` + `deletion`, **sem regra `creation`**, `bypass_actors=[]` e `conditions.ref_name.exclude=[]`. A ausência de `creation` é necessária para permitir a criação inicial atômica das duas tags sem bypass.

### 2. Publisher branch ruleset

Aplicável explicitamente a `refs/heads/release/v1.0.0-stable-publish`.

Contrato: `target=branch`, `enforcement=active`, regras `update` + `deletion`, `bypass_actors=[]` e `conditions.ref_name.exclude=[]`. Não há requirement de `file_path_restriction`.

O GitHub live permanece com `repository_rulesets=[]`; portanto os dois P1 materiais continuam abertos e o Stable Publication Gate deve falhar antes de authorization/publication.

## Testes dedicados do novo desenho

Snapshot técnico executável anterior ao commit documental final:

```yaml
reference_technical_head: 6abb7c88e096c25c45d8457560907846affb57f6
stable_publication_gate_run: 31770534991
receipt_tests: PASS_10
ruleset_tests: PASS_11
atomic_git_real_tests: PASS_3
state_machine_tests: PASS_20
self_tests_total: PASS_44
expected_gate_result_without_rulesets: FAIL_CLOSED
publish_stable: SKIPPED
```

Além dos cenários anteriores, os testes rejeitam receipt sem newline terminal, receipt com linha em branco extra, pai do receipt com bytes finais divergentes e tag ruleset contendo `creation`.

Esse bloco é `REFERENCE_TECHNICAL_SNAPSHOT`, não substitui CI/review do HEAD documental final.

## Findings materiais vigentes

### P1 — proteção server-side das refs de publicação
Thread `PRRT_kwDOTnz-ks6ZHcv4`. Estado: `OPEN_EXTERNAL_CONFIGURATION_BLOCKER` até ruleset real das tags e prova live.

### P1 — publisher imutável server-side
Thread `PRRT_kwDOTnz-ks6ZJdRe`. O antigo subdesenho com path restrictions foi superado. A correção atual usa publisher branch inteira imutável + approval ref separada. Estado: `CORRECTED_TESTED_PENDING_TERMINAL_REVIEW_AND_SERVER_SIDE_PROOF`.

### P2 — bytes exatos do receipt
Review thread do finding `discussion_r3781129491`. Estado: `CORRECTED_TESTED_PENDING_TERMINAL_REVIEW`.

### P2 — tag ruleset não pode bloquear creation
Review thread do finding `discussion_r3781129494`. Estado: `CORRECTED_TESTED_PENDING_TERMINAL_REVIEW`.

## Estado de findings

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

## Modelo de evidência terminal

O HEAD terminal exato, run IDs e review independente são registrados fora do commit no PR #133/Issue #131 depois de o HEAD ser congelado, evitando o loop autorreferente `commit para registrar SHA → novo SHA`.

Nenhum finding será encerrado por edição. Permanece obrigatório: `ACHADO → CORREÇÃO → TESTE DEDICADO → EVIDÊNCIA EXECUTÁVEL → REVISÃO INDEPENDENTE DO HEAD EXATO → RESOLUÇÃO FORMAL`.

## Próxima ação

Congelar o HEAD documental, executar Stable Publication Gate, Documentation Validation e Production Readiness nesse SHA, reexecutar o Stable Gate no mesmo publisher SHA, obter review independente exato e somente então preparar as instruções administrativas mínimas dos dois rulesets. Não pedir configuração a LEANDRO antes dessa cadeia. Mesmo com review limpo, `P1` não chega a zero sem prova server-side real.

Nenhum conteúdo deste PRF autoriza merge, tag, Release, `latest` ou publicação.
