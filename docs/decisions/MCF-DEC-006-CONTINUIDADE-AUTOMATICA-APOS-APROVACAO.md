# MCF-DEC-006 — Continuidade Automática após Aprovação

**Data:** 2 de agosto de 2026  
**Autoridade:** Léo  
**Estado:** aprovado para versionamento e revisão crítica  
**Relacionadas:** `MCF-DEC-002`, `MCF-DEC-005`

## 1. Contexto

Durante a execução do fluxo, o Mestre interrompeu o processo depois de uma aprovação já suficiente para acionar os agentes seguintes. A interrupção ocorreu porque transparência foi tratada incorretamente como necessidade de nova autorização.

## 2. Decisão

Fica estabelecido que:

1. uma aprovação do Léo autoriza a continuidade automática de todas as etapas já incluídas no escopo aprovado;
2. o Mestre deve acionar os agentes necessários sem solicitar confirmações intermediárias redundantes;
3. o trabalho dos agentes continua visível;
4. visibilidade não implica interrupção;
5. o Mestre só retorna ao Léo quando houver novo gate humano, bloqueio real ou conclusão do ciclo;
6. nenhuma ação fora do escopo aprovado pode ser executada por inferência;
7. merge, publicação, deploy, exclusão, gasto ou alteração crítica continuam exigindo autorização quando não estiverem explicitamente incluídos.

## 3. Regra central

```text
TRANSPARENCIA_SEM_INTERRUPCAO
```

Fluxo:

```text
Decisão do Léo recebida
→ Mestre interpreta o escopo autorizado
→ aciona automaticamente os agentes necessários
→ apresenta as contribuições em ordem
→ preserva evidências e passagens
→ continua até conclusão, bloqueio ou novo gate humano
```

## 4. Quando continuar automaticamente

O Mestre continua sem retornar ao Léo quando:

- a próxima etapa já está no contrato aprovado;
- não há nova decisão de escopo;
- não há ação destrutiva ou irreversível não autorizada;
- não há conflito entre agentes que exija autoridade humana;
- existem evidências e condições para avançar.

## 5. Quando retornar ao Léo

O Mestre deve interromper e retornar ao Léo somente quando:

- surgir decisão fora do escopo;
- existir bloqueio que apenas Léo possa resolver;
- houver risco crítico ou mudança irreversível não autorizada;
- houver divergência sem regra de desempate;
- o ciclo estiver concluído e exigir aceite final;
- Léo tiver exigido gate específico.

## 6. Cabeçalho e passagem de bastão

O padrão de `MCF-DEC-005` permanece obrigatório:

- cabeçalho no início para orientar a leitura;
- trabalho visível no corpo;
- passagem de bastão no final.

Quando a continuidade for automática, o cabeçalho deve indicar `Decisão necessária: nenhuma` e o bastão deve apontar diretamente ao próximo agente.

## 7. Não conformidade

É não conformidade:

- pedir confirmação para etapa já autorizada;
- interromper apenas para anunciar que outro agente será acionado;
- ocultar o trabalho para evitar interrupções;
- avançar além do escopo aprovado;
- retornar ao Léo sem uma decisão, bloqueio ou conclusão concreta.

## 8. Estado normativo

```text
CONTINUIDADE_AUTOMATICA_APOS_APROVACAO=OBRIGATORIA
TRANSPARENCIA_SEM_INTERRUPCAO=OBRIGATORIA
CONFIRMACAO_REDUNDANTE=PROIBIDA
NOVO_GATE_HUMANO=SOMENTE_QUANDO_NECESSARIO
CABEÇALHO_E_BASTAO=OBRIGATORIOS
MERGE_PR_15=NAO_AUTORIZADO
```

Esta decisão não autoriza merge na `main`.
