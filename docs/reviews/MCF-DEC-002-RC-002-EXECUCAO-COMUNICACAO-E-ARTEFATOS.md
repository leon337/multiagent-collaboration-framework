# RC-002 — Revisão Crítica da MCF-DEC-002 na Execução Real

**Data:** 2 de agosto de 2026  
**Revisora:** Emily  
**Objeto:** `MCF-DEC-002 — Política de Trabalho Visível por Agente e Artefato por Mensagem`  
**PR:** #15  
**HEAD de entrada:** `77c09d1009766051ba2992c070fd2676449706f4`  
**Natureza da independência:** documental e procedimental; os papéis são executados pelo mesmo ChatGPT.

## 1. Motivo da RC-002

A RC-001 avaliou principalmente a consistência textual da metodologia. Após sua aplicação prática na conversa, surgiram falhas que não foram capturadas adequadamente:

- o Mestre deixou de atuar claramente como ponte entre Léo e a equipe;
- Gabriel e Carmem não apresentaram integralmente seu trabalho antes da consolidação;
- os artefatos existiam no GitHub, mas não foram entregues de modo claro ao Léo;
- a regra de artefato por mensagem começou a gerar commits sobre mensagens e risco de recursão documental;
- o caminho físico do arquivo continuou usando `POR-CICLO`, enquanto o conteúdo passou a usar `POR-MENSAGEM`.

Esta RC audita a metodologia pelo comportamento real produzido, não apenas por sua redação.

## 2. Evidências examinadas

- `README.md`;
- `docs/decisions/MCF-DEC-001-ARQUITETURA-LOOP-E-EQUIPE-AMPLIADA.md`;
- `docs/decisions/MCF-DEC-002-TRABALHO-VISIVEL-E-ARTEFATO-POR-CICLO.md`;
- `docs/reviews/MCF-DEC-002-RC-001.md`;
- PR Draft #15;
- HEAD `77c09d1009766051ba2992c070fd2676449706f4`;
- sequência de mensagens desta missão;
- commits criados para registrar a decisão e mensagens subsequentes.

## 3. Achados positivos

### 3.1 Trabalho silencioso explicitamente proibido

A metodologia exige exposição individual dos agentes selecionados e proíbe atribuição fictícia.

### 3.2 Artefato e evidência reconhecidos como parte do fluxo

A decisão obriga a criação, atualização ou registro em artefato verificável.

### 3.3 Seleção dinâmica preservada

A metodologia não exige participação artificial de toda a equipe.

### 3.4 Papéis de Carmem, Gabriel e Emily existem

Carmem consolida, Gabriel versiona e Emily audita.

### 3.5 Manoel foi formalmente incluído

O especialista em Banco de Dados está reconhecido, com fronteira inicial com Sofia.

## 4. Não conformidades estruturais

### H-01 — Mestre não formalizado como ponte única de comunicação

**Severidade:** alta  
**Estado:** aberto

A metodologia lista obrigações do Mestre, mas não estabelece de forma inequívoca que:

- todos os agentes se comunicam com Léo por meio do Mestre;
- o Mestre apresenta cada passagem em ordem;
- o Mestre não pode desaparecer entre blocos de agentes e ferramentas;
- o Mestre deve traduzir o estado técnico em comunicação clara para Léo;
- nenhuma entrega é considerada feita até o Mestre apresentá-la e apontar seu artefato.

**Evidência prática:** Léo precisou cobrar onde estavam Gabriel, Carmem e os artefatos.

**Correção obrigatória:** criar seção `Mestre como ponte oficial` com protocolo explícito de abertura, apresentação de agentes, passagem, entrega, confirmação e encerramento.

### H-02 — Contrato de entrega do artefato ao Léo é insuficiente

**Severidade:** alta  
**Estado:** aberto

A metodologia exige que o artefato exista e que o Mestre informe onde está, mas não define um pacote mínimo de entrega.

O resultado foi um artefato tecnicamente existente, porém operacionalmente invisível ou mal localizado para Léo.

**Correção obrigatória:** toda entrega deve conter, no mesmo bloco final:

- nome do artefato;
- tipo;
- caminho no repositório;
- link navegável;
- commit que o contém;
- estado (`rascunho`, `em revisão`, `aprovado`, `publicado`);
- agente autor;
- agente revisor;
- relação com o objetivo atual.

### H-03 — Artefato por mensagem pode produzir recursão documental

**Severidade:** alta  
**Estado:** aberto

A regra atual permite que cada mensagem gere commit. O commit que registra a mensagem exige nova mensagem; essa nova mensagem pode exigir novo artefato e novo commit. Isso pode criar:

- loop autorreferente;
- poluição do histórico;
- aumento de custo e latência;
- perda de legibilidade;
- foco no registro em vez do trabalho.

**Correção obrigatória:** distinguir:

- artefato de conversa, que pode ser um log agregado e não exige commit imediato;
- artefato de trabalho, que é versionado quando existe mudança material;
- evidência de publicação, que exige commit ou PR.

A regra `artefato em toda mensagem` pode permanecer, mas mensagens simples devem atualizar um log agregado fora do ciclo de commit imediato.

### M-01 — Carmem e Gabriel não possuem gate de apresentação obrigatória

**Severidade:** média  
**Estado:** aberto

A metodologia define suas funções, mas não obriga que ambos apresentem integralmente:

- o que receberam;
- o que pesquisaram;
- o que produziram;
- onde está a entrega;
- qual commit ou arquivo prova a ação;
- o que passa ao próximo agente.

**Correção obrigatória:** em qualquer missão com documentação e versionamento, Carmem e Gabriel devem aparecer antes de Emily e antes da decisão final do Mestre.

### M-02 — Nome físico do arquivo contradiz a norma atual

**Severidade:** média  
**Estado:** aberto

O arquivo se chama `...POR-CICLO.md`, enquanto seu título e o PR dizem `...POR-MENSAGEM`.

**Correção obrigatória:** renomear o arquivo e atualizar todas as referências.

### M-03 — RC-001 auditou o texto, não o comportamento emergente

**Severidade:** média  
**Estado:** aberto

A metodologia prevê RC, mas não obriga validação prática antes da aprovação final.

**Correção obrigatória:** toda metodologia operacional deve passar por:

1. revisão estática;
2. simulação controlada;
3. observação de falhas emergentes;
4. RC pós-simulação;
5. decisão final.

### M-04 — Classes A, B e C não definem canal e retenção do artefato

**Severidade:** média  
**Estado:** aberto

As classes definem profundidade, mas não definem onde o registro fica, por quanto tempo, quando é consolidado e quando vira commit.

**Correção obrigatória:** definir política de armazenamento e retenção para cada classe.

### L-01 — Independência apenas documental

**Severidade:** baixa  
**Estado:** aceito como limitação

Os agentes são papéis documentais executados pelo mesmo ChatGPT. A revisão não prova independência cognitiva entre agentes.

## 5. Contagem de achados abertos

```yaml
critical: 0
high: 3
medium: 4
low: 1
```

## 6. Veredito

```text
REQUEST_CORRECTION
```

A metodologia não está pronta para aprovação final ou merge.

Ela possui boa base conceitual, mas falhou em quatro aspectos essenciais durante a execução real:

1. comunicação do Mestre;
2. entrega visível dos artefatos;
3. apresentação obrigatória de Carmem e Gabriel;
4. prevenção de recursão documental.

## 7. Correções obrigatórias antes de nova RC

- formalizar o Mestre como ponte oficial e única entre equipe e Léo;
- criar contrato mínimo de entrega de artefato;
- separar artefato por mensagem de commit por mensagem;
- criar log agregado para mensagens Classe A;
- exigir apresentação integral de Carmem e Gabriel em missões de documentação/versionamento;
- renomear o arquivo de `POR-CICLO` para `POR-MENSAGEM`;
- atualizar todas as referências;
- adicionar teste/simulação controlada da metodologia;
- executar RC-003 após a simulação.

## 8. Gate

```yaml
merge_na_main: bloqueado
aprovacao_final: bloqueada
estado_do_pr: draft
proxima_acao: corrigir_metodologia
```

Este parecer não autoriza merge.