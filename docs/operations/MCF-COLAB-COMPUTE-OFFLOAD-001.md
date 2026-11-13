# MCF-COLAB-COMPUTE-OFFLOAD-001

**Estado:** EXPERIMENTAL — preparação local aprovada; OAuth Google e E2E remoto pendentes.

## Objetivo

Acelerar tarefas computacionais de IA, processamento de imagens, treinamento e benchmarks pesados sem executar cargas longas no notebook. O Google Colab CLI, lançado em 2026, permite offload por `colab run`, `colab exec`, `colab download` e `colab log`.

**Não substitui** o MESTRE, o runtime MCF, o GitHub, seus checks de CI, o ledger ou as regras de HUMAN_GATE. A versão inicial é um *tooling* autônomo separado do runtime.

## Fluxo da primeira fase

```text
MESTRE → classificar tarefa/escopo/dados
      → verificação de OAuth + saldo + escopo público
      → aprovação explícita da alocação de compute
      → mcf-colab-job (allowlist e lock)
      → CLI oficial do Google: colab run (sem --keep)
      → runtime CPU remoto, ou T4 com aprovação independente
      → stdout / stderr / recibo local
      → reconciliação: colab sessions (provar liberação de VM)
      → MESTRE analisa evidência e decide próximos passos
```

## Barreiras

- Somente scripts sintéticos previamente definidos. Nunca enviar credenciais, dumps de banco, arquivos pessoais, cookies ou código privado não classificado.
- Nenhum provisioning implícito; `--approve-compute` é obrigatório por tarefa. GPU requer também `--approve-accelerator`. Esses parâmetros são escopo de execução, **não** substituem gates canônicos do MCF.
- Uma VM por vez via lock, sem `--keep`, sem variável externa `--env`, sem login automatizado e sem fallback silencioso.
- Token OAuth sob conta pessoal: consentimento exclusivamente do titular (LEANDRO). Nunca incluir código OAuth em chat/PR.
- Recursos Colab podem consumir créditos e ter quotas/encerramento automático. Falha ou indisponibilidade não autoriza alterar limites por inferência.
- Fases com efeitos externos, deploy ou GPU cara exigem autorização adicional.

## Evidência até 08/11/2026

- CLI Google `colab` versão `0.7.5` instalada no Linux (via `pipx`).
- Diagnóstico: `HUMAN_OAUTH_REQUIRED`. A sessão real **não foi provisionada**.
- Teste offline do wrapper `mcf_colab.py` com mocks, recusa por falta de aprovação, isolamento de jobs e permissões de token.
- CLI informa opções de sessão CPU/GPU, log, upload/download, mas isso ainda não prova que a conta terá capacidade de usar cada opção.

## Evoluções

- E2E remoto com cobrança/saldo monitorados e stop comprovado.
- Adicionar jobs reprodutíveis para QA de visão computacional, TensorFlow/PyTorch e cargas de engenharia/3D.
- Comparar custo/tempo de execução real com Linux local/CI.
- Só após teste, considerar skill e adapter no runtime com EvidenceValidator, auditoria, ledger, retry e controle de quota.

**Repositório fonte:** leon337/multiagent-collaboration-framework.
**CLI oficial:** https://github.com/googlecolab/google-colab-cli
