# MCF-DEC-064 — Qualificação da Release Estável v1.0.0

**Status:** EM EXECUÇÃO  
**Classificação:** Classe C  
**Missão:** `MCF-STABLE-RELEASE-001`  
**Issue:** #131

## Decisão

A promoção de `v1.0.0` é um milestone separado da produção e não recebe numeração artificial de Gate F.

A `v1.0.0-RC2@d73d936a63cc9462a95bcf481f4b8e1d4b255719` não pode ser promovida diretamente porque a `main` produtiva avançou depois da RC2 com mudanças materiais de segurança, política de cadastro, deploy, smoke e observabilidade.

O boundary exige uma última identidade candidata imutável: `v1.0.0-RC3`, criada somente após requalificação completa do SHA pós-merge exato desta missão. A `v1.0.0` estável somente poderá apontar para o mesmo SHA qualificado da RC3 após saúde de produção confirmada, auditoria independente, decisão de Léo e HUMAN_GATE de LEANDRO.

## Regras

- RC1 e RC2 permanecem imutáveis;
- RC3 deve ser prerelease e idempotente;
- o SHA de RC3 deve passar Production Readiness completo;
- produção deve materializar o mesmo SHA e permanecer saudável;
- o monitor corrigido deve comprovar ciclos reais sem incidente material aberto;
- findings críticos/altos devem ser zero;
- `v1.0.0` não será criada antes do HUMAN_GATE final de LEANDRO.

## Estado de entrada

```yaml
main: 510ec5abaf14f5d11a504ff7de991887278e025c
production: LIVE
rc1: PRESERVED
rc2: PRESERVED
issue_129: CLOSED_COMPLETED
stable_v1_0_0: BLOCKED_PENDING_QUALIFICATION
```
