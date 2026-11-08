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

## Atualização local — modelos Live no seletor nativo do DSH (2026-11-08)

**Status: implementado e validado somente no notebook MESTRE, não integrado ao runtime MCF em produção.** Esta atualização substitui a descrição anterior de que os modelos Live estariam restritos ao painel lateral.

O DSH possui agora um provedor próprio `mcf-live` com dois modelos válidos para chat e ferramentas:

- `gemini-3.1-flash-live-preview` — **Gemini 3 Flash Live (MCF nativo)**, padrão para novas sessões.
- `gemini-2.5-flash-native-audio-preview-12-2025` — **Gemini 2.5 Native Audio (MCF nativo)**, alternativa.

**Implementação local:** `app/dsh-native-adapter.mjs`, serviço persistente `mcf-dsh-live-native-adapter.service` ouvindo somente em `127.0.0.1:3100`. O adaptador traduz Chat Completions do DSH para `bidiGenerateContent` via Google GenAI Live e devolve texto transcrito, SSE e `tool_calls` ao DSH. Usa token interno local em permissões `0600`, distinto da chave da API Google, e não registra prompts nos eventos de observabilidade. O registro do provedor e dos modelos está em `dsh/settings.yaml` e `dsh/profiles/web/cordis.patch.yml`, preservando os cinco modelos textuais Google existentes.

**Escopo de suporte:** o chat nativo do DSH recebe apenas texto, respostas e chamadas de funções; o áudio/microfone continua no painel MESTRE Live (3099). Modelos `gemini-3.5-transcribe-live` e `gemini-3.5-live-translate-preview` **não** são adicionados ao chat textual, pois são serviços de áudio especializados. A ausência de um limite RPM visível no AI Studio não autoriza assumir uso ilimitado: continuar tratando `429`, TPM, concorrência e gasto.

**Evidências verificadas:** duas opções exibidas no seletor nativo junto aos cinco modelos anteriores; teste real do DSH com Gemini 3 Flash Live chamando `mcf_shared_inspect` e retornando o resultado (~12 s); teste real do DSH com Gemini 2.5 Native Audio recebendo e respondendo mensagem (~3 s); chamadas diretas de texto, streaming SSE e função no adaptador; 15 testes locais de regressão aprovados; recusas por falta de autenticação (401), modelo incompatível (404) e imagem no endpoint textual (422). Os serviços DSH (3098), Live (3099) e adaptador (3100) estão ativos.

**Risco residual:** uma geração de título de sessão na primeira validação sofreu timeout de 26 s e foi recuperada por retry. Foi adicionada finalização por inatividade após transcrição, mas testes de carga, usuários simultâneos e estabilidade prolongada ainda faltam. Nenhuma ação destrutiva, integração de login Google ou merge/deploy foi feita.

O código de adaptação executável permanece no notebook; este PR documenta a implementação e não contém, por ora, um pacote instalável do adaptador. **Não declarar a integração como implantada em todas as instâncias MCF.**

## Atualização operacional DSH nativo — preferência 3.8 Live (2026-11-08)

Conforme a instrução explícita mais recente de LEANDRO, o DSH instalado no notebook deve usar `gemini-3.8-live` como padrão e disponibilizar `gemini-3.8-live-extended-thinking` no seletor nativo. As opções 3.1 Flash Live e 2.5 Native Audio são alternativas, preservando os modelos Google textuais.

**Implementado localmente (sem commit do adaptador no repo):** o provedor `mcf-live` envia Chat Completions do DSH ao adaptador HTTP `127.0.0.1:3100/v1`, que usa sessões Live. Configuração persistida em `dsh/settings.yaml`, `dsh/profiles/web/cordis.patch.yml`; o inicializador preserva a preferência Live verificada no catálogo. Gemini 3.8 Live requer ferramentas síncronas `BLOCKING`; Extended declara `NON_BLOCKING`, `thinkingConfig.thinkingLevel=low` e considera `interactionStatus`.

**Evidência:** os dois modelos responderam no chat nativo DSH; 3.8 Live chamou `mcf_shared_inspect` e usou o retorno, validando ferramentas. **Limitação não resolvida:** Extended Thinking conecta e conversa, mas não produziu `toolCall` nos testes de ferramenta via DSH nem em dois testes diretos (somente `IN_PROGRESS` e emissão de áudio intermediário). Não declarar execução de ferramentas do Extended validada. Usar 3.8 Live para tarefas instrumentadas até resolver. Retry do provedor limitado a 1; timeout categorizado. 15 testes locais passaram, porém não representam CI do repositório nem release do runtime central.

