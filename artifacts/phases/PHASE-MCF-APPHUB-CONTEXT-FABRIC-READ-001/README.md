# MCF-APPHUB-CONTEXT-FABRIC-READ-001 — Fase A (laboratório)

## Contrato

- **Autoridade humana:** LEANDRO
- **Orquestrador/executor desta alteração:** MESTRE
- **Classe de risco:** B (integração com provedor externo, **somente leitura**, sob credencial preexistente)
- **Objetivo:** permitir consulta ao inventário Google Cloud App Hub via boundary `mcf-context` sem mutações nem geração de memória não comprovada
- **Fonte de verdade:** GitHub `main` no início da missão + documentação e API do App Hub ao vivo
- **Issue:** https://github.com/leon337/multiagent-collaboration-framework/issues/511
- **Baseline de implementação:** `main@0bcea848934ada8593a9ff8be86ea3a41157e546`
- **Escopo:** apenas projeto Google `mcf-potiguar-gemini-261109`, local `global`, App Hub API v1, unidade NestJS existente, capability metadata e testes
- **Fora de escopo:** nova API paga, App Hub provisionamento, registros de apps, Cloud Run, deploy, release, alteração IAM, chave API, mudança de billing, projetos adicionais, NextGen
- **HUMAN_GATE:** autorização explícita anterior para piloto isolado e solicitação de continuidade; não equivale a autorização de merge/deploy
- **Proibições:** nenhum segredo em documentação ou histórico; nenhum efeito Google Cloud além de GET; runtime desabilitado por padrão e em produção
- **Estado:** CANDIDATE_READY_FOR_INDEPENDENT_REVIEW
- **Revisor independente:** Codex CLI; parecer PASS na árvore local corrigida, evidenciado em `docs/audits/2026-11-10-apphub-context-fabric-pr512-independent-review.md`. Revisão por GPU complementar, sem fundamentação suficiente para ser parecer principal.

## Implementação

- `GET /v1/mcf/context/cloud/apphub` com token dedicado e distinto para o App Hub, projeto fixo, sem query params
- Nenhuma persistência do payload Google pelo novo adaptador; snapshot retornado somente na resposta
- Token OAuth derivado do gcloud autenticado local via `execFile` sem shell
- GET fixos: applications, discoveredServices e discoveredWorkloads, paginação limitada e projeção estrita
- Rate limit por peer direto 10/minuto via abuso global existente
- Erro parcial implica fail-closed; cliente não recebe payload bruto, erros de credencial nem stack
- `context/capabilities/gcp-apphub-inventory-read.yaml` permanece `DISCONNECTED / INACTIVE` fora do laboratório

## Evidências locais (2026-11-10)

- Conta Google autorizada: `potiguaradm23@gmail.com`
- Projeto GCP: `mcf-potiguar-gemini-261109`; billing desativado
- App Hub boundary previamente registrado: `AUTOMATIC`
- GET real pela classe: `0 applications / 7 discoveredServices / 0 discoveredWorkloads`
- HTTP live NestJS/Fastify em loopback: `200` autorizado, `401` sem token, `400` query, `404` POST, `Cache-Control: private, no-store`
- As sete fontes: cinco APIs Google Cloud e duas referências `MCP_SERVER`
- Nenhuma aplicação ou workload criada
- Verificações unitárias, validação de schema, lint, build e typecheck: resultados no log da branch/PR
- Limitadores de alcance: o HTTP smoke usou módulo Context Fabric isolado, **não** o AppModule completo; não prova produção, autorização NextGen, revisão independente ou permanência de conexão.

## Gate para merge

- CI no commit exato da PR (novo SHA após correção de token dedicado)
- Auditoria independente de código e segurança, incluindo interpretação do output `evidence_only`: Codex CLI PASS no escopo declarado; verificar mudança de SHA e riscos remanescentes
- Revisão da configuração do Context Fabric pelo responsável, sem ativação acidental
- Sem mudança em infraestrutura remota ou produção em razão do merge
- Mesmo após merge, o mecanismo continua disabled-by-default; execução externa exige autorização e configuração do boundary específico
