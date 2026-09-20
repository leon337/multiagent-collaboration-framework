# MCF Web Research Skills

## Objetivo

Este pacote desacopla pesquisa e coleta web do provedor Firecrawl.

A regra é:

```text
INTENÇÃO WEB
  ↓
SKILL MCF
  ↓
POLÍTICA DE ROTEAMENTO
  ↓
PROVIDER DISPONÍVEL E APROVADO
  ↓
EVIDÊNCIA + PROVENIÊNCIA
```

Firecrawl pode continuar disponível como **fallback opcional**, mas nenhuma Skill deste pacote depende dele para existir.

## Skills

| Skill | Substitui principalmente | Perfil |
|---|---|---|
| `MCF-WEB-SEARCH` | Firecrawl Search / Developer Search | `READ_ONLY` |
| `MCF-WEB-FETCH` | Firecrawl Scrape | `READ_ONLY` |
| `MCF-WEB-MAP` | Firecrawl Map | `READ_ONLY` |
| `MCF-WEB-COLLECT` | Firecrawl Crawl | `READ_ONLY` |
| `MCF-WEB-RESEARCH` | Firecrawl Agent / Research | `READ_ONLY` |
| `MCF-WEB-INTERACT` | Firecrawl Interact | `SCOPED_WRITE` |
| `MCF-WEB-MONITOR` | Firecrawl Monitor | `SCOPED_WRITE` |

`firecrawl_parse` não é recriado aqui: arquivos locais devem usar as capacidades já existentes de Files, PDF, Documents e demais skills de artefato.

## Estado

Os contratos começam como `EXPERIMENTAL`.

Eles são imediatamente úteis para **orquestração por papéis do MCF em ambientes que já exponham os providers listados**, mas não devem ser declarados `runtime-executable` no servidor MCF até existir adapter/provider executável e testes no mesmo SHA.

Isso evita o erro de registrar YAML e alegar que uma capacidade de rede passou a existir no runtime.

## Invariantes

- nenhuma falha do Firecrawl bloqueia automaticamente uma missão web;
- nenhum fallback pago pode ocorrer silenciosamente;
- provider, timestamp e limitações entram na evidência;
- nenhuma cobertura parcial pode ser chamada de crawl completo;
- autenticação, CAPTCHA ou controle de acesso não podem ser contornados;
- ações interativas com efeito externo continuam sob Permission Engine/HUMAN_GATE;
- monitoramento exige scheduler/automation real; não simular trabalho em background.

## Política de roteamento

Fonte: [`provider-policy.yaml`](./provider-policy.yaml).

A escolha de provider considera a natureza da consulta:

- web geral → `Web_Native`;
- código/engenharia → `GitHub`, `OpenAI_Developers`, depois web geral;
- pesquisa acadêmica → `Consensus`/`Sider_Scholar`;
- página conhecida → `Web_Native`, depois browser autorizado;
- interação → `ChatGPT_Work`/`Remote_Desktop_Commander`;
- monitoramento → `Automations`;
- Firecrawl → fallback opcional, nunca requisito estrutural.

## Próximo boundary

Para tornar estas Skills executáveis pelo runtime servidor, será necessário implementar e qualificar um `Web Capability Provider` ou adapters equivalentes. Esse boundary deve incluir:

1. provider contract;
2. roteamento;
3. receipts;
4. timeout/rate-limit handling;
5. data policy;
6. testes de provider indisponível;
7. testes de fallback;
8. integração com Permission Engine;
9. zero fallback pago sem autorização;
10. validação de evidência.

Até lá, o status correto é **EXPERIMENTAL / orchestration-ready / runtime-adapter-pending**.
