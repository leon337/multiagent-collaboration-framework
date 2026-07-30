# Etapa 04 — Gabriel

**Experimento:** MACF-EXP.1  
**Issue:** GitHub #11  
**Agente:** Gabriel  
**Entrada permitida:** `ETAPA_03_CARMEM.md`  
**Classificação:** ARTEFATO EXPERIMENTAL  
**Estado:** `COMPLETED`

## Protocolo normativo com versionamento e publicação

1. **Manter somente um objetivo estratégico ativo.** Objetivos adicionais permanecem em backlog até a liberação da capacidade estratégica.
2. **Registrar o controle estratégico no Linear.** Objetivo, prioridade, estado agregado e decisões de direção pertencem ao Linear.
3. **Executar o controle operacional no GitHub.** Cada objetivo deve usar issue vinculada, branch dedicada e pull request para tarefas, artefatos, revisão e evidências.
4. **Versionar todas as transferências.** Cada passagem deve gerar arquivo próprio e imutável, commit verificável com referência ao objetivo e vínculo rastreável com a etapa anterior.
5. **Registrar todas as transições.** Estado, responsável, evidência, riscos, ressalvas, commit e próximo passo devem constar no log operacional.
6. **Avançar automaticamente sem bloqueio.** Léo promove a próxima etapa definida e autorizada sem nova confirmação humana; Leandro é consultado somente em mudança estratégica, risco crítico, conflito normativo ou ação irreversível não delegada.
7. **Restringir os estados finais.** O objetivo termina somente como `PASS_RELEASED_FOR_WORK`, `BLOCKED`, `CANCELED` ou `SUPERSEDED`.
8. **Publicar apenas após validação.** A integração do pull request e o registro da versão exigem critérios atendidos, evidências localizáveis, revisão concluída, ausência de não conformidade crítica e reconciliação entre Linear e GitHub.

## Justificativa curta

O protocolo transforma regras de governança em um fluxo publicável: cada mudança fica isolada em branch, documentada por commit e revisada em pull request. Isso preserva continuidade, auditabilidade e controle de liberação.