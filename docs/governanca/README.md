# Governança do MCF

A governança do MCF evoluiu por decisões e protocolos sucessivos. Esta pasta preserva tanto a **fundação normativa histórica** quanto materiais que continuam úteis, mas nenhum arquivo antigo deve ser usado isoladamente para inferir o estado operacional atual.

## Regra de leitura

Para governança vigente, aplique a precedência do projeto:

1. instrução explícita atual de LEANDRO;
2. GitHub live e evidência verificável;
3. decisões vigentes em `docs/decisions/`;
4. protocolo operacional unificado em `docs/protocols/`;
5. contratos/matrizes atuais de agentes;
6. documentos fundacionais desta pasta quando não tiverem sido superados.

Estado geral do framework: [`../MCF-CURRENT-STATE.md`](../MCF-CURRENT-STATE.md).

## Classificação dos principais documentos desta pasta

| Documento | Classificação | Observação |
|---|---|---|
| `CONSTITUICAO_DO_FRAMEWORK.md` | `HISTORICAL` + baseline normativa | originada na fundação; autoridade/fluxo posteriores foram ampliados por decisões e protocolo unificado |
| `MATRIZ_DE_AUTORIDADE.md` | `HISTORICAL` / parcialmente `SUPERSEDED` | versão de remediação ligada a Issue #10/PR #1/DF-008; use a matriz consolidada de 29 agentes e decisões posteriores para composição atual |
| `POLITICA_DE_VERSOES.md` | `HISTORICAL` / parcialmente `SUPERSEDED` | regras gerais ainda úteis, porém seção “Fundação atual” não representa RC3/produção de 2026-08-13 |
| `FLUXO_OPERACIONAL.md` | `HISTORICAL` quando divergir | protocolo operacional unificado e decisões posteriores prevalecem |
| `LOOP_ORIENTADO_A_OBJETIVO.md` | baseline conceitual | complementar ao protocolo unificado |
| `GOVERNANCA_GITHUB_LINEAR.md` | baseline histórico | GitHub é a fonte de verdade do projeto MCF para estado verificável atual conforme instrução vigente do projeto |
| `GLOSSARIO.md` | referência | usar somente termos ainda compatíveis com decisões vigentes |

## Governança operacional atual

Fontes centrais:

- `docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md`;
- `docs/decisions/MCF-DEC-050-*` em diante;
- `docs/agentes/README.md`;
- `docs/matrices/MCF-MATRIZ-CONSOLIDADA-DE-COMPETENCIAS-29-AGENTES.md`;
- `skills/registry.yaml`;
- PRFs em `artifacts/phases/`.

Invariantes atuais relevantes:

- LEANDRO é autoridade humana final e não é agente;
- LÉO é agente distinto com autoridade operacional delegada dentro do boundary;
- MESTRE é orquestrador responsável pela missão;
- fases Classe B/C exigem rastreabilidade/PRF conforme protocolo;
- sucesso sem evidência é proibido;
- falhas recuperáveis seguem CAF;
- publicação estável de alto impacto permanece sujeita ao HUMAN_GATE aplicável.

## Fundação preservada

Referências a LEA-274, Issue #10, PR #1, `DF-008`, “0.1-remediação” e à simulação transitória de múltiplos papéis por Mestre são **evidência histórica da fundação**. Não devem ser interpretadas como descrição completa da composição, release boundary ou estado operacional atual.

Os nomes `PROTOCOLO_MULTIAGENTE.md`, `CONTRATO_DE_COMUNICACAO.md` e `CRITERIOS_DE_VALIDACAO.md` foram recuperados historicamente durante a fundação. A ausência/reconstrução desses nomes não substitui o conjunto posterior de protocolos e decisões efetivamente versionados.
