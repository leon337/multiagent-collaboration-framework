# Decisões — MCF-431

1. Preservar a VM `instance-20260920-0445` até uma substituta estar validada; não excluir a única VM conhecida.
2. Não redimensionar E2 x86 para A1 ARM como se fosse uma simples troca de shape; verificar cota/capacidade e planejar substituta paralela.
3. Manter CDP e Bridge em loopback; não expor portas privilegiadas à Internet.
4. Usar Bridge apenas para leitura neste ciclo de validação; ações de escrita/click permanecem fora do caminho read-only do Claude.
5. Não considerar testes do repositório público 0.6.2 como prova do build local 0.6.9.
6. Não classificar A1.Flex como indisponível sem evidência live de cota/capacidade.
7. Não contornar a barreira de segurança que impediu a navegação OCI; registrar o critério afetado como BLOCKED e avançar tarefas independentes.
