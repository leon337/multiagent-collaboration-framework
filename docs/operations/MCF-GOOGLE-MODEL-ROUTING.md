# MCF — Memória operacional de seleção de modelos Google

**ID:** `MCF-GOOGLE-MODEL-ROUTING/v1`  
**Estado:** `PROPOSED` (documentação em PR; não equivale a configuração do runtime)  
**Data da verificação documental:** 2026-11-08  
**Autoridade humana:** LEANDRO  
**Orquestrador:** MESTRE  
**Fonte de verdade operacional:** catálogos e limites atuais do provedor + documentação MCF vigente.

## Objetivo

Ao iniciar um novo projeto ou chat do MESTRE, **consultar esta memória antes de escolher modelos**, para não exigir que LEANDRO repita sua preferência. Priorizar os modelos Google mostrados no AI Studio quando eles forem adequados à tarefa, estiverem disponíveis no projeto e houver contrato de API compatível. O nome de exibição do painel não é, por si só, o ID de API.

> **Preferência persistente, não autorização universal:** seleção de modelo não confere permissões de navegador, computador, publicação, pagamento, credenciais ou operações destrutivas; HUMAN_GATE e governança do MCF continuam em vigor.

## Roteamento inicial por capacidade

| Necessidade | Modelo prioritário | ID para investigar/validar | Observações |
| --- | --- | --- | --- |
| Agentes com ferramentas, programação, automação, execução e planejamento | Gemini 3.8 Flash | `gemini-3.8-flash` | **Padrão para DSH/executor textual**, não para conversa de voz via Live API; testar tool calling real. |
| Conversação natural, baixa latência e áudio bidirecional | Gemini 3.8 Live | `gemini-3.8-live` | **Padrão para voz**; a configuração `thinkingLevel` não é suportada nesse modelo. |
| Voz com raciocínio prolongado, planejamento e ferramentas assíncronas | Gemini 3.8 Live Extended Thinking | `gemini-3.8-live-extended-thinking` | Usar quando a complexidade justificar; `thinkingLevel`: low, medium ou high. Maior processamento pode alterar latência e consumo. |
| Transcrição streaming de áudio para texto | Gemini 3.5 Transcribe Live | `gemini-3.5-transcribe-live` | Serviço especializado de transcrição, **não** orquestrador autônomo. |
| Tradução oral bidirecional de baixa latência | Gemini 3.5 Live Translate | `gemini-3.5-live-translate-preview` | Prévia; validar par de idiomas, latência e limites. |
| Experimentos de áudio nativo em sistema legado | Gemini 2.5 Flash Native Audio | `gemini-2.5-flash-native-audio-preview-12-2025` | Legado/preview; preferir 3.8 Live em sistemas novos. |
| Live anterior exibido no painel como “Gemini 3 Flash Live” | Identificação **a confirmar** | Não inferir ID pelo rótulo; candidato documentado: `gemini-3.1-flash-live-preview` | O catálogo oficial usa “Gemini 3.1 Flash Live”; verificar mapeamento no endpoint. Não promover legado como padrão. |
| Inteligência avançada para análise com maior profundidade | Gemini 3.1 Pro Preview | `gemini-3.1-pro-preview` | Alternativa de planejamento/revisão onde compatível; prévia. |
| Fallback textual de geração de conteúdo | Gemini 3.7 Flash / Gemini 3.5 Flash / Gemini 2.5 Flash | `gemini-3.7-flash`, `gemini-3.5-flash`, `gemini-2.5-flash` | Validar disponibilidade, capacidade de ferramentas e custos; não trocar sem registrar justificativa e evidência. |
| Alternativa de modelos abertos/serviço hospedado | Gemma 4 26B A4B / 31B | `gemma-4-26b-a4b-it`, `gemma-4-31b-it` | Não presumir compatibilidade com Live API ou ferramentas nativas; requisitos de hardware importam quando auto-hospedado. |
| Geração de música (não substitui LLM de agente) | Lyria 3 Clip / Pro | `lyria-3-clip-preview`, `lyria-3-pro-preview` | Modelos especializados; validar acesso e licença. |

## Sequência obrigatória de seleção antes de cada missão

1. **Classificar a tarefa:** `text_agent`, `realtime_voice`, `thinking_voice`, `transcription`, `translation`, `music`, `open_model` ou `other`.
2. **Selecionar a capacidade antes do nome do modelo:** o mesmo modelo não deve ser escolhido para chat textual com ferramentas e áudio bidirecional sem checar suporte.
3. **Descobrir disponibilidade no projeto real** usando a API de modelos do provedor ou metadados oficiais e testar o método exigido (por exemplo `generateContent` versus conexão Live).
4. **Confirmar credenciais e quotas em tempo real:** verificar modelo, RPM/TPM/RPD e erros `429`; cotas se aplicam **por projeto**, não por quantidade de chaves. A imagem do AI Studio é uma observação do momento, não garantia durável.
5. **Verificar compatibilidade do SDK/adaptador:** ferramenta nativa, function calling, `thought_signature`, resposta após chamada de ferramenta, streaming de áudio, transcrição, modelo de raciocínio e endpoint.
6. **Registrar decisão no estado da missão:** classe de tarefa, modelo solicitado, modelo efetivo, motivo, endpoint/versão do SDK, contexto da quota consultada, data da verificação, resultado do teste e eventual fallback — nunca segredos.
7. **Fallback seguro:** em `429`, usar retry com backoff e `Retry-After` quando disponibilizado; se necessário, escolher **outro modelo compatível e autorizado** e informar a alteração. Não alternar chaves/projetos para contornar limites ou políticas.
8. **Verificar resultado real:** resposta textual não comprova execução de ferramentas; conexão de áudio não comprova voz full-duplex; link de navegação não comprova tarefa finalizada.

## Regras de arquitetura para MESTRE + DSH + Live

- Separar **modelo cognitivo executor** (por exemplo Gemini 3.8 Flash) de **modelo conversacional de voz** (Gemini 3.8 Live / Extended Thinking).
- O executor de ferramentas é um serviço com identidade de sessão, autorização e receipts; não deve ser substituído por uma resposta verbal que alegue ter executado algo.
- A camada Live pode receber intenção, falar resultados e mediar comandos, mas só deve anunciar sucesso após resultado verificado do executor.
- Persistir a decisão de modelo e a versão desta política junto ao checkpoint/handoff, sem duplicar chaves.
- Para novas instâncias do DSH, preferir modelos de chat em endpoint compatível; modelos Live exigem protocolo de áudio bidirecional próprio.
- A seleção da política é **uma recomendação operacional**. A integração automática com o carregador de instruções, runtime e UI do MCF deve ser implementada e validada em missão separada quando não existir.

## Registro que cada agente deve produzir

```yaml
mcf_model_decision:
  policy: MCF-GOOGLE-MODEL-ROUTING/v1
  task_class: text_agent  # ou realtime_voice, thinking_voice etc.
  requested_model: gemini-3.8-flash
  selected_model: null   # preencher após verificação
  endpoint_verified: false
  tools_verified: false
  quota_checked_at: null
  fallback_reason: null
  status: PENDING_VERIFICATION
```

## Fonte de verdade e atualização

Consultar sempre estas fontes oficiais antes de decidir:

- Catálogo de modelos / IDs: https://ai.google.dev/gemini-api/docs/models
- Recursos e diferenças da Live API: https://ai.google.dev/gemini-api/docs/live-api/capabilities
- Raciocínio na Live API: https://ai.google.dev/gemini-api/docs/live-api/thinking
- Limites e quotas por projeto: https://ai.google.dev/gemini-api/docs/rate-limits
- Deprecações: https://ai.google.dev/gemini-api/docs/deprecations
- Gemma 4 via Gemini API: https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api
- Modelos de áudio/música e outros IDs: https://ai.google.dev/gemini-api/docs/models e https://ai.google.dev/gemini-api/docs/interactions-overview

**Manutenção:** revisar após mudanças de catálogo, prefixos/IDs, SDKs, limites ou política do Google. Se houver divergência entre esta memória e a API atual, registrar a divergência e seguir a fonte oficial verificável. Não codificar valores de quota nem API keys dentro desta memória.
