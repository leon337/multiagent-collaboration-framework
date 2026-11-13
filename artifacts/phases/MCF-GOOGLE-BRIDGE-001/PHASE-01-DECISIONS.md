# Decisoes e gates — MCF-GOOGLE-BRIDGE-001
1. Preferencia por SDK MCP v2 em stdio; transporte HTTP interno separado, apenas loopback e Bearer.
2. Selecionar operações por allowlist fixa; Google nao vira proxy arbitrario de APIs.
3. Evitar qualquer escrita no Google por padrao; Gemini generate requer opt-in especifico no ambiente local.
4. OAuth Desktop PKCE S256 por consentimento, sem senha em prompt, logs ou repositorio.
5. Tokens com AES-256-GCM em arquivos de modo 0600; chave local sob a mesma conta de usuario.
6. Cloud por ADC sem service account JSON no repositorio.
7. Manter a instalacao daemons em local estavel separado da worktree Git.
8. Registrar MCP no Codex; nao inserir adapter privilegiado no runtime MCF sem gate independente.
9. HUMAN_GATE e revisao independente seguem fechados para escrita Google, IAM, billing, publicacoes e producao.
