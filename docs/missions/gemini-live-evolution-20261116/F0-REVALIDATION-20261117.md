# F0 — Revalidação de baseline atual (17/11/2026)

**Missão:** MCF-GEMINI-LIVE-EVOLUTION-20261116-001 · Issue #527.
**Recorte:** F0.2/F0.3 verificação técnica read-only; não fecha gate F0.8.
**Base da coleta:** main @ 9196a9bbc27c34e23189f316d54109dce72e685a.
**Executor:** MESTRE no host Linux autorizado leo-N43SM; evidência não é revisão Emily independente.
**Reprodutibilidade:** arquivo de captura sanitizado em artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-00/F0-CURRENT-LIVE-REVALIDATION-20261117.json.

## Checklist de evidência e resultados

| Item | Evidência real | Conclusão |
|---|---|---|
| F0.2 snapshot | código main e código servido com SHA-256 idêntico; Node 24, pacote/deps; servidor respondeu HTTP 200 apenas em 127.0.0.1; Origin externo HTTP 403, path privado HTTP 404; chave arquivo real 0600, diretório 0700, sem leitura de material para logs; clone isolado do Git | VALIDADO tecnicamente no recorte |
| F0.3 matriz | seis modelos consultados em GET v1beta/models/{id}, seis HTTP 200. Métodos declarados por modelo no JSON, demais capacidades physical_audio/video/tools/quota/cost explicitamente NOT_VERIFIED | VALIDADO como matriz de descoberta, NÃO como qualificação de cada modalidade |
| F0.4 ameaças | F0-THREAT-MODEL.md contém riscos. Chave anteriormente exposta sem revogação comprovada e persistência em texto claro; HDF, token constraints e custos seguem abertos | PARCIAL |
| F0.5 smoke | histórico sintético, novo teste unitário de metadados e 41/41 tests F0; áudio físico e câmera/tela reais não validados nessa revisão | PARCIAL |
| F0.6 telemetria | contrato em docs, p50/p95 em amostragem exploratória, eventos sem PII; quotas/tokens/custo e >=30 medições reais faltam | PARCIAL |
| F0.7 sincronização | observador opt-in de comentários com proteção de timestamp e integridade; reexecutados testes locais F0. Aplicação em GitHub permanece opt-in e não marca gates | PARCIAL |
| F0.8 gate | dependente de F0.4–F0.7, PRF e auditoria realmente independente no SHA final | ABERTO |

**Risco de segurança:** o backend não possui autenticação própria para qualquer processo local, mesmo com Origin/CSP. Sem gateway de identidade HDF/PermissionEngine e mitigação de egress, não divulgar ou expor a rede. A rotação de uma chave anteriormente exposta depende de credencial nova, que não deve ser publicada no PR. A coleta não salva chave/áudio/imagem.

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

Todos os resultados citados são de 17/11/2026 e podem envelhecer; nunca promover para gate F0.8 sem evidência nova do SHA final, ensaios físicos, revisão e decisão formal.
