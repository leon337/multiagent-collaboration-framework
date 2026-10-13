# PHASE-00 — Relatório inicial de baseline

**Estado:** parcial; não representa auditoria concluída.  
**Issue canônica:** [#441](https://github.com/leon337/multiagent-collaboration-framework/issues/441)  
**Data do registro:** 2026-10-13 UTC.

## Achados confirmados

1. **VERIFIED_FACT — MCF main:** o endpoint GitHub consultado retornou `main@460d6e6fc4c5ac8dc8b0962bcf76a62c059a1615`; a branch foi reportada como protegida.
2. **VERIFIED_FACT — PR #438:** aberto, não merged, base `main`, head `docs/manual-do-agente-gpt-integration`, head SHA `51fccc737048437f6516ba8cc0ed1a405eba29cc`. O escopo declarado é documentação da integração com o Manual; não alterar nem absorver silenciosamente esse trabalho.
3. **VERIFIED_FACT — Manual do Agente GPT:** repositório separado `leon337/manual-do-agente-gpt`; README descreve REST e MCP de leitura, sem ferramenta pública MCP de escrita.
4. **VERIFIED_FACT — Protocolo MCF:** `docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md` exige contrato de missão/fase, evidência cronológica, handoffs reais, PRF e pacote de rastreabilidade.
5. **VERIFIED_FACT — Template MCF:** `templates/MCF-UNIFIED-MISSION.yaml` lista os artefatos obrigatórios por fase: plano, relatório, validação, validação completa, smoke, checkpoint, decisões, manifesto de artefatos e README.
6. **UNKNOWN — DEP-002 integral:** a URL canônica foi identificada no PR #438, mas o acesso pelo leitor web usado nesta sessão retornou erro de acesso. O conteúdo integral ainda deve ser lido por um canal autorizado antes de qualquer publicação no Manual.
7. **VERIFIED_FACT — Missão criada:** Issue [#441](https://github.com/leon337/multiagent-collaboration-framework/issues/441) foi criada para controlar objetivo, fases, evidências, critérios de aceite e continuidade.

## Limites do baseline
- A leitura de README/árvore de arquivos não comprova saúde live da aplicação.
- Não foi realizada mutação no runtime, banco, permissões ou produção.
- O estado do PR #438 e o SHA de `main` são snapshots da consulta; devem ser relidos em futuras retomadas.
- Ainda não foi realizada autópsia completa de commits, código, testes, workflows ou arquitetura Dots.

## Próximas verificações
1. Recuperar DEP-002 integral por fonte autorizada.
2. Examinar o conteúdo completo do PR #438, incluindo arquivos alterados e checks.
3. Catalogar protocolos, decisões, checkpoints e auditorias históricas relevantes.
4. Iniciar inventário de fontes oficiais Dots com datas e limites de cada afirmação.