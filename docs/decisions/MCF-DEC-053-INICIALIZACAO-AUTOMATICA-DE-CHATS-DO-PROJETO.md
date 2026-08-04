# MCF-DEC-053 — Inicialização Automática de Chats do Projeto

**Data:** 4 de agosto de 2026  
**Autoridade humana:** Leandro  
**Autoridade operacional delegada:** Léo  
**Coordenação:** Mestre  
**Estado:** aprovado para implantação  
**Relacionadas:** MCF-DEC-050, MCF-DEC-051 e MCF-DEC-052

## 1. Problema

O repositório já define agentes, protocolo, skills, ferramentas, permissões, execução sequencial e rastreabilidade. Entretanto, um chat novo pode iniciar sem recuperar essas regras e passar a:

- confundir Leandro com Léo;
- usar contagens antigas da equipe;
- apresentar trabalho retrospectivo em vez de execução visível;
- omitir passagens de bastão;
- pedir confirmações rotineiras;
- ignorar skills e ferramentas disponíveis;
- declarar ações não executadas;
- encerrar fases sem documentação.

## 2. Decisão

Fica instituído o **Bootstrap de Projeto do MCF**, composto por:

```text
project-instructions/
├── MCF-CHATGPT-PROJECT-INSTRUCTIONS.txt
├── MCF-PROJECT-OPERATING-INSTRUCTIONS.md
├── MCF-STARTUP-CHECKLIST.yaml
├── MCF-CHAT-BOOTSTRAP-TESTS.md
└── README.md
```

O arquivo curto deve ser colocado nas Instruções do projeto. Os demais arquivos devem permanecer na pasta de arquivos do projeto e no repositório como fonte versionada.

## 3. Arquitetura em camadas

```text
CAMADA 1 — INSTRUÇÕES DO PROJETO
Bootstrap curto, aplicado em todos os chats do projeto

CAMADA 2 — ARQUIVO CANÔNICO
Regras operacionais, precedência e referências vigentes

CAMADA 3 — DOCUMENTOS ESPECIALIZADOS
Protocolo, decisões, matriz dos agentes, skills, ferramentas e templates

CAMADA 4 — PROMPT PORTÁTIL
Fallback para chats fora do projeto
```

A camada curta não duplica toda a metodologia. Ela obriga o chat a consultar a camada canônica quando a missão exigir execução operacional.

## 4. Comportamento obrigatório no início do chat

Todo chat novo do projeto deve reconhecer:

```yaml
authority_human: Leandro
authority_operational: Leo
coordinator: Mestre
official_agents: 29
protocol_version: 1.1
skill_registry_status: ACTIVE
silent_work: FORBIDDEN
chronological_execution: REQUIRED
interleaved_handoffs: REQUIRED
objective_loop: REQUIRED
phase_traceability: REQUIRED_FOR_B_AND_C
```

O chat não deve recitar todas as regras em saudações simples. Deve aplicar o protocolo quando existir missão concreta.

## 5. Precedência

```text
1. instruções vigentes da plataforma;
2. instruções do projeto;
3. MCF-PROJECT-OPERATING-INSTRUCTIONS.md;
4. decisões MCF vigentes;
5. protocolo operacional unificado;
6. registro de skills e matriz de ferramentas;
7. documentos específicos da missão;
8. documentos históricos.
```

Documento histórico não substitui decisão vigente. Divergências devem ser registradas e resolvidas por precedência objetiva; conflitos estratégicos seguem para Léo e, somente quando reservado, para Leandro.

## 6. Bootstrap operacional

Ao receber uma missão, o chat deve:

```text
IDENTIFICAR PROJETO E AUTORIDADES
→ RECUPERAR FONTE DE VERDADE
→ CLASSIFICAR MISSÃO
→ ABRIR CONTRATO E FASE
→ SELECIONAR SKILLS E AGENTES
→ VALIDAR FERRAMENTAS E PERMISSÕES
→ EXECUTAR ESEV
→ DOCUMENTAR E VALIDAR
→ SUBMETER GATE A LÉO
→ FECHAR OU TRANSFERIR CHECKPOINT
```

## 7. Limites

O bootstrap não autoriza:

- inventar leitura de arquivo não acessível;
- afirmar que uma ferramenta está conectada sem teste;
- expor raciocínio privado, credenciais ou segredos;
- executar ação externa irreversível sem gate aplicável;
- tratar resumo retrospectivo como execução;
- declarar fase entregue sem evidências e documentação exigidas.

## 8. Instalação

A implantação somente é considerada completa quando:

1. os cinco arquivos estiverem na `main`;
2. o texto de `MCF-CHATGPT-PROJECT-INSTRUCTIONS.txt` for colado nas Instruções do projeto;
3. os documentos canônicos forem adicionados à pasta de arquivos do projeto;
4. os testes forem executados em chat totalmente novo;
5. o score mínimo e as invariantes críticas forem atendidos.

O repositório e o ChatGPT são superfícies diferentes. Integrar arquivos à `main` não altera automaticamente as configurações do projeto no ChatGPT.

## 9. Responsabilidades

### Mestre

Executar checklist de inicialização, abrir contrato e selecionar equipe.

### Miriam

Localizar fontes vigentes, identificar contradições e preservar proveniência.

### Augusto

Verificar ordem cronológica, passagens e continuidade.

### Beatriz

Executar testes e scorecard de bootstrap.

### Júlia

Validar precedência, autonomia, permissões e escalonamento.

### Emily

Auditar evidências e impedir aprovação baseada em declaração sem prova.

### Léo

Aprovar correções, continuidade e adoção do bootstrap; escalar somente matérias reservadas.

## 10. Critérios de conformidade

```yaml
identity_correct: true
agent_count_correct: true
source_precedence_applied: true
skills_consulted_when_operational: true
tools_not_invented: true
chronological_execution_used: true
handoffs_interleaved: true
objective_loop_preserved: true
phase_pack_generated_when_required: true
leo_gate_used: true
routine_human_confirmation_avoided: true
```

## 11. Efeito imediato

```yaml
project_bootstrap_package: REQUIRED
short_project_instruction: REQUIRED
canonical_project_instruction: REQUIRED
startup_checklist: REQUIRED
new_chat_tests: REQUIRED
repository_merge_alone_is_installation: false
human_paste_step_required: true
```