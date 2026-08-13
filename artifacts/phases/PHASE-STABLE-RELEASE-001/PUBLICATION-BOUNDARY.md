# MCF v1.0.0 — Publication Boundary

**Missão:** `MCF-STABLE-RELEASE-001`  
**Issue:** #131  
**PR operacional:** #133  
**Estado:** CORREÇÃO DOS P1s EM VALIDAÇÃO  
**HUMAN_GATE:** NÃO APROVADO  
**Stable `v1.0.0`:** NÃO PUBLICADA

## Invariantes

- `v1.0.0-RC1` permanece em `9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8`;
- `v1.0.0-RC2` permanece em `d73d936a63cc9462a95bcf481f4b8e1d4b255719`;
- `v1.0.0-RC3` permanece em `7f741e10d0e745a90c732e084400b11e3f5e6794`;
- a eventual `v1.0.0` somente pode apontar ao SHA exato da RC3;
- nenhuma correção do control plane do PR #133 altera o SHA qualificado da RC3;
- nenhuma publicação é autorizada por esta documentação.

## P1-1 — autenticação do HUMAN_GATE

O predicado antigo, baseado apenas na presença da substring `LEANDRO_HUMAN_GATE: APPROVED`, foi rejeitado.

O predicado corrigido exige simultaneamente:

1. `comment.user.login == "leon337"`;
2. `comment.user.id == 25374535`;
3. `comment.body == "LEANDRO_HUMAN_GATE: APPROVED"` por igualdade exata;
4. exatamente um recibo qualificante antes de qualquer efeito de publicação.

### Evidência da identidade autorizada

A vinculação não é inferida de memória:

- o repositório oficial `leon337/multiagent-collaboration-framework` pertence ao login `leon337`, GitHub user id `25374535`;
- `GET /users/leon337` identifica o perfil como `Leandro Carlos`;
- o commit canônico `7f741e10d0e745a90c732e084400b11e3f5e6794` foi assinado/verificado pelo GitHub, tem autor `Leandro Carlos` e está associado por GitHub ao login `leon337` / id `25374535`.

O workflow revalida login, id e ownership em tempo de execução. Um comentário de outra conta, login correto com id diferente, corpo citado, corpo com prefixo/sufixo ou corpo multilinha não satisfaz o gate.

## P1-2 — executabilidade do workflow introduzido no PR

### Regra do GitHub Actions

A documentação oficial do GitHub descreve que, quando ocorre um evento, o GitHub procura workflows no SHA/ref associado ao evento e usa a versão do workflow presente nesse SHA/ref. Alguns eventos possuem a exigência adicional de o arquivo existir na default branch; essa exigência é explicitamente documentada para eventos como `workflow_dispatch`, `schedule` e outros. Ela não é apresentada como requisito geral de `pull_request`.

Referências oficiais:

- `https://docs.github.com/en/actions/concepts/workflows-and-actions/workflows`
- `https://docs.github.com/en/actions/how-tos/troubleshoot-workflows`
- `https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows`

### Contradição investigada

O run `31654604049` foi realmente criado para `.github/workflows/mcf-v1-stable-publish-gate.yml` com:

- evento: `pull_request`;
- PR: #133;
- head branch: `release/v1.0.0-stable-publish`;
- conclusão: `skipped`.

Esse run prova que o GitHub descobriu/instanciou o workflow do PR, mas **não** prova que os passos internos são executáveis, porque o único job foi pulado pelo `if`.

### Prova executável exigida após a correção

O workflow agora contém `validate-publication-boundary`, um job read-only que deve rodar de verdade em `pull_request/synchronize` e provar:

- `event == pull_request`;
- `GITHUB_REF == refs/pull/133/merge`;
- `github.workflow_ref` aponta para o workflow em `refs/pull/133/merge`;
- head/base/branch são os esperados;
- RC1/RC2/RC3 continuam nos SHAs exatos;
- `v1.0.0` continua ausente;
- identidade GitHub autorizada é verificável;
- predicado exato do recibo rejeita impersonação, quoting e variantes;
- o estado atual do HUMAN_GATE é inspecionado sem concedê-lo.

Somente um run `SUCCESS` desse job poderá encerrar o P1-2. O job `publish-stable` permanece separado, com `contents: write` apenas no próprio job e somente após validação + título exato + recibo exato.

## Imutabilidade: governança vs proteção técnica

### Imutabilidade por governança

Para o MCF, uma tag/release pública versionada não deve ser retargetada. `v1.0.0`, depois de criada, é identidade pública de versão e deve permanecer ligada ao SHA originalmente publicado.

### Proteção técnica observada no GitHub

No snapshot auditado antes desta correção:

- o objeto de release RC3 expôs `immutable: false`;
- o endpoint de rulesets do repositório retornou `[]`.

Portanto, o MCF **não afirma** que GitHub impeça tecnicamente um administrador autorizado de excluir/mover a identidade. A imutabilidade atualmente é uma invariante de governança reforçada por verificações fail-closed do workflow, não uma garantia de undeletability fornecida pela configuração atual do GitHub.

## Estado de autorização

```yaml
HUMAN_GATE: NAO_APROVADO
publication_authorized: false
stable_v1_0_0: NAO_PUBLICADA
merge_pr_133_for_publication: NAO_AUTORIZADO
```
