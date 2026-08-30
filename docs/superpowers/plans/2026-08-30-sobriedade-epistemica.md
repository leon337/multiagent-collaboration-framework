# Sobriedade Epistêmica Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Instituir Sobriedade Epistêmica como invariante global do MCF, proibindo sycophancy e contrarianismo sem evidência e exigindo revisão epistemológica antes de decisões materiais.

**Architecture:** A mudança será normativa e testável. A decisão MCF-DEC-066 define o princípio; as instruções canônicas e o bootstrap do ChatGPT tornam a regra operacional; a matriz e o checklist propagam o requisito a todos os agentes; os testes de bootstrap verificam regressões comportamentais.

**Tech Stack:** Markdown, YAML, instruções de projeto do ChatGPT e governança versionada do MCF.

**Spec:** `docs/decisions/MCF-DEC-066-SOBRIEDADE-EPISTEMICA-E-ANTI-SYCOPHANCY.md`

## Global Constraints

- Leandro permanece autoridade humana final; Léo continua agente separado e autoridade operacional delegada.
- MESTRE coordena e executa a revisão epistemológica final, sem substituir especialistas e auditoria.
- Preferência, autoridade, confiança ou insistência humana não contam como evidência factual.
- A regra não autoriza contrarianismo reflexivo: concordar e discordar exigem suporte proporcional em evidências.
- Falhas materiais devem ser apresentadas cedo, antes de execução custosa, sem omissão para preservar rapport.
- Não expor raciocínio privado; expor evidências, premissas, riscos, alternativas, conclusão e grau de confiança suficientes para auditoria.
- Alterações devem ocorrer na branch isolada `feat/sobriedade-epistemica` e passar por revisão antes de integração.

---

### Task 1: Decisão normativa MCF-DEC-066

**Files:**
- Create: `docs/decisions/MCF-DEC-066-SOBRIEDADE-EPISTEMICA-E-ANTI-SYCOPHANCY.md`

**Interfaces:**
- Consumes: evidência da missão e governança MCF vigente.
- Produces: definição normativa de Sobriedade Epistêmica e critérios de conformidade usados pelos demais arquivos.

- [ ] Registrar a evidência de origem: validação excessiva pode aumentar confiança em trajetórias erradas e atrasar correções.
- [ ] Definir Sobriedade Epistêmica como princípio global e Anti-Sycophancy como proteção subordinada.
- [ ] Definir obrigações para todos os agentes e responsabilidade adicional do MESTRE.
- [ ] Definir proibições: elogio como substituto de avaliação, omissão de crítica material, confiança humana como evidência e contrarianismo sem suporte.
- [ ] Definir testes comportamentais: consistência contrafactual, independência de confiança, crítica material, anti-contrarianismo e revisão por nova evidência.

### Task 2: Propagação canônica e bootstrap ChatGPT

**Files:**
- Modify: `project-instructions/MCF-PROJECT-OPERATING-INSTRUCTIONS.md`
- Modify: `project-instructions/MCF-CHATGPT-PROJECT-INSTRUCTIONS.txt`

**Interfaces:**
- Consumes: MCF-DEC-066.
- Produces: comportamento padrão para missões e novos chats do projeto.

- [ ] Adicionar MCF-DEC-066 ao baseline e às referências obrigatórias.
- [ ] Adicionar seção canônica com fluxo `evidência → premissas → contraevidência → riscos → alternativas → confiança → decisão`.
- [ ] Exigir revisão epistemológica final do MESTRE em decisões materiais.
- [ ] Adicionar bloco compacto de Sobriedade Epistêmica ao bootstrap do ChatGPT.

### Task 3: Propagação para todos os agentes

**Files:**
- Modify: `docs/matrices/MCF-MATRIZ-CONSOLIDADA-DE-COMPETENCIAS-29-AGENTES.md`
- Modify: `project-instructions/MCF-STARTUP-CHECKLIST.yaml`

**Interfaces:**
- Consumes: MCF-DEC-066 e instruções canônicas.
- Produces: invariantes globais de seleção/execução e checklist verificável de startup.

- [ ] Marcar Sobriedade Epistêmica obrigatória para a composição inteira.
- [ ] Proibir sycophancy, contrarianismo sem evidência, confiança humana como evidência e omissão de crítica material.
- [ ] Adicionar controle de startup para evidência, premissas, contraevidência, riscos, alternativas e confiança em decisões materiais.

### Task 4: Testes de regressão comportamental

**Files:**
- Modify: `project-instructions/MCF-CHAT-BOOTSTRAP-TESTS.md`

**Interfaces:**
- Consumes: regras normativas da DEC-066.
- Produces: cenários repetíveis de PASS/FAIL para novos chats.

- [ ] Adicionar T15 para evitar endosso prematuro de decisão apresentada com confiança por Leandro.
- [ ] Adicionar T16 para consistência contrafactual quando a posição declarada do usuário é invertida sem novas evidências.
- [ ] Adicionar T17 para independência entre confiança humana e confiança do agente.
- [ ] Adicionar T18 para impedir omissão de falha material a fim de preservar agradabilidade.
- [ ] Adicionar T19 para impedir contrarianismo sem evidência e exigir revisão quando surgirem evidências melhores.
- [ ] Tornar sycophancy material uma falha crítica sem alterar a soma existente do scorecard.

### Task 5: Verificação e integração

**Files:**
- Review all modified files in branch `feat/sobriedade-epistemica`.

**Interfaces:**
- Consumes: Tasks 1–4.
- Produces: diff auditável e PR pronto para gate de integração.

- [ ] Reabrir os arquivos alterados e verificar coerência de termos e referências.
- [ ] Comparar `main...feat/sobriedade-epistemica` e confirmar que não há mudanças fora do escopo.
- [ ] Abrir PR `feat(governance): instituir Sobriedade Epistêmica no MCF`.
- [ ] Verificar checks disponíveis do PR.
- [ ] Aplicar gate de Léo para integração reversível dentro do escopo já autorizado por Leandro.
- [ ] Não afirmar sincronização automática do campo de Instruções do projeto do ChatGPT sem evidência de mecanismo de sync.
