# PRF — PHASE-STABLE-RELEASE-001

**Missão:** `MCF-STABLE-RELEASE-001`  
**Issue:** #131  
**PR:** #133  
**Classe:** C  
**Estado:** `CORRECTING / BLOCKED_FOR_HUMAN_GATE`  
**Autoridade humana:** LEANDRO  
**HUMAN_GATE:** NÃO APROVADO  
**Stable `v1.0.0`:** NÃO PUBLICADA

## 1. Candidato preservado

```yaml
main_sha: 7f741e10d0e745a90c732e084400b11e3f5e6794
qualified_rc3_sha: 7f741e10d0e745a90c732e084400b11e3f5e6794
rc1: v1.0.0-RC1@9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8
rc2: v1.0.0-RC2@d73d936a63cc9462a95bcf481f4b8e1d4b255719
rc3: v1.0.0-RC3@7f741e10d0e745a90c732e084400b11e3f5e6794
stable_v1_0_0: NAO_PUBLICADA
publication_authorized: false
```

Os commits do PR #133 pertencem somente ao control plane e não mudam RC3.

## 2. P1 — criação concorrente da stable tag

### Achado

O fluxo anterior verificava `v1.0.0` ausente e depois chamava `gh release create --target`. Se outro writer criasse a tag em SHA divergente durante a janela, o CLI poderia reutilizar a tag existente e a divergência seria detectada somente depois da criação da release.

### Correção implementada

- criação explícita de `refs/tags/v1.0.0` pela Git Data API, apontando somente para RC3;
- se a ref já existir, apenas SHA exatamente RC3 é aceito;
- se o POST falhar por corrida, a ref resultante é lida antes de qualquer criação de release;
- corrida divergente falha antes de release;
- corrida exata pode seguir somente pelo estado exato controlado;
- `gh release create` usa `--verify-tag` e não usa `--target`;
- release existente incompatível falha fechado.

### Testes dedicados

O `self-test` do mesmo boundary cobre explicitamente:

1. tag ausente → criação exata RC3;
2. tag concorrencial em SHA errado → FAIL antes de release;
3. tag concorrencial exata RC3 → caminho controlado;
4. tag já existente exatamente em RC3 → recovery;
5. tag divergente → FAIL;
6. release incompatível → FAIL.

**Estado:** `CORRECTED_TESTED_PENDING_INDEPENDENT_REVIEW`.

## 3. P1 — revogação do HUMAN_GATE

### Achado

O comentário da Issue #131 era mutável. Uma edição/remoção após a última leitura poderia deixar um run prosseguir com snapshot obsoleto.

### Investigação de GitHub Environment

O repositório possui environments, mas o environment observado `main - rsa-api-free` está sem protection rules/required reviewer. O mecanismo não foi adotado sem configuração real. A configuração de required reviewer exige administração do environment; o canal atual não possui ação administrativa para criá-la e não afirma proteção inexistente.

### Correção implementada

O comentário da Issue #131 deixou de ser autoridade do publication boundary. O futuro HUMAN_GATE passa a ser um receipt commit imutável no arquivo:

`artifacts/phases/PHASE-STABLE-RELEASE-001/LEANDRO-HUMAN-GATE.yaml`

Estado atual:

```yaml
authority: LEANDRO
state: NAO_APROVADO
release: v1.0.0
approved_control_head: null
approval_method: GITHUB_WEB_VERIFIED_COMMIT_REQUIRED
```

Um futuro receipt somente poderá qualificar se o commit:

- tiver autor `leon337` / user id `25374535`;
- tiver committer GitHub `web-flow` / id `19864447`;
- tiver `commit.verification.verified=true` e `reason=valid`;
- alterar exatamente um arquivo: o receipt;
- usar mensagem exata `HUMAN_GATE: approve MCF v1.0.0`;
- declarar `approved_control_head` igual ao único parent SHA;
- tiver como parent o receipt `NAO_APROVADO` exato.

Comentários mutáveis e commits produzidos por GitHub App/API não satisfazem o gate. Qualquer push posterior muda o PR HEAD e invalida o receipt anterior.

### Testes dedicados

- HUMAN_GATE inexistente → nenhuma mutação;
- receipt de HEAD antigo → FAIL;
- GitHub App/API/unsigned receipt → FAIL;
- receipt alterado/revogado → FAIL;
- mudança de PR HEAD → aprovação anterior inválida.

**Estado:** `CORRECTED_TESTED_PENDING_INDEPENDENT_REVIEW`.

## 4. CAF do self-test

O primeiro run da nova implementação, `31726128230`, falhou no self-test. A causa foi dependência implícita de `set -e` dentro de uma função chamada sob negação/condicional; falhas intermediárias podiam ser mascaradas pela última instrução bem-sucedida.

Correção: todos os predicados de segurança passaram a usar retorno explícito `|| return 1`. O reteste no HEAD técnico `4d5144ce46c9c77955c732824f5225f81cf0b55d` passou.

```yaml
stable_publication_gate_run: 31726482829
validate_publication_boundary: PASS
dedicated_self_tests: PASS_16
authorize_publication: PASS_WITH_APPROVED_FALSE
publish_stable: SKIPPED
documentation_validation: PASS
```

## 5. Findings atuais

```yaml
publication_P0_count: 0
publication_P1_count: 2
critical_findings: 0
high_findings: 0
P1_tag_race: CORRECTED_TESTED_PENDING_INDEPENDENT_REVIEW
P1_human_gate_revocation: CORRECTED_TESTED_PENDING_INDEPENDENT_REVIEW
AUDIT: BLOCKED_UNTIL_P0_P1_ZERO
LEO_GATE: BLOCKED_UNTIL_P0_P1_ZERO
HUMAN_GATE: NAO_APROVADO
stable_v1_0_0: NAO_PUBLICADA
```

A contagem P1 **não será zerada** antes de revisão independente do SHA exato do HEAD final.

## 6. Threads antigos

Threads de HEAD-binding e TOCTOU permanecem abertos enquanto a cadeia completa `ACHADO → CORREÇÃO → TESTE → EVIDÊNCIA → REVISÃO INDEPENDENTE → RESOLUÇÃO` não estiver comprovada no desenho atual. Nenhum thread será resolvido apenas porque o código mudou.

## 7. Produção e monitor

```yaml
production_sha: 7f741e10d0e745a90c732e084400b11e3f5e6794
render_service: rsa-api-free
render_deploy: dep-d9ugl7gae00c73c5snv0
production_state: LIVE
latest_health_run_verified: 31677775717
latest_health_result: SUCCESS
initial_readiness_probe: TIMEOUT_20S
cold_start_recovery_probe: PASS
material_incidents_open: 0
issue_129: CLOSED_COMPLETED
```

## 8. Imutabilidade

Imutabilidade das versões permanece uma regra de governança. Não é alegada undeletability técnica: RC3 expõe `immutable:false`, não há ruleset observado e `main` não está protegida no estado verificado.

## 9. Próxima ação

`reconciliar REPORT/PUBLICATION-BOUNDARY/README/runtime README → executar CI no HEAD documental final → reconfirmar RCs/stable/produção/monitor → solicitar revisão independente do SHA exato → manter P1>0 até o review confirmar os cenários → somente então avaliar auditoria multiagente terminal`.

Nenhum conteúdo deste PRF constitui autorização humana para publicar `v1.0.0`.
