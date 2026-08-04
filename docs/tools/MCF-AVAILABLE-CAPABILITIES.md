# Capacidades e Ferramentas Disponíveis — MCF

**Versão:** 1.0  
**Data do inventário:** 4 de agosto de 2026  
**Fonte:** ferramentas expostas no ambiente e capturas fornecidas por Leandro  
**Responsável pela manutenção:** Miriam

## 1. Interpretação do estado

```yaml
OBSERVED_IN_SETTINGS: aparece na área de plugins do usuário
CONNECTED_OR_CONFIGURED: há indicação de permissão ou uso disponível
AVAILABLE_IN_CURRENT_CONTEXT: ferramenta exposta para execução neste contexto
NEEDS_RUNTIME_VERIFICATION: conexão e ações devem ser testadas antes do uso oficial
```

A presença na lista de plugins não comprova, sozinha, autenticação funcional, permissões suficientes ou disponibilidade em todo chat.

## 2. Desenvolvimento, repositório e planejamento

| Ferramenta | Estado observado | Uso principal |
|---|---|---|
| GitHub | CONNECTED_OR_CONFIGURED | repositórios, issues, PRs, CI e releases |
| Linear | CONNECTED_OR_CONFIGURED | backlog, projetos e issues |
| Asana | CONNECTED_OR_CONFIGURED | tarefas e projetos |
| Superpowers | OBSERVED_IN_SETTINGS | metodologia de desenvolvimento para agentes |
| OpenAI Developers | OBSERVED_IN_SETTINGS | documentação e recursos da plataforma OpenAI |
| Codex Security | OBSERVED_IN_SETTINGS | análise de segurança de código |
| Product Design | OBSERVED_IN_SETTINGS | exploração e prototipação de produto |
| Default Templates | OBSERVED_IN_SETTINGS | modelos reutilizáveis |

## 3. Infraestrutura, banco e deploy

| Ferramenta | Estado observado | Uso principal |
|---|---|---|
| Vercel | CONNECTED_OR_CONFIGURED | deploy e operação de aplicações web |
| Render | OBSERVED_IN_SETTINGS | serviços, deploys, logs e bancos |
| Cloudflare | OBSERVED_IN_SETTINGS | edge, DNS, segurança e Workers |
| Supabase | CONNECTED_OR_CONFIGURED | PostgreSQL, autenticação, storage e funções |
| Neon Postgres | CONNECTED_OR_CONFIGURED | PostgreSQL e branches de banco |
| Sentry | OBSERVED_IN_SETTINGS | erros, eventos e diagnóstico |
| MCP Precheck | OBSERVED_IN_SETTINGS | avaliação prévia de servidores MCP |
| Neura Relay MCP | OBSERVED_IN_SETTINGS | revisão de ações propostas e decision receipts |

## 4. Design e artefatos

| Ferramenta | Estado observado | Uso principal |
|---|---|---|
| Figma | OBSERVED_IN_SETTINGS | design, protótipos e design-to-code |
| Canva | OBSERVED_IN_SETTINGS | criação e edição de designs |
| Mermaid Chart | OBSERVED_IN_SETTINGS | diagramas e fluxos |
| Documents | OBSERVED_IN_SETTINGS | documentos editáveis |
| PDF | OBSERVED_IN_SETTINGS | criação e edição de PDF |
| Presentations | OBSERVED_IN_SETTINGS | apresentações |
| Spreadsheets | OBSERVED_IN_SETTINGS | planilhas e análises tabulares |
| AI Voice Generator | OBSERVED_IN_SETTINGS | geração de voz |

## 5. Produto, dados e analytics

| Ferramenta | Estado observado | Uso principal |
|---|---|---|
| PostHog | OBSERVED_IN_SETTINGS | analytics, flags, experimentos e erros |
| Amplitude | OBSERVED_IN_SETTINGS | inteligência e analytics de produto |
| Mixpanel Headless | OBSERVED_IN_SETTINGS | analytics de produto |
| Data Analytics | OBSERVED_IN_SETTINGS | análise de dados e negócio |
| Spreadsheets | OBSERVED_IN_SETTINGS | análise tabular e exportação |

## 6. Pesquisa e conhecimento

| Ferramenta | Estado observado | Uso principal |
|---|---|---|
| Notion | OBSERVED_IN_SETTINGS | documentação, pesquisa e conhecimento |
| Google Drive | CONNECTED_OR_CONFIGURED | Drive, Docs, Sheets e Slides |
| Consensus | OBSERVED_IN_SETTINGS | pesquisa acadêmica |
| Sider Scholar | OBSERVED_IN_SETTINGS | pesquisa e leitura acadêmica |
| Granola | OBSERVED_IN_SETTINGS | contexto de reuniões |
| Fireflies | OBSERVED_IN_SETTINGS | transcrições e análise de reuniões |
| MeetGeek | OBSERVED_IN_SETTINGS | transcrições e contexto de reuniões |

## 7. Comunicação e agenda

| Ferramenta | Estado observado | Uso principal |
|---|---|---|
| Gmail | CONNECTED_OR_CONFIGURED | leitura, rascunhos e envio controlado |
| Google Calendar | CONNECTED_OR_CONFIGURED | eventos e disponibilidade |
| Google Contacts | OBSERVED_IN_SETTINGS | contatos e resolução de destinatários |
| Slack | conexão pendente relatada | comunicação e alertas |

## 8. Segurança, privacidade e acesso

| Ferramenta | Estado observado | Uso principal |
|---|---|---|
| AccessOwl | OBSERVED_IN_SETTINGS | acesso a aplicações organizacionais |
| PrivacyHawk | OBSERVED_IN_SETTINGS | controle e solicitações sobre dados pessoais |
| Codex Security | OBSERVED_IN_SETTINGS | segurança de código |
| MCP Precheck | OBSERVED_IN_SETTINGS | segurança e compatibilidade MCP |
| Neura Relay MCP | OBSERVED_IN_SETTINGS | governança de ações agentivas |

## 9. Plugins de domínio específico observados

Também foram observados plugins como:

- Investment Banking;
- Public Equity Investing;
- Sales.

Eles não integram automaticamente o catálogo oficial do MCF. Devem permanecer fora das skills gerais até existir missão e avaliação específicas.

## 10. Prioridades e substituições

```yaml
meetings:
  primary: Granola
  alternatives: [Fireflies, MeetGeek]

product_analytics:
  primary: PostHog
  alternatives: [Amplitude, Mixpanel_Headless]

academic_research:
  primary: Consensus
  alternatives: [Sider_Scholar]

diagrams:
  primary: Mermaid_Chart
  alternatives: [Figma, Canva]

frontend_deploy:
  primary: Vercel

backend_deploy:
  primary: Render

transactional_database:
  primary: Supabase
  alternative: Neon_Postgres
```

## 11. Testes pendentes

Antes de classificar cada plugin como `APPROVED`, verificar:

- autenticação;
- leitura mínima;
- escrita controlada;
- evidência retornada;
- comportamento em falta de permissão;
- fallback;
- sobreposição;
- disponibilidade em chats novos do projeto.

## 12. Atualização

Este inventário deve ser revisado quando:

- plugin for instalado ou removido;
- permissão mudar;
- novo conector aparecer;
- ferramenta deixar de estar disponível;
- uma skill ganhar nova ferramenta primária;
- auditoria encontrar divergência.
