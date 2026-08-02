# RC-001 — Revisão Crítica Independente da MCF-DEC-002

**Data:** 2 de agosto de 2026  
**Revisora:** Emily  
**Objeto:** `MCF-DEC-002 — Política de Trabalho Visível por Agente e Artefato por Ciclo`  
**PR:** #15  
**HEAD inicial revisado:** `e198f9cb5e6f1cc0b74c4bd04d572030348a1d01`  
**Natureza da independência:** documental e procedimental; os papéis são executados pelo mesmo ChatGPT e não representam instâncias cognitivamente independentes.

## 1. Escopo da revisão

A RC verificou:

- compatibilidade com `MCF-DEC-001`;
- seleção dinâmica por competência;
- exposição do trabalho dos agentes selecionados;
- conteúdo mínimo obrigatório por agente;
- artefato e evidência por ciclo;
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
- commit `e198f9cb5e6f1cc0b74c4bd04d572030348a1d01`;
- histórico metodológico do experimento `MACF-EXP.1`.

## 3. Achados positivos

### 3.1 Compatibilidade metodológica

A nova decisão complementa `MCF-DEC-001` e preserva a seleção dinâmica. Ela não determina participação artificial de toda a equipe.

### 3.2 Rastreabilidade

Cada agente selecionado deve expor:

- entrada;
- pesquisa;
- achados;
- análise;
- decisão;
- entrega;
- evidência;
- passagem de bastão.

A estrutura reduz consolidação silenciosa e melhora auditoria.

### 3.3 Artefatos e evidências

A decisão exige artefato próprio ou atualização de artefato existente em cada ciclo operacional e impede conclusão sem evidência.

### 3.4 Governança

O Mestre recebe obrigações claras de seleção, justificação, controle do estado, preservação de divergências, exigência de evidência e classificação do ciclo.

### 3.5 Não conformidade

A decisão define um fluxo de correção e proíbe reconstrução retroativa inventada.

### 3.6 Manoel

Manoel é formalmente reconhecido como Especialista em Banco de Dados, com responsabilidades e fronteira inicial com Sofia.

### 3.7 Limites

A decisão não autoriza:

- merge na `main`;
- implementação de software;
- publicação automática.

## 4. Não conformidades e ressalvas

### M-01 — README não reflete a norma mais recente

**Severidade:** média  
**Estado:** aberto  

O README ainda apresenta o fluxo fixo histórico. Após aprovação e eventual merge da decisão, a página inicial continuará oferecendo uma visão incompleta do funcionamento atual.

**Recomendação:** abrir uma tarefa posterior para atualizar o README com referência a `MCF-DEC-001` e `MCF-DEC-002`, sem duplicar integralmente as decisões.

**Bloqueia o PR atual:** não.

### M-02 — “Mensagem” versus “ciclo operacional”

**Severidade:** média  
**Estado:** aguardando confirmação do Léo  

A solicitação verbal mencionou artefato “a cada mensagem”. A decisão formaliza artefato por ciclo operacional e exclui mensagens casuais do ciclo completo.

A escolha é operacionalmente coerente e evita artefatos inúteis para saudações ou confirmações simples, mas deve ser confirmada pela autoridade final.

**Recomendação:** Léo confirmar uma das interpretações:

1. artefato em toda mensagem, inclusive casual; ou
2. artefato em toda mensagem operacional/ciclo de trabalho.

**Bloqueia o PR atual:** não, desde que a confirmação ocorra antes do merge.

### L-01 — Independência documental

**Severidade:** baixa  
**Estado:** aceita como limitação  

A revisão é independente por papel, checklist e separação documental, mas não por instância técnica separada.

**Recomendação:** manter essa limitação explicitamente registrada em RCs futuras.

## 5. Contagem de achados

```yaml
critical: 0
high: 0
medium: 2
low: 1
```

## 6. Veredito

```text
PASS_WITH_RESERVATIONS
```

A `MCF-DEC-002` está metodologicamente consistente e apta para decisão do Léo.

O parecer não autoriza merge.

## 7. Gates restantes

- confirmação do Léo sobre “mensagem” versus “ciclo operacional”;
- decisão do Léo sobre aprovação da metodologia;
- atualização futura do README;
- merge somente mediante autorização explícita.