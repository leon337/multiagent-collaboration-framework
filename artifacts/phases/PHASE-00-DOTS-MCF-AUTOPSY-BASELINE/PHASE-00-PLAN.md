# PHASE-00 — Plano de baseline e não interferência

Mission: MCF-20261013-DOTS-MCF-AUTOPSY-001
Issue: https://github.com/leon337/multiagent-collaboration-framework/issues/441
Branch: mission/dots-mcf-autopsy-001
PR de auditoria: https://github.com/leon337/multiagent-collaboration-framework/pull/442

## Objetivo
Registrar a fonte de verdade MCF, preservar PRs paralelas, validar os canais acessíveis do Manual do Agente GPT e preparar a autópsia Dots × MCF com evidências rastreáveis.

## Escopo
- Conferir SHA main, proteção de branch, PR #438 e checks conhecidos.
- Ler protocolo operacional, template de missão e decisões importantes.
- Comparar DEP-002 publicado por REST com db/seed.sql e testar health/read endpoints.
- Preparar relatório, validação, smoke, decisões, checkpoint e manifesto SHA-256.

## Fora de escopo
- Merge, deploy, release, edição da main ou alteração da PR #438.
- Escrita no Neon, runtime, permissões, segredos ou serviços externos.
- Inferir arquitetura interna do Dots sem fonte oficial pública.
- Declarar teste ou ação que não tenha sido executado.

## Aceite
1. SHA e estado live registados.
2. DEP-002 versionado comparado com JSON live.
3. Health e rotas REST públicas testadas sem credenciais.
4. Defeitos observados registados sem tocar na PR paralela.
5. PRF com hash SHA-256 real por artefato.
6. Pendências de teste, revisão independente e CI preservadas explicitamente.

## Método
Classificar cada achado como VERIFIED_FACT, SECONDARY_EVIDENCE, INFERENCE, HYPOTHESIS ou UNKNOWN. A presença de código/documentação não prova execução live.