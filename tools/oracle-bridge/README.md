# MCF Oracle Bridge — candidato experimental não ativado

**Não é outro runtime.** CLI local usa `codex exec` e `codex exec resume` oficialmente suportados, autenticação do ChatGPT no Linux Mint e modelo fixo `gpt-6-astra`. Não usa `OPENAI_API_KEY` nem API comercial e não configura fallback. A autoridade estratégica da identidade ORÁCULO só poderá entrar no catálogo oficial após gate Classe C.

## Executar no host autenticado

```bash
python3 tools/oracle-bridge/oracle_bridge.py status --mission-id MCF-ORACLE-001

# Preparar um request JSON conforme schemas/mcf-oracle-request.v1.schema.json:
python3 tools/oracle-bridge/oracle_bridge.py consult \
  --request /caminho/solicitacao.json \
  --decision-schema schemas/mcf-oracle-decision.v1.schema.json \
  --timeout 180
```

O primeiro comando não faz chamada de modelo. O segundo cria/retoma a **thread por missão**, com `session_epoch=1`, lock exclusivo por missão, idempotência por digest, estado local privado no XDG State Home, validação de esquema básico, limites de timeout/saída e tratamento **UNKNOWN** para chamadas sem recibo conclusivo.

**Proibido:** copiar `~/.codex`, blobs de sessão, resultados privados ou OAuth para GitHub, runners, logs, Issue, PR ou outro SSD. Migração do host: reinstalar o Codex CLI e autenticar oficialmente; uma nova `session_epoch` requer reconciliação canônica pelo MCF. Não forçar reset local para contornar UNKNOWN.

## Limites técnicos (não declarar produção pronta)

- Prova local sintética necessária: `codex exec resume` com `-c sandbox_mode="read-only"`, formatos de JSON e resposta válida com `gpt-6-astra`. `--sandbox read-only` não impede leitura de arquivos fora do workspace em todo ambiente: executar como usuário dedicado/sem segredos extra quando possível.
- Código em PR draft e **não** registrado em `ProviderAdapterRegistry` de produção.
- O CLI wrapper não é servidor HTTP e não introduz segundo banco, scheduler, fila ou ledger. A integração de transporte com o serviço hospedado depende das permissões existentes e da revisão P3.
- A idempotência limita processamento local; não fornece execução exactly-once do modelo. `UNKNOWN` exige reconciliar antes de repetir.
- Testes em CI usam CLI **falsa** e não tocam os tokens ChatGPT.
- Usuário continua apenas APROVAR/REJEITAR gates realmente humanos; sem checkpoints técnicos.

## Testes

```bash
python3 -m unittest discover -s tools/oracle-bridge -p 'test_*.py' -v
```
