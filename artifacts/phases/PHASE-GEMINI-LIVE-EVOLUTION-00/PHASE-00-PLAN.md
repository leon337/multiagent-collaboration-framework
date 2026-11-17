# PHASE-00 — Plano da fase F0

Missão: MCF-GEMINI-LIVE-EVOLUTION-20261116-001
Fase: PHASE-00-BASELINE-AND-PLANNING
Risco: C
Autoridade final: LEANDRO
Orquestrador: MESTRE
Gates: auditoria independente Emily + decisão LÉO; não presumidos.
Issue canônica: https://github.com/leon337/multiagent-collaboration-framework/issues/527
PR de planejamento: https://github.com/leon337/multiagent-collaboration-framework/pull/528

## Objetivo verificável
Reconciliar código, máquina, serviços, catálogo de modelos e credencial sem expô-la; executar baseline reprodutível com mídia sintética; auditar segurança; criar telemetria mínima; implementar sincronizador seguro opt-in; gerar PRF e preparar gate.

## Escopo
F0.1 registro; F0.2 snapshot e commit local; F0.3 matriz real; F0.4 ameaças; F0.5 E2E; F0.6 telemetria; F0.7 sincronizador; F0.8 PRF/QA/auditoria/gate.

## Fora do escopo
Merge, deploy público, mudança de produção, gasto pago novo, clonagem de voz, acesso irrestrito a host, coleta/persistência de dados pessoais, automação de aprovação.

## Estratégia
1. Confirmar Issue/PR/branch GitHub atuais e o alvo local.
2. Criar snapshot com SHA-256 excluindo .private, logs e mídia.
3. Verificar v1beta/models de modelos Live por API com chave lida apenas no backend.
4. Testar com Chrome headless, dispositivos virtuais, transcript/função real 2.5 e setup 3.8/Extended.
5. Auditar HTTP/Origin/CSP/permissões e ameaças futuras.
6. Implementar telemetria sem conteúdo pessoal e sincronizador com dry-run e opt-in.
7. Executar regressão e testes negativos; publicar relatórios expurgados; gerar PRF.
8. Aguardar auditoria Emily e decisão LÉO, sem criar evidência fictícia.

## Aceite
- Evidência reproduzível nos artefatos sanitizados e commit SHA.
- Nenhuma chave, URL com access_token, áudio, imagem, transcrição pessoal ou identificador privado publicado.
- Testes com resultados honestos: dispositivos virtuais NÃO provam hardware real.
- Todos os gaps e gates explícitos, com checkbox não marcado até validação aplicável.
- Fase só ENTREGUE após auditoria independente e gate LÉO.
