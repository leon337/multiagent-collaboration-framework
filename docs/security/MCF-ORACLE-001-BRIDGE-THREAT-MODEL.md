# MCF-ORACLE-001 / P2 — Modelo de ameaças do bridge local (CANDIDATO)

**Autoridade:** Ricardo / segurança; Sofia / arquitetura. **Estado:** controle proposto e testável, não auditoria independente nem pentest.

| Ameaça | Mitigação obrigatória | Teste |
|---|---|---|
| Prompt injection dá ordens perigosas | Decisões são dados; MCF `AuthorityEnvelope` + `PermissionEngine` + `ExternalActionDispatcher` aprovam efeitos | Tentativa de `deploy-production` bloqueada |
| Credenciais OAuth aparecem em GitHub/CI | Não transportar `~/.codex`, cookies, tokens ou `OPENAI_API_KEY`. CLI só roda no host autenticado | Grep de logs/manifestos; permissões dir 0700 |
| Modelo muda silenciosamente | `--model gpt-6-astra` obrigatório; sem alternativo/fallback comercial | Modelo indisponível => erro explícito |
| Sessões de missões se contaminam | Estado e workdir separados por `mission_id`; session IDs privados; locks | Duas missões diferentes sem reutilização de thread |
| Repetição causa efeitos duplos | `request_id` + digest, idempotência no MCF; mesmo ID/payload divergente => reject | Repetir igual/diferente |
| Resultado desconhecido em timeout | `UNKNOWN` e reconciliação manual/comprovada antes do retry | Fake CLI timeout não gera segunda chamada automática |
| Concorrência na mesma thread | Lease/lock por missão; monitorar PID e expiries | Duas consultas simultâneas, apenas uma inicia |
| Execução de shell ou vazamento de environment | `subprocess` com argv array, sem `shell=True`; env allowlist; `--sandbox read-only`; workspace mínimo | Tentativa de injetar flags no mission_id rejeitada |
| Resposta fora de schema/escalada de autoridade | JSON Schema + validadores semânticos; evidência e gate verificados no MCF | Resposta com mission_id diferente rejeitada |
| Usuário vira operador técnico | Uso de conectores existentes, zero microcheckpoints; gate APROVAR/REJEITAR somente reservado | Teste de fluxo sem token manual |
| Dependência notebook | GitHub contém bootstrap; diretório de estado em XDG e OAuth autenticado local, sem segredos exportados | Bootstrap limpo em host secundário (a validar) |
| Custo indesejado | Sem API comercial e sem fallback pago; provider budget verificado antes de recursos cloud | Sem OPENAI_API_KEY no processo; custo desconhecido => BLOQUEADO |

**Limitação explícita:** Vercel, Render, Neon e Supabase diferem em API e scopes. Não afirmar que todo tipo de env/secrets é editável via ferramenta conectada sem testar a ação autorizada. Telemetria de autenticação deve ser apenas `authenticated=true/false`, nunca token ou URL de callback.

**Proibição:** o bridge não escuta em `0.0.0.0` sem autorização e desenho de transport security; interface local via CLI é o primeiro estágio.
