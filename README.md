# Multiagent Collaboration Framework

Framework experimental para colaboração entre múltiplos agentes de IA com papéis definidos, roteamento por competência, trabalho visível, auditoria, artefatos verificáveis, versionamento e decisão humana.

## Fonte oficial de verdade

Este repositório é a fonte oficial de verdade do projeto. Memória de conversa não substitui decisões, artefatos e evidências versionadas.

## Governança vigente

- **Léo** — autoridade final de decisão.
- **Mestre** — ponte oficial entre Léo e a equipe, orquestração, estado e comunicação final.
- **Leonardo** — produto, requisitos e decomposição.
- **Carlos** — insights, oportunidades e riscos futuros.
- **Evelyn** — coordenação de Design e Experiência.
- **Laura** — UX.
- **Isabela** — UI.
- **Sofia** — arquitetura geral.
- **Manoel** — arquitetura e ciclo de vida dos dados.
- **Gabriel** — implementação, versionamento e publicação autorizada.
- **Carmem** — documentação e contrato de entrega dos artefatos.
- **Emily** — auditoria independente documental e procedimental.

## Fluxo atual

O fluxo não é uma fila fixa. O Mestre seleciona agentes conforme a competência exigida pelo objetivo.

```text
Léo
→ Mestre formaliza o objetivo
→ agentes necessários trabalham de forma visível
→ Carmem consolida os artefatos
→ Gabriel registra versionamento quando houver mudança material
→ Emily audita
→ Mestre entrega o pacote a Léo
→ Léo decide
```

## Regras centrais

- trabalho silencioso é proibido, salvo autorização expressa de Léo;
- agentes selecionados expõem entrada, consulta, achados, análise, decisão, entrega, evidência e passagem;
- toda mensagem produz ou atualiza artefato;
- artefato por mensagem não significa commit por mensagem;
- mensagens simples usam log agregado;
- commits são usados para mudanças materiais;
- nenhuma entrega está concluída antes de ser apresentada a Léo pelo Mestre;
- merge e publicação dependem de autorização explícita.

## Decisões metodológicas

- [`MCF-DEC-001 — Arquitetura de Loop Orientado a Objetivos e Equipe Ampliada`](docs/decisions/MCF-DEC-001-ARQUITETURA-LOOP-E-EQUIPE-AMPLIADA.md)
- [`MCF-DEC-002 — Trabalho Visível por Agente e Artefato por Mensagem`](docs/decisions/MCF-DEC-002-TRABALHO-VISIVEL-E-ARTEFATO-POR-MENSAGEM.md)

## Estado da MCF-DEC-002

A decisão está em revisão no PR #15. Ela não autoriza merge automático, implementação de software ou publicação automática.
