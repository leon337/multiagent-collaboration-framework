# Relatório F3/F4/F5

Foi criada uma instância de laboratório no host autorizado, isolando porta, perfil CDP, observabilidade e execução. O serviço do laboratório foi habilitado no gerenciador de usuário, e a exposição HTTPS foi incluída somente na tailnet, preservando a porta e o serviço original.

F3: 7/7 testes E2E; gate exigido; negativa efetiva; endereço interno bloqueado.

F4: HTTPS HTTP 200/TLS 0; WSS com geração de áudio; navegador real via URL tailnet 5/5; reinício do serviço mantendo ambos ambientes responsivos. `linger=yes` verificado.

F5: 35/35 testes automatizados, dois endpoints sensíveis restritos retornaram 403 remotamente, checagem SHA-256 dos quatro arquivos baselines OK, documentação operacional no MCF.

**Ressalvas:** não houve escuta com headset real, teste do celular Android, reboot completo nem assinatura confiável de aprovação exclusivamente por voz. Auditoria independente por outro executor não foi realizada. Nenhum merge/deploy de produção foi realizado.
