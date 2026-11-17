# Remediação da auditoria externa F2.2/F2.3

A auditoria read-only de Codex CLI no SHA a1a51d5 devolveu RETURN_FOR_CORRECTION por cinco achados.

1. HIGH - Todos os fetchs ao Google agora usam redirect=error, tanto catálogo quanto gerar conteúdo, iniciar/finalizar upload, poll e DELETE. Nenhum redirecionamento automático pode enviar bytes ou cabeçalho de chave a outro domínio.
2. MEDIUM - Se finalize falhar ou expirar, o erro afirma que não é possível confirmar exclusão remota. Se vier nome válido mas URI inválida, o ID é retido internamente e DELETE é tentado antes de retornar erro; falha em gerar+DELETE não esconde a limpeza mal-sucedida.
3. MEDIUM - Catálogo não pré-seleciona modelo. O usuário precisa selecionar explicitamente um ID com generateContent retornado pela chave.
4. MEDIUM - Carregamento do catálogo é single-flight com token geracional e controles desabilitados durante o carregamento. Atualização tardia não reativa botões durante análise.
5. MEDIUM - Ao desconectar ou criar nova sessão Live, resultado anterior e possibilidade de compartilhar são revogados. Resposta tardia é descartada por geração; a análise já iniciada no Google pode continuar até a resposta, sem alegar cancelamento de custo.

## Testes adicionais
- 17/17 Node vision-adapter (redirecionamentos, URI inválida, delete falho, finalize incerto). 11/11 Node MediaPolicy, total F2 unitários 28/28.
- 14/14 Chrome para análise, incluindo seleção manual, single-flight, isolamento por sessão, descarte de resposta tardia. 11/11 Chrome para F2.1 visual. 92/92 Node acumulados F0/F1/F2.
- Nova verificação Google com imagem e vídeo sintéticos após a correção: EVIDENCE-F2-2-3-POST-REMEDIATION.json. Exige HTTP 200 para as duas modalidades, upload Files e DELETE remoto do vídeo confirmados, sha256 do adaptador registrado. Não usa conteúdo pessoal.

## Limites
A auditoria preservada acima é do SHA anterior. A mudança não equivale a gate normativo completo F2.6. Quotas monetárias, preços, modelos adicionais e vídeos >24 MiB continuam pendentes. F0/F1 gates formais anteriores permanecem abertos; nenhuma implantação em produção.
