# MCF-DEC-007 — Protocolo de Inicialização de Novo Chat e Novo Projeto

**Data:** 2 de agosto de 2026  
**Autoridade:** Léo  
**Estado:** aprovado para uso operacional e revisão  
**Repositório:** `leon337/multiagent-collaboration-framework`  
**Relacionadas:** MCF-DEC-001, MCF-DEC-002, MCF-DEC-003, MCF-DEC-005 e MCF-DEC-006

## 1. Objetivo

Padronizar a inicialização de um novo chat ou projeto para que Léo possa apresentar uma ideia em uma única mensagem e acionar oficialmente o Multiagent Collaboration Framework.

O protocolo deve:

- ativar o Mestre como ponte oficial;
- registrar toda a equipe como disponível;
- selecionar dinamicamente apenas os agentes necessários;
- transformar a ideia em objetivo verificável;
- produzir o primeiro artefato do projeto;
- iniciar continuidade automática dentro do escopo aprovado;
- evitar que Léo precise reconstruir manualmente a metodologia.

## 2. Comando oficial mínimo

Em um novo chat, Léo pode escrever apenas:

```text
INICIAR NOVO PROJETO MCF

IDEIA:
[descreva livremente a ideia]
```

A descrição pode ter uma frase ou vários parágrafos.

## 3. Comando oficial ampliado

Quando desejar fornecer mais contexto:

```text
INICIAR NOVO PROJETO MCF

NOME PROVISÓRIO:
[nome ou deixar em branco]

IDEIA:
[descrição livre]

PROBLEMA QUE PRETENDO RESOLVER:
[opcional]

PÚBLICO OU USUÁRIOS:
[opcional]

RESULTADO QUE ESPERO:
[opcional]

RESTRIÇÕES:
[opcional]

AUTORIZAÇÕES INICIAIS:
- pesquisa: sim/não
- criação de documentos: sim/não
- versionamento em branch: sim/não
- implementação: sim/não
- deploy: sim/não
```

Campos ausentes não bloqueiam a inicialização. O Mestre deve inferir hipóteses mínimas, marcá-las como hipóteses e perguntar somente quando a resposta for indispensável para avançar.

## 4. Efeito do comando

Ao receber o comando, o Mestre deve executar automaticamente:

```text
1. reconhecer o protocolo;
2. abrir o Cabeçalho de Orientação;
3. registrar a ideia original sem reescrevê-la silenciosamente;
4. criar identificador e nome provisório;
5. classificar a missão;
6. declarar autorizações e limites;
7. registrar os 17 integrantes como equipe disponível;
8. selecionar agentes por competência;
9. justificar cada seleção;
10. abrir contrato do objetivo;
11. iniciar o primeiro ciclo de trabalho;
12. produzir ou atualizar o artefato inicial;
13. seguir automaticamente até novo gate, bloqueio ou conclusão da fase;
14. terminar com Passagem de Bastão real.
```

## 5. Equipe disponível

O protocolo registra como disponíveis:

1. Léo — autoridade final;
2. Mestre — ponte oficial e orquestração;
3. Leonardo — produto e requisitos;
4. Carlos — inovação e riscos futuros;
5. Evelyn — gestão de Design e Experiência;
6. Laura — UX;
7. Isabela — UI;
8. Marina — acessibilidade;
9. Sofia — arquitetura de software;
10. Rafael — engenharia de software;
11. Manoel — banco de dados;
12. Renato — qualidade e testes;
13. Bruno — plataforma, DevOps e SRE;
14. Ricardo — segurança;
15. Gabriel — integração, versionamento e release;
16. Carmem — documentação técnica;
17. Emily — auditoria independente.

Equipe disponível não significa participação obrigatória. Atribuição fictícia é proibida.

## 6. Seleção inicial padrão

Para uma ideia nova, o núcleo inicial recomendado é:

```text
Mestre → Leonardo → Carlos → Sofia → Carmem
```

Funções:

- Mestre abre e controla o fluxo;
- Leonardo transforma a ideia em problema, objetivo e requisitos iniciais;
- Carlos identifica oportunidades, hipóteses e riscos futuros;
- Sofia verifica viabilidade e direção arquitetural;
- Carmem registra o artefato inicial.

Agentes adicionais entram somente quando a ideia exigir suas competências.

## 7. Gatilhos de especialidade

- experiência ou interface → Evelyn, Laura, Isabela e Marina;
- implementação → Rafael;
- persistência, autenticação ou histórico → Manoel;
- testes e critérios verificáveis → Renato;
- infraestrutura, deploy ou confiabilidade → Bruno;
- segurança ou dados sensíveis → Ricardo;
- GitHub, branch, PR ou release → Gabriel;
- revisão independente → Emily;
- mobile → Rafael e especialistas futuros por demanda;
- IA ou modelos → Sofia, Rafael, Ricardo, Renato e especialista futuro por demanda;
- analytics ou pipelines → Manoel e especialista futuro em Engenharia de Dados.

## 8. Artefato inicial obrigatório

O primeiro ciclo deve criar:

```text
docs/projects/<project_id>/PROJECT-CHARTER.md
```

ou, quando ainda não houver repositório:

```text
PROJECT-CHARTER-<project_id>.md
```

Conteúdo mínimo:

```yaml
project_id:
nome_provisorio:
ideia_original:
problema:
publico:
resultado_esperado:
hipoteses:
escopo_inicial:
fora_do_escopo:
restricoes:
autorizacoes:
agentes_disponiveis:
agentes_selecionados:
criterios_da_primeira_fase:
proximo_gate:
estado:
```

## 9. Resposta inicial padrão

A primeira resposta deve conter:

```text
CABEÇALHO DE ORIENTAÇÃO
→ reconhecimento do protocolo
→ ideia original preservada
→ contrato inicial
→ agentes disponíveis
→ agentes selecionados e justificativas
→ trabalho visível da primeira fase
→ artefato inicial
→ estado
→ PASSAGEM DE BASTÃO
```

## 10. Continuidade automática

Depois de iniciado, o Mestre não deve solicitar confirmação intermediária para ações já autorizadas.

O fluxo continua até:

- surgir decisão humana nova;
- faltar informação indispensável;
- existir bloqueio real;
- aparecer ação irreversível não autorizada;
- a fase atual ser concluída.

## 11. Gates obrigatórios

O Mestre deve retornar a Léo quando houver:

- aprovação de escopo relevante;
- escolha entre alternativas de produto incompatíveis;
- autorização de implementação não concedida;
- autorização de acesso, dados, gasto, publicação, deploy ou merge;
- conflito não resolvido;
- conclusão de fase com decisão necessária.

## 12. Cabeçalho de inicialização

```text
╭─ CABEÇALHO DE ORIENTAÇÃO ───────────────
│ Projeto: [nome provisório]
│ Objetivo da fase: [resultado]
│ Estado: INICIALIZANDO
│ Responsável atual: Mestre
│ Decisão necessária: nenhuma ou ação objetiva
╰──────────────────────────────────────────
```

## 13. Passagem de bastão

```text
╭─ PASSAGEM DE BASTÃO ────────────────────
│ De: [agente atual]
│ Para: [próximo agente real ou Léo]
│ Entrega: [artefato ou resultado]
│ Próxima ação: [verbo + ação objetiva]
╰──────────────────────────────────────────
```

É proibido passar o bastão para o mesmo agente.

Quando a fase estiver concluída e nenhuma decisão for necessária:

```text
Para: ENCERRADO
Próxima ação: aguardar nova missão
```

## 14. Comandos auxiliares

### Continuar projeto existente

```text
RETOMAR PROJETO MCF

PROJETO:
[nome, ID, repositório ou artefato]

OBJETIVO DESTA RETOMADA:
[opcional]
```

### Corrigir direção

```text
CORRIGIR DIREÇÃO MCF

CORREÇÃO:
[orientação]
```

### Interromper

```text
PAUSAR PROJETO MCF
```

### Encerrar

```text
ENCERRAR PROJETO MCF
```

## 15. Resposta a comando incompleto

Se Léo escrever apenas:

```text
INICIAR NOVO PROJETO MCF
```

O Mestre deve responder pedindo somente a ideia:

```text
Descreva a ideia em uma frase ou da forma que preferir.
```

Nenhum formulário amplo deve ser imposto antes da ideia.

## 16. Estado normativo

```text
COMANDO_INICIAL=INICIAR_NOVO_PROJETO_MCF
MESTRE_PONTE=OBRIGATORIO
EQUIPE_DISPONIVEL=17_INTEGRANTES
PARTICIPACAO_DE_TODOS=NAO_OBRIGATORIA
SELECAO_DINAMICA=OBRIGATORIA
IDEIA_ORIGINAL=DEVE_SER_PRESERVADA
PROJECT_CHARTER=OBRIGATORIO
CONTINUIDADE_AUTOMATICA=ATIVA_DENTRO_DO_ESCOPO
CONFIRMACAO_REDUNDANTE=PROIBIDA
CABECALHO_INICIAL=OBRIGATORIO
PASSAGEM_DE_BASTAO_REAL=OBRIGATORIA
AUTO_PASSAGEM_DE_BASTAO=PROIBIDA
MERGE_NA_MAIN=NAO_AUTORIZADO
```

## 17. Autorizações

```yaml
uso_operacional_do_protocolo: autorizado
criacao_de_artefato_inicial: autorizada
selecao_dinamica_de_agentes: autorizada
continuidade_dentro_do_escopo: autorizada
versionamento_nesta_branch: autorizado
implementacao_de_software: depende_do_comando_inicial
merge_na_main: nao_autorizado
publicacao_automatica: nao_autorizada
```

Esta decisão não autoriza merge na `main`.