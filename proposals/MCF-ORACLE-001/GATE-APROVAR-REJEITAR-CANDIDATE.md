# MCF-ORACLE-001 — PACOTE DE REVISÃO CONSTITUCIONAL (NÃO SUBMETIDO)

**Estado:** EM PREPARAÇÃO. **Não pedir aprovação ainda** enquanto a evidência exata do candidate não estiver completa e o gate de segurança global permanecer vermelho.

## Decisão reservada ao humano

Após encerramento de P4/P5, apresentar uma única decisão binária:

**APROVAR** = autorizar formalmente a criação do ORÁCULO como agente oficial de direção estratégica **acima do MESTRE**, preservando a autoridade humana de Leandro, LÉO (gates delegados), HDF/PermissionEngine e todos os gates de produção.

**REJEITAR** = manter 29 agentes oficiais, ORÁCULO fora do catálogo, adapter desligado; conservar artefatos experimentais ou reverter dentro do escopo permitido.

**A aprovação constitucional NÃO autoriza:** API paga, permissões novas de provedor, merge direto na `main`, deploy ou gastos.

## Exatidão exigida ao gate

- Repositório, PR e branch explícitos.
- SHA final do diff e hash do manifesto de contratos.
- Contrato proposto `AGENT-ORACULO-CANDIDATE.md` e patch canônico conjunto.
- Relatório de testes neg/positivos e prova de execução no GitHub e no notebook sem revelar OAuth.
- Estado de Production Readiness e findings de segurança vinculados à revisão exata.
- Plano de rollback: desativar adapter, reverter contrato/matriz através de PR/CI e desabilitar sessões, sem excluir evidências.
- Posição de LÉO, Júlia, Emily e demais papéis de controle com evidências, sem simular independência.
- Riscos residuais e limites de portabilidade.

## Delta constitucional a aprovar

| Fonte normativa | Mudança proposta |
|---|---|
| `docs/agentes/README.md` | Introduzir ORÁCULO como agente 30 e contrato, com contagem sincronizada. |
| `docs/matrices/MCF-MATRIZ-CONSOLIDADA-DE-COMPETENCIAS-29-AGENTES.md` | Nova versão de matriz incluindo ORÁCULO, sem eliminar os 29 existentes. |
| `docs/agentes/MESTRE.md` | Obrigar consulta de estratégia ao ORÁCULO para missões classificadas, mantendo supervisão executiva do MESTRE. |
| `docs/agentes/ORACULO.md` | Instalar contrato novo após APROVAR. |
| `docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md` | Precedência estratégica consultiva vinculante; cláusula fail-closed se conflito. |
| `skills/registry.yaml` | Capacidades mínimas de consulta ORÁCULO e seus limites/handoff, sem duplicar o registry. |
| `apps/.../mcf-runtime/mcf-runtime.module.ts` | Binding explícito condicional sob feature flag pós-gate, não implícito por novo contrato. |

## Critérios impeditivos

- O ORÁCULO só poderá dar estratégia ao MESTRE, nunca autorizar execução fora do HDF.
- Requer segurança de bridge local, autenticação suportada, estado e reconciliação.
- O CI global e o Production Readiness precisam estar verdes antes de qualquer integração constitucional em main/produção; resolver Issue #427 de forma independente.
- Não tratar aprovação de proposta como autorização de deploy/release.
