# MCF-GOOGLE-BRIDGE-001 — Readiness de merge e deploy local

## Autorização
- LEANDRO autorizou explicitamente merge e deploy da nova capacidade.
- Escopo técnico deste PR: Google Bridge local no usuário Linux leo, via MCP stdio e serviço HTTP em localhost.
- Não é release do servidor MCF em produção pública nem conector de leitura dentro do dispatcher central. Nenhum recurso do Google é exposto publicamente.

## Revisão técnica adicional (modelo Codex CLI em execução separada)
Revisão independente de código com escopo somente leitura; não equivale a sessão nativa autenticada da agente canônica Emily.

Problemas encontrados antes do merge:
1. P2: saveOauthTokens truncava o arquivo de tokens em gravações concorrentes. Corrigido com gravação 0600 em arquivo temporário de nome aleatório + rename atômico; limpeza de temporário.
2. P2: corpo HTTP montado por chunk.toString('utf8') poderia corromper multibytes entre chunks. Corrigido para acumular buffers com limite em bytes e decodificação única.
3. P2: unidade systemd versionada apontava para worktree descartável. Corrigida para usar a instalação estável em ~/.local/share/mcf-google-bridge.

## Testes adicionais no novo commit
- npm run check: PASS.
- npm test: 14/14 PASS (antes 10/10).
- Gravações/leitura concorrentes de tokens: PASS.
- UTF-8 fragmentado entre chunks: PASS.
- Limite HTTP por bytes: PASS.
- Consistência dos caminhos da unidade systemd: PASS.
- npm audit --omit=dev: 0 vulnerabilidades reportadas.
- Sem arquivos de tokens/segredos versionados.
- Teste real de Gmail, Drive e Calendar após consentimento: HTTP 200 em cada operação; comprovado na Fase 02.

## Critérios de promoção do mesmo SHA
1. CI do GitHub concluído com sucesso para HEAD exato.
2. PR em review, sem blockers conhecidos; merge via GitHub, sem bypass de regras de proteção.
3. Verificar SHA resultante do merge em main.
4. Backup da instalação anterior do serviço local, sem copiar credenciais.
5. Atualizar somente artefatos do executável/dependências para o código versionado aprovado; preservar ~/.config/mcf-google-bridge.
6. Reiniciar systemd de usuário, validar GET /healthz, MCP tools/list e Google Workspace real read-only.
7. Se falha, retornar backup da instalação e reiniciar, registrando efeito.

## Limites preservados
- Sem IAM, alteração de dados Google, envio de Gmail, publicação de apps ou Gemini billable generation por padrão.
- A agente Emily e o gate operacional de LÉO não foram aqui representados como execuções autenticadas.
- Futura integração ao dispatcher central precisará nova fase de autorização, teste e auditoria, não pode ser presumida deste merge.
