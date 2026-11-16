# MCF-GEMINI-LIVE-EVOLUTION-20261116-001 — Contrato de missão

> **Status documental:** PLANEJADO / PHASE-00-BASELINE-AND-PLANNING. **Issue com status vivo:** [#527](https://github.com/leon337/multiagent-collaboration-framework/issues/527). Este documento descreve a missão aprovada para registro, **não comprova implementação** e não autoriza merge/deploy.

## 1. Contrato operacional

```yaml
mission_contract:
  mission_id: MCF-GEMINI-LIVE-EVOLUTION-20261116-001
  parent_mission_id: null
  phase_id: PHASE-00-BASELINE-AND-PLANNING
  title: "Gemini Live Studio Evolution — Voz, visão, agentes e observabilidade"
  objective: "Evoluir a aplicação local Gemini Live Studio para uma interface multimodal confiável e governada do MCF."
  expected_outcome: "V2.1 qualificada por E2E verificável, segurança, métricas e integração do executor MCF."
  scope:
    - audio_streaming_vad_barge_in_and_session_resumption
    - webcam_screen_image_input
    - model_capability_routing_and_specialized_modes
    - consented_memory_and_context
    - observability_cost_error_metrics
    - governed_mcp_tools_and_mcf_runtime_adapter
    - voice_to_mission_evidence_and_spoken_response
  out_of_scope:
    - production_deployment_automatic
    - unrestricted_host_shell_or_browser_control
    - credential_or_personal_media_publication
    - evasion_of_provider_rate_limits
    - voice_cloning_claimed_as_native_live_feature
    - automatic_payment_or_provider_billing_activation
  inputs:
    - "Gemini Live Studio local: /home/leo/Projetos/gemini-live-studio (existência/versão requer nova verificação)"
    - "Google Live API (disponibilidade real por modelo/conta)"
    - "MCF docs/operations/MCF-GOOGLE-MODEL-ROUTING.md"
    - "MCF docs/MCF-CURRENT-STATE.md"
    - "MCF docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md"
  source_of_truth:
    - "GitHub/provider live para estado mutável"
    - "código local no commit/estado coletado em F0"
    - "Issue #527 para checklist vivo"
  assumptions:
    - "A máquina alvo e diretório local serão reconciliados antes da primeira modificação."
    - "Nenhum teste passado informalmente equivale a aceite sem evidência referenciada."
  acceptance_criteria:
    - "F0: baseline, matriz de capacidades, risco, PRF e evidências reprodutíveis"
    - "F1: fluxo áudio/microfone com testes reais, VAD, reconexão e latência observável"
    - "F2: entrada multimodal, roteamento, memória e modos especializados com E2E"
    - "F3: gateway MCF com HDF, idempotência, receipts, bloqueio de ações indevidas"
    - "F4: missão de voz supervisionada ponta a ponta, smoke, auditoria e gate"
  authorizations:
    - "Criar Issue, branch isolada, documentação de missão/roadmap/checklist e PR draft."
    - "Descoberta/validação não destrutiva; alterações futuras seguem boundary e gates da fase."
  prohibitions:
    - "Publicar secrets/tokens/transcrições ou capturas pessoais no GitHub."
    - "Merge, release, deploy ou promoção de produção sem autorização separada."
    - "Executar WRITE/DESTRUCTIVE do host como efeito colateral de chamada de função."
  risk_class: C
  current_state: PLANEJADO
  cycle: 1
  selected_agents:
    - MESTRE
    - Leonardo
    - Sofia
    - Rafael
    - Beatriz
    - Miriam
    - Renato
    - Augusto
    - Julia
    - Emily
    - Carmem
    - Gabriel
    - LEO
  decision_authority: LEO
  human_escalation_triggers:
    - novo_custo_financeiro
    - uso_ou_exposicao_de_credenciais_sensiveis
    - publicação_publica_ou_acesso_remoto
    - operação_externa_irreversível
    - alteração_material_do_escopo
  phase_artifact_directory: "artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-XX/"
```

## 2. Baseline conhecida e desconhecida

O projeto foi demonstrado localmente em conversa anterior com URL de loopback `127.0.0.1:18371`. Houve evidência conversacional de handshake WebSocket dos modelos 2.5 Flash Native Audio, 3.8 Live e 3.8 Live Extended Thinking e validação de chave/token. **Novo teste de F0 precisa conferir versão do código, transcrição, áudio físico, câmera, tela e funções**. Não copiar credenciais para esta missão.

As capacidades do servidor Google Live não são iguais entre modelos. A seleção deve seguir o catálogo real do projeto e `docs/operations/MCF-GOOGLE-MODEL-ROUTING.md`, não nomes visuais ou suposições.

## 3. Equipe escalonada por competências (não são agentes já executados)

| Ordem/fase | Papel | Entrega verificável |
|---|---|---|
| F0–F4 | MESTRE | Coordenação, contrato, passagem e checklist com referências |
| F0/F2 | Leonardo | Requisitos e UX/JTBD mensuráveis |
| F0/F1/F3 | Sofia | Diagrama de arquitetura e revisão de fronteiras |
| F1/F2/F3 | Rafael | Implementação modular, integração, testes técnicos |
| F0/F2/F4 | Beatriz | Matriz modelo/capacidade, roteamento, métricas de IA |
| F0/F2/F4 | Miriam | Context package, persistência e handoff recuperável |
| Todas | Renato | Testes, regressão, E2E e resultados reproduzíveis |
| Todas | Augusto | Trace ESEV, verificação de passagens, CAF |
| F0/F3/F4 | Júlia | Identidade, risco, política e privacidade |
| Gate de cada fase | Emily | Auditoria independente com achados e ressalvas |
| Todas | Carmem | Pacote PRF completo por fase |
| Todas | Gabriel | Branch/PR/CI e ponte com evidências |
| Gate de cada fase | LÉO | Aprovar / devolver / bloquear / escalar à autoridade final |

**LEANDRO é a autoridade humana final, não um agente.** A tabela é alocação planejada, sem atribuir execução fictícia. Cada atuação futura deve incluir ferramenta/evidência/resultado e handoff real.

## 4. Governaça e segurança

- Classe C pelo potencial de autonomia, interação com computador e credenciais.
- Permissões escalonadas: `READ_ONLY` → `READ_AND_PROPOSE` → `SCOPED_WRITE` sob regras vigentes → `HUMAN_GATE` quando aplicável.
- `HDF` separa solicitação verbal de autorização operacional. A resposta falada só anuncia sucesso após receipt validado.
- Falha de rede após recebimento exige idempotency key + reconciliação + trace, não disparo duplicado.
- Cada fase terá PRF real conforme protocolo (incluindo NAO_APLICAVEL justificado).
- `CI_GREEN != PRODUCTION_AUTHORIZATION`. Sem merge/deploy automático.
- Proteção de API key: procurar armazenamento seguro e evitar registros de token/URL de autenticação; não expor backend local à rede pública sem autenticação/TLS.

## 5. Estado e roteamento

- **Checklist vivo / progresso:** [Issue #527](https://github.com/leon337/multiagent-collaboration-framework/issues/527)
- **Roadmap versão proposta:** [ROADMAP.md](./ROADMAP.md)
- **Regras de atualização:** [CHECKLIST-LIVE.md](./CHECKLIST-LIVE.md)
- **Fase ativa:** `PHASE-00-BASELINE-AND-PLANNING`
- **Próximo passo real:** inventário local, matriz de capacidade e baseline E2E com artefatos expurgados.
- **Gate:** decisão de LÉO somente após PRF, validação e auditoria.

## 6. Fontes

- [Protocolo operacional MCF](../../protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md)
- [Seleção de modelos Google](../../operations/MCF-GOOGLE-MODEL-ROUTING.md)
- [Mapa de verdade do MCF](../../MCF-CURRENT-STATE.md)
- [Gemini Live — capacidades](https://ai.google.dev/gemini-api/docs/live-api/capabilities)
- [Gemini Live — sessão](https://ai.google.dev/gemini-api/docs/live-api/session-management)
- [Gemini Live — tokens temporários](https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens)
