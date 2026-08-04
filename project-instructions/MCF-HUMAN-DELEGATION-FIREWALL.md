# MCF — Human Delegation Firewall (HDF)

```yaml
document: MCF_HUMAN_DELEGATION_FIREWALL
version: 1.0.0
status: ACTIVE
authority_human: Leandro
authority_operational: Leo
coordinator: Mestre
mode_default: TEAM_FIRST
human_as_operator_default: PROHIBITED
```

## 1. Objetivo

Impedir que Leandro seja transformado em operador técnico rotineiro do MCF. A equipe deve executar o trabalho com agentes e ferramentas reais. A participação humana é exceção formal, limitada e auditável.

## 2. Regra principal

```text
EQUIPE TENTA EXECUTAR
→ EQUIPE REGISTRA EVIDÊNCIA
→ EQUIPE TESTA FALLBACK
→ LÉO AVALIA O GATE
→ SOMENTE ENTÃO UMA AÇÃO HUMANA PODE SER PEDIDA
```

É proibido usar Leandro como:

- agente executor;
- operador padrão de terminal;
- operador padrão de banco;
- copiador de valores não sensíveis;
- testador manual quando um workflow pode testar;
- intermediário entre ferramentas conectadas;
- substituto de conector, script ou automação que ainda não foi tentada.

## 3. Gatilhos humanos permitidos

Somente estes gatilhos permitem intervenção:

```yaml
allowed_triggers:
  - SECRET_ENTRY
  - PERSONAL_AUTHENTICATION
  - BILLING_OR_CONTRACT
  - IRREVERSIBLE_EXTERNAL_ACTION
  - PUBLIC_RELEASE
  - LEGAL_OBLIGATION
  - MATERIAL_STRATEGIC_DECISION
  - EXPLICIT_HUMAN_REQUEST
```

A indisponibilidade de uma ferramenta, sozinha, não basta. A equipe deve provar que não existe alternativa executável segura.

## 4. Contrato obrigatório de intervenção

Todo pedido a Leandro deve incluir:

```yaml
human_intervention_request:
  mode: TEAM_FIRST
  trigger:
  team_execution_attempted: true
  attempted_actions: []
  evidence: []
  tool_limitation:
  fallback_exhausted: true
  leo_approved: true
  action_count: 1
  action:
  direct_link:
  navigation_path:
  risk:
  expected_result:
```

Sem todos os campos aplicáveis, o pedido é inválido.

## 5. Uma ação por intervenção

A equipe deve reduzir a participação humana a uma única ação inevitável. Depois da ação, a execução volta imediatamente para a equipe.

Incorreto:

```text
Abra o painel, copie a URL, altere duas variáveis, execute o deploy,
abra o GitHub, atualize o secret e rode o workflow.
```

Correto:

```text
A equipe executou tudo que as ferramentas permitem.
A única ação restante é confirmar a autenticação pessoal neste link.
Depois disso, a equipe retoma automaticamente.
```

## 6. Obrigação de automação alternativa

Antes de escalar, o Mestre deve verificar:

1. conector nativo;
2. ferramenta alternativa aprovada;
3. workflow GitHub Actions;
4. script ou operação interna segura;
5. endpoint administrativo existente;
6. fallback documental ou patch aplicável.

A ausência de um botão no conector não autoriza transferir toda a tarefa ao humano.

## 7. Gate de Léo

Léo só pode aprovar a intervenção quando confirmar:

```yaml
reserved_trigger: true
team_attempt_evidenced: true
fallback_exhausted: true
single_human_action: true
risk_explained: true
direct_path_provided: true
return_to_team_defined: true
```

## 8. Responsabilidades

### Mestre

- aplicar TEAM_FIRST;
- impedir delegação precoce;
- manter a ação humana mínima;
- retomar a missão após a intervenção.

### Gabriel/Rafael e demais executores

- tentar execução real;
- criar automação quando proporcional;
- registrar logs, IDs, commits e falhas.

### Renato

- verificar se a intervenção é realmente inevitável;
- testar o fallback proposto.

### Augusto

- medir quantidade de ações transferidas ao humano;
- emitir alerta quando `human_action_count > 1`.

### Emily

- classificar delegação indevida como falha de governança;
- verificar o contrato HDF no fechamento.

### Léo

- aprovar ou rejeitar a exceção;
- nunca usar aprovação genérica para uma sequência de tarefas.

## 9. Métricas

```yaml
human_operator_actions_per_mission:
  target: 0
  maximum_without_reserved_trigger: 0
  maximum_per_approved_intervention: 1

team_execution_attempt_before_human:
  target: 100_percent

human_request_with_evidence:
  target: 100_percent
```

## 10. Falhas críticas

- usar `agentId: Leandro`;
- pedir terminal ou banco sem testar automação;
- esconder que a ferramenta não foi realmente acionada;
- solicitar várias ações sob um único gate;
- pedir segredo no chat;
- transferir risco técnico à autoridade humana sem explicação;
- não retomar a missão depois da ação humana.

## 11. Recuperação quando o HDF for violado

```text
CAPTURAR A DELEGAÇÃO INDEVIDA
→ PARAR NOVAS AÇÕES HUMANAS
→ CLASSIFICAR O IMPACTO
→ REVERTER EFEITOS INDEVIDOS
→ DEVOLVER A TAREFA À EQUIPE
→ CRIAR AUTOMAÇÃO OU FALLBACK
→ REGISTRAR O INCIDENTE
→ VALIDAR
→ RETOMAR O OBJETIVO
```

## 12. Estado de encerramento

Uma missão não pode ser marcada como `ENTREGUE` quando existir uma ação técnica que a equipe ainda consegue executar. Ação humana pendente só é aceita em `AGUARDANDO_DEPENDENCIA_EXTERNA` com contrato HDF completo.
