# MCF-DEC-051 — Execução Sequencial Visível e Rastreabilidade por Fase

**Data:** 4 de agosto de 2026  
**Autoridade humana:** Leandro  
**Autoridade operacional delegada:** Léo  
**Coordenação:** Mestre  
**Estado:** aprovado por instrução direta para implantação  
**Relacionadas:** MCF-DEC-002, MCF-DEC-015, MCF-DEC-016, MCF-DEC-017 e MCF-DEC-050

## 1. Problema corrigido

A MCF-DEC-050 tornou obrigatório o trabalho visível, mas permitiu uma interpretação insuficiente: ao final da missão, apresentar uma lista retrospectiva como “Mestre fez...”, “Carmem fez...”, “Sofia fez...”.

Esse formato informa participação, porém não permite acompanhar a execução real, a ordem das decisões, as evidências consultadas, as correções, os ciclos nem as passagens de bastão.

Leandro determinou que o padrão correto é o utilizado na construção do Screen Assistant:

- cada agente aparece quando sua atuação ocorre;
- a ação real e a evidência são exibidas no ponto da execução;
- a passagem interna aparece imediatamente depois da entrega;
- o próximo agente continua a partir do estado recebido;
- falhas, recuperações e novos ciclos permanecem visíveis;
- a resposta única preserva a ordem cronológica do fluxo;
- cada fase termina com documentos e evidências próprios para rastreabilidade.

## 2. Decisão

Ficam obrigatórios dois mecanismos:

1. **ESEV — Execução Sequencial Exposta e Verificável**;
2. **PRF — Pacote de Rastreabilidade da Fase**.

A ESEV substitui qualquer apresentação retrospectiva como formato principal da execução.

O PRF deve ser produzido em toda fase operacional ou técnica antes de sua aprovação e encerramento.

## 3. ESEV — Execução Sequencial Exposta e Verificável

### 3.1 Ordem de apresentação

A resposta deve refletir a ordem real de trabalho:

```text
Mestre abre a fase
→ Agente A recebe o estado e executa
→ evidência da ação aparece
→ Agente A decide e passa o bastão
→ Agente B recebe o checkpoint e executa
→ evidência da ação aparece
→ correção ou próximo agente
→ validação
→ auditoria
→ decisão de Léo
→ fechamento da fase pelo Mestre
```

É proibido ocultar toda a execução e apresentar apenas uma síntese final por agente.

### 3.2 Bloco obrigatório no momento da atuação

Cada participação deve aparecer no ponto cronológico correto:

```text
## [Agente] — [atividade atual]

Entrada recebida:
[estado, artefatos, decisão e objetivo recebidos]

Ação executada:
[consulta, alteração, teste, pesquisa, ferramenta ou decisão realmente executada]

Evidência observada:
[resultado verificável, arquivo, commit, PR, teste, log, status, saída ou ausência confirmada]

Resultado e análise:
[o que a evidência demonstra e como afeta o objetivo]

Decisão e entrega:
[artefato ou resultado produzido]

Passagem interna: [Agente atual] → [Próximo agente]
[checkpoint e próxima ação]
```

O título deve descrever a atuação corrente, por exemplo:

- `Rafael — revisão do cliente`;
- `Sofia — causa técnica confirmada`;
- `Renato — falha de CI capturada`;
- `Renato — suite corrigida`;
- `Gabriel — registro auditável no PR`.

Não usar apenas títulos genéricos como “Rafael — Engenharia” quando existir atividade concreta.

### 3.3 Evidência de ferramenta

Quando uma ferramenta, integração ou teste for realmente usado, a execução deve registrar no ponto correto:

- ação solicitada;
- recurso consultado ou alterado;
- resultado retornado;
- identificação verificável disponível;
- efeito confirmado;
- falha e recuperação, quando ocorrerem.

A interface pode mostrar a atividade da ferramenta em componente próprio. Quando isso não estiver disponível, o texto deve registrar a mesma informação sem fingir que uma ferramenta foi usada.

### 3.4 Passagem interna intercalada

A passagem não fica concentrada no final da resposta. Ela aparece entre as atuações:

```text
Passagem interna: Sofia → Rafael para revisar os módulos atuais antes do hotfix.
```

O próximo bloco deve pertencer ao destinatário real ou ao agente substituto escolhido pelo Mestre.

### 3.5 Correção em loop

Quando surgir uma falha:

```text
Agente detecta falha
→ registra evidência
→ classifica pelo CAF
→ executa recuperação
→ valida novo estado
→ retoma o fluxo original
```

Cada tentativa relevante deve aparecer como novo bloco cronológico. Não resumir todo o ciclo posteriormente como se tivesse ocorrido sem interrupções.

### 3.6 Fechamento visível

Depois da última validação, a resposta deve mostrar separadamente:

1. auditoria, quando aplicável;
2. decisão de Léo;
3. apresentação final do Mestre a Leandro;
4. lista de documentos, evidências e artefatos da fase;
5. passagem para a fase seguinte ou estado final.

## 4. Formato retrospectivo proibido como execução principal

O seguinte padrão não comprova execução:

```text
Mestre: coordenou a missão.
Carmem: criou os documentos.
Sofia: revisou a arquitetura.
Gabriel: criou o PR.
```

Ele pode existir apenas como índice curto depois da execução sequencial completa. Nunca pode substituir a ESEV.

Também é proibido:

- declarar “execução visível por papel” sem mostrar as etapas cronológicas;
- atribuir ação real a um agente sem evidência correspondente;
- concentrar todas as passagens de bastão no encerramento;
- apresentar artefatos somente no fim do projeto quando a fase deveria tê-los produzido;
- usar texto no passado para simular ações que não foram executadas.

## 5. PRF — Pacote de Rastreabilidade da Fase

### 5.1 Obrigatoriedade

Toda fase Classe B ou C deve gerar um pacote próprio antes do gate de Léo.

Fase Classe A gera registro mínimo proporcional quando houver decisão, alteração de artefato ou continuidade para outra fase.

### 5.2 Estrutura mínima obrigatória

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

Arquivos sem conteúdo aplicável devem registrar `NAO_APLICAVEL` com justificativa; não devem ser omitidos silenciosamente.

### 5.3 Conteúdo dos documentos

#### `PHASE-XX-PLAN.md`

- objetivo da fase;
- escopo e fora do escopo;
- critérios de aceite;
- riscos;
- agentes selecionados;
- ordem inicial do fluxo;
- autorizações e proibições;
- estratégia de validação.

#### `PHASE-XX-REPORT.md`

- execução efetivamente realizada;
- mudanças produzidas;
- decisões técnicas e de produto;
- desvios do plano;
- falhas e recuperações;
- estado final da fase.

#### `PHASE-XX-VALIDATION.txt`

Resumo objetivo dos comandos, testes e resultados essenciais.

#### `PHASE-XX-VALIDATION-FULL.txt`

Evidência bruta ou expandida das validações, preservando dados sensíveis fora do repositório.

#### `PHASE-XX-SMOKE.txt`

Teste mínimo ponta a ponta ou declaração justificada de não aplicabilidade.

#### `PHASE-XX-CHECKPOINT.yaml`

Estado transferível para retomada, próximo chat ou fase seguinte:

```yaml
phase_id:
mission_id:
parent_mission_id:
base_commit:
head_commit:
objective_state:
completed_acceptance_criteria: []
remaining_gaps: []
artifacts: []
decisions: []
open_findings: []
next_phase:
next_action:
recipient:
```

#### `PHASE-XX-DECISIONS.md`

Registro cronológico das decisões de agentes, auditoria, Léo e Leandro quando acionado.

#### `PHASE-XX-ARTIFACT-MANIFEST.sha256`

Checksums dos documentos e entregas que permitam verificação de integridade.

#### `README.md`

Índice legível do pacote, instruções de uso, ordem de leitura e resultado final.

### 5.4 Artefatos condicionais

A fase deve acrescentar documentos específicos do domínio quando aplicáveis, por exemplo:

- `threat-model.md`;
- `privacy-model.md`;
- `architecture.md`;
- `database.md`;
- `api-contract.md`;
- `accessibility-report.md`;
- `deployment.md`;
- `rollback.md`;
- `incident-report.md`;
- `evaluation-scorecard.md`;
- `mission-trace.md`.

### 5.5 Projeto completo da fase

Quando a interface permitir entregar arquivos, o fechamento deve apresentar:

- pacote ou projeto completo da fase;
- documentos individuais relevantes;
- manifesto de integridade;
- instruções de validação;
- commit, branch, PR ou release associados.

Nenhum link, arquivo, commit ou teste pode ser inventado.

## 6. Fluxo padrão de uma fase

Adota-se a sequência:

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

Dentro da resposta, esse fluxo aparece por meio dos blocos cronológicos dos agentes.

## 7. Responsabilidades

### Mestre

- abre a fase e o contrato;
- mantém a ordem cronológica;
- impede saltos e sínteses substitutivas;
- confirma que o PRF existe antes do gate;
- apresenta o fechamento a Leandro.

### Carmem

- coordena a documentação do PRF;
- assegura consistência entre plano, relatório, decisões e checkpoint;
- não inventa evidência técnica.

### Augusto

- produz ou valida `mission-trace.md`;
- confirma que todas as passagens ocorreram e retornaram ao fluxo;
- detecta blocos retrospectivos usados indevidamente como execução.

### Miriam

- registra fontes e precedência;
- garante que o checkpoint e os documentos permitam retomada sem reconstrução inventada.

### Renato e especialistas de validação

- produzem as evidências de teste, validação e smoke aplicáveis.

### Gabriel

- relaciona o PRF a branch, commit, PR, release ou publicação autorizada.

### Emily

- audita se a execução foi realmente mostrada e se o pacote da fase suporta as conclusões.

### Léo

- não aprova fase Classe B ou C sem ESEV suficiente e PRF completo ou justificativa explícita de não aplicabilidade;
- decide correção, aprovação, continuidade ou bloqueio.

## 8. Resposta única

A exigência de resposta única permanece, mas passa a significar:

- uma resposta cronológica e contínua;
- vários blocos de atuação real;
- passagens intercaladas;
- ciclos de correção mostrados;
- documentos gerados durante a fase;
- gate e fechamento no final.

Não significa condensar todo o trabalho em uma lista curta ao final.

A resposta pode terminar em `AGUARDANDO_DEPENDENCIA_EXTERNA` quando uma execução futura depende objetivamente de CI, processamento externo, credencial, propagação ou ação humana inevitável. Nesse caso, o checkpoint, as evidências e o destinatário permanecem explícitos, sem solicitar intervenção rotineira de Leandro.

## 9. Critérios de conformidade

Uma fase está conforme somente quando:

- a ordem apresentada corresponde à ordem real das ações;
- cada agente selecionado possui ação e evidência no ponto de atuação;
- cada passagem aparece antes do próximo agente;
- falhas e recuperações estão visíveis;
- a síntese final não substitui a execução;
- o PRF foi criado e referenciado;
- as validações sustentam o estado declarado;
- o checkpoint permite continuidade;
- Léo emitiu decisão baseada nas evidências;
- o Mestre apresentou os documentos da fase.

## 10. Efeito imediato

```yaml
execucao_retrospectiva_como_formato_principal: PROIBIDA
execucao_sequencial_exposta_e_verificavel: OBRIGATORIA
passagens_intercaladas: OBRIGATORIAS
pacote_de_rastreabilidade_por_fase: OBRIGATORIO
checkpoint_por_fase: OBRIGATORIO
documentos_apenas_no_fim_do_projeto: INSUFICIENTE
resposta_unica_cronologica: OBRIGATORIA_QUANDO_TECNICAMENTE_POSSIVEL
autoridade_de_gate: Leo
intervencao_rotineira_de_Leandro: PROIBIDA
```