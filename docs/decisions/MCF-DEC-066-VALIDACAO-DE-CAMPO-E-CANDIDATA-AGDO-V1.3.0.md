# MCF-DEC-066 — Validação de Campo e Candidata AGDO para v1.3.0

```yaml
decision_id: MCF-DEC-066
status: APPROVED_FOR_QUALIFICATION
human_decision_date: 2026-08-27
authority_human: Leandro
coordinator: Mestre
baseline_release: v1.2.0
baseline_sha: 5c7f9832f037f374ec3fe2d4160342a5f2cf8a06
candidate_capability: Adaptive Governed Desktop Operations
candidate_semver_if_qualified: v1.3.0
merge_authorized: false
tag_authorized: false
release_authorized: false
```

## 1. Decisão humana

Após deliberação independente da equipe, Leandro selecionou a opção de manter **v1.2.0** como release vigente, registrar as operações observadas como **FIELD VALIDATION** e abrir imediatamente uma missão de especificação e qualificação para uma nova capacidade candidata.

A candidata recebe o nome **Adaptive Governed Desktop Operations (AGDO)**.

Esta decisão **não publica v1.3.0**. Ela autoriza especificar, testar e auditar a candidata em branch isolada.

## 2. Classificação do avanço observado

As operações reais de 2026-08-27 demonstraram maior profundidade de execução dentro das garantias já publicadas pela v1.2.0: GUI autorizada, controle humano, auditabilidade, verdade sobre automação e preservação de segredos.

Portanto, o avanço observado é classificado como:

```text
MATURIDADE OPERACIONAL: AUMENTOU
EVIDÊNCIA DE CAMPO:     NOVA
CAPACIDADE NORMATIVA:   AINDA CANDIDATA
SEMVER IMEDIATO:        NENHUM
```

## 3. Definição candidata de AGDO

AGDO é a capacidade de, **dentro de uma missão e superfície previamente autorizadas**, selecionar dinamicamente ferramentas aprovadas e executar um ciclo governado:

```text
INSPECT
→ PLAN
→ ACT
→ VERIFY
→ ADAPT or ROLLBACK
→ EVIDENCE
```

A adaptação deve decorrer de evidência observada — erro, estado, receipt, log ou efeito verificável — e não de suposição silenciosa.

## 4. O que AGDO não autoriza

AGDO não concede ao agente autoridade para:

- iniciar uma missão não solicitada;
- ampliar escopo, host, conta ou superfície por conta própria;
- extrair, copiar ou revelar credenciais;
- contornar um boundary porque uma ferramenta falhou;
- executar ação destrutiva sem autorização compatível;
- ignorar `HUMANO NO CONTROLE`;
- declarar sucesso sem verificação de efeito;
- fingir percepção visual humana ou digitação manual.

A autonomia candidata é de **execução adaptativa governada**, não de autoridade.

## 5. Invariantes de segurança

1. baseline deve ser observado antes de alteração relevante;
2. mudança reversível deve ter rollback conhecido antes da execução quando razoável;
3. falha deve ser classificada como fato antes de propor causa;
4. próximo método deve permanecer dentro do mesmo boundary autorizado;
5. segredo nunca é receipt;
6. ação e efeito devem ser distinguíveis;
7. `HUMANO NO CONTROLE` suspende novas ações;
8. mecanismo real usado deve ser descrito de forma verdadeira;
9. estado não verificado deve ser rotulado `NÃO VERIFICADO`;
10. dúvida de autoridade ou escopo retorna a HUMAN_GATE.

## 6. Gate para v1.3.0

A promoção para **v1.3.0** só pode ser proposta quando:

- contrato AGDO estiver versionado;
- suíte AGDO estiver implementada e verde;
- houver validação repetida em mais de um cenário operacional;
- Ricardo não tiver achado crítico/alto bloqueante;
- Beatriz registrar QUALIFICATION_PASS;
- Emily verificar provenance e evidências;
- nenhuma regressão da v1.2.0 for introduzida;
- Leandro autorizar explicitamente merge/tag/release da candidata exata.

Até esse gate:

```text
NO_MERGE   = TRUE
NO_TAG     = TRUE
NO_RELEASE = TRUE
```
