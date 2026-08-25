# R02 — Pesquisa de Ferramentas para Transcrição Integral

## Contexto

O AccurateScribe processou `MCF__Execução_Real_de_IA.mp4` (532,18 s), porém a integração conectada expôs somente até `00:59,967` na conta sem acesso premium. Esta pesquisa busca destravar a auditoria integral sem depender desse limite.

## Alternativas verificadas

### 1. Whisper Transcribe AI — plugin do ChatGPT

- encontrado no diretório de plugins do ChatGPT;
- descrição pública informa transcrição de áudio/vídeo, legendas, timestamps, histórico e revisão de transcrições concluídas dentro do ChatGPT;
- estado neste checkpoint: não instalado; sugestão de instalação apresentada a LEANDRO;
- preço/limites do plano: NÃO VERIFICADO.

**Uso recomendado:** primeira tentativa, por reduzir atrito operacional e permitir recuperar a transcrição dentro da própria conversa, se o plano disponível cobrir os 8m52s.

### 2. `openai/whisper`

- repositório oficial do Whisper;
- licença MIT;
- reconhecimento multilíngue;
- instalação via `pip install -U openai-whisper`;
- requer `ffmpeg` no sistema;
- CLI e API Python processam arquivos completos em janelas de 30 s.

**Ponto forte:** fonte original e madura.
**Custo operacional:** Python + FFmpeg + download de modelo.

### 3. `SYSTRAN/faster-whisper`

- implementação Whisper sobre CTranslate2;
- licença MIT;
- documentação declara até 4x mais velocidade que `openai/whisper` em cenários comparados e menor uso de memória;
- Python 3.9+;
- não exige FFmpeg instalado no sistema, pois usa PyAV;
- suporta timestamps por segmento e por palavra;
- roda em CPU INT8 ou GPU.

**Uso recomendado para automação futura:** forte candidato para pipeline reprodutível da fábrica de conteúdo.

### 4. `ggml-org/whisper.cpp`

- implementação C/C++ do Whisper;
- licença MIT;
- suporta Windows, Linux, macOS, CPU e várias GPUs;
- release atual consultada possui binário pré-compilado `whisper-bin-x64.zip` para Windows;
- execução local/offline;
- CLI trabalha com WAV 16-bit, podendo converter o MP4/áudio via FFmpeg.

**Uso recomendado:** alternativa local, gratuita e independente de plugins/serviços.

### 5. `Purfview/whisper-standalone-win`

- executáveis standalone de Whisper/Faster-Whisper para Windows sem necessidade de configurar Python;
- voltado explicitamente a usuários que não querem lidar com instalação Python;
- inclui recursos ligados a transcrição, legendas e diarização;
- licença do repositório não apareceu declarada no metadata consultado; tratar como terceiro independente e revisar termos antes de incorporar artefatos ao MCF.

## Decisão operacional deste checkpoint

Ordem recomendada para destravar R02:

1. testar `Whisper Transcribe AI` dentro do ChatGPT;
2. se houver limite/pagamento impeditivo, usar `ggml-org/whisper.cpp` local no Windows;
3. para futura automação/repositório da fábrica de conteúdo, avaliar `faster-whisper` como motor principal.

## Critério de sucesso

A ferramenta escolhida precisa produzir a narração integral de ~8m52s, preferencialmente com timestamps, sem truncamento não declarado. A saída integral deve ser preservada como evidência antes de fechar R02.
