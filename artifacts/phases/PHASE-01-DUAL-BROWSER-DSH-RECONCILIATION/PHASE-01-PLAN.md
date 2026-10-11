# PHASE-01 — Plano de descoberta e reconciliação inicial

- **Mission:** MCF-CUIDABEM-002
- **GitHub Issue:** #434
- **Classe:** B
- **Objetivo da fase:** reconciliar o contrato MCF com a superfície Dual Browser e identificar o estado verificável do DSH sem alterar sessões, credenciais ou produção.
- **Estado da fase:** descoberta parcial; dependência de runtime identificada.
- **Data:** 2026-10-11

## Escopo
1. Recuperar protocolos MCF vigentes e a missão relacionada #431.
2. Confirmar saúde da Agent Bridge e do servidor web DSH.
3. Identificar processo, portas, build e caminhos de estado observáveis.
4. Testar somente rotas HTTP não mutáveis e autenticação negativa.
5. Inspecionar a implementação e a suíte de testes da build-fonte.
6. Registrar evidências, riscos, checkpoint e próxima ação.

## Fora de escopo
- Recuperação ou divulgação de tokens da memória do processo.
- Envio de mensagens ou criação de sessões antes de validar mecanismo e destinatário.
- Reinício/encerramento do Cockpit, alteração destrutiva de perfis, mudanças de ACL ou contorno de autenticação.
- Deploy, release, produção ou provisionamento OCI.

## Fontes de verdade
- `docs/MCF-CURRENT-STATE.md`
- `docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md`
- `docs/protocols/MCF-PROTOCOLO-DUAL-BROWSER-RUNTIME-DISCOVERY.md`
- `docs/operations/MCF-UI-OPERATING-MANUAL.md`
- `docs/contracts/MCF-UI-SEMANTIC-CONTRACT.json`
- Runtime local, saída de comandos e testes executados nesta fase.

## Critérios de aceite da fase
- [x] Contrato MCF e protocolo de discovery consultados.
- [x] Saúde HTTP da bridge e da UI DSH verificada.
- [x] Testes da build-fonte executados.
- [x] Rotas protegidas testadas sem credenciais, sem contornar auth.
- [x] Divergência entre runtime/launcher/descriptor documentada.
- [x] Limites e riscos registrados.
- [ ] Discovery autenticado: bloqueado por descriptor ausente.
- [ ] Envio/recebimento ponta a ponta: adiado até identificar API e sessão autorizadas.

## Risco e autorização
Risco B. As leituras e probes realizados são não mutáveis. Não foram expostos segredos, alteradas configurações nem interrompidas sessões.

## Equipe planejada
MESTRE coordena; Miriam (contexto), Sofia (arquitetura), Beatriz (roteamento), Renato (validação), Augusto (trace), Carmem (PRF), Gabriel (vínculo de artefatos) e Emily (auditoria) são papéis previstos, não participação executada nesta fase.
