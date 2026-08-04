# LEO-DEC-006 — Aprovação do Bootstrap de Chats

**Data:** 4 de agosto de 2026  
**Autoridade operacional delegada:** Léo  
**Base:** MCF-DEC-017 e MCF-DEC-053  
**Estado:** aprovado

## 1. Entradas

- MCF-DEC-053;
- pacote `project-instructions/`;
- RC-001 de Emily;
- zero achados críticos, altos ou médios;
- cinco ressalvas baixas não bloqueantes.

## 2. Decisão

```yaml
mcf_dec_053: APROVADA
project_bootstrap_package: APROVADO
short_project_instruction: APROVADA
canonical_instruction: APROVADA
startup_checklist: APROVADO
new_chat_test_suite: APROVADA
merge: AUTORIZADO_APOS_PR_E_CI_VERDE
installation_in_chatgpt: MANUAL_REQUIRED
new_chat_validation: REQUIRED_AFTER_INSTALLATION
new_gate_from_Leandro: NOT_REQUIRED_FOR_REPOSITORY_MERGE
```

## 3. Limite operacional

A integração no GitHub não significa instalação nas configurações do projeto ChatGPT.

Depois do merge, Leandro deve realizar uma única etapa inevitável:

1. colar o texto curto nas Instruções do projeto;
2. adicionar os arquivos canônicos à pasta do projeto;
3. abrir um chat novo para os testes.

O MCF não pode declarar essa etapa concluída sem evidência da interface ou teste real.

## 4. Próxima ação

```text
Gabriel cria PR
→ Renato valida CI
→ Gabriel integra
→ Mestre entrega pacote para instalação
→ Leandro instala no projeto ChatGPT
→ Beatriz executa testes em chat novo
→ Emily audita
→ Léo decide ativação definitiva
```