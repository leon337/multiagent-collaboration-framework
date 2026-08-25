# R3 — Avaliação da `MCF-FAILURE-AUTOPSY`

**Data:** `2026-08-25`  
**Modo:** execução por papéis MCF na mesma sessão; não representa runtime multiagente independente.  
**Baseline:** dois incidentes reais anteriores à skill.

## Caso FA-01 — `FALSE_LOCAL_WORKTREE_ACCESS_ASSUMPTION`

### Reconstrução pelo contrato candidato

- **Objetivo original:** recuperar o trabalho NextGen interrompido do Codex.
- **Fato observado:** `/home/leo` não estava disponível no sandbox da sessão.
- **Premissa adotada:** ausência no sandbox foi tratada como ausência de acesso ao computador/worktree.
- **Verificação omitida:** descoberta de conectores/hosts disponíveis antes de declarar incapacidade.
- **Capacidade omitida:** SentinelX com host `leo-N43SM` e operações de leitura/projeto/Git.
- **Ponto da falha:** conversão da observação `path ausente no sandbox` na conclusão `worktree inacessível` sem evidência suficiente.
- **Regra/boundary violado:** evidência antes de afirmação; `TEAM_FIRST` do Human Delegation Firewall.
- **Impacto:** roadmap de recuperação criado sobre premissa falsa e delegação desnecessária de ZIP/TAR/export a Leandro.
- **Caminho correto:** verificar ferramentas/conectores → descobrir hosts → validar `leo-N43SM` → ler worktree → só então definir recuperação.
- **Prevenção:** antes de alegar incapacidade de acesso/ferramenta, executar descoberta das superfícies disponíveis e, sem confirmação, usar `NAO_VERIFICADO`.

**Veredito do caso:** `PASS` — o contrato força a exposição das omissões que causaram a falha e não depende de cadeia privada token a token.

## Caso FA-02 — `TWO_APPARENT_ACTIVE_ROADMAPS`

- **Objetivo original:** preservar histórico da primeira tentativa e manter um roadmap corrigido.
- **Fato:** o arquivo superseded permaneceu ao lado do canônico em `docs/roadmaps/`.
- **Premissa inadequada:** preservar o arquivo no mesmo diretório ativo seria suficiente para preservar auditabilidade sem criar ambiguidade.
- **Ponto da falha:** não distinguir `evidência histórica` de `fonte operacional ativa` na organização documental.
- **Regra/boundary afetado:** fonte canônica única / precedência de verdade.
- **Impacto:** um novo agente/chat poderia retomar a missão pela fonte errada.
- **Caminho correto:** manter um único roadmap canônico na superfície ativa e preservar a versão inválida em history/Git com `SUPERSEDED` explícito.
- **Prevenção:** teste de unicidade da fonte canônica e rejeição de artefatos superseded pelo checkpoint da missão.

**Veredito do caso:** `PASS`.

## Beatriz — scorecard

| Critério | Resultado |
|---|---:|
| trigger curto seleciona skill correta | 10/10 |
| fatos separados de hipóteses | 15/15 |
| trace cronológico verificável | 15/15 |
| ferramentas usadas/omitidas | 15/15 |
| ponto da decisão incorreta | 10/10 |
| regra/boundary identificado | 10/10 |
| impacto sustentado | 5/5 |
| caminho correto reproduzível | 10/10 |
| prevenção acionável | 5/5 |
| cadeia privada não inventada | 5/5 |
| **Total** | **100/100** |

**Beatriz:** `PASS_STRUCTURAL_AND_SCENARIO`.

## Emily — auditoria

- Os dois casos usam eventos documentados na própria missão.
- Causa e consequência foram limitadas ao que pode ser sustentado pelas evidências disponíveis.
- O contrato exige `NAO_VERIFICADO` quando não houver prova suficiente.
- A skill está registrada como `EXPERIMENTAL` e não é declarada como executável pelo `SkillExecutor`.
- A validação atual prova o **contrato de governança e seu comportamento esperado nos cenários desta missão**; não prova integração ao conjunto tipado do runtime.

**Emily:** `SUFICIENTE_PARA_GATE_INTERNO_R3`, com limitação de runtime explicitada.

## Gate operacional de Léo

**Decisão:** `APROVAR_COM_RESSALVA`.

**Ressalva:** a skill pode avançar como skill de governança/orquestração `EXPERIMENTAL`; promoção a runtime executável exige missão separada e mudanças tipadas no `McfExecutableSkillId`/executor/validators.

**Próxima ação autorizada:** avançar para `R4 — MCF-MISSION-CHECKPOINT`.