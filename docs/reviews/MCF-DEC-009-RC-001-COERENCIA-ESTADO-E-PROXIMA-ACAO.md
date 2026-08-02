# RC-001 — MCF-DEC-009 — Coerência entre Estado e Próxima Ação

**Data:** 2 de agosto de 2026  
**Revisora:** Emily  
**Objeto:** `MCF-DEC-009-COERENCIA-ENTRE-ESTADO-E-PROXIMA-ACAO.md`

## Veredito

`PASS`

```yaml
critical: 0
high: 0
medium: 0
low: 0
```

## Evidência revisada

A mensagem anterior declarou `Estado: ENCERRADO` enquanto apresentava uma próxima ação: aplicar o fluxo completo em missões futuras.

A decisão corrige a ambiguidade distinguindo:

- próxima ação do ciclo atual;
- regra permanente para ciclos futuros;
- estado do fluxo;
- destinatário da passagem de bastão.

## Testes documentais

| Cenário | Resultado |
|---|---|
| Próxima ação existente + EM_EXECUCAO | PASS |
| Próxima ação existente + ENCERRADO | BLOQUEADO |
| Próxima ação nenhuma + ENCERRADO | PASS |
| Regra permanente + ENCERRADO | PASS |
| Estado usado como destinatário | BLOQUEADO |
| Agente real ou Léo como destinatário | PASS |

## Conclusão

A regra elimina a contradição observada e pode ser aplicada imediatamente nas mensagens operacionais.

```yaml
merge_na_main: nao_autorizado
pr_draft: preservado
```
