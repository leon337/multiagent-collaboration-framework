# MCF-DEC-008 — RC-001 — Fluxo em uma Única Resposta

**Data:** 2 de agosto de 2026  
**Revisora:** Emily  
**Objeto:** `MCF-DEC-008-FLUXO-COMPLETO-EM-UMA-UNICA-RESPOSTA.md`

## Veredito

```yaml
veredito: PASS
critical: 0
high: 0
medium: 0
low: 0
```

## Evidências avaliadas

- interrupções anteriores após passagem de bastão;
- necessidade de Léo enviar `Continue` para trabalho já autorizado;
- regra de continuidade automática;
- cabeçalho de orientação;
- passagem de bastão real;
- proibição de auto-passagem;
- limites de autorização.

## Conclusão

A decisão resolve a falha central: a passagem de bastão entre agentes passa a ser uma transição interna da mesma resposta. O Mestre deve continuar imediatamente com o agente seguinte e só pode encerrar quando houver conclusão, bloqueio real, novo gate humano ou limite de autorização.

A política preserva transparência sem fragmentar a execução.

## Critérios confirmados

```yaml
agentes_visiveis: true
continuidade_na_mesma_resposta: true
interrupcao_entre_agentes: false
pedido_de_continue_para_escopo_autorizado: false
auto_passagem: false
gates_humanos_preservados: true
```

## Limite

Esta revisão não autoriza merge na `main`, implementação de software, deploy ou publicação automática.
