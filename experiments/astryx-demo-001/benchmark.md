# Benchmark — MCF-ASTRYX-EXPERIMENT-001

**Data:** 24/11/2026  
**Host:** leo-N43SM (Linux)  
**Node:** v24.22.2  
**Escopo:** sandbox isolado; não representa benchmark de produção.

## Instalação e build

| Medida | Resultado | Estado |
|---|---:|---|
| `npm ci --no-audit --no-fund` | 166 pacotes / 9,30 s | PASS |
| `npm ls --depth=0` | todas as versões conforme lockfile | PASS |
| `npm run build` | 2.359 módulos transformados; Vite reportou 1,76 s | PASS |
| CLI Astryx | documentação de Button, Card, Stack, Badge, Heading e Text consultada | PASS |
| HTTP preview | `127.0.0.1:41782/` respondeu HTTP 200 | PASS |

A instalação limpa final foi feita após inspecionar e permitir somente os `postinstall` de Core e CLI nas versões fixadas. A instalação repetida não reportou scripts pendentes nem conflito de dependências.

## Artefatos de build

| Arquivo | Tamanho |
|---|---:|
| CSS principal | 316.889 bytes (316,88 kB) |
| JavaScript principal | 497.337 bytes (497,33 kB) |
| JavaScript de Tooltip | 2.072 bytes (2,07 kB) |
| HTML | 613 bytes |
| Source maps JS | 2.487.977 bytes |
| Diretório `dist` completo | 3.304.888 bytes |

Tamanhos gzip informados pelo Vite: CSS 49,21 kB; JS principal 157,19 kB; Tooltip 0,96 kB; HTML 0,37 kB. Total aproximado dos assets comprimidos: 207,73 kB.

O total de `dist` inclui source maps, habilitados nesta demo para inspeção. Não comparar o total do diretório com um bundle de produção que descarte mapas.

## Smoke test de browser

Executado com Chrome headless via Playwright, após build e instalação limpa.

| Verificação | Resultado |
|---|---|
| Documento `lang=pt-BR`, title e um H1 | PASS |
| Hierarquia H1 → H2 → H3 | PASS |
| Botões com nome acessível por texto visível | 5/5 encontrados por role/nome |
| Alternância para tema escuro | PASS |
| Navegação para a seção Evidências | PASS |
| Checkpoint local acrescenta 1 evento (3 → 4) | PASS |
| Desktop 1440×1000 sem overflow horizontal | PASS |
| Mobile 390×844 sem overflow horizontal | PASS |
| Erros de console na rodada final | 0 |
| Requisições HTTP 4xx na rodada final | 0 |

Capturas produzidas no host:
- `/tmp/mcf-astryx-demo-001/evidence-desktop.png`
- `/tmp/mcf-astryx-demo-001/evidence-mobile.png`

## Defeitos encontrados e corrigidos durante a validação

1. As propriedades `gap="sm/md"` não correspondiam à API do Stack; foram substituídas por valores numéricos de espaçamento.
2. A API de Button exige `label`; todas as instâncias foram ajustadas para fornecer nome acessível.
3. O checkpoint não estava disponível na seção Evidências; foi adicionado nessa seção e o fluxo foi repetido com sucesso.
4. A página solicitava `/favicon.ico` inexistente; foi incluído favicon vazio (`data:,`) e a rodada final terminou sem 404.

## O que este benchmark não prova

- Não mede tempo de interação ou consumo de memória em um perfil de produção.
- Não é benchmark comparativo contra uma build baseline do MCF; apenas confirma compatibilidade de versão de React/Vite.
- Não é auditoria WCAG completa. Contraste, foco em todos os estados, leitores de tela e navegação integral por teclado ainda precisam de revisão dedicada.
- Não valida integração com runtime, banco, permissões, autenticação, receipts assinados, Agent Bridge ou deploy.
- Não contém parecer de Sofia nem aprovação de LÉO. São gates de governança separados.

## Conclusão técnica

**Aprovado para continuar a avaliação em sandbox.** Os critérios técnicos definidos para instalar, compilar, renderizar e interagir com a demo passaram. **Não aprovado para integração no frontend principal ou produção**, porque os gates arquitetural e operacional continuam pendentes e não foi executada validação comparativa no frontend real.
