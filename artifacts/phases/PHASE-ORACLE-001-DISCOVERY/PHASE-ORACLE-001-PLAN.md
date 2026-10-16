# MCF-ORACLE-001 — P0: plano e boundary

**Missão:** #443 · **PR:** #444 · **Classe:** C (alteração futura de hierarquia); fase P0 limitada à descoberta, instalação local do Codex CLI e testes isolados no GitHub Actions.

## Objetivo da fase
Comprovar execução de código **real** do MCF e oito workers de sistema operacional no runner GitHub, com rastro de MissionRuntimeService e recibos duráveis em PostgreSQL efêmero. Não confundir execução determinística de processos com cognição independente do ORÁCULO.

## Permitido
- Leitura do código e dos contratos oficiais; ações reversíveis em branch de teste/PR draft.
- Instalação do pacote oficial Codex CLI no prefixo de usuário do Linux Mint.
- Testes em GitHub Actions dentro de cotas permitidas; Postgres 16 descartável e credenciais **somente de teste**.
- Correções mínimas em branch necessárias para o próprio runtime compilar e carregar a registry.

## Proibido
- OpenAI API comercial, fallback pago, novas despesas, exposição/extração de secrets e contorno de login.
- Alteração constitucional de autoridade, publicação, merge main, deploy e mutação de produção.
- Alegar Oracle cognitivo ativo, autenticação no Codex, persistência em banco produtivo, ou auditoria independente sem receipt.

## Fonte de verdade
`docs/MCF-CURRENT-STATE.md`, `docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md`, `skills/registry.yaml`, código `apps/rede-social-agentes/apps/server/src/mcf-runtime/` no commit exato; resultados live do GitHub Actions no PR #444.

## Gate
P0 é fase read-only/test e não concede autorização de P1/P2 material. LEANDRO mantém aprovar/rejeitar a revisão exata para mudar hierarquia ORÁCULO/MESTRE. LÉO mantém gates internos. Continuar autonomamente apenas dentro desse boundary.
