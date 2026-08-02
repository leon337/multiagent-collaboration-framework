# MCF-DEC-004 — Bastão de Continuidade Obrigatório

**Data:** 2 de agosto de 2026  
**Autoridade:** Léo  
**Estado:** aprovado para versionamento e revisão crítica  
**Relacionadas:** `MCF-DEC-001`, `MCF-DEC-002`, `MCF-DEC-003`

## 1. Contexto

Foi identificado em execução real que uma mensagem do Mestre terminou com estado final e artefato, mas sem indicar explicitamente quem deveria receber o trabalho, qual ação viria em seguida e quais condições permitiriam a continuidade do fluxo.

A passagem de bastão já era exigida de cada agente, porém não estava formalizada como bloco terminal obrigatório da mensagem consolidada do Mestre.

## 2. Decisão

Toda mensagem operacional das Classes B e C deve terminar com um bloco denominado `BASTÃO DE CONTINUIDADE`.

A mensagem não pode ser classificada como concluída, aguardando decisão ou bloqueada sem informar de forma explícita o responsável atual, o próximo responsável, o material entregue e a ação seguinte.

Mensagens Classe A podem usar uma versão mínima do bastão quando houver continuidade pendente. Quando não houver continuidade, devem declarar `proximo_responsavel: nenhum` e `estado: concluido`.

## 3. Estrutura obrigatória

```yaml
bastao_de_continuidade:
  responsavel_atual: agente_que_encerra_a_mensagem
  proximo_responsavel: agente_ou_leo_ou_nenhum
  material_entregue:
    - artefato_ou_decisao
  acao_seguinte: tarefa_objetiva
  pendencias:
    - item_pendente_ou_nenhum
  bloqueios:
    - bloqueio_ou_nenhum
  condicao_de_retomada: evento_ou_decisao_necessaria
  estado: CONTINUAR_CORRIGIR_BLOQUEAR_AGUARDAR_CONCLUIR
```

## 4. Obrigações do Mestre

O Mestre deve:

- receber o bastão do último agente participante;
- verificar se a entrega e as evidências estão completas;
- traduzir o próximo passo para Léo;
- apontar claramente quando a próxima ação depende de decisão do Léo;
- impedir mensagens com final aberto ou continuidade implícita;
- declarar `proximo_responsavel: nenhum` apenas quando o objetivo estiver realmente concluído;
- preservar o bastão no artefato ou log da mensagem.

## 5. Passagem entre agentes

Cada agente participante continua apresentando sua passagem individual.

A passagem individual deve conter:

- próximo agente;
- material entregue;
- tarefa esperada;
- pendências;
- bloqueios.

O bastão final do Mestre não substitui as passagens individuais. Ele consolida o ponto exato onde a missão ficou após todas as contribuições.

## 6. Estados e próximo responsável

### CONTINUAR

Deve existir próximo agente e ação executável.

### CORRIGIR

Deve indicar o responsável pela correção, a não conformidade e o critério de aceite.

### BLOQUEAR

Deve indicar o bloqueio, quem pode removê-lo e a condição de retomada.

### AGUARDAR

Deve indicar de quem se aguarda decisão, resposta, autorização ou evento.

### CONCLUIR

Deve indicar `proximo_responsavel: nenhum`, listar a entrega final e declarar que não existem pendências ou bloqueios.

## 7. Não conformidade

É não conformidade:

- terminar mensagem operacional sem bastão;
- usar expressão vaga como “aguardando próximos passos” sem responsável;
- omitir o material entregue;
- indicar próximo agente sem tarefa objetiva;
- declarar conclusão com pendência aberta;
- atribuir bastão a agente que não possui competência para a ação.

Quando ocorrer:

1. Mestre reconhece a falha;
2. estado muda para `CORRIGIR`;
3. Carmem corrige o artefato ou log;
4. Mestre publica o bastão ausente;
5. Emily revisa quando a falha afetar missão crítica.

## 8. Critérios de conformidade

Uma mensagem operacional está conforme somente quando:

- todas as contribuições selecionadas foram apresentadas;
- o estado final foi declarado;
- o artefato foi identificado;
- o bastão de continuidade está presente;
- o próximo responsável é inequívoco;
- a ação seguinte é objetiva;
- pendências e bloqueios foram registrados;
- a condição de retomada foi informada.

## 9. Estado normativo

```text
BASTAO_DE_CONTINUIDADE=OBRIGATORIO
BASTAO_FINAL_DO_MESTRE=OBRIGATORIO
PASSAGEM_INDIVIDUAL_POR_AGENTE=OBRIGATORIA
CONTINUIDADE_IMPLICITA=PROIBIDA
FINAL_ABERTO_SEM_RESPONSAVEL=PROIBIDO
```

## 10. Autorizações

```yaml
registro_metodologico: autorizado
versionamento_em_branch: autorizado
revisao_critica: autorizada
merge_na_main: nao_autorizado
implementacao_de_software: nao_autorizada
```
