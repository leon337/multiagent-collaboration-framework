# Project Instructions — MCF

Este diretório contém o pacote necessário para inicializar chats novos do projeto com o modo de trabalho do Multiagent Collaboration Framework.

## Arquivos

| Arquivo | Finalidade |
|---|---|
| `MCF-CHATGPT-PROJECT-INSTRUCTIONS.txt` | Texto curto para colar no campo Instruções do projeto |
| `MCF-PROJECT-OPERATING-INSTRUCTIONS.md` | Fonte canônica de comportamento e precedência |
| `MCF-STARTUP-CHECKLIST.yaml` | Checklist executado no início de missões concretas |
| `MCF-CHAT-BOOTSTRAP-TESTS.md` | Testes em chat totalmente novo |
| `README.md` | Instalação, atualização e validação |

## Instalação no projeto ChatGPT

### Etapa 1 — Instruções do projeto

Copie integralmente o conteúdo de:

```text
MCF-CHATGPT-PROJECT-INSTRUCTIONS.txt
```

Cole no campo de Instruções do projeto “troca de conversa entre agentes”.

### Etapa 2 — Arquivos do projeto

Adicione à pasta de arquivos do projeto:

```text
MCF-PROJECT-OPERATING-INSTRUCTIONS.md
MCF-STARTUP-CHECKLIST.yaml
MCF-CHAT-BOOTSTRAP-TESTS.md
README.md
```

Quando for útil para recuperação completa, inclua também os documentos vigentes indicados pelo arquivo canônico ou disponibilize acesso ao repositório.

### Etapa 3 — Chat novo

Crie um chat totalmente novo dentro do projeto. Não reutilize esta conversa para validar o bootstrap.

### Etapa 4 — Testes

Execute os cenários de `MCF-CHAT-BOOTSTRAP-TESTS.md` sem corrigir o chat durante a avaliação.

### Etapa 5 — Gate

- Beatriz calcula o score;
- Augusto verifica sequência, handoffs e recuperação;
- Emily audita evidências;
- Léo decide aprovação, correção ou bloqueio.

## Atualização

Quando o MCF mudar:

1. atualizar o arquivo canônico;
2. avaliar se a instrução curta precisa mudar;
3. incrementar versão;
4. registrar decisão;
5. integrar à `main`;
6. substituir os arquivos no projeto ChatGPT;
7. repetir testes de bootstrap.

## Regra de verdade

```yaml
repository_main: fonte_versionada
chatgpt_project_instructions: bootstrap_ativo
chatgpt_project_files: contexto_operacional
new_chat_tests: prova_de_aplicacao
```

Integrar este diretório ao GitHub não instala automaticamente as instruções no projeto ChatGPT. A etapa de colar a instrução e adicionar os arquivos é manual enquanto não existir uma ferramenta específica para editar essas configurações.

## Resultado esperado

Depois da instalação, chats novos devem:

- reconhecer Leandro, Léo e Mestre;
- usar 29 agentes oficiais;
- selecionar poucos agentes por competência;
- consultar skills antes de ferramentas;
- mostrar execução cronológica;
- intercalar passagens;
- trabalhar em loop;
- gerar documentação por fase;
- usar gate de Léo;
- evitar confirmação humana rotineira;
- nunca inventar execução externa.
