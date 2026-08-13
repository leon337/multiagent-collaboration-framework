# MCF v1.0.0 — Publication Boundary

**Missão:** `MCF-STABLE-RELEASE-001`  
**Issue:** #131  
**PR:** #133  
**Macroestado:** `CORRECTING / BLOCKED_FOR_HUMAN_GATE`  
**HUMAN_GATE:** NÃO APROVADO  
**Stable `v1.0.0`:** NÃO PUBLICADA

## Invariantes

- RC1 → `9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8`;
- RC2 → `d73d936a63cc9462a95bcf481f4b8e1d4b255719`;
- RC3 → `7f741e10d0e745a90c732e084400b11e3f5e6794`;
- eventual `v1.0.0` somente pode apontar a RC3;
- PR #133 é control plane e não altera RC3;
- nenhuma CI/documentação constitui HUMAN_GATE.

## P1 — criação fail-closed da stable tag

O boundary não delega mais criação da tag a `gh release create --target`.

Sequência futura, somente se houver autorização válida:

```text
validar HUMAN_GATE imutável
→ validar RC lineage + PR HEAD
→ ler refs/tags/v1.0.0
→ se ausente: POST Git Data API criando a ref exatamente em RC3
→ se o POST perder uma corrida: reler a ref
→ aceitar somente RC3 exata; SHA divergente = FAIL
→ validar release existente ou ausência
→ revalidar HUMAN_GATE + RC lineage + tag RC3
→ gh release create --verify-tag (sem --target)
```

Assim, o cenário de outra writer criar `v1.0.0` em SHA errado durante a criação falha **antes** da criação de GitHub Release.

Recovery só aceita tag/release já existentes quando ambos são exatamente compatíveis com RC3 e a autorização atual continua válida.

## P1 — HUMAN_GATE sem comentário mutável

O comentário da Issue #131 não faz mais parte do predicado de autoridade.

O environment nativo do GitHub foi investigado. O repositório possui environment `main - rsa-api-free`, porém a API observada mostra `protection_rules: []`; required reviewer não está configurado. Logo esse mecanismo não é alegado nem usado.

O mecanismo implementado para futura decisão é um **GitHub Web verified commit** que modifica exclusivamente:

`artifacts/phases/PHASE-STABLE-RELEASE-001/LEANDRO-HUMAN-GATE.yaml`

Estado atual do arquivo: `NAO_APROVADO`.

Para qualificar futuramente, o commit deve cumprir cumulativamente:

1. author login/id = `leon337` / `25374535`;
2. committer = `web-flow` / `19864447`;
3. `commit.verification.verified=true` e `reason=valid`;
4. mensagem exata `HUMAN_GATE: approve MCF v1.0.0`;
5. exatamente um parent e exatamente um arquivo modificado;
6. arquivo modificado = receipt do HUMAN_GATE;
7. parent contém o receipt exato `NAO_APROVADO`;
8. conteúdo aprovado declara `approved_control_head` igual ao parent SHA.

Commit produzido por App/API/connector, comentário editável ou qualquer alteração adicional não satisfaz o gate. Um push posterior muda o HEAD e invalida o receipt antigo.

## Separação de privilégios

- validação: read-only;
- autorização: read-only;
- `contents: write`: somente no job `publish-stable`;
- `publish-stable` só é instanciado quando o job read-only `authorize-publication` emite `approved=true`;
- no estado atual o receipt é `NAO_APROVADO`, então `publish-stable` permanece SKIPPED.

## Testes dedicados

O boundary contém `self-test` determinístico cobrindo:

- tag ausente → criação exata RC3;
- tag concorrencial divergente → FAIL antes de release;
- tag concorrencial exata → caminho controlado;
- tag já exata RC3 → recovery;
- tag divergente → FAIL;
- release incompatível → FAIL;
- HUMAN_GATE ausente → nenhuma mutação;
- HUMAN_GATE de HEAD antigo → FAIL;
- App/API/unsigned receipt → FAIL;
- revogação/alteração → FAIL;
- mudança de PR HEAD → aprovação antiga inválida.

Além disso, o primeiro self-test falhou por semântica de `set -e`; o CAF endureceu todos os predicados com `|| return 1`, e o reteste passou.

```yaml
technical_head: 4d5144ce46c9c77955c732824f5225f81cf0b55d
publication_gate_run: 31726482829
validation: PASS
self_tests: PASS_16
authorize_publication: APPROVED_FALSE
publish_stable: SKIPPED
documentation_validation: PASS
publication_P0_count: 0
publication_P1_count: 2
critical_findings: 0
high_findings: 0
```

Os dois P1s permanecem formalmente abertos até revisão independente do SHA final.

## Threads antigos

HEAD-binding e TOCTOU permanecem formalmente abertos enquanto a cadeia `ACHADO → CORREÇÃO → TESTE → EVIDÊNCIA → REVISÃO → RESOLUÇÃO` não estiver completa para o desenho atual.

## Imutabilidade

**Governança:** identidades versionadas não devem ser retargetadas/reutilizadas.

**Proteção técnica observada:** RC3 `immutable:false`, rulesets observados `[]`, `main` não protegida. Não é alegada undeletability absoluta.

## Estado de autorização

```yaml
AUDIT: BLOCKED_BY_PUBLICATION_P1
LEO_GATE: BLOCKED_BY_PUBLICATION_P1
HUMAN_GATE: NAO_APROVADO
publication_authorized: false
merge_for_publication: NAO_AUTORIZADO
tag_v1_0_0: NAO_AUTORIZADA
github_release_v1_0_0: NAO_AUTORIZADA
latest_v1_0_0: NAO_AUTORIZADO
stable_v1_0_0: NAO_PUBLICADA
```

Nenhum trecho deste documento constitui aprovação humana.
