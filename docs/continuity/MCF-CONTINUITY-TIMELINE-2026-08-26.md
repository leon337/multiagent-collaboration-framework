# MCF — Timeline cronológica de continuidade, memória e execução real

**Snapshot:** 2026-08-26 (America/Sao_Paulo)  
**Autor deste artefato:** MESTRE  
**Autoridade humana final:** LEANDRO  
**Propósito:** retirar a continuidade operacional da dependência de um chat específico, de uma pasta de Project ou de memória implícita do modelo.  
**Estado:** `CURRENT SNAPSHOT / EVIDENCE-ANCHORED / NO IMPLEMENTATION AUTHORIZATION`

---

## 1. Fonte de verdade e regras de leitura

Este documento deve ser lido com a seguinte precedência:

1. instrução explícita atual de LEANDRO;
2. estado verificável atual no GitHub/runtime;
3. documentação vigente do MCF;
4. este snapshot cronológico;
5. histórico de chats como evidência auxiliar, nunca como única fonte de estado atual.

Regras:

- `historical != current`;
- `implemented != connected != authorized != active != verified-now`;
- sessão persistente não significa contexto infinito;
- identidade, modelo, runtime, memória, canais e evidência são camadas diferentes;
- nenhuma presença de agente é declarada sem execução distinguível e evidência.

---

## 2. Marcos cronológicos

### 2026-08-16 — release estável v1.1.0

- Publicada a release **MCF v1.1.0**.
- Release SHA verificado: `5d79f488407c77f7b9f21ecfefb41ddfb3a52aef`.
- A release formaliza continuidade/recovery verificáveis, observabilidade audit-safe e gates de readiness.
- Produção não é autorizada automaticamente pela release.

**Significado:** o MCF já possuía princípios de recuperação e evidência, mas ainda não o ciclo completo de memória cognitiva persistente cross-chat desejado.

### 2026-08-21 a 2026-08-22 — memória externa já existente

O inventário live recuperado posteriormente na missão de memória registrou que o Cognitive Ledger/Supabase já continha eventos e fontes persistentes nesse intervalo.

**Significado:** já existia uma base de memória externa privada. O que faltava era integrá-la a um ciclo governado do MCF em que um MESTRE pudesse persistir e outro MESTRE recuperar com provenance e read-back.

### 2026-08-24 03:09 (-03) — início formal da missão de memória cognitiva

Commit: `8cdff94ba97a6d817c4d8195c9894e537a032b39`  
Mensagem: `docs(roadmap): start next stable cognitive memory mission`

Missão: `MCF-MEMORY-LIVE-NEXT-STABLE-001`.

O objetivo verificável passou a incluir:

- Registry + Capsules + SHAs + provenance + recovery;
- escrita governada no Cognitive Ledger;
- Receipt auditável;
- recuperação posterior em outra conversa;
- distinção entre estado histórico, estado atual e inferência;
- proibição de dizer “eu me lembro” sem memória persistida/recuperada ou contexto presente.

**Significado:** este é o marco formal de persistência cognitiva do MESTRE como produto do MCF.

### 2026-08-24 03:12 (-03) — roadmap incorporado em main

Merge PR #163: `21c667057617b9cd2090afaab42dc9c7806eef02`.

**Significado:** o objetivo de memória cross-chat deixa de ser apenas conversa e passa a estar versionado no repositório.

### 2026-08-24 ~03:41 (-03) — recuperação e governança de contexto

Merge PR #166: `08fef949c49496050596e9681aaf011259e51f77`.

**Significado:** recovery por fontes persistentes começa a substituir dependência de memória efêmera do chat.

### 2026-08-24 04:20 (-03) — abertura da fase Class C de arquitetura da memória

Commit: `5d14788e2dfd4db444b7106d018168a7b61c2a60`.

**Significado:** memória passa de intenção para arquitetura governada.

### 2026-08-24 04:21 (-03) — decisões de produto congeladas

Commit: `680d9763af90083dac8d88d64b3da4ddcf03ffc2`.

Decisões relevantes:

- provider operacional: Cognitive Ledger existente;
- persistência: pedido explícito ou sugestão seguida de confirmação; nunca silenciosa;
- MESTRE inicia writes governadas; Miriam governa memória/provenance/reconciliação;
- sucesso de escrita exige persistência + read-back + Receipt;
- texto original e representação semântica devem preservar provenance;
- memória real privada não vai automaticamente para Git público;
- correções preservam histórico;
- nenhum agente recebe crédito sem execução real e artefato próprio.

### 2026-08-24 04:25 (-03) — fase de arquitetura entra em main

Merge PR #167: `5fd36516f22f847495906f710d27dfb8976980ad`.

### 2026-08-24 04:33 (-03) — gate de execução real dos 29 agentes

Merge PR #168: `85ccf418740e78b5e1e3eeb7742baf6f869978c1`.

Achado central:

- o runtime MCF é orquestrador/evidence ledger;
- ele não deve ser tratado como originador automático de 29 cognições independentes;
- o ChatGPT atual não expunha um dispatcher nativo capaz de provar 29 execuções separadas;
- um **execution provider/runtime real** é necessário para dar execução distinguível aos agentes;
- representar papéis pelo MESTRE é explicitamente insuficiente.

**Significado:** aqui nasce formalmente o problema que LEANDRO hoje descreve como “dar corpo aos agentes”.

### 2026-08-25 manhã — OX demonstrada como agente externa em runtime próprio

A OX já operava em uma sessão persistente do DeepSeek Harness (DSH), com preset `mcf`, histórico preservado e múltiplos turnos.

**Significado:** surge um primeiro exemplo concreto de “corpo” externo: runtime + workspace + ferramentas + sessão persistente + modelo/provider.

### 2026-08-25 10:32 (-03) — canal programático MESTRE ↔ OX documentado

Commit: `c94bf244db0a68cd38b80338c4a5dcdf8c69e8a3`  
Mensagem: `docs(integrations): specify MESTRE-Ox programmatic channel via DeepSeek Harness`.

### 2026-08-25 10:33 (-03) — evidência E2E do canal

Commit: `05c12349e38bce8c89da148eb222880de7b90352`.

### 2026-08-25 10:34–10:48 (-03) — plano, decisões, relatório, checkpoint e autorização humana

Commits relevantes:

- `c089880b443d5f32313e02214be73f9531b5b3d6` — plano;
- `0cf0f35cd6156432282ecc48fcc0519bc2520424` — decisões;
- `e590c9fb614a84a53a760a8ad82fb96cf91b4ae9` — relatório;
- `32f8e1413dba237b5ff1d5be723b58c2cc6fd86d` — checkpoint;
- `f774eb6e41fb6433463e0e7e6da59ddf924f378d` — `Ox PASS`;
- `f88efdfa6bb13b1f3dd6ca01fc4059b7d225626c` — autorização final de LEANDRO.

### 2026-08-25 10:55 (-03) — merge do canal MESTRE ↔ OX

Merge PR #171: `2b8ce24b71c9f9095c801dafdd762a2cef202fa9`.

Este commit continua sendo o **HEAD de `main` no snapshot de 2026-08-26**.

**Significado:** o canal externo deixa de ser conhecimento informal e entra na fonte de verdade do MCF.

### 2026-08-25 noite — incidente de resolução de identidade da OX

Em uma nova conversa, MESTRE inicialmente buscou OX como se fosse agente do catálogo oficial. Isso estava errado.

Falhas registradas:

1. procurar OX no domínio incorreto;
2. confundir “não encontrei no catálogo” com indisponibilidade;
3. em um momento, representar textualmente “OX” sem conexão real — comportamento posteriormente reconhecido como inválido.

Correção:

- LEANDRO informou que OX era externa;
- MESTRE recuperou os commits do canal DSH;
- localizou a sessão real persistente;
- retomou a mesma sessão em vez de criar uma nova;
- passou a exigir `accepted:true` + novo `assistant/message` para declarar resposta real.

**Lição canônica:** `representação != conexão`.

### 2026-08-25 → 2026-08-26 — copresença operacional LEANDRO ↔ MESTRE ↔ OX

Foi exercitado o triângulo:

`LEANDRO -> MESTRE -> OX -> MESTRE -> repositório -> OX verifica -> LEANDRO decide`.

Na missão de visão deferida, OX produziu artefatos próprios, MESTRE transportou/publicou, e OX realizou verificação remota por hash.

**Lição:** autoria do artefato e credencial de publicação são responsabilidades separáveis.

### 2026-08-26 00:57 (-03) — PR #172 criado em draft

PR #172: `docs: preserve deferred OX vision bridge proposal`.

Estado atual no snapshot:

- `open`;
- `draft: true`;
- `merged: false`;
- base: `main` em `2b8ce24...`;
- head: `docs/ox-vision-proposal` em `bbc93a4eada2ac14c1f6f2e8c5dbab005fd1d4a2`;
- corpo do PR proíbe implementação, model change, deploy, release, produção e merge sem nova autorização de LEANDRO.

### 2026-08-26 — limite de contexto da OX vira risco operacional explícito

A sessão principal da OX foi observada em aproximadamente 47–49% da janela de contexto.

MESTRE propôs checkpoint e handoff preventivos. OX respondeu com uma proposta mais precisa:

- checkpoint persistente por volta de **65%**;
- teto operacional por volta de **85%**;
- o checkpoint não deve existir apenas como narrativa do chat;
- deve conter eventos, hashes, pendências e estado necessário para reconstrução;
- nome proposto: `OX-CONTINUITY-CAPSULE`.

**Significado:** sessão persistente não basta; é necessário um mecanismo de continuidade entre sessões.

### 2026-08-26 ~03:07 (-03) — timeout/renderização no ChatGPT, OX continua viva

LEANDRO observou na superfície ChatGPT a mensagem de timeout/renderização. A auditoria posterior recuperou o histórico persistente da OX e mostrou que a sessão DSH tinha recebido o contexto e produzido resposta.

**Lição:** `falha da superfície do chat != perda do agente/runtime`.

### 2026-08-26 — distinção de evidência visual

Para screenshots enviados por LEANDRO:

- MESTRE vê pixels diretamente: `DIRECT_VISUAL_EVIDENCE`;
- OX, com o modelo atual sem image input, recebe descrição/hash/provenance do MESTRE: `INDIRECT_VISUAL_EVIDENCE`.

Essa distinção não pode ser apagada.

### 2026-08-26 — nova direção: corpos, memória e independência de provider

LEANDRO define uma intenção estratégica:

- não deixar MESTRE e OX se perderem entre chats/sessões;
- criar corpos para os 29 agentes oficiais;
- somar OX ao ecossistema operacional;
- experimentar uma nova DSH na máquina local de LEANDRO;
- reduzir dependência estrutural de providers externos;
- manter MESTRE no ChatGPT por enquanto por sua capacidade multimodal.

MESTRE recomenda separar:

- identidade;
- cérebro/modelo;
- corpo/runtime;
- memória;
- sentidos;
- canais;
- evidência.

E adotar como direção: **provider-agnostic, model-agnostic, machine-recoverable, memory-persistent**.

### 2026-08-26 — decisão de externalizar esta cronologia e o roadmap

LEANDRO autoriza explicitamente:

- persistir esta timeline no GitHub;
- persistir um roadmap/checklist antes de prosseguir;
- reativar OX;
- preparar mudança da OX para uma nova sessão por causa da janela de contexto;
- usar a OX para trabalhar nas pendências enquanto MESTRE consolida a documentação.

---

## 3. Estado atual verificável

### Repositório

- release estável: `v1.1.0`;
- `main`: `2b8ce24b71c9f9095c801dafdd762a2cef202fa9`;
- PR #172: aberto, draft, não mergeado;
- proposta de visão: `DEFERRED / NOT AUTHORIZED`.

### MESTRE

- superfície atual: ChatGPT multimodal;
- continuidade: Project/GitHub/contexto externo parcial;
- memória cognitiva cross-chat completa: **ainda não provada como ciclo estável publicado**.

### OX

- corpo atual: DSH em VPS;
- preset: `mcf`;
- sessão principal histórica: `session-3b58c1d4-5e1e-4438-884b-bc9c8ffaa10c`;
- continuidade intra-sessão: provada;
- mudança para nova sessão: autorizada por LEANDRO, condicionada à geração e verificação de cápsula de continuidade;
- memória semântica independente da sessão: ainda não considerada concluída.

### 29 agentes oficiais

- identidades/contratos/skills: existentes no MCF;
- execução cognitiva separada: não deve ser presumida;
- corpos independentes: não provisionados em escala;
- PR #168 registra que execution provider real é necessário para crédito de execução distinguível.

---

## 4. Pendências abertas neste checkpoint

- [ ] OX materializar `OX-CONTINUITY-CAPSULE-2026-08-26.md` na sessão antiga.
- [ ] MESTRE verificar path, hash, tamanho e conteúdo da cápsula.
- [ ] MESTRE criar nova sessão DSH da OX com preset `mcf` e contexto mínimo reconstruído pela cápsula.
- [ ] Nova OX demonstrar continuidade por read-back factual, sem depender da sessão antiga.
- [ ] Nova OX concluir o artefato repository-native pendente do incidente de timeout/renderização.
- [ ] Calcular SHA-256 desse novo artefato.
- [ ] MESTRE transportar/publicar o artefato no branch/PR apropriado.
- [ ] OX verificar remotamente o conteúdo publicado e registrar MATCH/divergência.
- [ ] Fechar a transação somente após evidência dos dois lados.
- [ ] Não alterar modelo/provider da OX, não implementar visão e não mergear PR #172 sem HUMAN_GATE específico de LEANDRO.

---

## 5. Invariante de continuidade

A partir deste ponto, uma troca de chat, sessão, provider ou máquina não deve ser tratada como continuidade apenas porque um texto “parece lembrar”.

Continuidade exige reconstrução verificável por, no mínimo:

`identidade + estado + decisões + pendências + provenance + hashes/receipts + fontes atuais`.

Se esses elementos não puderem ser recuperados, o sistema deve declarar perda/ambiguidade de continuidade em vez de preencher lacunas por inferência.
