# MCF v1.0.0 — Publication Boundary

**Missão:** `MCF-STABLE-RELEASE-001`  
**Issue:** #131  
**PR operacional:** #133  
**Macroestado:** `REQUALIFYING`  
**HUMAN_GATE:** NÃO APROVADO  
**Stable `v1.0.0`:** NÃO PUBLICADA

## Invariantes

- `v1.0.0-RC1` permanece em `9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8`;
- `v1.0.0-RC2` permanece em `d73d936a63cc9462a95bcf481f4b8e1d4b255719`;
- `v1.0.0-RC3` permanece em `7f741e10d0e745a90c732e084400b11e3f5e6794`;
- a eventual `v1.0.0` somente pode apontar ao SHA exato da RC3;
- nenhuma correção do control plane do PR #133 altera o SHA qualificado da RC3;
- nenhuma publicação é autorizada por esta documentação.

## Identidade GitHub autorizada de LEANDRO

A identidade usada no boundary é verificável e não é inferida de memória:

- repositório oficial owner login: `leon337`;
- GitHub user id: `25374535`;
- perfil GitHub: `Leandro Carlos`;
- commit canônico da RC3 está associado pelo GitHub a esse login/id e possui verificação GitHub.

O workflow revalida login, id e ownership em tempo de execução.

## P1-A — autenticação e vinculação do HUMAN_GATE

O predicado original baseado em substring foi rejeitado. Depois da primeira correção, a revisão independente identificou um segundo cenário: um recibo válido para um HEAD anterior poderia sobreviver a um `synchronize` posterior.

O predicado atual exige simultaneamente:

1. `comment.user.login == "leon337"`;
2. `comment.user.id == 25374535`;
3. corpo inteiro exatamente igual ao formato esperado;
4. release explicitamente igual a `v1.0.0`;
5. `PR_HEAD` exatamente igual ao HEAD do PR #133 que está sendo executado;
6. exatamente um recibo qualificante para esse HEAD;
7. revalidação do HEAD remoto atual do PR imediatamente antes de qualquer job mutável.

O recibo esperado para um HEAD tecnicamente aprovado será:

```text
LEANDRO_HUMAN_GATE: APPROVED
RELEASE: v1.0.0
PR_HEAD: <SHA exato do HEAD revisado do PR #133>
```

Um comentário de outra conta, id divergente, quoting, prefixo/sufixo, linha extra ou `PR_HEAD` antigo não satisfaz o gate.

### Teste dedicado obrigatório

O job read-only inclui fixture negativo que apresenta:

- login incorreto;
- id incorreto;
- quote do recibo;
- conteúdo extra;
- recibo sintaticamente correto para HEAD obsoleto;
- exatamente um recibo válido para o HEAD corrente.

A contagem somente pode reconhecer o último caso.

## P1-B — executabilidade do workflow introduzido no PR

O finding original dizia que o workflow não seria executável porque ainda não existia na default branch. O run `31654604049` era insuficiente: mostrava descoberta do workflow, mas todos os jobs estavam `SKIPPED`.

A prova executável posterior eliminou a incerteza teórica:

- run: `31676208679`;
- evento: `pull_request`;
- ref: `refs/pull/133/merge`;
- head revisado naquele ciclo: `24980e02cccf9f45041237540f9d0598bb67175e`;
- job `validate-publication-boundary`: `SUCCESS`;
- prova `github.workflow_ref`/merge ref: `SUCCESS`;
- job `publish-stable`: `SKIPPED`.

Portanto, o mecanismo foi executado de fato a partir do ref do PR, sem merge do PR #133 para `main`. A revisão independente subsequente não repetiu esse P1.

O novo HEAD ainda deve repetir essa prova porque o boundary foi alterado novamente.

## P2 — recovery de publicação parcial

O validador anterior exigia ausência absoluta de `v1.0.0`. Isso tornava inalcançável o NOOP de recovery caso a tag/release correta fosse criada e uma verificação final falhasse transitoriamente.

O boundary atual distingue dois estados aceitáveis:

### Estado normal pré-publicação

```yaml
stable_tag: ABSENT
stable_release: ABSENT
```

### Estado de recovery autorizado

Só é aceito se **todas** as condições forem verdadeiras:

```yaml
stable_tag_sha: 7f741e10d0e745a90c732e084400b11e3f5e6794
stable_release_tag: v1.0.0
stable_release_target: 7f741e10d0e745a90c732e084400b11e3f5e6794
draft: false
prerelease: false
human_gate_for_current_head: EXACTLY_ONE
approved_pr_title: EXACT
```

Qualquer stable divergente, parcial sem release válida ou existente sem autorização atual do HEAD falha fechado.

## Workflow e privilégios

- permissões globais: `contents: read`, `issues: read`, `pull-requests: read`;
- `contents: write` existe apenas no job `publish-stable`;
- o job mutável depende do job read-only;
- o job mutável também revalida RC lineage, HEAD remoto, título, identidade e recibo HEAD-bound;
- o workflow não modifica RC1, RC2 ou RC3;
- no estado atual, o título não está no valor de publicação e não há recibo HUMAN_GATE qualificante.

## Efeito exato se futuramente autorizado

Somente após todos os gates e HUMAN_GATE explícito para o HEAD revisado, o job poderá:

1. criar `v1.0.0` apontando para `7f741e10...`;
2. criar GitHub Release `MCF v1.0.0` como não-draft/não-prerelease;
3. marcar `v1.0.0` como `latest`;
4. verificar tag, release, target e `latest`;
5. em rerun autorizado, executar NOOP somente se o estado existente for exatamente o esperado.

Esses efeitos permanecem proibidos enquanto `HUMAN_GATE != APROVADO`.

## Imutabilidade: governança vs proteção técnica

### Imutabilidade de governança

RC1, RC2, RC3 e a futura `v1.0.0` são identidades de versão e não devem ser retargetadas/reutilizadas.

### Proteção técnica observada

No estado verificado:

- RC3 expõe `immutable: false`;
- endpoint de rulesets retorna `[]`;
- `main` não está marcada como branch protegida.

Logo, o MCF não afirma undeletability técnica. A imutabilidade é uma invariante de governança/versionamento reforçada por verificações fail-closed.

## Findings atuais

```yaml
publication_P0_count: 0
publication_P1_count: 1
critical_findings: 0
high_findings: 0
p2_pending_review: 2
current_corrected_head_ci: PENDING
current_corrected_head_independent_review: PENDING
```

O P1 atual é o cenário de aprovação obsoleta por HEAD, já corrigido em código mas ainda pendente de teste do HEAD final e revisão independente. Os P2s são recovery parcial e reconciliação documental, também pendentes de reteste/review.

## Estado de autorização

```yaml
HUMAN_GATE: NAO_APROVADO
publication_authorized: false
stable_v1_0_0: NAO_PUBLICADA
merge_pr_133_for_publication: NAO_AUTORIZADO
tag_v1_0_0: NAO_AUTORIZADA
github_release_v1_0_0: NAO_AUTORIZADA
latest_v1_0_0: NAO_AUTORIZADO
```

Nenhum trecho deste documento constitui aprovação humana.