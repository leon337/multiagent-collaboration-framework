# MCF — Integração inicial do roteador de modelos (runtime)

**Contrato:** `MCF-GOOGLE-MODEL-ROUTING/v1`  
**Status:** `EXPERIMENTAL` — proposta em PR, sem deploy.  
**Dependência:** [política de modelos](MCF-GOOGLE-MODEL-ROUTING.md).

## O que esta integração faz no MCF

O módulo `apps/rede-social-agentes/apps/server/src/mcf-runtime/google-model-routing.ts` fornece um seletor determinístico por capacidade com catálogo verificado pelo provedor. As classes disponíveis são `text_agent`, `realtime_voice`, `thinking_voice`, `transcription` e `translation`.

Ao criar uma missão, `MissionRuntimeService` registra a decisão inicial em `MISSION_CREATED.payload.modelRouting`, com `status=PENDING_VERIFICATION`, `selectedModel=null`, `toolsVerified=false` e `quotaCheckedAt=null`. **Não representa despacho nem confirmação de execução de um modelo.** Isto evita atribuir um executor Google à força a um provedor previamente escolhido pelo contrato.

Para selecionar um modelo real, o executor/adaptador autorizado deve consultar o catálogo do projeto, passar os resultados a `selectMcfModel(taskClass, catalog)`, verificar cota e capacidade de ferramentas e persistir receipt verificado, mantendo os gates normais. Integração com dispatch de cada provedor é etapa posterior; não há fallback silencioso em 429.

## Aplicação da política na instância DSH do notebook

Na instância exclusiva MESTRE, o inicializador executa `app/apply-model-routing.mjs --apply-dsh`, que usa a chave local apenas em memória e consulta `/v1beta/models`. Ele escolhe um modelo compatível com `generateContent`, conforme a preferência da política, e altera somente o campo de modelo padrão em `dsh/profiles/web/cordis.patch.yml` **antes** de iniciar o DSH. Se o catálogo estiver inacessível, preserva a configuração anterior e registra `PENDING_VERIFICATION`; não muda modelos por quota 429.

O registro sem segredos fica em `app/model-selection-status.json` (permissão 0600). Não grava chaves nem cria projetos Google.

O MESTRE Live oferece escolha explícita na UI entre `gemini-3.8-live` (voz de baixa latência, sem thinkingConfig) e `gemini-3.8-live-extended-thinking` (thinking configurável); IDs são permitidos por allowlist no gateway. A interface original de DSH e as demais instâncias não são alteradas.

## Evidências e limitações

- Verificação local do catálogo Google: 61 modelos enumerados, `gemini-3.8-flash` confirmado como opção padrão textual.
- Gateway: conexões de sessão Live reais aceitas para `gemini-3.8-live` e `gemini-3.8-live-extended-thinking`; não equivalem a validação de áudio pelo microfone real.
- Testes de seleção: 6 casos locais + 6 casos de smoke do módulo de runtime.
- Ações sensíveis continuam exigindo HUMAN_GATE e não podem ser autorizadas pela seleção de modelo.
- O runtime MCF em produção não foi alterado, e seleção efetiva de modelos em cada adapter de execução ainda não foi implementada. Não declarar `CURRENT_IMPLEMENTED` até despacho real, receipts e CI.
