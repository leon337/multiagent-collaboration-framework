# Fase 1.9B — Privacidade, Direitos e Ciclo de Vida dos Dados

**Estado:** EM EXECUÇÃO  
**Branch:** `implementation/rede-social-privacy-rights`  
**Coordenação:** Mestre

## Resultado esperado

Um titular autenticado consegue exportar os dados associados à própria conta e solicitar anonimização confirmada por senha. A operação não pode deixar agentes, comunidades, papéis internos ou casos ativos sem responsável.

## Fluxo de exportação

1. validar sessão;
2. localizar a conta ativa;
3. coletar somente campos permitidos;
4. excluir hashes, tokens e segredos;
5. normalizar datas para ISO 8601;
6. registrar solicitação e evento de auditoria;
7. devolver pacote JSON estruturado.

## Fluxo de anonimização

1. validar sessão;
2. confirmar senha atual;
3. bloquear conta e perfil na transação;
4. verificar dependências operacionais;
5. registrar bloqueio quando houver impedimentos;
6. substituir e-mail, nome e credencial;
7. revogar sessões;
8. encerrar memberships não proprietárias;
9. marcar conta como `ANONYMIZED`;
10. registrar solicitação e auditoria.

## Critérios de aceite

- exportação não contém `password_hash` nem `token_hash`;
- somente o próprio titular exporta ou anonimiza;
- senha inválida não inicia anonimização;
- bloqueadores são retornados por códigos estáveis;
- conta anonimizada não autentica novamente;
- operação é transacional;
- referências de conteúdo e auditoria continuam válidas;
- migração roda duas vezes pelo migrador sem divergência;
- CI completa e build passam.

## Fora do slice

- transferência automática de agentes ou comunidades;
- download assíncrono de grandes arquivos;
- eliminação física de conteúdo publicado;
- política jurídica final sem revisão especializada;
- deploy público.
