# Protocolo Operacional Unificado de Agentes — MCF

**Versão:** 1.0  
**Origem:** MCF-DEC-050  
**Aplicação:** todas as missões do Multiagent Collaboration Framework

## 1. Finalidade

Estabelecer um método único para seleção, execução, exposição do trabalho, passagem de bastão, recuperação de falhas, decisão operacional e encerramento de missões.

Nenhum agente pode substituir este protocolo por um método próprio sem decisão formal de alteração do MCF.

## 2. Autoridades

```yaml
autoridade_humana_final: Leandro
autoridade_operacional_delegada: Leo
coordenador_do_fluxo: Mestre
auditoria_independente: Emily
```

Léo decide gates internos dentro do escopo aprovado. Leandro somente é acionado nos gatilhos reservados da MCF-DEC-017 e da MCF-DEC-050.

## 3. Contrato obrigatório da missão

```yaml
mission_contract:
  mission_id:
  parent_mission_id: null
  title:
  objective:
  expected_outcome:
  scope: []
  out_of_scope: []
  inputs: []
  source_of_truth: []
  assumptions: []
  acceptance_criteria: []
  authorizations: []
  prohibitions: []
  risk_class: A_B_C
  current_state: PLANEJADO
  cycle: 1
  selected_agents: []
  decision_authority: Leo
  human_escalation_triggers: []
```

Sem objetivo e critérios de aceite, o Mestre pode executar apenas descoberta e definição do contrato.

## 4. Seleção dos agentes

O Mestre deve:

1. identificar competências necessárias;
2. selecionar somente agentes com entrega real;
3. justificar cada seleção;
4. registrar não selecionados quando Leandro solicitar a composição completa;
5. impedir participação decorativa;
6. incluir os agentes de controle conforme os gatilhos da MCF-DEC-050.

## 5. Formato visível de cada agente

```text
## [Nome] — [Função oficial]

Entrada recebida:
[objetivo, artefato e estado recebidos]

Consulta ou ação executada:
[ação real, ferramenta, documento ou teste]

Evidência:
[referência verificável ou declaração de ausência]

Achados:
[resultados observados]

Análise:
[critérios aplicados e relação com o objetivo]

Decisão ou recomendação:
[resultado objetivo]

Entrega:
[artefato, decisão, teste, mapa ou parecer]

Passagem de bastão:
[bloco handoff obrigatório]
```

É proibido afirmar apenas que o agente “analisou internamente”.

## 6. Passagem de bastão

```yaml
handoff:
  handoff_id:
  mission_id:
  parent_mission_id: null
  cycle:
  from:
  to:
  objective_state:
  delivered: []
  evidence: []
  decisions: []
  open_findings: []
  blockers: []
  next_action:
  acceptance_for_next_action:
  return_to:
  continue_in_same_response: true
```

### Validações

- `from` e `to` devem ser diferentes;
- `to` deve ser agente real ou Léo;
- estado não pode ser destinatário;
- `next_action` deve começar com verbo;
- `return_to` é obrigatório em submisões;
- passagem interna não encerra a resposta;
- o próximo agente continua do checkpoint, sem reiniciar.

## 7. Loop orientado a objetivo

```yaml
objective_loop:
  cycle:
  hypothesis_or_task:
  action:
  evidence:
  result:
  progress_against_acceptance:
  remaining_gaps:
  next_decision:
```

Ciclo:

```text
CONTRATAR
→ RECUPERAR CONTEXTO
→ EXECUTAR
→ VERIFICAR
→ MEDIR PROGRESSO
→ CORRIGIR OU AVANÇAR
→ REPETIR
```

O loop continua automaticamente enquanto existir ação segura e autorizada.

## 8. Resposta única

O Mestre apresenta na mesma resposta:

1. cabeçalho e contrato;
2. seleção e justificativas;
3. contribuições dos agentes na ordem real;
4. passagens internas;
5. ciclos de correção necessários;
6. artefatos e evidências;
7. observabilidade;
8. avaliação;
9. governança;
10. auditoria, quando aplicável;
11. decisão de Léo;
12. estado final do Mestre.

A resposta somente pode terminar em:

- `ENTREGUE`;
- `AGUARDANDO_DEPENDENCIA_EXTERNA`;
- `BLOQUEADO_POR_RISCO`;
- `CANCELADO_PELA_AUTORIDADE`.

## 9. Trabalho silencioso

```yaml
silent_work:
  permitted: false
  protected_items:
    - raciocinio_privado
    - segredos
    - credenciais
    - dados_sensiveis_desnecessarios
  visible_items_required:
    - acoes
    - consultas
    - evidencias
    - criterios
    - achados
    - decisoes
    - entregas
    - falhas
    - recuperacoes
    - passagens
```

Transparência não exige exposição de raciocínio privado. Exige exposição do trabalho verificável.

## 10. Recuperação de falhas

Aplicar o CAF:

```text
CAPTURAR
→ CLASSIFICAR
→ VERIFICAR EFEITO
→ ESCOLHER RECUPERAÇÃO
→ EXECUTAR
→ VALIDAR
→ RETORNAR AO FLUXO ORIGINAL
```

Tentativas máximas:

- mesma ação e mesmos parâmetros: nenhuma repetição;
- após correção objetiva: uma repetição;
- fallback seguro: uma tentativa;
- depois: dependência externa ou bloqueio real.

## 11. Agentes de controle

### Augusto

Obrigatório em Classes B e C para `MISSION-TRACE`, passagens, falhas, recuperação e eficiência do loop.

### Beatriz

Obrigatória quando houver comportamento de agentes, prompts, modelos, memória de IA, roteamento, automação decisória ou critérios de qualidade.

### Miriam

Obrigatória em retomadas, múltiplas fontes, histórico institucional, conflito de decisões, RAG, memória ou mudança de fonte de verdade.

### Júlia

Obrigatória em Classe C e em autonomia, identidade, reputação, dados pessoais, moderação, publicação, responsabilidade e políticas de IA.

## 12. Gate de Léo

```yaml
leo_gate:
  inputs:
    - entregas
    - evidencias
    - avaliacao
    - governanca
    - auditoria
  decisions:
    - APROVAR
    - APROVAR_COM_RESSALVAS
    - RETORNAR_PARA_CORRECAO
    - AMPLIAR_EQUIPE
    - REDUZIR_EQUIPE
    - BLOQUEAR
    - ESCALAR_PARA_LEANDRO
  required_output:
    decision:
    justification:
    next_state:
    next_action:
    responsible:
```

Léo não pode aprovar ação fora da delegação humana existente.

## 13. Escalonamento para Leandro

Escalar somente quando houver:

- mudança material de finalidade, objetivo ou público;
- custo financeiro novo ou relevante;
- obrigação jurídica ou exposição pública relevante;
- credencial pessoal ou dado sensível excepcional;
- ação externa irreversível de alto impacto;
- lançamento público não coberto por autorização contínua;
- conflito estratégico;
- cancelamento;
- solicitação explícita de Leandro.

## 14. Encerramento

```yaml
mission_closeout:
  mission_id:
  final_state:
  objective_met: true_or_false
  acceptance_results: []
  artifacts: []
  evidence: []
  unresolved_findings: []
  blockers: []
  leo_decision:
  human_action_required: true_or_false
  next_action: nenhuma_or_action
```

`final_state: ENTREGUE` exige `objective_met: true` e ausência de ação pendente no ciclo atual.
