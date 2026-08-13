# PHASE-STABLE-RELEASE-001 — PLAN

## Contrato

```yaml
mission_id: MCF-STABLE-RELEASE-001
phase_id: PHASE-STABLE-RELEASE-001
title: Qualificação e promoção de v1.0.0
objective: qualificar um SHA exato e preparar a promoção pública estável
risk_class: C
current_state: EM_EXECUCAO
decision_authority: LEO
human_authority: LEANDRO
source_of_truth:
  - GitHub
  - Render production evidence
```

## Escopo

- reconciliar RC2 com o estado produtivo atual;
- produzir RC3 imutável quando o SHA pós-merge passar Production Readiness;
- confirmar produção no mesmo SHA;
- confirmar health/readiness/version e monitoramento;
- preservar security, migrations, backup/restore, smoke e recovery;
- produzir PRF Classe C;
- executar trace, governança, auditoria e gate interno;
- preparar, mas não publicar, `v1.0.0` antes do HUMAN_GATE.

## Fora de escopo

- mudar finalidade do MCF;
- migrar infraestrutura nesta missão;
- plano pago ou método de pagamento;
- mover RC1 ou RC2;
- reduzir controles existentes.

## Agentes de controle

- Augusto: mission trace;
- Júlia: governança Classe C;
- Emily: auditoria independente das evidências;
- Léo: decisão do gate interno;
- Mestre: coordenação e closeout.

## Critérios de aceite

1. RC1/RC2 preservadas;
2. RC3 ligada a SHA exato qualificado;
3. full Production Readiness PASS;
4. produção LIVE no SHA de RC3;
5. health/readiness/version PASS;
6. monitor corrigido com execuções reais PASS e sem incidente material aberto;
7. findings críticos/altos = 0;
8. PRF completo e auditável;
9. Emily PASS;
10. Léo PASS;
11. HUMAN_GATE de LEANDRO antes de `v1.0.0`;
12. stable tag/release somente depois do item 11.
