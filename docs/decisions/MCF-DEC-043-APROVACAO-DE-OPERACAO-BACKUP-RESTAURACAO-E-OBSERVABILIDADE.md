# MCF-DEC-043 — Aprovação de Operação, Backup, Restauração e Observabilidade

**Data:** 3 de agosto de 2026  
**Autoridade delegada:** Léo  
**Coordenação:** Mestre  
**Auditoria:** Emily  
**PR:** #34  
**Estado:** APROVADO SOB GATE FINAL

## Entradas

- ferramentas de backup e restauração;
- manifesto verificável e checksum;
- testes operacionais;
- telemetria HTTP minimizada;
- runbooks de incidente, recuperação, rollback e alertas;
- workflow técnico `30795204694`;
- workflow documental `30795204718`;
- parecer `MCF-DEC-042-RC-001`.

## Deliberação

O Slice C fornece procedimentos e ferramentas independentes de provedor para recuperação e observabilidade básica. Segredos permanecem fora dos argumentos, qualquer alteração no dump bloqueia a restauração e a telemetria evita conteúdo sensível.

As reservas de agendamento, armazenamento externo, ensaio completo de restore, coletor de logs e alertas reais não bloqueiam a integração do código. Elas constituem pré-condições materiais do próximo slice de infraestrutura e rollout.

## Decisão

```yaml
fase_1_9c: APROVADA
pr_34: AUTORIZADO_PARA_MERGE
backup_verificavel: APROVADO
restore_protegido: APROVADO
telemetria_minimizada: APROVADA
runbooks: APROVADOS
primeiro_deploy_publico: NAO_AUTORIZADO_NESTE_GATE
usuarios_reais: NAO_ATIVADOS
producao_pronta: NAO
```

## Continuidade automática

```yaml
fase: 1.9d
nome: INFRAESTRUTURA_DEPLOY_E_ROLLOUT_CONTROLADO
objetivo: materializar_artefatos_de_deploy_probes_migracao_backup_alertas_e_canario
novo_gate_humano_rotineiro: NAO
```

A transição para o Slice D deve ocorrer imediatamente após o merge do PR #34. O deploy público somente poderá ocorrer quando os recursos externos e os segredos necessários estiverem materialmente disponíveis e os testes de prontidão forem aprovados.
