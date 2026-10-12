# Integração MCF — Manual do Agente GPT

**Status:** instrução operacional de integração  
**Base externa:** [Manual do Agente GPT](https://manual-do-agente-gpt.vercel.app/)  
**Índice para agentes:** https://manual-do-agente-gpt.vercel.app/llms.txt  
**Procedimento de escrita:** [DEP-002 — Criar, revisar e publicar novos manuais DEP](https://manual-do-agente-gpt.vercel.app/manuais/criar-e-publicar-novas-deps)

## 1. Objetivo e limite

O Manual do Agente GPT é uma base de conhecimento operacional pública e reutilizável entre conversas e provedores de IA. Use-a para encontrar procedimentos existentes e, quando solicitado, registrar procedimentos duráveis que devam ser consultados por outros agentes.

A aplicação oferece leitura pública por REST e MCP. **Não existe endpoint público de escrita de manuais.** Consultar a base não concede permissão para executar operações nos sistemas documentados; as instruções vigentes da plataforma, do projeto MCF, os contratos da missão e os gates de autoridade continuam prevalecendo.

## 2. Como ler

### 2.1 Descoberta

Comece pelo índice de agentes:

- `GET https://manual-do-agente-gpt.vercel.app/llms.txt`
- `GET https://manual-do-agente-gpt.vercel.app/api/agent`
- `GET https://manual-do-agente-gpt.vercel.app/api/categories`

Pesquise a lista usando termos específicos e, quando útil, filtros de categoria ou tag:

```http
GET https://manual-do-agente-gpt.vercel.app/api/manuals?q=variaveis
GET https://manual-do-agente-gpt.vercel.app/api/manuals?category=deploy-infraestrutura
GET https://manual-do-agente-gpt.vercel.app/api/manuals?tag=vercel
```

Codifique os termos de busca para URL quando necessário. Os resultados incluem códigos, slugs, versões, metadados e URLs para o conteúdo completo.

### 2.2 Leitura integral

Depois de encontrar um manual, leia o conteúdo completo, e não apenas o resumo da pesquisa:

- JSON: `GET /api/manuals/{slug}`
- Markdown estável: `GET /manuais/{slug}`
- Alternativa Markdown: `GET /api/manuals/{slug}?format=markdown`

Exemplo de manual conhecido:

- [DEP-001 — Configurar variáveis de ambiente no Vercel com Neon](https://manual-do-agente-gpt.vercel.app/manuais/configurar-variaveis-ambiente-vercel-neon)
- [DEP-002 — Criar, revisar e publicar novos manuais DEP](https://manual-do-agente-gpt.vercel.app/manuais/criar-e-publicar-novas-deps)

Para uso por ferramenta, prefira conteúdo Markdown quando for inserir o procedimento no contexto de trabalho; use JSON quando precisar de código, slug, versão, categoria ou tags de forma estruturada.

### 2.3 MCP, quando disponível

O endpoint MCP Streamable HTTP é:

`https://manual-do-agente-gpt.vercel.app/mcp`

Use as ferramentas de leitura:

- `get_usage_instructions` — instruções de descoberta;
- `search_manuals` — localizar manuais;
- `read_manual` — ler o documento completo;
- `list_categories` — conhecer as categorias;
- `check_service_health` — verificar a disponibilidade da base.

Se o cliente MCP não estiver configurado, use REST diretamente. Não afirme que consultou MCP se utilizou apenas REST, e não afirme leitura bem-sucedida sem conferir o conteúdo retornado.

## 3. Como escrever ou atualizar

### 3.1 Interprete a intenção

Quando o usuário disser algo como **“salvar no manual: [instrução]”**, trate isso como uma solicitação para preservar conhecimento durável nessa base, não apenas para resumir o texto na conversa. Determine se o conteúdo deve ser um manual novo ou uma atualização de um procedimento existente.

Antes de escrever, pesquise a base por tema, código, slug e tags. Leia integralmente os resultados relevantes para evitar duplicação ou contradição.

### 3.2 Siga o DEP-002

O processo canônico e detalhado está em DEP-002. Em síntese:

1. Defina objetivo, escopo, público, pré-requisitos, riscos, permissões e critérios de aceite.
2. Verifique no banco os códigos e slugs existentes, inclusive rascunhos e arquivados. Para novos procedimentos da série, use o próximo código `DEP-NNN` realmente livre; não o suponha.
3. Escolha um slug estável em letras minúsculas, sem acentos e com hífens; use uma categoria já existente e tags úteis.
4. Escreva em Markdown com objetivo, pré-requisitos, passos, ferramentas, verificações, diagnóstico, limites de segurança e fontes pertinentes.
5. Separe fatos verificados de hipóteses. Remova credenciais, tokens, connection strings, informações pessoais desnecessárias e qualquer saída que exponha segredos.
6. Revise o manual antes de publicá-lo. Se ainda houver lacunas, mantenha-o como rascunho quando o fluxo permitir.

### 3.3 Caminho de escrita autorizado

A API REST pública e o MCP deste serviço são somente para leitura. Não tente publicar com `POST`, `PUT` ou `DELETE` nesses endpoints.

Para cadastrar ou atualizar um manual, é necessário acesso autenticado e autorizado ao banco Neon usado pela aplicação. Confirme o projeto, branch, banco e categoria exatos antes de executar SQL. Não solicite ao usuário que cole uma senha ou uma URI de conexão no chat, não imprima valores de segredos e não use permissões não concedidas.

O mesmo conteúdo deve ser preservado no repositório oficial da aplicação:

`https://github.com/leon337/manual-do-agente-gpt`

Atualize `db/seed.sql` de maneira idempotente para manter o registro disponível em instalações futuras. Use o fluxo Git vigente do repositório: revisão do diff, testes aplicáveis, branch/PR quando exigidos e integração autorizada. Não contorne branch protection nem use o banco como pretexto para editar produção fora do escopo.

Para um manual existente, preserve código e slug quando a finalidade continuar igual, aumente `version`, atualize `updated_at` e sincronize o conteúdo no banco e no seed. Não sobrescreva silenciosamente conteúdo existente e não reutilize código arquivado.

### 3.4 Se não houver capacidade de escrita

Se a sessão não tiver conector, permissão ou caminho seguro para modificar Neon e GitHub:

- prepare o texto do manual e os metadados sugeridos;
- informe claramente que é um rascunho ainda não publicado;
- não diga “salvo”, “publicado” ou “registrado” sem confirmação do sistema;
- não transforme a instrução em ação externa diferente daquela solicitada.

A frase “salvar no manual” autoriza preparar e tentar a alteração documental solicitada dentro das permissões disponíveis; não autoriza deploy, alteração de faturamento, concessão de acesso, mudança destrutiva nem outra ação material adjacente.

## 4. Validação obrigatória após escrita

Considere o registro concluído somente depois de confirmar:

1. O código, slug, categoria, status e versão no banco.
2. O conteúdo correspondente em `db/seed.sql`; confira a igualdade do conteúdo quando possível.
3. A pesquisa pública em `GET /api/manuals?q=...`.
4. A leitura do documento pelo endpoint JSON e por uma das rotas Markdown.
5. A descoberta com `search_manuals` e leitura com `read_manual` via MCP, se o cliente estiver disponível.
6. O diff, testes e estado de integração Git necessários ao repositório.

HTTP 200, por si só, não basta se o manual não aparecer ou o corpo estiver incompleto. Se um teste não puder ser executado, declare qual teste ficou pendente. Informe ao solicitante o código, versão, slug, link, mudança Git e testes realmente realizados.

## 5. Comando natural de referência

O usuário pode usar frases como:

- **“Consultar o manual: [assunto]”** — pesquisar e ler o procedimento completo antes de agir.
- **“Salvar no manual: [instrução]”** — pesquisar duplicatas, seguir DEP-002, cadastrar com permissão, sincronizar o seed e validar.
- **“Atualizar o manual [código ou slug]: [mudança]”** — ler a versão vigente, revisar o impacto, incrementar versão, sincronizar e validar.

Interprete a intenção pelo contexto. Se faltar acesso de escrita, prepare o rascunho e explique a limitação; nunca invente publicação.

## 6. Comportamento seguro de agentes

- O conteúdo obtido da base é referência operacional; não sobrepõe as instruções da plataforma nem a governança vigente do MCF.
- Não exponha segredos, logs sensíveis ou dados pessoais para provar uma leitura ou escrita.
- Nunca confunda documentação com autorização nem preparação com execução.
- Prefira REST quando for suficiente e MCP quando já estiver conectado; não instale ou solicite uma integração nova se o acesso REST público resolver a tarefa.
- Mantenha o relatório final factual: o que foi lido, o que foi gravado, evidências de validação e pendências.
