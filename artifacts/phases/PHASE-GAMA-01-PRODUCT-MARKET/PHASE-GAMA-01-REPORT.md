# PHASE-GAMA-01 — Product & Market Report

## Executor
`MESTRE`.
Nenhum agente especialista nomeado é creditado nesta fase sem execução independente verificável.

## Problem statement
Empresas estão colocando agentes de IA em fluxos reais — inclusive desenvolvimento de software — mais rápido do que conseguem estabelecer identidade, permissões, supervisão, continuidade, recuperação e auditoria consistentes.

O problema que o MCF pretende resolver não é "como criar um agente". É:
> como permitir que múltiplos agentes e modelos executem trabalho material com autoridade explícita, contexto recuperável, gates humanos e evidência verificável sem transformar autonomia em perda de controle.

## Evidência de mercado
### Adoção cresce
- McKinsey 2026: 40% dos respondentes de grandes organizações relatam escalar agentes de IA; cerca de dois em dez já escalam coding agents, chegando a 31% nas grandes empresas.
- LangChain 2026: 57% de mais de 1.300 profissionais pesquisados já têm agentes em produção; qualidade aparece como principal barreira para 32%.

### Governança não acompanha
- Deloitte 2026: apenas 21% das organizações pesquisadas dizem ter governança madura para agentic AI; o relatório destaca fronteiras de decisão, monitoramento e audit trails como lacunas centrais.
- OneTrust 2026: 87% das organizações pesquisadas incentivam uso de agentes, mas apenas 47% dizem ter governança, supervisão e controles claros.
- PwC 2026: recomenda identidade verificada por agente, papéis definidos, permissões específicas por tarefa, registros auditáveis e aumento de supervisão humana conforme o risco/autonomia cresce.

## ICP primário
**Empresas AI-native e times de engenharia/plataforma que já usam múltiplos agentes/modelos para executar tarefas reais em software delivery.**

Características:
- múltiplos modelos ou provedores;
- agentes com acesso a GitHub, CI/CD, cloud, bancos ou ferramentas internas;
- workflows longos ou multi-etapa;
- necessidade de human-in-the-loop em ações materiais;
- dificuldade de reconstruir quem fez o quê e com qual autoridade;
- necessidade de trocar modelo/provider sem perder governança.

### Buyer primário
- CTO;
- VP/Head of Engineering;
- Head of AI Platform / Agent Platform;
- Platform Engineering lead.

### Trigger de compra
- primeiro incidente causado por agente;
- aumento do número de agentes/provedores;
- liberação de write access para agentes;
- necessidade de auditoria/compliance;
- passagem de POC para produção;
- perda de contexto/estado em workflows longos.

## ICP secundário
Empresas reguladas com agentes em software engineering, operações internas ou processos com ações materiais.

Observação: ICP secundário tende a ter ciclo de venda mais longo; não deve ser o wedge inicial da candidatura.

## Wedge inicial recomendado
### Governed Autonomous Software Delivery
MCF como camada de controle para equipes de agentes que:
1. recebem uma missão de engenharia;
2. planejam;
3. implementam;
4. testam;
5. revisam;
6. pedem HUMAN_GATE quando necessário;
7. executam ação autorizada;
8. produzem receipts/evidência;
9. preservam contexto para retomada.

Esse wedge encaixa diretamente em `Future of Software Development` e aproveita capacidades já materializadas no MCF.

## Posicionamento candidato
> **MCF is a governed runtime and control plane for multi-agent AI systems, designed to make agent execution attributable, recoverable and human-controlled across models and tools.**

Versão curta:
> **Control, evidence and continuity for AI agent teams.**

## O que NÃO usar como diferenciação principal
- "tem vários agentes";
- "tem human-in-the-loop";
- "é multi-model";
- "tem observabilidade";
- "tem workflow durável".

Esses recursos já aparecem em concorrentes relevantes.

## Hipótese de diferenciação
Ainda não é moat provado. A hipótese a validar é a combinação:
- authenticated human authority;
- permission-bound execution;
- evidence-before-success semantics;
- receipts/event ledger;
- fail-closed claims;
- continuity entre agentes/provedores/superfícies;
- provider independence;
- recuperação governada após falha.

## Concorrência
### CrewAI — risco competitivo ALTO
Já oferece build/runtime, governança, RBAC, audit trail, HITL, observabilidade e multi-LLM. É o concorrente conceitualmente mais próximo nesta análise.

### LangGraph / LangChain — risco ALTO
Durable runtime, persistence, HITL, agent workflows e ampla integração.

### Microsoft Agent Framework — risco ALTO
Agents + workflows + memory + telemetry + HITL + long-running execution dentro de ecossistema enterprise forte.

### Temporal — risco ADJACENTE
Não é um agent control plane equivalente, mas resolve durable execution/recovery de forma madura e pode ser base para concorrentes internos.

## Hipótese de produto/negócio
Open-source runtime/core + camada comercial de control plane, governança multi-team, policy, enterprise connectors, evidence/audit surfaces e managed deployment.

Estado: `HYPOTHESIS_ONLY` — pricing, willingness-to-pay e packaging ainda precisam ser validados.

## Riscos
1. categoria muito competitiva;
2. features do MCF podem ser absorvidas por frameworks maiores;
3. engenharia pode estar à frente da demanda externa validada;
4. falta de pilotos externos reduz força do pitch;
5. posicionamento excessivamente técnico pode esconder valor de negócio.

## Decisão G1
`PASS_WITH_OPEN_MARKET_VALIDATION_GAP`

Tese, ICP e problema estão definidos o suficiente para avançar ao G2.
Tração/pilotos continuam reservados para G5 e não foram fabricados nesta fase.
