# PRF — MCF-ORG-049 — Expansão para 49 Agentes

**Data:** 2026-08-23  
**Autoridade humana:** Leandro  
**Branch:** `team/mcf-49-agents-20260823`  
**Base:** `main@f52485d2bff004df2f1c6b1eb787575d9ad5a8fc`

## Objetivo
Canonicalizar a expansão aprovada do MCF de 29 para 49 agentes, criando contratos especializados de Design & Experience Engineering e AI & Model Systems sem declarar runtime inexistente.

## Critérios de aceite

- [x] MCF-DEC-053 registra aprovação humana e invariantes.
- [x] 20 novos agentes possuem contratos individuais.
- [x] Evelyn e Tiago possuem contratos de liderança sem acúmulo silencioso de especialidades.
- [x] matriz canônica de 49 agentes existe.
- [x] `docs/agentes/README.md` indexa 49 contratos.
- [x] tool matrix inclui os novos especialistas.
- [x] registry inclui novas skills especializadas.
- [x] README e CURRENT-STATE distinguem `registered=22`, `executable=16`, `documental_only=6`.
- [x] nenhum arquivo de runtime foi alterado nesta fase.
- [ ] CI do PR verde.
- [ ] review/auditoria final do PR.

## Evidência do diff

Comparação live da branch contra `main` antes do PR:

```yaml
status: ahead
ahead_by: 30
behind_by: 0
changed_files_before_prf: 30
new_agent_contracts: 20
runtime_files_changed: 0
```

## Limitação deliberada

As seis novas skills possuem `runtime_status: DOCUMENTAL_ONLY`. O `SkillExecutor` atual mantém uma allowlist explícita com 16 IDs. Esta fase não altera essa allowlist, não implementa evidence handlers novos e não afirma execução das novas skills.

## Próxima fase proposta

`MCF-ORG-049-RUNTIME` — implementar as novas skills no runtime em lotes, com testes de permission/evidence/planner e gates independentes.

## Estado

`READY_FOR_PR / CI_PENDING`
