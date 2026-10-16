# MCF-ORACLE-001 — Playbook do loop autônomo orientado a objetivos no ChatGPT

**Estado:** especificação de execução; não é servidor adicional, não altera código do MissionRuntime nem cria API comercial.

## Fluxo operacional do MESTRE (na conversa)

1. Receber objetivo humano e montar contrato de missão/phase (21 campos da seção 3 do protocolo), classificação e limites `paid_ai_api=false`. Não pedir checkpoints técnicos ao usuário.
2. Consultar o inventário e o GitHub para identificar MissionRuntime, registry, ferramentas, workflows, conexões e gates existentes. Não atribuir capacidade por inferência.
3. Selecionar notebook autorizado em `Remote Desktop Commander list_devices`, inspecionar apenas status `codex login status` e `bridge status --mission-id ...`. Não compartilhar cookies ou tokens. Se autenticação expirar, abrir somente a autorização humana legítima.
4. Criar request JSON schema v1 para a missão, com `mission_id`, `request_id` único, `idempotency_key`, `session_epoch`, políticas de custo, prazos e referências públicas de evidência. Validar antes de enviar; dados externos não confiáveis não podem ampliar scopes.
5. Acionar `python3 oracle_bridge.py consult --request ... --decision-schema ...` **no host**, através do conector remoto autorizado, sem transport OAuth para GitHub. `mission_id` seleciona thread persistente no host.
6. Receber `COMPLETED` ou `CACHED`, validar schema e ids, registrar `decision_id`, hash do plano, política e receipt não sensível. Se `BLOCKED/UNKNOWN`, não executar ação ou repetir turnos cegamente; reconciliar apenas recibos localmente comprovados.
7. Acionar pelo MESTRE o MCF canônico e GitHub Actions/sandbox/conectores relevantes, respeitando `AuthorityEnvelope`, HDF, RACI e gates. Handoffs são eventos e artefatos GitHub com commit SHA/teste. O ORÁCULO não executa ferramentas por conta própria.
8. Para falha material, agrupar evidências, reaproveitar thread por missão com `request_id` novo, obter replanejamento. Limitar loops por tentativas/quota/tempo/política de custos; não substituir por paid fallback.
9. Auditar com suíte de testes e, se necessário, modelo independente real; declarar NÃO VERIFICADO se não houver. Realizar auditoria de segurança e readiness antes de liberar PR, merge e deploy.
10. Não reportar microcheckpoints ao usuário; retornar só em conclusão validada ou **gate humano real** APROVAR/REJEITAR. Em tarefas longas, agendamento/durabilidade exigem o runtime existente (GitHub Actions, MCF jobs etc.); a mera conversa não continua sozinha após o turno.

## Reconciliação

- `CACHED`: mesma request fingerprint e checksum; sem turno cognitivo.
- `UNKNOWN` com recibo local e thread pré-registrados: `reconcile --request ...` pode produzir `RECOVERED`, sem chamada ao modelo.
- `UNKNOWN` sem prova: bloqueado e reconciliado no MCF; nunca apagar estado/cookies para reiniciar silenciosamente.
- Troca de SSD ou modelo: reconstruir software via GitHub, autenticar Codex oficialmente no novo host, nova epoch sob contrato; estado privado original não será copiado como parte do repositório.

## Classes de execução e evidência

| Classe | Exemplo | Evidência |
|---|---|---|
| LLM realmente acessado | DEC-002/003/004 em Codex autenticado no notebook | `decision_id`, checksum/recibo privado, status CLI (sem segredos) |
| Componentes MCF reais + executor mock | CI do adapter e Python bridge com fake Codex | Job/commit exatos, subprocessos e testes |
| Worker de sistema operacional não cognitivo | LocalAgentTeamAdapter 8 processos | Receipt PostgreSQL efêmero e execução de job |
| Papéis de especialistas na conversa | Sofia/Ricardo/etc na mesma sessão | Artefato produzido com tool SHA, **não** independência cognitiva |
| Subagentes cognitivos independentes | Apenas se runtime comprovar múltiplas sessões/models reais | Execução/identificadores/recibos por agente; NÃO VERIFICADO neste projeto |

## Segurança

- Não usar API comercial IA, tokens em prompt, fallback pago, credenciais no GitHub, bypass de limites.
- Variáveis de provedores só são escritas pelas ferramentas MCP autorizadas e compatíveis; segredos ficam no store externo.
- User é autoridade final para o gate constitucional, mas não executor técnico.
