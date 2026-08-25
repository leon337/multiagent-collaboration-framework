# MCF-CONTENT-LAB-001 — Roadmap Cronológico

## Regra de sincronização

Um item só muda para `CONCLUÍDO` depois que:

1. a execução correspondente terminou;
2. existe evidência verificável suficiente;
3. a validação aplicável foi feita;
4. `CHECKLIST.md` foi atualizado no mesmo checkpoint operacional.

Estados possíveis: `PENDENTE`, `EM_EXECUÇÃO`, `BLOQUEADO`, `CONCLUÍDO`.

## R01 — Preparar e governar a missão

**Estado:** `CONCLUÍDO`

Entregas:

- criar branch exclusiva da missão;
- registrar contrato em `MISSAO.md`;
- registrar este `ROADMAP.md`;
- criar `CHECKLIST.md` cronológico;
- verificar os três artefatos na branch;
- atualizar o checklist antes de concluir R01.

Critério de conclusão: branch e artefatos existem, estão legíveis e o checklist registra as evidências e a próxima ação.

**Evidência de fechamento:** branch criada a partir de `main@85ccf418740e78b5e1e3eeb7742baf6f869978c1`; `MISSAO.md`, `ROADMAP.md` e `CHECKLIST.md` criados, relidos diretamente na branch e reconciliados; checklist atualizado antes deste fechamento.

## R02 — Concluir a auditoria integral do vídeo

**Estado:** `PENDENTE`

Entregas:

- consolidar timeline visual;
- obter ou produzir transcrição verificável quando possível;
- separar afirmações visuais e faladas;
- confrontar cada afirmação relevante com a fonte canônica aplicável;
- classificar como correta, simplificada, extrapolada, incorreta ou não comprovada;
- registrar gravidade, correção recomendada e limitações;
- preservar a trilha anterior `MCF-VIDEO-AUDIT-001` como evidência de continuidade.

## R03 — Investigar o processo verificável do Gemini/NotebookLM

**Estado:** `PENDENTE`

Entregas:

- formular perguntas que peçam fontes, seleção de conceitos, simplificações, omissões, incertezas e critérios de organização;
- evitar solicitar ou tratar raciocínio privado como evidência;
- registrar respostas do Gemini como auto-relato do processo, não como prova absoluta;
- comparar o auto-relato com o vídeo e com as fontes realmente disponíveis.

## R04 — Diagnosticar a apresentação atual do MCF

**Estado:** `PENDENTE`

Entregas:

- avaliar clareza para humanos;
- avaliar legibilidade para IAs;
- identificar excesso de jargão, mistura de idiomas, duplicidades e ambiguidades;
- separar termos públicos em português de identificadores técnicos que precisam preservar rastreabilidade;
- propor melhorias sem criar uma segunda fonte de verdade.

## R05 — Executar experimentos repetidos e comparação A/B

**Estado:** `PENDENTE`

Entregas:

- repetir gerações com a documentação atual;
- medir conceitos recorrentes, omissões, invenções e correções humanas necessárias;
- gerar uma versão com documentação/apresentação melhorada em ambiente controlado;
- repetir geração sobre a versão melhorada;
- comparar precisão, clareza, omissões, termos inventados e esforço de correção.

## R06 — Derivar e amadurecer o protocolo de validação de conteúdo

**Estado:** `PENDENTE`

Entregas:

- derivar o protocolo dos achados das etapas anteriores;
- definir entrada, evidência, classificação, gravidade, correção, validação e publicação;
- testar o protocolo contra pelo menos os casos observados nesta missão;
- submeter o protocolo à auditoria antes de tratá-lo como canônico.

## R07 — Projetar o repositório de conhecimento e a fábrica de conteúdo

**Estado:** `PENDENTE`

Entregas:

- definir arquitetura independente do repositório canônico do MCF;
- suportar múltiplos assuntos e múltiplos motores de IA;
- registrar proveniência, autoria, origem, direitos/licença, resumo próprio, afirmações e evidências;
- definir pipeline de conhecimento para roteiro, vídeo, postagem, aula e outros formatos;
- manter português como superfície editorial padrão para o público brasileiro;
- evitar dependência obrigatória de um único serviço gratuito.

## R08 — Desenhar e validar a skill `ALINHAR`

**Estado:** `PENDENTE`

Entregas:

- especificar comando curto e gatilhos;
- devolver entendimento, objetivo percebido, hipóteses, ambiguidades, falhas, refinamentos e próxima ação;
- impedir execução material antes da confirmação quando o modo de alinhamento estiver ativo;
- testar contra exemplos reais desta missão;
- decidir sobre integração ao registro canônico de skills.

## R09 — Desenhar e validar a skill `ESTRUTURAR MISSÃO`

**Estado:** `PENDENTE`

Entregas:

- derivar a skill da execução manual de R01;
- definir critérios para quando criar branch dedicada;
- criar contrato, roadmap e checklist sincronizados;
- exigir evidência antes de conclusão de itens;
- definir comportamento para mudança de escopo e alteração do roadmap;
- testar o invariante `item concluído ⇒ checklist atualizado`;
- decidir sobre integração ao registro canônico de skills.

## R10 — Consolidar resultados e plano de integração

**Estado:** `PENDENTE`

Entregas:

- reconciliar roadmap e checklist;
- consolidar evidências, descobertas e decisões;
- separar o que deve permanecer na branch da missão do que merece integração canônica;
- registrar pendências e riscos residuais;
- preparar decisão de integração/PR conforme os gates aplicáveis;
- encerrar a missão somente quando os critérios de aceite de `MISSAO.md` estiverem satisfeitos.
