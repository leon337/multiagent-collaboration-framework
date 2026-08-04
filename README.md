# Multiagent Collaboration Framework

Framework experimental para colaboração entre múltiplos agentes de IA com papéis definidos, seleção por competência, execução sequencial visível, loop orientado a objetivo, passagem de bastão contínua, documentação por fase, auditoria, versionamento e decisão humana delegada.

## Governança

- **Leandro** é a autoridade humana final e não entra na contagem dos agentes.
- **Léo** é a autoridade delegada de continuidade operacional e gates internos.
- **Mestre** coordena a equipe, mantém o mapa da missão e apresenta o fluxo completo.
- Existem **29 agentes nomeados**, selecionados dinamicamente por competência.

## Regras operacionais centrais

- trabalho silencioso de agentes é proibido;
- a execução deve ser apresentada na ordem real em que ocorre;
- cada agente selecionado deve mostrar entrada, ação, evidência, resultado, decisão, entrega e passagem no ponto da atuação;
- uma lista retrospectiva dizendo apenas o que cada agente fez não substitui a execução;
- agentes sem entrega real não podem ser listados como participantes;
- toda missão operacional trabalha em loop orientado a objetivo;
- passagens internas aparecem entre os blocos dos agentes e mantêm checkpoint, destinatário, estado, próxima ação e critério de conclusão;
- falhas e recuperações devem permanecer visíveis e retornar ao fluxo original;
- o fluxo continua em uma única resposta cronológica sempre que tecnicamente possível;
- toda fase Classe B ou C gera pacote documental próprio com plano, relatório, validação, smoke, checkpoint, decisões, manifesto SHA-256 e README;
- confirmações humanas rotineiras são proibidas dentro do escopo já autorizado;
- Léo decide gates internos e escala para Leandro somente matérias reservadas;
- falhas recuperáveis seguem o Protocolo CAF e não encerram a missão.

## Quatro agentes de controle multiagente

- **Augusto** — Observabilidade Multiagente;
- **Beatriz** — Avaliação de Agentes;
- **Miriam** — Memória e Gestão do Conhecimento;
- **Júlia** — Governança e Compliance de IA.

## Documentos principais

- `docs/decisions/MCF-DEC-051-EXECUCAO-SEQUENCIAL-VISIVEL-E-RASTREABILIDADE-POR-FASE.md`;
- `docs/decisions/MCF-DEC-050-QUATRO-AGENTES-DE-CONTROLE-E-PADRAO-OPERACIONAL-UNIFICADO.md`;
- `docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md`;
- `docs/matrices/MCF-MATRIZ-CONSOLIDADA-DE-COMPETENCIAS-29-AGENTES.md`;
- `templates/MCF-UNIFIED-MISSION.yaml`;
- `templates/phase-traceability/`;
- `docs/decisions/MCF-DEC-016-FLUXO-RESILIENTE-E-CONTINUIDADE-AUTOMATICA.md`;
- `docs/decisions/MCF-DEC-017-DELEGACAO-DE-GATES-INTERNOS-AO-AGENTE-LEO.md`.

## Rede Social para Agentes de IA

As mensagens relevantes da construção formam um corpus histórico e conteúdo-semente para publicação futura na própria rede social.

Os registros ficam em `docs/social-seed/`.

Registrar não significa publicar automaticamente. Todo conteúdo passa por classificação, revisão, privacidade e aprovação.

## Estado

A composição oficial possui 29 agentes. A MCF-DEC-051 corrige a interpretação do trabalho visível e torna obrigatórias a execução sequencial exposta, as passagens intercaladas e a rastreabilidade documental por fase.
