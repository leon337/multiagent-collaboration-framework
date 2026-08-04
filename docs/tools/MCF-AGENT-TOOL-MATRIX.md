# Matriz Agente × Skill × Ferramenta — MCF

**Versão:** 1.0  
**Origem:** MCF-DEC-052  
**Estado:** ativo

## 1. Regra de uso

A matriz define ferramentas preferenciais, alternativas, perfil de permissão e evidência mínima. Ela não concede permissão por si só. A ferramenta precisa estar disponível, conectada e autorizada no contexto da missão.

## 2. Governança e coordenação

| Agente | Skills principais | Ferramentas primárias | Alternativas | Permissão | Evidência mínima |
|---|---|---|---|---|---|
| Léo | `MCF-SELECT-AGENTS`, gates | Notion, GitHub, Linear | Google Drive | READ_AND_PROPOSE / SCOPED_WRITE no gate | decisão, justificativa, próximo estado |
| Mestre | `MCF-START-MISSION`, `MCF-SELECT-AGENTS` | Notion, Linear, GitHub | Google Drive | READ_AND_PROPOSE | contrato, seleção, handoff |
| Leonardo | `MCF-DEFINE-PRODUCT` | Notion, Linear, Product Design | PostHog, Amplitude, Consensus | READ_AND_PROPOSE | problema, requisitos, aceite |
| Carlos | `MCF-DEFINE-PRODUCT` | Consensus, Sider Scholar, Notion | PostHog, Amplitude | READ_ONLY | hipóteses, fontes, riscos futuros |

## 3. Design e experiência

| Agente | Skills principais | Ferramentas primárias | Alternativas | Permissão | Evidência mínima |
|---|---|---|---|---|---|
| Evelyn | `MCF-DESIGN-EXPERIENCE` | Product Design, Figma | Canva, Notion | READ_AND_PROPOSE | direção de experiência, referência visual |
| Laura | `MCF-DESIGN-EXPERIENCE` | Figma, Product Design | Mermaid Chart | READ_AND_PROPOSE | jornada, fluxo, estados |
| Isabela | `MCF-DESIGN-EXPERIENCE` | Figma, Canva | Product Design | READ_AND_PROPOSE | telas, componentes, estados visuais |
| Marina | `MCF-DESIGN-EXPERIENCE` | Figma, Product Design | Documents, Notion | READ_AND_PROPOSE | barreiras, critérios WCAG, recomendações |

## 4. Arquitetura, engenharia e dados

| Agente | Skills principais | Ferramentas primárias | Alternativas | Permissão | Evidência mínima |
|---|---|---|---|---|---|
| Sofia | `MCF-DESIGN-ARCHITECTURE` | Mermaid Chart, GitHub, Notion | Figma, MCP Precheck | READ_AND_PROPOSE | diagrama, decisões e riscos |
| Rafael | `MCF-DESIGN-ARCHITECTURE`, `MCF-IMPLEMENT-CHANGE` | GitHub, Linear, Superpowers | OpenAI Developers, Figma | SCOPED_WRITE | branch, arquivos, commit, testes |
| Manoel | banco e persistência | Supabase, Neon Postgres | GitHub, Spreadsheets | SENSITIVE_CONTROLLED | esquema, migração, backup, resultado |
| Renato | `MCF-RUN-TESTS` | GitHub, Sentry | PostHog, Vercel, Render | SCOPED_WRITE | comandos, workflow, pass/fail, logs |
| Bruno | `MCF-DEPLOY-VALIDATE`, incidente | Vercel, Render, Cloudflare, Sentry | Supabase, Neon Postgres, GitHub | SCOPED_WRITE | deploy ID, ambiente, smoke, rollback |
| Ricardo | `MCF-SECURITY-REVIEW` | Codex Security, MCP Precheck, GitHub | AccessOwl, Neura Relay MCP, PrivacyHawk | SENSITIVE_CONTROLLED | ameaça, vulnerabilidade, controle, risco residual |
| Gabriel | `MCF-GIT-PR-RELEASE` | GitHub | Linear, Vercel | SCOPED_WRITE | branch, SHA, PR, CI, merge/release |
| Carmem | `MCF-CLOSE-PHASE` | Documents, GitHub, Notion | PDF, Google Drive, Spreadsheets | SCOPED_WRITE documental | arquivos, versão, manifesto, índice |
| Emily | auditoria e `MCF-CLOSE-PHASE` | GitHub, Notion, Google Drive | Codex Security, Sentry, Linear | READ_ONLY / escrita em parecer | evidências examinadas, achados, veredito |

## 5. Especialistas por demanda

| Agente | Skills principais | Ferramentas primárias | Alternativas | Permissão | Evidência mínima |
|---|---|---|---|---|---|
| Eduardo | `MCF-IMPLEMENT-CHANGE` Backend | GitHub, Supabase, Neon Postgres | Render, OpenAI Developers | SCOPED_WRITE | contrato API, commit, testes |
| Helena | `MCF-IMPLEMENT-CHANGE` Frontend | GitHub, Figma, Vercel | Product Design, PostHog, Sentry | SCOPED_WRITE | tela, commit, build, comportamento |
| André | `MCF-IMPLEMENT-CHANGE` Mobile | GitHub, Figma, Sentry | Product Design, PostHog | SCOPED_WRITE | plataforma, build/teste, evidência do dispositivo |
| Tiago | IA/ML e `MCF-EVALUATE-AGENTS` | OpenAI Developers, GitHub, Consensus | Sider Scholar, Notion, PostHog | SCOPED_WRITE controlado | modelo/configuração, avaliação, fallback |
| Daniela | dados e analytics | Data Analytics, Supabase, Neon Postgres | PostHog, Amplitude, Spreadsheets | SENSITIVE_CONTROLLED | origem, transformação, qualidade, resultado |

## 6. Qualidade contínua

| Agente | Skills principais | Ferramentas primárias | Alternativas | Permissão | Evidência mínima |
|---|---|---|---|---|---|
| Vinícius | `MCF-REVIEW-CODE` | GitHub, Codex Security | Superpowers | READ_AND_PROPOSE | arquivo/linha, severidade, correção |
| Patrícia | `MCF-DEBUG-INCIDENT` | Sentry, GitHub | PostHog, Amplitude | SCOPED_WRITE | reprodução, log, causa raiz, recuperação |
| Lucas | performance e manutenção | Sentry, PostHog, GitHub | Amplitude, Data Analytics | READ_AND_PROPOSE | benchmark, gargalo, orçamento, recomendação |

## 7. Controle multiagente

| Agente | Skills principais | Ferramentas primárias | Alternativas | Permissão | Evidência mínima |
|---|---|---|---|---|---|
| Augusto | `MCF-TRACE-MISSION` | PostHog, Sentry, GitHub, Linear | Amplitude, Notion | READ_ONLY | timeline, handoffs, falhas, recuperação |
| Beatriz | `MCF-EVALUATE-AGENTS` | PostHog, Amplitude, GitHub | Notion, Consensus, Sider Scholar | READ_ONLY | cenários, baseline, scorecard, regressões |
| Miriam | `MCF-RECOVER-CONTEXT` | GitHub, Notion, Google Drive | Granola, Fireflies, MeetGeek, Gmail | READ_ONLY | fontes, proveniência, precedência, lacunas |
| Júlia | `MCF-SECURITY-REVIEW` e governança | AccessOwl, Neura Relay MCP, Notion | Codex Security, MCP Precheck, PrivacyHawk | SENSITIVE_CONTROLLED | permissões, responsabilidade, controles, veredito |

## 8. Ferramentas compartilhadas por domínio

### Reuniões e contexto

```yaml
primary: Granola
alternatives: [Fireflies, MeetGeek]
rule: usar somente uma por reunião, salvo comparação autorizada
```

### Analytics de produto

```yaml
primary: PostHog
alternatives: [Amplitude, Mixpanel]
rule: não duplicar instrumentação sem hipótese de comparação
```

### Pesquisa acadêmica

```yaml
primary: Consensus
alternatives: [Sider_Scholar]
rule: preservar referências e distinguir evidência de inferência
```

### Diagramas

```yaml
primary: Mermaid_Chart
alternatives: [Figma, Canva]
rule: escolher Mermaid para arquitetura e fluxo; Figma/Canva para comunicação visual
```

### Bancos e persistência

```yaml
transactional_primary: Supabase
postgres_specialized: Neon_Postgres
rule: não usar ambos como fonte principal sem decisão arquitetural
```

### Deploy

```yaml
frontend_primary: Vercel
backend_primary: Render
edge_and_dns: Cloudflare
database: Supabase_or_Neon
```

## 9. Ferramentas proibidas por ausência de contexto

O agente não pode usar automaticamente:

- Gmail para enviar mensagens;
- Google Calendar para alterar eventos;
- banco de dados para escrita destrutiva;
- Vercel ou Render para produção pública;
- GitHub para merge irreversível fora do gate;
- PrivacyHawk para exclusões;
- AccessOwl para concessão de acesso;
- Neura Relay MCP para decisões não compreendidas;
- qualquer plugin financeiro sem finalidade e autorização explícitas.

## 10. Fallback obrigatório

Quando a ferramenta primária estiver indisponível:

1. verificar alternativa da matriz;
2. preservar o mesmo perfil de permissão;
3. registrar a substituição;
4. se nenhuma alternativa existir, produzir artefato local ou plano verificável;
5. não declarar que a ação externa foi executada;
6. retornar ao fluxo por checkpoint.
