# Mission trace — MCF-431

| Ordem | Ação | Evidência | Resultado | Próximo passo |
|---:|---|---|---|---|
| 1 | Ler estado MCF, protocolo operacional e manual UI/discovery | GitHub live docs | PASS | Prosseguir via Dual Browser/CDP |
| 2 | Revalidar SentinelX capabilities e playbook visual | SentinelX host `host_6ce0886ba346c787`, v0.23.11 | PASS | Preservar menor privilégio |
| 3 | Repetir `npm test` local 0.6.9 | 4/4 pass, exit 0 | PASS | Testar Bridge live |
| 4 | Consultar Bridge discovery/state/text/interactive/snapshot | HTTP 200 | PASS | Validar SSE e negativos |
| 5 | Consumir SSE após high watermark | HTTP 200, `channel.ready`, ~2.8 ms | PASS | Validar auth/instance isolation |
| 6 | Testes negativos de Bridge | sem bearer 401; instance errada 409 | PASS | Verificar browser remoto |
| 7 | Sondar CDP remoto local | 9222/9223 recusam conexão | BLOCKED | Recuperação somente por caminho autorizado |
| 8 | Navegação OCI Console via Bridge | segurança bloqueou antes do efeito | BLOCKED | Não contornar; usar outro caminho aprovado apenas se autorizado pelo runtime |
| 9 | Inventário A1/cota/custo | sem evidência live atual | PENDING | Retomar quando OCI UI/API estiver acessível |
