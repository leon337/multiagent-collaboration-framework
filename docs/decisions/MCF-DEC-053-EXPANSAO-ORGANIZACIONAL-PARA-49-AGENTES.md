# MCF-DEC-053 — Expansão Organizacional para 49 Agentes

**Status:** APROVADA / CANÔNICA  
**Data:** 2026-08-23  
**Autoridade humana:** Leandro  
**Autoridade operacional:** Léo  
**Coordenação:** Mestre

## 1. Decisão

Leandro aprovou a expansão do roster oficial do MCF de 29 para **49 agentes nomeados**, preservando seleção dinâmica por competência e proibindo participação decorativa.

A expansão adiciona duas capacidades organizacionais permanentes:

1. **Design & Experience Engineering**, liderada por Evelyn;
2. **AI & Model Systems**, liderada tecnicamente por Tiago.

MCF-DEC-050 permanece como registro histórico da matriz de 29 agentes. A matriz vigente passa a ser `docs/matrices/MCF-MATRIZ-CONSOLIDADA-DE-COMPETENCIAS-49-AGENTES.md`.

## 2. Problema corrigido

A matriz anterior concentrava competências demais em poucos especialistas. Em particular:

- Tiago acumulava modelos, agentes, prompts, RAG, avaliação técnica e fallback;
- Design possuía gestão, UX, UI e acessibilidade, mas não contratos dedicados para research, brand, direção de arte, design systems, motion, content design, design engineering e visual QA;
- não havia contratos dedicados para radar de modelos, APIs gratuitas, routers, protocolos, self-hosting, harnesses, benchmarks e economia de quota/cache;
- o radar de IA não possuía responsabilidade explícita por ecossistemas asiáticos, open weights e lançamentos de alta recência.

## 3. Novos agentes

### Design & Experience Engineering

30. Gabriela — UX Research e ResearchOps
31. Renata — Brand Strategy e Identidade Visual
32. Artur — Direção de Arte e Linguagem Visual
33. Davi — Design Systems, Tokens e Componentização
34. Melissa — Interaction e Motion Design
35. Natália — Content Design e UX Writing
36. Felipe — Design Engineering e Prototipação com Código
37. Camila — Visual QA e Fidelidade Design→Código

### AI & Model Systems

38. Akira — Asian/Open Model Intelligence
39. Samuel — Frontier Model Radar
40. Aline — Free API Intelligence
41. Igor — Gateways, Routers e Model Brokers
42. Vitor — Protocolos e Adapters OpenAI/Anthropic/Gemini
43. Caio — Coding Models e Agentic Software Engineering
44. Naomi — Multimodal AI
45. Hugo — Self-hosting, Inference, Quantização e GPU
46. Pedro — Agent Harnesses
47. Raquel — Benchmarks e Avaliação Comparativa de Modelos
48. Andréia — Quota, Cache, Tokens, Latência e Custo
49. Sérgio — Integração de Provedores, SDKs e Lifecycle de APIs

## 4. Invariantes

```yaml
roster_total: 49
participacao_de_todos: false
selecao_dinamica: true
agente_sem_entrega: proibido
funcao_inventada: proibida
trabalho_silencioso: proibido
pesquisa_sem_evidencia: proibida
passagem_de_bastao: obrigatoria
```

Ter 49 agentes significa **49 competências disponíveis**, não 49 participantes obrigatórios em cada missão.

## 5. Cobertura global de IA

O radar de modelos e provedores deve ser provider-neutral e region-neutral. A cobertura mínima inclui, quando material à missão:

- Z.ai / GLM;
- DeepSeek;
- Alibaba / Qwen;
- Moonshot / Kimi;
- MiniMax;
- Baidu / ERNIE;
- Tencent / Hunyuan;
- Xiaomi / MiMo;
- StepFun;
- NVIDIA-hosted open models;
- demais ecossistemas asiáticos, europeus, americanos e open-weight relevantes.

Popularidade não é critério de exclusão ou prioridade. Recência, capacidade, custo, licença/termos, privacidade, integração e evidência medida pelo MCF são critérios de seleção.

## 6. Fronteira e APIs gratuitas

A divisão AI & Model Systems deve manter radar em janelas de 24h/72h, 7 dias e 30 dias para:

- novos modelos e versões;
- APIs gratuitas e free tiers;
- créditos promocionais e trials;
- routers e gateways;
- harnesses de coding;
- mudanças de licença, retenção de dados e termos comerciais;
- endpoints gratuitos ou subsidiados;
- capacidade de self-hosting.

Toda alegação externa permanece NÃO VERIFICADA para uso operacional até teste controlado e evidência própria.

## 7. Runtime e skills

A expansão do roster não implica automaticamente que novas skills estejam executáveis no runtime. Novas skills podem ser registradas documentalmente antes da implementação do executor, desde que o README e o estado canônico diferenciem claramente `registered`, `executable` e `documental_only`.

## 8. Governança

Mudanças em agentes, prompts, modelos, autonomia ou tool calling continuam sujeitas aos agentes de controle previstos na matriz. Ferramentas externas, routers e APIs não são aprovados apenas por constarem do radar; passam por avaliação de segurança, termos, evidência e fallback.
