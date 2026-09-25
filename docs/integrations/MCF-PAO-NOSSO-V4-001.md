# MCF-PAO-NOSSO-V4-001 — Registro de Missão

- **Projeto:** Pão Nosso
- **Repositório canônico operacional:** `leon337/meu_primeiro_agente`
- **Issue MCF:** #375
- **Issue do produto:** `leon337/meu_primeiro_agente#19`
- **Risco:** C
- **Autoridade humana:** LEANDRO
- **Coordenador:** MESTRE
- **Gate:** LÉO

## Objetivo

Governar a evolução Pão Nosso V4 com uma fonte de verdade recuperável, roadmap, checklist e gates por implantação.

## Estado inicial comprovado

- Web cria pedido persistido e código PN.
- WhatsApp consulta o pedido persistido.
- WhatsApp pode criar pedido real.
- Supabase/PostgreSQL é a autoridade transacional.
- Audit ledger do WhatsApp existe.

## Estrutura de acompanhamento

O estado de produto é acompanhado em:

- `README.md`
- `ROADMAP.md`
- `CHECKLIST.md`
- `.mcf/mission.yaml`
- `.mcf/project-capsule.yaml`

## Fases

V4.0 Fundação → V4.1 Painel → V4.2 Status/WhatsApp → V4.3 Clientes → V4.4 Cardápio → V4.5 Produção → V4.6 Estoque → V4.7 Pix → V4.8 Entrega → V4.9 Analytics → V4.10 Agente/Hardening.

## Observação sobre “MCPE”

Não há, no baseline canônico atual do MCF, arquivo, registry ou componente identificado literalmente como `MCPE`. Para evitar criar uma segunda fonte de verdade, esta missão foi registrada nos mecanismos canônicos existentes: Project Registry, Mission Context e Issue MCF. Um eventual MCPE futuro deve consumir ou referenciar estes IDs, não duplicá-los.
