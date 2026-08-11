# PHASE-006-LOT-4-C-SECURITY-REVIEW — Plano

**Missão:** `MCF-RUNTIME-006-LOT-4-C-SECURITY-REVIEW`  
**Issue:** #100  
**PR técnico:** #101  
**Classe de risco:** C  
**Baseline canônico:** `4345e502bff27b6fa1ede46274a93a95010b5b03`  
**Candidato validado:** `323b69af4616cda0e4f9b1e47516a9cde37a3f0d`  
**Merge técnico:** `08c3e19e1b6408a164628e1bfaa5968e2070ccf0`

## Objetivo

Promover `MCF-SECURITY-REVIEW` de skill documental para capacidade executável governada, preservando `SENSITIVE_CONTROLLED`, acesso mínimo necessário e o bloqueio de qualquer expansão sensível fora do boundary autorizado.

## Escopo integrado

- contrato tipado como skill executável;
- planner em `READY_AGENT`, Ricardo → Emily;
- Júlia aceita como co-owner canônica;
- piso de risco Classe C sem downgrade;
- provider `internal`;
- operação `inspect-security-review`;
- recurso `mcf-agent-runtime`;
- `sensitiveAuthorization=true` obrigatório;
- `threats` e `controls` semanticamente significativos;
- `residual_risk` estruturado com `level` e `critical_unaddressed:boolean`;
- risco crítico não tratado somente aceito quando explicitamente bloqueado;
- evidência inválida → `RECOVERING`, sem handoff de sucesso;
- persistência de receipt, evidência, eventos, handoff e versão pelo MissionRuntime;
- sucesso → Emily.

## Fora do escopo

- scanners/conectores externos de segurança;
- leitura ou exposição de segredos;
- escrita externa;
- ação destrutiva ou pública;
- produção;
- live staging adapter;
- autorização de escrita real C1/C2;
- mudança do Gate C global;
- `MCF-DEBUG-INCIDENT`;
- `MCF-CLOSE-PHASE`.

## Critérios de aceite

1. `skills_registered=16`, `skills_executable=14`, `skills_documental=2` após integração.
2. `MCF-SECURITY-REVIEW=READY_AGENT`; o bridge não auto-conclui a skill.
3. Ricardo e Júlia aceitos; non-owner negado.
4. Selecionar a skill impõe Classe C e impede downgrade.
5. `SENSITIVE_CONTROLLED` permanece intacto.
6. Ausência de `sensitiveAuthorization=true` é negada.
7. Somente provider/operação/recurso internos do Lot 4-C são aceitos.
8. `secret_exposure` e `unrestricted_write` são negados.
9. Evidência semântica inválida entra em `RECOVERING`, sem handoff.
10. Risco crítico não tratado e não bloqueado impede conclusão.
11. MissionRuntime comprova persistência e progressão de versão.
12. Foundation, Container Smoke, manifesto, reviews, Emily e Léo passam no HEAD exato.
13. Merge é squash protegido por expected-head.
14. Candidato e merge possuem a mesma tree.

## Agentes participantes

- Mestre — orquestração;
- Rafael — implementação;
- Ricardo — segurança;
- Júlia — governança Classe C;
- Renato — validação;
- Vinícius — revisão técnica;
- Augusto — observabilidade/rastreabilidade;
- Carmem — consistência documental;
- Gabriel — Git/PR/integração;
- Emily — auditoria independente;
- Léo — gate operacional.

## Boundary humano

A autorização interna sensível registrada por Léo na Issue #100 cobriu apenas análise/inspeção interna mínima. Nenhum gatilho reservado exigiu LEANDRO.

```yaml
human_operator_actions: 0
human_gate_leandro: NOT_REQUIRED
```

## Estado

`TECHNICAL_OBJECTIVE_COMPLETE_CANONICAL_SYNC_READY_FOR_GATE`
