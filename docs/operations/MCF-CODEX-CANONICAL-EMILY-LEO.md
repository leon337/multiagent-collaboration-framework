# Perfis canônicos Emily e LÉO no Codex — integração MCF

**Estado:** perfis operacionais de projeto para Codex; não concedem autenticação/gates do runtime MCF.
**Fonte normativa:** [Emily](../agentes/EMILY.md), [LÉO](../agentes/LEO.md), [MCF-DEC-017](../decisions/MCF-DEC-017-DELEGACAO-DE-GATES-INTERNOS-AO-AGENTE-LEO.md), [MCF-DEC-050](../decisions/MCF-DEC-050-QUATRO-AGENTES-DE-CONTROLE-E-PADRAO-OPERACIONAL-UNIFICADO.md), [Protocolo unificado](../protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md) e [Mecanismo A](../protocols/MCF-MECANISMO-A-SUBAGENTES-NATIVOS.md).
**Identidade:** LEANDRO = humano final; MESTRE = orquestrador; Emily = auditoria; LÉO = autoridade operacional delegada. Alias de busca 'Emilly' referencia Emily, nunca cria outro agente.

## Estrutura suportada pelo Codex

- `.codex/agents/emily.toml`: subagente `emily`, auditoria de evidências, leitura e parecer; sem alterar artefatos.
- `.codex/agents/leo.toml`: subagente `leo`, deliberação/recomendação interna a partir do parecer Emily; sem aprovar gate sem autenticação.
- `.codex/config.toml`: habilita multi-agent e limita a duas threads simultâneas; **não** dá permissões extras nem altera o modelo.
- `AGENTS.md`: ponto de descoberta para sessões novas.
- `ops/codex/validate_canonical_agents.py`: valida TOML, fontes, escopo, limites e contrato de handoff; testado na CI.

Codex carrega perfis de projeto quando o checkout é confiável, com modelo e permissões herdados da sessão. A disponibilidade real varia conforme cliente e Cloud. A criação de arquivos **não prova** que um subagente foi convocado, executou, foi autenticado pelo MCF, ou aprovou gate.

## Procedimento de convocação em Codex (duas threads distintas, sequência)

1. **MESTRE** verifica Issue, SHA real, PRF, testes e `docs/MCF-CURRENT-STATE.md`; seleciona missão e fase.
2. Em sessão de Codex cujo checkout contenha os arquivos desta branch, solicite: `Invoque o subagente emily para auditar somente leitura <mission_id>/<phase_id> no HEAD <SHA>. Leia os contratos MCF. Retorne achados com provas e o ID real da thread. Não altere arquivos, PRs ou gates.`
3. Aguarde o resultado comprovado, confira se SHA e evidências correspondem ao alvo; não aceite "EMILY disse" sem log/ID.
4. Solicite: `Invoque o subagente leo em uma OUTRA thread, entregue o parecer e SHA da Emily e determine apenas a recomendação de continuidade conforme MCF-DEC-017. Não emita gate formal sem autenticação da identidade no runtime MCF.`
5. Verifique o ID distinto das threads e os receipts reais, registre na Issue canônica e encaminhe ao runtime MCF para decisão formal quando a vinculação HDF/PermissionEngine e as atribuições de identidade estiverem implementadas.
6. Se o cliente não expuser subagentes, usar `AGUARDANDO_EXECUTOR_CODEX`; se MCF não autenticar a identidade, usar `AGUARDANDO_EXECUTOR_NATIVO` para o gate formal. Não retroativamente converter CLI, GitHub bot ou persona em Agent Session.

**Exemplo de texto para o Codex parent:**

```text
MCF MESTRE: não altere arquivos. Verifique a Issue #527 e HEADs reais.
Delegue primeiro ao subagente Codex emily a revisão somente leitura do SHA
do PR alvo, com evidências e riscos, e aguarde a thread concluir.
Depois delegue ao subagente Codex leo, em thread separada, a análise
do parecer Emily e recomendação de continuidade; não feche gates.
Retorne IDs reais de ambas as threads, SHA e status, sem inventar gates.
```

## Fronteira de autoridade — requisito não negociável

**Configuração de persona NÃO É comprovação de função oficial do MCF.**
Um subagente Codex tem contexto próprio e nome de perfil, mas isso não concede
autorização como Emily e LÉO nativos no MissionRuntime. A distinção está expressa
no `MCF-MECANISMO-A-SUBAGENTES-NATIVOS.md`. Para fechar gate oficial, obter
sessão autêntica ou mecanismo aprovado com identidade e HDF/PermissionEngine,
recibo, assinatura/controle de emissor, evidência vinculada ao SHA alvo e decisão
de escopo. A identidade não pode ser autodeclarada em Markdown.

Para a missão `MCF-GEMINI-LIVE-EVOLUTION-20261116-001`, os gates
F0.8, F1.6, F2.6, F3.7 e F4.6 **não são fechados pela instalação destes perfis**.
Teste de voz físico, SSRF/DNS rebinding, vínculo HDF e F4 exigem implementação
e validação próprias. Merges e deploys continuam sujeitos a regras de proteção
do GitHub e autoridade vigente.

## Recibo mínimo por agente

```yaml
mission_id: MCF-GEMINI-LIVE-EVOLUTION-20261116-001
phase_id: F3
agent_name: emily | leo
surface: CODEX_PROJECT_SUBAGENT
codex_thread_id: # inserir ID da ferramenta real, não fabricar
target_sha: # obter GitHub ao vivo
parent_review_sha: null
evidence_links: []
observed_checks: []
unverified_checks: []
recommendation: # veredito técnico / recomendação
mcf_authenticated_agent_session: false
formal_mcf_gate: PENDING
handoff_to: LEO | MESTRE
```

## Validação e rollback

Executar `python3 ops/codex/validate_canonical_agents.py` no checkout da branch.
A CI executa a mesma verificação. Opcionalmente, com Codex disponível e sessão
read-only, executar uma delegação de **dry-run contratual** e registrar IDs
reais; o dry-run não concede gate. Em caso de falha, reverter o PR ou remover
os novos arquivos de configuração: não há dados persistentes de usuário,
chaves, rede ou runtime alterados.
