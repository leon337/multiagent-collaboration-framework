# Checklist Vivo — Interactive Book V3 / Physical Book Engine

Mission: `MCF-20260914-INTERACTIVE-BOOK-V3`

Estado geral: **EM EXECUCAO / VALIDACAO INCREMENTAL**  
Goal: **entregar o prototipo pronto e validado dentro do ChatGPT, aplicando e validando uma melhoria por vez antes de qualquer publicacao externa**.

## Regra de execucao incremental

Uma melhoria por vez:

`IMPLEMENTAR -> RENDERIZAR INLINE -> LEANDRO VALIDAR -> MARCAR [x] -> PROXIMA MELHORIA`

Nenhuma melhoria perceptual de UX pode ser marcada como concluida apenas porque existe codigo. Se LEANDRO reprovar a experiencia, o item permanece aberto e a mesma etapa deve ser iterada.

## G0 — Registro e baseline

- [x] Confirmar Goal com LEANDRO
- [x] Confirmar fonte canonica do MCF
- [x] Criar branch isolada da missao
- [x] Registrar contrato da missao
- [x] Registrar checklist vivo
- [x] Registrar plano de implementacao
- [x] Registrar baseline funcional anterior
- [x] Corrigir processo: abandonar aplicacao simultanea de todas as melhorias

## G1 — Physical Page Engine

### G1.1 — Dobra / curvatura da folha — **EM VALIDACAO**

- [x] Isolar a G1.1 sem aplicar novas melhorias em paralelo
- [x] Criar contrato tecnico da geometria da dobra
- [x] Executar teste RED antes da implementacao
- [x] Implementar geometria de curvatura continua
- [x] Executar teste GREEN da geometria
- [x] Fazer a folha acompanhar o arraste em tempo real
- [x] Manter limiar de retorno/completude ja existente
- [ ] **HUMAN VALIDATION G1.1 — LEANDRO aprova visualmente a dobra/curvatura**

### G1.2 — Zona fisica de pega / corner behavior

- [ ] Iniciar somente depois da aprovacao da G1.1

### G1.3 — Sombras fisicas da dobra

- [ ] Iniciar somente depois da aprovacao da G1.2

### G1.4 — Pilha/espessura fisica de paginas

- [ ] Iniciar somente depois da aprovacao da G1.3

### G1.5 — Capa e contracapa fisicas

- [ ] Iniciar somente depois da aprovacao da G1.4

## G2 — Audio, leitura e navegacao

- [ ] Refinar audio de papel dependente da fisica
- [ ] Adicionar niveis/volume de audio
- [ ] Preservar selecao/copia de texto sem conflito com gesto
- [ ] Refinar navegacao por capitulos
- [ ] Adicionar marcador/progresso/retomada
- [ ] Adicionar tamanho de fonte e contraste
- [ ] Completar `prefers-reduced-motion`
- [ ] Adicionar pagina de fontes e versao do conteudo

## G3 — Responsividade e validacao final

- [ ] Desktop sem corte critico de conteudo
- [ ] Mobile sem corte critico de conteudo
- [ ] Smoke completo de mouse/touch/botoes/teclado/audio/capitulos
- [ ] Registrar validacao tecnica final
- [ ] **HUMAN VALIDATION FINAL — LEANDRO valida a experiencia completa dentro do ChatGPT**

## G4 — Publicacao externa

- [ ] **HUMAN_GATE — LEANDRO autoriza publicacao externa**
- [ ] Preparar deploy
- [ ] Publicar na Vercel
- [ ] Smoke publico
- [ ] Registrar URL final

## Evidencias atuais

- Branch: `mission/interactive-book-v3-physical-engine-20260914`
- PR draft: `#212`
- Contrato: `MCF-20260914-INTERACTIVE-BOOK-V3-MISSION.yaml`
- Plano: `docs/superpowers/plans/2026-09-14-interactive-book-v3-physical-engine.md`
- G1.1 geometry test: RED confirmado por modulo ausente; GREEN confirmado com `curl3d contract: PASS`
- G1.1 estado: **IMPLEMENTADA / AGUARDANDO VALIDACAO VISUAL INLINE DO LEANDRO**

## Proxima acao unica

Renderizar a G1.1 dentro do ChatGPT e aguardar o veredito de LEANDRO. Nao iniciar G1.2 antes disso.
