# Interactive Book V3 — Physical Book Engine Implementation Plan

> **For agentic workers:** execute task-by-task, keep `artifacts/phases/PHASE-IBV3-PHYSICAL-BOOK-ENGINE/CHECKLIST.md` synchronized, and preserve the HUMAN_GATE before deploy/merge.

**Goal:** entregar um prototipo autocontido de livro digital fisico, validavel dentro do ChatGPT, com page curl perceptual, arraste real, audio reativo, navegacao e acessibilidade.

**Architecture:** aplicacao estatica HTML/CSS/JavaScript sem dependencias externas. O motor de dobra divide a folha em 18 segmentos 3D; cada segmento recebe rotacao, deslocamento e profundidade proporcionais ao progresso do gesto, produzindo curvatura perceptual. Conteudo permanece DOM selecionavel; apenas bordas/cantos capturam gestos. Web Audio API gera papel, impacto e feedback localmente.

**Tech Stack:** HTML5, CSS 3D transforms, Pointer Events, Web Audio API, localStorage, JavaScript nativo.

**Spec:** `artifacts/phases/PHASE-IBV3-PHYSICAL-BOOK-ENGINE/MCF-20260914-INTERACTIVE-BOOK-V3-MISSION.yaml`

## Global Constraints

- zero dependencias remotas no prototipo;
- zero deploy externo antes do HUMAN_GATE;
- zero merge em `main` antes de decisao humana;
- desktop e mobile;
- texto selecionavel fora das zonas de pega;
- audio somente apos gesto do usuario, conforme politica do navegador;
- `prefers-reduced-motion` respeitado;
- persistencia limitada a estado local de leitura, sem telemetria.

---

### Task 1 — Baseline e shell

**Files:**
- Create: `experimentos/interactive-book-v3/index.html`
- Modify: `artifacts/phases/PHASE-IBV3-PHYSICAL-BOOK-ENGINE/CHECKLIST.md`

- [ ] Implementar toolbar, capitulos, progresso, duas paginas desktop e pagina unica mobile.
- [ ] Preservar conteudo educacional da V2.
- [ ] Verificar parse HTML/JavaScript sem erro sintatico.

### Task 2 — Physical Page Engine

**Files:**
- Modify: `experimentos/interactive-book-v3/index.html`

**Interfaces:**
- `prep(dir)` prepara a folha e pagina subjacente.
- `applyCurl(progress, speed)` deforma os 18 segmentos.
- `settle(commit)` completa ou devolve a folha.
- `animate(dir)` oferece alternativa por botao/teclado.

- [ ] Capturar pointer somente nas bordas/cantos.
- [ ] Fazer progresso acompanhar deslocamento horizontal.
- [ ] Aplicar curva progressiva por segmento.
- [ ] Aplicar sombra dinamica e profundidade.
- [ ] Implementar limiar de commit de 35%.
- [ ] Implementar corner lift e pilha de paginas.
- [ ] Implementar capa e contracapa.

### Task 3 — Audio fisico

**Files:**
- Modify: `experimentos/interactive-book-v3/index.html`

**Interfaces:**
- `startRustle()` inicia textura de papel.
- `updateRustle(speed, progress)` reage ao gesto.
- `stopRustle(drop)` encerra e produz impacto.

- [ ] Gerar ruido filtrado via Web Audio API.
- [ ] Modular volume/filtro pela velocidade e dobra.
- [ ] Adicionar mute e slider de volume.
- [ ] Adicionar feedback curto para botoes/capitulos.

### Task 4 — Reader UX e acessibilidade

**Files:**
- Modify: `experimentos/interactive-book-v3/index.html`

- [ ] Manter `user-select:text` no conteudo.
- [ ] Navegar por teclado e botoes.
- [ ] Adicionar capitulos, marcador e progresso.
- [ ] Persistir ultima pagina, marcador, fonte e contraste em localStorage.
- [ ] Adicionar controles A−/A+ e contraste.
- [ ] Respeitar reduced motion.
- [ ] Adicionar pagina de fontes e versao.

### Task 5 — Verificacao e entrega inline

**Files:**
- Create/update: artefatos de validacao da fase.
- Modify: `CHECKLIST.md`.

- [ ] Parse JavaScript com `new Function()` sem erro.
- [ ] Parse DOM e checar IDs obrigatorios/duplicados.
- [ ] Revisar regras de navegacao e limites de indice.
- [ ] Renderizar a mesma base como artefato inline no ChatGPT.
- [ ] Deixar validacao perceptual final aberta para LEANDRO.

### Task 6 — Gate externo

- [ ] Somente apos `HUMAN VALIDATION`: registrar resultado.
- [ ] Somente apos autorizacao explicita: preparar Vercel.
- [ ] Nao publicar nem mergear nesta fase sem nova autorizacao.
