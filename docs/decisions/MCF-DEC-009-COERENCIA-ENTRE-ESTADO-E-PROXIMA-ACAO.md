# MCF-DEC-009 — Coerência entre Estado, Próxima Ação e Regra Permanente

**Data:** 2 de agosto de 2026  
**Autoridade:** Léo  
**Estado:** correção metodológica  
**Relacionadas:** `MCF-DEC-005`, `MCF-DEC-006`, `MCF-DEC-008`

## 1. Problema

Foi declarado `Estado: ENCERRADO` ao mesmo tempo em que a passagem de bastão continha uma `Próxima ação` diferente de `nenhuma`.

Essa combinação é contraditória. Um fluxo não pode estar encerrado enquanto ainda possui tarefa pendente no ciclo atual.

## 2. Decisão

1. `Próxima ação` representa exclusivamente uma tarefa ainda pendente no ciclo atual.
2. Quando `Próxima ação` for diferente de `nenhuma`, o estado não pode ser `CONCLUIDO` nem `ENCERRADO`.
3. Orientações aplicáveis a missões futuras devem ser registradas como `Regra permanente`, e não como `Próxima ação`.
4. `Regra permanente` não bloqueia a conclusão do ciclo atual.
5. A passagem de bastão deve apontar para agente real ou Léo.
6. Estados nunca podem ser usados como destinatários.

## 3. Invariantes

```yaml
invariante_1:
  quando: proxima_acao != nenhuma
  estados_permitidos:
    - EM_EXECUCAO
    - AGUARDANDO
    - BLOQUEADO
  estados_proibidos:
    - CONCLUIDO
    - ENCERRADO

invariante_2:
  quando: estado in [CONCLUIDO, ENCERRADO]
  proxima_acao: nenhuma

invariante_3:
  regra_permanente:
    bloqueia_encerramento: false
```

## 4. Exemplo correto

```text
De: Mestre
Para: Léo
Entrega: ciclo concluído
Próxima ação: nenhuma
Estado: ENCERRADO

Regra permanente:
Aplicar o fluxo completo em uma única resposta nas próximas missões.
```

## 5. Não conformidade

É não conformidade:

- declarar encerramento com ação pendente;
- usar regra futura como próxima ação do ciclo atual;
- usar estado como destinatário;
- ocultar tarefa pendente em observação genérica.

## 6. Autorizações

```yaml
registro_metodologico: autorizado
versionamento_em_branch: autorizado
pr_draft: autorizado
merge_na_main: nao_autorizado
```
