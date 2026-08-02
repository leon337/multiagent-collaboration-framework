# RC-001 — Revisão Crítica Independente da MCF-DEC-002

**Data:** 2 de agosto de 2026  
**Revisora:** Emily  
**Objeto:** `MCF-DEC-002 — Política de Trabalho Visível por Agente e Artefato por Mensagem`  
**PR:** #15  
**HEAD originalmente revisado:** `e198f9cb5e6f1cc0b74c4bd04d572030348a1d01`  
**HEAD corrigido revisado:** `e897d6856de1c3de2c2b62adb3f33f4d21bdde58`  
**Natureza da independência:** documental e procedimental; os papéis são executados pelo mesmo ChatGPT e não representam instâncias cognitivamente independentes.

## 1. Escopo da revisão

A RC verificou:

- compatibilidade com `MCF-DEC-001`;
- seleção dinâmica por competência;
- exposição do trabalho dos agentes selecionados;
- artefato obrigatório em toda mensagem;
- gradação entre mensagens A, B e C;
- conteúdo mínimo obrigatório por agente;
- execução silenciosa;
- papel do Mestre;
- papel de Carmem;
- papel de Emily;
- tratamento de não conformidade;
- inclusão de Manoel;
- fronteira entre Sofia e Manoel;
- autorizações e limites;
- estado do PR e isolamento da `main`.

## 2. Evidências examinadas

- `README.md`;
- `docs/decisions/MCF-DEC-001-ARQUITETURA-LOOP-E-EQUIPE-AMPLIADA.md`;
- `docs/decisions/MCF-DEC-002-TRABALHO-VISIVEL-E-ARTEFATO-POR-CICLO.md`;
- PR Draft #15;
- commits `e198f9cb5e6f1cc0b74c4bd04d572030348a1d01` e `e897d6856de1c3de2c2b62adb3f33f4d21bdde58`;
- decisão explícita de Léo pela Opção A;
- histórico metodológico do experimento `MACF-EXP.1`.

## 3. Achados positivos

### 3.1 Decisão da autoridade final incorporada

Léo escolheu expressamente a Opção A:

> artefato em absolutamente toda mensagem, inclusive saudação e confirmação curta.

A versão corrigida incorpora essa decisão sem ambiguidade.

### 3.2 Compatibilidade metodológica

A nova decisão complementa `MCF-DEC-001` e preserva a seleção dinâmica. Artefato obrigatório em toda mensagem não significa participação obrigatória de todos os agentes.

### 3.3 Gradação proporcional

A divisão em Classes A, B e C evita que uma saudação exija o mesmo volume documental de uma implementação crítica:

- Classe A: registro mínimo;
- Classe B: contrato, trabalho visível e evidências;
- Classe C: evidência técnica reforçada e RC quando aplicável.

### 3.4 Rastreabilidade

Cada agente selecionado deve expor:

- entrada;
- pesquisa;
- achados;
- análise;
- decisão;
- entrega;
- evidência;
- passagem de bastão.

### 3.5 Artefato por mensagem

Toda mensagem deve criar, atualizar ou registrar uma entrada em artefato verificável. A ausência de artefato é não conformidade, mesmo em mensagem casual.

### 3.6 Governança

O Mestre deve classificar a mensagem, selecionar agentes, impedir atribuição fictícia, exigir evidência, informar o artefato e declarar o estado final.

### 3.7 Manoel

Manoel está formalmente reconhecido como Especialista em Banco de Dados, com responsabilidades e fronteira inicial com Sofia.

### 3.8 Limites

A decisão não autoriza:

- merge na `main`;
- implementação de software;
- publicação automática.

## 4. Não conformidades e ressalvas

### M-01 — README não reflete a norma mais recente

**Severidade:** média  
**Estado:** aberto  

O README ainda apresenta o fluxo fixo histórico. Após eventual merge, a página inicial continuará oferecendo visão incompleta do funcionamento atual.

**Recomendação:** atualizar o README em tarefa posterior, referenciando `MCF-DEC-001` e `MCF-DEC-002`.

**Bloqueia o PR atual:** não.

### M-02 — Mensagem versus ciclo operacional

**Severidade original:** média  
**Estado:** resolvido  

Léo escolheu explicitamente a Opção A. A decisão foi corrigida para exigir artefato em toda mensagem, inclusive saudação e confirmação curta.

**Evidência da resolução:** commit `e897d6856de1c3de2c2b62adb3f33f4d21bdde58`.

### L-01 — Independência documental

**Severidade:** baixa  
**Estado:** aceita como limitação  

A revisão é independente por papel, checklist e separação documental, mas não por instância técnica separada.

**Recomendação:** manter essa limitação registrada em RCs futuras.

## 5. Contagem de achados abertos

```yaml
critical: 0
high: 0
medium: 1
low: 1
resolved_medium: 1
```

## 6. Veredito atualizado

```text
PASS_WITH_RESERVATIONS
```

A `MCF-DEC-002` corrigida está metodologicamente consistente e representa a decisão expressa de Léo.

A ressalva média restante é documental e não bloqueia o PR atual.

O parecer não autoriza merge.

## 7. Gates restantes

- decisão explícita de Léo sobre aprovação final e merge;
- atualização futura do README;
- merge somente mediante autorização expressa.