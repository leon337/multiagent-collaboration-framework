# Fase 0 — Registro de Causa Raiz e Correções

**Projeto:** Rede Social para Agentes de IA  
**PR:** #20  
**Período:** 2 de agosto de 2026, horário de Recife; execuções de CI em 3 de agosto de 2026 UTC  

## 1. Objetivo

Registrar cada falha encontrada durante a fundação executável, sua causa real, a alteração mínima aplicada e a evidência posterior. O documento demonstra a aplicação do protocolo contra código sobre código.

## 2. Incidentes

| Ordem | Execução | Gate | Causa raiz | Correção mínima | Resultado posterior |
|---|---:|---|---|---|---|
| 1 | `30773150338` | preparação | `setup-node` tentou ativar cache pnpm antes de existir lockfile e antes de o pnpm estar disponível | remover cache prematuro e habilitar pnpm antes da instalação | instalação alcançada nas execuções seguintes |
| 2 | `30773182893` | instalação | versão inexistente `@eslint/js@10.8.0` | fixar `eslint` e `@eslint/js` em versão publicada compatível | resolução avançou |
| 3 | `30773224007` | instalação | pnpm bloqueou o postinstall do `esbuild` | tentativa inicial de permissão específica | causa ainda não resolvida; nova evidência coletada |
| 4 | `30773267097` | instalação | configuração de build estava no local obsoleto para pnpm 11 | mover configurações para `pnpm-workspace.yaml`, usar `allowBuilds` e remover `.npmrc` ignorado | instalação passou |
| 5 | `30773357346` | formatação | quatro fontes e o lockfile não estavam normalizados | aplicar Prettier aos fontes; excluir lockfile gerado do formatter; preservar lockfile | formatação passou |
| 6 | `30773478984` | lint | `DatabaseService` era importado como valor embora usado somente como tipo | trocar para `import type` | lint passou |
| 7 | `30773551642` | typecheck | worker não declarava tipos do Node para `process.env` | adicionar `types: ["node"]` | worker passou |
| 8 | `30773620365` | typecheck | callback `genReqId` tinha parâmetro implícito `any` | declarar o parâmetro explicitamente | revelou incompatibilidade mais específica |
| 9 | `30773671535` | typecheck | contrato real de `genReqId` usa `IncomingMessage`, não `FastifyRequest` | tipar com `node:http IncomingMessage` | typecheck passou integralmente |
| 10 | `30773729281` | migração | `drizzle-kit migrate` exigia metadados internos ausentes no SQL inicial | criar migrador SQL explícito com ledger, checksum, transação, advisory lock e idempotência | migração passou duas vezes |
| 11 | `30773818894` | formatação | novo migrador ainda não estava normalizado pelo Prettier fixado | formatar somente o migrador com a toolchain oficial | formatação passou |

## 3. Execução verde

A execução `30773900336` concluiu com sucesso:

- instalação por lockfile congelado;
- verificação de supply chain do lockfile;
- formatação;
- lint;
- typecheck de todos os projetos;
- migração aplicada e reexecutada sem duplicidade;
- testes;
- build.

## 4. Controles preservados

- nenhuma correção foi aplicada sem falha reproduzida;
- cada mudança permaneceu limitada à causa identificada;
- nenhuma reescrita ampla foi realizada;
- nenhuma credencial pessoal foi usada;
- nenhum deploy ocorreu;
- o lockfile passou a ser obrigatório e imutável na CI;
- scripts de dependência permanecem negados por padrão, com permissão somente para `esbuild`;
- a permissão temporária de escrita da CI será removida antes do merge.

## 5. Conclusão

A sequência de falhas não foi encoberta. Ela foi usada para endurecer a fundação e produzir evidência verificável de instalação, compilação, migração, teste e build.
