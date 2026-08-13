# MCF v1.0.0-RC3 — Final Production Candidate

**Missão:** `MCF-STABLE-RELEASE-001`  
**Issue:** #131  
**RC1 preservada:** `v1.0.0-RC1@9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8`  
**RC2 preservada:** `v1.0.0-RC2@d73d936a63cc9462a95bcf481f4b8e1d4b255719`

## Finalidade

RC3 consolida o estado realmente usado em produção após as correções pós-RC2: cadastro controlado, hardening de configuração, convergência do container/deploy e monitor de readiness tolerante a cold start.

## Publicação

RC3 somente pode ser publicada após `MCF Production Readiness` PASS no SHA pós-merge exato da missão. A publicação deve ser idempotente e jamais retargetar RC1 ou RC2.

## Relação com v1.0.0

```yaml
rc3: final_candidate
production_health: required
independent_audit: required
leo_gate: required
leandro_human_gate: required_before_stable_publication
stable_v1_0_0: blocked_until_all_requirements_pass
```

A tag estável, se autorizada, deverá apontar exatamente para o mesmo SHA imutável da RC3 qualificada.
