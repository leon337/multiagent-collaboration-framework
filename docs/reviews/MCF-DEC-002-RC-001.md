# RC-001 — Revisão Crítica Independente da MCF-DEC-002

**Data:** 2 de agosto de 2026  
**Revisora:** Emily  
**Objeto:** `MCF-DEC-002 — Política de Trabalho Visível por Agente e Artefato por Mensagem`  
**PR:** #15  
**HEAD inicial:** `e198f9cb5e6f1cc0b74c4bd04d572030348a1d01`  
**HEAD final revisado:** `a36532731764df8cf1df3ad718b3293fa2ba1dde`  
**Natureza da independência:** documental e procedimental; os papéis são executados pelo mesmo ChatGPT.

## Escopo

A revisão verificou:

- compatibilidade com `MCF-DEC-001`;
- seleção dinâmica por competência;
- exposição do trabalho dos agentes selecionados;
- artefato obrigatório em toda mensagem;
- gradação entre Classes A, B e C;
- execução silenciosa;
- papéis de Mestre, Carmem, Emily e Manoel;
- tratamento de não conformidade;
- autorizações e limites;
- isolamento da `main`.

## Evidências

- `README.md`;
- `MCF-DEC-001`;
- `MCF-DEC-002` no HEAD final;
- PR Draft #15;
- decisão explícita de Léo pela Opção A;
- commits da branch até `a36532731764df8cf1df3ad718b3293fa2ba1dde`;
- histórico do experimento `MACF-EXP.1`.

## Achados positivos

1. A decisão de Léo foi incorporada sem ambiguidade: toda mensagem exige artefato, inclusive saudação e confirmação curta.
2. A seleção dinâmica foi preservada; artefato obrigatório não implica participação obrigatória de todos os agentes.
3. As Classes A, B e C mantêm proporcionalidade documental.
4. O trabalho dos agentes selecionados deve mostrar entrada, pesquisa, achados, análise, decisão, entrega, evidência e passagem.
5. O Mestre deve classificar a mensagem, impedir atribuição fictícia, exigir artefato e declarar o estado final.
6. Manoel foi formalmente reconhecido como Especialista em Banco de Dados.
7. Merge, implementação de software e publicação automática continuam não autorizados.

## Não conformidades e ressalvas

### M-01 — README desatualizado

**Severidade:** média  
**Estado:** aberto  
**Bloqueia o PR:** não

O README ainda apresenta o fluxo fixo histórico. Recomenda-se atualização posterior para referenciar `MCF-DEC-001` e `MCF-DEC-002`.

### M-02 — Mensagem versus ciclo

**Severidade original:** média  
**Estado:** resolvido

Léo escolheu a Opção A. A decisão agora exige artefato em toda mensagem.

### L-01 — Independência documental

**Severidade:** baixa  
**Estado:** aceita como limitação

A revisão é independente por papel e checklist, mas não por instância técnica separada.

## Contagem aberta

```yaml
critical: 0
high: 0
medium: 1
low: 1
resolved_medium: 1
```

## Veredito

```text
PASS_WITH_RESERVATIONS
```

A `MCF-DEC-002` no HEAD final está consistente com a decisão de Léo. A ressalva média restante é documental e não bloqueia o PR.

Este parecer não autoriza merge.

## Gates restantes

- decisão explícita de Léo sobre aprovação final e merge;
- atualização futura do README;
- merge somente mediante autorização expressa.