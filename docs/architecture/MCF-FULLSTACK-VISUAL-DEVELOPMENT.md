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
          |       +-- component discovery / docs
          |       +-- template discovery / scaffold
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

Esta alteração registra a Skill experimental e a arquitetura no repositório. **Não declara integração executável no runtime.** Permanecem necessários:

1. Skill definition/schema compatível com o loader runtime atual.
2. Adapter read-only de descoberta de componentes Astryx CLI implementado na PR #579, com allowlist, timeout, workspace absoluto, versões CLI/Core, receipt assinado e validação semântica.
3. Adapter de scaffolding/alteração de arquivos sujeito a HDF, paths permitidos e diff review.
4. Evidence Validator e receipt semântico implementados para descoberta de componentes; receipts de scaffolding/escrita continuam pendentes.
5. Testes unitários e E2E do fluxo MissionRuntime → SkillExecutor → Dispatcher → Adapter → EvidenceValidator implementados para descoberta read-only.
6. Adapter de scaffolding em diff-proposal com HDF/SCOPED_WRITE, benchmark visual e projeto-piloto full-stack não produtivo ainda são gates futuros antes de promover de EXPERIMENTAL para CURRENT_IMPLEMENTED.

Não habilitar execução arbitrária de shell nem expor o CLI a produção. O adapter inicial deve operar em workspace isolado e disabled-by-default até concluir os gates de segurança.

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
