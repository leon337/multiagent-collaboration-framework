# MCF-DEC-002 — Política de Trabalho Visível por Agente e Artefato por Mensagem

**Data:** 2 de agosto de 2026  
**Autoridade:** Léo  
**Estado:** em correção após RC-002  
**Relacionada:** `MCF-DEC-001`

## 1. Decisão

1. O trabalho dos agentes não pode ocorrer silenciosamente, salvo autorização expressa de Léo.
2. Todo agente selecionado deve expor sua contribuição real.
3. Toda mensagem deve produzir ou atualizar um artefato verificável.
4. Artefato por mensagem não significa commit por mensagem.
5. O Mestre é a ponte oficial entre Léo e a equipe.
6. Nenhuma entrega é concluída até o Mestre apresentá-la claramente a Léo.
7. A seleção dinâmica por competência permanece ativa.
8. Atribuição fictícia de trabalho é proibida.

## 2. Mestre — ponte oficial

O Mestre deve:

- receber o pedido de Léo;
- classificar a mensagem;
- abrir o contrato quando aplicável;
- selecionar agentes por competência;
- justificar a seleção;
- apresentar cada agente na ordem real de trabalho;
- preservar divergências;
- informar bloqueios e autorizações;
- consolidar somente após as contribuições individuais;
- apresentar os artefatos com contrato de entrega;
- declarar o estado final.

Os agentes não substituem o Mestre na comunicação final com Léo. O Mestre é responsável por garantir que Léo saiba o que foi feito, por quem, com qual evidência e onde está cada artefato.

## 3. Classes de mensagem

### Classe A — simples

Saudação, confirmação curta, resposta breve ou correção nominal simples.

- exige artefato mínimo;
- registra nova entrada em log agregado;
- não exige novo arquivo ou commit individual;
- não exige mobilização artificial da equipe.

### Classe B — operacional

Pesquisa, análise, requisito, planejamento ou decisão com impacto.

- exige contrato da missão;
- agentes selecionados e justificados;
- trabalho visível;
- evidências;
- artefato de trabalho ou atualização material.

### Classe C — técnica ou crítica

Implementação, alteração de repositório, teste, auditoria, deploy, migração, dados, autenticação ou gate humano.

- exige todos os itens da Classe B;
- evidência técnica reforçada;
- autorizações e condição de parada;
- RC quando aplicável;
- versionamento somente quando houver mudança material.

## 4. Conteúdo obrigatório por agente

Cada agente participante das Classes B e C apresenta:

1. entrada recebida;
2. pesquisa ou consulta realizada;
3. achados;
4. análise;
5. decisão ou recomendação;
6. entrega;
7. evidência;
8. passagem de bastão.

Quando não houver pesquisa, deve declarar isso explicitamente.

## 5. Artefato por mensagem sem recursão

A obrigação de artefato é cumprida por uma destas formas:

- entrada em log agregado;
- atualização de artefato existente;
- criação de artefato de trabalho;
- comentário em issue ou PR;
- resultado de teste;
- captura ou pacote de evidências;
- commit quando houver alteração material que deva ser versionada.

É proibido criar commits apenas para provar que uma mensagem teve artefato.

### 5.1 Classe A

Usa log agregado, por sessão, missão ou período definido.

```yaml
mensagem_id: identificador
classe: A
entrada: resumo
resposta: resumo
agentes_participantes: []
decisao: nenhuma_ou_decisao_curta
estado: concluido
```

### 5.2 Classes B e C

```yaml
mensagem_id: identificador
classe: B_ou_C
objetivo_id: identificador
estado: estado_atual
agentes_participantes: []
entregas: []
evidencias: []
decisoes: []
pendencias: []
bloqueios: []
proximo_passo: descricao
```

## 6. Canal, retenção e versionamento

- Classe A: log agregado da sessão ou missão; consolidado por Carmem quando necessário.
- Classe B: artefato de trabalho em arquivo, issue, comentário ou documento de missão.
- Classe C: artefato técnico versionado, teste, PR, commit ou pacote de evidências.
- O repositório é a fonte oficial para decisões e entregas que precisem de persistência institucional.
- A conversa não substitui a fonte oficial de verdade.
- Commit é exigido apenas quando houver mudança material autorizada para versionamento.

## 7. Contrato de entrega ao Léo

Toda entrega apresentada pelo Mestre deve informar:

```yaml
nome: nome_do_artefato
tipo: decisao_relatorio_codigo_teste_log_outro
caminho: caminho_ou_nao_aplicavel
link: link_ou_nao_aplicavel
commit: sha_ou_nao_aplicavel
estado: rascunho_em_correcao_aprovado_bloqueado
autor: agente_responsavel
revisor: agente_revisor_ou_nao_aplicavel
objetivo_relacionado: identificador
```

Sem esse contrato, a entrega não pode ser considerada apresentada a Léo.

## 8. Gates obrigatórios de Carmem e Gabriel

Em missões com documentação e versionamento:

1. Carmem apresenta integralmente o documento, alterações, caminhos e estado.
2. Gabriel apresenta integralmente branch, commits, PR, arquivos e limites operacionais.
3. Emily revisa somente após as apresentações de Carmem e Gabriel.
4. Mestre consolida somente após a RC.

A ausência de Carmem ou Gabriel, quando suas competências forem necessárias, é não conformidade.

## 9. Carmem

Carmem:

- consolida ou atualiza artefatos;
- preserva contribuições individuais;
- mantém terminologia e caminhos coerentes;
- separa original, revisão e correção;
- prepara o contrato de entrega;
- informa claramente onde cada artefato está.

## 10. Gabriel

Gabriel:

- executa versionamento autorizado;
- informa branch, HEAD, commits, PR e arquivos;
- preserva a `main` até autorização;
- não cria commit sem mudança material;
- registra limitações reais das ferramentas;
- confirma o estado de publicação.

## 11. Emily

Emily audita:

- texto e comportamento real;
- papel do Mestre como ponte;
- contrato de entrega;
- presença de Carmem e Gabriel quando aplicável;
- ausência de recursão documental;
- evidências e autorizações;
- classificação da mensagem;
- independência documental declarada.

Toda metodologia operacional relevante deve passar por simulação controlada antes da aprovação final.

## 12. Manoel — Especialista em Banco de Dados

Manoel responde por modelagem, esquemas, persistência, integridade, consultas, desempenho, migrações, autenticação, usuários, histórico, auditoria, métricas, sincronização, arquivos, relatórios, backup e recuperação.

- Sofia responde pela arquitetura geral.
- Manoel responde pela arquitetura de dados e pelo ciclo de vida das informações.
- Decisões compartilhadas exigem revisão dos dois.

## 13. Não conformidade

Quando a política falhar:

1. Mestre reconhece a falha;
2. estado muda para `CORRECAO`;
3. trabalho omitido só pode ser reconstruído com evidência real;
4. Carmem corrige o artefato;
5. Gabriel corrige o versionamento quando necessário;
6. Emily executa nova revisão;
7. o ciclo só termina após correção.

## 14. Autorizações

```yaml
registro_metodologico: autorizado
versionamento_em_branch: autorizado
pr_draft: autorizado
revisao_critica: autorizada
merge_na_main: nao_autorizado
implementacao_de_software: nao_autorizada
publicacao_automatica: nao_autorizada
```

## 15. Estado normativo

```text
MESTRE_PONTE_OFICIAL=SIM
TRABALHO_SILENCIOSO=PROIBIDO
EXPOSICAO_POR_AGENTE=OBRIGATORIA_PARA_SELECIONADOS
ARTEFATO_POR_MENSAGEM=OBRIGATORIO
COMMIT_POR_MENSAGEM=PROIBIDO
LOG_AGREGADO_CLASSE_A=OBRIGATORIO
CONTRATO_DE_ENTREGA_AO_LEO=OBRIGATORIO
GATE_CARMEM_GABRIEL=OBRIGATORIO_QUANDO_APLICAVEL
SELECAO_DINAMICA=ATIVA
ATRIBUICAO_FICTICIA=PROIBIDA
ESPECIALISTA_BANCO_DE_DADOS=MANOEL
```

## 16. Próximo gate

```text
Carmem → Sofia → Manoel → Gabriel → Simulação controlada → Emily → Mestre → Léo
```

Esta decisão não autoriza merge na `main`.
