# LEO-DEC-004 — Aprovação da MCF-DEC-051

**Data:** 4 de agosto de 2026  
**Autoridade operacional delegada:** Léo  
**Base:** MCF-DEC-017 e instrução direta de Leandro  
**Objeto:** execução sequencial visível e rastreabilidade por fase

## 1. Entradas analisadas

- determinação de Leandro e exemplos visuais do Screen Assistant;
- MCF-DEC-051;
- protocolo operacional versão 1.1;
- prompt portátil atualizado;
- template unificado atualizado;
- pacote de templates por fase;
- RC-001 de Emily com `PASS_WITH_MINOR_RESERVATIONS`;
- zero achados críticos, altos ou médios.

## 2. Decisão

```yaml
mcf_dec_051: APROVADA
esev_execucao_sequencial: OBRIGATORIA
sintese_retrospectiva_como_execucao: PROIBIDA
passagens_intercaladas: OBRIGATORIAS
loops_e_recuperacoes_visiveis: OBRIGATORIOS
prf_pacote_de_rastreabilidade_por_fase: OBRIGATORIO
checkpoint_por_fase: OBRIGATORIO
resposta_unica_cronologica: OBRIGATORIA_QUANDO_TECNICAMENTE_POSSIVEL
adocao_operacional: IMEDIATA
merge: AUTORIZADO_APOS_PR_E_CI_VERDE
novo_gate_de_Leandro: NAO_NECESSARIO
```

## 3. Interpretação obrigatória

O MCF não considera mais suficiente uma seção final que apenas diga o que cada agente fez.

A apresentação correta deve permitir acompanhar:

```text
agente atua
→ ação e evidência aparecem
→ decisão é registrada
→ bastão é passado
→ próximo agente continua
→ falha ou correção aparece
→ fase gera documentos
→ Léo decide
→ Mestre entrega a fase a Leandro
```

## 4. Ressalvas aceitas

- componentes visuais dependem da interface;
- equivalente textual verificável é obrigatório quando não houver componente;
- SHA-256 deve ser calculado de verdade em cada pacote;
- validador automatizado será evolução posterior;
- dependências externas reais podem usar estado de espera com checkpoint.

## 5. Próxima ação

```text
Gabriel cria PR
→ CI valida documentação e regressões
→ Gabriel integra após gates verdes
→ Mestre apresenta o resultado usando o próprio formato ESEV
```