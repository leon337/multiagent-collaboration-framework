# MCF — Roadmap de corpos de agentes, memória persistente e continuidade recuperável

**Snapshot inicial:** 2026-08-26  
**Autor deste artefato:** MESTRE  
**Autoridade humana final:** LEANDRO  
**Estado:** `ROADMAP / CHECKLIST / IMPLEMENTATION NOT YET AUTHORIZED`  
**Direção:** provider-agnostic, model-agnostic, machine-recoverable, memory-persistent.

---

## 1. Objetivo

Transformar o ecossistema MCF de um conjunto de identidades/contratos coordenados por MESTRE em uma rede de agentes com execução real, continuidade verificável e memória recuperável, sem depender de:

- um chat específico;
- uma única máquina;
- um único provider de modelo;
- uma única janela de contexto;
- uma única credencial de publicação;
- memória implícita ou role-play.

O objetivo não é “eternizar sessões”. É tornar sessões, processos, providers e máquinas **substituíveis sem perder o estado operacional necessário**.

---

## 2. Modelo canônico de um agente com corpo

Cada agente deve ser tratado como composição de camadas independentes:

```text
AGENTE
│
├── IDENTIDADE     papel, versão, regras, skill bindings
├── CÉREBRO        modelo/provider ou modelo local
├── CORPO          runtime/DSH/host/workspace/processos
├── MEMÓRIA        Ledger + Capsules + histórico persistente
├── SENTIDOS       imagem, arquivos, web, sensores, computer-use
├── CANAIS         MCF/API/handoffs/queues
└── EVIDÊNCIA      receipts, hashes, provenance, logs auditáveis
```

Invariante: trocar uma camada não deve redefinir silenciosamente as demais.

---

# FASE 0 — Preservar o estado antes de avançar

**Objetivo:** eliminar dependência imediata do chat atual e estabilizar a continuidade MESTRE↔OX.

### Checklist

- [x] Externalizar timeline cronológica no GitHub.
- [x] Externalizar este roadmap/checklist no GitHub.
- [ ] Abrir PR em draft para revisão, sem merge automático.
- [ ] OX gerar cápsula de continuidade a partir da sessão antiga.
- [ ] Verificar SHA-256, tamanho, path e conteúdo da cápsula.
- [ ] Criar nova sessão DSH da OX somente depois da cápsula verificada.
- [ ] Alimentar a nova sessão com contexto mínimo e links/fontes atuais, não com dump cego de todo o chat.
- [ ] Executar teste de read-back: nova OX deve reconstruir fatos, pendências e limites sem consultar a sessão antiga.
- [ ] Produzir artifact/receipt que prove a transição de sessão.
- [ ] Concluir a pendência do incidente de timeout/renderização.
- [ ] OX verificar remotamente o artefato publicado por MESTRE.

### Gate de saída

`OX_SESSION_HANDOFF = PASS` somente se:

1. cápsula existe;
2. hash é verificável;
3. sessão nova tem identidade/preset corretos;
4. read-back factual passa;
5. pendências sobrevivem à troca;
6. nenhuma informação crítica foi inventada para preencher lacunas.

---

# FASE 1 — Generalizar a cápsula de continuidade

**Objetivo:** transformar a ideia `OX-CONTINUITY-CAPSULE` em contrato genérico do MCF.

Nome provisório:

`AGENT-CONTINUITY-CAPSULE`

### Conteúdo mínimo recomendado

- `agent_id`;
- `agent_role/version`;
- `source_session_id`;
- `created_at`;
- `mission_id`;
- `current_goal`;
- `current_state`;
- decisões vigentes;
- pendências ordenadas;
- artefatos e hashes;
- branch/PR/SHA relevantes;
- providers e runtimes observados;
- permissões/autorizações vigentes;
- incertezas explícitas;
- provenance;
- ponte para Cognitive Ledger quando aplicável;
- hash da própria cápsula.

### Checklist

- [ ] Definir schema versionado `continuity_capsule/v1`.
- [ ] Definir campos obrigatórios/opcionais.
- [ ] Definir política de atualização e supersession.
- [ ] Definir assinatura/fingerprint do agente produtor.
- [ ] Definir limite de tamanho e política de compactação.
- [ ] Definir validação automática antes de abrir sessão sucessora.
- [ ] Definir regra `stale capsule != current state`.
- [ ] Adicionar testes de corrupção, ausência e divergência.
- [ ] Documentar recuperação sem acesso ao chat anterior.

### Gate de saída

Uma segunda sessão de teste deve recuperar o estado de uma primeira sessão usando apenas:

- cápsula;
- fontes versionadas;
- providers autorizados;
- receipts/provenance.

---

# FASE 2 — Fechar o ciclo de memória cognitiva do MESTRE

**Objetivo:** completar a missão `MCF-MEMORY-LIVE-NEXT-STABLE-001` já existente.

Fluxo-alvo:

```text
LEANDRO pede persistência
        ↓
MESTRE chama capability governada
        ↓
Cognitive Ledger grava
        ↓
Receipt + read-back
        ↓
novo chat/MESTRE
        ↓
recupera com provenance
```

### Checklist

- [ ] Confirmar contrato atual de `cognitive-ledger.memory.write` ou nome final equivalente.
- [ ] Manter escrita explícita/confirmada; nunca silenciosa.
- [ ] Garantir idempotência.
- [ ] Persistir texto original autorizado + representação estruturada.
- [ ] Gerar Receipt auditável.
- [ ] Executar read-back após write.
- [ ] Testar recuperação em um novo chat do MESTRE.
- [ ] Distinguir memória histórica de estado live atual.
- [ ] Provar correção/supersession sem apagar histórico.
- [ ] Garantir que memória privada não seja exportada automaticamente ao Git público.
- [ ] Publicar nova release estável somente após os gates da missão.

### Gate de saída

`MESTRE_CROSS_CHAT_MEMORY = PASS` somente após prova reproduzível em dois chats distintos.

---

# FASE 3 — MCF Local Agent Node na máquina de LEANDRO

**Objetivo:** criar o primeiro corpo local de um agente oficial do MCF.

Nome provisório do experimento:

`MCF-LOCAL-AGENT-NODE-001`

Agente piloto recomendado: **LÉO**.  
Alternativa: **Miriam**.

Motivo da preferência por LÉO: o risco prioritário atual é continuidade operacional, WIP, gates e recovery.

### Antes de instalar

- [ ] Inventariar SO, CPU, RAM, GPU/VRAM, disco e rede da máquina.
- [ ] Definir se o primeiro teste usa provider remoto ou modelo local.
- [ ] Definir diretório/workspace isolado do agente.
- [ ] Definir portas e política de bind (`127.0.0.1` por padrão).
- [ ] Definir segredos e credential store; nunca hardcode.
- [ ] Definir backup da configuração.
- [ ] Definir rollback/desinstalação.
- [ ] HUMAN_GATE de LEANDRO antes de instalação/mudança de sistema.

### Corpo mínimo do piloto

- [ ] instalar DSH/runtime homologado;
- [ ] preset MCF do agente;
- [ ] workspace próprio;
- [ ] identidade estável;
- [ ] logging auditável;
- [ ] canal MESTRE↔agente;
- [ ] capsule store;
- [ ] acesso governado ao Cognitive Ledger quando autorizado;
- [ ] health/readiness local;
- [ ] receipts de criação/retomada.

### Teste de aceitação principal

```text
1. criar agente
2. conversar e executar missão curta
3. persistir estado relevante
4. gerar capsule
5. matar processo
6. reiniciar máquina/runtime
7. criar/retomar nova sessão
8. recuperar capsule + Ledger
9. reconstruir missão
10. verificar hashes/provenance
```

- [ ] `PROCESS_KILL_RECOVERY = PASS`
- [ ] `HOST_REBOOT_RECOVERY = PASS`
- [ ] `NEW_SESSION_RECOVERY = PASS`
- [ ] `MEMORY_READBACK = PASS`

---

# FASE 4 — Separar corpo local de cérebro/provider

**Objetivo:** evitar confundir “DSH local” com independência de provider.

### Estágio A — corpo local, cérebro remoto

```text
DSH local -> provider remoto
```

Serve para validar runtime, identidade, memória e canais.

### Estágio B — corpo local, cérebro local

Avaliar runtime de inferência conforme hardware real:

- Ollama;
- llama.cpp;
- vLLM;
- alternativa equivalente validada no momento do experimento.

### Checklist

- [ ] Descobrir hardware antes de escolher runtime/modelo.
- [ ] Criar benchmark de latência, memória e qualidade.
- [ ] Avaliar tool-use/function calling necessário ao MCF.
- [ ] Avaliar janela de contexto e estratégia de capsules.
- [ ] Avaliar licença e permissões do modelo.
- [ ] Avaliar isolamento de dados.
- [ ] Manter provider remoto como fallback durante piloto, se autorizado.
- [ ] Não promover modelo local por entusiasmo; exigir evals por competência.

### Teste de independência

- [ ] desabilitar acesso ao provider remoto;
- [ ] agente inicia;
- [ ] agente recupera memória;
- [ ] MESTRE consegue alcançá-lo;
- [ ] agente executa missão sintética;
- [ ] receipts são preservados.

Gate: `PROVIDER_OFFLINE_CONTINUITY = PASS`.

---

# FASE 5 — Escalar de 1 corpo para os 29 agentes

**Objetivo:** fornecer execução distinguível sem exigir 29 computadores físicos.

Princípio:

**corpo lógico != máquina física dedicada**.

Um host pode operar múltiplos agentes isolados, desde que identidade, recursos, workspace, memória e evidência permaneçam distinguíveis.

### Checklist de arquitetura de escala

- [ ] catálogo `agent_id -> runtime -> host -> workspace -> model -> memory scope`;
- [ ] isolamento de processos/containers quando necessário;
- [ ] quotas de CPU/RAM/GPU;
- [ ] scheduler/fila de execução;
- [ ] limites de concorrência;
- [ ] backpressure;
- [ ] health por agente e por host;
- [ ] restart policies;
- [ ] logs e traces correlacionados por mission/agent/session;
- [ ] canais autenticados;
- [ ] rotação de segredos;
- [ ] policy de ferramentas por agente;
- [ ] memória compartilhada vs privada explicitamente separada;
- [ ] handoffs com receipts;
- [ ] anti-role-play: execução só recebe crédito se identity/evidence chain existir;
- [ ] auditoria independente de Emily antes de declarar “29 agentes ativos”.

### Estratégia de rollout

- [ ] 1 agente piloto;
- [ ] 2 agentes simultâneos;
- [ ] 4 agentes por competências diferentes;
- [ ] 8 agentes com scheduler;
- [ ] roster completo em ondas;
- [ ] load test;
- [ ] chaos/recovery test;
- [ ] revisão de custo/energia/latência.

---

# FASE 6 — Memória multiagente

**Objetivo:** preservar continuidade individual sem transformar todos os agentes em uma memória indistinta.

### Escopos recomendados

- memória privada de LEANDRO;
- memória compartilhada da missão;
- memória específica do agente;
- artefatos versionados do repositório;
- estado live de providers;
- capsules efêmeras de handoff.

### Checklist

- [ ] namespace por agente;
- [ ] namespace por missão;
- [ ] ACL/capability por tipo de memória;
- [ ] provenance obrigatório;
- [ ] reconciliação de contradições;
- [ ] freshness;
- [ ] supersession;
- [ ] regra de minimização;
- [ ] hard-delete privilegiado para dados privados quando autorizado;
- [ ] nenhuma memória sensível em repositório público;
- [ ] avaliação de Miriam e Júlia.

---

# FASE 7 — Rede de comunicação resiliente

**Objetivo:** remover single points of failure entre MESTRE, OX e futuros agentes.

### Checklist

- [ ] endpoint registry;
- [ ] descoberta de host/runtime;
- [ ] heartbeat;
- [ ] retries idempotentes;
- [ ] deduplicação de prompts;
- [ ] message IDs estáveis;
- [ ] delivery receipts;
- [ ] response receipts;
- [ ] fila durável para indisponibilidade temporária;
- [ ] fallback de transporte documentado;
- [ ] distinção `accepted` vs `completed`;
- [ ] timeouts de superfície não apagarem execução host-side;
- [ ] testes de partition/network loss;
- [ ] observabilidade de Augusto.

---

# FASE 8 — Sentidos e autonomia local

**Objetivo:** adicionar capacidades sem confundir observação direta, proxy e ação.

### Visão

- [ ] preservar PR #172 como proposta deferida até nova autorização;
- [ ] diferenciar `DIRECT_VISUAL_EVIDENCE` e `INDIRECT_VISUAL_EVIDENCE`;
- [ ] testar sensor multimodal isolado antes de alterar cérebro principal da OX;
- [ ] VOP/Visual Receipt com hashes e provenance;
- [ ] redaction/secret detection antes de encaminhar imagens sensíveis.

### Ação/computer-use

- [ ] separar percepção de ação;
- [ ] exigir autorização por risco;
- [ ] registrar coordenadas/element IDs;
- [ ] confirmar mudanças irreversíveis;
- [ ] manter HUMAN_GATE para operações de alto impacto.

---

# FASE 9 — Corpo futuro do MESTRE

**Estado:** `DEFERRED`.

LEANDRO prefere manter MESTRE no ChatGPT por enquanto por causa da multimodalidade. Portanto nenhuma migração física do MESTRE deve ser iniciada agora.

Quando chegar o momento:

- [ ] definir quais propriedades do MESTRE precisam sobreviver à mudança;
- [ ] separar identidade do modelo GPT atual;
- [ ] criar capsule completa;
- [ ] comparar capacidades multimodais;
- [ ] testar tool access;
- [ ] testar memória cross-runtime;
- [ ] manter este ChatGPT como fallback durante migração;
- [ ] não declarar “mesmo MESTRE” sem critérios formais de continuidade.

---

# FASE 10 — Evals obrigatórios antes de escala final

Cada agente/corpo deve passar por:

- [ ] identity recovery;
- [ ] session turnover;
- [ ] process restart;
- [ ] host reboot;
- [ ] provider outage;
- [ ] network partition;
- [ ] memory read-back;
- [ ] stale capsule detection;
- [ ] conflicting source detection;
- [ ] duplicate message handling;
- [ ] tool permission denial;
- [ ] corrupted artifact/hash mismatch;
- [ ] secret leakage test;
- [ ] agent-to-agent handoff;
- [ ] evidence provenance audit.

Nenhum agente é classificado como “persistente” somente porque uma UI manteve uma conversa aberta.

---

## 3. Ordem recomendada de execução

```text
P0  preservar cronologia + roadmap
 ↓
P1  OX capsule + nova sessão + prova de continuidade
 ↓
P2  fechar memória cross-chat do MESTRE
 ↓
P3  MCF Local Agent Node com LÉO
 ↓
P4  kill/restart/reboot/session recovery
 ↓
P5  cérebro local + provider-offline proof
 ↓
P6  2–4 agentes em um host
 ↓
P7  memória multiagente + comunicação durável
 ↓
P8  escalar roster em ondas
 ↓
P9  sentidos/autonomia adicionais
 ↓
P10 corpo futuro do MESTRE quando LEANDRO decidir
```

---

## 4. HUMAN_GATES necessários

Requerem autorização explícita de LEANDRO antes da ação correspondente:

- instalação de DSH/runtime na máquina local;
- exposição de serviço à rede além de loopback;
- inclusão/rotação de credenciais;
- escolha de modelo pago ou provider com custo;
- mudança do modelo principal da OX;
- processamento de dados privados por novo provider;
- migração/destruição de memória;
- merge do PR #172;
- deploy/release/produção;
- corpo/migração futura do MESTRE;
- qualquer ação irreversível de sistema.

Perguntas técnicas internas não devem ser empurradas para LEANDRO; especialistas resolvem e escalam somente decisões de autoridade ou dependências externas reais.

---

## 5. Critério terminal do programa de “corpos”

O programa só deve ser considerado bem-sucedido quando pudermos desligar deliberadamente uma sessão/processo/host e demonstrar que o agente sucessor:

1. sabe quem é;
2. sabe qual missão estava executando;
3. recupera as decisões e pendências corretas;
4. distingue histórico de estado atual;
5. recupera memória autorizada;
6. apresenta provenance/receipts;
7. não inventa dados ausentes;
8. continua a execução por um canal real;
9. mantém autoria própria de seus artefatos;
10. pode trocar de provider conforme policy sem perder a continuidade operacional definida.

Esse é o significado operacional de **persistência** adotado neste roadmap.
