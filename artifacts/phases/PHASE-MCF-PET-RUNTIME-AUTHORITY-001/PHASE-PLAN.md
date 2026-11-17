# MCF-PET-RUNTIME-AUTHORITY-001 — plano de evolução

Autoridade humana: LEANDRO. Orquestração: MESTRE. Gate operacional: LÉO.
Repositório: leon337/multiagent-collaboration-framework.
Branch: feat/mcf-pet-runtime-authority-001 (base na PR #537).

Problema: o Pet possui rascunhos mas não dispõe de uma credencial segura para
observar missões canônicas, contexto v1.1 verificado remotamente nem recibo
do PermissionEngine/HDF para operações reversíveis.

Entrega implementada:
1. GET /v1/mcf/mission-control/read/latest com token distinto do dispatch,
   restrito ao repositório canônico; ausência do token = rota indisponível.
2. POST /v1/mcf/mission-contracts/preflight com SessionAuthGuard, validação
   oficial MissionV11ContextGuard; retorna provas do contexto, SEM execução.
3. Projeto MCF: PIP canônico v1.1-canonical-001 e recibo de alinhamento
   verificados pelo IntentAlignmentService + MissionV11ContextGuard.
4. Verificador offline em Node publica cache privado com expiração em 30min.
5. Pet consome APENAS cache privado com PIN e digest imutáveis; novos
   rascunhos podem carregar metodologia + PIP com status LOCAL_VERIFIED,
   SEM afirmar que o runtime remoto aceitou a missão.
6. Capability Registry versionado em INACTIVE/DISCONNECTED.

Fora deste incremento sem gate:
- Criar missão real ou executar ferramentas por voz.
- Reaproveitar token de despacho no observador.
- Permitir escrita por boolean authorizedScope fornecido pelo modelo.
- Criar aprovação humana ou de LÉO fictícia.
- Merge ou deploy de produção sem os gates aplicáveis.
