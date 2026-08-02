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

O Mestre deve selecionar somente os agentes necessários, justificar a seleção em missões operacionais, impedir atribuições fictícias e garantir o artefato adequado à classe da mensagem.

## 4. Classes de mensagem e artefato

Toda mensagem exige artefato. A classe define apenas a profundidade do registro.

### 4.1 Classe A — mensagem simples

Inclui saudação, confirmação curta, resposta breve, correção nominal simples e informação sem pesquisa ou decisão ampla.

Artefato mínimo:

```yaml
mensagem_id: identificador
classe: A
entrada: resumo_da_mensagem_do_leo
resposta: resumo_da_resposta
agentes_participantes: []
decisao: decisao_registrada_ou_nenhuma
estado: concluido
```

### 4.2 Classe B — mensagem operacional

Inclui pesquisa, análise, requisito, decisão de produto, arquitetura, design, dados, segurança, planejamento ou recomendação com impacto.

Exige contrato, seleção justificada, trabalho visível, achados, decisões, evidências e passagem de bastão.

### 4.3 Classe C — execução técnica ou crítica

Inclui implementação, alteração de repositório, teste, auditoria, publicação, deploy, migração, autenticação, alteração de dados ou gate humano.

Exige todos os itens da Classe B, evidência técnica reforçada, autorizações, condição de parada e RC quando aplicável.

## 5. Contrato da missão

Mensagens B e C devem começar com:

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

Mensagens A não exigem contrato completo, mas continuam exigindo artefato mínimo.

## 6. Conteúdo obrigatório por agente

Cada agente participante de mensagens B ou C deve apresentar:

1. entrada recebida;
2. pesquisa ou consulta realizada;
3. achados;
4. análise;
5. decisão ou recomendação;
6. entrega;
7. evidência;
8. passagem de bastão.

Quando não houver pesquisa, o agente deve declarar:

```text
Pesquisa/consulta realizada: nenhuma; atuação baseada apenas na entrada recebida.
```

## 7. Formato padrão

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

O formato pode ser reduzido na Classe A, desde que o artefato mínimo exista.

## 8. Obrigações do Mestre

O Mestre deve:

- classificar a mensagem como A, B ou C;
- garantir artefato em toda mensagem;
- abrir contrato nas classes B e C;
- selecionar agentes por competência;
- justificar a seleção;
- garantir exposição individual completa;
- impedir atribuições fictícias;
- preservar divergências;
- exigir evidência;
- declarar `CONTINUAR`, `CORRIGIR`, `BLOQUEAR` ou `CONCLUIR`;
- informar onde está o artefato.

## 9. Artefato obrigatório por mensagem

Toda mensagem deve criar artefato, atualizar artefato existente ou registrar nova entrada em log verificável.

Artefatos aceitos incluem arquivo Markdown, log, decisão, especificação, relatório, checklist, issue, comentário em PR, commit, pull request, teste, captura ou pacote de evidências.

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

Sem artefato, a resposta está em não conformidade, mesmo quando casual ou curta.

## 10. Execução silenciosa

A execução silenciosa é proibida por padrão. Somente Léo pode autorizá-la explicitamente, por exemplo:

```text
EXECUTAR EM SILÊNCIO
```

Mesmo em execução silenciosa, toda mensagem continua exigindo artefato e ações críticas continuam exigindo evidência.

## 11. Proibições

Não é permitido:

- responder sem artefato;
- atribuir trabalho não realizado;
- afirmar pesquisa sem consulta real;
- afirmar implementação sem alteração verificável;
- incluir agentes sem necessidade;
- ocultar divergências;
- reescrever silenciosamente contribuição anterior;
- concluir sem evidência;
- usar apenas memória da conversa como fonte oficial;
- confundir hipótese, proposta, decisão e fato.

## 12. Carmem

Carmem deve consolidar ou atualizar o artefato de cada mensagem, preservar contribuições individuais, registrar decisões aprovadas, separar original, revisão e correção e preparar versionamento quando autorizado.

## 13. Emily

Emily deve auditar, quando aplicável, classificação, existência do artefato, agentes selecionados, pesquisas reais, evidências, aderência ao contrato, distinção entre fato e proposta, passagem de bastão e ausência de trabalho silencioso não autorizado.

Pareceres:

- `PASS`;
- `PASS_WITH_RESERVATIONS`;
- `REQUEST_CORRECTION`;
- `BLOCKED`;
- `FAIL`.

## 14. Manoel — Especialista em Banco de Dados

Fica formalmente reconhecido:

- **Manoel — Especialista em Banco de Dados**.

Responsabilidades: modelagem, esquemas, persistência, integridade, consultas, desempenho, migrações, autenticação, dados de usuários, histórico, auditoria, métricas, sincronização, arquivos, relatórios, backup e recuperação.

Fronteira:

- Sofia responde pela arquitetura geral;
- Manoel responde pela arquitetura de dados e ciclo de vida das informações;
- decisões que afetem ambos devem ser revisadas pelos dois.

## 15. Estado compartilhado

Mensagens B e C registram:

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

Mensagens A usam o registro mínimo da seção 4.1.

## 16. Conformidade

Toda mensagem está conforme quando foi classificada, gerou ou atualizou artefato, informou esse artefato e não atribuiu trabalho fictício.

Mensagens B e C exigem ainda contrato, agentes selecionados, justificativa, contribuição exposta, pesquisas informadas, achados separados, passagem, evidências, auditoria quando exigida e estado final.

## 17. Não conformidade

Quando a política falhar:

1. Mestre reconhece a falha;
2. estado muda para `CORRECAO`;
3. contribuições omitidas são reconstruídas apenas com evidências reais;
4. trabalho retroativo não pode ser inventado;
5. Carmem corrige o artefato;
6. Emily revisa quando aplicável;
7. o ciclo só termina após correção.

## 18. Estados finais

- `CONTINUAR`;
- `CORRIGIR`;
- `BLOQUEAR`;
- `CONCLUIR`.

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
Carmem → Sofia → Manoel → Gabriel → Emily → Léo
```

Esta decisão não autoriza merge na `main`.