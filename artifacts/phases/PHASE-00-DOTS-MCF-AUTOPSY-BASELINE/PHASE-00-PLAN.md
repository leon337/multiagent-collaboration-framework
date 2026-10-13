# PHASE-00 — Baseline e contratação da autópsia Dots × MCF

- Mission Issue: https://github.com/leon337/multiagent-collaboration-framework/issues/441
- Baseline branch: `main`
- Baseline SHA observado: `460d6e6fc4c5ac8dc8b0962bcf76a62c059a1615`
- Branch desta fase: `mission/dots-mcf-autopsy-001`
- Estado: EM EXECUÇÃO — baseline parcial
- Risk class proposta: B (pesquisa e documentação; sem execução intrusiva)
- Autoridade humana final: LEANDRO
- Coordenador: MESTRE

## Objetivo
Estabelecer o contrato operacional, baseline de GitHub e mapa de fontes para a auditoria retroativa, preservando a separação entre evidência, inferência e hipótese.

## Escopo
- Reconhecer o estado live do MCF e do PR #438.
- Confirmar convenções canônicas de missão e pacote de rastreabilidade.
- Descobrir o fluxo de leitura/escrita do Manual do Agente GPT.
- Definir os limites e o plano para as fases históricas, documentais, comparativas e de validação.

## Fora de escopo
- Alterar runtime, banco, permissões, credenciais, integrações ou produção.
- Fazer merge, deploy, release ou ativar adapters.
- Afirmar detalhes internos do Dots sem fonte pública.
- Publicar um manual sem completar o procedimento DEP-002 e verificar o resultado.

## Fontes da verdade
1. Instruções atuais de LEANDRO.
2. GitHub/provider live.
3. Código, testes, workflows e evidências do SHA aplicável.
4. Protocolos e decisões vigentes do MCF.
5. Documentação histórica.
6. Fontes oficiais públicas da OpenAI para Dots; inferências identificadas como tais.

## Critérios de aceite desta fase
- [ ] Baseline live datado e SHA registrados.
- [ ] PR #438 e escopo de integração examinados.
- [ ] Protocolo operacional unificado e template de missão lidos.
- [ ] Manual do Agente e caminho DEP-002 identificados; limitações de acesso anotadas.
- [ ] Mapa inicial de fontes e próximos passos registrado.
- [ ] Checkpoint e pacote de rastreabilidade revisados.
- [ ] Sem mutações de runtime/produção/permissões.

## Sequência de trabalho
1. Capturar estado live e confirmar branch base.
2. Ler contrato operacional e template de missão.
3. Inspecionar PR #438 e identificar dependências.
4. Inspecionar repositório do Manual, rotas de leitura e fluxo DEP-002.
5. Montar inventário de fontes Dots e mapa da autópsia histórica do MCF.
6. Validar artefatos, registrar limitações e preparar passagem à Fase 1.

## Regra de evidência
Cada achado deve conter classificação (`VERIFIED_FACT`, `SECONDARY_EVIDENCE`, `INFERENCE`, `HYPOTHESIS` ou `UNKNOWN`), fonte, data de consulta, escopo demonstrado, limites e próxima verificação.