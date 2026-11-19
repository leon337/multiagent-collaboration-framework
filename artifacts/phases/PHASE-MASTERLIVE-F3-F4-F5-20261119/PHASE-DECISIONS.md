# Decisões F3/F4/F5

1. MESTRE: F3 implementada em laboratório, sem tocar perfis de navegador operacionais.
2. QA: E2E usa navegação pública e aprovação **negada**; nenhum clique externo posterior foi produzido.
3. Engenharia: F4 usa Tailscale Serve tailnet-only; exposição temporária em porta independente, sem `funnel`.
4. Operação: `systemd --user` + `linger=yes`, reinício testado; reboot total fica pendente.
5. Auditoria: aprovação oral por transcrição não é gate autenticado; é proibido afirmá-la como concluída.
6. MESTRE: F5 documenta conhecimento durável, sem segredos, criando PR em draft, sem merge/deploy.
7. LÉO: gate independente ainda não emitido. LEANDRO permanece autoridade final.
