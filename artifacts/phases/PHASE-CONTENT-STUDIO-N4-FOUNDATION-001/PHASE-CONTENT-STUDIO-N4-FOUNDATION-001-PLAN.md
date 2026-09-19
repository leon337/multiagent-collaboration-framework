# PHASE-CONTENT-STUDIO-N4-FOUNDATION-001 — Plano

## Identificação

```yaml
mission_id: MCF-CONTENT-STUDIO-N4-001
parent_mission_id: null
phase_id: PHASE-CONTENT-STUDIO-N4-FOUNDATION-001
project: multiagent-collaboration-framework
base_commit: 19731f281126c1360e33732dd74b82a85e9e7f7a
state: PLANEJADO
risk_class: B
tracker: 254
branch: planning/mcf-content-studio-n4-20260919
```

## Objetivo verificável

Entregar a fundação N4 com contratos, 10 componentes, Template Registry, Video Lab, importer governado, piloto Aula 3.1 e QA/benchmark suficientes para decidir escala.

## Escopo

- arquitetura N4;
- component library;
- registry;
- Video Lab;
- importer;
- piloto;
- testes;
- benchmark;
- documentação.

## Fora do escopo

- merge automático;
- deploy/publicação;
- compra de assets/licenças;
- editor completo estilo Canva/CapCut;
- migração das 9 aulas antes do piloto;
- importação de terceiro sem revisão.

## Critérios de aceite

- [ ] 10 componentes reutilizáveis;
- [ ] registry pesquisável;
- [ ] Video Lab funcional;
- [ ] 1 componente externo integrado por fluxo governado;
- [ ] Aula 3.1 migrada e sem erro conhecido;
- [ ] QA e benchmark concluídos;
- [ ] phase pack completo;
- [ ] auditoria sem blocker material.

## Riscos e restrições

- código externo: licença/segurança/dependências;
- UX inconsistente: design system;
- regressões visuais: preview/still + QA;
- performance: benchmark;
- escopo excessivo: MVP estrito.

## Agentes selecionados

| Ordem | Agente | Entrega |
|---:|---|---|
| 1 | Mestre | contrato e coordenação |
| 2 | Leonardo | produto/requisitos |
| 3 | Evelyn | direção de experiência |
| 4 | Laura | UX/LX |
| 5 | Isabela | UI |
| 6 | Marina | acessibilidade |
| 7 | Sofia | arquitetura |
| 8 | Rafael | engenharia |
| 9 | Helena | React/Remotion |
| 10 | Renato | QA |
| 11 | Lucas | performance |
| 12 | Gabriel | Git/PR |
| 13 | Carmem | documentação |
| 14 | Augusto | observabilidade |
| 15 | Miriam | proveniência/continuidade |
| 16 | Emily | auditoria |

## Autorizações

- criar branch;
- criar/editar arquivos no branch;
- abrir draft PR;
- executar testes e previews;
- importar apenas prova controlada sem custo/licença nova.

## Proibições

- merge sem gate;
- deploy/publicação externa;
- gasto novo;
- segredo/credencial em artefato;
- confiança automática em componente terceiro.

## Estratégia

`G0 → G1 → G2 → G3 → G4 → G5 → G6 → G7 → G8`

## Próximo gate

Concluir G1 e revisar arquitetura/UX antes de escalar implementação dos componentes.
