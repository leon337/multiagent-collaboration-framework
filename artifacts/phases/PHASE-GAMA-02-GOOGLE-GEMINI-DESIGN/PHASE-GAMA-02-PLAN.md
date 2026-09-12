# PHASE-GAMA-02 — Google/Gemini Technical Fit Design

Mission: `MCF-GAMA-FUND-2026-001`
Executor real desta fase: `MESTRE`
Human authority: `LEANDRO`
Risk class: `B`

## Objetivo
Projetar uma integração Google/Gemini legítima, mínima, governada e verificável para o MCF, suficiente para cumprir o requisito de Google fit do Gama Fund sem contaminar a arquitetura com bypass de autoridade, custo implícito ou claims acima da evidência.

## Escopo
- inspecionar os boundaries reais do runtime MCF;
- definir opções de integração e trade-offs;
- escolher arquitetura recomendada para G3;
- definir contratos de execução, evidência, segredo e falha;
- definir qualificação mínima ponta a ponta;
- preservar zero paid fallback por padrão.

## Fora de escopo
- instalar SDK;
- adicionar código de produção;
- criar/alterar chave Gemini;
- habilitar Cloud Billing;
- executar chamada real à API Gemini;
- alterar produção;
- submeter candidatura;
- atribuir trabalho a agentes sem execução independente verificável.

## Critérios de aceite
1. três abordagens de integração comparadas;
2. boundary recomendado coerente com o runtime atual;
3. chamadas de ferramenta do modelo não podem executar efeito externo fora do MCF;
4. segredo nunca entra em Git/ledger/log/client;
5. paid fallback desabilitado por padrão;
6. modelo configurável e allowlisted;
7. contrato de evidência e erros definido;
8. plano de testes/qualificação definido;
9. G3 bloqueado por HUMAN_GATE de LEANDRO antes de implementação.
