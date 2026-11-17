# F0.8 — Parecer independente externo (Codex CLI)

**Escopo:** análise read-only de evidências; **não é sessão nativa Emily nem gate LÉO**.
**SHA auditado:** `6a714e441aaff6c249403f5b08c3d7c551c78ed6`
**Runtime de revisão:** `Codex CLI`, thread `01a1e5dd-f6cf-7cb0-b508-41fb47285e86`, finalização observada com código `0`.
**Decisão da revisão:** `RETORNAR_PARA_CORRECAO`, independente do gate formal.

---

**Origem:** sessão externa Codex CLI (não-Bridge), executando auditoria independente conforme o contrato de Emily. Não constitui Agent Session nativa nem autenticação da identidade Emily no Bridge.

**SHA auditado:** `6a714e441aaff6c249403f5b08c3d7c551c78ed6`, confirmado por `git rev-parse HEAD`.

**Escopo e verificações efetivas**

Li `docs/agentes/EMILY.md`, o protocolo operacional unificado e todos os arquivos das quatro áreas obrigatórias indicadas. Executei somente leituras e testes locais, sem rede, acesso à aplicação original ou alterações de arquivos.

Resultados independentes:

- **Manifesto SHA-256: 8/8 OK**, mediante `sha256sum -c`, no diretório do PRF. Isso confirma integridade dos documentos enumerados, não a veracidade dos testes narrados.
- **Sincronizador: nove testes passaram**, executando diretamente `node ops/gemini-live/checklist-sync.test.mjs`, Node `v24.22.2`. O comando com `--test` apresentou nesta sessão um único resultado agregado por arquivo; não o contabilizei como nove verificações individuais.
- Testes adicionais em memória, com transporte falso, confirmaram conclusões de checks não contabilizadas e publicação permitida para PR fechado. Nenhuma chamada de rede foi realizada.
- **15/15 E2E, 12 controles de segurança, seis consultas de modelos e três handshakes não foram reproduzidos.** Nesta branch estão os relatos, não os scripts, código e resultados originais necessários.
- Os arquivos auditados não apresentaram diferenças locais contra HEAD. Havia três arquivos não rastreados de revisão, excluídos da evidência técnica.

Não consultei GitHub: situação atual da PR, CI, comentários e checkboxes da Issue #527 permanece **não verificada**.

**Achados**

**ALTO — Evidência primária insuficiente para concluir a baseline e liberar F0.8.**  
`F0-BASELINE.md:17–21` declara commit da aplicação apenas local e originais não publicados. `PHASE-00-VALIDATION-FULL.txt:53–59` remete a JSONs e scripts externos à branch. O próprio `VALIDATION-FULL` é uma enumeração redigida de resultados, não saída bruta sanitizada reproduzível.

Assim, não é possível verificar independentemente as asserções dos 15 testes, sua correção após o falso positivo de privacidade, nem sua vinculação ao código efetivamente executado. O hash isolado do snapshot não resolve a ausência do conteúdo.

**Ação verificável:** disponibilizar código sanitizado, scripts e resultados originais em fonte versionada acessível ao auditor, com SHAs, comandos, versões e hashes; executar reteste independente. Essa ausência **impede recomendar encerramento de F0**, embora não impeça revisão documental.

**ALTO — F0.5 foi reduzida sem reconciliação suficiente dos critérios de aceite.**  
`ROADMAP.md:45` exige dispositivos reais, fala, interrupção, imagem e captura de erro. `PHASE-00-PLAN.md:13,25` adota mídia sintética; `F0-BASELINE.md:51` confirma ausência de validação física e remete essa parte a F1.

A limitação está honestamente declarada, mas não equivale ao cumprimento do requisito original. Não encontrei decisão formal reconciliando essa mudança de aceite.

**Ação verificável:** concluir os cenários exigidos ou registrar alteração formal do aceite, mantendo explicitamente pendentes os requisitos transferidos. Não considerar F0.5 integralmente validada apenas pelo relato 15/15.

**ALTO — Credencial anteriormente compartilhada sem evidência de revogação/rotação.**  
`F0-THREAT-MODEL.md:44,61` e `PHASE-00-DECISIONS.md:19` registram exposição anterior e recomendam rotação. Não há comprovação sanitizada da remediação.

**Ação verificável:** registrar revogação da credencial anterior e validação da substituta, sem divulgar valores. Bloquear promoção operacional dependente dessa credencial até resolver o risco. A exposição é aqui uma informação documental, não um incidente confirmado por esta auditoria.

**MEDIO — F0.7 cobre um sinal manual de CI, aquém dos eventos e casos adversariais especificados.**  
`CHECKLIST-LIVE.md:71–80` exige eventos, referências e testes negativos. O workflow, linhas `2–13,27–28`, possui validação em `pull_request` e publicação apenas por `workflow_dispatch`; não implementa consumo de `check_suite`, `workflow_run`, auditorias ou gates.

Os nove testes em `checklist-sync.test.mjs:22–59` verificam observação básica, rejeições, dry-run, opt-in e duplicata simples. Não demonstram rebase, mudança concorrente de HEAD, PR reaberto, receipt inválido, gate bloqueado ou recuperação após escrita com timeout.

**Ação verificável:** declarar F0.7 parcial ou reconciliar formalmente o escopo; acrescentar os cenários aplicáveis antes de alegar aceite adversarial completo.

**MEDIO — Observação de CI incompleta e potencialmente desatualizada.**  
Em `checklist-sync.mjs:10–14`, `action_required`, `startup_failure` e `stale` não entram em falha ou pendência. Reproduzi cada caso com um check concluído: todos produziram `0 falhas, 0 pendentes`.

Em `:28–38`, não há revalidação de HEAD antes de publicar, nem tratamento de estado fechado do PR; reproduzi publicação simulada para PR fechado. Check-runs e comentários limitam-se à primeira página de 100 registros. O marcador usa contagens, permitindo colisões entre conjuntos diferentes de checks.

**Ação verificável:** classificar conclusões explicitamente, paginar, registrar estado do PR, revalidar HEAD e testar concorrência, duplicação e resultado incerto de POST. O impacto atual é limitado: o script publica comentário e não altera checkboxes.

**MEDIO — Workflow não protege a integridade do PRF.**  
`.github/workflows/mcf-gemini-live-f0-checklist.yml:3–7` não inclui `artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-00/**`; `:26` executa somente testes do sincronizador. Uma mudança isolada no PRF não dispara esse workflow, e o manifesto não é conferido por ele.

**Ação verificável:** incluir o PRF nos caminhos e validar seus checksums em CI. A conferência local atual passou.

**MEDIO — F0.6 documenta um MVP sem comprovar implementação nem completar o contrato previsto.**  
`F0-TELEMETRY.md:7–13` referencia código externo à branch. O contrato do roadmap, `ROADMAP.md:46`, prevê correlação, modo, erros, reconexões, streaming, consentimento e custo; parte disso foi transferida a fases seguintes. Não há esquema executável disponível para verificar tipos, limites, rejeição de campos extras ou sanitização.

O tratamento de `n=1` como exploratório e a ausência de preço inventado estão corretos.

**Ação verificável:** publicar implementação sanitizada e testes de contrato; reconciliar o mínimo exigido em F0.6 antes de classificá-la como concluída.

**MEDIO — PRF íntegro em bytes, mas com rastreabilidade operacional parcial.**  
`PHASE-00-REPORT.md:8–18` apresenta narrativa retrospectiva, sem receipts e handoffs suficientes para comprovar o fluxo ESEV exigido nas seções 5, 6 e 13 do protocolo. `PHASE-00-CHECKPOINT.yaml:11,28–36` declara baseline atingida e resultados “verified” apoiados nas evidências externas indisponíveis.

**Ação verificável:** distinguir resultados relatados de resultados independentes; vincular execução, falhas, recuperação e passagens a registros verificáveis. Não preencher participações de agentes retrospectivamente.

**BAIXO — Inconsistência documental de F0.7.**  
`CHECKLIST-LIVE.md:12` diz “implementada em branch”, enquanto `:71` diz “ainda não implementado”.

**Ação verificável:** distinguir claramente implementação parcial, especificação futura e ativação pendente.

Não identifiquei achado **CRITICO** comprovado nesta cópia. Isso não representa certificação de segurança da aplicação ausente.

**Token e baseline: limites adicionais**

O diagnóstico registra chave em texto claro, backend sem autenticação própria e token sem restrição de modelo (`F0-THREAT-MODEL.md:17–38`). São riscos relevantes, especialmente para expansão remota/autônoma; loopback e Origin não eliminam acesso por processos locais. Sem o servidor e os testes originais, não confirmei TTL, uso único, constraints, proteção de logs ou permissões.

No sincronizador, confirmei boas restrições no código: dry-run padrão, dupla exigência para escrita, token necessário e POST somente de comentário. O workflow restringe `issues:write` ao job opt-in. Isso não prova escopo da credencial limitado exclusivamente à Issue #527.

**Matriz de suficiência**

| Item | Parecer | Fundamentação |
|---|---|---|
| F0.1 | SUFICIENTE | Contrato, roadmap e regras documentais disponíveis; existência/estado vivo da Issue não revalidado. |
| F0.2 | PARCIAL | Inventário e SHA relatados; snapshot e código original indisponíveis. |
| F0.3 | PARCIAL | Matriz distingue metadados de capacidades; respostas e handshakes não verificáveis nesta cópia. |
| F0.4 | PARCIAL | Ameaças e gaps explícitos; controles e remediações sem prova independente. |
| F0.5 | INSUFICIENTE | 15/15 não reproduzível na branch e requisitos físicos não cumpridos/reconciliados. |
| F0.6 | PARCIAL | Contrato MVP documentado; implementação ausente e cobertura reduzida. |
| F0.7 | PARCIAL | Nove testes reproduzidos; eventos, robustez e cobertura adversarial incompletos. |
| F0.8 | INSUFICIENTE | Manifesto válido; pendências de evidência, rastreabilidade e decisão operacional. |

Não posso afirmar que F0.5/F0.6/F0.7 foram marcados na Issue, pois não a consultei. Posso afirmar que **a evidência desta branch não sustenta classificá-los integralmente como VALIDADO**. F0.8 está corretamente registrada como pendente.

**Conclusão: RETORNAR_PARA_CORRECAO.**

O pacote permite análise documental e reprodução dos nove testes do sincronizador, mas não comprova a baseline completa exigida para encerrar F0. As correções prioritárias são disponibilizar evidência primária sanitizada, reconciliar o aceite físico/sintético, resolver a credencial relatada como exposta e corrigir as limitações do sincronizador e da validação do PRF.

Este é um parecer de suficiência técnica independente. **Não constitui gate do agente LÉO nem autorização de merge, deploy ou avanço de fase.**
