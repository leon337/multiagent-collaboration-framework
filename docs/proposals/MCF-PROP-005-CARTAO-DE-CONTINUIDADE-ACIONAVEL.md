# MCF-PROP-005 — Cartão de Continuidade Acionável

**Data:** 2 de agosto de 2026  
**Autoridade solicitante:** Léo  
**Estado:** proposta para validação  
**Substitui a proposta de bastão extenso da MCF-DEC-004, que não foi aprovada.**

## 1. Problema

A mensagem pode conter toda a análise correta e ainda falhar operacionalmente quando Léo precisa ler tudo para descobrir:

- se precisa agir;
- qual decisão deve tomar;
- qual opção é recomendada;
- qual agente continua;
- qual é a próxima ação;
- qual texto deve responder.

O bastão extenso não resolve esse problema porque adiciona campos, mas não reduz o esforço de decisão.

## 2. Decisão proposta

Toda mensagem operacional deve começar com um **Cartão de Continuidade**, antes de qualquer análise detalhada.

O cartão deve permitir que Léo ou o próximo agente saiba o que fazer em até cinco segundos.

Existem apenas três tipos de cartão.

## 3. Tipo 1 — Ação do Léo

Usado quando a continuidade depende de decisão, autorização, informação ou escolha de Léo.

```text
╭─ AÇÃO DO LÉO ─────────────────────────
│ Decisão: [descrição em uma frase]
│ Recomendação do Mestre: [opção recomendada]
│ Responda apenas: [comando exato]
╰────────────────────────────────────────
```

Exemplo:

```text
╭─ AÇÃO DO LÉO ─────────────────────────
│ Decisão: autorizar ou não o merge do PR #15
│ Recomendação do Mestre: NÃO AUTORIZAR AINDA
│ Responda apenas: AUTORIZO ou NÃO AUTORIZO
╰────────────────────────────────────────
```

Regras:

- no máximo três linhas úteis;
- sempre incluir recomendação do Mestre;
- sempre fornecer resposta exata;
- não exigir que Léo leia o restante para decidir;
- o detalhamento abaixo serve como justificativa e evidência.

## 4. Tipo 2 — Continuidade automática da equipe

Usado quando nenhum ato de Léo é necessário e o próximo agente pode continuar imediatamente.

```text
╭─ CONTINUIDADE AUTOMÁTICA ──────────────
│ Próximo agente: [nome]
│ Execute: [ação imperativa em uma frase]
│ Use: [artefato, commit ou estado essencial]
╰────────────────────────────────────────
```

Exemplo:

```text
╭─ CONTINUIDADE AUTOMÁTICA ──────────────
│ Próximo agente: Emily
│ Execute: revisar a composição técnica final
│ Use: MCF-DEC-003 no commit 93ec01d2
╰────────────────────────────────────────
```

Regras:

- o Mestre encaminha a missão sem pedir autorização desnecessária;
- o agente deve conseguir começar apenas com o cartão e os artefatos indicados;
- o trabalho detalhado permanece visível abaixo.

## 5. Tipo 3 — Bloqueio

Usado quando ninguém pode continuar até que uma condição externa seja resolvida.

```text
╭─ FLUXO BLOQUEADO ──────────────────────
│ Motivo: [bloqueio em uma frase]
│ Responsável por desbloquear: [Léo, agente ou parte externa]
│ Retomar quando: [condição objetiva]
╰────────────────────────────────────────
```

## 6. Prioridade de exibição

O Cartão de Continuidade deve ser o primeiro bloco visível da mensagem, antes de:

- contrato da missão;
- análises dos agentes;
- tabelas;
- artefatos;
- estado final.

Assim, Léo pode agir sem ler toda a resposta. A leitura detalhada continua disponível quando desejar verificar razões e evidências.

## 7. Regra de decisão

O Mestre escolhe exatamente um cartão:

```yaml
se_depende_de_leo: ACAO_DO_LEO
se_equipe_pode_continuar: CONTINUIDADE_AUTOMATICA
se_ninguem_pode_continuar: FLUXO_BLOQUEADO
```

Não é permitido apresentar dois cartões conflitantes na mesma mensagem.

## 8. Conteúdo detalhado da mensagem

Depois do cartão, a mensagem mantém:

- contrato da missão, quando aplicável;
- contribuição visível dos agentes;
- pesquisas e evidências;
- artefatos;
- RC;
- estado final.

O cartão não substitui a documentação; ele torna a continuidade acionável.

## 9. Compatibilidade com artefatos

O cartão deve indicar apenas o artefato essencial para continuar.

O contrato completo de entrega continua na seção de artefatos.

Artefato por mensagem não significa commit por mensagem.

## 10. Critérios de conformidade

Uma mensagem operacional está conforme quando:

- começa com exatamente um cartão;
- o cartão usa um dos três tipos oficiais;
- a ação está escrita no imperativo;
- o responsável está identificado;
- a resposta exata é fornecida quando depende de Léo;
- a recomendação do Mestre aparece quando existe decisão humana;
- o próximo agente consegue continuar sem reconstruir o contexto completo.

## 11. Estado normativo proposto

```text
MCF_DEC_004=NAO_APROVADA
CARTAO_DE_CONTINUIDADE=PROPOSTO
CARTAO_NO_TOPO=OBRIGATORIO_SE_APROVADO
TIPOS_OFICIAIS=3
RESPOSTA_EXATA_AO_LEO=OBRIGATORIA
RECOMENDACAO_DO_MESTRE=OBRIGATORIA_EM_GATE_HUMANO
```

## 12. Gate

```text
Evelyn — validação de experiência
→ Carmem — consolidação
→ Gabriel — versionamento
→ Emily — RC
→ Mestre — apresentação
→ Léo — aprovação ou correção
```

Esta proposta não autoriza merge na `main`.
