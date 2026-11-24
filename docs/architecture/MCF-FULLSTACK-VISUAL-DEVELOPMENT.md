# MCF Full-Stack Visual Development

**ID:** MCF-FULLSTACK-VISUAL-DEVELOPMENT  
**Versão:** 0.1.0  
**Classificação:** EXPERIMENTAL — contrato de orquestração registrado; a descoberta de componentes tem adapter read-only separado; executor full-stack e escrita/scaffolding continuam pendentes.  
**Autoridade:** LEANDRO  
**Coordenação:** MESTRE

## 1. Objetivo

Dar aos agentes MCF uma capacidade compartilhada para projetar, construir e validar aplicações completas. Astryx é o primeiro provider visual suportado como opção, não o orquestrador nem o backend da aplicação.

A capacidade é híbrida e provider-agnostic:

- **Visual provider:** Astryx fornece componentes React tipados, temas, templates e CLI para descoberta de documentação.
- **Frontend engineering:** agentes implementam páginas, estado, navegação, formulários, integração com APIs e comportamento.
- **Backend engineering:** agentes implementam serviços, regras de negócio, contratos HTTP/eventos, autenticação e autorização.
- **Data engineering:** agentes projetam esquema, migrações, índices, integridade, backup e recuperação.
- **Validation:** agentes executam testes funcionais, integração, E2E, regressão visual, acessibilidade, segurança e performance.
- **MCF Runtime:** mantém missão, permissões, evidências, receipts, handoffs e gates.

## 2. Fatos verificados sobre Astryx

Fontes primárias consultadas em 2026-11-24:

- https://github.com/meta/astryx
- https://github.com/meta/astryx/wiki/System-Architecture
- https://github.com/meta/astryx/wiki/Distribution
- https://github.com/meta/astryx/wiki/Contributing-Templates
- https://astryx.atmeta.com/docs/cli

Astryx é um design system open source em Beta, baseado em React 19+ e StyleX internamente. O projeto publica `@astryxdesign/core`, CLI, build tooling e temas. Oferece componentes tipados, CSS pré-compilado, theming e templates. StyleX é detalhe de autoria: aplicações consumidoras usam o CSS pré-compilado e podem customizar com CSS comum ou `className`. A CLI é a interface de descoberta para agentes (por exemplo, listagem de componentes, documentação compacta, fonte e scaffolding).

**Limite explícito:** Astryx não é um framework full-stack, não cria por si só backend, banco, autenticação, regras de negócio, deployment ou governança. Essas responsabilidades permanecem com as competências e adapters do MCF.

## 3. Arquitetura lógica

```text
Mission / Product Requirements
          |
          v
MCF Product + UX + Architecture
          |
          v
MCF Full-Stack Visual Development (orchestration contract)
          |
          +--> Visual Provider Adapter (Astryx first; alternatives later)
          |       +-- read-only component discovery / docs
          |       +-- template source/skeleton and scaffold (future gated capability)
          |       +-- theme and token guidance
          |
          +--> Frontend implementation
          +--> Backend/API implementation
          +--> Data/migration implementation
          +--> Auth/integration implementation
          |
          v
Validation: unit / API / integration / E2E / visual / a11y / security
          |
          v
MCF HDF + Permission Engine + Evidence Validator + Receipt + PR gates
```

## 4. Invariantes e fronteiras

1. Astryx é provider de apresentação, nunca fonte de verdade de domínio.
2. UI não é boundary de segurança. Toda autorização é validada no backend/runtime.
3. Contratos de API, domínio e dados não podem depender de componentes Astryx.
4. A adoção é opt-in por aplicação/rota; não substituir globalmente CSS/reset/tema em aplicações existentes.
5. React 19+ é requisito do core Astryx; verificar peer dependencies, framework, SSR/RSC, bundler e versões atuais antes de instalar.
6. Core, tema e CLI devem ser versionados de forma compatível; lockfile obrigatório.
7. Não importar/resetar CSS globalmente sem teste de colisão, regressão visual e plano de rollback.
8. Não inventar API de componente. Consultar CLI/documentação da versão instalada.
9. Se Astryx não servir à stack, usar outro provider ou design system existente sem bloquear backend.
10. Nenhum deploy/ação destrutiva decorre desta Skill sem autorização e gate apropriados.

### 4.1 Política de comandos e fronteira de escrita Astryx

A capability deve classificar operações pelo efeito real, não pelo nome do comando:

| Classe | Operações | Política MCF |
|---|---|---|
| READ_ONLY implementado na PR #579 | `component --list`; `component <Name> --detail compact` | Allowlist fechada, argv fixo, workspace isolado, CLI/Core locais verificados e receipt validado |
| READ_ONLY futuro | `docs`, `search`, `template --list`, `template <id>`, `template <id> --skeleton`, `build`, `doctor` | Só habilitar após adapter específico, schema semântico, limites de saída e testes |
| Escrita governada | `template copy`, `swizzle`, `init`, `theme add/use/build`, `upgrade --apply` e subcomandos experimentais que geram/alteram arquivos | Nunca executar diretamente no checkout; gerar proposta/diff em workspace descartável e exigir HDF + SCOPED_WRITE, paths permitidos, receipt, testes e rollback |

Regras adicionais:

1. Não aceitar comandos, flags ou argumentos arbitrários enviados pelo agente; cada operação tem allowlist e argv canônico.
2. Não herdar variáveis secretas do processo MCF para o CLI; usar ambiente mínimo e diretórios HOME/config/cache/temp dentro do workspace isolado.
3. A descoberta atual da PR #579 é somente leitura; não habilita template copy, swizzle, init, theme writes, codemods ou deploy.
4. O CLI nunca recebe autorização para shell arbitrário, escrita fora do workspace aprovado ou deploy.

## 5. Fluxo operacional

1. Recuperar estado real do repositório, branch, CI, stack e padrões visuais existentes.
2. Definir requisitos, jornadas, critérios de aceite e classificação de risco.
3. Projetar arquitetura frontend/backend/dados/integrações e contratos.
4. Selecionar provider visual. Astryx só é selecionado após verificação de compatibilidade.
5. Consultar CLI para documentação, componentes e templates; registrar versão e comandos executados.
6. Implementar UI isolada e integração com APIs tipadas.
7. Implementar backend, autorização server-side, persistência e migrações.
8. Validar fluxos críticos em viewport desktop/mobile, teclado, foco, contraste e leitor de tela conforme risco.
9. Executar testes de unidade, API, integração, E2E, segurança e performance pertinentes.
10. Produzir PRF, review, CI e PR; merge somente após gates vigentes.
11. Produção permanece separada de merge em main; promoção exige autorização de produção específica e SHA exato.

## 6. Matriz de responsabilidade

| Área | Responsável primário | Astryx |
|---|---|---|
| Requisitos e produto | MCF Product | Não |
| Jornada e UX | MCF Design Experience | Referência de componentes |
| Arquitetura | MCF Design Architecture | Provider opcional |
| Componentes e tema | Frontend / Visual Provider | Sim |
| Estado e integração UI | Frontend Engineering | Parcial |
| APIs e regras de negócio | Backend Engineering | Não |
| Banco e migrações | Data Engineering | Não |
| Autenticação/autorização | Backend + MCF Permission Engine | Não |
| Testes e qualidade | MCF Validation | CLI/docs podem apoiar |
| Missões, gates e receipts | MCF Runtime | Não |

## 7. Critérios de aceite da capacidade

- [ ] Compatibilidade verificada com a stack alvo e React peer dependencies.
- [ ] Versões de core/theme/CLI alinhadas e lockfile reproduzível.
- [ ] Um fluxo real de componente e template consultado pela CLI.
- [ ] UI integrada a API real ou mock contratual claramente identificado.
- [ ] Backend valida autorização independentemente da UI.
- [ ] Testes de API, integração e E2E dos fluxos críticos.
- [ ] Regressão visual desktop/mobile.
- [ ] Revisão de acessibilidade.
- [ ] Revisão de segurança e dados.
- [ ] Evidências e receipts vinculados ao SHA.
- [ ] Rollback e ausência de efeitos em produção demonstrados.

## 8. Estado de implementação e próximos limites

Esta PR registra a Skill experimental e a arquitetura. **A Skill full-stack não é executável pelo runtime.** A descoberta Astryx read-only está isolada na PR #579 e ainda não deve ser considerada disponível no `main` até concluir CI, revisão e merge.

### Proposta separada na PR #579

A PR #579 contém a implementação candidata da descoberta de componentes: allowlist de operações read-only, workspace isolado, resolução do pacote/binário local, execução por Node/execFile sem shell ou PATH fallback, receipt assinado e validação semântica. O PR também inclui testes unitários, integração com CLI real e E2E do MissionRuntime. Esses itens só passam a integrar a capacidade disponível no `main` após os gates e o merge da PR #579.

### Pendências para desenvolvimento visual/full-stack completo

1. Adapter para template source/skeleton e scaffolding em diff-proposal, sujeito a HDF, paths permitidos e diff review.
2. Receipts e Evidence Validator para propostas de escrita, com proveniência e diff digest.
3. Aplicação de diffs somente por SCOPED_WRITE, com aprovação explícita e rollback.
4. Benchmark visual e projeto-piloto full-stack não produtivo cobrindo frontend, API, banco isolado, autorização server-side, acessibilidade, visual regression e rollback.
5. Evidências E2E de uma aplicação completa antes de promover a Skill de EXPERIMENTAL para CURRENT_IMPLEMENTED.

Não habilitar execução arbitrária de shell nem expor o CLI a produção. A descoberta proposta em PR #579 permanece read-only e disabled-by-default. Nenhuma escrita ou deploy é permitido nesta capability.

## 9. Projeto-piloto recomendado

Usar uma aplicação interna não produtiva com:
- dashboard responsivo;
- autenticação de teste;
- CRUD com API;
- banco isolado e migração reversível;
- estados loading/empty/error/success;
- auditoria visual e E2E;
- deploy de preview, nunca produção.

O piloto deve comparar Astryx com a implementação visual existente em esforço, consistência, acessibilidade, regressões, bundle e manutenção. A adoção será decidida por evidência, não por preferência de ferramenta.
