# MCF-HARNESS-COMMS-DOC-001 — Plano

Autoridade: LEANDRO (determinação transmitida pelo MESTRE via canal programático DSH).
Executor: Ox (agente DSH, preset `mcf`). Risco: **B** (escrita local reversível);
push de branch e abertura de PR são ações externas **pré-autorizadas explicitamente** pela
determinação de origem. Proibido sem novo gate: merge em `main`, deleção de branches,
CI/CD, deploy, produção, secrets, DNS, releases/tags.

## Objetivo verificável

Oficializar no repositório MCF a especificação do canal programático MESTRE(ChatGPT) ↔ Ox(DSH),
em branch dedicada com PR aberto, reproduzível por futuros chats, sem duplicar/contradizer a
documentação vigente e sem expor credenciais.

## Escopo

1. Reconnaissance do repo (onde a spec vive sem duplicação).
2. Reconstrução do funcionamento real do canal a partir da implementação/API instalada e logs locais.
3. Documento canônico + evidência E2E datada.
4. Cross-links nos índices apropriados.
5. Commit em branch dedicada → push → PR.
6. Relatório final com arquivos, evidências, testes e pendências.

## Fora de escopo

Qualquer mudança fora de documentação necessária (código, CI, infra, tags, releases).

## Fontes de verdade

- Repo oficial `leon337/multiagent-collaboration-framework`, base verificada `85ccf418740e78b5e1e3eeb7742baf6f869978c1`.
- Implementação/API DSH 0.1.1-rc.2 instalada (`@deepseek-ai/dsh-host-apiproxy`, schemas).
- Logs de sessão locais do Harness (eventos versionados por `seq`).

## Critérios de aceite

- [ ] Documento reprodutível sem depender do histórico desta conversa.
- [ ] Fatos técnicos apoiados por fonte primária local/API/log.
- [ ] Nenhuma credencial exposta.
- [ ] Links/estrutura validados.
- [ ] Commit e branch identificáveis; PR aberto (ou bloqueio documentado com causa observada).
- [ ] Estados terminais válidos: ENTREGUE / AGUARDANDO_DEPENDENCIA_EXTERNA / BLOQUEADO_POR_RISCO.
