# R02 — Fallback Local para Transcrição Integral

## Evidência do bloqueio

Dois serviços web foram testados na missão:

1. AccurateScribe — processamento concluído, mas a integração gratuita expôs apenas aproximadamente 1 minuto;
2. WhisperTranscribe.ai — a interface compartilhada exibiu a mensagem `Upgrade your plan to unlock the complete transcription record`, bloqueando o restante da transcrição.

Conclusão: serviços web freemium deixam de ser a rota principal da R02.

## Alternativas locais verificadas

### Subtitle Edit — recomendação operacional imediata

- repositório: `SubtitleEdit/subtitleedit`;
- licença: MIT;
- aplicação offline/open-source;
- possui fluxo nativo `Video → Speech to text...`;
- suporta motores locais Whisper CPP, Purfview Faster Whisper XXL e Whisper CTranslate2;
- motores e modelos podem ser baixados automaticamente no primeiro uso;
- aceita abrir o vídeo e gerar transcrição/legendas com timestamps;
- permite uso de modelos `small`, `medium`, `large` etc.;
- para NVIDIA, documentação recomenda Whisper CPP cuBLAS ou Purfview Faster Whisper XXL.

**Decisão:** usar Subtitle Edit como caminho preferencial no Windows por reduzir configuração manual e manter processamento local.

### Purfview/whisper-standalone-win — fallback de linha de comando

- fornece executáveis standalone de Whisper/Faster-Whisper para quem não quer configurar Python;
- exemplo oficial aceita arquivo de vídeo diretamente;
- adequado como fallback quando a GUI do Subtitle Edit não estiver disponível.

### whisper.cpp / faster-whisper — motores para automação futura

- `ggml-org/whisper.cpp`: MIT, Windows/Linux/macOS, CPU/GPU;
- `SYSTRAN/faster-whisper`: MIT, timestamps por segmento/palavra, CPU/GPU, forte candidato para pipeline automatizado da futura fábrica de conteúdo.

## Tentativa no ambiente desta conversa

O MP4 original foi confirmado disponível em `/mnt/data/MCF__Execução_Real_de_IA.mp4`.

A instalação de `faster-whisper` via `pip` foi tentada no runtime desta conversa, mas falhou por indisponibilidade de rede/DNS do ambiente. Essa falha não invalida a ferramenta; apenas impede instalar o pacote/modelo neste runtime específico.

## Próxima ação operacional

No Windows de LEANDRO:

1. instalar/abrir Subtitle Edit;
2. abrir `MCF__Execução_Real_de_IA.mp4`;
3. acessar `Video → Speech to text...`;
4. selecionar `Whisper CPP` ou `Purfview Faster Whisper XXL`;
5. usar modelo `medium` preferencialmente para maior precisão em português; `small` é aceitável se desempenho for limitante;
6. definir idioma `Portuguese`;
7. transcrever;
8. exportar como `.srt` ou `.txt` com timestamps;
9. fornecer o arquivo resultante à missão para auditoria integral da narração.

## Critério de sucesso

Transcrição completa dos ~8m52s, sem truncamento, com timestamps verificáveis e exportável para preservação na branch da missão.
