# Checklist Vivo — Interactive Book V3 / Physical Book Engine

Mission: `MCF-20260914-INTERACTIVE-BOOK-V3`

Estado geral: **IMPLEMENTADO / AGUARDANDO VALIDACAO INLINE**  
Goal: **entregar o prototipo pronto e validavel dentro do ChatGPT antes de qualquer publicacao externa**.

## G0 — Registro e baseline

- [x] Confirmar Goal com LEANDRO
- [x] Confirmar fonte canonica do MCF
- [x] Criar branch isolada da missao
- [x] Registrar contrato da missao
- [x] Registrar checklist vivo
- [x] Registrar plano de implementacao
- [x] Registrar baseline funcional da V2

## G1 — Physical Page Engine

- [x] Substituir virada de placa rigida por curvatura visual segmentada
- [x] Fazer a folha acompanhar mouse/toque em tempo real
- [x] Criar zonas de pega em bordas e cantos
- [x] Implementar corner lift antes do arraste
- [x] Implementar limiar de retorno/completude da virada
- [x] Aplicar sombras dinamicas durante a dobra
- [x] Representar pilha de paginas lidas e restantes
- [x] Implementar capa frontal fisica
- [x] Implementar contracapa fisica

## G2 — Audio, leitura e navegacao

- [x] Gerar som de papel via Web Audio API
- [x] Fazer som reagir a velocidade/progresso do gesto
- [x] Adicionar mute e volume
- [x] Preservar selecao/copia de texto fora das zonas de pega
- [x] Adicionar navegacao por botoes e teclado
- [x] Adicionar navegacao por capitulos com transicao coerente
- [x] Adicionar marcador de pagina
- [x] Adicionar progresso de leitura
- [x] Adicionar retomada local da ultima pagina
- [x] Adicionar controle de tamanho de fonte
- [x] Respeitar `prefers-reduced-motion`
- [x] Adicionar pagina de fontes e versao do conteudo

## G3 — Responsividade e validacao

- [ ] Garantir desktop sem corte critico de conteudo — **aguarda renderer inline**
- [ ] Garantir mobile sem corte critico de conteudo — **aguarda renderer inline**
- [ ] Smoke: proxima/anterior
- [ ] Smoke: arraste esquerda/direita
- [ ] Smoke: retorno abaixo do limiar
- [ ] Smoke: completar acima do limiar
- [ ] Smoke: audio on/off/volume
- [ ] Smoke: selecao de texto
- [ ] Smoke: teclado
- [ ] Smoke: capitulos
- [ ] Smoke: persistencia local
- [x] Registrar validacao tecnica estatica
- [ ] Renderizar prototipo inline no ChatGPT
- [ ] **HUMAN VALIDATION — LEANDRO valida experiencia dentro do ChatGPT**

## G4 — Publicacao externa

- [ ] **HUMAN_GATE — LEANDRO autoriza publicacao externa**
- [ ] Preparar deploy
- [ ] Publicar na Vercel
- [ ] Smoke publico
- [ ] Registrar URL final

## Evidencias atuais

- Branch: `mission/interactive-book-v3-physical-engine-20260914`
- Fonte: `experimentos/interactive-book-v3/index.html`
- Contrato: `MCF-20260914-INTERACTIVE-BOOK-V3-MISSION.yaml`
- Plano: `docs/superpowers/plans/2026-09-14-interactive-book-v3-physical-engine.md`
- Validacao estatica: `PHASE-IBV3-VALIDATION.txt`
- Checkpoint: `PHASE-IBV3-CHECKPOINT.yaml`

## Regra de atualizacao

Cada item so pode ser marcado `[x]` quando houver evidencia objetiva da etapa executada. Itens perceptuais de UX que dependem da experiencia final permanecem abertos ate validacao do LEANDRO.
