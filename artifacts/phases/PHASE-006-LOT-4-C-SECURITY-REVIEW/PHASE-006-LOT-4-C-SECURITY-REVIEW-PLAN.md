# PHASE-006-LOT-4-C-SECURITY-REVIEW — Plano

**Missão:** `MCF-RUNTIME-006-LOT-4-C-SECURITY-REVIEW`  
**Issue:** #100  
**PR técnico:** #101 (draft)  
**Classe de risco:** C  
**Baseline canônico:** `4345e502bff27b6fa1ede46274a93a95010b5b03`  
**Candidato funcional pré-PRF:** `772fcb71ab5e2af21d81323109573550352a581e`

## Objetivo

Promover `MCF-SECURITY-REVIEW` de skill documental para executável sem ampliar o boundary sensível vigente.

## Escopo

- tipar a skill como executável;
- planejar `MCF-SECURITY-REVIEW` como `READY_AGENT`;
- selecionar Ricardo como owner primário e aceitar Júlia como co-owner canônica;
- exigir `SENSITIVE_CONTROLLED` com `sensitiveAuthorization=true`;
- restringir execução ao provider `internal`, operação `inspect-security-review` e recurso `mcf-agent-runtime`;
- exigir evidência semântica `threats`, `controls` e `residual_risk`;
- bloquear sucesso quando risco crítico permanecer não tratado e não bloqueado;
- persistir receipt, evidência, eventos, handoff e progressão de versão no MissionRuntime;
- transferir sucesso para Emily.

## Fora do escopo

- scanners ou conectores externos de segurança;
- leitura ou exposição de segredos;
- escrita externa;
- ação destrutiva ou pública;
- produção;
- live staging adapter;
- autorização de escrita real C1/C2;
- mudança do Gate C global.

## Critérios de aceite

1. `skills_registered=16`, alvo após integração: `skills_executable=14`, `skills_documental=2`.
2. Planner: `READY_AGENT`, sem auto-completion pelo bridge.
3. Owners: Ricardo e Júlia aceitos; non-owner negado.
4. Risk floor: uma missão que selecione `MCF-SECURITY-REVIEW` é Classe C e não pode ser rebaixada.
5. `SENSITIVE_CONTROLLED` preservado; ausência de `sensitiveAuthorization=true` é negada.
6. Provider interno permitido; provider externo negado neste incremento.
7. `secret_exposure` e `unrestricted_write` negados.
8. `threats`, `controls` e `residual_risk` devem ser semanticamente significativos.
9. Risco crítico não tratado/não bloqueado produz `RECOVERING` e proíbe handoff de sucesso.
10. Evidência válida conclui a fase e entrega a Emily.
11. MissionRuntime persiste receipt, evidência, eventos, handoff e versão.
12. Foundation, Container Smoke e PRF manifest devem passar no HEAD exato do PRF antes dos reviews finais.

## Autorizações e proibições

A autorização interna sensível de Léo registrada na Issue #100 cobre somente análise/inspeção interna mínima da skill. Ela não autoriza segredo, escrita externa, ação destrutiva/pública, plugin sensível externo, produção ou mudança de finalidade.

`human_gate_leandro=NOT_REQUIRED` enquanto esse boundary não for ampliado.

## Agentes selecionados

- Mestre — orquestração e continuidade da missão.
- Rafael — implementação do runtime.
- Ricardo — revisão de segurança e critérios de ameaça/controle.
- Júlia — governança obrigatória de Classe C.
- Renato — validação e smoke.
- Vinícius — revisão técnica do diff no HEAD exato do PRF.
- Augusto — mission trace, falhas, CAF e rastreabilidade Classe C.
- Carmem — consistência documental do PRF.
- Gabriel — branch, PR e integração protegida.
- Emily — auditoria independente.
- Léo — gate operacional final.

## Fluxo

`IMPLEMENTAR → VALIDAR CANDIDATO → GERAR PRF → REVALIDAR HEAD PRF → REVIEWS → AUDITORIA EMILY → GATE LÉO → INTEGRAÇÃO PROTEGIDA → RECONCILIAÇÃO CANÔNICA`

## Riscos principais

- rebaixar a classificação de uma missão sensível;
- transformar `sensitiveAuthorization=true` em bypass genérico;
- aceitar evidência vazia/placeholder;
- despachar provider externo por engano;
- declarar sucesso com risco crítico sem tratamento;
- reutilizar PASS de SHA superseded.

## Estado deste documento

`CANDIDATE_PRF_AWAITING_EXACT_HEAD_REVALIDATION`
