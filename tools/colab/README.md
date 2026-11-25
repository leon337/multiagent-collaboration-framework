# Google Colab CLI — execução remota controlada para o MCF

**Status:** EXPERIMENTAL, somente notebook, sem acoplamento ao MissionRuntime.

O Colab CLI do Google executa Python/notebooks em máquinas remotas. Isso serve para modelos, visão computacional, benchmarks e processamento numérico. O runtime TypeScript do MCF, Postgres, GitHub Actions, gates e CI permanecem em seus caminhos canônicos.

## Pré-requisitos

- Linux/macOS, Python e a CLI oficial `google-colab-cli` instalada em ambiente isolado (`pipx install google-colab-cli`).
- Autenticação Google feita pelo titular da conta. Execute `umask 077; colab sessions` em terminal de usuário: o OAuth pede consentimento e código. O código e as credenciais **não devem ser enviados ao chat nem armazenados no Git**.
- Sem OAuth validado, a CLI fica instalada, mas o primeiro job remoto permanece bloqueado.
- Verifique o saldo/limites da conta (`colab usage`) após autenticação, antes de escolher acelerador. Não pressupor disponibilidade ou gratuidade de GPU.

## Procedimento

O wrapper instalado no notebook é `~/.local/bin/mcf-colab-job` e executa somente arquivos presentes na lista fixa de tarefas públicas.

```bash
mcf-colab-job doctor
mcf-colab-job plan smoke
mcf-colab-job run smoke --approve-compute
```

O último comando só executa depois do OAuth e da autorização de uso de recursos. Se o saldo permitir e a tarefa exigir GPU:

```bash
mcf-colab-job plan torch-gpu-probe --gpu T4
mcf-colab-job run torch-gpu-probe --gpu T4 --approve-compute --approve-accelerator
```

Apenas **T4** é elegível no MVP; CPUs são o padrão. Os jobs `smoke` (CPU) e `torch-gpu-probe` (T4 com PyTorch) são sintéticos e não enviam arquivos nem dados privados do MCF. Os planos não iniciam runtimes.

## Isolamento e evidências

- Uma tarefa remota por vez, com lock local exclusivo.
- Sem opção `--keep`, sem shell expansível, sem envio arbitrário de arquivos, sem `--env` e sem Drive mount.
- Cada execução usa sessão temporária exclusiva e `colab run` com autodesligamento solicitado.
- Checkpoints/recibos locais sob `~/.local/state/mcf-colab` e configuração/token em `~/.config/colab-cli`, com permissão restritiva.
- `completed: true` significa que o processo CLI terminou com zero; **não comprova** sozinho a liberação da VM. Verificar o encerramento com `colab sessions` e registrar evidência separada.
- Em caso de exceção/crash externo ao CLI, confirmar manualmente quais sessões permanecem ativas antes de reexecutar. Não replicar jobs inadvertidamente.
- Nenhuma credencial será capturada ou copiada de outras aplicações.
- Se futuramente forem usados dados privados, exigir classificação, autorização e isolamento antes do envio.

## Testes

```bash
python3 -m unittest discover -s tools/colab -p 'test_*.py' -v
python3 -m py_compile tools/colab/*.py tools/colab/jobs/*.py
```

São testes locais do contrato de segurança e do comando, não testes em VM real. A prova remota só ocorre após OAuth e verificação de saldo.

## Próximos marcos

1. HUMAN_GATE de autenticação Google e `colab sessions` comprovado.
2. CPU smoke real e confirmação de `colab stop`/nenhuma sessão remanescente.
3. Benchmark de IA/visão com código sintético e limites de custo.
4. Adapter com receipts, tracking de missão e ledger canônico — apenas depois da prova real e auditoria.
