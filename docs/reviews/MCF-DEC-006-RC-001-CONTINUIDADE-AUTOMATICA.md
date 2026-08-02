# RC-001 — MCF-DEC-006 Continuidade Automática após Aprovação

**Data:** 2 de agosto de 2026  
**Revisora:** Emily  
**Objeto:** `MCF-DEC-006-CONTINUIDADE-AUTOMATICA-APOS-APROVACAO.md`

## Escopo revisado

- continuidade automática dentro do escopo aprovado;
- visibilidade sem interrupção;
- critérios de retorno ao Léo;
- preservação de gates humanos;
- compatibilidade com cabeçalho e passagem de bastão;
- limites de autorização.

## Achados positivos

1. Distingue transparência de interrupção.
2. Proíbe confirmações redundantes.
3. Define condições objetivas para continuidade automática.
4. Define condições objetivas para retorno ao Léo.
5. Preserva limites de merge, deploy, publicação e ações críticas.
6. Mantém o trabalho dos agentes visível.
7. É compatível com `MCF-DEC-002` e `MCF-DEC-005`.

## Ressalvas

### Baixa 1 — escopo aprovado deve estar identificável

A continuidade automática depende de contrato ou decisão suficientemente clara. Em missões ambíguas, o Mestre deve primeiro resolver o escopo.

### Baixa 2 — ausência de validação automatizada

A conformidade ainda depende de disciplina operacional.

## Veredito

```yaml
veredito: PASS_WITH_MINOR_RESERVATIONS
critical: 0
high: 0
medium: 0
low: 2
```

## Gate

```yaml
metodologia: aprovada_para_uso_operacional
merge_na_main: nao_autorizado
proxima_acao: atualizar_PR_e_aplicar_regra
```
