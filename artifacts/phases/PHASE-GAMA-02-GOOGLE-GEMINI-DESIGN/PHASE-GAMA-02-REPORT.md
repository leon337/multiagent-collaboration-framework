# PHASE-GAMA-02 — Google/Gemini Technical Fit Design Report

## Executor
`MESTRE`.
Nenhum agente especialista nomeado é creditado nesta fase sem execução independente verificável.

## Baseline técnico inspecionado
Baseline de referência: `main@632921eef5ab6ff8e414a0024fb8f00983442844`.

O runtime atual já possui:
- `AdapterRegistry`, que resolve adapters de ações externas e falha se mais de um adapter casar com a mesma solicitação;
- `ExternalActionRequest` com skill, agentId, inputs, tool e contexto de mission/phase;
- `ExternalActionAdapter.execute()` retornando `McfToolReceipt`;
- falhas tipadas para autenticação, rate limit, rede, timeout, resposta inválida, ledger e efeito externo desconhecido;
- `PermissionEngine` com canonicalização de provider/operation/resource e boundaries específicos por skill/provider/operação.

Conclusão arquitetural: o MCF já possui um boundary governado para **efeitos externos materiais**, mas inferência de modelo não deve ser confundida semanticamente com uma ação externa que muta GitHub/cloud/banco.

## Evidência Google atual
Documentação oficial verificada em 2026-09-12:
- SDK JavaScript oficial: `@google/genai`;
- API Interactions disponível em JavaScript;
- autenticação via API key, com `GEMINI_API_KEY` suportada;
- existe free tier com acesso limitado a modelos e tokens de entrada/saída sem custo;
- paid tier exige billing e oferece limites/recursos superiores;
- limites são aplicados por projeto/modelo e `429 RESOURCE_EXHAUSTED` representa rate limit;
- function calling é suportado.

O modelo exato não deve ser hard-coded no design porque disponibilidade/tiers são voláteis. O G3 deve selecionar um modelo oficialmente disponível no free tier no momento da qualificação e persistir o model ID exato na evidência.

## Opções consideradas

### Opção A — Reusar `ExternalActionAdapter` para inferência Gemini
**Vantagens**
- menor delta de código;
- reaproveita failure mapping e receipt existente;
- integração rápida.

**Desvantagens**
- mistura inferência cognitiva com efeito externo material;
- torna mais difícil distinguir `modelo sugeriu uma ação` de `ação foi executada`;
- aumenta risco de tool/function calling contornar o boundary governado;
- reduz clareza para futuros providers/modelos.

**Veredito:** `REJECT_FOR_G3`.

### Opção B — Criar `ModelExecutionProvider` + registry próprio
Fluxo:
`MissionRuntime -> ModelExecutionRegistry -> GeminiModelProvider -> ModelExecutionReceipt -> mission evidence/ledger`

Quando Gemini solicitar ferramenta:
`Gemini tool intent -> MCF PermissionEngine/HumanDelegationGuard -> ExternalActionDispatcher -> adapter real -> external receipt`.

**Vantagens**
- separa cognição de efeito externo;
- preserva o dispatcher atual como único boundary para mutações;
- provider-independent;
- facilita adicionar outros modelos depois;
- permite receipt específico de inferência e binding mission/phase;
- mantém claims e auditoria mais claros.

**Desvantagens**
- exige novos contratos, registry, provider e testes;
- delta maior que A.

**Veredito:** `RECOMMENDED`.

### Opção C — Vertex AI primeiro
**Vantagens**
- IAM e integração Google Cloud mais fortes;
- caminho enterprise mais natural.

**Desvantagens**
- maior setup;
- billing/projeto/IAM mais complexos;
- pior para o deadline;
- pode introduzir custo novo antes de LEANDRO autorizar.

**Veredito:** `DEFER_AFTER_GAMA_MVP`.

## Arquitetura recomendada — Opção B

```text
Mission / Phase
      |
      v
ModelExecutionRegistry
      |
      v
GeminiModelProvider
      |
      +--> Google Gemini API
      |
      v
ModelExecutionReceipt
      |
      v
Evidence / Mission Ledger

Function/tool intent from Gemini
      |
      v
Permission Engine + Human Delegation Firewall
      |
      v
External Action Dispatcher
      |
      v
Existing Adapter
      |
      v
External Action Receipt
```

### Invariante central
`MODEL_TOOL_INTENT != MATERIAL_EXTERNAL_EFFECT`

Gemini pode propor uma função/tool call. Ele não pode chamar diretamente GitHub, cloud, banco ou qualquer adapter material. Toda mutação continua passando pelos gates existentes do MCF.

## Contrato candidato de execução de modelo
Sem implementar código nesta fase, o contrato G3 deve carregar no mínimo:
- `provider`: `google`;
- `model`: ID exato;
- `operation`;
- `missionId` e `phaseId` quando houver binding de missão;
- executor real / service principal;
- `agentId` somente quando existir execução real atribuível a esse agente;
- timestamp;
- digest do input sanitizado;
- digest do output;
- finish/block reason;
- usage metadata quando fornecida;
- tool-call intents, sem tratá-los como efeitos executados;
- validation verdict;
- failure code quando aplicável.

## Segredos e configuração
- `GEMINI_API_KEY`: apenas server-side/env/secret store;
- nunca Git, receipt, ledger, log ou browser/client;
- `MCF_GEMINI_ENABLED=false` por padrão;
- `MCF_GEMINI_MODEL=<id>` configurável;
- allowlist explícita de modelos aprovados;
- `MCF_GEMINI_PAID_FALLBACK_ALLOWED=false` por padrão;
- nenhum upgrade de billing/modelo por fallback automático.

## Política de custo
O free tier é aceitável para qualificação se o modelo escolhido estiver oficialmente elegível no momento do G3.

Se a execução exigir ativar Cloud Billing ou gerar custo financeiro novo:
`STOP -> HUMAN_GATE LEANDRO`.

## Mapeamento mínimo de falhas
- chave ausente/inválida -> `AUTHENTICATION_REQUIRED`/equivalente de model execution;
- HTTP 429 -> `RATE_LIMITED`;
- timeout -> `MODEL_TIMEOUT`;
- rede -> `NETWORK_FAILURE`;
- resposta inválida -> `INVALID_RESPONSE`;
- safety/policy block -> `MODEL_BLOCKED`, nunca success;
- modelo fora da allowlist -> fail closed antes da chamada;
- ferramenta solicitada -> `TOOL_INTENT`, nunca external effect até passar pelo dispatcher governado.

## Qualificação G3 exigida
1. disabled-by-default;
2. missing key fail closed;
3. model allowlist;
4. secret non-leakage;
5. 429/timeout/network mapping;
6. receipt com provider/model/mission-phase/digests;
7. function/tool call não muta nada diretamente;
8. chamada real e inofensiva ao Gemini em free tier;
9. prova do model ID exato retornado/configurado;
10. prova de zero paid fallback;
11. regressão do runtime existente;
12. nenhuma escrita em produção.

## Critério de Google fit
Somente após G3 passar uma chamada real, bound e evidenciada, o estado poderá mudar de:
`GOOGLE_MODEL_INTEGRATION = NOT_YET_PROVEN`
para
`GOOGLE_MODEL_INTEGRATION = PROVEN_AT_QUALIFIED_BOUNDARY`.

## Decisão G2
`DESIGN_PASS_OPTION_B_RECOMMENDED`.

G3 é uma implementação de código e requer HUMAN_GATE de LEANDRO antes de iniciar.