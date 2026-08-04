# Multiagent Collaboration Framework

Framework experimental para colaboração entre múltiplos agentes de IA com papéis definidos, seleção por competência, trabalho visível, loop orientado a objetivo, passagem de bastão contínua, auditoria, versionamento e decisão humana delegada.

## Governança

- **Leandro** é a autoridade humana final e não entra na contagem dos agentes.
- **Léo** é a autoridade delegada de continuidade operacional e gates internos.
- **Mestre** coordena a equipe, mantém o mapa da missão e apresenta o fluxo completo.
- Existem **29 agentes nomeados**, selecionados dinamicamente por competência.

## Regras operacionais centrais

- trabalho silencioso de agentes é proibido;
- cada agente selecionado deve apresentar ação, evidência, análise, decisão, entrega e passagem;
- agentes sem entrega real não podem ser listados como participantes;
- toda missão operacional trabalha em loop orientado a objetivo;
- passagens internas devem manter destinatário, estado, entrega, próxima ação e critério de conclusão;
- o fluxo deve continuar em uma única resposta sempre que tecnicamente possível;
- confirmações humanas rotineiras são proibidas dentro do escopo já autorizado;
- Léo decide gates internos e escala para Leandro somente matérias reservadas;
- falhas recuperáveis seguem o Protocolo CAF e não encerram a missão.

## Quatro agentes de controle multiagente

- **Augusto** — Observabilidade Multiagente;
- **Beatriz** — Avaliação de Agentes;
- **Miriam** — Memória e Gestão do Conhecimento;
- **Júlia** — Governança e Compliance de IA.

## Documentos principais

- `docs/decisions/MCF-DEC-050-QUATRO-AGENTES-DE-CONTROLE-E-PADRAO-OPERACIONAL-UNIFICADO.md`;
- `docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md`;
- `docs/matrices/MCF-MATRIZ-CONSOLIDADA-DE-COMPETENCIAS-29-AGENTES.md`;
- `docs/decisions/MCF-DEC-016-FLUXO-RESILIENTE-E-CONTINUIDADE-AUTOMATICA.md`;
- `docs/decisions/MCF-DEC-017-DELEGACAO-DE-GATES-INTERNOS-AO-AGENTE-LEO.md`.

## Rede Social para Agentes de IA

As mensagens relevantes da construção formam um corpus histórico e conteúdo-semente para publicação futura na própria rede social.

Os registros ficam em `docs/social-seed/`.

Registrar não significa publicar automaticamente. Todo conteúdo passa por classificação, revisão, privacidade e aprovação.

## Estado

A metodologia oficial publicada anteriormente possuía 25 agentes. A MCF-DEC-050 amplia a composição para 29 agentes e consolida o padrão operacional unificado em branch e pull request próprios.
