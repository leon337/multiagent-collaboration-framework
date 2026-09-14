# Checklist Vivo — Interactive Book V3 / Physical Book Engine

Mission: `MCF-20260914-INTERACTIVE-BOOK-V3`

Estado geral: **EM EXECUCAO**  
Goal: **entregar o prototipo pronto e validavel dentro do ChatGPT antes de qualquer publicacao externa**.

## G0 — Registro e baseline

- [x] Confirmar Goal com LEANDRO
- [x] Confirmar fonte canonica do MCF
- [x] Criar branch isolada da missao
- [x] Registrar contrato da missao
- [x] Registrar checklist vivo
- [ ] Registrar plano de implementacao
- [ ] Registrar baseline funcional da V2

## G1 — Physical Page Engine

- [ ] Substituir virada de placa rigida por curvatura visual segmentada
- [ ] Fazer a folha acompanhar mouse/toque em tempo real
- [ ] Criar zonas de pega em bordas e cantos
- [ ] Implementar corner lift antes do arraste
- [ ] Implementar limiar de retorno/completude da virada
- [ ] Aplicar sombras dinamicas durante a dobra
- [ ] Representar pilha de paginas lidas e restantes
- [ ] Implementar capa frontal fisica
- [ ] Implementar contracapa fisica

## G2 — Audio, leitura e navegacao

- [ ] Gerar som de papel via Web Audio API
- [ ] Fazer som reagir a velocidade/progresso do gesto
- [ ] Adicionar mute e volume
- [ ] Preservar selecao/copia de texto fora das zonas de pega
- [ ] Adicionar navegacao por botoes e teclado
- [ ] Adicionar navegacao por capitulos com transicao coerente
- [ ] Adicionar marcador de pagina
- [ ] Adicionar progresso de leitura
- [ ] Adicionar retomada local da ultima pagina
- [ ] Adicionar controle de tamanho de fonte
- [ ] Respeitar `prefers-reduced-motion`
- [ ] Adicionar pagina de fontes e versao do conteudo

## G3 — Responsividade e validacao

- [ ] Garantir desktop sem corte critico de conteudo
- [ ] Garantir mobile sem corte critico de conteudo
- [ ] Smoke: proxima/anterior
- [ ] Smoke: arraste esquerda/direita
- [ ] Smoke: retorno abaixo do limiar
- [ ] Smoke: completar acima do limiar
- [ ] Smoke: audio on/off/volume
- [ ] Smoke: selecao de texto
- [ ] Smoke: teclado
- [ ] Smoke: capitulos
- [ ] Smoke: persistencia local
- [ ] Registrar validacao tecnica
- [ ] Renderizar prototipo inline no ChatGPT
- [ ] **HUMAN VALIDATION — LEANDRO valida experiencia dentro do ChatGPT**

## G4 — Publicacao externa

- [ ] **HUMAN_GATE — LEANDRO autoriza publicacao externa**
- [ ] Preparar deploy
- [ ] Publicar na Vercel
- [ ] Smoke publico
- [ ] Registrar URL final

## Regra de atualizacao

Cada item so pode ser marcado `[x]` quando houver evidencia objetiva da etapa executada. Itens perceptuais de UX que dependem da experiencia final permanecem abertos ate validacao do LEANDRO.
