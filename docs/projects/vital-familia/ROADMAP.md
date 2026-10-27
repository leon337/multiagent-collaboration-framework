# Vital Família — complemento MCF

Este documento complementa o roadmap de produto **existente** `docs/ROADMAP.md` no repositório `leon337/vital-familia-pwa`. Não o substitui nem afirma criar um novo roadmap de produto. Fontes do produto: `README.md`, `docs/ROADMAP.md` e `docs/CI_CD.md`.

Fontes originais: [ROADMAP](https://github.com/leon337/vital-familia-pwa/blob/main/docs/ROADMAP.md), [README](https://github.com/leon337/vital-familia-pwa/blob/main/README.md) e [CI_CD](https://github.com/leon337/vital-familia-pwa/blob/main/docs/CI_CD.md).

Missão MCF-VITAL-FAMILIA-001, risco C, em execução. Projeto: [#2](https://github.com/leon337/vital-familia-pwa/issues/2); MCF: #477; próximo passo F02 A6: [#22](https://github.com/leon337/vital-familia-pwa/issues/22).

## Histórico F0-F11

Registro parcial/histórico dos significados ORIGINAIS conforme Issue MCF #477, fornecidos para esta edição. As marcações preservam os limites históricos, de demo e de código; não comprovam prontidão clínica. Separado do novo fluxo F02 A0–A9: F2 histórica não é F02.

| Fase | Significado original | Estado e limite |
| --- | --- | --- |
| F0 | Canonizar contratos de agentes | [x] |
| F1 | Pesquisar Github/HuggingFace e licenças | [x] |
| F2 | Arquitetura Next.js TS+Supabase histórica | [x] Histórico; SUPERSEDED pela decisão posterior Neon |
| F3 | Scaffold, README, roadmap/checklist, lint/types/build local | [x] Histórico |
| F4 | Migração SQL RLS com teste isolamento A/B/C | [ ] Prova real pendente |
| F5 | Google OAuth PKCE, cuidador e revogação | [ ] Real pendente |
| F6 | Registro glicemia/PA, gráficos CSV PWA | [x] Demo |
| F7 | Gemini geral sem aferições pessoais | [x] Código mas OFF |
| F8 | Testes e revisão fase local | [x] Históricos sem prova real Auth/RLS |
| F9 | Infra isolada/preview/smoke | [ ] Parcialmente Neon/Vercel |
| F10 | Gates e aceite por evidência | [ ] |
| F11 | Publicação somente após critérios | [ ] |

## F02 — A0–A9

| Etapa | Situação documental |
| --- | --- |
| A0 | Escopo e evidências a reconciliar ao vivo |
| A1 | Escopo e evidências a reconciliar ao vivo |
| A2 | Escopo e evidências a reconciliar ao vivo |
| A3 | Escopo e evidências a reconciliar ao vivo |
| A4 | Escopo e evidências a reconciliar ao vivo |
| A5 | Browser accepted synthetic ONLY; provas diretas abaixo |
| A6 | Pendente; issue #22 e decisão DEC-A6-001 |
| A7 | Escopo e dependências a confirmar |
| A8 | Escopo e dependências a confirmar |
| A9 | Escopo e aceite a confirmar |

## Evidências informadas

Registro fornecido, sem consulta ao vivo nesta edição:

- [PR #21](https://github.com/leon337/vital-familia-pwa/pull/21), em rascunho, commit `95a3724701434a53309470f5f3bbc8288bbd8bba`; merge pendente.
- [GitHub CI 40583881546](https://github.com/leon337/vital-familia-pwa/actions/runs/40583881546): SUCCESS, 161/161.
- [Backend 40583881575](https://github.com/leon337/vital-familia-pwa/actions/runs/40583881575): SUCCESS.
- A5: [run 40583903046](https://github.com/leon337/vital-familia-pwa/actions/runs/40583903046), SHA candidate `95a3724701434a53309470f5f3bbc8288bbd8bba`: 7/7 testes E2E Chromium OCR sintéticos, artifact 91/91 SHA256 OK; [aceitação na issue #2 (comentário ESEV de registro)](https://github.com/leon337/vital-familia-pwa/issues/2), conforme provas fornecidas. Valores individuais dos hashes e URL específica do comentário não foram fornecidos; revalidar ao vivo antes do gate.

A5 é aceite de browser simulado, exclusivamente sintético; não comprova testes em dispositivos reais nem conclui A6 ou validação clínica. Sucesso de CI não conclui integração ou aprovação clínica. Revalidar PR, commit, execuções, artefatos e hashes no GitHub antes de cada gate. Testes somente em GitHub Actions.

## Autoridades e limites

LEANDRO é o responsável humano; MESTRE somente coordena; SOFIA responde pela arquitetura, RAFAEL pela engenharia, RENATO por QA, EMILY pela auditoria independente e LEO pelo gate. Confirmar autoridade e escopo de cada aprovação.

Arquitetura registrada: Neon PostgreSQL, Managed Better Auth com Google, Vercel e OCR local. Supabase não é a escolha atual. Sem usuários médicos, PHI, segredos, publicação, deploy ou merge automático. Uso clínico exige auditoria e aprovação próprias, ainda pendentes.

**DEC-A6-001:** decidir qual callback e domínio confiável Google OAuth do staging Neon pode ser autorizado com identidades sintéticas. Não presumir endereço, domínio ou autorização.
