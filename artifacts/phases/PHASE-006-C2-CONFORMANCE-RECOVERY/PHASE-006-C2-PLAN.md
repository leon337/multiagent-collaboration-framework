# PHASE-006-C2 — Plano de Recuperação de Conformidade

## Identificação

```yaml
mission_id: MCF-C2-CONFORMANCE-RECOVERY-001
parent_mission_id: MCF-RUNTIME-006-C2
phase_id: PHASE-006-C2-CONFORMANCE-RECOVERY
project: multiagent-collaboration-framework
issue: 81
pull_request: 80
base_commit: e9250b7967f6dcba45b270e4887a495f34145755
state: EM_EXECUCAO
risk_class: B
```

## Objetivo verificável

Restaurar a conformidade operacional do C2 com o Protocolo Operacional Unificado sem reescrever retrospectivamente a execução anterior e sem adicionar nova funcionalidade.

## Escopo

- congelar mudanças funcionais no C2;
- manter o PR #80 em DRAFT durante a recuperação;
- registrar a falha de continuidade/ESEV e seu efeito real;
- criar o PRF desta recuperação;
- validar CI do HEAD documental;
- auditar a recuperação;
- retornar ao gate original do C2 somente após conformidade.

## Fora do escopo

- alterar as três operações do adapter C2;
- habilitar o adapter C2 no registry vivo;
- realizar escrita real no provider GitHub;
- merge, deploy ou produção;
- alegar retroativamente que a execução anterior seguiu ESEV.

## Critérios de aceite

- [x] PR #80 em DRAFT antes da recuperação;
- [x] automação de continuidade do PR #80 desativada durante a recuperação;
- [ ] PRF completo materializado;
- [ ] CI do HEAD de recuperação em PASS;
- [ ] auditoria sem CRITICAL/HIGH aberto;
- [ ] gate de Léo registrado;
- [ ] retorno explícito ao fluxo original do C2.

## Riscos e restrições

- risco de mascarar falha histórica; controle: registrar explicitamente a não conformidade em vez de reescrever a história;
- risco de ampliar o C2 durante a recuperação; controle: documentação apenas;
- risco de usar evidência de SHA antigo; controle: validação e auditoria sempre no HEAD exato.

## Agentes selecionados

| Ordem | Agente | Entrega esperada | Justificativa |
|---:|---|---|---|
| 1 | Mestre | contrato, coordenação e CAF | coordenação obrigatória |
| 2 | Miriam | reconstrução de contexto | retomada e múltiplas fontes |
| 3 | Sofia | classificação de escopo | arquitetura e limites |
| 4 | Carmem | PRF e consistência documental | documentação da fase |
| 5 | Augusto | trace e conformidade do loop | Classe B |
| 6 | Renato | validação técnica | evidência de CI/testes |
| 7 | Emily | auditoria da recuperação | gate de conformidade |
| 8 | Léo | decisão operacional | gate interno |

## Autorizações

- alterações documentais na branch do PR #80;
- consultas e validações read-only no GitHub;
- CI automática da branch.

## Proibições

- nova funcionalidade C2 durante esta recuperação;
- escrita real pelo adapter C2;
- produção;
- uso de LEANDRO como executor técnico ou handoff.

## Estratégia

```text
CAPTURAR → CLASSIFICAR → VERIFICAR EFEITO → RECUPERAR RASTREABILIDADE → VALIDAR → AUDITAR → DECIDIR → RETORNAR AO C2
```

## Próximo gate

Léo decide somente após PRF, CI do HEAD exato e auditoria aplicável.
