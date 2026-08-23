# Matriz Agente × Skill × Ferramenta — MCF

**Versão:** 2.0  
**Origem:** MCF-DEC-052 + MCF-DEC-053  
**Estado:** ativo

## 1. Regra de uso

A matriz define ferramentas preferenciais, alternativas, perfil de permissão e evidência mínima. Ela não concede permissão por si só. A ferramenta precisa estar disponível, conectada e autorizada no contexto da missão.

Skills com `runtime_status: DOCUMENTAL_ONLY` no registry são contratos documentais: ferramenta listada não torna a skill executável.

## 2. Governança e coordenação

| Agente | Skills principais | Ferramentas primárias | Alternativas | Permissão | Evidência mínima |
|---|---|---|---|---|---|
| Léo | `MCF-SELECT-AGENTS`, gates | Notion, GitHub, Linear | Google Drive | READ_AND_PROPOSE / SCOPED_WRITE no gate | decisão, justificativa, próximo estado |
| Mestre | `MCF-START-MISSION`, `MCF-SELECT-AGENTS` | Notion, Linear, GitHub | Google Drive | READ_AND_PROPOSE | contrato, seleção, handoff |
| Leonardo | `MCF-DEFINE-PRODUCT` | Notion, Linear, Product Design | PostHog, Amplitude, Consensus | READ_AND_PROPOSE | problema, requisitos, aceite |
| Carlos | `MCF-DEFINE-PRODUCT` | Consensus, Sider Scholar, Notion | PostHog, Amplitude | READ_ONLY | hipóteses, fontes, riscos futuros |

## 3. Design & Experience Engineering

| Agente | Skills principais | Ferramentas primárias | Alternativas | Permissão | Evidência mínima |
|---|---|---|---|---|---|
| Evelyn | `MCF-DESIGN-EXPERIENCE` | Figma, Product Design | Canva, Notion | READ_AND_PROPOSE | seleção de especialistas, direção integrada, referência |
| Laura | `MCF-DESIGN-EXPERIENCE` | Figma, Product Design | Mermaid Chart | READ_AND_PROPOSE | jornada, fluxo, estados |
| Isabela | `MCF-DESIGN-EXPERIENCE` | Figma, Canva | Product Design | READ_AND_PROPOSE | telas, componentes, estados visuais |
| Marina | `MCF-DESIGN-EXPERIENCE` | Figma, Product Design | Documents, Notion | READ_AND_PROPOSE | barreiras, critérios WCAG, recomendações |
| Gabriela | `MCF-DESIGN-SPECIALIST` | Figma, Notion, PostHog | Amplitude, Google Drive | READ_AND_PROPOSE | método, fontes, achados, limitações |
| Renata | `MCF-DESIGN-SPECIALIST` | Figma, Canva, Notion | Product Design | READ_AND_PROPOSE | posicionamento, identidade, decisões |
| Artur | `MCF-DESIGN-SPECIALIST` | Figma, Canva | Product Design, Mobbin | READ_AND_PROPOSE | referências, direção de arte, critérios |
| Davi | `MCF-DESIGN-SYSTEM` | Figma, GitHub, Notion | Product Design | READ_AND_PROPOSE | inventário, tokens, contratos de componente |
| Melissa | `MCF-DESIGN-SPECIALIST` | Figma, Canva | Product Design | READ_AND_PROPOSE | estados, timings, protótipo, reduced-motion |
| Natália | `MCF-DESIGN-SPECIALIST` | Figma, Notion | Documents, Canva | READ_AND_PROPOSE | copy deck, glossário, estados cobertos |
| Felipe | `MCF-DESIGN-SPECIALIST`, `MCF-DESIGN-SYSTEM` | Figma, GitHub | Product Design, Vercel | READ_AND_PROPOSE; produção exige skill própria | protótipo, gaps, viabilidade |
| Camila | `MCF-DESIGN-SPECIALIST`, `MCF-DESIGN-SYSTEM` | Figma, GitHub | Vercel, Product Design | READ_AND_PROPOSE | screenshots, viewport, divergências, veredito |

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
| Eduardo | `MCF-IMPLEMENT-CHANGE` Backend | GitHub, Supabase, Neon Postgres | Render, OpenAI Developers | SCOPED_WRITE | contrato API, commit, testes |
| Helena | `MCF-IMPLEMENT-CHANGE` Frontend | GitHub, Figma, Vercel | Product Design, PostHog, Sentry | SCOPED_WRITE | tela, commit, build, comportamento |
| André | `MCF-IMPLEMENT-CHANGE` Mobile | GitHub, Figma, Sentry | Product Design, PostHog | SCOPED_WRITE | plataforma, build/teste, evidência do dispositivo |
| Tiago | liderança AI & Model Systems; `MCF-EVALUATE-AGENTS` | GitHub, Consensus, Notion | Sider Scholar, PostHog | READ_AND_PROPOSE / SCOPED_WRITE quando autorizado | seleção de especialistas, decisão técnica, fallback |
| Daniela | dados e analytics | Data Analytics, Supabase, Neon Postgres | PostHog, Amplitude, Spreadsheets | SENSITIVE_CONTROLLED | origem, transformação, qualidade, resultado |

## 5. Qualidade contínua

| Agente | Skills principais | Ferramentas primárias | Alternativas | Permissão | Evidência mínima |
|---|---|---|---|---|---|
| Vinícius | `MCF-REVIEW-CODE` | GitHub, Codex Security | Superpowers | READ_AND_PROPOSE | arquivo/linha, severidade, correção |
| Patrícia | `MCF-DEBUG-INCIDENT` | Sentry, GitHub | PostHog, Amplitude | SCOPED_WRITE | reprodução, log, causa raiz, recuperação |
| Lucas | performance e manutenção | Sentry, PostHog, GitHub | Amplitude, Data Analytics | READ_AND_PROPOSE | benchmark, gargalo, orçamento, recomendação |

## 6. Controle multiagente

| Agente | Skills principais | Ferramentas primárias | Alternativas | Permissão | Evidência mínima |
|---|---|---|---|---|---|
| Augusto | `MCF-TRACE-MISSION` | PostHog, Sentry, GitHub, Linear | Amplitude, Notion | READ_ONLY | timeline, handoffs, falhas, recuperação |
| Beatriz | `MCF-EVALUATE-AGENTS` | PostHog, Amplitude, GitHub | Notion, Consensus, Sider Scholar | READ_ONLY | cenários, baseline, scorecard, regressões |
| Miriam | `MCF-RECOVER-CONTEXT` | GitHub, Notion, Google Drive | Granola, Fireflies, MeetGeek, Gmail | READ_ONLY | fontes, proveniência, precedência, lacunas |
| Júlia | `MCF-SECURITY-REVIEW` e governança | AccessOwl, Neura Relay MCP, Notion | Codex Security, MCP Precheck, PrivacyHawk | SENSITIVE_CONTROLLED | permissões, responsabilidade, controles, veredito |

## 7. AI & Model Systems

| Agente | Skills principais | Ferramentas primárias | Alternativas | Permissão | Evidência mínima |
|---|---|---|---|---|---|
| Akira | `MCF-RADAR-MODELS` | Exa, GitHub | Consensus, Sider Scholar | READ_ONLY | fonte, data, model ID, licença/termos, status |
| Samuel | `MCF-RADAR-MODELS` | Exa, GitHub | Sider Scholar, Notion | READ_ONLY | janela, release/changelog, data, impacto |
| Aline | `MCF-DISCOVER-FREE-API` | Exa, GitHub | Notion | READ_ONLY | endpoint, quota, expiração, termos, verified_at |
| Igor | `MCF-ROUTE-MODELS` | GitHub | Notion, OpenAI Developers | READ_AND_PROPOSE | routing map, fallback, versão, riscos |
| Vitor | `MCF-ROUTE-MODELS` | GitHub, OpenAI Developers | Notion | READ_AND_PROPOSE | matriz de protocolo, request/response, perdas |
| Caio | `MCF-EVALUATE-MODEL` | GitHub | Consensus, Sider Scholar | READ_ONLY | workload, modelo/versão, diff/testes, falhas |
| Naomi | `MCF-EVALUATE-MODEL` | GitHub, Figma | Sider Scholar, Product Design | READ_ONLY | modalidade, input, resultado, policy conhecida |
| Hugo | `MCF-EVALUATE-MODEL` | GitHub | Render, Neon Postgres | READ_ONLY; mutação exige Bruno | runtime, hardware, quantização, benchmark |
| Pedro | `MCF-EVALUATE-MODEL` | GitHub | Notion | READ_ONLY; execução externa requer boundary | harness/version, configuração, trace, resultado |
| Raquel | `MCF-EVALUATE-MODEL` | GitHub, PostHog | Amplitude, Consensus | READ_ONLY | suíte, versões, scores, variância, falhas |
| Andréia | `MCF-ROUTE-MODELS`, `MCF-EVALUATE-MODEL` | PostHog, GitHub | Amplitude, Spreadsheets | READ_ONLY | tokens, cache, quota, latência, custo e hipóteses |
| Sérgio | `MCF-ROUTE-MODELS` | GitHub, OpenAI Developers | Notion | READ_AND_PROPOSE | provider/version, adapter, health, deprecação |

## 8. Ferramentas compartilhadas por domínio

### Pesquisa de fronteira de IA

```yaml
primary: Exa
alternatives: [GitHub, Consensus, Sider_Scholar]
rule: preferir fonte primária; registrar data, versão e status de verificação
```

### Design

```yaml
primary: Figma
alternatives: [Product_Design, Canva, Mobbin]
rule: ferramenta não substitui contrato de especialidade; preservar design-to-code evidence
```

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

## 9. Fallback obrigatório

Quando a ferramenta primária estiver indisponível:

1. verificar alternativa da matriz;
2. preservar o mesmo perfil de permissão;
3. registrar a substituição;
4. se nenhuma alternativa existir, produzir artefato local ou plano verificável;
5. não declarar que a ação externa foi executada;
6. retornar ao fluxo por checkpoint.
