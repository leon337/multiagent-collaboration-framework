# Plano — MCF-PET-PROPOSALS-001

Autoridade final: LEANDRO. Orquestrador: MESTRE. Revisão operacional: LÉO.
Fonte canônica: leon337/multiagent-collaboration-framework.
Baseline: PR #533 head 2742ca82786612a791125a0bec9b495ba649c1f4.
Dependência: PR #533 (ferramentas READ_ONLY) ainda aberto no momento do planejamento.

Objetivo: converter pedidos do humano em propostas técnicas estruturadas,
duráveis e revisáveis, sem conceder execução, shell, navegador, merge ou deploy.

MVP:
1. Terceiro escopo assinado read_and_propose, com opt-in explícito por sessão.
2. Uma função para salvar apenas rascunhos validados e limitados.
3. Persistência local privada em SQLite com idempotência e recibo.
4. Lista autenticada no painel com riscos, reversão e evidências.
5. Decisões de revisão locais: reviewed_for_planning ou rejected.
6. Testes de isolamento, CSRF, WebSocket, áudio real, navegador desktop/mobile,
   instalação reversível e CI específico do Pet.

Fora do escopo: executar mudanças, criar missões automaticamente, publicar,
aprovar HUMAN_GATE, expor segredos, alterar o MissionRuntime central ou
modificar credenciais do observador de missões.
