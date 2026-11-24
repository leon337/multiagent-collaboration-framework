# Parecer arquitetural — função Sofia executada pelo MESTRE

**Missão:** MCF-ASTRYX-EXPERIMENT-001  
**Data:** 24/11/2026  
**Tipo de revisão:** simulação explícita da função de Sofia pelo MESTRE, a pedido de LEANDRO.  
**Autenticidade:** não é mensagem, sessão ou assinatura do agente canônico Sofia.

## Entrada e artefatos analisados

- README, package.json, package-lock.json, src/App.jsx, src/styles.css, benchmark.md e evidence.md da branch experiment/astryx-demo-001.
- Manifesto do frontend MCF: React 19.2.8, Vite 8.1.5 e Node >=24.18 <25.
- Manifestos do Astryx Core, Theme Neutral e CLI fixados em 0.7.16; React e Vite alinhados ao frontend MCF.
- Smoke test Playwright/Chrome, build e instalação limpa documentados.

## Decisão arquitetural

**APROVADO PARA EXPERIMENTO ISOLADO. NÃO APROVADO PARA INTEGRAÇÃO DIRETA NO FRONTEND PRINCIPAL.**

A compatibilidade de React/Vite e a build verde justificam continuar o piloto. Não provam compatibilidade de cascata CSS, acessibilidade completa, regressão visual ou custo de migração no produto real.

## Fronteiras recomendadas

1. Manter Astryx dentro de um pacote/ponto de entrada visual isolado, sem importar módulos do MCF Runtime.
2. MCF continua dono de missões, estados, autorização, HDF/Permission Engine, eventos persistidos, receipts e handoffs.
3. Astryx recebe view-models/props já autorizados e renderiza apresentação; nunca decide transições de missão nem executa ações externas.
4. Ações de UI devem chamar contratos de aplicação tipados, com validação de permissão no backend/runtime. Não confiar em esconder/desabilitar botões como controle de acesso.
5. Preferir adoção gradual por rota/página. Evitar substituição global do reset, tema ou CSS até medir colisões com o CSS atual.
6. Fixar Core, Theme e CLI na mesma versão compatível e manter lockfile. Atualizações beta exigem rebuild, smoke e regressão visual.

## Achados e riscos

| Achado | Impacto | Condição |
|---|---|---|
| Astryx 0.7.16 é beta e Core/Theme têm acoplamento de versão | mudanças/upgrade podem quebrar UI | pin + lockfile + teste de upgrade |
| CSS reset e tema importados globalmente na demo | potencial colisão com estilos MCF | limitar escopo e medir cascata antes da integração |
| CSS customizado usa cores fixas junto ao tema | contraste e dark mode podem divergir | tokens semânticos e revisão de contraste |
| Estado de checkpoint vive apenas em React | não representa persistência nem receipt MCF | manter rótulo demo; produção exigiria endpoint/receipt |
| aria-current e nomes de botões foram testados superficialmente | não equivale a WCAG | auditoria dedicada de teclado, foco, leitor de tela e contraste |
| Bundle total inclui source maps | tamanho bruto não é comparação de produção | medir build baseline/prod sem sourcemaps |

## Critérios de aceite para uma futura integração

- Build comparativo em branch dedicada, sem alterar main.
- Inventário de CSS e prova de isolamento de reset/tema.
- Testes visuais antes/depois nas rotas críticas do MCF.
- Auditoria de acessibilidade com teclado, foco, contraste e leitor de tela.
- Verificação de performance e tamanho do bundle sem source maps.
- Contratos de UI chamando APIs existentes; nenhuma regra de negócio migrada para componentes.
- Rollback documentado e teste de regressão.
- Revisão de engenharia, acessibilidade, segurança e auditoria independente conforme o escopo.

## Resultado

A demo cumpre o objetivo de avaliar o Astryx isoladamente. Recomendo manter a branch experimental e usar o relatório como baseline. A integração no frontend principal permanece fora do escopo autorizado nesta missão.