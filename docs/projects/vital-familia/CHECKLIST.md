# Vital Família — checklist MCF

Complemento ao roadmap de produto existente `docs/ROADMAP.md`. Missão MCF-VITAL-FAMILIA-001; projeto [#2](https://github.com/leon337/vital-familia-pwa/issues/2), MCF #477. Marcações refletem apenas os fatos fornecidos; estados operacionais exigem consulta ao vivo.

Fontes originais: [ROADMAP](https://github.com/leon337/vital-familia-pwa/blob/main/docs/ROADMAP.md), [README](https://github.com/leon337/vital-familia-pwa/blob/main/README.md) e [CI_CD](https://github.com/leon337/vital-familia-pwa/blob/main/docs/CI_CD.md). Histórico F0–F11 separado da nova F02 A0–A9 no [roadmap MCF](ROADMAP.md).

## Evidências e F02

- [x] Registrar aceite A5 browser accepted synthetic ONLY: [run 40583903046](https://github.com/leon337/vital-familia-pwa/actions/runs/40583903046), SHA candidate `95a3724701434a53309470f5f3bbc8288bbd8bba`: 7/7 testes E2E Chromium OCR sintéticos, artifact 91/91 SHA256 OK; [aceitação na issue #2 (comentário ESEV de registro)](https://github.com/leon337/vital-familia-pwa/issues/2), conforme provas fornecidas. Aceite simulado; não conclui A6 ou validação clínica nem comprova testes em dispositivos reais.
- [ ] Revalidar ao vivo [PR #21](https://github.com/leon337/vital-familia-pwa/pull/21), rascunho, e commit `95a3724701434a53309470f5f3bbc8288bbd8bba`.
- [ ] Conferir no GitHub [CI 40583881546](https://github.com/leon337/vital-familia-pwa/actions/runs/40583881546): SUCCESS, 161/161 informados.
- [ ] Conferir no GitHub [backend 40583881575](https://github.com/leon337/vital-familia-pwa/actions/runs/40583881575): SUCCESS informado.
- [ ] Conferir no GitHub [OCR 40583903046](https://github.com/leon337/vital-familia-pwa/actions/runs/40583903046): SUCCESS, 7/7 e 91/91 hashes informados; verificar artefatos e valores dos hashes.
- [ ] Reconciliar A0–A4 e A7–A9 com o roadmap existente e evidências, sem presumir aceite.
- [ ] Resolver DEC-A6-001: qual callback e domínio confiável Google OAuth do staging Neon pode ser autorizado com identidades sintéticas? Registrar decisão e autoridade, sem assumir valores.
- [ ] Executar e aceitar A6 na [issue #22](https://github.com/leon337/vital-familia-pwa/issues/22), após decisão e gate aplicáveis.

## Validações pendentes

- [ ] Confirmar branch operacional por discovery live no produto; `mission.active_branch` permanece `null`, nunca branch documental.
- [ ] Comprovar testes em dispositivos reais; aceite A5 simulado não os substitui.

- [ ] Comprovar autenticação real com Managed Better Auth e Google, usando identidades sintéticas autorizadas.
- [ ] Evidenciar isolamento RLS A/B/C no Neon PostgreSQL.
- [ ] Validar consentimento e revogação.
- [ ] Evidenciar backup e teste de restauração.
- [ ] Validar PWA offline com dados sintéticos.
- [ ] Obter auditoria clínica e aprovação explícita antes de qualquer uso clínico.
- [ ] Confirmar integração e merge do projeto no GitHub; atualmente pendentes.
- [ ] Confirmar registro em `main` MCF após merge dos 4 arquivos do registro, vinculando PR e commit resultantes.

## Gate obrigatório

- [ ] Verificar autoridade por papel: LEANDRO responsável humano; MESTRE somente coordenador; SOFIA arquiteta; RAFAEL engenheiro; RENATO QA; EMILY auditora independente; LEO gate.
- [ ] Vincular cada aceite ao commit, execução e artefatos atuais do GitHub; executar testes somente via GitHub Actions, sem testes locais.
- [ ] Confirmar ausência de PHI, usuários médicos e segredos em dados, logs e artefatos.
- [ ] Confirmar Neon PostgreSQL, Managed Better Auth + Google, Vercel e OCR local; não registrar Supabase como escolha atual.
- [ ] Registrar autorização específica antes de publicação, deploy ou uso clínico; este checklist não concede essas permissões.
- [ ] Manter merge automático desabilitado e obter decisão explícita do gate para integração.
