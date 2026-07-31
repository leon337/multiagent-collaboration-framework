# MCF-DEC-001 — Arquitetura de Loop Orientado a Objetivos e Equipe Ampliada

**Data:** 31 de julho de 2026  
**Autoridade da decisão:** Léo  
**Repositório:** `leon337/multiagent-collaboration-framework`  
**Estado:** Aprovado para redação e formalização metodológica  

## 1. Contexto

A equipe avaliou a necessidade de ampliar o framework de colaboração entre agentes e de adotar uma arquitetura de funcionamento em loop orientado a objetivos.

A decisão responde a duas necessidades:

1. incluir novas especialidades na equipe;
2. substituir a simples passagem fixa de bastão por um fluxo controlado por objetivo, competência, estado, evidência, auditoria e condição de parada.

Esta decisão registra a aprovação conceitual. Ela não autoriza implementação de software nem publicação automática de uma nova metodologia sem o ciclo de redação, revisão, auditoria e aprovação final.

## 2. Decisão aprovada

Fica aprovada a direção conceitual composta por:

- papéis especializados;
- roteamento dinâmico por competência;
- contrato formal de objetivo;
- decomposição em tarefas;
- memória operacional compartilhada;
- máquina de estados;
- registro obrigatório de entregas e evidências;
- auditoria independente;
- decisão humana nos gates críticos;
- limites contra repetição e loop infinito;
- seleção apenas dos agentes necessários para cada tarefa.

Fluxo conceitual:

```text
Objetivo formal
→ decomposição em tarefas
→ seleção dinâmica por competência
→ execução especializada
→ registro de entrega e evidência
→ auditoria independente
→ decisão controlada
→ novo ciclo, correção, bloqueio ou encerramento
```

## 3. Equipe ampliada aprovada conceitualmente

### 3.1 Governança

- **Léo** — autoridade final de decisão.
- **Mestre** — orquestração do processo, controle do loop, transições de estado e encaminhamento entre agentes.

### 3.2 Produto e inovação

- **Leonardo** — planejamento, produto, decomposição de objetivos e requisitos.
- **Carlos** — geração de insights, oportunidades, hipóteses e riscos futuros.

Regra: insights de Carlos não alteram automaticamente o escopo nem se tornam requisitos sem avaliação e aprovação.

### 3.3 Design e experiência

- **Evelyn** — gerente de Design e Experiência.
- **Laura** — UX Designer.
- **Isabela** — UI Designer.
- **Especialista em Acessibilidade** — nome ainda pendente.

Evelyn coordena a área, distribui o trabalho, consolida as entregas e preserva divergências relevantes.

### 3.4 Arquitetura e engenharia

- **Sofia** — arquitetura de software.
- **Especialista em Banco de Dados** — nome ainda pendente.
- **Gabriel** — implementação, versionamento e publicação.

A especialista ou o especialista de banco de dados participa quando o objetivo envolver persistência, histórico, usuários, autenticação, auditoria, métricas, arquivos, sincronização ou relatórios.

### 3.5 Controle e documentação

- **Carmem** — redação e documentação técnica.
- **Emily** — auditoria independente.

Emily não pode ser substituída pelo consenso dos demais agentes e deve separar fato comprovado, proposta, decisão aprovada, artefato produzido e publicação concluída.

## 4. Roteamento dinâmico por competência

Nem todos os agentes devem participar de toda missão.

O Mestre deve selecionar os agentes com base nas competências exigidas pela tarefa.

Exemplos:

```text
Mudança visual
→ Evelyn, Laura, Isabela e Acessibilidade

Persistência de informações
→ Sofia e Especialista em Banco de Dados

Nova funcionalidade
→ Leonardo, Carlos, Sofia e especialistas necessários

Publicação
→ Gabriel, somente após aprovação final
```

Regra central:

> Um agente não trabalha apenas porque chegou a sua vez. Ele trabalha porque existe uma ação necessária, compatível com sua função e vinculada a um objetivo mensurável.

## 5. Contrato de objetivo

Toda missão deve começar com um contrato contendo, no mínimo:

```yaml
objetivo_id: identificador_unico
titulo: objetivo_claro
resultado_esperado: artefato_ou_estado_verificavel
escopo: itens_incluidos
fora_do_escopo: itens_excluidos
criterios_de_aceitacao:
  - criterio_verificavel
condicao_de_parada:
  - condicao_objetiva
```

Objetivos genéricos, como “melhorar o projeto”, não são suficientes sem resultado verificável.

## 6. Estado operacional compartilhado

Cada loop deve registrar:

```yaml
estado: em_execucao
ciclo_atual: 1
responsavel_atual: agente
tarefas_concluidas: []
tarefas_pendentes: []
bloqueios: []
decisoes_aprovadas: []
evidencias: []
```

A memória da conversa não substitui a fonte oficial de verdade.

## 7. Máquina de estados

Estados conceituais aprovados:

```text
CRIADO
→ PLANEJANDO
→ PRONTO_PARA_EXECUCAO
→ EM_EXECUCAO
→ EM_REVISAO
  ├─ CORRECAO
  ├─ AGUARDANDO_DECISAO
  ├─ BLOQUEADO
  └─ APROVADO
       ↓
    CONCLUIDO
```

Estados adicionais permitidos:

- cancelado;
- interrompido;
- aguardando autorização;
- falha recuperável;
- falha definitiva.

## 8. Decisões possíveis ao final de um ciclo

Ao final de cada ciclo, o motor de decisão deve escolher uma destas saídas:

- **CONTINUAR** — houve progresso, mas o objetivo ainda não foi atendido;
- **CORRIGIR** — a entrega está incompleta ou incorreta;
- **BLOQUEAR** — falta autorização, informação ou decisão humana;
- **CONCLUIR** — os critérios foram atendidos e auditados.

## 9. Evidências e auditoria

Toda conclusão deve possuir evidência verificável.

Exemplos:

- arquivo;
- commit;
- pull request;
- resultado de teste;
- relatório;
- captura;
- log;
- decisão registrada;
- link para artefato.

Sem evidência, o estado não pode avançar para concluído.

## 10. Prevenção de loop infinito

A implementação futura deve adotar limites configuráveis, incluindo:

```yaml
max_ciclos: 10
max_tentativas_por_tarefa: 3
max_repeticoes_da_mesma_saida: 2
exigir_evidencia: true
exigir_progresso_mensuravel: true
permitir_execucao_paralela: false
escalar_bloqueio_para_leo: true
```

Os valores acima são parâmetros iniciais propostos e ainda podem ser refinados antes da implementação.

O loop deve parar quando:

- não houver progresso mensurável;
- a mesma falha se repetir além do limite;
- faltar autorização;
- existir conflito não resolvido;
- os critérios de aceitação forem atendidos;
- Léo interromper ou cancelar a missão.

## 11. Arquitetura de dados conceitual

Entidades previstas:

- Objetivo;
- Ciclo;
- Tarefa;
- Agente;
- Competência;
- Execução;
- Entrega;
- Evidência;
- Decisão;
- Bloqueio;
- Insight;
- Artefato;
- Evento de auditoria.

Estratégia recomendada:

- **MVP:** GitHub e arquivos estruturados;
- **automação futura:** PostgreSQL ou Supabase para estado operacional, mantendo o GitHub para código, documentos e evidências versionadas.

## 12. Subfluxo de Design e Experiência

```text
Evelyn recebe a missão
→ Laura analisa UX
→ Isabela define UI
→ Acessibilidade revisa barreiras
→ Evelyn consolida
→ Sofia valida impactos arquiteturais
→ Gabriel avalia implementação
```

Problemas graves de acessibilidade podem bloquear a aprovação quando impedirem leitura, navegação, identificação de estado, decisão ou acesso às evidências.

## 13. Autorizações desta decisão

```yaml
registro_operacional: autorizado
redacao_tecnica: autorizada
revisao_pelos_novos_agentes: autorizada
implementacao_de_software: nao_autorizada
alteracao_de_codigo: nao_autorizada
publicacao_automatica: nao_autorizada
```

## 14. Pendências

- definir o nome da especialista ou do especialista em acessibilidade;
- definir o nome da especialista ou do especialista em banco de dados;
- formalizar a matriz de competências;
- definir a fronteira entre Mestre e Leonardo;
- definir a fronteira entre Sofia e o especialista de banco de dados;
- definir o protocolo de divergência entre especialistas;
- definir regras de custo e consumo de tokens;
- definir recuperação após interrupção;
- redigir o documento metodológico completo;
- revisar e auditar o documento;
- obter aprovação final do Léo;
- versionar a metodologia consolidada.

## 15. Próximo fluxo autorizado

```text
Carmem — redação técnica
→ Leonardo — revisão de produto e requisitos
→ Carlos — revisão de insights e lacunas
→ Evelyn — coordenação da revisão de design
  ├─ Laura — UX
  ├─ Isabela — UI
  └─ Acessibilidade
→ Sofia — arquitetura
→ Especialista em Banco de Dados — dados
→ Gabriel — viabilidade técnica
→ Emily — auditoria independente
→ Léo — aprovação final
→ Gabriel — versionamento e publicação
```

A seleção dinâmica continua válida: agentes sem competência necessária para uma tarefa específica podem não ser acionados.

## 16. Registro de aprovação

Léo declarou concordância com a direção conceitual apresentada.

Esta aprovação:

- reconhece a equipe ampliada;
- reconhece a arquitetura de loop orientado a objetivos;
- autoriza a redação e formalização;
- não autoriza implementação nem publicação automática.
