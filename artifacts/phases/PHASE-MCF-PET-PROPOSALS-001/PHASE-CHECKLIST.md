# Checklist — MCF-PET-PROPOSALS-001

- [x] Conferir PR #533 e fonte oficial de governança MCF.
- [x] Criar worktree/branch isolada sobre PR #533 sem tocar outras missões.
- [x] Modelar READ_AND_PROPOSE e evitar escalada de permissão.
- [x] Implementar armazenamento privado e contrato de proposta não executável.
- [x] Expor revisão no painel autenticado por CSRF/cookie/Origin.
- [x] Exigir confirmação antes de registrar revisão.
- [x] Registrar riscos, reversão, evidências e versionamento.
- [x] Testar HMAC, replay, idempotência e falhas de autorização.
- [x] Testar chamada real de ferramenta via Gemini e resposta em áudio.
- [x] Testar Chrome desktop/mobile sem alteração ao cancelar revisão.
- [x] Validar rollback e instalar somente em serviços locais já existentes.
- [ ] Obter revisão/CI no GitHub PR dependente.
- [ ] Validar o microfone físico e review manual na sessão do usuário.
- [ ] Integrar ao Capability Registry e PermissionEngine mediante gate.
- [ ] Confirmar robustez de solicitações multi-ferramenta longas.
- [x] Resolver dois comentários P2 do Codex: validação de prioridade e paginação.
