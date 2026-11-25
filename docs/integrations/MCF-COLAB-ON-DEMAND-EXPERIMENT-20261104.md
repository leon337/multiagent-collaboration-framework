# MCF-COLAB-20261104 — Executor Colab experimental

- **Classificação:** EXPERIMENTAL / IN_REVIEW (não é deploy, serviço em produção ou worker do runtime MCF)
- **Autoridade humana:** LEANDRO; **orquestrador:** MESTRE
- **Fonte de verdade:** GitHub `leon337/multiagent-collaboration-framework`, `main` reconciliada no início em `0c821d4b47e31a460853f9e7a7b429b17142b1e1`.
- **Isolamento:** branch `feat/colab-on-demand-experimental-20261104` em clone novo `/home/leo/Aplicativos/mcf-colab-experimental-20261104`. Nenhuma modificação ao diretório do MBC nem às contas.
- **Operação:** `python3 tools/colab_on_demand.py SCRIPT.py --session mcf-demo-001 --gpu-t4 --timeout 60 --receipt /tmp/mcf-demo-receipt.json`

## Necessidade, limites e decisão

Objetivo: avaliar a viabilidade de executar *um* experimento Python sob demanda no Google Colab e transmitir evidências para MCF sem substituir o runtime persistente. Os comandos utilizam o CLI local existente, sem Chrome/CDP, reautenticação ou extensão de privilégios. MBC é usado para inspecionar a sessão web da outra conta, nunca como substituto do CLI para executar scripts.

**Restrições:** a FAQ do Colab (https://research.google.com/colaboratory/intl/pt-BR/faq.html) estabelece recursos não garantidos, limites variáveis e restrições ao uso de workers distribuídos na modalidade gratuita sem unidades computacionais positivas. **Proibido** executar este protótipo como serviço contínuo, pool multicontas, worker de computação distribuída, bypass de quotas ou manter VMs ociosas. Agendamento, retry automático, lançamento por agente em loops, autenticação multiusuário e produção estão FORA do escopo. Para infraestrutura contínua, avaliar VPS com GPU, GCP dedicado ou Colab Enterprise com contrato adequado.

## Auditoria sem troca de autenticação

| Fonte | Identidade ou dado confirmado | Status |
|---|---|---|
| `colab whoami` | OAuth2: `eiasophia25@gmail.com` | VALIDADO |
| `colab usage` | 0,00 unidades; consumo 0,00/h e zero assignments no momento da consulta | VALIDADO |
| `colab sessions` | Nenhuma sessão remota antes dos testes | VALIDADO |
| Navegador Brave via MBC | `josielfransisco3@gmail.com` | VALIDADO |
| GPU da conta Brave | Entitlement, quota ou capacidade T4 **não verificados** | NÃO DETERMINADO |
| `colab run --gpu T4` (OAuth2 CLI) | GPU Tesla T4, CUDA disponível | VALIDADO |

Não assumir que identidade do Brave = identidade do CLI; não usar múltiplas contas para contornar limites. Nenhum token, cookie ou segredo deve ser salvo no repositório.

## Arquitetura e contrato experimental

`LEANDRO -> MESTRE/MCF (decisão manual) -> tools/colab_on_demand.py -> CLI colab -> VM efêmera`.

- Script Python local existente; nome de sessão restrito a letras minúsculas, números e hífens, com 3 a 49 caracteres.
- Acelerador selecionável: CPU (padrão) ou T4; timeout máximo de 120 segundos e espera local máxima de 240 segundos.
- Pré-verificação `colab sessions`: se o inventário falhar ou a sessão nomeada já existir, execução é recusada (não encerra sessão preexistente).
- Uma execução explícita, **sem retries automáticos**.
- `finally` invoca `colab stop --session NAME` mesmo após falha/timeout; nenhuma sessão é mantida de propósito.
- Recibo JSON `mcf-colab-on-demand/v1`, criado em modo `0600`, sem stdout/stderr, caminho imutável e dados de autenticação omitidos.
- Saídas de testes são devolvidas ao processo chamador, não persistidas pelo adaptador.
- `run_completed` e `cleanup_confirmed` separados. Falha de cleanup é bloqueio e exige `colab sessions`/limpeza manual, não reexecutar o job.
- Nenhum driver do MCF foi alterado: o adaptador é executável manualmente e é deliberadamente **não registrado** como skill operacional autônoma.

## Critérios verificáveis

1. Testes unitários de fluxo, GPU, recibo privado, falha remota, sem retry e parâmetros inválidos.
2. PyTorch executado efetivamente em T4 com pelo menos 3 matrizes em lote e valores finitos.
3. Falha de script produz código de saída diferente de zero e invoca cleanup sem reexecutar job.
4. `colab sessions` sem sessões ativas após os experimentos.
5. Revisão independente e CI da PR antes de cogitar merge; CI verde **não equivale** a autorização de promoção/deploy.

## Riscos

- **P0 Política de uso:** o limite atual de 0 CU exclui uso como worker distribuído. Controle: execução exclusivamente manual, isolada e curta.
- **P1 Disponibilidade:** GPU T4 não garantida, pode haver interrupção e limite dinâmico. Controle: falha explícita e prova por execução.
- **P1 Execução arbitrária:** scripts fornecidos pelo operador executam código remotamente com as permissões da sessão; não aceitar scripts de fontes não confiáveis.
- **P1 Vazamento:** stdout/stderr podem conter segredos impressos pelo próprio script. Controle: não registrar saídas em artefatos versionados; recibos locais restritos.
- **P1 Tempo de execução/interrupt:** `subprocess.run` tem timeout local; finalização remota requer validação `colab sessions`.
- **P2 Conta divergente:** navegador Brave e CLI têm contas diferentes. Controle: ambas explicitadas, nenhuma alteração de OAuth.

## Governança / próximo handoff

**MESTRE → revisores de arquitetura, QA e governança (pendente):** revisar limites de política, não persistência de execução, recibos, ausência de integração automática com runtime, implicações de custo e risco. Não declarar revisão independente sem parecer de revisor separado.

**Pendente para uma futura fase:** contrato de invocação do runtime, quotas por missão, provedor dedicado para jobs recorrentes, elegibilidade/termos de serviço, segregação de permissões e critérios de promoção do MCF.
