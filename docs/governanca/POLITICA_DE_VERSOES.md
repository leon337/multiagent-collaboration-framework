# Política de Versões e Status Documental

**Versão:** 0.1-remediação  
**Classificação:** REGRA NORMATIVA  
**Objetivo:** LEA-274

## 1. Finalidade

Definir como documentos e releases são identificados, revisados, substituídos e publicados.

## 2. Formato de versão

Usar `MAJOR.MINOR.PATCH`:

- **MAJOR:** mudança incompatível na Constituição, autoridade ou fluxo central;
- **MINOR:** nova capacidade compatível, contrato ou protocolo;
- **PATCH:** correção sem mudança de sentido normativo.

Durante a fundação, sufixos podem indicar estado, por exemplo `0.1-remediação`.

## 3. Status documentais

- `RASCUNHO`: conteúdo inicial, sem autoridade normativa.
- `EM_REVISÃO`: submetido à avaliação competente.
- `REMEDIAÇÃO`: possui não conformidade em correção.
- `APROVADO`: conteúdo aceito, aguardando publicação quando aplicável.
- `VIGENTE`: publicado e obrigatório.
- `SUPERADO`: substituído por versão identificada.
- `ARQUIVADO`: preservado apenas como histórico.

## 4. Cabeçalho mínimo

Documento normativo deve indicar:

- título;
- versão;
- classificação;
- status;
- objetivo ou decisão de origem;
- responsável;
- referências aplicáveis.

## 5. Mudança normativa

Toda mudança normativa deve registrar:

1. problema observado;
2. regra anterior;
3. mudança proposta;
4. impacto;
5. riscos;
6. decisão;
7. versão de vigência;
8. artefatos afetados.

## 6. Compatibilidade

Mudanças que alteram autoridade, estados finais, gates ou significado de evidência exigem versão MAJOR ou decisão constitucional explícita.

## 7. Substituição

Documento superado não deve ser apagado quando possuir valor histórico. Deve apontar para a versão sucessora e ser removido dos índices operacionais vigentes.

## 8. Release

Uma release deve incluir:

- versão;
- commit ou tag;
- PR;
- resumo das mudanças;
- auditoria e reteste;
- decisão de liberação;
- limitações conhecidas;
- estado no Linear.

## 9. Fundação atual

A fundação permanece em versão pré-estável até o fechamento da issue GitHub #10, aceitação do reteste e reconciliação final. `DF-008` autoriza a publicação após os gates objetivos.
