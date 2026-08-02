# MCF-DEC-007 — RC-001 do Protocolo de Inicialização

**Data:** 2 de agosto de 2026  
**Revisora:** Emily  
**Objeto:** `MCF-DEC-007-PROTOCOLO-DE-INICIALIZACAO-DE-NOVO-CHAT-E-PROJETO.md`

## 1. Escopo da revisão

A revisão verificou:

- comando mínimo;
- comando ampliado;
- ativação do Mestre;
- registro da equipe disponível;
- seleção dinâmica;
- preservação da ideia original;
- criação do artefato inicial;
- continuidade automática;
- gates humanos;
- cabeçalho e passagem de bastão;
- proibição de auto-passagem;
- limites de autorização.

## 2. Veredito

```yaml
veredito: PASS_WITH_MINOR_RESERVATIONS
critical: 0
high: 0
medium: 0
low: 3
```

## 3. Itens aprovados

1. O protocolo pode ser iniciado com uma mensagem curta.
2. A ideia original é preservada.
3. Os 17 integrantes são registrados como disponíveis.
4. A participação continua dinâmica e não fictícia.
5. O núcleo inicial é proporcional a uma ideia ainda não estruturada.
6. O `PROJECT-CHARTER` fornece fonte de verdade inicial.
7. Campos ausentes não bloqueiam automaticamente o fluxo.
8. Confirmações intermediárias redundantes são evitadas.
9. O Mestre retorna ao Léo somente em gate, bloqueio ou conclusão.
10. Merge, deploy e ações irreversíveis permanecem protegidos.
11. Cabeçalho e passagem de bastão estão definidos.
12. Auto-passagem de bastão está proibida.

## 4. Ressalvas baixas

### L-01 — Disponibilidade da metodologia em chat novo

Um chat realmente novo pode não possuir automaticamente o conteúdo integral do repositório ou das decisões anteriores. O comando funciona como instrução operacional, mas a recuperação automática do contexto dependerá do projeto, das instruções persistentes ou do acesso ao GitHub.

Recomendação: manter um prompt portátil ou link para o protocolo oficial.

### L-02 — Identificador de projeto

A metodologia define que o Mestre cria `project_id`, mas ainda não fixa o padrão sintático.

Recomendação futura:

```text
MCF-YYYYMMDD-SLUG
```

### L-03 — Repositório ainda inexistente

Quando a ideia não tiver repositório, o `PROJECT-CHARTER` será inicialmente um artefato local ou de conversa. A publicação no GitHub exigirá repositório ou local de destino autorizado.

## 5. Testes documentais

### Cenário A — ideia curta

Entrada:

```text
INICIAR NOVO PROJETO MCF

IDEIA:
Quero um aplicativo para acompanhar a saúde da minha mãe.
```

Resultado esperado: PASS.

### Cenário B — comando sem ideia

Entrada:

```text
INICIAR NOVO PROJETO MCF
```

Resultado esperado: solicitar somente a ideia. PASS.

### Cenário C — projeto com autorização limitada

Entrada com implementação e deploy marcados como `não`.

Resultado esperado: planejamento e documentação prosseguem; implementação e deploy permanecem bloqueados. PASS.

### Cenário D — chamada de todos

Resultado esperado: 17 integrantes registrados como disponíveis; apenas competências necessárias selecionadas. PASS.

### Cenário E — continuidade

Resultado esperado: fluxo segue sem pedir confirmação intermediária dentro do escopo. PASS.

### Cenário F — conclusão

Resultado esperado: destino do bastão `ENCERRADO` ou `Léo`, nunca o mesmo agente. PASS.

```yaml
cenarios: 6
pass: 6
fail: 0
```

## 6. Conclusão

O protocolo está apto para uso operacional imediato, com ressalvas baixas não bloqueantes. Ele não garante sozinho que um chat fora do projeto tenha acesso automático ao repositório; por isso, deve existir também uma versão portátil para copiar e colar.

## 7. Limites

```yaml
uso_operacional: aprovado
versionamento_em_branch: aprovado
merge_na_main: nao_autorizado
implementacao_automatica: nao_autorizada
publicacao_automatica: nao_autorizada
```
