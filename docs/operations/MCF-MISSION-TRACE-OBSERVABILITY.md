# MCF Mission Trace — protocolo de execução visível

**Estado:** proposta versionada em branch para revisão  
**Responsável pela coordenação:** Mestre  
**Referências normativas:** MCF-DEC-050, MCF-DEC-052, contrato do Mestre, matriz consolidada de competências e contrato de skill aplicável.

## 1. Objetivo

Dar a Leandro visibilidade verificável do fluxo operacional de uma missão: agentes efetivamente envolvidos, identificação e etiquetas oficiais, instruções normativas aplicáveis, trabalho executado, evidências e passagens de bastão até sua aceitação.

Este protocolo não cria novas competências, não altera a autoridade dos agentes e não substitui gates existentes.

## 2. Princípios obrigatórios

1. **Sem trabalho silencioso:** cada etapa relevante produz uma atualização visível e, quando houver infraestrutura persistente autorizada, um registro canônico.
2. **Sem participação fictícia:** só registrar um agente como executor se ele tiver sido realmente acionado e houver evidência da sua contribuição. Trabalho feito diretamente pelo Mestre deve ser rotulado como tal.
3. **Sem etiquetas inventadas:** nomes, função, competência e fronteiras vêm da matriz e dos contratos oficiais.
4. **Obediência rastreável:** registrar as instruções aplicáveis por referência — contrato, decisão, skill, perfil de permissão e gate — e descrever como foram cumpridas.
5. **Fato separado de hipótese:** marcar cada evento como confirmado, inferido, planejado, tentado, falho ou bloqueado.
6. **Handoff não é aceite:** encaminhar uma entrega não significa que o destinatário a aceitou.
7. **Fluxo contínuo:** mostrar a sequência completa em uma resposta sempre que tecnicamente possível, sem checkpoints humanos rotineiros; escalar apenas gates, conflitos de autoridade, riscos críticos ou dependências reais.
8. **Evidência proporcional:** apontar URLs, caminhos, SHAs, IDs de execução, saídas de teste ou trechos de log, conforme disponíveis. Não expor segredos.
9. **Preservação de gates:** observabilidade não autoriza ignorar permissões, auditorias, controles de produção ou aprovações exigidas.

## 3. Campos de cada evento

| Campo | Obrigatório | Conteúdo |
|---|---|---|
| `mission_id` / `event_id` | Sim | Identificadores estáveis da missão e do evento |
| `timestamp` | Quando disponível | Data/hora e fuso; nunca inventar |
| `actor_id` | Sim | Nome oficial do agente ou `Mestre (execução direta)` |
| `official_role` | Sim | Função literal da matriz/contrato |
| `official_tags` | Quando existentes | Etiquetas oficiais, sem criar taxonomia concorrente |
| `assignment` | Sim | Entrega e critério de aceite recebidos |
| `normative_basis` | Sim | Referências ao contrato, decisão, skill, permissão e gates |
| `actions` | Sim | Ações realmente executadas; distinguir intenção e execução |
| `tools` | Quando aplicável | Ferramentas e recursos utilizados |
| `evidence` | Sim | Referência verificável ou declaração explícita de evidência ausente |
| `status` | Sim | Um dos estados canônicos abaixo |
| `handoff` | Quando aplicável | Remetente, destinatário, pacote, aceite e estado |
| `blockers` | Quando aplicável | Dependência, falha, risco e próximo passo |
| `updated_at` | Quando disponível | Última atualização verificável |

### Estados canônicos

- `PLANNED` — planejado, ainda não executado.
- `IN_PROGRESS` — execução iniciada, sem conclusão confirmada.
- `ATTEMPTED` — tentativa feita, resultado não confirmado.
- `COMPLETED` — entrega concluída com evidência suficiente.
- `FAILED` — execução falhou, com evidência do erro.
- `BLOCKED` — não pode prosseguir por gate, permissão ou dependência.
- `HANDED_OFF` — pacote enviado ao destinatário; aceite ainda pendente.
- `ACCEPTED` — destinatário confirmou aceite segundo os critérios.
- `REJECTED` — destinatário rejeitou, registrando motivo e correção esperada.

## 4. Contrato da passagem de bastão

Toda passagem de bastão deve conter:

1. **Remetente e destinatário** com identificadores oficiais.
2. **Objetivo da etapa seguinte** e critério de aceite.
3. **Pacote transferido:** resultados, contexto mínimo necessário, decisões, artefatos, evidências, riscos e pendências.
4. **Base normativa e permissões** relevantes à próxima etapa.
5. **Estado do handoff:** enviado, recebido, aceito, rejeitado ou bloqueado.
6. **Resposta do destinatário:** o que verificou e a evidência do aceite/rejeição.
7. **Retorno ao Mestre:** quando concluído, rejeitado, bloqueado ou quando a skill/contrato assim exigir.

Se o destinatário não puder ser acionado por uma ferramenta disponível, registrar `BLOCKED` ou `HANDED_OFF` apenas quando o encaminhamento tiver realmente ocorrido. Não simular uma resposta do agente.

## 5. Formato de apresentação ao usuário

Para cada agente:

- **Identificação:** nome, função e etiquetas oficiais.
- **Obediência:** contratos, decisões, skill, perfil de permissão e gates.
- **Missão recebida:** resultado esperado e critério de aceite.
- **Trabalho realizado:** ações confirmadas, ferramentas e resultado.
- **Evidências:** artefatos e identificadores verificáveis.
- **Estado:** valor canônico e bloqueios.

Para cada bastão:

- **De → Para**
- **Pacote entregue**
- **Critério de aceite**
- **Estado da recepção**
- **Evidência e pendências**

No resumo final, incluir missão, estado do objetivo, agentes envolvidos, handoffs, evidências, falhas/recuperações, riscos, limitações e próximo passo.

## 6. Papel de Augusto

A MCF-DEC-050 atribui a Augusto, Engenheiro de Observabilidade Multiagente, a linha do tempo lógica, os ciclos, os estados, os handoffs, falhas de roteamento e relatório de observabilidade. Essa função deve ser utilizada dentro de suas fronteiras e com revisão independente quando aplicável.

A documentação ou o Mestre não devem alegar que Augusto produziu um relatório, foi acionado ou aceitou um handoff sem evidência real de execução. Se a plataforma não oferecer invocação direta de agentes, declarar essa limitação e registrar quem efetivamente executou a atividade.

## 7. Exemplo ilustrativo — não representa execução real

```yaml
mission_id: MCF-EXAMPLE-001
event_id: EVT-002
actor_id: "Mestre"
official_role: "Ponte oficial e orquestração"
official_tags:
  source: "Contrato do Mestre e matriz consolidada"
assignment: "Coordenar a revisão de um artefato e transferir o pacote ao revisor"
normative_basis:
  - "docs/agentes/MESTRE.md"
  - "MCF-DEC-052"
actions:
  - "Recuperou as fontes oficiais"
  - "Definiu o pacote de revisão"
tools:
  - "GitHub connector"
evidence:
  - "URLs dos documentos consultados"
status: "COMPLETED"
handoff:
  from: "Mestre"
  to: "Agente revisor (deve ser substituído pelo nome oficial antes de uso)"
  package:
    - "Artefato revisado"
    - "Critérios de aceite"
    - "Evidências"
  status: "PLANNED"
  acceptance: "Pendente; exemplo ilustrativo"
```

O exemplo acima é apenas um modelo de preenchimento; não declara que ocorreu uma execução nem que um agente recebeu o pacote.

## 8. Integração e persistência

- Manter os registros no local canônico de missão definido pela governança do repositório; não criar um segundo registro concorrente sem decisão.
- Para cada missão relevante, manter um `MISSION-TRACE` com eventos em ordem cronológica e links para artefatos-fonte.
- Atualizar o registro após cada etapa relevante, falha, recuperação e handoff.
- Evitar duplicar logs completos; referenciar evidências primárias e incluir apenas contexto suficiente.
- Respeitar classificação de dados, minimização e proibição de registrar segredos.
- Validar o formato com casos positivos e negativos antes de adotá-lo como norma.

## 9. Critérios de aceite para adoção

- O protocolo é revisado contra a matriz, os contratos e as decisões vigentes.
- Um caso de teste demonstra identificação, base normativa, ações, evidência e handoff com aceite.
- Um caso negativo demonstra que handoff enviado não é marcado como aceito e que agentes não acionados não aparecem como executores.
- Falhas e bloqueios permanecem visíveis e não são convertidos em sucesso.
- Os gates aplicáveis passam antes de integração ou adoção normativa.
