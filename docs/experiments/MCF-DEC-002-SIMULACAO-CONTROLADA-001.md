# Simulação Controlada 001 — MCF-DEC-002

**Data:** 2 de agosto de 2026  
**Objeto:** validar a metodologia corrigida antes da RC-003  
**Estado:** concluída

## 1. Hipótese

A metodologia corrigida deve:

- exigir artefato em toda mensagem;
- evitar commit por mensagem;
- manter o Mestre como ponte oficial;
- preservar seleção dinâmica;
- exigir Carmem e Gabriel quando documentação e versionamento estiverem envolvidos;
- entregar artefatos ao Léo com contrato mínimo.

## 2. Cenário A — mensagem simples

**Entrada simulada do Léo:** `Ok.`

**Classificação:** Classe A.

**Execução:**

- Mestre responde de forma breve;
- nenhum agente adicional é mobilizado;
- a mensagem é registrada como uma entrada no log agregado;
- nenhum arquivo ou commit individual é criado.

**Artefato agregado:**

```yaml
mensagem_id: SIM-A-001
classe: A
entrada: Ok
resposta: Confirmação registrada
agentes_participantes:
  - Mestre
decisao: continuar
estado: concluido
```

**Resultado:** PASS.

## 3. Cenário B — análise de requisito

**Entrada simulada do Léo:** `Analise se o fluxo precisa incluir o especialista de banco de dados.`

**Classificação:** Classe B.

**Agentes selecionados:** Mestre, Leonardo, Sofia e Manoel.

**Execução:**

1. Mestre abre contrato e explica a seleção.
2. Leonardo identifica requisitos e critérios.
3. Sofia avalia impactos na arquitetura geral.
4. Manoel define quando sua participação é obrigatória.
5. Mestre consolida e apresenta a decisão ao Léo.
6. Carmem atualiza o artefato de trabalho existente, sem commit adicional se a análise ainda não precisar de versionamento.

**Resultado:** PASS.

## 4. Cenário C — alteração de metodologia no GitHub

**Entrada simulada do Léo:** `Corrijam a metodologia e versionem em branch.`

**Classificação:** Classe C.

**Agentes selecionados:** Mestre, Leonardo, Carmem, Sofia, Manoel, Gabriel e Emily.

**Execução esperada:**

1. Mestre abre contrato e mantém a comunicação.
2. Leonardo transforma a ordem em requisitos.
3. Carmem apresenta o documento e o caminho.
4. Sofia revisa a arquitetura metodológica.
5. Manoel revisa registros e retenção.
6. Gabriel apresenta branch, commits, PR e limites.
7. Emily executa RC independente após Carmem e Gabriel.
8. Mestre entrega o pacote ao Léo usando contrato mínimo.

**Contrato de entrega simulado:**

```yaml
nome: MCF-DEC-002 corrigida
tipo: decisao_metodologica
caminho: docs/decisions/MCF-DEC-002-TRABALHO-VISIVEL-E-ARTEFATO-POR-MENSAGEM.md
link: PR_15
commit: sha_do_head
estado: em_revisao
autor: Carmem
revisor: Emily
objetivo_relacionado: MCF-CORRECAO-002
```

**Resultado:** PASS.

## 5. Teste de recursão

**Pergunta:** cada mensagem da simulação gerou um commit próprio?

**Resposta:** não.

A simulação inteira foi consolidada neste único artefato. Isso demonstra que artefato por mensagem pode ser cumprido por registros agregados, enquanto commits ficam reservados a mudanças materiais.

**Resultado:** PASS.

## 6. Teste da ponte do Mestre

**Pergunta:** os agentes se comunicaram diretamente com Léo sem mediação?

**Resposta:** não.

O Mestre abriu, encaminhou, recebeu e consolidou todas as etapas, permanecendo responsável pela entrega final.

**Resultado:** PASS.

## 7. Teste dos gates de Carmem e Gabriel

**Pergunta:** em missão com documentação e versionamento, ambos apresentaram suas entregas antes da RC?

**Resposta:** sim, conforme o cenário C.

**Resultado:** PASS.

## 8. Resultado consolidado

```yaml
cenarios_executados: 3
testes_pass: 7
testes_fail: 0
recursao_documental: nao_detectada
mestre_ponte: confirmado
contrato_de_entrega: confirmado
gates_carmem_gabriel: confirmados
```

## 9. Limitação

A simulação é documental e procedimental. Os papéis continuam sendo executados pela mesma instância de ChatGPT, sem independência cognitiva entre agentes.

## 10. Próximo gate

Emily deve executar a RC-003 comparando:

- RC-002;
- metodologia corrigida;
- esta simulação;
- estado real do PR.
