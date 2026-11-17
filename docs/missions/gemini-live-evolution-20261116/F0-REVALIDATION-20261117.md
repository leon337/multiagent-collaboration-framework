# F0 — Revalidação de baseline atual (17/11/2026)

**Missão:** MCF-GEMINI-LIVE-EVOLUTION-20261116-001 · Issue #527.
**Recorte:** F0.2/F0.3 revalidada, F0.5 confirmada por LEANDRO, F0.6/F0.7 qualificação incremental; não fecha gate F0.8.
**Base da coleta:** main @ 9196a9bbc27c34e23189f316d54109dce72e685a.
**Executor:** MESTRE no host Linux autorizado leo-N43SM; evidência não é revisão Emily independente.
**Reprodutibilidade:** arquivo de captura sanitizado em artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-00/F0-CURRENT-LIVE-REVALIDATION-20261117.json.

## Checklist de evidência e resultados

| Item | Evidência real | Conclusão |
|---|---|---|
| F0.2 snapshot | código main e arquivo local do serviço com SHA-256 idêntico, listener real 127.0.0.1 por inspeção ss/proc e comando Node/CWD associados (bytes já carregados em memória não provados); Node 24, pacote/deps; servidor respondeu HTTP 200 apenas em 127.0.0.1; Origin externo HTTP 403, path privado HTTP 404; chave arquivo real 0600, diretório 0700, sem leitura de material para logs; clone isolado do Git | VALIDADO tecnicamente no recorte |
| F0.3 matriz | seis modelos consultados em GET v1beta/models/{id}, seis HTTP 200. Métodos declarados por modelo no JSON, demais capacidades physical_audio/video/tools/quota/cost explicitamente NOT_VERIFIED | VALIDADO como matriz de descoberta, NÃO como qualificação de cada modalidade |
| F0.4 ameaças | Threat model F0 e 12 controles existentes documentados. Chave anteriormente exposta sem revogação comprovada e persistência em texto claro; HDF, token constraints e custos ainda abertos | DOCUMENTADO; RISCOS RESIDUAIS ABERTOS |
| F0.5 smoke | **13/13 Chrome + Google Live API real** com mídia virtual; **LEANDRO confirmou PASS dos testes físicos** de microfone, reprodução audível, interrupção, câmera e tela nesta sessão. Não há benchmark quantitativo real de latência/barge-in para F1.5 | VALIDADO FUNCIONALMENTE POR HUMANO E QA AUTOMÁTICO |
| F0.6 telemetria | contrato browser memory-only e qualificador sem PII; setup, first audio, first playback, reconexões, erros, tokens e 429; custo e quota declarados NOT_VERIFIED; p50/p95 exploratório abaixo de 30 amostras | IMPLEMENTAÇÃO BASE VALIDÁVEL; BENCHMARK REAL PENDENTE F1.5 |
| F0.7 sincronização | observador de PR/CI opt-in suporta PR #554 atual; execução GitHub real: COMMENT_ONLY e segunda tentativa ALREADY_RECORDED, zero checkboxes alterados; testes de alvo errado e segurança | FUNCIONAL; CONCORRÊNCIA EXTERNA NÃO ATÔMICA DOCUMENTADA |
| F0.8 gate | dependente de F0.4–F0.7, PRF e auditoria realmente independente no SHA final | ABERTO |

**Risco de segurança:** o backend não possui autenticação própria para qualquer processo local, mesmo com Origin/CSP. Sem gateway de identidade HDF/PermissionEngine e mitigação de egress, não divulgar ou expor a rede. A rotação de uma chave anteriormente exposta depende de credencial nova, que não deve ser publicada no PR. A coleta não salva chave/áudio/imagem.

## Reexecução E2E de mídia sintética e Google Live API

Em 17/11/2026, o MESTRE reexecutou `repro/f0/baseline-strong.cjs` contra
o Studio local original `127.0.0.1:18371`, em Chrome headless com dispositivos
virtuais, **13/13 PASS**, 0 falhas de runtime, três setups reais (2.5, 3.8
Live e 3.8 Extended), tool call `get_current_time` 1/1, 62 chunks
de áudio de resposta e três media tracks encerradas corretamente.
A execução usou prompt de teste sintético e não capturou áudio/filmagem real de
LEANDRO. Os bytes de evidência de execução estão em
`artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-00/F0-STRONG-E2E-RETEST-20261117.json`.
Os hashes `source_sha256` nesse arquivo vinculam a reprodução histórica
e **não** afirmam que o processo original foi implantado a partir de um git SHA.

**Confirmação humana F0.5 (17/11/2026):** LEANDRO informou diretamente
“fiz os teste e passou”, em resposta à solicitação explícita de testar o
microfone físico, a reprodução audível, a interrupção por fala, a câmera e a
tela com permissões do navegador. A confirmação foi registrada no
[comentário da Issue #527](https://github.com/leon337/multiagent-collaboration-framework/issues/527#issuecomment-6956902992)
e o item F0.5 foi marcado no checklist canônico por decisão humana.

**Limite de evidência:** trata-se de atestado do usuário, **não** de prova
acústica instrumentada. A F1.5 continua aberta para medição fim-de-fala →
saída audível, latência barge-in e comparação quantitativa antes/depois.

## F0.6 — Telemetria e limites dos dados

O qualificador `ops/gemini-live/f0-metrics-qualification.mjs` utiliza a
telemetria **em memória** do Studio sem exportar transcrições, áudio ou
identificadores. Recalcula amostras, p50/p95, reconexões, eventos de erro,
tokens e sinais de 429; **não inventa preço, quota ou custo de API**.
Se existem menos de 30 amostras, os percentis são `EXPLORATORY_ONLY`.
Mesmo quando há 30 amostras sintéticas, não se alega latência de áudio
percebida pelo ouvido ou qualidade física.

Execução: `node --test ops/gemini-live/f0-metrics-qualification.test.mjs`.
Os testes de limite 30 são sintéticos. Para F1.5, medir latência real com
amostras supervisionadas e consentimento, sem guardar voz pessoal.

## F0.7 — Sincronizador atual de CI/PR

O observador seguro `ops/gemini-live/checklist-sync.mjs` passou a permitir
o PR #554 **somente** quando a branch informada corresponde ao alvo
autorizado. A execução real de 17/11/2026 sob a conta GitHub vinculada
retornou `COMMENT_ONLY` para o primeiro envio de um sinal à Issue #527,
e `ALREADY_RECORDED` na segunda passagem. Nenhum checkbox foi alterado
(`changedCheckboxes=false`). A publicação continua voluntária por
`MCF_CHECKLIST_APPLY=1` e `--apply`.

**Limite residual:** publicação de comentário do GitHub não é operação
atômica entre múltiplos escritores externos; corridas podem duplicar sinais
se executores independentes não partilharem locks. A CI usa
`concurrency`, mas o CLI fora da CI não participa dessa garantia.
Esse sinal jamais pode ser interpretado como gate.

## Classificação das seis entradas (fonte API real)

- gemini-2.5-flash-native-audio-preview-12-2025: 200, countTokens / bidiGenerateContent
- gemini-3.8-live: 200, bidiGenerateContent
- gemini-3.8-live-extended-thinking: 200, bidiGenerateContent
- gemini-3.1-flash-live-preview: 200, bidiGenerateContent
- gemini-3.5-transcribe-live: 200, bidiGenerateContent
- gemini-3.5-live-translate-preview: 200, bidiGenerateContent

Os nomes e métodos foram observados em respostas GET. **HTTP 200 NÃO prova** eficácia de áudio, ferramentas, limites, preço ou disponibilidade futura.

## Comandos reproduzíveis

Clone em branch isolada, com chave **sempre fora do repositório**:

```bash
node --test ops/gemini-live/*.test.mjs
MCF_LIVE_STUDIO_DIR="/CAMINHO/PRIVADO/DO/STUDIO" node ops/gemini-live/f0-current-revalidation.mjs
(cd artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-00 && sha256sum -c PHASE-00-ARTIFACT-MANIFEST.sha256 PHASE-00-REMEDIATION-CYCLE3-MANIFEST.sha256)
```

Todos os resultados citados são de 17/11/2026 e podem envelhecer; nunca promover para gate F0.8 sem evidência do SHA final, tratamento dos riscos, revisão independente e decisão formal. A confirmação humana física da F0.5 está registrada na Issue.
