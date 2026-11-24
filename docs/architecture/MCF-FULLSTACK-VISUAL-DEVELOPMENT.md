# MCF Full-Stack Visual Development

**ID:** MCF-FULLSTACK-VISUAL-DEVELOPMENT  
**Versão:** 0.1.0  
**Classificação:** EXPERIMENTAL — contrato de orquestração registrado; descoberta de componentes/templates e proposta de scaffold em workspace descartável implementadas; aplicação governada via CodeBuddy e piloto full-stack em qualificação.  
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
          |       +-- component/template source and skeleton discovery (READ_ONLY)
          |       +-- disposable template scaffold proposal (READ_AND_PROPOSE)
          |       +-- apply proposal via CodeBuddy only after HDF + SCOPED_WRITE
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

| Classe                     | Operações                                                                                                               | Política MCF                                                                                                                                                                                                                 |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| READ_ONLY integrado        | `component --list`; `component <Name> --detail compact`; `template --list`; `template <id>`; `template <id> --skeleton` | Allowlist fechada, argv fixo, CLI/Core locais verificados, limites de saída e receipt semântico                                                                                                                              |
| READ_AND_PROPOSE integrado | `template <id> <path>` para um único arquivo de scaffold                                                                | Executar apenas em workspace descartável; gerar source + diff + digest assinado; limpar scratch; sem checkout write                                                                                                          |
| SCOPED_WRITE governado     | Aplicação do receipt via `MCF-IMPLEMENT-CHANGE` / CodeBuddy                                                             | Exigir HDF v1.1 canonicalizado pelo MissionRuntime a partir da conta autenticada de LEANDRO, TEAM_FIRST, project/mission binding, `authorizedScope`, base SHA exato, paths permitidos, receipt, rollback e handoff de testes |
| Futuro / não habilitado    | `swizzle`, `init`, `theme add/use/build`, `upgrade --apply`, deploy e outras operações de escrita Astryx                | Não allowlistar até adapter, schema semântico, rollback e testes específicos; nunca executar diretamente no checkout                                                                                                         |

Regras adicionais:

1. Não aceitar comandos, flags ou argumentos arbitrários enviados pelo agente; cada operação tem allowlist e argv canônico.
2. Não herdar variáveis secretas do processo MCF para o CLI; usar ambiente mínimo e diretórios HOME/config/cache/temp dentro do workspace isolado.
3. A capability de template copy integrada nesta branch escreve apenas em scratch; a aplicação no checkout é responsabilidade do CodeBuddy sob HDF + SCOPED_WRITE. Swizzle, init, theme writes, codemods e deploy continuam fora da allowlist.
4. O CLI nunca recebe autorização para shell arbitrário, escrita fora do workspace aprovado ou deploy.

## 5. Fluxo operacional

1. Recuperar estado real do repositório, branch, CI, stack e padrões visuais existentes.
2. Definir requisitos, jornadas, critérios de aceite e classificação de risco.
3. Projetar arquitetura frontend/backend/dados/integrações e contratos.
4. Selecionar provider visual. Astryx só é selecionado após verificação de compatibilidade.
5. Consultar CLI para documentação, componentes, templates, fontes e esqueletos; registrar versão e comandos executados.
6. Gerar proposta de scaffold em workspace descartável; validar source/diff/digest e paths aprovados.
7. Aplicar a proposta somente via CodeBuddy em SCOPED_WRITE, após HDF aprovado por LEANDRO, em workspace Git limpo e com rollback.
8. Implementar UI isolada e integração com APIs tipadas.
9. Implementar backend, autorização server-side, persistência e migrações.
10. Validar fluxos críticos em viewport desktop/mobile, teclado, foco, contraste e leitor de tela conforme risco.
11. Executar testes de unidade, API, integração, E2E, segurança, acessibilidade e regressão visual pertinentes.
12. Produzir PRF, review, CI e PR; merge somente após gates vigentes.
13. Produção permanece separada de merge em main; promoção exige autorização de produção específica e SHA exato.

## 6. Matriz de responsabilidade

| Área                      | Responsável primário            | Astryx                    |
| ------------------------- | ------------------------------- | ------------------------- |
| Requisitos e produto      | MCF Product                     | Não                       |
| Jornada e UX              | MCF Design Experience           | Referência de componentes |
| Arquitetura               | MCF Design Architecture         | Provider opcional         |
| Componentes e tema        | Frontend / Visual Provider      | Sim                       |
| Estado e integração UI    | Frontend Engineering            | Parcial                   |
| APIs e regras de negócio  | Backend Engineering             | Não                       |
| Banco e migrações         | Data Engineering                | Não                       |
| Autenticação/autorização  | Backend + MCF Permission Engine | Não                       |
| Testes e qualidade        | MCF Validation                  | CLI/docs podem apoiar     |
| Missões, gates e receipts | MCF Runtime                     | Não                       |

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

A descoberta read-only inicial foi integrada ao `main` pela PR #579, merge squash `80ca638`. Esta branch amplia a capability com templates e propostas de scaffold, e integra o caminho de aplicação governada ao adapter CodeBuddy. A Skill full-stack permanece `EXPERIMENTAL` até o piloto e todos os gates passarem no SHA exato.

### Capability visual/template disponível nesta branch

`MCF-ASTRYX-COMPONENT-DISCOVERY@0.2.0` permanece disabled-by-default e oferece component list/docs, template list/source/skeleton e `draft-template-scaffold`. A última operação copia exatamente um arquivo para workspace descartável, gera source + diff + SHA-256, valida paths aprovados e limpa o scratch. Não grava no checkout.

### Aplicação governada

A aplicação ocorre separadamente por `MCF-IMPLEMENT-CHANGE` / CodeBuddy. Quando um receipt de scaffold é fornecido, o adapter exige `authorizedScope=true`, `SCOPED_WRITE`, HDF v1.1 canonicalizado pelo MissionRuntime, com `actionClass=SCOPED_WRITE`, project/mission binding, TEAM_FIRST, referência ao receipt exato e sourceRef `human-authority:<uuid>` gerado pelo servidor para a conta autenticada de LEANDRO. O SHA base e o repositório precisam corresponder ao workspace Git limpo; somente paths aprovados podem mudar. A execução ocorre em Git worktree descartável + Bubblewrap; publicação não comita e rollback transacional é verificado.

### Projeto-piloto não produtivo

`examples/astryx-fullstack-pilot/` demonstra React 19 + Astryx, Vite, API autenticada server-side, PostgreSQL com schema isolado por execução, migration SQL, rollback transacional e limpeza do schema, Playwright desktop/mobile, axe accessibility e pixel baselines. O workflow separado não acessa banco Potiguar nem executa deploy.

### Critérios restantes antes de promover a Skill

1. Gerar e revisar lockfile do piloto e baselines visuais do primeiro run.
2. Obter aprovação do workflow full-stack pilot e dos workflows MCF no head final.
3. Confirmar review técnico e ausência de threads abertas.
4. Promover a Skill de EXPERIMENTAL somente depois de todos os critérios anteriores.

Não habilitar shell arbitrário nem expor o CLI a produção. Astryx não faz backend, domínio, autenticação, deploy ou governança. Nenhuma escrita ou deploy em produção é autorizado por esta integração.
