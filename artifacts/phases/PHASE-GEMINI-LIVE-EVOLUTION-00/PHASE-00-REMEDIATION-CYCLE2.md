# F0.8 — Ciclo 2 de correções após revisão independente externa

**Missão:** MCF-GEMINI-LIVE-EVOLUTION-20261116-001
**Parecer inicial:** Codex CLI externo, thread 01a1e5dd-f6cf-7cb0-b508-41fb47285e86, SHA 6a714e441aaff6c249403f5b08c3d7c551c78ed6. Resultado: RETORNAR_PARA_CORRECAO.
**Independência:** executor CLI separado em sandbox read-only; **não representa uma sessão nativa Emily do Bridge**.

## Achados e ação comprovada

1. **ALTO — Evidência primária ausente:** incluída fonte + scripts + JSONs sanitizados em `repro/` (16 arquivos versionados). Zero padrões de segredo identificados na seleção. Ainda se exige revisão independente do novo SHA.
2. **ALTO — Aceite físico versus sintético:** sem declaração falsa. Proposta de transferência dos testes de hardware físico para F1, sujeita a decisão formal de LÉO; F0.5 permanece pendente.
3. **ALTO — Rotação de chave:** não comprovada. Permanece controle pendente que exige ação no Google AI Studio; nenhuma chave pública no PR.
4. **MÉDIO — Sincronizador incompleto:** corrigidas classificação de `action_required/startup_failure/stale`, revalidação de HEAD antes de POST, PR fechado, paginação (100 resultados/página, limite seguro), marcador por digest de checks e reconciliação após POST incerto. 21/21 testes PASS. O consumo completo de eventos e gates ainda não está implementado; F0.7 segue pendente de reconciliação de escopo.
5. **MÉDIO — CI não validava PRF:** workflow agora monitora pasta PRF e executa `sha256sum -c`; valida sintaxe da fonte snapshot, testes de sincronizador e contrato da telemetria. CI de verificação reportou PASS na branch.
6. **MÉDIO — Telemetria sem código:** mirror do módulo + 9 testes unitários de contrato; 9/9 PASS. Persistência, orçamento e métricas de áudio físico continuam em fases futuras.
7. **MÉDIO — PRF sem HDF/receipts completos:** resumo ESEV e limites declarados. O PRF original permanece imutável (manifesto 8/8), este arquivo é adendo; parecer oficial e gate permanecem pendentes.
8. **BAIXO — inconsistência de F0.7:** clarificada distinção entre MVP opt-in atual e especificação ampla de eventos.

## Resultados sanitizados
- Testes locais `node --test ops/gemini-live/checklist-sync.test.mjs ops/gemini-live/f0-telemetry.test.mjs`: 30/30 PASS.
- `sha256sum -c PHASE-00-ARTIFACT-MANIFEST.sha256`: 8/8 PASS.
- `gh pr checks 528`: workflow `verify` PASS após último commit de testes; outros checks, incluindo Vercel, podem variar por commit.
- O GitHub/ambiente pode criar previews automáticos quando o PR é atualizado; **nenhuma promoção manual de produção foi solicitada**.

## Estado final do ciclo
`EM_CORRECAO` / `GATE_PENDENTE`. Solicitar nova revisão independente sobre SHA atualizado, depois decisão oficial LÉO. Não marcar F0.5/F0.7 apenas por validação sintética/CI. Não fazer merge/deploy.

## Handoff rastreável
MESTRE → auditor externo (novo SHA): verificar fonte + JSONs, checks no GitHub, segurança e cobertura do sincronizador; emitir relatório.
Auditor → MESTRE: devolver achados e evidências; solicitar gate oficial LÉO somente após independência e suficiência.
