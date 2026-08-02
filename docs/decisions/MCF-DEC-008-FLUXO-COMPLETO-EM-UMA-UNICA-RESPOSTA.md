# MCF-DEC-008 — Fluxo Completo em uma Única Resposta

**Data:** 2 de agosto de 2026  
**Autoridade:** Léo  
**Estado:** aprovado para uso operacional e revisão  

## 1. Problema

A passagem de bastão vinha sendo usada como encerramento da resposta do Mestre, embora o próximo agente ainda devesse trabalhar dentro do mesmo ciclo. Isso obrigava Léo a enviar mensagens de continuidade e fragmentava um fluxo já autorizado.

## 2. Decisão

Toda missão operacional deve ser apresentada pelo Mestre em uma única resposta contínua, desde a abertura até um dos estados de parada válidos.

Fluxo obrigatório:

```text
Mestre abre o cabeçalho e o contrato
→ apresenta o primeiro agente
→ registra a passagem de bastão
→ continua imediatamente com o próximo agente na mesma resposta
→ repete até o último agente necessário
→ apresenta artefatos e evidências
→ apresenta RC quando aplicável
→ encerra somente em conclusão, bloqueio real ou novo gate humano
```

## 3. Regra da passagem de bastão

A passagem de bastão entre agentes é uma transição interna da mesma resposta. Ela não encerra a mensagem e não exige nova manifestação de Léo.

```yaml
passagem_interna:
  de: agente_atual
  para: proximo_agente_real
  entrega: artefato_ou_resultado
  proxima_acao: acao_concreta
  continuar_na_mesma_resposta: true
```

## 4. Encerramento permitido

O Mestre só pode finalizar a resposta quando ocorrer uma destas condições:

- objetivo ou etapa concluída;
- bloqueio real que impeça qualquer avanço;
- nova decisão humana indispensável;
- limite de autorização alcançado.

## 5. Proibições

É proibido:

- terminar a resposta no meio de uma sequência de agentes;
- pedir “continue” para executar trabalho já autorizado;
- usar passagem de bastão como promessa de trabalho futuro;
- passar o bastão para o próprio agente;
- declarar continuidade automática sem mostrar a continuidade na mesma resposta.

## 6. Visibilidade

Todos os agentes selecionados continuam apresentando entrada, consulta, achados, análise, decisão, entrega, evidência e passagem. A visibilidade deve ocorrer sem fragmentar o ciclo em múltiplas mensagens.

## 7. Estado normativo

```text
FLUXO_COMPLETO_EM_UMA_UNICA_RESPOSTA=OBRIGATORIO
PASSAGEM_DE_BASTAO_INTERNA=OBRIGATORIA
INTERRUPCAO_ENTRE_AGENTES=PROIBIDA
PEDIDO_DE_CONTINUE_PARA_ESCOPO_JA_AUTORIZADO=PROIBIDO
RETORNO_AO_LEO=SOMENTE_CONCLUSAO_BLOQUEIO_OU_GATE
```

## 8. Autorizações

Esta decisão autoriza registro e versionamento na branch do PR Draft #15. Não autoriza merge na `main`, implementação de software, deploy ou publicação automática.
