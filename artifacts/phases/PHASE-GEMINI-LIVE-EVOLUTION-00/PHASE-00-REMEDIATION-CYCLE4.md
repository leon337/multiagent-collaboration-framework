# F0.7 - Ciclo 4: validação estrita de recibos

Missao MCF-GEMINI-LIVE-EVOLUTION-20261116-001, PR #528. A segunda auditoria independente externa do ciclo 3 no SHA 191480d6498b6012909b53289ebc476b370e8d7e encontrou uma lacuna de normalizacao de timestamp: a linha Consultado em aceitava texto arbitrario, e trim admitia espaços extras no recibo.
Esta e uma correcao do MVP comment-only, nao conclusao do gate F0.8.

## Correcao
- canonicalReceipt exige EXATAMENTE uma linha Consultado em com timestamp UTC ISO 8601 válido, em vez de substituir qualquer texto.
- Comparacao do corpo inteiro SEM trim ou normalizacao de outros caracteres. Uma linha de suposta aprovacao adicionada, espacos extras ou marcador copiado nao satisfaz recibo.
- Checagem do GitHub actor por par login + tipo (leon337/User, github-actions[bot]/Bot).
- Mantidas rechecagens da PR/Issue antes de escrever, receipt de POST incerto, limite de paginas e grupo de concorrencia para workflow.
- Nenhum codigo edita status de gate, checkbox, Issue body ou faz merge/deploy.

## Evidencia
39/39 node:test PASS = 30 cenarios do sincronizador (tres novos contra timestamp fraudulento, espaco extra e tipo de ator impossivel) + nove de privacidade da telemetria. Manifesto original F0 8/8 mantido e manifesto suplementar v4 com hashes da fonte, testes, workflow e relatorios.
Receipts de atores autorizados na API real nao podem ser facilmente falsificados por terceiro; o teste de tipo protege contra confiar em objeto de mock malformado, sem confundir isso com prova de ataque externo.

## Limites remanescentes
A ultima leitura HEAD->POST nao e transacao atomica. O job GitHub Actions esta serializado, mas CLIs externos ainda podem criar comentarios duplicados, sem criar gates falsos. F0.4 de seguranca, F0.5 aceite fisico, F0.6 completo e F0.8 continuam pendentes. Rotacao de chave foi adiada explicitamente por LEANDRO; sem autorizacao para producao/credenciais novas.

## Ajuste adicional apos gate externo LEO do SHA 9a91dc3
O executor Codex CLI em perfil LEO confirmou APROVAR_COM_RESSALVAS somente continuidade local F1 e preparacao documental F2, mas retornou F0/F1 integral e implementacao F2. Identificou Date.parse aceitando 30 de fevereiro e 24:00. O sincronizador agora compara componentes do calendario e hora UTC e rejeita datas impossiveis; exemplo de leap-day valido e reconhecido.
41/41 testes Node PASS (32 sincronizador + 9 telemetria), incluindo duas novas regressoes com datas invalidas e leap-day valido. O gate externo antecede ESTA correcao, nao considerá-lo uma auditoria do SHA novo. Riscos residuais e gates documentais continuam abertos.
