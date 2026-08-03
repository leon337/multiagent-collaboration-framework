# MCF-DEC-039 — Aprovação do Baseline de Segurança e Abuso

**Data:** 3 de agosto de 2026  
**Autoridade delegada:** Léo  
**Coordenação:** Mestre  
**Auditoria:** Emily  
**PR:** #32  
**Estado:** APROVADO SOB GATE FINAL

## Entradas

- configuração segura de runtime;
- migração `0011`;
- rate limiting persistente e pseudonimizado;
- políticas por risco e rota;
- limite de payload e headers HTTP;
- workflow técnico `30792374178`;
- workflow documental `30792374155`;
- parecer `MCF-DEC-038-RC-001`.

## Deliberação

O Slice A estabelece uma barreira inicial contra abuso sem introduzir dependência externa adicional. O contador é atômico, os sujeitos são pseudonimizados antes da persistência e a configuração de produção falha de modo seguro quando o segredo obrigatório não é fornecido.

As ressalvas de limpeza, rajada de janela fixa, topologia de proxy, calibração e testes HTTP completos não bloqueiam a integração. Elas permanecem obrigatórias nas próximas trilhas de prontidão.

## Decisão

```yaml
fase_1_9a: APROVADA
pr_32: AUTORIZADO_PARA_MERGE
baseline_http_seguro: APROVADO
rate_limiting_postgresql: APROVADO
pseudonimizacao_hmac: APROVADA
primeiro_deploy_publico: NAO_AUTORIZADO_NESTE_GATE
usuarios_reais: NAO_ATIVADOS
producao_pronta: NAO
```

## Continuidade automática

```yaml
fase: 1.9b
nome: PRIVACIDADE_DIREITOS_E_CICLO_DE_VIDA_DOS_DADOS
objetivo: implementar_politicas_exportacao_e_anonimizacao_antes_do_rollout
novo_gate_humano_rotineiro: NAO
```

A transição para o Slice B deve ocorrer imediatamente após o merge do PR #32, preservando a proibição de interromper o fluxo apenas para emitir relatório.
