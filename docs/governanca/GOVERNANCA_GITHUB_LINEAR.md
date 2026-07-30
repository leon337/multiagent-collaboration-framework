# Governança GitHub–Linear

**Versão:** 0.1-remediação  
**Classificação:** REGRA NORMATIVA  
**Objetivo:** LEA-274  
**Remediação:** GitHub #10  
**PR:** #1

## 1. Finalidade

Definir a divisão de responsabilidade, a sincronização e a reconciliação entre GitHub e Linear.

## 2. Fontes de verdade

### Linear

Controla:

- objetivo estratégico;
- prioridade;
- estado agregado;
- critérios de aceite;
- decisões operacionais resumidas;
- bloqueios estratégicos.

### GitHub

Controla:

- documentos e código;
- issues operacionais;
- branches e commits;
- pull requests e revisão;
- evidências versionadas;
- releases e tags.

## 3. Modo híbrido por limitação de capacidade

Enquanto o Linear não aceitar novas issues:

1. `LEA-274` permanece como objetivo estratégico ativo;
2. loops concluídos são registrados no Linear por atualização ou comentário;
3. a issue GitHub #10 controla a remediação operacional;
4. subtarefas detalhadas podem existir apenas no GitHub;
5. cada checkpoint deve ser resumido no Linear;
6. GitHub não pode declarar estado estratégico incompatível com o Linear.

Esse modo não reduz os critérios de evidência.

## 4. Identificador de rastreabilidade

Todo artefato relevante deve indicar, quando aplicável:

- objetivo Linear;
- issue GitHub;
- PR;
- branch;
- commit;
- estado;
- responsável;
- parecer.

Mensagens de commit devem seguir:

```text
<tipo>(<área>): <resultado> [#issue] [LEA-XXX]
```

## 5. Matriz de reconciliação

| Elemento | Linear | GitHub | Regra de consistência |
|---|---|---|---|
| Objetivo | descrição e aceite | referência nos artefatos | mesmo identificador |
| Estado | agregado | issue operacional | GitHub não supera Linear sem checkpoint |
| Artefato | link ou resumo | arquivo versionado | GitHub prevalece para conteúdo |
| Evidência | resumo | commit, PR, revisão | deve ser localizável |
| Decisão | comentário ou descrição | registro versionado | conteúdo equivalente |
| Bloqueio | estado ou comentário | issue e evidência | causa e condição iguais |
| Release | resultado resumido | tag/release/merge | só após gates |

## 6. Procedimento de checkpoint

Ao concluir uma frente:

1. agente registra artefato e commit na issue GitHub;
2. Léo atualiza o estado da issue;
3. checkpoint consolidado é publicado em `LEA-274`;
4. divergências são corrigidas antes da próxima promoção;
5. a próxima frente inicia automaticamente quando autorizada.

## 7. Divergência

Quando houver divergência:

- o trabalho entra em reconciliação;
- Léo identifica qual informação pertence a cada fonte;
- Gabriel confirma artefatos e versões;
- Emily verifica a correção;
- o estado final não pode ser declarado antes da reconciliação.

## 8. Indisponibilidade de ferramenta

Se uma ferramenta estiver indisponível ou limitada:

- preservar o objetivo e a evidência na ferramenta disponível;
- registrar a limitação;
- manter links e identificadores para sincronização futura;
- não inventar operações que não ocorreram;
- continuar o fluxo quando a limitação não bloquear os gates.

## 9. Liberação

A liberação exige:

- issue de remediação concluída;
- reteste aceito;
- PR reconciliado;
- Linear atualizado;
- autorização vigente;
- registro de release.

A decisão `DF-008` cobre a autorização humana final após esses gates.
