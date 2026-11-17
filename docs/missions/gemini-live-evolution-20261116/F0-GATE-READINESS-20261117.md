# MCF — F0.8, reconciliação de critérios e próximos HUMAN_GATEs

**Missão:** MCF-GEMINI-LIVE-EVOLUTION-20261116-001 · Issue #527.
**Executor:** ChatGPT/MESTRE. **Autoridade humana:** LEANDRO.
**Proposta:** PR #554, branch audit/gemini-live-f0-gate-requalification-20261117.
**Referência de runtime:** main 9196a9bbc27c34e23189f316d54109dce72e685a.
**Status do gate:** **F0.8 ABERTO**. Não há merge/deploy nesta entrega.

## Matriz de evidências sem extrapolação

| Critério | Evidência | Decisão |
|---|---|---|
| F0.1 | planejamento/contrato registrado e PR #528 já integrado | VALIDADO |
| F0.2 | inventário código/processo/porta/credencial read-only, checks de listener real 127.0.0.1, source/runtime on-disk e origem/paths HTTP negativos | VALIDADO TECNICAMENTE |
| F0.3 | seis respostas do metadata API, nomes e métodos do modelo confirmados; capacidades não ensaiadas marcadas NOT_VERIFIED | VALIDADO COMO MATRIZ |
| F0.4 | ameaça documentada: repouso da chave, token efêmero, CSP, CORS/Origin, consentimento e custo | THREAT MODEL DOCUMENTADO; MITIGAÇÕES INCOMPLETAS |
| F0.5 | 13/13 E2E real Google Live com mídia VIRTUAL, e relato explícito de LEANDRO de que microfone, saída de áudio, interrupção, câmera e tela passaram no browser | VALIDADO FUNCIONALMENTE, NÃO INSTRUMENTALMENTE |
| F0.6 | telemetria browser em memória, qualificador de latências p50/p95, reconexões, erros, tokens e 429; quota/custo monetário ficam NÃO VERIFICADOS | CONTRATO MÍNIMO VALIDADO; BENCHMARK F1 PENDENTE |
| F0.7 | sincronizador comment-only com PR atual e branch exata; execução GitHub real COMMENT_ONLY e segunda ALREADY_RECORDED; nenhuma edição de checkbox; 35/35 testes do sincronizador | VALIDADO COMO OBSERVADOR OPT-IN |
| F0.8 | PRF com hashes, QA e reconciliação; requer revisão independente e decisão de gate com identidade/autorização verificáveis | NÃO APROVADO |

**Evidência humana F0.5:** https://github.com/leon337/multiagent-collaboration-framework/issues/527#issuecomment-6956902992
**Registro de tarefas e gates:** https://github.com/leon337/multiagent-collaboration-framework/issues/527

## Riscos e impedimentos que NÃO foram resolvidos por F0.5

1. **Credencial historicamente compartilhada:** rotação foi adiada por orientação anterior de LEANDRO; revogação da antiga e validação da nova ainda não comprovadas. A presença de arquivo 0600/diretório 0700 **não elimina exposição prévia**. A troca exige acesso/autorização do proprietário da conta e não deve ocorrer via chat com a chave em texto.
2. **Token efêmero:** limites específicos `liveConnectConstraints` não comprovados em todos os modelos; endpoint local usa Origin/loopback e não possui autenticação HDF. **Nenhuma exposição pública**.
3. **Custos/quotas:** consulta metadata não fornece tarifa ou quota efetiva. Quaisquer cálculos monetários não verificados permanecem `NOT_VERIFIED` em F0.6.
4. **F1.5 ainda distinto de F0.5:** declaração de que áudio e interrupção funcionaram é funcional; não foram fornecidos intervalos cronometrados antes/depois ou percentis acústicos físicos. O benchmark permanece pendente para F1.6.
5. **Identidade dos agentes:** a simulação de papéis Emily/LÉO por MESTRE permite engenharia reversível, não equivale a auditoria independente ou ato de LÉO autenticado no MCF.
6. **F3 rede:** sandbox deny-all testado em PR #552 não foi conectado ao gateway; não prova prevenção produtiva de SSRF/DNS rebinding.
7. **CI != gate:** nenhum workflow ou comentário do Codex substitui os controles HDF/PermissionEngine e evidências PRF.

## Decisão técnica / próxima transição

- F0.1–F0.7 possuem evidências de aceitação **em seus escopos explícitos** e podem ser marcados na lista de subtarefas, conservando o registro de riscos.
- **F0.8 permanece [ ]** enquanto a credencial previamente divulgada não for reconciliada e a autoridade aplicável não tiver validado riscos e aprovado o gate mediante identidade verificável. Não marcar artificialmente por perfis simulados.
- Os testes funcionais de F1/F2 podem prosseguir localmente por autorização humana anterior, mas **F1.6/F2.6/F3.7/F4.6 continuam abertos**.
- Próxima intervenção humana necessária no fluxo F0: reconciliar/rotacionar a chave antiga em ambiente local seguro e registrar apenas o resultado de revogação, sem segredo. O MESTRE deve preservar serviços atuais e planejar troca reversível antes de qualquer migração.
