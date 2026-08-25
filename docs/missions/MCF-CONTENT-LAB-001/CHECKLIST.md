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
- [x] `MISSAO.md`, `ROADMAP.md` e `CHECKLIST.md` relidos e reconciliados.
- [x] Checklist atualizado antes do fechamento do roadmap — commit `4983488e38b89774fbe78ff375e23917a1312b52`.
- [x] R01 marcado como `CONCLUÍDO` no `ROADMAP.md` — commit `43270d5638858d3f66ab692d2cb9d05381c2d4c1`.

---

## R02 — Concluir a auditoria integral do vídeo

**Estado:** `[~] EM EXECUÇÃO — NOTEBOOKLM PRIORIZADO`

- [x] Auditoria visual preliminar preservada da trilha `MCF-VIDEO-AUDIT-001`.
- [x] Matriz visual consolidada em `analises/R02-AUDITORIA-VISUAL-PRELIMINAR.md` — commit `11f40ab0c91b69a67bbf519376c3b98f6488319a`.
- [x] Correção metodológica: `ESEV` é termo canônico; o problema está em “recibos físicos para cada ação”.
- [x] MP4 processado no AccurateScribe; cobertura útil gratuita limitada a ~1 minuto.
- [x] Resultado parcial preservado em `analises/R02-TRANSCRICAO-PARCIAL-ACCURATESCRIBE.md` — commit `d152401be67ab52e4668ee41bcc4b09211e71066`.
- [x] Primeiro claim narrado identificado: “uma arquitetura que de fato roda em produção” — `SIMPLIFICADO / POTENCIALMENTE AMBÍGUO`.
- [x] WhisperTranscribe.ai testado; a transcrição completa ficou bloqueada por upgrade.
- [x] Alternativas abertas pesquisadas: `openai/whisper`, `SYSTRAN/faster-whisper`, `ggml-org/whisper.cpp`, `Purfview/whisper-standalone-win`, `SubtitleEdit/subtitleedit`.
- [x] Tentativa de instalar `faster-whisper` no runtime desta conversa falhou por rede/DNS do ambiente.
- [x] Não conformidade identificada: foi inferido incorretamente que LEANDRO usava Windows sem evidência verificável.
- [x] LEANDRO informou explicitamente que não usa Windows; a premissa Windows foi invalidada.
- [x] Artefato de fallback corrigido para retirar a recomendação Windows-first — commit `6bc74d7c6c77e6ef77ca108d6db2bce3643e3ce0`.
- [x] Nova evidência visual: no próprio NotebookLM, LEANDRO solicitou `quero a transcrição do vídeo que você criou` e o NotebookLM iniciou uma `Transcrição Completa do Vídeo Explicativo`.
- [ ] Recuperar a transcrição completa diretamente do NotebookLM e preservá-la como evidência.
- [ ] Extrair afirmações faladas relevantes do restante do vídeo.
- [ ] Confrontar afirmações faladas com a fonte canônica aplicável.
- [ ] Reconciliar afirmações visuais e faladas.
- [ ] Classificar fidelidade e gravidade do vídeo completo.
- [ ] Registrar correções finais e limitações.
- [ ] Atualizar este checklist antes de concluir R02.

**Próxima ação:** explorar a transcrição e demais dados diretamente no NotebookLM; não usar mais uma rota dependente de Windows como padrão.

## R03 — Investigar o processo verificável do Gemini/NotebookLM

**Estado:** `[ ] PENDENTE`

- [ ] Preparar questionário de proveniência e processo verificável.
- [ ] Registrar respostas como auto-relato, sem alegar acesso a raciocínio privado.
- [ ] Comparar respostas com vídeo e fontes disponíveis.
- [ ] Atualizar este checklist antes de concluir R03.

## R03A — Mapear a superfície de integração do NotebookLM

**Estado:** `[~] EM EXECUÇÃO`

- [x] LEANDRO determinou a criação de uma integração própria para extrair e operar o máximo possível do NotebookLM.
- [x] Diretório de plugins do ChatGPT pesquisado; nenhum plugin específico de NotebookLM apareceu nos resultados deste checkpoint.
- [x] Ajuda oficial do NotebookLM consultada e superfície inicial confirmada: fontes, conversa com citações, notas e artefatos do Estúdio.
- [x] Artefatos do Estúdio confirmados na documentação: Resumo em Áudio, Resumo em Vídeo, mapa mental, relatórios, tabela de dados, cartões de estudo, testes, apresentação de slides e infográfico.
- [x] Documentação confirma visualização do comando personalizado usado em vários artefatos e exportações/downloads em formatos específicos.
- [x] API oficial `Gemini Notebook Enterprise` encontrada em `v1alpha`/Preview para gestão de notebooks, fontes e Resumo em Áudio.
- [x] Nas fontes oficiais consultadas, não foi encontrada API pública documentada do produto pessoal cobrindo integralmente conversa e todos os artefatos do Estúdio.
- [x] `ROADMAP.md` atualizado com R03A e R03B — commit `2fa68b2537bfe1bb9a47babfa7765af9bb03930f`.
- [x] Checklist sincronizado após a mudança de roadmap neste checkpoint.
- [ ] Mapear recurso por recurso em matriz `capacidade → leitura → criação → exportação → API oficial → UI → evidência`.
- [ ] Definir fronteira permitida para integração com o produto pessoal sem coletar credenciais nem contornar controles de acesso.
- [ ] Atualizar este checklist antes de concluir R03A.

**Próxima ação:** concluir a matriz de capacidades e decidir a arquitetura segura para o NotebookLM pessoal versus Gemini Notebook Enterprise.

## R03B — Construir MVP do App/connector NotebookLM ↔ ChatGPT

**Estado:** `[ ] PENDENTE`

- [ ] Classificar arquétipo do App ChatGPT; hipótese inicial: `tool-only`/data-first com UI opcional posterior.
- [ ] Definir ferramentas MCP e contratos de dados.
- [ ] Expor `search` e `fetch` como superfície padrão de leitura estruturada.
- [ ] Implementar adaptador oficial para NotebookLM Enterprise quando aplicável.
- [ ] Projetar adaptador para produto pessoal via mecanismos permitidos e autorização explícita do usuário.
- [ ] Avaliar extensão de navegador companheira multiplataforma como ponte para a UI pessoal, se necessária.
- [ ] Integrar exportações oficiais via Google Docs/Sheets/Drive quando aplicável.
- [ ] Testar com o notebook real desta missão.
- [ ] Validar extração de transcrição, fontes, citações, prompts e artefatos.
- [ ] Atualizar este checklist antes de concluir R03B.

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
- [ ] Integrar o App/connector NotebookLM como um motor substituível, não como dependência única.
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
