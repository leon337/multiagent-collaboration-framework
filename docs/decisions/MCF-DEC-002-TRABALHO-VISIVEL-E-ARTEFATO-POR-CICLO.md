# MCF-DEC-002 — Política de Trabalho Visível por Agente e Artefato por Mensagem

**Data:** 2 de agosto de 2026  
**Autoridade da decisão:** Léo  
**Repositório:** `leon337/multiagent-collaboration-framework`  
**Estado:** aprovado para versionamento e revisão crítica  
**Decisão relacionada:** `MCF-DEC-001 — Arquitetura de Loop Orientado a Objetivos e Equipe Ampliada`

## 1. Contexto

Durante a execução operacional do framework, parte do trabalho dos agentes foi consolidada de forma excessiva pelo Mestre. Em algumas respostas, agentes foram citados por frases resumidas sem exposição do que receberam, consultaram, encontraram, decidiram, entregaram ou encaminharam.

Também houve ambiguidade sobre a frequência de geração de artefatos. Léo decidiu expressamente pela regra mais rigorosa:

> Toda mensagem deve produzir ou atualizar um artefato, inclusive saudação, confirmação curta e resposta casual.

Esta decisão formaliza o trabalho visível por agente e o artefato obrigatório por mensagem.

## 2. Decisão aprovada

Fica estabelecido que:

1. o trabalho dos agentes não pode ocorrer silenciosamente, salvo autorização expressa de Léo;
2. todo agente efetivamente selecionado deve expor sua contribuição real;
3. toda mensagem deve produzir ou atualizar um artefato verificável;
4. a complexidade do artefato deve ser proporcional ao conteúdo da mensagem;
5. a seleção dinâmica por competência permanece válida;
6. não é permitido incluir agentes apenas para simular um fluxo;
7. nenhuma mensagem pode ser encerrada sem identificar o artefato gerado ou atualizado.

## 3. Relação com MCF-DEC-001

Esta decisão complementa `MCF-DEC-001` e não substitui a seleção dinâmica por competência.

Regra preservada:

> Um agente participa porque existe uma ação necessária, compatível com sua função e vinculada a um objetivo mensurável.

A obrigação de artefato em toda mensagem não significa que todos os agentes devam participar de toda mensagem.

O Mestre deve:

- selecionar somente os agentes necessários;
- justificar a seleção quando houver missão operacional;
- não atribuir pesquisa, análise, implementação ou decisão que não tenha ocorrido;
- expor o trabalho real dos agentes selecionados;
- gerar o artefato adequado ao nível da mensagem.

## 4. Classes de mensagem e artefato

Toda mensagem exige artefato. A classe da mensagem define apenas a profundidade do registro.

### 4.1 Classe A — mensagem simples

Inclui:

- saudação;
- confirmação curta;
- resposta “sim”, “não”, “A” ou equivalente;
- correção nominal simples;
- informação breve sem pesquisa ou decisão ampla.

Artefato mínimo obrigatório:

```yaml
mensagem_id: identificador
classe: A
entrada: resumo_da_mensagem_do_leo
resposta: resumo_da_resposta
agentes_participantes: []
decisao: decisao_registrada_ou_nenhuma
estado: concluido
```

Esse artefato pode ser um registro Markdown curto, atualização de log ou arquivo de ciclo.

### 4.2 Classe B — mensagem operacional

Inclui:

- pesquisa;
- análise de repositório, documento, imagem, issue, PR, commit ou log;
- definição de requisito;
- decisão de produto, arquitetura, design, dados ou segurança;
- planejamento;
- recomendação com impacto no projeto.

Artefato obrigatório:

- contrato da missão;
- agentes selecionados e justificativa;
- trabalho visível por agente;
- achados, decisões, evidências e passagem de bastão;
- estado final do ciclo.

### 4.3 Classe C — execução técnica ou crítica

Inclui:

- implementação;
- alteração de repositório;
- teste;
- auditoria;
- publicação;
- deploy;
- migração;
- autenticação;
- alteração de dados;
- decisão que dependa de gate humano.

Artefato obrigatório:

- todos os itens da Classe B;
- evidência técnica verificável;
- commit, PR, log, teste, relatório, captura ou equivalente;
- RC independente quando aplicável;
- registro de autorizações e proibições;
- condição explícita de parada.

## 5. Contrato da missão

Mensagens das classes B e C devem começar com contrato contendo, no mínimo:

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

Mensagens Classe A não exigem contrato completo, mas continuam exigindo artefato mínimo.

## 6. Conteúdo obrigatório por agente

Cada agente participante de mensagens B ou C deve apresentar:

### 6.1 Entrada recebida

- pedido, artefato, problema ou decisão recebida;
- estado do trabalho no momento da passagem.

### 6.2 Pesquisa ou consulta realizada

- arquivos, repositórios, issues, PRs, commits, logs, testes, imagens ou documentos analisados;
- ferramentas utilizadas;
- limitações e lacunas.

Quando não houver pesquisa, o agente deve declarar expressamente:

```text
Pesquisa/consulta realizada: nenhuma; atuação baseada apenas na entrada recebida.
```

### 6.3 Achados

- fatos;
- inconsistências;
- riscos;
- lacunas;
- conflitos;
- evidências.

### 6.4 Análise

- interpretação dentro da especialidade;
- alternativas consideradas;
- critérios;
- impactos;
- limites.

### 6.5 Decisão ou recomendação

- posição adotada;
- justificativa;
- efeito esperado;
- dependências;
- autorização necessária.

### 6.6 Entrega

- documento;
- código;
- comentário;
- teste;
- relatório;
- decisão;
- commit;
- PR;
- parecer;
- outro resultado verificável.

### 6.7 Evidência

- arquivo;
- link;
- commit;
- PR;
- captura;
- log;
- teste;
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

O formato pode ser reduzido para mensagens Classe A, desde que o artefato mínimo seja produzido.

## 8. Obrigações do Mestre

O Mestre deve:

- classificar a mensagem como A, B ou C;
- garantir artefato em toda mensagem;
- abrir contrato nas classes B e C;
- selecionar agentes por competência;
- justificar a seleção;
- controlar o estado;
- garantir exposição individual completa;
- impedir atribuições fictícias;
- preservar divergências;
- impedir consolidação prematura;
- exigir evidência antes de concluir;
- classificar o ciclo como `CONTINUAR`, `CORRIGIR`, `BLOQUEAR` ou `CONCLUIR`;
- informar onde está o artefato gerado ou atualizado.

## 9. Artefato obrigatório por mensagem

Toda mensagem deve:

- criar um artefato próprio; ou
- atualizar um artefato existente; ou
- registrar uma nova entrada em log versionado ou verificável.

Artefatos aceitos:

- arquivo Markdown;
- log de conversa;
- registro de decisão;
- especificação;
- relatório;
- checklist;
- issue;
- comentário em PR;
- commit;
- pull request;
- resultado de teste;
- captura;
- pacote de evidências.

Estrutura recomendada:

```yaml
mensagem_id: identificador
classe: A_B_ou_C
objetivo_id: identificador_ou_nao_aplicavel
estado: estado_atual
agentes_participantes: []
entregas: []
evidencias: []
decisoes: []
pendencias: []
bloqueios: []
proximo_passo: descricao
```

Sem artefato, a resposta está em não conformidade, mesmo quando o conteúdo for casual ou curto.

## 10. Execução silenciosa

A execução silenciosa é proibida por padrão.

Somente Léo pode autorizá-la explicitamente, por exemplo:

```text
EXECUTAR EM SILÊNCIO
```

A autorização vale apenas para a missão ou ciclo em que foi declarada, salvo indicação expressa em contrário.

Mesmo em execução silenciosa:

- toda mensagem continua exigindo artefato;
- ações críticas devem gerar evidência;
- alterações em repositório devem gerar commit ou PR;
- o resultado final deve informar o que foi alterado;
- Emily pode exigir exposição posterior para auditoria.

## 11. Proibições

Não é permitido:

- responder sem gerar ou atualizar artefato;
- substituir o trabalho real de um agente por frase genérica;
- afirmar pesquisa sem consulta real;
- afirmar implementação sem alteração verificável;
- incluir agentes sem necessidade;
- ocultar divergências;
- reescrever silenciosamente contribuição anterior;
- avançar sem passagem de bastão nas classes B e C;
- concluir sem evidência;
- usar apenas a memória da conversa como fonte oficial;
- confundir hipótese, proposta, decisão e fato.

## 12. Papel de Carmem

Carmem deve:

- consolidar ou atualizar o artefato de cada mensagem;
- preservar contribuições individuais;
- registrar decisões aprovadas;
- separar original, revisão e correção;
- manter terminologia consistente;
- preparar material para versionamento quando autorizado.

Carmem não pode apagar divergências nem transformar proposta em decisão aprovada.

## 13. Papel de Emily

Emily deve auditar, quando aplicável:

- classificação da mensagem;
- existência do artefato;
- agentes realmente selecionados;
- pesquisas realmente realizadas;
- evidências;
- aderência ao contrato;
- distinção entre fato, hipótese, proposta e decisão;
- passagem de bastão;
- ausência de trabalho silencioso não autorizado.

Pareceres:

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
- esquemas;
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

- Sofia responde pela arquitetura geral;
- Manoel responde pela arquitetura de dados e ciclo de vida das informações;
- decisões que afetem arquitetura geral e dados devem ser revisadas por ambos.

## 15. Estado operacional compartilhado

Mensagens B e C devem registrar:

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

Mensagens A usam o registro mínimo definido na seção 4.1.

## 16. Critérios de conformidade

Toda mensagem está conforme quando:

- foi classificada;
- gerou ou atualizou artefato;
- informou o artefato;
- não atribuiu trabalho fictício.

Mensagens B e C exigem adicionalmente:

- contrato da missão;
- agentes selecionados por competência;
- seleção justificada;
- contribuição real exposta;
- pesquisas e ferramentas informadas;
- achados e decisões separados;
- passagem de bastão;
- evidências;
- auditoria quando exigida;
- estado final declarado pelo Mestre.

## 17. Tratamento de não conformidade

Quando a política não for seguida:

1. o Mestre reconhece a falha;
2. o estado muda para `CORRECAO`;
3. contribuições omitidas são reconstruídas apenas com evidências reais;
4. trabalho retroativo não pode ser inventado;
5. Carmem corrige o artefato;
6. Emily revisa novamente quando aplicável;
7. o ciclo só termina após correção.

## 18. Decisões ao final do ciclo

- **CONTINUAR** — houve progresso, mas o objetivo não foi atendido;
- **CORRIGIR** — a entrega não está conforme;
- **BLOQUEAR** — falta autorização, informação ou evidência;
- **CONCLUIR** — critérios atendidos, artefato gerado e evidências auditadas.

## 19. Autorizações

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
ARTEFATO_POR_MENSAGEM=OBRIGATORIO
ARTEFATO_INCLUSIVE_EM_SAUDACAO_E_CONFIRMACAO_CURTA=SIM
SELECAO_DINAMICA=ATIVA
ATRIBUICAO_FICTICIA=PROIBIDA
EXECUCAO_SILENCIOSA=SOMENTE_COM_AUTORIZACAO_EXPRESSA_DO_LEO
ESPECIALISTA_BANCO_DE_DADOS=MANOEL
```

## 21. Próximo gate

```text
Carmem — correção da redação
→ Sofia — revisão metodológica
→ Manoel — revisão de registros
→ Gabriel — versionamento
→ Emily — nova RC independente
→ Léo — decisão sobre merge
```

Esta decisão não autoriza merge na `main`.