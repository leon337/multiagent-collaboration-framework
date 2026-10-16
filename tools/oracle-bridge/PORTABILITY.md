# MCF-ORACLE-001 | Portabilidade sem segredos

O instalador `bootstrap-linux-mint.sh` instala a ponte Python e os schemas no diretório do usuário, sem migrar credenciais, sem serviços web e sem precisar de `OPENAI_API_KEY`. Não constitui ativação da hierarquia ORÁCULO.

**Linux Mint / SSD novo:**

```bash
git clone https://github.com/leon337/multiagent-collaboration-framework.git
cd multiagent-collaboration-framework
bash tools/oracle-bridge/bootstrap-linux-mint.sh --install
```

> Enquanto a versão está em PR draft #444, clonar a **branch candidata** e verificar seu SHA, não usar implicitamente a main.

- `--staging-only`: copia código e schemas, cria estado 0700, valida arquivos — para CI clean-room.
- `--check`: valida instalação e consulta status do Codex, não modifica arquivos.
- `--install`: instala Codex CLI oficial pelo npm de usuário se necessário. Se pedir login, somente o fluxo oficial `codex login` autenticará; NÃO importar cookies ou API keys.
- Sessões e recibos privados ficam no XDG state/host. Instalar em segundo SSD não recupera a mesma thread sem transporte seguro de sessão; deve iniciar nova `session_epoch` segundo governança.

**Comprovação de portabilidade:** CI em runner Linux efêmero, HOME vazio, validação da ponte + mock. O SSD Linux Mint secundário ainda precisa ser verificado de modo real. O bootstrap não tenta automatizar autenticação humana.
