# MCF-DEC-002 — Política de Trabalho Visível por Agente e Artefato por Ciclo

**Data:** 2 de agosto de 2026  
**Autoridade da decisão:** Léo  
**Repositório:** `leon337/multiagent-collaboration-framework`  
**Estado:** aprovado para versionamento e revisão crítica  
**Decisão relacionada:** `MCF-DEC-001 — Arquitetura de Loop Orientado a Objetivos e Equipe Ampliada`

## 1. Contexto

Durante a execução operacional do framework, foi identificado que parte do trabalho dos agentes estava sendo consolidada de forma excessiva pelo Mestre. Em algumas respostas, os agentes eram citados apenas por uma linha resumida, sem exposição do que receberam, pesquisaram, encontraram, decidiram, entregaram ou encaminharam.

Essa prática reduz a rastreabilidade, dificulta a auditoria, oculta divergências e impede distinguir trabalho efetivamente realizado de simples atribuição nominal.

Esta decisão formaliza a política de trabalho visível por agente e de artefato obrigatório por ciclo operacional.

## 2. Decisão aprovada

Fica estabelecido que o trabalho dos agentes não pode ocorrer de forma silenciosa, salvo quando Léo autorizar explicitamente a execução silenciosa.

Sempre que um agente participar de uma missão, sua contribuição deve aparecer de forma identificada e verificável na mensagem operacional entregue ao Léo.

Cada ciclo operacional deve produzir ou atualizar um artefato verificável.

## 3. Relação com a seleção dinâmica por competência

Esta política não obriga todos os agentes a participar de toda missão.

Permanece válida a regra de `MCF-DEC-001`:

> Um agente participa porque existe uma ação necessária, compatível com sua função e vinculada a um objetivo mensurável.

O Mestre deve:

1. selecionar os agentes necessários;
2. justificar a seleção;
3. não incluir agentes apenas para preencher uma sequência;
4. não atribuir pesquisa, análise ou decisão que não tenha ocorrido;
5. expor integralmente o trabalho dos agentes efetivamente selecionados.

## 4. Mensagem casual e mensagem operacional

### 4.1 Mensagem casual

É uma interação sem missão formal, sem análise técnica, sem pesquisa, sem decisão operacional e sem alteração de artefatos.

Exemplos:

- saudação;
- confirmação curta;
- pergunta simples sem execução;
- correção de nome sem impacto metodológico amplo.

Mensagens casuais não exigem ciclo multiagente completo.

### 4.2 Mensagem operacional

É qualquer mensagem que envolva um ou mais dos seguintes itens:

- pesquisa;
- análise de repositório, documento, imagem, issue, PR, commit ou log;
- definição de requisito;
- decisão de produto, arquitetura, design, dados ou segurança;
- implementação;
- teste;
- auditoria;
- publicação;
- criação ou alteração de artefato;
- recomendação que altere o estado de um projeto.

Mensagens operacionais devem seguir integralmente esta política.

## 5. Contrato obrigatório da missão

Toda missão operacional deve começar com contrato contendo, no mínimo:

```yaml
objetivo_id: identificador_unico
titulo: objetivo_claro
resultado_esperado:
  - artefato_ou_estado_verificavel
escopo:
  - itens_incluidos
fora_do_escopo:
  - itens_excluidos
criterios_de_aceitacao:
  - criterio_verificavel
condicao_de_parada:
  - condicao_objetiva
agentes_selecionados:
  - agente: nome
    justificativa: competencia_necessaria
```

## 6. Conteúdo mínimo obrigatório por agente

Cada agente participante deve apresentar:

### 6.1 Entrada recebida

- pedido recebido;
- artefato recebido;
- problema recebido;
- decisão anterior relevante;
- estado do trabalho no momento da passagem.

### 6.2 Pesquisa ou consulta realizada

- arquivos lidos;
- repositórios consultados;
- issues, PRs, commits, logs, testes, imagens ou documentos analisados;
- ferramentas utilizadas;
- limitações de acesso ou lacunas encontradas.

### 6.3 Achados

- fatos encontrados;
- inconsistências;
- riscos;
- lacunas;
- conflitos;
- evidências verificáveis.

### 6.4 Análise

- interpretação dentro da especialidade do agente;
- alternativas consideradas;
- critérios usados;
- impactos;
- limites da conclusão.

### 6.5 Decisão ou recomendação

- posição adotada;
- justificativa;
- efeito esperado;
- dependências;
- necessidade de autorização humana, quando aplicável.

### 6.6 Entrega

- documento;
- código;
- comentário;
- teste;
- relatório;
- decisão;
- commit;
- pull request;
- parecer;
- outra saída verificável.

### 6.7 Evidência

- link;
- arquivo;
- commit;
- PR;
- captura;
- log;
- resultado de teste;
- referência oficial.

### 6.8 Passagem de bastão

- próximo agente;
- material entregue;
- tarefa esperada;
- pendências;
- bloqueios.

## 7. Formato padrão de exposição

```text
NOME DO AGENTE

Entrada recebida:
...

Pesquisa/consulta realizada:
...

Achados:
...

Análise:
...

Decisão:
...

Entrega:
...

Evidência:
...

Passagem para:
...
```

O formato pode ser adaptado ao contexto, desde que todos os campos relevantes permaneçam explícitos.

## 8. Obrigações do Mestre

O Mestre deve:

- abrir o contrato da missão;
- selecionar agentes por competência;
- justificar a seleção;
- controlar o estado do ciclo;
- garantir exposição individual completa;
- impedir atribuições fictícias;
- preservar divergências relevantes;
- impedir consolidação prematura;
- exigir evidência antes de concluir;
- produzir o resumo final somente após as contribuições individuais;
- classificar o ciclo como `CONTINUAR`, `CORRIGIR`, `BLOQUEAR` ou `CONCLUIR`;
- garantir a criação ou atualização do artefato do ciclo.

## 9. Artefato obrigatório por ciclo

Cada ciclo operacional deve produzir um artefato próprio ou atualizar um artefato existente.

Artefatos aceitos incluem:

- arquivo Markdown;
- decisão arquitetural;
- especificação;
- relatório;
- checklist;
- issue;
- comentário em PR;
- commit;
- pull request;
- log;
- resultado de teste;
- captura;
- pacote de evidências.

O artefato deve possuir, quando aplicável:

```yaml
objetivo_id: identificador
ciclo: numero
estado: estado_atual
agentes_participantes: []
entregas: []
evidencias: []
decisoes: []
pendencias: []
bloqueios: []
proximo_passo: descricao
```

Sem artefato ou evidência equivalente, o ciclo não pode ser classificado como concluído.

## 10. Execução silenciosa

A execução silenciosa é proibida por padrão.

Somente Léo pode autorizá-la explicitamente.

Exemplo de autorização válida:

```text
EXECUTAR EM SILÊNCIO
```

A autorização deve valer apenas para a missão ou ciclo em que foi declarada, salvo indicação explícita em contrário.

Mesmo em execução silenciosa:

- ações críticas devem gerar evidência;
- alterações em repositório devem gerar commit ou PR;
- o resultado final deve informar o que foi alterado;
- Emily pode exigir exposição posterior para auditoria.

## 11. Proibições

Não é permitido:

- substituir o trabalho real de um agente por frase genérica;
- afirmar que um agente pesquisou sem evidência da consulta;
- afirmar que um agente implementou sem indicar alteração ou artefato;
- incluir todos os agentes sem necessidade;
- ocultar divergências por meio de consolidação única;
- reescrever silenciosamente a contribuição anterior;
- avançar sem passagem de bastão identificada;
- concluir sem evidência;
- usar a memória da conversa como única fonte oficial de verdade;
- confundir opinião, hipótese, proposta, decisão aprovada e fato comprovado.

## 12. Papel de Carmem

Carmem deve:

- consolidar o artefato do ciclo;
- preservar a contribuição de cada agente;
- registrar decisões aprovadas;
- separar conteúdo original, revisão e correção;
- manter terminologia consistente;
- preparar o material para versionamento quando autorizado.

Carmem não pode apagar divergências relevantes nem transformar proposta em decisão aprovada.

## 13. Papel de Emily

Emily deve auditar:

- agentes realmente selecionados;
- pesquisas realmente realizadas;
- evidências apresentadas;
- aderência ao contrato da missão;
- distinção entre fato, hipótese, proposta e decisão;
- existência do artefato do ciclo;
- integridade da passagem de bastão;
- ausência de trabalho silencioso não autorizado.

Pareceres possíveis:

- `PASS`;
- `PASS_WITH_RESERVATIONS`;
- `REQUEST_CORRECTION`;
- `BLOCKED`;
- `FAIL`.

## 14. Manoel — Especialista em Banco de Dados

Fica formalmente reconhecido:

- **Manoel — Especialista em Banco de Dados**.

Responsabilidades:

- modelagem de dados;
- definição de esquemas;
- persistência;
- integridade e consistência;
- consultas e desempenho;
- migrações;
- autenticação e dados de usuários;
- histórico e auditoria;
- métricas;
- sincronização;
- arquivos e metadados;
- relatórios;
- backup e recuperação.

Fronteira inicial:

- Sofia responde pela arquitetura geral do sistema;
- Manoel responde pela arquitetura de dados e pelo ciclo de vida das informações;
- decisões que afetem simultaneamente arquitetura geral e dados devem ser revisadas pelos dois agentes antes da implementação.

## 15. Estado operacional compartilhado

Cada ciclo deve registrar:

```yaml
estado: em_execucao
ciclo_atual: 1
responsavel_atual: agente
tarefas_concluidas: []
tarefas_pendentes: []
bloqueios: []
decisoes_aprovadas: []
evidencias: []
artefato_atual: caminho_ou_link
```

## 16. Critérios de conformidade

Uma mensagem operacional está conforme quando:

- existe contrato da missão;
- agentes foram selecionados por competência;
- a seleção foi justificada;
- cada agente expôs sua contribuição real;
- pesquisas e ferramentas foram informadas;
- achados e decisões foram separados;
- existe passagem de bastão;
- existe artefato;
- existem evidências;
- Emily auditou quando a missão exigia revisão independente;
- Mestre declarou o estado final.

## 17. Tratamento de não conformidade

Quando a política não for seguida:

1. o Mestre deve reconhecer a falha;
2. o estado deve mudar para `CORRECAO`;
3. as contribuições omitidas devem ser reconstruídas apenas com base em evidências reais;
4. não é permitido inventar trabalho retroativo;
5. Carmem deve corrigir o artefato;
6. Emily deve revisar novamente;
7. o ciclo somente pode ser concluído após correção.

## 18. Decisões ao final do ciclo

- **CONTINUAR** — houve progresso, mas o objetivo ainda não foi atendido;
- **CORRIGIR** — a entrega não está conforme;
- **BLOQUEAR** — falta autorização, informação ou evidência;
- **CONCLUIR** — critérios atendidos, artefato gerado e evidências auditadas.

## 19. Autorizações desta decisão

```yaml
registro_metodologico: autorizado
versionamento_em_branch: autorizado
abertura_de_pr_draft: autorizado
revisao_critica_independente: autorizada
merge_na_main: nao_autorizado
implementacao_de_software: nao_autorizada
publicacao_automatica: nao_autorizada
```

## 20. Estado normativo

```text
TRABALHO_SILENCIOSO=PROIBIDO
EXPOSICAO_POR_AGENTE=OBRIGATORIA_PARA_AGENTES_SELECIONADOS
ARTEFATO_POR_CICLO=OBRIGATORIO
SELECAO_DINAMICA=ATIVA
ATRIBUICAO_FICTICIA=PROIBIDA
EXECUCAO_SILENCIOSA=SOMENTE_COM_AUTORIZACAO_EXPRESSA_DO_LEO
ESPECIALISTA_BANCO_DE_DADOS=MANOEL
```

## 21. Próximo gate

```text
Carmem — redação
→ Sofia — revisão metodológica
→ Manoel — revisão de dados e registros
→ Gabriel — versionamento em branch
→ Emily — RC independente
→ Léo — decisão sobre aprovação e merge
```

Esta decisão não autoriza merge na `main`.