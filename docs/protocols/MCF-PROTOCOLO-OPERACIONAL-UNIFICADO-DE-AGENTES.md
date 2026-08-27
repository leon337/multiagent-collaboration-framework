# Protocolo Operacional Unificado de Agentes — MCF

**Versão:** 1.1  
**Origens:** MCF-DEC-050 e MCF-DEC-051  
**Aplicação:** todas as missões do Multiagent Collaboration Framework

## 1. Finalidade

Estabelecer um método único para seleção, execução, exposição cronológica do trabalho, passagem de bastão, recuperação de falhas, documentação por fase, decisão operacional e encerramento de missões.

Nenhum agente pode substituir este protocolo por método próprio sem decisão formal do MCF.

## 2. Autoridades

```yaml
autoridade_humana_final: Leandro
autoridade_operacional_delegada: Leo
coordenador_do_fluxo: Mestre
auditoria_independente: Emily
```

Léo decide gates internos dentro do escopo aprovado. Leandro somente é acionado nos gatilhos reservados das decisões vigentes.

## 3. Contrato obrigatório da missão e da fase

```yaml
mission_contract:
  mission_id:
  parent_mission_id: null
  phase_id:
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
  phase_artifact_directory:
```

Sem objetivo e critérios de aceite, o Mestre pode executar apenas descoberta e definição do contrato.

## 4. Seleção dos agentes

O Mestre deve:

1. identificar competências necessárias;
2. selecionar somente agentes com entrega real;
3. justificar cada seleção;
4. registrar não selecionados quando Leandro solicitar composição completa;
5. impedir participação decorativa;
6. incluir agentes de controle conforme os gatilhos vigentes;
7. definir a ordem inicial de atuação, sem impedir retornos e correções necessários.

## 5. ESEV — Execução Sequencial Exposta e Verificável

A execução deve ser apresentada na ordem em que ocorre. Não é suficiente relatar no final que cada agente trabalhou.

### 5.1 Fluxo visual obrigatório

```text
Mestre abre contrato e fase
→ agente recebe entrada
→ agente executa ação real
→ evidência aparece
→ agente analisa e entrega
→ passagem interna aparece
→ próximo agente continua do checkpoint
→ correções e novos ciclos aparecem
→ validação
→ auditoria
→ decisão de Léo
→ fechamento do Mestre com documentos da fase
```

### 5.2 Formato no ponto da atuação

```text
## [Nome] — [atividade atual]

Entrada recebida:
[estado, objetivo, artefatos e decisões recebidos]

Ação executada:
[consulta, alteração, teste, pesquisa, ferramenta ou decisão real]

Evidência observada:
[arquivo, commit, PR, teste, log, status, saída ou ausência confirmada]

Resultado e análise:
[efeito da evidência sobre o objetivo]

Decisão e entrega:
[resultado ou artefato produzido]

Passagem interna: [Agente atual] → [Próximo agente]
[checkpoint, próxima ação e critério de conclusão]
```

O título deve nomear a atividade atual, como `Renato — falha de CI capturada`, e não apenas a função genérica.

### 5.3 Evidência de ferramenta

Quando houver uso real de ferramenta, registrar no ponto da execução:

- ação solicitada;
- recurso consultado ou alterado;
- resultado retornado;
- identificador verificável disponível;
- efeito confirmado;
- falha e recuperação, quando ocorrerem.

Quando nenhuma ferramenta tiver sido usada, é proibido simular uma atividade instrumental.

### 5.4 Formato retrospectivo insuficiente

O padrão abaixo não comprova execução e não pode ser o formato principal:

```text
Mestre: coordenou.
Sofia: revisou.
Carmem: documentou.
Gabriel: publicou.
```

Uma síntese assim pode existir somente depois da execução sequencial completa, como índice opcional.

## 6. Passagem de bastão intercalada

```yaml
handoff:
  handoff_id:
  mission_id:
  parent_mission_id: null
  phase_id:
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
- a passagem aparece antes do bloco do próximo agente;
- passagem interna não encerra a resposta;
- o próximo agente continua do checkpoint, sem reiniciar;
- toda submisão retorna à missão-pai.

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

```text
CONTRATAR
→ RECUPERAR CONTEXTO
→ EXECUTAR
→ VERIFICAR
→ MEDIR PROGRESSO
→ CORRIGIR OU AVANÇAR
→ REPETIR
```

O loop continua automaticamente enquanto existir ação segura e autorizada. Cada falha, recuperação e nova validação deve aparecer no ponto cronológico correto.

## 8. Resposta única cronológica

O Mestre apresenta na mesma resposta:

1. cabeçalho e contrato;
2. seleção e justificativas;
3. contribuições na ordem real;
4. passagens internas intercaladas;
5. ciclos de correção;
6. geração dos documentos da fase;
7. validações e smoke;
8. observabilidade;
9. avaliação e governança quando aplicáveis;
10. auditoria quando aplicável;
11. decisão de Léo;
12. fechamento do Mestre e transferência do checkpoint.

Resposta única não significa condensar tudo numa lista retrospectiva.

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
    - entradas
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

Transparência exige exposição do trabalho verificável, não de raciocínio privado.

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

Cada etapa relevante da recuperação deve aparecer na sequência da resposta.

## 11. PRF — Pacote de Rastreabilidade da Fase

Toda fase Classe B ou C deve gerar:

```text
artifacts/phases/PHASE-XX-SLUG/
├── PHASE-XX-PLAN.md
├── PHASE-XX-REPORT.md
├── PHASE-XX-VALIDATION.txt
├── PHASE-XX-VALIDATION-FULL.txt
├── PHASE-XX-SMOKE.txt
├── PHASE-XX-CHECKPOINT.yaml
├── PHASE-XX-DECISIONS.md
├── PHASE-XX-ARTIFACT-MANIFEST.sha256
└── README.md
```

Itens não aplicáveis devem registrar `NAO_APLICAVEL` com justificativa.

### Conteúdo mínimo

- **PLAN:** objetivo, escopo, aceite, riscos, agentes, fluxo, autorizações e validação;
- **REPORT:** execução, mudanças, decisões, desvios, falhas, recuperações e estado;
- **VALIDATION:** resumo dos testes e resultados;
- **VALIDATION-FULL:** evidência expandida ou referência segura;
- **SMOKE:** teste mínimo ponta a ponta ou justificativa;
- **CHECKPOINT:** estado transferível para retomada e fase seguinte;
- **DECISIONS:** decisões cronológicas dos agentes, Emily, Léo e Leandro quando aplicável;
- **MANIFEST:** checksums dos artefatos;
- **README:** índice, ordem de leitura, instruções e resultado.

Documentos de domínio são acrescentados quando aplicáveis, como arquitetura, ameaça, privacidade, banco, API, acessibilidade, deploy, rollback, incidente, avaliação e `mission-trace`.

## 12. Fluxo obrigatório da fase

```text
INICIAR
→ PLANEJAR
→ APROVAR O PLANO INTERNAMENTE
→ EXECUTAR
→ DOCUMENTAR
→ VALIDAR
→ AUDITAR
→ DECIDIR O GATE
→ FECHAR A FASE
→ TRANSFERIR CHECKPOINT
```

A fase não recebe `ENTREGUE` sem PRF ou justificativa formal de não aplicabilidade.

## 13. Agentes de controle e documentação

### Augusto

Obrigatório em Classes B e C para `MISSION-TRACE`, passagens, falhas, recuperação, eficiência do loop e detecção de síntese retrospectiva indevida.

### Beatriz

Obrigatória quando houver comportamento de agentes, prompts, modelos, memória de IA, roteamento, automação decisória ou critérios de qualidade.

### Miriam

Obrigatória em retomadas, múltiplas fontes, histórico institucional, conflito de decisões, RAG, memória ou mudança de fonte de verdade. Valida a capacidade de retomada do checkpoint.

### Júlia

Obrigatória em Classe C e em autonomia, identidade, reputação, dados pessoais, moderação, publicação, responsabilidade e políticas de IA.

### Carmem

Coordena a consistência documental do PRF, sem inventar evidência técnica.

### Renato e especialistas de validação

Produzem evidências de teste, validação e smoke aplicáveis.

### Gabriel

Relaciona os documentos da fase a branch, commit, PR, release ou publicação autorizada.

## 14. Gate de Léo

```yaml
leo_gate:
  inputs:
    - execucao_sequencial
    - entregas
    - evidencias
    - phase_traceability_pack
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

Léo não aprova fase B ou C cuja síntese retrospectiva substitua a execução ou cujo PRF esteja ausente sem justificativa.

## 15. Escalonamento para Leandro

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

## 16. Encerramento

```yaml
mission_closeout:
  mission_id:
  phase_id:
  final_state:
  objective_met: true_or_false
  acceptance_results: []
  artifacts: []
  phase_traceability_pack: []
  evidence: []
  unresolved_findings: []
  blockers: []
  leo_decision:
  human_action_required: true_or_false
  next_action: nenhuma_or_action
  checkpoint_recipient:
```

`final_state: ENTREGUE` exige objetivo atendido, ausência de ação pendente no ciclo e rastreabilidade da fase disponível.

## 17. Extensão candidata — sucessão cross-chat com GUI/window control

Quando uma missão de sucessão cross-chat incluir copresença visual em GUI autorizada, aplicar adicionalmente a extensão:

`docs/protocols/MCF-PROTOCOLO-SUCESSAO-CROSS-CHAT-E-CONTROLE-DE-JANELAS.md`

Na branch candidata, essa extensão formaliza critérios testáveis para identidade distinta de sessão e superfície, preservação da superfície predecessora até equivalência + handoff, fechamento do predecessor como ação separada, verdade sobre o mecanismo de input, monitor-aware placement e regressão de copresença.

A referência nesta branch não autoriza `main`, merge, tag, release ou número de versão. O status oficial depende dos gates posteriores de qualificação, auditoria e autoridade humana.
