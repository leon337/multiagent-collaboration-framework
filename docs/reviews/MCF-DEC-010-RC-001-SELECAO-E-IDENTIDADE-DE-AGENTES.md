# MCF-DEC-010 — RC-001

## Revisão Crítica da Separação Leandro–Léo e da Justificativa de Seleção de Agentes

**Data:** 2 de agosto de 2026  
**Revisora:** Emily  
**Objeto:** `MCF-DEC-010-SEPARACAO-LEANDRO-LEO-E-JUSTIFICATIVA-DE-SELECAO-DE-AGENTES.md`  
**PR:** #15  
**Estado:** revisão concluída

## 1. Escopo da revisão

A revisão verificou:

- preservação da numeração histórica;
- coerência com a MCF-DEC-003;
- separação entre Leandro e Léo;
- contagem dos 17 agentes permanentes;
- alinhamento das funções oficiais;
- correção da seleção do projeto Rede Social para Agentes de IA;
- justificativa dos agentes selecionados e não selecionados;
- limites de autorização e merge.

## 2. Evidências verificadas

- a MCF-DEC-003 já ocupa o índice 003;
- o PR #15 contém decisões de MCF-DEC-002 até MCF-DEC-009;
- a composição oficial contém 17 agentes nomeados;
- Ricardo é o responsável por Segurança;
- Carlos é o responsável por inovação e riscos futuros;
- os cinco especialistas por demanda não pertencem ao núcleo permanente;
- Leandro declarou ser uma pessoa distinta do agente Léo;
- o PR permanece Draft e o merge não está autorizado.

## 3. Achados

### Correções confirmadas

1. A decisão não reutiliza o índice 003.
2. O índice 010 segue a sequência real existente no PR.
3. A função de Segurança foi corrigida de Carlos para Ricardo.
4. A seleção do primeiro ciclo foi mantida com sete agentes por substituição, não por expansão artificial.
5. Todos os dez agentes não selecionados receberam justificativa objetiva.
6. Leandro foi removido da contagem dos agentes.
7. Léo foi preservado como agente separado.
8. A decisão não autoriza implementação, publicação automática ou merge.

## 4. Ressalvas menores

### L-01 — Harmonização histórica pendente

Documentos anteriores ainda descrevem Léo como autoridade final sem distinguir claramente autoridade humana e autoridade operacional delegada.

**Tratamento recomendado:** realizar uma atualização documental consolidada em decisão ou correção posterior, sem reescrever silenciosamente o histórico.

### L-02 — Papel detalhado de Léo

A decisão define Léo como agente de representação e decisão operacional delegada, mas o contrato completo de suas responsabilidades ainda não está formalizado.

**Tratamento recomendado:** definir em documento futuro entradas, saídas, limites e situações de acionamento de Léo.

## 5. Veredito

```yaml
veredito: PASS_WITH_MINOR_RESERVATIONS
critical: 0
high: 0
medium: 0
low: 2
```

A decisão está coerente, auditável e apta para uso operacional dentro da branch do PR #15.

## 6. Gate

```yaml
uso_operacional: autorizado
registro_em_branch: concluido
merge_na_main: nao_autorizado
implementacao_de_software: nao_autorizada
proxima_acao: atualizar_descricao_do_pr
```
