# R03A — Inventário Inicial de Capacidades do NotebookLM

## Estado

- **Missão:** `MCF-CONTENT-LAB-001`
- **Etapa:** `R03A — EM_EXECUÇÃO`
- **Objetivo:** mapear o que pode ser lido, gerado, exportado ou automatizado no NotebookLM para projetar um App/connector próprio NotebookLM ↔ ChatGPT.

## Fato observado nesta missão

LEANDRO demonstrou na UI do NotebookLM que, ao pedir `quero a transcrição do vídeo que você criou`, o próprio produto iniciou uma resposta intitulada `Transcrição Completa do Vídeo Explicativo`.

Classificação: **OBSERVADO NA UI / NÃO TRATADO COMO API**.

Implicação: a transcrição de um artefato gerado pelo NotebookLM pode ser recuperável pela própria conversa, reduzindo a necessidade de transcritores externos para este caso.

## Superfície do produto pessoal confirmada em documentação oficial

A documentação de ajuda do Gemini Notebook confirma, entre outros recursos:

- criação e gerenciamento de notebooks;
- inclusão de fontes como PDFs, sites, vídeos do YouTube, áudio, Docs e Slides;
- conversa fundamentada nas fontes com citações;
- notas;
- seleção e organização de fontes;
- compartilhamento de notebooks;
- artefatos do Estúdio:
  - Resumo em Áudio;
  - Resumo em Vídeo;
  - mapa mental;
  - relatórios;
  - tabela de dados;
  - cartões de estudo;
  - testes;
  - apresentação de slides;
  - infográfico;
- visualização do comando personalizado usado para gerar vários artefatos;
- exportações/downloads oficiais, dependendo do tipo de artefato.

Fontes oficiais consultadas:

- https://support.google.com/gemininotebook/answer/16206563
- https://support.google.com/gemininotebook/answer/16179559
- https://support.google.com/gemininotebook/answer/16454555
- https://support.google.com/gemininotebook/answer/16757456

## Exportações/downloads já confirmados

| Recurso | Saída oficial confirmada |
|---|---|
| Relatórios | exportação para Google Docs |
| Tabela de dados | exportação para Google Sheets; citações em aba separada |
| Apresentação de slides | download em PDF e PPTX |
| Resumo em Vídeo | download do arquivo de vídeo e link compartilhável quando permitido |
| Resumo em Áudio | download disponível no produto/app |
| Infográfico | download em PNG |
| Prompts de geração | `Ver comando personalizado`/`Mostrar comando` disponível para vários artefatos |

## API oficial encontrada — Gemini Notebook Enterprise

A Google publica API `v1alpha`/Preview para Gemini Notebook Enterprise. Nas páginas oficiais consultadas foram confirmadas capacidades programáticas para:

### Notebooks

- criar;
- recuperar;
- listar notebooks vistos recentemente;
- excluir;
- compartilhar.

### Fontes

- adicionar fontes em lote;
- upload de arquivo;
- recuperar metadados da fonte;
- excluir fontes;
- tipos documentados incluem Google Docs/Slides, texto, conteúdo web, YouTube, PDF, TXT, Markdown, DOCX, PPTX, XLSX, áudio, vídeo e imagem.

### Resumo em Áudio

- criar programaticamente;
- definir fontes usadas, foco do episódio e idioma;
- excluir.

Fontes oficiais consultadas:

- https://docs.cloud.google.com/gemini/enterprise/notebooklm-enterprise/docs/api-notebooks
- https://docs.cloud.google.com/gemini/enterprise/notebooklm-enterprise/docs/api-notebooks-sources
- https://docs.cloud.google.com/gemini/enterprise/notebooklm-enterprise/docs/api-audio-overview

## Limitação importante da pesquisa atual

Nas páginas oficiais consultadas **não foi encontrada** uma API pública documentada do produto pessoal que exponha integralmente:

- histórico/conversa;
- citações completas;
- notas;
- Resumo em Vídeo;
- mapas mentais;
- relatórios;
- tabela de dados;
- cartões/testes;
- slides;
- infográficos;
- comandos usados para gerar todos os artefatos.

Isso não prova que endpoints internos não existam. Apenas significa que eles **não devem ser tratados como API pública suportada** sem documentação oficial adicional.

## Arquitetura recomendada

### Nome de trabalho

`NotebookLM Bridge`

### Forma no ChatGPT

Tecnicamente, usar o modelo atual de **App ChatGPT via MCP**. “Plugin” pode continuar sendo o nome informal usado na conversa.

### Arquétipo inicial

`tool-only` / data-first.

Motivo: o primeiro objetivo é trazer dados verificáveis do NotebookLM para o contexto do ChatGPT. Uma UI própria pode ser adicionada depois.

### Adaptadores

1. **EnterpriseApiAdapter**
   - usa somente APIs oficiais do Gemini Notebook Enterprise;
   - cobre notebooks, fontes e Resumo em Áudio inicialmente.

2. **ConsumerBrowserBridge**
   - extensão de navegador companheira, multiplataforma;
   - atua somente em páginas NotebookLM que o usuário abriu e autorizou;
   - lê elementos visíveis/estruturados e aciona ações permitidas pelo usuário;
   - não coleta senha, cookie ou token de sessão;
   - não contorna autenticação, paywall ou controle de acesso;
   - deve ser usada apenas depois de revisar limites e termos aplicáveis.

3. **DriveExportAdapter**
   - usa exportações oficiais para Docs/Sheets/Drive como rota preferencial quando disponível;
   - reduz dependência de automação frágil de interface.

## Superfície inicial de ferramentas MCP

Para um conector orientado a conhecimento, usar `search` e `fetch` como superfície padrão de leitura.

Ferramentas de leitura candidatas:

- `search` — localizar notebooks, fontes, conversas e artefatos autorizados;
- `fetch` — recuperar um objeto específico com conteúdo, metadados e proveniência;
- `list_artifacts` — listar artefatos de Estúdio quando o adaptador permitir;
- `get_generation_prompt` — recuperar o comando usado na geração quando oficialmente visível;
- `get_transcript` — recuperar transcrição disponibilizada pelo próprio NotebookLM ou exportação autorizada;
- `get_citations` — recuperar citações e referências quando expostas de forma estruturada.

Ferramentas de ação, em fase posterior e separadas das leituras:

- `ask_notebook`;
- `create_notebook`;
- `add_source`;
- `generate_artifact`;
- `export_artifact`;
- `share_notebook`;
- `delete_*` somente com autorização explícita e gates adequados.

## Modelo de dados mínimo

Objetos normalizados:

- `Notebook`;
- `Source`;
- `ConversationTurn`;
- `Citation`;
- `Note`;
- `Artifact`;
- `GenerationPrompt`;
- `Transcript`;
- `Export`;
- `EvidenceReceipt`.

Cada objeto deve registrar, quando disponível:

- ID/origem;
- notebook de origem;
- tipo;
- título;
- timestamps;
- fonte/proveniência;
- método de obtenção: `OFFICIAL_API`, `OFFICIAL_EXPORT`, `VISIBLE_UI`, `USER_PROVIDED`;
- estado de verificação;
- link/identificador verificável quando permitido.

## Matriz inicial de integração

| Capacidade | Produto pessoal | Enterprise API | Estratégia inicial |
|---|---|---|---|
| listar/criar notebook | UI confirmada | API confirmada | API quando Enterprise; bridge quando pessoal |
| fontes | UI confirmada | API confirmada | API/exportação/bridge |
| conversa | UI confirmada | API não confirmada nesta pesquisa | browser bridge |
| citações | UI confirmada | API não confirmada nesta pesquisa | browser bridge/exportação |
| notas | UI confirmada | API não confirmada nesta pesquisa | browser bridge |
| transcrição solicitada ao NotebookLM | observada nesta missão | API específica não confirmada | conversa/bridge |
| Resumo em Áudio | UI confirmada | API confirmada | API Enterprise; UI/bridge pessoal |
| Resumo em Vídeo | UI confirmada | API não confirmada nesta pesquisa | download/bridge |
| mapa mental | UI confirmada | API não confirmada nesta pesquisa | bridge/exportação se disponível |
| relatórios | UI confirmada | API não confirmada nesta pesquisa | exportar Docs |
| tabela de dados | UI confirmada | API não confirmada nesta pesquisa | exportar Sheets |
| cartões/testes | UI confirmada | API não confirmada nesta pesquisa | bridge |
| slides | UI confirmada | API não confirmada nesta pesquisa | PDF/PPTX + bridge |
| infográfico | UI confirmada | API não confirmada nesta pesquisa | PNG + bridge |
| prompt de geração | UI confirmada para vários artefatos | API não confirmada nesta pesquisa | bridge |

## Próximos testes

1. concluir a transcrição do vídeo atual diretamente pelo NotebookLM;
2. verificar se a resposta completa pode ser copiada, salva como nota ou exportada;
3. inventariar DOM/estrutura visível sem capturar credenciais;
4. verificar links de artefatos e downloads oficiais;
5. revisar termos aplicáveis antes de automatizar a UI pessoal;
6. somente depois iniciar o scaffold do App ChatGPT/MCP.

**Estado deste artefato:** `PARCIAL — SUFICIENTE PARA DIRECIONAR R03A, NÃO AUTORIZA ALEGAR INTEGRAÇÃO COMPLETA`.
