# MCF — Brief de Reconciliação Documental Completa 001

**Destinatário:** MESTRE do chat de implementação/desenvolvimento  
**Autoridade humana final:** LEANDRO  
**Natureza:** instrução de auditoria e reconciliação documental  
**Fonte de discovery:** `planning/mcf-nextgen-discovery`  
**Checkpoint:** `docs/proposals/MCF-NEXTGEN-DISCOVERY-CHECKPOINT-001.md`  

---

## PROMPT OPERACIONAL

Você está dentro do projeto oficial **MCF — Multiagent Collaboration Framework**.

Repositório oficial:

`leon337/multiagent-collaboration-framework`

LEANDRO é a autoridade humana final. LÉO é um agente distinto. Você atua como MESTRE do fluxo de implementação.

### MISSÃO

Executar uma **auditoria e reconciliação documental completa do MCF**, porque já foi identificado drift relevante entre o estado real do repositório/runtime e documentos canônicos/públicos.

Esta missão NÃO autoriza redesign amplo do runtime, NÃO autoriza implementação da próxima geração e NÃO autoriza publicação da `v1.0.0`.

A documentação deve representar com precisão:

1. o que existe e funciona hoje;
2. o que é histórico;
3. o que é experimental;
4. o que está em processo de qualificação;
5. o que está apenas em estudo para a futura reestruturação.

---

## 1. REGRA DE FONTE DE VERDADE

Antes de editar qualquer documento:

1. consulte o estado real no GitHub;
2. recupere `main`, SHA, PRs, Issues, tags, releases, workflows e CI relevantes;
3. leia a implementação atual do runtime;
4. leia os testes permanentes;
5. leia os PRFs/checkpoints e documentos vigentes;
6. compare cada afirmação documental com evidência verificável;
7. não copie estado antigo somente porque está no README atual.

Se houver conflito:

1. instrução explícita atual de LEANDRO;
2. GitHub live;
3. código/testes/evidência atual;
4. documentação canônica vigente;
5. histórico.

---

## 2. BOUNDARY DA STABLE — NÃO CONTAMINAR

No momento de emissão deste brief foi observado:

- `main@7f741e10d0e745a90c732e084400b11e3f5e6794`;
- PR #133 OPEN, não merged;
- PR #133 head observado: `43d68992d61655850f54ff1ca6585664fe6c3e89`;
- body do PR reportando `publication_P0_count: 0` e `publication_P1_count: 2` ainda pendentes de revisão independente terminal;
- `HUMAN_GATE: NÃO_APROVADO`;
- tag exata `v1.0.0`: ausente;
- GitHub Release exata `v1.0.0`: ausente.

**Esses valores são fotografia de emissão, NÃO substituem revalidação live.**

Antes de agir, revalide tudo.

Não:

- merge PR #133;
- criar `v1.0.0`;
- criar stable Release;
- alterar `latest`;
- mudar o candidato RC3;
- inferir aprovação humana;
- usar atualização documental como autorização de publicação;
- inserir commits oportunistas no boundary de stable sem seguir a governança atual.

Se a reconciliação documental precisar de branch própria, crie/prepare uma branch documental isolada e preserve o boundary da stable. Merge só ocorre quando governança permitir.

---

## 3. CHECKPOINT NEXTGEN — FONTE DE ESTUDO, NÃO DE CAPACIDADE ATUAL

Leia integralmente na branch:

`planning/mcf-nextgen-discovery`

arquivo:

`docs/proposals/MCF-NEXTGEN-DISCOVERY-CHECKPOINT-001.md`

Esse checkpoint contém decisões, hipóteses e estudos da fase de amadurecimento pós-Fase-Zero.

Classifique cada item explicitamente.

Use, no mínimo:

- `CURRENT_IMPLEMENTED`
- `EXPERIMENTAL`
- `PLANNED`
- `UNDER_STUDY`
- `HISTORICAL`
- `SUPERSEDED`

É PROIBIDO transformar uma hipótese `UNDER_STUDY` em capacidade atual apenas para deixar o README mais impressionante.

---

## 4. ESCOPO DOCUMENTAL MÍNIMO

Faça inventário e revisão de toda documentação que possa declarar estado, arquitetura, governança, capacidades ou história do MCF.

Inclua obrigatoriamente, quando existirem:

### Raiz

- `README.md`
- `CHANGELOG.md`
- arquivos de licença/metadata quando relevantes à descrição pública
- índices principais

### Docs

- `docs/README.md`
- `docs/runtime/**`
- `docs/protocols/**`
- `docs/decisions/**`
- `docs/agentes/**`
- `docs/governanca/**`
- `docs/auditoria/**` e `docs/audits/**`
- `docs/evidence/**`
- `docs/releases/**`
- `docs/reviews/**`
- `docs/runbooks/**`
- `docs/projects/**`
- `docs/proposals/**`
- documentação de production readiness / staging / release candidate / stable quando aplicável

### Runtime/skills

- documentação do `skills/registry.yaml` e quantidade/capacidade real das skills;
- documentação do runtime executável;
- caminhos reais do código;
- adapters/providers;
- persistência/ledger;
- observabilidade;
- Human Delegation Firewall / permission model;
- gates e boundaries que realmente estejam enforced.

### Experimentos

Preservar corretamente o status de:

`experimentos/telefone-sem-fio-001`

O resultado do experimento declara evidência positiva de preservação, mas também declara que o isolamento foi documental/simulado no mesmo ChatGPT. Não reescrever isso como independência cognitiva comprovada.

---

## 5. README — OBJETIVOS ESPECÍFICOS

O README raiz deve permitir que um auditor externo descubra rapidamente que existe runtime executável.

Problema observado anteriormente: o core técnico pode ser interpretado como ausente ou secundário porque está pouco descobrível e atualmente localizado dentro da árvore da aplicação `apps/rede-social-agentes/.../mcf-runtime`.

Atualize o README para separar claramente:

1. o que é o MCF;
2. finalidade atual;
3. arquitetura executável real;
4. localização do runtime;
5. o que são agentes e skills;
6. estado atual verificável;
7. o que é experimental;
8. limitações conhecidas;
9. quick map da documentação;
10. release status correto;
11. NextGen/discovery como estudo separado.

Não esconda limitações.

---

## 6. CHANGELOG — CORRIGIR DÉFICIT HISTÓRICO

O `CHANGELOG.md` atual está materialmente subdimensionado em relação à evolução real do repositório.

Reconstrua um changelog útil e auditável a partir de evidências reais.

Não é necessário listar centenas de commits individualmente.

Agrupe por marcos/versionamento/boundaries verificáveis, por exemplo:

- bootstrap inicial;
- decisões/protocolos importantes;
- introdução/evolução do runtime;
- skills executáveis;
- persistência/ledger;
- adapters;
- observabilidade;
- Gate C/provider write;
- Gate D;
- Gate E/RC1;
- RC2;
- RC3;
- production readiness;
- preparação de stable ainda NÃO publicada;
- correções de governança materiais.

Para cada marco, use somente datas, PRs, Issues, SHAs, tags e runs que conseguir provar.

Não criar entrada de `v1.0.0` como publicada enquanto ela não existir.

---

## 7. DRIFT E CONTRADIÇÕES

Procure ativamente afirmações obsoletas como:

- “próximo boundary” já concluído;
- produção ainda `BLOCKED` quando existe estágio posterior comprovado;
- Gate C como `NOT_AUTHORIZED` quando histórico posterior demonstra conclusão;
- contagem de skills desatualizada;
- SHAs antigos apresentados como estado atual;
- auditorias antigas apresentadas como atuais;
- `PASS` sem ressalva metodológica;
- agentes declarados independentes quando houve apenas separação funcional;
- paths antigos;
- status de staging/production/release divergentes.

Produza uma matriz de drift:

```text
DOCUMENTO | AFIRMAÇÃO ANTIGA | EVIDÊNCIA ATUAL | CORREÇÃO | CLASSIFICAÇÃO
```

---

## 8. ARQUITETURA DE INFORMAÇÃO

Avalie se a documentação atual possui excesso de fontes concorrentes para “estado atual”.

Se sim, proponha e implemente, somente se seguro e justificável, uma estrutura canônica simples que responda:

- qual documento é o índice público;
- qual documento declara o estado atual;
- qual documento registra histórico;
- onde vivem propostas/discovery;
- onde vivem decisões;
- onde vivem PRFs/evidências;
- onde vive documentação do runtime.

O objetivo é reduzir drift futuro.

Não invente uma nova camada documental maior do que o problema.

---

## 9. NEXTGEN / FASE ZERO

Documente com clareza que existe uma fase de discovery pós-Fase-Zero, mas sem anunciar implementação inexistente.

O material de estudo inclui, entre outros:

- continuidade durável;
- Project Capsule (hipótese);
- framework/project/live memory layers;
- model routing;
- agente desacoplado do modelo;
- multi-project isolation;
- activity feed/rede social como observabilidade;
- Interaction Center/perguntas guiadas;
- graph/loop engineering;
- paralelismo e DAG;
- stop conditions;
- retry budget;
- human escalation;
- tool failure recovery;
- sandboxing;
- autenticação de agentes;
- permissões granulares;
- caching/rate limiting;
- prompt-injection security;
- spec-driven development;
- evaluation frameworks;
- guardrails;
- AI gateways;
- cost optimization;
- VPS como capacidade de deployment própria e portátil.

Esses itens são `UNDER_STUDY` salvo quando o repositório provar que algum equivalente já é `CURRENT_IMPLEMENTED`.

Para cada conceito, mapeie:

```text
CONCEITO
→ equivalente atual no MCF?
→ documental ou enforced?
→ teste/evidência?
→ gap?
→ status: preservar / melhorar / simplificar / substituir / estudar
```

Não implemente a reestruturação nesta missão documental.

---

## 10. VPS

A nova VPS é uma capacidade de infraestrutura futura/compartilhada, não dependência conceitual do MCF e não deve ser tratada como produção qualificada sem consultar a missão específica de configuração/hardening.

Documentação do MCF deve distinguir:

- requisito do framework;
- deployment opcional;
- deployment recomendado;
- infraestrutura específica da operação de LEANDRO.

MCF deve permanecer portável.

Não substituir referências de infraestrutura atual por “Contabo” como requisito universal.

---

## 11. QUALIDADE E TESTES DOCUMENTAIS

Depois das alterações:

1. rode documentação validation existente;
2. valide links/paths quando houver tooling;
3. procure referências obsoletas automaticamente (`grep`/scripts quando útil);
4. confirme números de skills/agentes/testes somente quando sustentados;
5. confirme SHAs/tags/releases live;
6. confirme que proposta NextGen não aparece como capacidade atual;
7. confirme que `v1.0.0` não foi publicada pela missão;
8. confirme que nenhum código/runtime foi modificado sem necessidade;
9. confirme diff estritamente coerente com missão documental.

---

## 12. REVISÃO INDEPENDENTE

Depois da reconciliação:

- solicite revisão independente do HEAD exato da branch documental;
- peça explicitamente ao revisor para procurar exageros, marketing indevido, estado stale, contradições e mistura entre `CURRENT` e `UNDER_STUDY`;
- corrija findings materiais antes de considerar a documentação reconciliada.

---

## 13. CHECKPOINT DE RETORNO AO MESTRE DE GOVERNANÇA

Retorne a LEANDRO/MESTRE com:

```yaml
MISSION: MCF-DOCUMENTATION-RECONCILIATION
STATE:
BASE_SHA:
DOC_BRANCH:
DOC_HEAD:
MAIN_SHA:
PR_133_HEAD:
STABLE_V1_0_0:
FILES_AUDITED:
FILES_CHANGED:
DRIFT_FINDINGS:
CURRENT_STATE_CORRECTIONS:
CHANGELOG_RECONSTRUCTION:
README_CORRECTIONS:
RUNTIME_DOC_CORRECTIONS:
NEXTGEN_DISCOVERY_CLASSIFICATION:
EXPERIMENT_STATUS:
VALIDATION:
INDEPENDENT_REVIEW:
OPEN_FINDINGS:
STABLE_BOUNDARY_IMPACT: NONE_or_explain
NEXT_ACTION:
```

Inclua links/SHAs/runs verificáveis.

---

## 14. PROIBIÇÕES FINAIS

Esta missão NÃO autoriza:

- publicação da stable;
- merge do PR #133;
- criação da tag `v1.0.0`;
- GitHub Release stable;
- redefinir HUMAN_GATE;
- redesign do runtime NextGen;
- implementar ideias do discovery apenas porque parecem boas;
- falsear independência de agentes;
- ocultar limitações do experimento `telefone-sem-fio-001`;
- misturar estado atual com roadmap.

### Resultado esperado

Ao final, qualquer humano ou IA que abra o repositório deve conseguir distinguir rapidamente:

1. o que o MCF é hoje;
2. o que realmente executa;
3. qual é o estado real;
4. quais marcos levaram até aqui;
5. quais limitações permanecem;
6. o que está apenas em estudo para a próxima geração;
7. onde encontrar a fonte de verdade para continuar o trabalho.
