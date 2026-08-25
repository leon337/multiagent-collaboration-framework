# MCF-CONTENT-LAB-001 — Checklist Cronológico

## Legenda

- `[ ]` — pendente
- `[~]` — em execução
- `[x]` — concluído com evidência
- `[!]` — bloqueado

## Regra obrigatória

Nenhum item do `ROADMAP.md` é considerado concluído antes da atualização deste checklist no mesmo checkpoint operacional, com:

- estado;
- evidência;
- validação;
- próxima ação.

Se o roadmap mudar, este checklist deve ser atualizado antes da continuidade da missão.

---

## R01 — Preparar e governar a missão

**Estado:** `[x] CONCLUÍDO`

- [x] Release pública vigente consultada: `MCF v1.1.0@5d79f488407c77f7b9f21ecfefb41ddfb3a52aef`.
- [x] `main` live consultado antes da branch: `85ccf418740e78b5e1e3eeb7742baf6f869978c1`.
- [x] Branch exclusiva criada: `mission/mcf-video-gemini-content-lab-20260825`.
- [x] Contrato da missão criado: `MISSAO.md` — commit `5070c583aa0722e5292471d0b0bd1701d6c5737e`.
- [x] Roadmap cronológico criado: `ROADMAP.md` — commit inicial `ef2c1277a8be14e10f8b13c71606987a3cf18523`.
- [x] Checklist cronológico criado: `CHECKLIST.md` — commit inicial `7eb063c54f4536ddebc743099a15953e10c96a4b`.
- [x] `MISSAO.md` relido diretamente na branch e validado como legível/coerente.
- [x] `ROADMAP.md` relido diretamente na branch e validado como legível/coerente.
- [x] `CHECKLIST.md` relido diretamente na branch e validado como legível/coerente.
- [x] Contrato, roadmap e checklist reconciliados sem divergência material identificada neste checkpoint.
- [x] Checklist atualizado antes do fechamento do roadmap — commit `4983488e38b89774fbe78ff375e23917a1312b52`.
- [x] R01 marcado como `CONCLUÍDO` no `ROADMAP.md` — commit `43270d5638858d3f66ab692d2cb9d05381c2d4c1`.
- [x] Fechamento de R01 sincronizado neste checklist.

**Evidência de validação:** leitura direta dos três arquivos na branch após criação e fechamento sequencial checklist → roadmap → checklist.

---

## R02 — Concluir a auditoria integral do vídeo

**Estado:** `[~] EM EXECUÇÃO — DEPENDÊNCIA EXTERNA SOMENTE PARA NARRAÇÃO`

- [x] Auditoria visual preliminar preservada da trilha `MCF-VIDEO-AUDIT-001`.
- [x] Matriz visual e achados consolidados em `analises/R02-AUDITORIA-VISUAL-PRELIMINAR.md` — commit `11f40ab0c91b69a67bbf519376c3b98f6488319a`.
- [x] Correção metodológica registrada: `ESEV` é termo canônico; o achado material está na associação indevida com “recibos físicos para cada ação”.
- [x] Afirmações visuais relevantes confrontadas preliminarmente com a fonte canônica aplicável.
- [x] Limitação de cobertura v1.1.0 registrada como lacuna de completude, não como erro automático do vídeo.
- [!] Transcrição/narração palavra por palavra depende do envio do MP4 no widget do AccurateScribe; o arquivo anexado ao chat não é consumido por esse aplicativo.
- [ ] Obter resultado da transcrição.
- [ ] Extrair afirmações faladas relevantes.
- [ ] Confrontar as afirmações faladas com a fonte canônica aplicável.
- [ ] Reconciliar afirmações visuais e faladas.
- [ ] Classificar fidelidade e gravidade do vídeo completo.
- [ ] Registrar correções finais e limitações.
- [ ] Atualizar este checklist antes de concluir R02.

**Próxima ação:** LEANDRO seleciona ou arrasta o MP4 no widget do AccurateScribe; após a transcrição ficar disponível, retomar R02 sem reiniciar a análise visual.

## R03 — Investigar o processo verificável do Gemini/NotebookLM

**Estado:** `[ ] PENDENTE`

- [ ] Preparar questionário de proveniência e processo verificável.
- [ ] Registrar respostas como auto-relato, sem alegar acesso a raciocínio privado.
- [ ] Comparar respostas com vídeo e fontes disponíveis.
- [ ] Atualizar este checklist antes de concluir R03.

## R04 — Diagnosticar a apresentação atual do MCF

**Estado:** `[ ] PENDENTE`

- [ ] Avaliar clareza para humanos.
- [ ] Avaliar legibilidade para IAs.
- [ ] Mapear jargão, mistura de idiomas, ambiguidades e duplicidades.
- [ ] Definir política de português na superfície e rastreabilidade técnica no núcleo.
- [ ] Atualizar este checklist antes de concluir R04.

## R05 — Executar experimentos repetidos e comparação A/B

**Estado:** `[ ] PENDENTE`

- [ ] Repetir gerações sobre a documentação atual.
- [ ] Registrar métricas comparáveis.
- [ ] Preparar variante documental controlada.
- [ ] Repetir geração sobre a variante.
- [ ] Comparar resultados.
- [ ] Atualizar este checklist antes de concluir R05.

## R06 — Derivar e amadurecer o protocolo de validação de conteúdo

**Estado:** `[ ] PENDENTE`

- [ ] Derivar versão inicial a partir das evidências.
- [ ] Testar contra os casos observados.
- [ ] Auditar e revisar.
- [ ] Atualizar este checklist antes de concluir R06.

## R07 — Projetar o repositório de conhecimento e a fábrica de conteúdo

**Estado:** `[ ] PENDENTE`

- [ ] Definir arquitetura independente do repositório canônico do MCF.
- [ ] Definir proveniência e direitos.
- [ ] Definir suporte a múltiplos motores de IA.
- [ ] Definir pipeline editorial em português.
- [ ] Atualizar este checklist antes de concluir R07.

## R08 — Desenhar e validar a skill `ALINHAR`

**Estado:** `[ ] PENDENTE`

- [ ] Especificar contrato e gatilhos.
- [ ] Testar contra casos reais da missão.
- [ ] Auditar comportamento de não execução antes da confirmação.
- [ ] Decidir integração canônica.
- [ ] Atualizar este checklist antes de concluir R08.

## R09 — Desenhar e validar a skill `ESTRUTURAR MISSÃO`

**Estado:** `[ ] PENDENTE`

- [ ] Derivar contrato da execução manual de R01.
- [ ] Definir critérios para branch dedicada.
- [ ] Definir geração de contrato, roadmap e checklist.
- [ ] Testar sincronização roadmap ↔ checklist.
- [ ] Testar mudança de escopo/roadmap.
- [ ] Decidir integração canônica.
- [ ] Atualizar este checklist antes de concluir R09.

## R10 — Consolidar resultados e plano de integração

**Estado:** `[ ] PENDENTE`

- [ ] Reconciliar roadmap e checklist.
- [ ] Consolidar evidências e decisões.
- [ ] Separar histórico de material canônico.
- [ ] Registrar pendências e riscos residuais.
- [ ] Preparar decisão de integração/PR.
- [ ] Atualizar este checklist antes de concluir R10.
