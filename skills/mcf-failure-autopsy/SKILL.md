---
name: mcf-failure-autopsy
description: Use when Leandro or another authorized reviewer asks where an agent went wrong, requests an autopsy of a failure, or needs the operational path of an agent error reconstructed for study.
---

# MCF Failure Autopsy

## Princípio

Reconstruir **o que pode ser sustentado por evidência** sobre uma falha: fatos, premissas observáveis, ferramentas disponíveis/usadas/omitidas, decisões, regras violadas, impacto, caminho correto e prevenção.

Não inventar nem expor raciocínio privado token a token. Quando houver resumo seguro de raciocínio anterior disponível pela plataforma, ele pode ser usado como evidência complementar e deve ser identificado como tal.

## Gatilhos

Acionar quando a intenção for equivalente a:

- `AUTÓPSIA DA FALHA`
- `ANALISE SEU ERRO`
- `ANALISE O SEU ERRO`
- `ONDE VOCÊ ERROU?`
- `EXPLIQUE A FALHA`

Se a falha referida estiver inequívoca no contexto atual, **não pedir ao usuário para explicá-la novamente**. Se houver mais de uma falha candidata e nenhuma referência clara, pedir somente a desambiguação mínima.

## Fluxo obrigatório

1. Delimitar a afirmação/ação que falhou e o objetivo original.
2. Montar a cronologia somente com eventos observáveis.
3. Separar `FATO`, `HIPÓTESE/INFERÊNCIA` e `NÃO_VERIFICADO`.
4. Enumerar premissas que podem ser demonstradas pela conversa, artefatos ou logs.
5. Verificar ferramentas/capacidades disponíveis; registrar quais foram usadas e quais verificações relevantes foram omitidas.
6. Localizar o primeiro ponto em que evidência e decisão divergiram.
7. Mapear regra, contrato, boundary ou gate violado.
8. Registrar consequência direta e risco secundário sem exagerar causalidade.
9. Descrever o caminho operacional correto em ordem reproduzível.
10. Produzir prevenção reutilizável, preferindo regra/teste/validação a lembrete genérico.

## Formato mínimo de saída

```text
Falha analisada
Objetivo original
Evidências usadas
Cronologia observável
Premissas
Ferramentas usadas / disponíveis / omitidas
Ponto da falha
Regra ou boundary violado
Impacto
Caminho correto
Prevenção
Lacunas / NÃO_VERIFICADO
```

## Regras críticas

- Ausência de evidência nunca vira causa afirmada.
- Falha de ferramenta e diagnóstico da causa da ferramenta são fatos diferentes.
- Não atribuir ação a agente, reviewer ou ferramenta sem evidência de execução.
- Não apagar evidência negativa depois da correção.
- Não transformar autópsia em justificativa defensiva; o objetivo é localizar o mecanismo da falha.
- Antes de alegar incapacidade de ferramenta/acesso, verificar as superfícies realmente disponíveis na sessão.
- Preservar histórico não pode criar uma segunda fonte canônica aparente.

## Baselines obrigatórios

A validação inicial deve usar:

- `FALSE_LOCAL_WORKTREE_ACCESS_ASSUMPTION`;
- `TWO_APPARENT_ACTIVE_ROADMAPS`.

Detalhes e scorecard: `docs/tests/MCF-FAILURE-AUTOPSY-TESTS.md`.

## Limite de executabilidade

Esta versão é uma skill de **governança/orquestração registrada como `EXPERIMENTAL`**. Sua presença em `skills/registry.yaml` não significa, por si só, que ela integra o conjunto tipado do `SkillExecutor` do runtime. Qualquer promoção a skill runtime-executável exige mudança separada, testes e autorização compatível.
