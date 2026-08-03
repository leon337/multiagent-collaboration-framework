# MCF-DEC-047-RC-001 — Auditoria da Adaptação do Piloto Público Gratuito

**Data:** 3 de agosto de 2026  
**Revisora:** Emily  
**Coordenação:** Mestre  
**Responsável técnico:** Bruno  
**PR:** #38  
**Estado:** CONCLUÍDO

## Escopo auditado

- Blueprint gratuito do Render;
- inicialização com migração obrigatória antes da API;
- conexões Neon pooled e direta separadas;
- allowlist CORS HTTPS;
- variáveis públicas do Vite;
- arquivos `_headers` e `_redirects` do Cloudflare Pages;
- interface de cold start e limites do piloto;
- testes operacionais de custo zero;
- documentação de implantação.

## Evidências

```yaml
head: bc073def854fde1fd07c81d019b82af5bb63c9bb
workflow_aplicacao: 30826513010
workflow_container_smoke: 30826513191
workflow_documental: 30826512493
install_frozen_lockfile: PASS
format: PASS
lint: PASS
typecheck: PASS
migrations_first_run: PASS
migrations_second_run: PASS
application_tests: PASS
free_pilot_operational_tests: PASS
application_build: PASS
container_smoke: PASS
documentation_validation: PASS
ci_permissions_final: READ_ONLY
```

## Controles confirmados

- o Blueprint declara explicitamente `plan: free`;
- não existe `preDeployCommand`, indisponível no plano gratuito;
- o migrador executa antes da API e uma falha impede o servidor de iniciar;
- a API usa conexão pooled e o migrador aceita conexão direta dedicada;
- URLs e segredos não foram registrados no Git;
- origens de produção precisam ser HTTPS e exatas;
- a interface informa hibernação, cold start e ausência de SLA;
- smoke real comprova migração, bootstrap, readiness e usuário não-root;
- não existe método de pagamento, projeto externo ou URL pública criada por este PR.

## Achados

```yaml
critical: 0
high: 0
medium: 0
low: 7
```

- **LOW-001:** o Render Free pode hibernar e reiniciar sem garantia de disponibilidade;
- **LOW-002:** executar o migrador em cada inicialização aumenta o tempo de cold start, embora seja idempotente;
- **LOW-003:** a CSP usa `https://*.onrender.com` até a URL final existir; deve ser restringida ao host exato antes dos primeiros convites;
- **LOW-004:** o Neon Free pode suspender compute ao atingir limites e não oferece SLA;
- **LOW-005:** backup externo gratuito ainda não foi materialmente configurado;
- **LOW-006:** alertas de consumo e disponibilidade ainda dependem da criação das contas externas;
- **LOW-007:** o smoke público entre Cloudflare, Render e Neon ainda não pode existir sem as três contas e URLs reais.

## Veredito

```yaml
veredito: PASS_WITH_MINOR_RESERVATIONS
merge_blocked: false
adaptacao_interna_aprovada: true
deploy_material_comprovado: false
usuarios_reais_ativados: false
```

A implementação pode ser integrada à `main`. A fase de provisionamento externo deve manter a classificação `PILOTO_PUBLICO_GRATUITO` e fechar os achados LOW-003, LOW-005, LOW-006 e LOW-007 antes do primeiro convite.