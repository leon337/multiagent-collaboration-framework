# PHASE PLAN — MCF-MISSION-CONTROL-READ-141-001

## Identidade
- Missão: MCF-MISSION-CONTROL-READ-141-001
- Phase: PHASE-MCF-MISSION-CONTROL-READ-141-001
- Issue: #141
- Classe: B
- Baseline: main@b88ccda900a477fd5490a8897bd663069354f6cd
- Autorização: confirmação direta de LEANDRO em 2026-11-16, limitada a implementação isolada e investigação segura de recuperação.
- Estado: IMPLEMENTATION_CANDIDATE / REVIEW_REQUIRED

## Escopo
- Estender o Mission Control já existente com GET guardado por credencial exclusivamente de observação.
- Preservar GET legacy e POST dispatch inalterados em termos de autorização.
- Reutilizar MissionControlService.latest e a persistência canônica existente.
- Evoluir o painel local do MCF Service Hub com um adaptador de leitura, UI e testes fail-closed.
- Investigar backups e disponibilidade do PostgreSQL sem substituir nem truncar dados.

## Fora do escopo
- Criar novo ledger, novo MissionRuntime, novo banco de missões ou estado sintético apresentado como real.
- Recuperação sem dump íntegro, alteração de produção, atualização de main, aprovação de HUMAN_GATE, automações de deploy ou publicação comercial.
- Declarar PIP ALIGNED; o discovery #141 ainda precisa de sua trilha específica.

## Critérios verificáveis
1. Token de leitura nunca admite POST dispatch.
2. Token de despacho não substitui o token read no novo endpoint.
3. Sem token de leitura a rota falha fechada.
4. Configuração rejeita reutilização de segredo.
5. Contratos e build não apresentam regressões.
6. Painel local não interrompe serviços e não expõe dados canônicos quando a origem está ausente.
7. Nenhum dado restaurado sem manifesto e backup verificáveis.
