# Ecosystem Recovery Audits

Pasta canônica para receber os relatórios independentes das quatro equipes de auditoria/recuperação do ecossistema.

## Governança

- Autoridade humana final: LEANDRO.
- MESTRE CENTRAL: coordena a auditoria cruzada e a distribuição posterior dos serviços.
- As equipes desta fase são somente auditoras: não implementam, corrigem, integram ou fazem merge final.
- Cada equipe deve produzir um relatório independente antes de qualquer redistribuição de trabalho.

## Arquivos esperados

- `TEAM-01.md`
- `TEAM-02.md`
- `TEAM-03.md`
- `TEAM-04.md`
- `CENTRAL-SYNTHESIS.md` — reservado ao MESTRE CENTRAL após receber os quatro relatórios.

## Regra de escrita

Cada equipe deve criar ou atualizar somente o arquivo correspondente ao seu número durante esta fase de auditoria. Não deve editar o relatório de outra equipe nem `CENTRAL-SYNTHESIS.md`.

## Conteúdo mínimo de cada relatório

O relatório deve começar com `ECOSYSTEM_RECOVERY_AUDIT = COMPLETE` ou `ECOSYSTEM_RECOVERY_AUDIT = BLOCKED` e incluir, no mínimo:

1. resumo executivo;
2. mapa de repositórios/worktrees;
3. mapa das frentes encontradas;
4. trabalho local não publicado;
5. trabalho preservado no GitHub;
6. trabalho já mergeado;
7. divergências/contradições;
8. riscos de perda ou sobreposição;
9. dependências entre frentes;
10. recomendação de divisão, sem executar a divisão;
11. próximas ações sugeridas, sem execução;
12. evidência terminal da auditoria.

## Boundary desta fase

- Produção: NÃO AUTORIZADA.
- Escrita real no NODE-01: NÃO AUTORIZADA.
- Merge final: reservado ao MESTRE CENTRAL.
- Correções/implementação: somente depois da auditoria cruzada dos quatro relatórios.
