# NVIDIA NIM Embeddings → MCF RAG (MVP experimental)

Adaptador **local, opt-in**, sem integração automática no runtime de produção. Executa embeddings NVIDIA via API, armazena vetores em SQLite e realiza busca por similaridade cosseno. Usa somente bibliotecas Python padrão.

## Uso

```bash
cd tools/nvidia-rag
python3 -m unittest -v test_rag.py
python3 rag.py probe
python3 rag.py index ../../docs/MCF-CURRENT-STATE.md --db /tmp/mcf-nim-rag.sqlite
python3 rag.py search 'Como funcionam os gates do MCF?' --db /tmp/mcf-nim-rag.sqlite
```

Por padrão, a chave é lida em `~/.config/codebuddy/nvidia-nim.env` **somente se chmod 600**. É possível passar `--key-file` com outro arquivo local seguro. Nunca copiar chaves para o repositório, logs ou browser. Entradas são transmitidas à NVIDIA: **não indexar documentos sigilosos**. O banco SQLite contém cópia de trechos dos arquivos: armazenar fora do Git e com permissões restritas.

## Restrições e próximos gates

- Apenas arquivos texto explicitamente selecionados (extensões permitidas; limite de 300 KB), sem crawling recursivo.
- Índice local por modelo/dimensão; nenhum serviço público ou porta exposta.
- `probe` verifica embedding real; `index` e `search` são operações reversíveis sobre banco local.
- Não executa ferramentas de agente, nem escreve no MCF runtime, 9router ou DSH.
- Integração no dispatcher do MCF exige revisão independente, contrato de autorização, isolamento por missão, política de retenção, observabilidade e gates antes de deploy.
- Roteamento DSH → 9router → NVIDIA deve ser provado separadamente; provider configurado não equivale a tráfego E2E.
