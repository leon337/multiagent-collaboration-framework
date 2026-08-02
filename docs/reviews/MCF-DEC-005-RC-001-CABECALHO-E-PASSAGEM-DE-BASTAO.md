# RC-001 — MCF-DEC-005 Cabeçalho de Orientação e Passagem de Bastão

**Data:** 2 de agosto de 2026  
**Objeto:** `MCF-DEC-005`  
**Revisora:** Emily  
**Commit de entrada:** `254d80c55719a7fa319b5495c3cebbe194a14f3a`

## Escopo

Verificar se o padrão aprovado:

- orienta Léo antes da leitura integral;
- mantém o trabalho visível no corpo;
- deixa continuidade acionável no final;
- diferencia orientação inicial de passagem de bastão;
- evita repetição excessiva;
- preserva seleção dinâmica e evidências;
- não autoriza merge.

## Achados

### Positivos

1. O cabeçalho informa objetivo, estado, responsável e decisão necessária.
2. A passagem de bastão informa origem, destino, entrega e próxima ação.
3. As duas estruturas possuem funções distintas e complementares.
4. O corpo detalhado permanece obrigatório em mensagens operacionais.
5. A próxima ação deve começar com verbo direto.
6. A regra impede encerramento operacional sem responsável e ação seguintes.
7. O documento não autoriza merge nem implementação de software.

### Ressalvas baixas

1. A consistência visual dependerá de uso disciplinado enquanto não houver validação automatizada.
2. Mensagens simples ainda precisarão de exemplo reduzido em documento futuro.

## Veredito

```yaml
veredito: PASS_WITH_MINOR_RESERVATIONS
critical: 0
high: 0
medium: 0
low: 2
```

## Gate

```yaml
metodologia: aprovada
merge_na_main: nao_autorizado
pr: manter_draft
proxima_acao: aplicar_o_padrao_nas_mensagens_seguintes
```
