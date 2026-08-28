# MCF NextGen reconciliado — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development`
> (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** evoluir o MCF atual no lineage v1.2.0 para o runtime multiagente governado da F1.4 por boundaries aditivos,
testáveis e reversíveis, sem API de IA paga nem ativação externa implícita.

**Architecture:** estender o modular monolith NestJS/PostgreSQL e o Context Fabric existentes, mantendo
MissionRuntime como runtime único e separando contratos, Registry, graph/binding, execução cognitiva,
effects, assurance e portabilidade. Cada boundary começa disabled/shadow/read-only conforme aplicável
e só avança após seu gate, compatibility audit e autorização exata.

**Tech Stack:** TypeScript 5, NestJS, PostgreSQL, pnpm 11, Vitest, Node test runner, AJV JSON Schema
2020-12, YAML, GitHub Actions e Gitleaks zero-cost pinado.

**Spec:**
[`docs/architecture/MCF-NEXTGEN-FORMAL-TARGET-ARCHITECTURE-001.md`](../../architecture/MCF-NEXTGEN-FORMAL-TARGET-ARCHITECTURE-001.md)

## Global Constraints

- `LEANDRO = FINAL_HUMAN_AUTHORITY`.
- `AGENT != MODEL_BACKEND != COGNITIVE_EXECUTOR != WORKER`.
- `CAPABILITY != AUTHORITY`; `PLACEMENT != AUTHORITY`; `UI != AUTHORITY`.
- um MissionRuntime, um Operational Transition Ledger e um PermissionEngine canônicos.
- `STATE_TRANSITION_AND_LEDGER_APPEND_ATOMIC_OR_EQUIVALENT`.
- `PAID_AI_API = FORBIDDEN`; `PAID_AI_API_FALLBACK = FORBIDDEN`; `max_paid_ai_cost=0`.
- contratos v1/v1.1 permanecem interpretáveis durante toda a migração.
- o gate autenticado `HUMANO NO CONTROLE` pré-bootstrap do PR #184 é compatibility surface, não
  prova de pausa persistente de missão.
- nenhum provider/VPS/G2-A/G2-B/SSH/release/produção sem missão e gate próprios.
- TDD obrigatório: teste falha pelo motivo esperado, mudança mínima, teste passa, regressão passa.
- nenhum boundary começa sem autorização de LEANDRO vinculada ao SHA/digest e paths exatos.

---

- **Status:** `PLANNED_NOT_AUTHORIZED`
- **Mission:** `MCF-NEXTGEN-RECONCILIATION-F14-001`
- **Issue:** [#165](https://github.com/leon337/multiagent-collaboration-framework/issues/165)
- **Baseline de planejamento:** `main@21c667057617b9cd2090afaab42dc9c7806eef02`
- **Baseline reconciliado antes do PR:** `main@42d941b5bc299cb7121175db0367b780d381c93e`
- **Arquitetura candidata:** [`MCF-NEXTGEN-FORMAL-TARGET-ARCHITECTURE-001.md`](../../architecture/MCF-NEXTGEN-FORMAL-TARGET-ARCHITECTURE-001.md)
- **Roadmap da missão:** [`MCF-NEXTGEN-RECONCILIATION-ROADMAP.md`](../../MCF-NEXTGEN-RECONCILIATION-ROADMAP.md)
- **Implementação autorizada:** `false`

## 1. Regra de uso

Este documento descreve como implementar, testar, migrar e reverter a arquitetura candidata. Ele não permite iniciar nenhum work package.

```text
PLAN_IN_MAIN
  + EXACT_SPEC_APPROVAL_BY_LEANDRO
  + FRESH_BASELINE_AND_COMPATIBILITY_AUDIT
  + EXPLICIT_IMPLEMENTATION_SCOPE
  = FIRST_IMPLEMENTATION_BOUNDARY_MAY_BEGIN
```

Autorização genérica, CI verde, merge desta documentação, Issue aberta ou aprovação histórica Q1–Q16 não substituem o gate acima.

## 2. Estratégia

### 2.1 Princípios

- evoluir o runtime atual no lineage v1.2.0; não criar runtime paralelo;
- contratos e characterization tests antes de wiring;
- additive e disabled-by-default;
- dual-read com um único pipeline lógico de escrita e compatibilidade v1 preservada;
- shadow antes de qualquer efeito;
- read-only antes de write;
- local antes de remoto;
- um writer material por boundary;
- zero chamadas/cobranças de APIs de IA pagas;
- cada etapa possui rollback independente;
- produção e release são missões posteriores.

### 2.2 Primeiro boundary recomendado

O primeiro pedido de autorização deve ser limitado a:

```yaml
boundary: NX-0_CONTRACTS_AND_CONFORMANCE
allowed:
  - public TypeScript contracts
  - JSON schemas
  - valid and invalid fixtures
  - compatibility characterization tests
  - documentation generated from the contracts
  - zero-cost repository security gate configuration when no reusable required check exists
forbidden:
  - runtime wiring
  - database migration
  - provider call
  - model/API invocation
  - external mutation
  - production/release
```

Esse boundary torna decisões testáveis sem introduzir execução material.

## 3. Preflight obrigatório

Antes de editar código em qualquer boundary autorizado:

- [ ] reler a instrução de LEANDRO e extrair o escopo exato;
- [ ] consultar GitHub live e registrar `origin/main` contemporâneo;
- [ ] verificar Issues #141, #147, #164 e #165, os PRs #170/#171/#174/#175/#179/#180/#181/#184 e os drafts concorrentes #176/#177/#182;
- [ ] verificar se `mcf/hermes-relay-bootstrap-20260823@23e4e6c` ou outro lineage Cloud não default avançou, sem tratá-lo como `main` ou executor elegível;
- [ ] criar worktree/branch isolada sem tocar trabalho de outras equipes;
- [ ] provar que o worktree base está limpo;
- [ ] ler esta arquitetura, disposition e plano no SHA aprovado;
- [ ] calcular digest/revisão da especificação aprovada;
- [ ] executar characterization baseline do MCF vigente;
- [ ] revalidar estado dos quatro repositórios e suas Capsules;
- [ ] confirmar que nenhuma capability live/material foi inferida;
- [ ] executar compatibility/regression audit pré-implementação;
- [ ] parar se o baseline invalidar qualquer premissa do plano.

## 4. Work packages

### NX-0 — Contratos, schemas e conformance

**Objetivo:** transformar a F1.4 em contratos públicos aditivos, sem wiring.

Arquivos candidatos:

```text
apps/rede-social-agentes/packages/contracts/src/mcf-agent.ts
apps/rede-social-agentes/packages/contracts/src/mcf-execution.ts
apps/rede-social-agentes/packages/contracts/src/mcf-capability.ts
apps/rede-social-agentes/packages/contracts/src/mcf-context.ts
apps/rede-social-agentes/packages/contracts/src/mcf-effects.ts
apps/rede-social-agentes/packages/contracts/src/mcf-human-decision.ts
apps/rede-social-agentes/packages/contracts/src/mcf-assurance.ts
apps/rede-social-agentes/packages/contracts/src/mcf-nextgen-common.ts
apps/rede-social-agentes/packages/contracts/src/mcf-nextgen-contract-map.ts
apps/rede-social-agentes/packages/contracts/src/mcf-conformance.ts
apps/rede-social-agentes/packages/contracts/src/index.ts
apps/rede-social-agentes/packages/contracts/test/mcf-nextgen-*.test.ts
apps/rede-social-agentes/packages/contracts/test/mcf-nextgen-test-support.ts
schemas/nextgen/common.schema.json
schemas/nextgen/agent-contract.schema.json
schemas/nextgen/task-requirement.schema.json
schemas/nextgen/subject-capability-v2.schema.json
schemas/nextgen/model-backend.schema.json
schemas/nextgen/mission-graph-plan.schema.json
schemas/nextgen/execution-binding.schema.json
schemas/nextgen/cognitive-execution-request.schema.json
schemas/nextgen/cognitive-execution-receipt.schema.json
schemas/nextgen/placement-request.schema.json
schemas/nextgen/placement-receipt.schema.json
schemas/nextgen/authority-envelope.schema.json
schemas/nextgen/effect-request-v2.schema.json
schemas/nextgen/effect-receipt-v2.schema.json
schemas/nextgen/project-capsule-v2.schema.json
schemas/nextgen/capsule-version-pointer.schema.json
schemas/nextgen/memory-read-envelope.schema.json
schemas/nextgen/human-decision-request.schema.json
schemas/nextgen/human-decision-receipt.schema.json
schemas/nextgen/completion-contract.schema.json
schemas/nextgen/evaluation-contract.schema.json
schemas/nextgen/portability-claim.schema.json
schemas/nextgen/portability-receipt.schema.json
schemas/nextgen/contract-catalog.json
schemas/fixtures/nextgen/
docs/contracts/MCF-NEXTGEN-CONTRACT-CATALOG.md
.github/workflows/mcf-nextgen-contract-conformance.yml
```

Regras:

- nenhuma alteração de semântica dos tipos v1/v1.1;
- exports novos e explicitamente versionados;
- `McfSubjectCapabilityV2` não substitui silenciosamente a entrada atual;
- fixtures negativas para unknown/stale/paid/unauthorized;
- Agent Contract genérico não fixa o catálogo de 29 nomes;
- Evaluation Contract e Portability Claim/Receipt são contratos de assurance, não authority;
- todo tipo público da tabela F1.4 possui mapping 1:1 para schema, fixture válida, fixture negativa e teste de paridade contrato/schema;
- Cognitive Execution Receipt inclui manifests de artifacts, mas nunca chain-of-thought ou segredo;
- Capsule Version Pointer não altera nem amplia o schema estrito do Registry/Capsule v1;
- Human Control v1.2, `human-control-policy.ts`, `HumanAuthorityProof`, o gate autenticado de chat
  pré-bootstrap do PR #184 e o trace GUI/window do PR #179 são compatibility surfaces vigentes a
  caracterizar; não são implementações dos contratos NextGen nem entradas implícitas no catálogo;
- o recognizer nominal `actorId=leandro` é somente sintaxe legada: o callsite aceito deve derivar a
  sessão e o UUID humano reservado autenticados, como no PR #184; nenhum wiring pode tratar o nome
  como autenticação ou autoridade;
- as 17 famílias/22 entradas contam somente contratos públicos novos da F1.4; promover
  `HumanControlCheckpoint`, `HumanAuthorityProof`, o trace GUI/window ou qualquer record interno para
  contrato público reabre arquitetura, catálogo e contagem antes de código;
- contrato de continuidade concorrente já mergeado exige disposition/equivalence por campo, owner,
  writer, fonte e consumidor antes de criar Capsule v2; namespace diferente não autoriza semântica
  ou writer duplicados;
- zero import de provider SDK.

Testes mínimos:

- schemas aceitam exemplos válidos e rejeitam campos/tipos desconhecidos;
- `AGENT`, `MODEL_BACKEND`, `COGNITIVE_EXECUTOR`, `WORKER`, `TOOL`, `EXTENSION` e `PROJECT` são distintos;
- capability/authorization/runtime/verification permanecem eixos separados;
- `max_paid_ai_cost` negativo ou maior que zero é rejeitado no profile zero-cost;
- backend paid, unknown ou stale é inelegível;
- authority envelope não amplia a authority chain;
- todo campo `McfContractRefV1` nos 22 contratos resolve por
  `contractId/revisionId/contentDigest` para um target do tipo esperado; ref ausente, ambígua ou de
  tipo divergente falha fechado;
- Human Control e Human Decision continuam semânticas distintas, e nome/campos do caller não provam
  a conta humana reservada;
- inventário automatizado falha se qualquer tipo formal não possuir schema e fixtures positiva/negativa;
- Cognitive Execution Receipt ausente, spoofed ou com binding/attempt digest divergente é rejeitado;
- nonce/idempotency/issued/expires e origin-attestation metadata são obrigatórios; NX-0 valida forma e casos temporais puros, enquanto replay stateful pertence ao NX-5;
- Capsule/Registry v1 continuam legíveis sem conhecer sidecar ou pointer v2;
- Evaluation Contract incompleto ou alterado sem nova revisão/digest é rejeitado;
- Portability Claim diferencia camada, nível de evidência e compatibility envelope;
- v1/v1.1 contracts continuam compilando e passando;
- Human Control/HDF/DEC-065, authority proof autenticada e trace GUI/window vigentes não regressam.

Gate: `NX0_CONTRACT_CONFORMANCE_PASS`.

Rollback: remover somente exports/schemas/fixtures novos; nenhuma migração ou estado terá ocorrido.

#### Plano TDD executável do NX-0

As sete tasks abaixo são o único plano task-by-task pronto para execução. NX-1 a NX-9 são
especificações de subprojetos independentes: cada uma exige novo baseline, autorização e plano
task-by-task próprio depois do gate anterior. Isso impede que instruções antigas atravessem um
boundary humano ou uma mudança real do runtime.

Todas as tasks partem de `apps/rede-social-agentes`, Node `24.18.0`, pnpm `11.17.0`, TypeScript strict,
Vitest e AJV 2020-12. Fixtures cross-document cujo JSON é válido, mas cujo binding/digest é inválido,
usam sufixo `.relation-invalid.json`; não devem ser anunciadas como erro de JSON Schema. Comandos
Git usam `git -C ../..` explicitamente, pois os paths versionados são relativos à raiz do repositório.

##### Task NX0.1 — Common, Agent, Task, Capability e Backend

**Files:**

- Create: `packages/contracts/src/mcf-nextgen-common.ts`
- Create: `packages/contracts/src/mcf-agent.ts`
- Modify: `packages/contracts/src/mcf-capability.ts`
- Modify: `packages/contracts/src/index.ts`
- Create: `packages/contracts/test/mcf-nextgen-test-support.ts`
- Create: `packages/contracts/test/mcf-nextgen-agent-capability.test.ts`
- Create: `../../schemas/nextgen/common.schema.json`
- Create: `../../schemas/nextgen/{agent-contract,task-requirement,subject-capability-v2,model-backend}.schema.json`
- Create: `../../schemas/fixtures/nextgen/{agent-contract,task-requirement,subject-capability-v2,model-backend}.{valid,schema-invalid}.json`
- Create: `../../schemas/fixtures/nextgen/model-backend.{paid,unknown,stale,unauthorized}-eligible.schema-invalid.json`

**Interfaces:**

```ts
interface McfVersionedContractIdentityV1 {
  contractId: string;
  revisionId: string;
  contentDigest: McfSha256Hex;
}
type McfContractRefV1 = McfVersionedContractIdentityV1;
interface McfTrustedAuthorityBindingRefV1 {
  bindingId: string;
  revisionId: string;
  contentDigest: McfSha256Hex;
}
type McfSha256Hex = string;
type McfBase64UrlNoPad = string;
interface McfTemporalEnvelopeV1 {
  issuedAt: string;
  expiresAt: string;
}
interface McfSecurityContextV1 {
  projectId: string;
  securityDomain: string;
  classification: string;
  trustOrigin: string;
  derivedFrom: McfContractRefV1[];
  retentionPolicy: string;
}
type McfSubjectTypeV2 =
  | "PROJECT"
  | "AGENT"
  | "MODEL_BACKEND"
  | "COGNITIVE_EXECUTOR"
  | "WORKER"
  | "TOOL"
  | "EXTENSION";
interface McfAgentContractV1 extends McfVersionedContractIdentityV1 {
  schemaVersion: "1.0";
  agent: {
    agentId: string;
    profileId: string;
    profileVersion: string;
    role: string;
    objectives: string[];
  };
  capabilityRequirements: McfContractRefV1[];
  inputSchemaRefs: McfContractRefV1[];
  outputSchemaRefs: McfContractRefV1[];
  authorityCeiling: {
    allowedActionClasses: string[];
    prohibitedActionClasses: string[];
    maxRiskClass: McfRiskClass;
    humanGateRequiredFor: string[];
  };
  lifecycle: string;
  provenance: McfContextProvenance[];
  backendRequirements: string[];
}
interface McfTaskRequirementContractV1 extends McfVersionedContractIdentityV1 {
  schemaVersion: "1.0";
  task: { missionId: string; phaseId: string; taskId: string };
  hardRequirements: string[];
  softPreferences: string[];
  requiredToolCapabilityRefs: McfContractRefV1[];
  optionalToolCapabilityRefs: McfContractRefV1[];
  data: McfSecurityContextV1;
  qualityFloor: string;
  riskClass: McfRiskClass;
  deadlineAt: string;
  maxPaidAiCost: 0;
}
```

Todo contrato público referenciável implementa `McfVersionedContractIdentityV1`. Seu
`contentDigest` é sempre
`SHA256(UTF8(domainSeparator) || UTF8(JCS(contract sem contentDigest)))`, com SHA-256 lowercase-hex,
JCS RFC 8785 e separator ASCII terminado em `\n`. O catálogo 22/22 registra um separator único e
obrigatório por tipo; não existe separator default nem canonicalização alternativa. Em particular:

```text
McfAuthorityEnvelopeV1:
  MCF_AUTHORITY_ENVELOPE_V1\n
McfHumanDecisionRequestV1:
  MCF_HUMAN_DECISION_REQUEST_V1\n
McfHumanDecisionReceiptV1:
  MCF_HUMAN_DECISION_RECEIPT_V1\n
```

NX0.7 inclui vetores conhecidos e negativos para todos os separators e rejeita digest calculado
sobre campo omitido, ordem/canonicalização alternativa ou tipo errado.

`McfSubjectCapabilityV2` mantém wire snake_case e eixos separados de definition, implementation,
connection, authorization, runtime, verification, provenance e freshness. `McfModelBackendContractV1`
separa transportes suportados, localidades suportadas, data policy, classe/evidência de custo, billing,
free quota, health, authorization, freshness e eligibility. Todo target apontado por
`McfContractRefV1`, inclusive Subject Capability e Model Backend, expõe a identidade comum
`contractId/revisionId/contentDigest`; o inventário NX0.7 resolve cada ref contra um target do tipo
esperado.

`McfTrustedAuthorityBindingRefV1` é um value object que aponta para o binding de bootstrap trust
versionado da instância; não é um 23º contrato público. O checker puro recebe o snapshot confiável
de `bootstrap_trust.trusted_authority_binding` como input explícito; no runtime, a resolução stateful
ocorre fora do payload. No runtime vigente pós-PRs #181/#184 existem a conta autenticada reservada,
`sourceRef` server-side na decisão terminal e o gate autenticado pré-bootstrap de chat; a referência
de binding continua uma exigência aditiva do target NextGen.

- [ ] **Step 1: escrever o teste que importa os tipos ausentes e valida as oito fixtures base**

```ts
expectTypeOf<
  McfTaskRequirementContractV1["maxPaidAiCost"]
>().toEqualTypeOf<0>();
expect(validateFixture("model-backend.valid.json")).toBe(true);
expect(validateFixture("model-backend.paid-eligible.schema-invalid.json")).toBe(
  false,
);
```

- [ ] **Step 2: executar o teste e comprovar a falha esperada**

Run: `corepack pnpm --filter @rsa/contracts exec vitest run test/mcf-nextgen-agent-capability.test.ts`

Expected: FAIL por módulos/schemas/fixtures ainda inexistentes.

- [ ] **Step 3: implementar somente os tipos, schemas strict e fixtures desta task**

Todos os schemas usam draft 2020-12, `$id`, `required` e `additionalProperties: false`; backend
paid/unknown/stale/unauthorized nunca pode ter `eligibility: ELIGIBLE`.

- [ ] **Step 4: executar teste, typecheck e build**

Run: `corepack pnpm --filter @rsa/contracts exec vitest run test/mcf-nextgen-agent-capability.test.ts && corepack pnpm --filter @rsa/contracts typecheck && corepack pnpm --filter @rsa/contracts build`

Expected: PASS.

- [ ] **Step 5: commit**

```bash
git -C ../.. add apps/rede-social-agentes/packages/contracts schemas/nextgen schemas/fixtures/nextgen
git -C ../.. commit -m "feat(contracts): add NextGen agent and capability contracts"
```

##### Task NX0.2 — Mission Graph e Execution Binding

**Files:**

- Create: `packages/contracts/src/mcf-execution.ts`
- Modify: `packages/contracts/src/index.ts`
- Create: `packages/contracts/test/mcf-nextgen-graph-binding.test.ts`
- Create: `../../schemas/nextgen/{mission-graph-plan,execution-binding}.schema.json`
- Create: `../../schemas/fixtures/nextgen/{mission-graph-plan,execution-binding}.{valid,schema-invalid}.json`

**Interfaces:**

```ts
interface McfMissionGraphPlanV1
  extends McfTemporalEnvelopeV1, McfVersionedContractIdentityV1 {
  schemaVersion: "1.0";
  missionId: string;
  nodes: Array<{
    nodeId: string;
    taskRequirementRef: McfContractRefV1;
    dependencies: string[];
    join: "ALL" | "ANY";
    readSet: string[];
    writeSet: string[];
    maxAttempts: number;
    acceptanceCriteria: string[];
  }>;
  budgets: {
    maxDepth: number;
    maxFanout: number;
    timeoutMs: number;
    maxPaidAiCost: 0;
  };
  idempotencyKey: string;
  completionContractRef: McfContractRefV1;
}
type McfExecutionTransport = "HOST_MEDIATED" | "PROGRAMMATIC";
type McfExecutorLocality = "HOST_BOUNDARY" | "IN_PROCESS_LOCAL" | "REMOTE";
type McfAiCostClass =
  "HOST_ENTITLEMENT" | "LOCAL_COMPUTE" | "FREE_VERIFIED_API";
interface McfExecutionBindingCommonV1 extends McfTemporalEnvelopeV1 {
  contractId: string;
  revisionId: string;
  contentDigest: McfSha256Hex;
  missionId: string;
  phaseId: string;
  taskId: string;
  attemptId: string;
  missionGraphPlanRef: McfContractRefV1;
  graphNodeId: string;
  taskRequirementRef: McfContractRefV1;
  agentContractRef: McfContractRefV1;
  backendContractRef: McfContractRefV1;
  cognitiveExecutorCapabilityRef: McfContractRefV1;
  toolCapabilityRefs: McfContractRefV1[];
  placementRequestRef: McfContractRefV1;
  executionTransport: McfExecutionTransport;
  executorLocality: McfExecutorLocality;
  aiCostClass: McfAiCostClass;
  dataBoundary: McfSecurityContextV1;
  authorityEnvelopeRef: McfContractRefV1;
  policyRefs: McfContractRefV1[];
  outputSchemaRef: McfContractRefV1;
  maxPaidAiCost: 0;
}
type McfExecutionBindingV1 =
  | (McfExecutionBindingCommonV1 & {
      resolution: "CANDIDATE_ELIGIBLE";
      supersedesBindingRef: McfContractRefV1 | null;
      workerCapabilityRef?: never;
      placementReceiptRef?: never;
    })
  | (McfExecutionBindingCommonV1 & {
      resolution: "FINALIZED_ELIGIBLE";
      supersedesBindingRef: McfContractRefV1;
      workerCapabilityRef: McfContractRefV1;
      placementReceiptRef: McfContractRefV1;
    });
```

O type exportado é um union discriminado e o schema usa `oneOf`: ambos os estados exigem um `placementRequestRef` resolvível para o contrato
formal `McfPlacementRequestV1`; `CANDIDATE_ELIGIBLE` proíbe worker/Placement Receipt e nunca é
executável; `FINALIZED_ELIGIBLE` exige ambos, novo `revisionId`/digest e
`supersedesBindingRef` apontando para a revisão candidata. Finalização in-place é inválida. Agent
Contract expressa somente um ceiling estável inline, schema-validatable e não concessivo; nunca
referencia o `McfAuthorityEnvelopeV1` específico de mission/task/attempt. O envelope exato pertence
exclusivamente ao binding e deve ser subconjunto desse ceiling.

O Binding usa a identidade canônica comum dos contratos: em todo `McfContractRefV1` que o aponta,
`contractId`, `revisionId` e `contentDigest` são exatamente os três campos homônimos do Binding.
Candidate e finalized preservam `contractId`, mudam `revisionId/contentDigest`, e o
`supersedesBindingRef` finalized deve apontar byte-for-byte para a identidade da revisão candidata.
`contentDigest` é o binding digest; não existe alias `bindingId/bindingDigest` concorrente.

Candidate→finalized preserva exatamente mission/phase/task/attempt, Mission Graph revision/node,
Task Requirement, Agent, Backend, Cognitive Executor, tools, Placement Request, os três eixos,
data boundary, Authority Envelope, policies, output schema e custo máximo. `contractId` permanece;
somente `revisionId/contentDigest`, `resolution`, `supersedesBindingRef`, worker e Placement Receipt
podem mudar. O `issuedAt` final não antecede o candidate e o `expiresAt` final não amplia sua janela.
Qualquer outra diferença falha a finalização.

- [ ] **Step 1: escrever testes de tipos, strict schema, custo zero, refs obrigatórias, `oneOf` candidate/finalized e lineage imutável**

Os testes de tipo usam `Extract<McfExecutionBindingV1, { resolution: ... }>` e casos
`// @ts-expect-error` para provar que candidate com worker/Receipt e finalized sem worker/Receipt ou
sem `supersedesBindingRef` não compilam; as mesmas combinações devem falhar no schema. O gate mantém
`exactOptionalPropertyTypes=true`, sem o qual os casos `?: never` não provam a mesma invariância.

- [ ] **Step 1a: testar resolução Task Requirement/Graph/Completion/Authority/Placement e rejeitar graph revision/node ou campo imutável divergente na finalização**
- [ ] **Step 2: rodar `corepack pnpm --filter @rsa/contracts exec vitest run test/mcf-nextgen-graph-binding.test.ts`**

Expected: FAIL por contratos e schemas ausentes.

- [ ] **Step 3: implementar contratos/schemas/fixtures mínimos, sem compiler ou router**
- [ ] **Step 4: repetir o teste e `corepack pnpm --filter @rsa/contracts typecheck`**

Expected: PASS.

- [ ] **Step 5: commit**

```bash
git -C ../.. add apps/rede-social-agentes/packages/contracts schemas/nextgen schemas/fixtures/nextgen
git -C ../.. commit -m "feat(contracts): define NextGen graph and binding contracts"
```

##### Task NX0.3 — Cognitive Execution e Placement

**Files:**

- Modify: `packages/contracts/src/mcf-execution.ts`
- Modify: `packages/contracts/src/index.ts`
- Create: `packages/contracts/test/mcf-nextgen-execution-placement.test.ts`
- Create: `../../schemas/nextgen/{cognitive-execution-request,cognitive-execution-receipt,placement-request,placement-receipt}.schema.json`
- Create: `../../schemas/fixtures/nextgen/{cognitive-execution-request,cognitive-execution-receipt,placement-request,placement-receipt}.{valid,schema-invalid}.json`
- Create: `../../schemas/fixtures/nextgen/cognitive-execution-receipt.{spoofed,binding-mismatch,attempt-mismatch,executor-identity-mismatch,attestation-metadata-mismatch,critical-field-mismatch,axis-mismatch}.relation-invalid.json`
- Create: `../../schemas/fixtures/nextgen/execution-binding.{blocked-placement-receipt,worker-mismatch,lineage-mismatch}.relation-invalid.json`

**Interfaces:**

```ts
type McfCognitiveExecutionStatusV1 = "SUCCEEDED" | "FAILED";
type McfCognitiveAdmissionStateV1 = "UNVERIFIED" | "VERIFIED" | "REJECTED";
type McfCognitiveAttestationSchemeV1 = "ED25519_JCS_RFC8785_SHA256_V1";
interface McfCognitiveExecutionUsageV1 {
  paidAiCost: 0;
}
interface McfCognitiveExecutionValidationV1 {
  outputSchema: boolean;
  artifactIntegrity: boolean;
}
interface McfCognitiveExecutionRequestV1
  extends McfTemporalEnvelopeV1, McfVersionedContractIdentityV1 {
  missionId: string;
  phaseId: string;
  taskId: string;
  attemptId: string;
  bindingRef: McfContractRefV1;
  agentContractRef: McfContractRefV1;
  backendContractRef: McfContractRefV1;
  executorCapabilityRef: McfContractRefV1;
  executionTransport: McfExecutionTransport;
  executorLocality: McfExecutorLocality;
  aiCostClass: McfAiCostClass;
  inputArtifactRefs: McfContractRefV1[];
  securityContext: McfSecurityContextV1;
  outputSchemaRef: McfContractRefV1;
  timeoutMs: number;
  maxPaidAiCost: 0;
  nonce: string;
  idempotencyKey: string;
}
interface McfCognitiveExecutionReceiptV1 extends McfVersionedContractIdentityV1 {
  requestRef: McfContractRefV1;
  bindingRef: McfContractRefV1;
  attemptId: string;
  agentContractRef: McfContractRefV1;
  executorIdentity: string;
  executorCapabilityRef: McfContractRefV1;
  backendContractRef: McfContractRefV1;
  executionTransport: McfExecutionTransport;
  executorLocality: McfExecutorLocality;
  aiCostClass: McfAiCostClass;
  executorAttestation: {
    scheme: McfCognitiveAttestationSchemeV1;
    trustRootId: string;
    signerId: string;
    keyId: string;
    channelBindingDigest: McfSha256Hex;
    signedPayloadDigest: McfSha256Hex;
    signature: McfBase64UrlNoPad;
    claims: {
      receiptContractId: string;
      receiptRevisionId: string;
      scheme: McfCognitiveAttestationSchemeV1;
      trustRootId: string;
      signerId: string;
      keyId: string;
      channelBindingDigest: McfSha256Hex;
      requestRef: McfContractRefV1;
      bindingRef: McfContractRefV1;
      attemptId: string;
      agentContractRef: McfContractRefV1;
      backendContractRef: McfContractRefV1;
      executorIdentity: string;
      executorCapabilityRef: McfContractRefV1;
      executionTransport: McfExecutionTransport;
      executorLocality: McfExecutorLocality;
      aiCostClass: McfAiCostClass;
      startedAt: string;
      completedAt: string;
      status: McfCognitiveExecutionStatusV1;
      usage: McfCognitiveExecutionUsageV1;
      validation: McfCognitiveExecutionValidationV1;
      artifactManifestDigest: McfSha256Hex;
    };
  };
  startedAt: string;
  completedAt: string;
  status: McfCognitiveExecutionStatusV1;
  usage: McfCognitiveExecutionUsageV1;
  validation: McfCognitiveExecutionValidationV1;
  artifacts: Array<{
    ref: string;
    digest: McfSha256Hex;
    mediaType: string;
    sizeBytes: number;
    locator: string;
    artifactType: string;
    producerRunId: string;
    provenance: McfContextProvenance[];
    retention: string;
    containsSecrets: false;
    containsChainOfThought: false;
  }>;
}
interface McfPlacementRequestV1
  extends McfTemporalEnvelopeV1, McfVersionedContractIdentityV1 {
  missionId: string;
  phaseId: string;
  taskId: string;
  attemptId: string;
  taskRequirementRef: McfContractRefV1;
  candidateWorkerCapabilityRefs: McfContractRefV1[];
  allowedLocalities: McfExecutorLocality[];
  securityContext: McfSecurityContextV1;
  authorityEnvelopeRef: McfContractRefV1;
  idempotencyKey: string;
}
interface McfPlacementReceiptCommonV1 extends McfVersionedContractIdentityV1 {
  placementRequestRef: McfContractRefV1;
  rejectedCandidateRefs: McfContractRefV1[];
  resolvedAt: string;
  configDigest: McfSha256Hex;
}
type McfPlacementReceiptV1 =
  | (McfPlacementReceiptCommonV1 & {
      status: "PLACED";
      selectedWorkerCapabilityRef: McfContractRefV1;
      fencingRequired: true;
      fencingToken: string;
    })
  | (McfPlacementReceiptCommonV1 & {
      status: "PLACED";
      selectedWorkerCapabilityRef: McfContractRefV1;
      fencingRequired: false;
      fencingToken: null;
    })
  | (McfPlacementReceiptCommonV1 & {
      status: "BLOCKED";
      selectedWorkerCapabilityRef: null;
      fencingRequired: false;
      fencingToken: null;
    });
```

Todo digest usa lowercase hex de 64 caracteres (`^[a-f0-9]{64}$`); assinatura usa base64url sem
padding. `requestRef.contentDigest` é
`SHA256(UTF8("MCF_COGNITIVE_EXECUTION_REQUEST_V1\n") || UTF8(JCS(request sem contentDigest)))`. O binding
`contentDigest` é
`SHA256(UTF8("MCF_EXECUTION_BINDING_V1\n") || UTF8(JCS(binding sem contentDigest)))`.
`artifactManifestDigest` é
`SHA256(UTF8("MCF_COGNITIVE_ARTIFACT_MANIFEST_V1\n") || UTF8(JCS(artifacts)))`, preservando a ordem
semântica do array; producer deve ordenar por `ref` e rejeitar duplicatas. Não existe formato
alternativo aceito silenciosamente.

Todos os valores top-level repetidos em `claims` — inclusive identidade, scheme/trust/signer/key,
channel binding, digests, eixos, timestamps, status, usage e validation — devem ser deep-equal ao
claim assinado. O payload assinado é o objeto `claims` completo, serializado por JSON
Canonicalization Scheme (RFC 8785), precedido pelo UTF-8/domain separator exato
`MCF_COGNITIVE_EXECUTION_ATTESTATION_V1\n`; os bytes assinados são
`UTF8(separator) || UTF8(JCS(claims))` e `signedPayloadDigest` é o SHA-256 lowercase-hex desses bytes.
NX-0 valida forma/vetores determinísticos e mismatches relacionais; NX-5 resolve a trust root/chave,
verifica Ed25519, compara metadata/claims e aplica anti-replay.

Os refs completos de Request, Binding, Agent, Backend e Executor Capability entram nos claims
assinados. NX0.7 resolve cada target e recalcula `requestRef.contentDigest` e
`bindingRef.contentDigest`; digest isolado não substitui identidade/revisão. O
`artifactManifestDigest` deve ser igual ao recálculo canônico de `artifacts`, e cada artifact exige
digest tipado, media type, tamanho e locator. Payload sem attestation não é um
`McfCognitiveExecutionReceiptV1` conforme: permanece somente como evidence/admission state
`UNVERIFIED`, sem crédito, até existir Receipt assinado válido.

Os claims assinam `receiptContractId/receiptRevisionId`, não o `contentDigest` do próprio Receipt:
isso evita uma referência criptográfica circular. Depois da assinatura, o Receipt completo recebe
seu `contentDigest` pela regra global; o checker exige que os dois campos assinados sejam iguais à
identidade top-level.

Placement Request contém identidade, requirements/candidates/authority/idempotency/tempo. Placement Receipt contém
rejections, worker selecionado ou nulo, revision/config digest, fencing e union discriminado
`PLACED | BLOCKED`. Um Binding finalized só aceita Receipt `PLACED`; request, worker e lineage devem
coincidir. Receipt `BLOCKED` jamais finaliza Binding e sempre carrega fencing nulo; Receipt `PLACED`
usa token não vazio somente quando a capability do worker declara fencing obrigatório.

- [ ] **Step 1: escrever testes de schema, fixtures, union e vetores JCS/domain-separator, mantendo mismatch como relação válida em JSON**
- [ ] **Step 2: rodar `corepack pnpm --filter @rsa/contracts exec vitest run test/mcf-nextgen-execution-placement.test.ts`**

Expected: FAIL por tipos/schemas ausentes.

- [ ] **Step 3: implementar envelopes e fixtures, sem adapter, rede ou stateful replay**
- [ ] **Step 4: repetir teste e typecheck**

Expected: PASS; fixtures `.relation-invalid` continuam schema-válidas para a Task NX0.7 rejeitá-las.

- [ ] **Step 5: commit**

```bash
git -C ../.. add apps/rede-social-agentes/packages/contracts schemas/nextgen schemas/fixtures/nextgen
git -C ../.. commit -m "feat(contracts): add cognitive execution and placement envelopes"
```

##### Task NX0.4 — Authority e Effects

**Files:**

- Create: `packages/contracts/src/mcf-effects.ts`
- Modify: `packages/contracts/src/index.ts`
- Create: `packages/contracts/test/mcf-nextgen-effects.test.ts`
- Create: `../../schemas/nextgen/{authority-envelope,effect-request-v2,effect-receipt-v2}.schema.json`
- Create: `../../schemas/fixtures/nextgen/{authority-envelope,effect-request-v2,effect-receipt-v2}.{valid,schema-invalid}.json`

**Interfaces:**

```ts
type McfAuthorityPrincipalV1 =
  | {
      kind: "AUTHENTICATED_HUMAN_ACCOUNT";
      accountId: string;
      authority: "LEANDRO";
      authorityBindingRef: McfTrustedAuthorityBindingRefV1;
    }
  | { kind: "AGENT"; agentContractRef: McfContractRefV1 }
  | { kind: "SERVICE"; serviceCapabilityRef: McfContractRefV1 };
interface McfAuthorityEnvelopeV1
  extends McfTemporalEnvelopeV1, McfVersionedContractIdentityV1 {
  principal: McfAuthorityPrincipalV1;
  delegationChain: McfContractRefV1[];
  missionId: string;
  taskId: string;
  attemptId: string;
  actions: string[];
  resources: string[];
  environments: string[];
  policyRefs: McfContractRefV1[];
  maxPaidAiCost: 0;
  humanGate: McfContractRefV1 | null;
}
interface McfEffectRequestV2
  extends McfTemporalEnvelopeV1, McfVersionedContractIdentityV1 {
  bindingRef: McfContractRefV1;
  authorityEnvelopeRef: McfContractRefV1;
  adapterCapabilityRef: McfContractRefV1;
  action: string;
  resource: string;
  environment: string;
  preconditions: string[];
  idempotencyKey: string;
  beforeRef: McfContractRefV1 | null;
  expectedAfter: string;
  readBackContract: McfContractRefV1;
}
```

`McfEffectReceiptV2` implementa `McfVersionedContractIdentityV1` e liga request ref, reservation,
status, before/after/read-back refs, reconciliation e timestamps.

O principal humano nunca é resolvido por nome fornecido no payload. `AUTHENTICATED_HUMAN_ACCOUNT`
exige `accountId` derivado da sessão autenticada e `authorityBindingRef` igual ao bootstrap binding
reservado/versionado configurado pelo servidor. Para ação que exige HUMAN_GATE, `humanGate` resolve um
`McfHumanDecisionReceiptV1` terminal, ligado ao mesmo account/binding, objeto, estado e digest; texto
`decidedBy: LEANDRO` fornecido pelo caller não satisfaz o envelope.

- [ ] **Step 1: escrever testes que rejeitam wildcard/escalation, gate ausente e campos desconhecidos**
- [ ] **Step 2: rodar `corepack pnpm --filter @rsa/contracts exec vitest run test/mcf-nextgen-effects.test.ts`**

Expected: FAIL.

- [ ] **Step 3: implementar contratos/schemas/fixtures sem dispatcher ou provider**
- [ ] **Step 4: repetir teste e typecheck**

Expected: PASS; attenuation relacional fica para NX0.7.

- [ ] **Step 5: commit**

```bash
git -C ../.. add apps/rede-social-agentes/packages/contracts schemas/nextgen schemas/fixtures/nextgen
git -C ../.. commit -m "feat(contracts): define attenuating authority and effect envelopes"
```

##### Task NX0.5 — Context, Human Decision e Completion

**Files:**

- Modify: `packages/contracts/src/mcf-context.ts`
- Create: `packages/contracts/src/mcf-human-decision.ts`
- Modify: `packages/contracts/src/index.ts`
- Create: `packages/contracts/test/mcf-nextgen-context-decision.test.ts`
- Create: `../../schemas/nextgen/{project-capsule-v2,capsule-version-pointer,memory-read-envelope,human-decision-request,human-decision-receipt,completion-contract}.schema.json`
- Create: `../../schemas/fixtures/nextgen/{project-capsule-v2,capsule-version-pointer,memory-read-envelope,human-decision-request,human-decision-receipt,completion-contract}.{valid,schema-invalid}.json`

**Interfaces:**

```ts
interface McfProjectCapsuleV2 extends McfVersionedContractIdentityV1 {
  schema_version: 2;
  derived_view: true;
  project_id: string;
  sources: Array<{ repository: string; commit_sha: string; path: string }>;
  generated_at: string;
  observed_at: string;
  freshness: McfContextFreshness;
  mission_id: string | null;
  phase_id: string | null;
  next_action: string;
  blockers: string[];
  provenance: McfContextProvenance[];
}
interface McfCapsuleVersionPointerV1 extends McfVersionedContractIdentityV1 {
  schema_version: 1;
  project_id: string;
  v1_path: string;
  v1_digest: string;
  v2_path: string;
  v2_digest: string;
  preferred_version: 1 | 2;
  cutover_revision: string;
  generated_at: string;
  source_revisions: {
    registry_revision: string;
    capsule_v1_revision: string;
    capsule_v2_revision: string;
  };
  provenance: McfContextProvenance[];
}
interface McfMemoryReadEnvelopeV1
  extends McfTemporalEnvelopeV1, McfVersionedContractIdentityV1 {
  projectId: string;
  operation: string;
  purpose: string;
  scope: string[];
  securityContext: McfSecurityContextV1;
  maxItems: number;
  maxResponseBytes: number;
  freshness: McfContextFreshness;
  provenance: McfContextProvenance[];
  payloadDigest: McfSha256Hex | null;
  persistPayload: false;
}
interface McfHumanDecisionRequestV1
  extends McfTemporalEnvelopeV1, McfVersionedContractIdentityV1 {
  missionId: string;
  taskId: string;
  attemptId: string;
  action: string;
  resource: string;
  objectRef: McfContractRefV1;
  stateRef: McfContractRefV1;
  specRef: McfContractRefV1;
  reason: string;
  options: Array<{ optionId: string; description: string }>;
  recommendation: string;
  risk: string;
  evidenceRefs: McfContractRefV1[];
  requestedAuthority: "LEANDRO";
  supersedesRequestRef: McfContractRefV1 | null;
}
interface McfHumanDecisionReceiptV1 extends McfVersionedContractIdentityV1 {
  requestRef: McfContractRefV1;
  decision: "APPROVED" | "REJECTED";
  selectedOptionId: string | null;
  authorityProof: {
    authority: "LEANDRO";
    accountId: string;
    authorityBindingRef: McfTrustedAuthorityBindingRefV1;
    sourceRef: string;
  };
  decidedAt: string;
  evidenceRefs: McfContractRefV1[];
  supersedesReceiptRef: McfContractRefV1 | null;
}
interface McfCompletionContractV1 extends McfVersionedContractIdentityV1 {
  missionId: string;
  requiredOutputRefs: McfContractRefV1[];
  requiredEvidenceRefs: McfContractRefV1[];
  requiredReviewRefs: McfContractRefV1[];
  requiredGates: string[];
  permittedBlockerCodes: string[];
}
```

O Graph aponta para o Completion Contract, mas o Completion Contract não aponta de volta para o
Graph; isso evita digests autorreferentes. Sua aplicabilidade é validada por `missionId` e pelo ref
exato carregado na revisão do Graph.

Capsule v2, pointer e Memory Read expõem a identidade comum, portanto qualquer ref futuro resolve
tipo/revisão/digest sem criar alias. Memory Read é allowlisted, limitado por itens/bytes e fixa
`persistPayload: false`; `payloadDigest` autentica a resposta transitória, mas o payload não entra no
MCF. Human Request/Receipt vinculam
object/state/spec/digest/opções/evidence/expiry/supersession e `LEANDRO`. Receipt exige provenance
server-derived de conta autenticada e binding reservado; nome/ID/sourceRef fornecidos pelo corpo não
recebem confiança. O Completion Contract é uma declaração imutável de critérios; `PENDING | PROVEN`
é resultado do admission/completion state e dos receipts já pertencentes ao runtime, não campo mutável
do contrato. Criar um Completion Receipt público separado reabre formalmente o catálogo 17/22.

O checker HUMAN_GATE resolve a cadeia inteira
`AuthorityEnvelope.humanGate -> HumanDecisionReceipt.requestRef -> HumanDecisionRequest`. Envelope,
Request e Receipt devem concordar em mission/task/attempt, action/resource, conta/binding, objeto,
estado, spec/digests, validade e lineage de supersessão. `APPROVED` exige `selectedOptionId` existente
no Request; `REJECTED` exige `selectedOptionId=null`. Receipt expirado, superseded ou referente a
estado/spec anterior nunca autoriza o efeito atual.

- [ ] **Step 1: caracterizar que Registry/Capsule v1 continuam idênticos e que pointer não valida como v1**
- [ ] **Step 1a: se PR #174 ou contrato equivalente estiver em `main`, mapear sua semântica contra Project Capsule v1/v2, Agent Contract, Authority Envelope e Completion Contract; reutilizar/adaptar um único contrato ou reabrir F1.4/catálogo antes de código**
- [ ] **Step 1b: testar a cadeia HUMAN_GATE ponta a ponta, options, expiry/supersession e a resolução do Completion Contract referenciado pelo graph**
- [ ] **Step 2: rodar `corepack pnpm --filter @rsa/contracts exec vitest run test/mcf-nextgen-context-decision.test.ts`**

Expected: FAIL porque v2 ainda não existe; characterization v1 permanece PASS.

- [ ] **Step 3: implementar somente tipos/schemas/fixtures aditivos**
- [ ] **Step 4: repetir teste, typecheck e `corepack pnpm --filter @rsa/contracts exec vitest run test/mcf-context.test.ts`**

Expected: PASS para v1 e v2 contracts-only.

- [ ] **Step 5: commit**

```bash
git -C ../.. add apps/rede-social-agentes/packages/contracts schemas/nextgen schemas/fixtures/nextgen
git -C ../.. commit -m "feat(contracts): add additive context and decision contracts"
```

##### Task NX0.6 — Assurance Q13/Q14

**Files:**

- Create: `packages/contracts/src/mcf-assurance.ts`
- Modify: `packages/contracts/src/index.ts`
- Create: `packages/contracts/test/mcf-nextgen-assurance.test.ts`
- Create: `../../schemas/nextgen/{evaluation-contract,portability-claim,portability-receipt}.schema.json`
- Create: `../../schemas/fixtures/nextgen/{evaluation-contract,portability-claim,portability-receipt}.{valid,schema-invalid}.json`

**Interfaces:**

```ts
interface McfEvaluationContractV1 extends McfVersionedContractIdentityV1 {
  hypothesis: string;
  evaluationQuestion: string;
  candidate: McfContractRefV1;
  baseline: McfContractRefV1;
  baselineMode:
    "CONTROLLED_COMPONENT" | "EQUAL_BUDGET" | "PRACTICAL_ALTERNATIVE";
  scenarioPackVersion: string;
  controlledFactors: string[];
  intentionallyDifferentFactors: string[];
  hardConstraints: string[];
  metrics: string[];
  graderContract: McfContractRefV1;
  repetitionPlan: string;
  costAccounting: { maxPaidAiCost: 0 };
  decisionRule: string;
  generalizationScope: string;
  predeclaredAt: string;
}
type McfPortabilityLayer =
  | "RUNTIME"
  | "PROVIDER"
  | "DATA"
  | "OPERATIONAL"
  | "PROJECT_DOMAIN"
  | "CONTEXT"
  | "EXIT";
```

Portability Claim exige as sete layers, compatibility envelope, artifact, clean room, migration
checkpoint, authority rebinding e negative tests. Receipt liga o claim digest ao nível
`DECLARED | CONFORMANCE_TESTED | MIGRATION_PROVED | FIELD_PROVED` e nunca concede authority.
Claim e Receipt implementam `McfVersionedContractIdentityV1`; o Receipt carrega o `claimRef` exato,
sem alias de digest.

- [ ] **Step 1: escrever testes de predeclaration, custo zero, sete layers e ausência de authority grant**
- [ ] **Step 2: rodar `corepack pnpm --filter @rsa/contracts exec vitest run test/mcf-nextgen-assurance.test.ts`**

Expected: FAIL.

- [ ] **Step 3: implementar contracts/schemas/fixtures mínimos**
- [ ] **Step 4: repetir teste e typecheck**

Expected: PASS.

- [ ] **Step 5: commit**

```bash
git -C ../.. add apps/rede-social-agentes/packages/contracts schemas/nextgen schemas/fixtures/nextgen
git -C ../.. commit -m "feat(contracts): add evaluation and portability contracts"
```

##### Task NX0.7 — Inventário 22/22, conformance pura, segurança, CI e catálogo

**Files:**

- Create: `packages/contracts/src/mcf-nextgen-contract-map.ts`
- Create: `packages/contracts/src/mcf-conformance.ts`
- Modify: `packages/contracts/src/index.ts`
- Modify: `packages/contracts/package.json`
- Create: `packages/contracts/test/mcf-nextgen-inventory.test.ts`
- Create: `packages/contracts/test/mcf-nextgen-conformance.test.ts`
- Create: `../../schemas/nextgen/contract-catalog.json`
- Create: `../../docs/contracts/MCF-NEXTGEN-CONTRACT-CATALOG.md`
- Create: `../../.github/workflows/mcf-nextgen-contract-conformance.yml`

**Interfaces:**

```ts
type McfConformanceResult =
  { ok: true; issues: [] } | { ok: false; issues: McfConformanceIssue[] };

declare function checkMcfTemporalEnvelopeV1(
  envelope: McfTemporalEnvelopeV1,
  now: string,
): McfConformanceResult;
declare function checkMcfReferenceResolutionV1(
  catalog: unknown,
  contracts: readonly unknown[],
): McfConformanceResult;
declare function checkMcfModelBackendEligibilityV1(
  contract: McfModelBackendContractV1,
  now: string,
): McfConformanceResult;
declare function checkMcfExecutionBindingFinalizationV1(
  candidate: McfExecutionBindingV1,
  finalized: McfExecutionBindingV1,
  placementRequest: McfPlacementRequestV1,
  placementReceipt: McfPlacementReceiptV1,
  now: string,
): McfConformanceResult;
declare function checkMcfCognitiveExecutionReceiptStructureV1(
  binding: McfExecutionBindingV1,
  request: McfCognitiveExecutionRequestV1,
  backend: McfModelBackendContractV1,
  receipt: McfCognitiveExecutionReceiptV1,
  now: string,
): McfConformanceResult;
declare function checkMcfAuthorityAttenuationV1(
  parent: McfAuthorityEnvelopeV1,
  child: McfAuthorityEnvelopeV1,
  now: string,
): McfConformanceResult;
declare function checkMcfBindingAuthorityWithinAgentCeilingV1(
  agent: McfAgentContractV1,
  binding: McfExecutionBindingV1,
  envelope: McfAuthorityEnvelopeV1,
  now: string,
): McfConformanceResult;
declare function checkMcfCapsulePointerV1(
  registry: McfProjectRegistryEntry,
  capsuleV1: McfProjectCapsule,
  capsuleV2: McfProjectCapsuleV2,
  pointer: McfCapsuleVersionPointerV1,
): McfConformanceResult;
declare function checkMcfHumanGateChainV1(
  envelope: McfAuthorityEnvelopeV1,
  request: McfHumanDecisionRequestV1,
  receipt: McfHumanDecisionReceiptV1,
  reservedHumanAccountId: string,
  trustedAuthorityBindingRef: McfTrustedAuthorityBindingRefV1,
  now: string,
): McfConformanceResult;
declare function checkMcfCompletionAdmissionV1(
  graph: McfMissionGraphPlanV1,
  contract: McfCompletionContractV1,
  runtimeEvidence: readonly McfContractRefV1[],
): McfConformanceResult;
declare function checkMcfEvaluationRevisionV1(
  previous: McfEvaluationContractV1,
  next: McfEvaluationContractV1,
): McfConformanceResult;
declare function checkMcfPortabilityReceiptV1(
  claim: McfPortabilityClaimV1,
  receipt: McfPortabilityReceiptV1,
): McfConformanceResult;
```

O contract catalog possui exatamente 17 famílias e 22 contratos concretos e, para cada contrato,
type/export, schema, fixture válida e fixture schema-invalid. Conformance relacional rejeita
spoof/digest/attempt, authority escalation, expiry, pointer sem generation/provenance/source revisions,
binding authority fora do ceiling estável do Agent Contract, finalização sobre Placement Receipt
`BLOCKED`, worker/request/lineage divergentes, eixos diferentes entre Binding/Request/backend/Receipt/
claims, metadata ou campos críticos fora da assinatura, canonicalização/digest inválidos, mutação post
human-gate por nome ou conta/binding/source divergentes, cadeia Envelope→Receipt→Request incompatível,
option/expiry/supersession inválidos, refs não resolvíveis ou de tipo incorreto, mutação post hoc Q13 e Receipt Q14
divergente, ou conclusão sem outputs/evidence/reviews/gates exigidos e sem blocker permitido. A função estrutural do Receipt cognitivo nunca concede origin
proof. Trust-root/key
resolution, channel binding, assinatura, replay stateful, admissão de origem, DB, provider e runtime
continuam proibidos no NX-0 e pertencem ao NX-5.

A contagem é exclusiva aos contratos públicos novos da F1.4. `HumanControlCheckpoint`,
`HumanAuthorityProof`, `McfTrustedAuthorityBindingRefV1`, o trace GUI/window do PR #179 e o routing
decision record interno são primitives/value objects/evidence já existentes ou internos, não entradas
23+. Se qualquer um cruzar boundary como contrato público independente, o gate falha até nova
disposition F1.4, contagem, schema e fixtures próprios.

- [ ] **Step 1: escrever testes que falham com uma entrada removida e com cada fixture `.relation-invalid`**
- [ ] **Step 2: rodar os dois testes e observar FAIL por catalog/functions ausentes**

Run: `corepack pnpm --filter @rsa/contracts exec vitest run test/mcf-nextgen-inventory.test.ts test/mcf-nextgen-conformance.test.ts`

- [ ] **Step 3: implementar catalog/map/checks puros e script `test:nextgen`**

```json
{
  "test:nextgen": "vitest run test/mcf-nextgen-*.test.ts"
}
```

- [ ] **Step 4: adicionar workflow zero-cost com dependency audit e Gitleaks pinado**

```bash
curl -fsSLO https://github.com/gitleaks/gitleaks/releases/download/v8.30.1/gitleaks_8.30.1_linux_x64.tar.gz
echo "551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb  gitleaks_8.30.1_linux_x64.tar.gz" | sha256sum -c -
tar -xzf gitleaks_8.30.1_linux_x64.tar.gz gitleaks
./gitleaks git --redact --exit-code 1 .
corepack pnpm audit --prod --audit-level high
```

O workflow instala Node/pnpm nas versões globais deste plano, executa `test:nextgen`, typecheck/build,
audits e publica somente resultado/digests sanitizados. Nenhuma ação existente é declarada supply-chain
pinada por inferência; o pin acima cobre explicitamente o binário Gitleaks.

- [ ] **Step 5: executar gates NX-0 e regressão completa**

Run: `corepack pnpm --filter @rsa/contracts test:nextgen && corepack pnpm --filter @rsa/contracts typecheck && corepack pnpm --filter @rsa/contracts build && corepack pnpm audit --prod --audit-level high && corepack pnpm verify`

Expected: PASS, 22/22 contratos cobertos, zero runtime/provider call.

- [ ] **Step 6: revisar catálogo gerado contra a tabela F1.4 e commit**

```bash
git -C ../.. add apps/rede-social-agentes/packages/contracts schemas/nextgen schemas/fixtures/nextgen docs/contracts .github/workflows/mcf-nextgen-contract-conformance.yml
git -C ../.. commit -m "test(contracts): enforce NextGen contract conformance"
```

### NX-1 — Registry v2 e profile dos 29 agentes

**Objetivo:** evoluir o Registry existente e materializar o profile oficial sem criar outra fonte de verdade.

Arquivos candidatos:

```text
context/capabilities/
context/agents/leandro-default-team-profile.yaml
apps/rede-social-agentes/apps/server/src/mcf-context/capability-registry.loader.ts
apps/rede-social-agentes/apps/server/src/mcf-context/
docs/agentes/
docs/matrices/
```

Entregas:

- loader dual-read de capability v1/v2;
- mapping dos 29 contratos em prosa para Agent Contracts;
- profile `LEANDRO_DEFAULT_TEAM_PROFILE`;
- validation receipt de paridade entre matriz, arquivos e profile;
- model/worker/tool capabilities apenas como registros disabled/unverified quando não houver evidência;
- nenhuma claim de 29 processos ou modelos independentes.

Testes mínimos:

- 29/29 Agent Contracts correspondem à matriz canônica;
- nenhuma duplicação de `agent_id`;
- profile ausente não quebra o Core genérico;
- current loaders v1 continuam funcionando;
- self-claim sem provenance não fica `VERIFIED`;
- unknown/stale permanece fail-closed.

Gate: `NX1_REGISTRY_PROFILE_PASS`.

Rollback: desligar reader v2 e remover profile derivado; Registry v1 permanece canônico.

### NX-2 — Requirements, Graph e Binding em shadow

**Objetivo:** produzir plano e binding candidato determinísticos sem executar modelo, tool ou efeito.

Arquivos candidatos:

```text
apps/rede-social-agentes/apps/server/src/mcf-runtime/task-requirement.builder.ts
apps/rede-social-agentes/apps/server/src/mcf-runtime/mission-graph.compiler.ts
apps/rede-social-agentes/apps/server/src/mcf-runtime/execution-binding.service.ts
apps/rede-social-agentes/apps/server/src/mcf-runtime/model-backend-policy.ts
```

Entregas:

- Task Requirements derivados de input tipado/contratos vigentes;
- graph versionado com digest estável;
- joins, attempts, budgets e Completion Contract;
- policy filter para agent/backend/tool e requisitos de worker/placement;
- binding `CANDIDATE_ELIGIBLE` sem worker/Placement Receipt e materialmente não executável;
- `SHADOW_ONLY=true` materialmente imposto;
- estado Human Control/paused vigente é input obrigatório do shadow resolver e produz zero nova ação;
- comparação entre plano shadow e fluxo v1.1 real;
- evidence/metrics sem registrar chain-of-thought.

Testes mínimos:

- mesmo input/revisão produz o mesmo digest;
- cycle, fanout, depth, retry ou deadline inválidos são rejeitados;
- conflicting write sets são serializados;
- reads independentes podem ser candidatos a paralelo, mas não executam ainda;
- no eligible binding produz `BLOCKED_NO_ELIGIBLE_BINDING`, não fallback, e possui mapping versionado para o estado v1.1 preservado;
- candidato que contenha worker/Placement Receipt ou que seja aceito para execução é rejeitado;
- graph exhausted sem Completion Contract produz `COMPLETION_UNPROVEN`;
- shadow produz zero ExternalActionRequest e zero provider/model call;
- missão pausada não produz graph advancement, candidate binding, routing record nem nova reservation.

Gate: `NX2_SHADOW_ZERO_EFFECT_PASS`.

Rollback: remover/disable shadow projection; MissionRuntime atual não muda.

### NX-3 — Context e read paths reconciliados

**Objetivo:** consumir Context Fabric, Ledger read, Cloud local read e TriView sem material action.

Entregas:

- Project Capsule v1/v2 dual-read;
- `.mcf/project-capsule.yaml` e `context/projects/*.yaml` permanecem estritamente v1;
- `.mcf/project-capsule.v2.yaml` é sidecar derived descoberto somente pela entrada determinística `context/capsule-version-pointers/<project_id>.yaml`, validada como `McfCapsuleVersionPointerV1` e versionada no MCF;
- resolução v2 é `Registry v1 -> pointer -> sidecar/digest`; ausência do pointer preserva v1 e pointer inválido bloqueia a claim v2;
- um único pipeline lógico gera a representação compatível v1 e a projeção v2; writer v2 independente é proibido;
- Context Recovery inclui referências de Agent/Capability profile sem promover currentness;
- `McfMemoryReadEnvelopeV1` no adapter Ledger atual;
- Cloud local read continua executável/root/operation/env allowlisted;
- TriView recebe read models de graph/binding/capability, todos rotulados por freshness;
- checkpoint/paused state é exposto somente como read model derivado, sem transformar TriView/GUI em
  authority ou command surface;
- no-store, size/time/rate/bulkhead e pairwise credentials preservados.

Testes mínimos:

- recovery estrutural fresh 4/4;
- Capsule v1 e v2 não colidem entre projetos;
- leitor v1 real continua recuperando 4/4 depois de sidecars/pointers serem publicados;
- cutover v2 é bloqueado até inventário de leitores v1 e prova de projeção compatível ou retirada completa;
- rollback desliga reader v2/restaura preferência v1 sem restaurar ou reescrever a Capsule v1;
- raw Ledger read continua bloqueada por default;
- payload de memória não é persistido no MCF;
- Cloud fixture preserva hashes pré/pós e cleanup;
- TriView não expõe connect/authorize/execute/revoke/write;
- read model de Human Control não permite resume nem fabrica provenance de autoridade;
- source indisponível degrada read, mas bloqueia efeito dependente.

Gate: `NX3_ECOSYSTEM_READONLY_PASS`.

Rollback: feature flags/read models off; adapters atuais permanecem intactos.

### NX-4 — Mission Graph sobre runtime atual

**Objetivo:** compilar graphs aprovados para fases/submissões existentes, sem segundo runtime.

Sequência de ativação:

1. single-node read-only;
2. multi-node sequencial read-only;
3. joins determinísticos de reads independentes;
4. bounded parallel reads quando os read/write sets provarem segurança;
5. somente depois avaliar tasks internas reversíveis;
6. efeitos externos continuam no dispatcher atual.

Entregas:

- mapping graph node → mission phase/submission;
- attempt identity compatível com ledger atual;
- pause/resume/replan versionados;
- pausa Human Control persistida atomicamente com transition-ledger append e checkpoint do último
  safe point, preservando ação em voo separadamente;
- admissão do comando e retomada derivadas da conta humana reservada autenticada e provenance
  server-side; `actorId=leandro` textual nunca autentica;
- retomada somente por instrução humana autenticada explícita, com nova revisão e invalidação de
  authorizations/bindings stale quando aplicável;
- fairness/admission/backpressure;
- completion policy vinculada ao contract;
- observabilidade de bloqueios e joins.

Testes mínimos:

- restart preserva readiness/attempt sem duplicar execução;
- stale output de plano antigo é rejeitado;
- join espera todas as dependências obrigatórias;
- cancel/pause não deixa task material órfã;
- restart preserva o estado pausado e não admite novo attempt, request, placement ou effect;
- operação já em voo ao receber Human Control chega ao safe point e entra em reconciliation; nunca
  recebe retry cego ou duplicação;
- resume repetido é idempotente e somente a conta humana reservada pode produzir a nova revisão;
- no-progress budget encerra loop;
- hierarquia pai/submissão e testes v1.1 não regressam;
- nenhuma nova tabela até um conformance finding provar necessidade.

Gate: `NX4_EXISTING_RUNTIME_GRAPH_PASS`.

Rollback: desativar compiler/feature flag; dados existentes permanecem interpretáveis pelo runtime atual compatível com v1.2.0.

### NX-5 — Backends e execução cognitiva zero-cost em lab

**Objetivo:** provar routing e execução cognitiva governada sem cobrança, sem confundir ChatGPT host
com API automática e sem aceitar evidence arbitrária como trabalho de agente.

Eixos ortogonais:

- transporte: `HOST_MEDIATED` (a superfície do usuário transporta conscientemente) ou
  `PROGRAMMATIC` (adapter invoca por contrato);
- localidade: `HOST_BOUNDARY`, `IN_PROCESS_LOCAL` ou `REMOTE`;
- custo de IA: `HOST_ENTITLEMENT`, `LOCAL_COMPUTE` ou `FREE_VERIFIED_API`.

Cada request/binding/Receipt fixa exatamente um valor de cada eixo. Local/remote não define custo e
free não define localidade. `REMOTE` permanece inelegível neste work package e exige placement/data/
autorização separados.

Entregas:

- Model Backend Registry;
- verifier de price/quota/freshness;
- policy `paid_fallback=false`;
- routing decision record interno com candidatos aceitos/recusados; ele é evento/derived evidence do
  runtime, não um 23º contrato público nem `Receipt` do catálogo. Se precisar cruzar boundary,
  F1.4/catálogo/contagem devem ser reabertos antes da implementação;
- `McfCognitiveExecutionRequestV1` e `McfCognitiveExecutionReceiptV1` publicados em NX-0;
- registry de executor adapters autenticados, capability-bound e disabled-by-default;
- binding inclui executor capability ref/digest, transport/locality/cost class e output-contract digest;
- finalizador restrito a `HOST_BOUNDARY`/`IN_PROCESS_LOCAL`: resolve o placement sem Cloud adapter,
  produz Placement Receipt e novo binding `FINALIZED_ELIGIBLE`; candidato nunca é executado;
- trust roots/key revisions versionadas fora do Receipt e channel binding por adapter;
- verifier valida assinatura e claims sobre request/binding/attempt/agent/backend/executor,
  transport/locality/cost class e artifact
  manifest, consulta replay state e produz um resultado interno ligado à policy revision;
- admission API recebe somente esse resultado confiável do verifier; flags declaradas pelo emissor ou
  conformance estrutural do NX-0 nunca promovem origin proof;
- durable attempt reservation antes de qualquer invocação e exatamente um resultado canônico por attempt;
- wiring no `ChatRuntimeBridgeService`/`SkillExecutor` atual para consumir Receipt verificado, sem segundo runtime;
- manifest de artifact com digest, media type, tamanho, locator/provenance e retention; payload sensível não entra no transition ledger;
- budget/timeout/retry e output schema;
- nenhuma credencial em logs/evidence;
- admission verifica o estado Human Control imediatamente antes de reservar e imediatamente antes de
  invocar; missão pausada não cria attempt nem Cognitive Execution Request.

Testes mínimos:

- paid/trial/billing-account-required é rejeitado;
- preço ou quota unknown/stale bloqueia;
- free quota exhausted bloqueia sem fallback;
- backend incompatível não é selecionado por custo;
- 0 paid calls, 0 paid embeddings, 0 charge;
- conformance E2E bloqueante prova `READY_AGENT -> request -> executor fixture -> artifact/Receipt validado -> transição canônica`, sem atribuir realidade/autoria ao fixture;
- um run lab não simulado com executor zero-cost verificável prova origem dentro do escopo exato do Receipt antes de qualquer crédito de agente;
- Receipt ausente, malformed, spoofed, expirado ou de outro binding/attempt mantém a fase bloqueada;
- assinatura/chave/trust root/channel binding inválidos, claim divergente ou nonce já consumido são
  rejeitados antes da admissão;
- identidade do executor fora do claim assinado, mismatch top-level/claim, payload não canônico ou
  domain separator divergente são rejeitados;
- status/timestamps/usage/validation ou metadata de trust/key/channel alterados fora dos claims são
  rejeitados; Binding, Request, backend, Receipt e claims devem concordar nos três eixos;
- Placement Receipt `BLOCKED`, worker divergente ou lineage candidate→finalized incorreto não cria
  Binding executável;
- `execution_evidence` legacy isolada não satisfaz o gate NextGen;
- timeout, callback duplicado e restart não duplicam execução nem artifact canônico;
- output fora do schema ou artifact com digest divergente é rejeitado;
- host-mediated emite request/estado de espera e nunca é anunciado como chamada automática; retorno sem attestation permanece `UNVERIFIED`;
- troca de backend/executor exige novo binding ou replan; output não abre rota direta para tool/effect;
- prompt injection não muda policy/authority;
- pausa concorrente entre reservation e invocation reconcilia a reservation sem chamar o executor;
  restart durante pausa permanece fechado até resume autenticado explícito.

Gates:

```text
NX5_COGNITIVE_EXECUTOR_CONFORMANCE_PASS
  + NX5_ZERO_PAID_AI_PASS
  + GATE-RUNTIME-REALITY scoped SATISFIED
  = NX5_COGNITIVE_EXECUTION_LAB_PASS
```

`GATE-RUNTIME-REALITY` fica escopado por `agent_contract_digest`, `executor_capability_digest`,
`skill_scope`, `artifact_contract_digest`, `observed_at` e `expires_at`. Um run não prova 29/29 nem
independência Q6. Se não existir executor zero-cost e attestable, o estado canônico permanece
`BLOCKED_NO_ELIGIBLE_BINDING` com `reason_code=NO_VERIFIABLE_COGNITIVE_EXECUTOR`, sem fallback pago,
evidência manual ou simulação.
O receipt live da Issue #164 que satisfaz identidade/configuração Brainbase não satisfaz o escopo de
task run/artifact origin desta gate. Como esse provider declara runs billable, ele permanece inelegível
para NX-5 sob `max_paid_ai_cost=0`, independentemente de autorização em outro lineage.

O PR #171 documenta um canal MESTRE↔Ox via DSH com E2E real e faz dele um executor-adapter candidato
para uma futura qualificação NX-5. Isso não o registra no Model Backend/Capability Registry, não cria
Execution Binding/Receipt NextGen e não prova custo zero: o rótulo observado
`x-preview-f-free` precisa de price/quota/data-policy/billing/fallback verification fresca. Qualquer
uso exige missão e autorização próprias, porque a evidência atual envolve deployment externo,
túnel/VPS e credenciais fora deste boundary. O primeiro E2E NX-5 continua sendo fixture local; DSH
só entra depois, disabled-by-default, pelo mesmo contract/trust/conformance gate.

Os probes do branch Cloud Hermes `mcf/hermes-relay-bootstrap-20260823@23e4e6c` não contam como
conformance nem executor elegível: Codex ficou bloqueado por quota, computer-use e provider local
falharam, e Qwen `:free` exigiu uma chave ausente. NX-5 não usa esse branch; qualquer reavaliação é
uma missão separada, contemporânea e fail-closed. Localidade `REMOTE` permanece fora deste work
package e do NX-6 local.

Rollback: remover configuração/credenciais de lab e desligar adapter; host-mediated permanece.

### NX-6 — Placement Cloud local em lab

**Objetivo:** estender o resolver já usado para host/in-process e produzir Placement Request/Receipt
para worker Cloud local descartável.

Entregas:

- eligibility por locality, data classification, capability e policy;
- binding de revision/artifact/config digest;
- lease/fencing quando necessário;
- Cloud local read/worker em fixture descartável;
- read-back e cleanup;
- G2-A remoto, G2-B, SSH, VPS e NODE-01 materialmente bloqueados;
- nenhuma Placement Request/Receipt nova é produzida para missão pausada; placement já em voo entra em
  reconciliation/read-back sem retry cego.

Testes mínimos:

- remote candidate sem autorização é rejeitado;
- placement não concede authority;
- drift de executable/config/hash bloqueia;
- timeout/unknown effect exige reconciliation, não retry cego;
- before/after integrity e cleanup passam;
- nenhuma conexão SSH/VPS ocorre;
- pause/restart não perde o bloqueio nem duplica lease/fencing/placement.

Gate: `NX6_LOCAL_PLACEMENT_PASS`.

Rollback: desativar placement adapter; Cloud repo/runtime remoto permanece inalterado.

### NX-7 — Effect Request/Receipt v2

**Objetivo:** estender o dispatcher atual somente depois de NX-0 a NX-6 e de autorização específica para um efeito reversível.

Entregas:

- binding digest e AuthorityEnvelope no request;
- version/state-bound admission;
- idempotency/preconditions/read-back;
- reconciliation e tombstone para resultado unknown;
- compatibility adapter para requests v1;
- nenhuma rota direta fora do ExternalActionDispatcher;
- estado Human Control bloqueia novas effect reservations/dispatches; reservation já durável entra em
  reconciliation/read-back e somente o resultado observado fecha seu estado.

Testes mínimos:

- missão pausada produz zero nova reservation, adapter call ou provider mutation;
- pausa entre reservation e dispatch impede dispatch e preserva estado reconciliável;
- efeito já em voo não é repetido após pause/restart;
- resume autenticado explícito cria nova revisão; nome/caller payload e resume duplicado não ampliam authority.

Gate: `NX7_GOVERNED_EFFECT_V2_PASS`.

Rollback: dispatcher aceita somente v1 preservado; qualquer estado v2 continua interpretável por mapping versionado.

NX-7 não inclui Cloud G2-B, Ledger write, produção ou dado real.

### NX-8 — Evaluation Contract e prova de valor Q13

**Objetivo:** impedir avaliação post hoc e produzir evidência comparativa honesta sobre o valor de cada
complexidade material.

O schema nasce em NX-0. Cada avaliação possui duas fases obrigatórias:

1. **design/freeze**, antes do primeiro run do candidato contra o baseline;
2. **execution/report**, somente depois de o boundary avaliado possuir revisão e artifact identity exatos.

Campos mínimos da instância:

```yaml
evaluation_contract:
  hypothesis:
  evaluation_question:
  candidate:
  baseline:
  baseline_mode:
  scenario_pack_version:
  controlled_factors:
  intentionally_different_factors:
  hard_constraints:
  metrics:
  grader_contract:
  repetition_plan:
  cost_accounting:
  decision_rule:
  generalization_scope:
```

Entregas:

- contrato e digest publicados antes do primeiro resultado;
- baseline crível entre `CONTROLLED_COMPONENT`, `EQUAL_BUDGET` ou `PRACTICAL_ALTERNATIVE`;
- development/regression/holdout/field sets classificados;
- hard constraints avaliadas antes de score agregado;
- scorecard com outcome, reliability, human effort, time, marginal/structural cost, rework,
  continuity, recovery e framework overhead;
- resultado `BENEFICIAL`, `NON_INFERIOR`, `TRADEOFF`, `REGRESSED`,
  `DISQUALIFIED_HARD_CONSTRAINT` ou `INCONCLUSIVE`;
- evidence/receipt vinculado a candidate, baseline, grader, scenario e revisões exatas.

Testes/gates:

- `NX8_EVALUATION_DESIGN_FROZEN` deve passar antes do primeiro run material;
- mudança após resultado cria nova revisão/lineage e não sobrescreve o contrato anterior;
- self-grading não é evidência única quando não há ground truth determinístico;
- uma execução não vira performance; repetition/uncertainty seguem o contrato;
- critical failure não desaparece em média;
- custo contabiliza overhead do framework e comprova zero API/embedding/cobrança de IA paga;
- `INCONCLUSIVE` é resultado válido, mas não sustenta claim de superioridade ou sunset.

Gate de fechamento: `NX8_Q13_VALUE_EVIDENCE_COMPLETE` — significa evidência íntegra, não que “MCF
venceu”.

Rollback: remover somente harness/fixtures do candidato; contratos e receipts publicados permanecem
como história. Nenhum resultado de avaliação concede authority ou ativa runtime.

### NX-9 — Portability Matrix, conformance e receipt Q14

**Objetivo:** provar claims de portabilidade por camada sem confundir instalação, recovery 4/4 ou
containerização com portabilidade integral.

Matriz obrigatória por claim:

```text
RUNTIME
PROVIDER
DATA
OPERATIONAL
PROJECT_DOMAIN
CONTEXT
EXIT
```

Entregas:

- `McfPortabilityClaimV1` congelado antes do teste, com artifact digest e compatibility envelope;
- classificação esperada entre `DECLARED`, `CONFORMANCE_TESTED`, `MIGRATION_PROVED` e
  `FIELD_PROVED`;
- conformance suite provider-independent onde aplicável;
- negative tests para capability, schema, policy, data boundary ou authority incompatíveis;
- clean-room sem working tree, chat memory, arquivo oculto ou ajuste manual não documentado;
- migration checkpoint para state version, transition cursor, evidence, config e policy;
- tratamento explícito de in-flight work, attempts, fencing, idempotency e unknown effects;
- revalidação/reemissão de HUMAN_GATE, authority binding e credentials no destino;
- export/exit em formatos documentados e interpretáveis;
- `McfPortabilityReceiptV1` com integridade, intervenções, dependências ocultas, recovery e estado final;
- prova técnica e utilidade externa reportadas separadamente.

Testes/gates:

- `NX9_PORTABILITY_CLAIM_FROZEN` passa antes do primeiro run;
- resultado por camada é `SUPPORTED`, `MIGRATABLE`, `INCOMPATIBLE` ou `BLOCKED_WITH_REASON`;
- import segue `IMPORT -> VALIDATE -> RECONCILE -> ACTIVATE`, sem efeito material antes de ativação;
- migração não repete silenciosamente efeito material;
- target sem capability/policy requerida falha fechado;
- semantic equivalence e evidence provenance são verificadas;
- recovery 4/4 conta somente para a camada Context;
- nenhum provider live, dado real, VPS ou produção entra sem autorização própria.

Gate de fechamento: `NX9_Q14_PORTABILITY_RECEIPT_COMPLETE` por claim. Cutover ou sunset exige o nível
de evidência declarado e todas as preconditions da dependency/disposition matrix; um Receipt parcial
não autoriza generalização.

Rollback: destruir apenas ambientes clean-room descartáveis e desativar harness/adapters de teste;
preservar claims/receipts e manter v1.1 canônico.

## 5. Lineages paralelos e boundaries separados

| Linha                              | Relação                                                                      | Regra                                                                                                                     |
| ---------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Context Fabric / #147              | Fundação reutilizada                                                         | Não reimplementar Registry/Capsule/recovery.                                                                              |
| Mission Control / #141             | Consumidor de read models                                                    | Não implementar UI/commands nesta missão sem autorização própria.                                                         |
| Cognitive memory / #164            | O Ledger possui write provider-side; integração MCF/live é separada          | Preservar decisões já aprovadas e ler a Issue live; não inferir authN/authZ, integração, dados reais, semver ou ativação. |
| MESTRE↔Ox DSH / PR #171            | Canal externo E2E atual; adapter candidato                                   | Preservar evidência; nenhum binding/trust/cost/origin NextGen é inferido.                                                 |
| Agent Continuity Capsule / PR #174 | Draft concorrente não canônico                                               | Se mergear, equivalence/disposition antes de NX-0; nenhum segundo Capsule/state/memory writer.                            |
| Human Control/GUI / PRs #175/#184  | Governança v1.2 + primitive interna + gate autenticado de chat pré-bootstrap | Preservar precedência/characterization; não inferir pausa persistente de missão nem 23º contrato.                         |
| GUI/window / PRs #179 e #180       | Schema/fixtures/qualifier e status correction mergeados                      | Reutilizar trace; sem producer/consumer/runtime/authority inferidos.                                                      |
| Human authority / PR #181          | Conta autenticada reservada + `sourceRef` server-side na rota atual          | Preservar piso anti-spoof; authority binding/Envelope genéricos continuam target.                                         |
| Drafts #176/#177/#182              | Audit ledger, proposal de qualificação e runbook VPS concorrentes            | Inputs de preflight fora de `main`; nenhuma capability, merge ou ação VPS inferida.                                       |
| Cloud Hermes não default           | Probes falhos/bloqueados em branch próprio                                   | Não é `main`, recovery seguro, executor elegível ou autorização de remoto/VPS.                                            |
| Cloud G2-A/G2-B                    | Futuro placement/effects                                                     | Local read/lab apenas até gate remoto próprio.                                                                            |
| TriView                            | Cockpit read-only                                                            | Command/Decision Inbox material exige contrato e gate posterior.                                                          |
| Produção/release                   | Fora deste plano inicial                                                     | `MERGE != RELEASE != DEPLOY`.                                                                                             |

## 6. Plano cross-repository

Nenhum repositório externo será alterado no primeiro boundary NX-0.

Quando um boundary posterior for autorizado:

| Repositório          | Mudança candidata                                                           | Gate mínimo                     |
| -------------------- | --------------------------------------------------------------------------- | ------------------------------- |
| quatro repositórios  | `.mcf/project-capsule.v2.yaml` derived ao lado da Capsule v1 intacta        | PR próprio por repo + dual-read |
| MCF                  | contracts, Registry v2, graph/binding, adapters e pointers dos quatro repos | PR + full verification + review |
| Cognitive Ledger     | conformance de read; integração do write provider-side ao MCF pertence #164 | autorização explícita separada  |
| Cloud Infrastructure | schemas de Placement Request/Receipt e lab local                            | sem VPS/SSH/G2-B; testes locais |
| TriView              | read models de status/graph/binding                                         | GET-only, privacy e UI tests    |

Rollout de Capsule v2, somente dentro de uma autorização NX-3 própria:

1. publicar primeiro o reader/pointer schema MCF disabled, provando fallback v1;
2. gerar sidecar v2 em branch separada de cada repo a partir da Capsule v1 e source revisions exatas,
   sem self-reference ao SHA do commit que ainda não existe;
3. validar e mergear cada sidecar por PR próprio, sem alterar o writer ou a Capsule v1;
4. depois dos quatro merges, publicar no MCF os pointers com path, digest e commit já observáveis de
   cada sidecar;
5. executar recovery v1 e v2 fresh 4/4 antes de preferir v2; rollback remove/desabilita primeiro os
   pointers e preserva todas as Capsules v1.

Cada mudança cross-repo usa branch/PR próprios e SHA exato. Um merge em um repo não autoriza mutação
nos demais; esta missão de planejamento não autoriza nenhum dos passos acima.

## 7. Matriz de testes

| Camada          | Provas obrigatórias                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------ |
| Contracts       | build/typecheck, schema valid/invalid, backward compatibility                                                |
| Registry        | v1/v2 dual-read, provenance/freshness, profile 29/29, unknown fail-closed                                    |
| Graph           | determinism, cycles, joins, budgets, stale plan, completion                                                  |
| Binding/router  | hard requirements, authority/data/cost, no eligible fallback                                                 |
| Security        | spoofing, injection, privilege escalation, secrets, version-bound gates                                      |
| Human authority | reserved authenticated account, server provenance, Envelope→Receipt→Request, expiry/supersession             |
| Human Control   | authenticated pause/resume, safe point, restart, zero new admission/reservation, in-flight reconciliation    |
| Zero-cost       | paid/trial/unknown/stale rejected; 0 paid calls/embeddings/charge                                            |
| Context         | recovery 4/4, drift, ambiguity, source unavailable                                                           |
| Ledger read     | allowlist, no-store, raw blocked, pairwise token, no MCF persistence                                         |
| Cloud local     | canonical executable/root/hash, timeout, integrity, cleanup                                                  |
| TriView         | GET-only, derived/currentness labels, privacy, accessibility                                                 |
| GUI/window      | existing trace/schema compatibility, no duplicate producer/contract, no authority/runtime inference          |
| Runtime         | mission hierarchy, phases, handoffs, event ledger, external actions                                          |
| Cognitive exec  | Request/Receipt autenticado, fixture conformance, run real escopado, artifact origin, replay/spoof rejection |
| Migration       | dual-read, one logical writer, v1 side-by-side compatibility, migrations twice, backup/restore, rollback     |
| Evaluation Q13  | predeclared digest, credible baseline, hard constraints, repetition, uncertainty, cost and decision rule     |
| Portability Q14 | per-layer matrix, clean-room, provider-independent conformance/negative tests, migration and receipt         |
| Repository      | format, lint, typecheck, tests, build, dependency/secret audit                                               |

Comandos de gate no MCF, conforme escopo e ambiente CI-equivalente:

```bash
cd apps/rede-social-agentes
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm verify
pnpm audit --prod --audit-level high
gitleaks git --redact --exit-code 1 .
```

O CLI zero-cost `gitleaks` deve ter versão e artifact digest pinados no workflow/check do SHA candidato.
Hoje o repositório não possui esse comando como required check; portanto
`REPOSITORY_SECRET_AUDIT_GAP` bloqueia NX-0 até o boundary autorizado versionar ou reutilizar um gate
equivalente, reproduzível e bloqueante. Secret scanning/push protection do host são defesa adicional,
não substituem o Receipt do SHA. Allowlist, se inevitável, deve ser mínima, revisada e versionada.

Nenhum número de testes será congelado no plano; o receipt deve registrar o total real do SHA candidato.

## 8. Compatibility / regression audit

Antes de cada novo boundary, produzir matriz:

| Superfície                        | Estado permitido     |
| --------------------------------- | -------------------- |
| comportamento vigente preservado  | `PRESERVE`           |
| mudança explicitamente aprovada   | `INTENTIONAL_CHANGE` |
| fora do diff e do fluxo           | `NOT_TOUCHED`        |
| premissa inválida/risco sem teste | `BLOCKED`            |

Superfícies obrigatórias:

- contratos públicos v1/v1.1;
- MissionRuntime e estado/transições;
- HDF, PermissionEngine e HUMAN_GATE;
- HDF v1.2, DEC-065, `human-control-policy.ts`, T09–T12/V01–V08 e pausa/retomada;
- conta humana reservada/`HumanAuthorityProof` e canonicalização server-side do PR #181;
- interceptação autenticada do comando standalone antes do bootstrap pelo PR #184, sem atribuir-lhe
  pausa persistente, restart safety, safe point ou admissão global;
- protocolo/schema/fixtures/qualifier GUI/window do PR #179 e status reconciliado pelo PR #180;
- ExternalActionDispatcher/idempotency/reconciliation;
- Context Fabric/Truth Contracts;
- providers e produção;
- tags/releases/workflows;
- 29 agentes e 16 skills;
- segurança, privacidade e secrets;
- custo zero.

Qualquer `BLOCKED` interrompe o boundary e devolve o plano para correção.

## 9. Risk register

| Risco                                                                      | Controle                                                             | Gate                 |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------- | -------------------- |
| segundo runtime/ledger surgir por conveniência                             | extensão do runtime atual + structural diff/test                     | NX-0/NX-4            |
| Registry v2 virar fonte concorrente                                        | dual-read, owner explícito e Receipt/provenance                      | NX-1/NX-3            |
| modelo gratuito mudar preço/quota                                          | freshness/expiry e fail-closed                                       | NX-5                 |
| fallback pago silencioso                                                   | hard policy + negative tests + usage receipt                         | NX-0/NX-5            |
| router existir sem originar trabalho cognitivo                             | Request/Receipt + executor autenticado + conformance/real-run gates  | NX-0/NX-5            |
| evidence fornecida receber crédito de agente                               | origin attestation + GATE-RUNTIME-REALITY escopado                   | NX-0/NX-5            |
| graph duplicar efeitos após crash                                          | attempts, idempotency, durable reservation e fencing                 | NX-4/NX-7            |
| prompt/memória escalar autoridade                                          | typed boundary, HDF/policy outside model                             | NX-0/NX-7            |
| Human Control regredir do gate autenticado do PR #184 para nome no payload | conta autenticada reservada + provenance server-side                 | NX-0/NX-4            |
| pausa desaparecer no restart ou admitir ação                               | estado/ledger atômicos + safe point + admission checks               | NX-4/NX-5/NX-7       |
| checkpoint interno ser vendido como runtime                                | characterization + gate persistente separado                         | NX-0/NX-4            |
| GUI autorizada ser confundida com authority                                | UI boundary + tests negativos                                        | NX-0/NX-3            |
| trace GUI/window ser duplicado como 23º contrato                           | equivalence/catalog test + reabertura formal se público              | Preflight/NX-0       |
| status histórico do PR #179 ser tratado como live                          | ler `main` pós-PR #180 e preservar o freeze histórico como histórico | Preflight            |
| Capsule ou TriView parecer current sem prova                               | freshness e labels `SNAPSHOT/UNKNOWN`                                | NX-3                 |
| Capsule v2 quebrar reader/rollback v1                                      | sidecar + version pointer + v1 imutável no coexistence               | NX-0/NX-3            |
| PR #174 criar contrato/writer de continuidade concorrente                  | live rebase + equivalence/disposition + catálogo único               | Preflight/NX-0       |
| Cognitive Ledger virar truth global                                        | ownership matrix e contracts separados                               | NX-0/NX-3            |
| 29 agentes virarem 29 processos fictícios                                  | profile + evidence-based activation                                  | NX-1                 |
| branch histórica ser mergeada diretamente                                  | lineage preservado; implementação parte do main atual                | Preflight            |
| trabalho paralelo ser sobrescrito                                          | live issue/PR audit e PRs separados                                  | Preflight/cross-repo |
| escopo chegar a VPS/produção                                               | explicit forbidden paths e separate human gate                       | Todos                |
| avaliação Q13 ser ajustada depois do resultado                             | contract/digest predeclarado e lineage imutável                      | NX-0/NX-8            |
| recovery 4/4 ser vendido como portabilidade                                | matriz por camada, negative suite e Receipt Q14                      | NX-9                 |

## 10. Rollback e recovery

Cada boundary deve entregar:

- feature flag/default off;
- backward reader ou mapping versionado;
- dados novos não necessários para interpretar estado antigo;
- replay/idempotency test;
- backup/restore quando houver persistência;
- before/after integrity;
- procedimento de desativação sem apagar história;
- Receipt que diferencia rollback de aplicação, dados e provider.

Não existe rollback seguro genérico para binário v1.1 após migration incompatível. Mudança incompatível exige plano de dados e restore próprio antes de ser autorizada.

## 11. Checklist de autorização de implementação

### Planejamento e arquitetura

- [x] Q1–Q16 reconciliadas em documento candidato;
- [x] ownership dos quatro repositórios definido;
- [x] F1.4 candidata documentada;
- [x] contratos candidatos enumerados;
- [x] cada tipo formal mapeado para schema/fixtures no NX-0;
- [x] política de custo zero definida;
- [x] migração/rollback em etapas definidos;
- [x] work packages NX-0 a NX-9 e testes definidos;
- [x] gate predeclarado de Evaluation Contract Q13 definido;
- [x] Portability Matrix/conformance/Receipt Q14 definidos;
- [x] boundary de execução cognitiva real e gate bloqueante definidos;
- [x] sidecar/pointer/cutover/rollback Capsule v1/v2 definidos;
- [ ] documentos integrados em `main` por PR regular;
- [ ] checks do PR e pós-merge aprovados;
- [ ] revisão independente sem achado material aberto;

### Gate humano

- [ ] LEANDRO revisou o conteúdo exato integrado;
- [ ] LEANDRO aprovou ou corrigiu dispositions Q1–Q16;
- [ ] LEANDRO aprovou a F1.4 vinculada ao SHA/digest;
- [ ] LEANDRO escolheu o primeiro boundary autorizado;
- [ ] autorização lista explicitamente allowed/forbidden paths e efeitos;

### Antes do primeiro código

- [ ] baseline live novo registrado;
- [ ] compatibility/regression audit passou;
- [ ] worktree/branch isolada;
- [ ] testes de characterization atuais verdes;
- [ ] dependency audit e secret scan zero-cost/reprodutível passam no SHA candidato;
- [ ] nenhum conflito com #141, #147, #164 ou outros PRs;
- [ ] zero provider/VPS/produção no escopo;

## 12. Template recomendado de autorização

```text
Autorizo somente o boundary NX-0_CONTRACTS_AND_CONFORMANCE do MCF NextGen,
vinculado à arquitetura e ao plano integrados no main@<SHA> e aos seus digests.
O escopo fica limitado a contracts TypeScript, schemas JSON, fixtures,
characterization/conformance tests, documentação e, se necessário, configuração pinada
do gate zero-cost de dependency/secret audit nos paths explicitamente listados. Não autorizo runtime wiring,
database migration, provider/model/API call, external mutation, Cognitive Ledger
write, TriView command, Cloud remoto, G2-A/G2-B, SSH/VPS, release ou produção.
```

LEANDRO pode autorizar boundary diferente, mas a autorização precisa identificar o escopo material com precisão equivalente.

## 13. Definition of Done da implementação completa futura

A arquitetura NextGen não será considerada implementada apenas porque contratos ou um router existem. O DoD final exigirá, no mínimo:

- contracts e schemas aprovados/versionados;
- 29-agent profile validado sem fixar o Core;
- Registry multissubject com provenance/freshness;
- graph/binding determinísticos e governados;
- execução cognitiva origina trabalho por executor autenticado e só transiciona com Request/Receipt/artifact provenance válidos;
- ao menos um run não simulado e zero-paid satisfaz `GATE-RUNTIME-REALITY` somente para seu escopo, sem inferir 29/29 ou independência;
- zero-cost policy materialmente imposta;
- runtime atual como escritor único;
- Human Control persistente, autenticado, restart-safe e bloqueante em graph/cognitive/placement/effect admission;
- conta humana reservada e provenance server-side preservadas sem regressão para nome/caller payload;
- trace GUI/window existente reutilizado sem autoridade, runtime claim ou contrato duplicado;
- effects apenas pelo dispatcher governado;
- recovery cross-repo 4/4;
- Ledger/Cloud/TriView preservando seus boundaries;
- migration/rollback/recovery testados;
- full regression e security review;
- Evaluation Contract Q13 congelado antes dos runs e evidence/decision report vinculados ao digest;
- Portability Claim/Matrix Q14 congelado, conformance/negative suite e Receipt por camada;
- release e produção somente se missões posteriores forem autorizadas.

## 14. Estado terminal deste plano

```yaml
implementation_plan: complete_candidate
implementation_started: false
implementation_authorized: false
recommended_first_boundary: NX-0_CONTRACTS_AND_CONFORMANCE
next_gate: LEANDRO_APPROVES_EXACT_SPEC_AND_SCOPE
```
