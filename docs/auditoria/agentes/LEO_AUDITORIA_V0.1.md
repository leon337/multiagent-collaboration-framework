# Auditoria e assimilação do papel de Léo — versão 0.1

**Classificação:** artefato de auditoria operacional  
**Papel simulado:** Léo — Orquestrador  
**Issue mestre:** #2  
**Subtarefa:** #3  
**Linear principal:** LEA-274  
**Loop Linear ativo:** LEA-275  
**Pull request:** #1  
**Branch:** `foundation/framework-v1`  
**Status do parecer:** `APTO_COM_RESSALVAS`

## 1. Finalidade

Este artefato registra a revisão feita sob o papel de Léo sobre as regras de orquestração já existentes na fundação da versão 0.1. Seu objetivo é demonstrar assimilação do conteúdo, identificar lacunas operacionais e estabelecer como Léo deve coordenar objetivos, estados, agentes e evidências sem ultrapassar sua autoridade.

Este documento não declara a metodologia completa. Ele audita somente o conteúdo atualmente versionado e separa regras existentes de interpretações provisórias.

## 2. Documentos e registros auditados

### GitHub

- `docs/governanca/CONSTITUICAO_DO_FRAMEWORK.md`;
- `docs/governanca/PLANO_DE_FUNDACAO_V1.md`;
- `docs/auditoria/RELATORIO_DE_AUDITORIA_INICIAL.md`;
- issue mestre #2 — Auditoria da versão 0.1;
- issue #3 — Auditoria e assimilação do papel de Léo;
- PR draft #1 — fundação do framework multiagente v1.0.

### Linear

- LEA-274 — objetivo de fundação do framework;
- LEA-275 — auditoria inicial e congelamento das regras de fundação;
- bloqueio registrado em LEA-274 referente ao limite de novas issues do workspace.

## 3. Síntese do modelo de orquestração absorvido

Léo não coordena apenas uma sequência de pessoas ou mensagens. Seu objeto de controle é o estado verificável do objetivo.

Para cada trabalho, Léo deve manter explícitos:

1. objetivo ativo;
2. estado atual;
3. próximo estado permitido;
4. responsável operacional;
5. artefato esperado;
6. evidência necessária;
7. bloqueios e dependências;
8. autoridade que pode aprovar a transição;
9. destino do bastão após a entrega.

A declaração verbal de conclusão não é suficiente. A transição somente ocorre quando existe artefato localizável, versionado e vinculado ao objetivo.

Leandro permanece como autoridade humana final. Léo possui autoridade operacional limitada pelas regras constitucionais, pelas decisões registradas e pelos contratos dos agentes.

## 4. Estados reconhecidos

A Constituição registra os seguintes estados:

- `BACKLOG`;
- `READY`;
- `IN_PROGRESS`;
- `IN_REVIEW`;
- `REMEDIATION`;
- `BLOCKED`;
- `PASS_RELEASED_FOR_WORK`;
- `CANCELED`;
- `SUPERSEDED`.

Expressões como `QUASE_PRONTO` e `PRATICAMENTE_FEITO` não representam estados válidos.

### 4.1 Interpretação operacional provisória

A documentação ainda não contém uma matriz normativa completa de transições. Até que `FLUXO_OPERACIONAL.md` e `LOOP_ORIENTADO_A_OBJETIVO.md` sejam publicados, Léo deve usar a seguinte interpretação conservadora:

| Estado de origem | Próximo estado admissível | Condição mínima |
|---|---|---|
| `BACKLOG` | `READY` | objetivo, escopo, responsável e critérios de aceite definidos |
| `READY` | `IN_PROGRESS` | dependências resolvidas e capacidade disponível |
| `IN_PROGRESS` | `IN_REVIEW` | artefato versionado e evidências vinculadas |
| `IN_PROGRESS` | `BLOCKED` | impedimento identificado com condição de desbloqueio |
| `IN_REVIEW` | `REMEDIATION` | revisão encontra não conformidade corrigível |
| `IN_REVIEW` | `PASS_RELEASED_FOR_WORK` | critérios, evidências, revisão e aprovação satisfeitos |
| `REMEDIATION` | `IN_REVIEW` | correção versionada e reteste solicitado |
| qualquer estado não terminal | `CANCELED` | cancelamento autorizado e justificado |
| qualquer estado não terminal | `SUPERSEDED` | objetivo substituto identificado e vinculado |
| `BLOCKED` | estado anterior ou `READY` | causa removida e reconciliação registrada |

Esta tabela é uma **HIPÓTESE OPERACIONAL EM VALIDAÇÃO**, não uma regra normativa definitiva.

## 5. Regra de WIP absorvida

O plano de fundação determina que apenas um loop estrutural permaneça ativo por vez. Consultas sem alteração de artefatos podem ocorrer em paralelo.

Aplicação por Léo:

- WIP estrutural da fundação: `1`;
- nenhum loop posterior deve iniciar produção normativa antes da condição de saída do loop atual;
- auditorias especializadas podem ocorrer como atividades vinculadas ao mesmo loop ativo;
- uma nova frente que altere artefatos deve ser classificada como parte do loop atual ou aguardar.

A auditoria por agentes pertence ao loop 0.1 porque valida a Constituição, o plano e a linha de base antes do avanço para arquitetura documental.

## 6. Protocolo de passagem de bastão por evidência

Toda transferência deve registrar:

- objetivo;
- issue de origem;
- agente emissor;
- estado de origem;
- artefato entregue;
- commit ou versão;
- evidência de verificação;
- achados e ressalvas;
- estado solicitado;
- agente receptor;
- motivo da transferência.

### 6.1 Modelo mínimo

```text
OBJETIVO: LEA-274
ORIGEM: issue #3
EMISSOR: Léo
ESTADO DE ORIGEM: IN_PROGRESS
ARTEFATO: docs/auditoria/agentes/LEO_AUDITORIA_V0.1.md
COMMIT: <SHA>
PARECER: APTO_COM_RESSALVAS
PR: #1
PRÓXIMO ESTADO SOLICITADO: IN_REVIEW
RECEPTOR: Emily, na etapa de suficiência das evidências
RESSALVAS: ausência de matriz normativa completa de transições
```

Sem esse registro, o bastão não deve ser considerado transferido.

## 7. Cenário de orquestração analisado

### Cenário: agente entrega um documento normativo

**Situação:** Carmem recebe a tarefa de redigir `CONTRATO_DE_COMUNICACAO.md`.

1. Léo confirma que a tarefa pertence ao objetivo ativo e que não viola o WIP.
2. O trabalho entra em `READY` somente após possuir escopo, critérios e dependências.
3. Carmem inicia o trabalho e o estado passa para `IN_PROGRESS`.
4. Carmem cria o documento na branch de fundação e registra o commit.
5. Léo verifica apenas a existência e a rastreabilidade da entrega; não substitui a revisão editorial ou arquitetural.
6. O estado passa para `IN_REVIEW`, com Sofia e Emily como revisores conforme seus papéis.
7. Se houver inconsistência, o estado passa para `REMEDIATION`, com achados explícitos.
8. Após correção, o artefato retorna a `IN_REVIEW`.
9. A entrega somente alcança o estado final quando os critérios forem atendidos, as evidências estiverem vinculadas e a autoridade competente aprovar.

### Resultado da análise

O modelo funciona para impedir conclusão por declaração verbal. Entretanto, a documentação atual ainda não define formalmente:

- quem pode promover cada transição;
- quais revisões são obrigatórias por tipo de artefato;
- como representar estados quando o Linear não aceita novas issues;
- como tratar aprovação com ressalvas sem criar um estado informal.

## 8. Riscos de coordenação identificados

| ID | Gravidade | Risco | Consequência | Recomendação |
|---|---|---|---|---|
| LEO-R01 | Alta | Estados listados sem matriz normativa de transições | agentes podem mover trabalho de forma inconsistente | publicar matriz de transições em `FLUXO_OPERACIONAL.md` |
| LEO-R02 | Alta | Limite do Linear impede criar subtarefas | divergência entre fonte oficial de estado e execução real | formalizar modo híbrido em `GOVERNANCA_GITHUB_LINEAR.md` |
| LEO-R03 | Alta | Autor e revisor são simulados temporariamente pelo Mestre | independência limitada | registrar conflito e exigir revalidação futura pelos agentes permanentes |
| LEO-R04 | Média | Ausência de contrato completo do Léo | decisões podem depender de interpretação informal | criar `docs/agentes/LEO.md` com autoridade e limites explícitos |
| LEO-R05 | Média | `APTO_COM_RESSALVAS` não está mapeado para estado operacional | parecer pode ser confundido com liberação | manter parecer separado do estado e exigir remediação ou aceitação formal |
| LEO-R06 | Média | Critério de revisão varia conforme o artefato | risco de revisão insuficiente | criar matriz artefato × revisor × aprovador |

## 9. Reconciliação GitHub ↔ Linear

Enquanto o Linear estiver limitado:

- LEA-274 permanece como objetivo estratégico;
- LEA-275 permanece como loop estrutural ativo;
- issues do GitHub controlam as subtarefas operacionais;
- commits e artefatos ficam no PR #1;
- checkpoints consolidados devem ser registrados como comentários em LEA-274 ou LEA-275;
- nenhuma issue GitHub pode declarar um estado estratégico incompatível com o Linear;
- divergências devem ser registradas como bloqueio ou reconciliação pendente.

Esse procedimento é uma solução transitória. Ele precisa ser formalizado antes da liberação da versão estável.

## 10. Checklist operacional assimilado por Léo

Antes de iniciar trabalho:

- [ ] O objetivo está identificado?
- [ ] O estado atual está registrado?
- [ ] Os critérios de aceite são verificáveis?
- [ ] O responsável e os limites de autoridade estão definidos?
- [ ] O artefato esperado possui caminho ou formato?
- [ ] As dependências estão resolvidas?
- [ ] A atividade respeita o WIP?

Antes de transferir o bastão:

- [ ] O artefato existe?
- [ ] O commit ou versão está registrado?
- [ ] As evidências correspondem ao critério de aceite?
- [ ] Os achados e ressalvas estão explícitos?
- [ ] O agente receptor está identificado?
- [ ] O estado solicitado é admissível?
- [ ] GitHub e Linear estão reconciliados?

Antes de declarar conclusão:

- [ ] Todos os critérios foram verificados?
- [ ] Não há bloqueios críticos abertos?
- [ ] A revisão obrigatória foi concluída?
- [ ] A autoridade competente aprovou?
- [ ] O estado final é formal e permitido?

## 11. Conteúdo absorvido e responsabilidades reconhecidas

Léo reconhece que deve:

- controlar objetivos e estados, não apenas turnos de agentes;
- impedir avanço sem evidência;
- proteger o WIP;
- registrar bloqueios e condições de desbloqueio;
- encaminhar artefatos aos revisores corretos;
- reconciliar Linear e GitHub;
- impedir estados vagos;
- respeitar a autoridade de Leandro;
- não substituir os especialistas;
- manter a trilha de decisão legível para agentes futuros.

Léo não pode:

- aprovar sozinho artefatos fora de sua competência;
- inventar evidências ou contexto ausente;
- mover trabalho para estado final por conveniência;
- ocultar divergências entre ferramentas;
- ampliar sua autoridade por interpretação informal.

## 12. Parecer final

**Parecer:** `APTO_COM_RESSALVAS`

### Justificativa

O modelo constitucional fornece base suficiente para Léo compreender sua função central: orquestrar objetivos, estados, evidências e transferências. A estrutura atual já impede conclusão apenas verbal e preserva a autoridade humana final.

As ressalvas são relevantes e impedem considerar o sistema operacionalmente completo:

1. a matriz normativa de transições ainda não existe;
2. o contrato detalhado do Léo ainda não foi publicado;
3. a governança do modo híbrido GitHub–Linear ainda é transitória;
4. a independência das revisões é limitada durante a simulação dos papéis pelo Mestre.

### Condição para `APTO`

O parecer poderá evoluir para `APTO` quando forem versionados e auditados:

- `docs/governanca/FLUXO_OPERACIONAL.md`;
- `docs/governanca/LOOP_ORIENTADO_A_OBJETIVO.md`;
- `docs/governanca/GOVERNANCA_GITHUB_LINEAR.md`;
- `docs/agentes/LEO.md`;
- matriz de autoridade e de revisões obrigatórias.

## 13. Transferência solicitada

Após o registro do commit deste artefato, a issue #3 poderá ser encaminhada para verificação de suficiência por Emily dentro da auditoria mestre #2. O loop 0.1 permanece ativo e não está liberado para conclusão geral.