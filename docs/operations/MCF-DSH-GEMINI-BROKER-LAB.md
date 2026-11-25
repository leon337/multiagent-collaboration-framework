# MCF — Conversa DSH ↔ Gemini Web via broker restrito (laboratório)

**Classificação:** `EXPERIMENTAL / LAB_VERIFIED` para comunicação textual e recibos; `PLANNED` para integração ao MissionRuntime central  
**Evidência temporal:** 2026-11-22  
**Origem:** ensaio local MESTRE (DSH) ↔ broker MCP ↔ navegador Brave autenticado ↔ Gemini Web, seguido de revisão editorial pelo Gemini  
**Governança:** LEANDRO = autoridade humana final; MESTRE = orquestrador; LÉO = agente distinto. Este documento **não** concede capacidades ou permissões novas.

## 1. Resultado demonstrado e limite da evidência

No laboratório local, o MESTRE do DSH chamou efetivamente as ferramentas MCP `gemini_session_status`, `gemini_send_message`, `gemini_receipt` e `gemini_read_reply` do servidor `mcfgemini`. Uma rodada anterior e a rodada editorial R3B chegaram a `REPLY_COMPLETE`, com marcadores de resposta conferidos na conversa vinculada e sem reenvio. A resposta editorial recomendou separação de camadas, controles de identidade e destino, idempotência, reconciliação de estados incertos e documentação pública sem informações da sessão.

A bateria local anterior à rodada R3B passou em **34/34 testes** de software, incluindo cenários simulados de desvio de conversa, duplicação, retorno incorreto, falha de transporte e captura do Brave. Esses resultados não são CI do repositório central, nem teste de produção, nem homologação de uma integração ampla. A troca real de conversa durante geração **não foi realizada**; o teste `cross_thread_response_guard` foi executado com transporte simulado.

Houve uma falha de preflight `MESSAGE_OUTSIDE_TEXTUAL_TECHNICAL_SCOPE` ao solicitar a primeira revisão R3. O broker rejeitou a mensagem **antes do envio**; um pedido editorial reformulado foi enviado com novo ID, sem contornar controles, e seu recibo foi reconciliado. Esse incidente evidencia que filtros lexicais podem produzir falsos positivos. Filtro textual não é motor de permissões.

O visualizador do Brave no DSH exibiu a conversa autenticada em modo **somente leitura**, com captura por página vinculada e sem foco intencional, mas ocorreram `BRIDGE_BUSY`, timeout de atualização e arquivos temporários de imagem em testes prolongados. Ajustes de cadência, cache e limpeza diminuem pressão; **a estabilidade sob carga ainda não foi homologada**.

## 2. Separação obrigatória de fronteiras

| Boundary | Responsabilidade | Proibição/limite |
| --- | --- | --- |
| **DSH / MESTRE** | Planejar missão e solicitar ações semânticas tipadas; consumir respostas e recibos | Não receber controle geral do navegador, segredos de sessão ou executor arbitrário |
| **Broker de conversa (MCP)** | Restringir provider, conta e conversa; validar destino; serializar envios; persistir recibos; reconciliar leituras | Não conceder permissões ao runtime MCF nem expor JavaScript/seletores genéricos à ferramenta do agente |
| **Navegador autenticado** | Preservar sessão sob custódia humana; oferecer superfície visual e operações de leitura/envio estritamente vinculadas | Uma imagem passiva não habilita clique livre ou transferência de perfil |
| **MissionRuntime central (futuro)** | Aplicar PermissionEngine, HUMAN_GATE, trilha de auditoria e correlação entre missões | Não herdar sessão ou privilégios do navegador; integração central não demonstrada |

A colaboração é **transporte entre agentes**, não uma passagem automática de autoridade do Gemini para o MESTRE. Respostas de modelos são dados não confiáveis e precisam de verificação contra fonte, política e evidência. O parecer editorial do Gemini pode orientar especificações, mas não substitui revisão independente.

## 3. Contrato candidato para futuras integrações

Esta seção é uma **proposta de contrato**, não uma API implementada no runtime central.

```text
conversation_target_ref   identificador privado e estável; não publicar URL/e-mail
mission_id                missão MCF verificável
request_id                ID único de requisição
correlation_id            correlação explícita entre missão, envio e resposta
idempotency_key           chave estável por intenção de envio, sem reuso com texto diferente
payload_digest            hash do texto, sem guardar conteúdo sensível no recibo
policy_scope              autorização textual limitada à finalidade da missão
status                    estado observado, não estado suposto
evidence_ref              referência privada ao recibo/aos testes
```

Invariantes para um adapter futuro:

1. Fixar uma única conversa e verificar URL canônica, conta visível, aba de destino e compositor **dentro da operação que envia**. Falhar fechado se ausência, ambiguidade ou mudança de contexto.
2. Persistir a reserva e o `payload_digest` **antes** de qualquer ação no navegador. A mesma chave nunca pode provocar um segundo envio quando houve confirmação incerta.
3. Reconhecer apenas respostas posicionadas após a mensagem do próprio pedido, com âncora ou marcador de correlação e geração concluída; nunca usar apenas “a última resposta disponível”.
4. Serializar escritas; manter recuperação somente leitura para reservas suspeitas; exigir HUMAN_GATE de LEANDRO para resolução de incerteza que implique novo envio ou ampliação de escopo.
5. Proteger informação de conta, sessão e conversa: não registrar em Git público identificadores pessoais, endereços de chats, transcrições privadas, imagens autenticadas ou dados de autenticação.
6. Respeitar o PermissionEngine do MCF. Acesso operacional ao DSH ou autenticação prévia do Brave não constitui autorização transversal.

## 4. Estados de entrega e recuperação

**Estados observados no broker do laboratório:** `NOT_RESERVED → RESERVED → DISPATCHING → SUBMITTED_UNCONFIRMED → REPLY_PENDING → REPLY_COMPLETE`; falhas e estados auxiliares incluem `FAILED_PREFLIGHT`, `RESPONSE_UNVERIFIED` e `UNKNOWN_RECONCILIATION_REQUIRED`. Um recibo `SUBMITTED_UNCONFIRMED` **não** prova entrega ao provedor; somente pós-condições de mensagem/resposta comprovam cada etapa.

**Estados propostos para o contrato central (ainda não implementados):** `UNCERTAIN_NEEDS_REVIEW`, `CONFIRMED_SENT`, `IDEMPOTENCY_CONFLICT` e `THREAD_ANCHOR_MISMATCH`. Não tratar esses nomes propostos como estados presentes na API do laboratório.

Após timeout ou reinício na janela crítica: recuperar recibo durável, bloquear nova escrita concorrente, inspecionar **somente** a conversa autorizada, confrontar âncoras e contagem de turnos, e atualizar o recibo exclusivamente mediante evidência. Se permanecer incerto, manter bloqueio e escalar a LEANDRO em HUMAN_GATE. **Não fazer retry cego.** O retorno de uma resposta depois do primeiro poll é tratado por nova leitura com o mesmo ID, nunca por novo envio.

## 5. Testes mínimos de aceitação e regressão

| Caso | Falha injetada | Resultado esperado |
| --- | --- | --- |
| **Destino errado / conta errada** | Troca de aba, URL, identidade visível ou duplicação de alvo | `fail-closed`; nenhum envio e nenhum texto de outro contexto |
| **Envio duplicado / corrida** | Mesmo ID em chamadas concorrentes ou depois de timeout | No máximo um envio; recibo existente; chave divergente exige conflito explícito |
| **Resposta cruzada** | Conversa B exibe resposta após pedido da conversa A | `RESPONSE_UNVERIFIED`/erro de âncora; não retornar texto de B; reler A sem reenviar |
| **Resposta parcial** | Geração ainda ativa ou conteúdo sem turno associado | Permanecer pendente; não marcar `REPLY_COMPLETE` |
| **Reinício durante envio** | Processo cai após reserva, antes da confirmação | Recuperar recibo, reconciliar por leitura, sem segundo envio e com gate em caso incerto |
| **Rollback** | Desabilitar o adapter experimental e restaurar configuração anterior | DSH e navegador isolado preservados; serviços íntegros; recibos mantidos para auditoria; nenhuma alteração na `main`/produção |

Cada execução deve registrar método, pré-condição, evidência de pós-condição, resultado `PASS/FAIL/UNVERIFIED` e limites. Testes simulados e E2E autenticados devem aparecer em colunas separadas.

## 6. Publicação de conhecimento e retenção

**Público no MCF:** arquitetura, contrato candidato, limites, sequência de validação, critérios de aceite e resultados agregados com dados anonimizados. Registrar classificação e data; apontar para este manual por `AGENTS.md`.

**Privado sob governança do usuário:** recibos brutos, marcadores vinculados à sessão, URL/identidade da conversa, mensagens completas, capturas e eventuais rastros de erro. Nunca copiar arquivos do perfil do navegador para o repositório. Definir retenção, controles de acesso e redaction antes de formalizar adapter.

Uma **skill executável de conversa Gemini** é candidata, não ativa. Sua entrada no catálogo depende de contrato versionado, integração real com PermissionEngine/HUMAN_GATE, auditoria independente e testes com rollback. A existência desta documentação não equivale a uma nova ferramenta disponível em qualquer chat.

## 7. Pendências para integração central

- Contrato tipado de capacidades e eventos entre MissionRuntime e broker, incluindo `correlation_id`, `policy_scope`, autorização e referência privada às evidências.
- Prova fim a fim do HUMAN_GATE na transição entre missões, sem reutilizar implicitamente autorização de conversa anterior.
- Auditoria independente e testes sob reinício/carga, incluindo disputa pelo bridge compartilhado, temporários de captura e retorno cruzado real quando seguro.
- Isolamento de runtime e de segredo, observabilidade, política de retenção e mecanismo de rollback automático **testado**.
- Decisão governada de promoção experimental → implementado; separar explicitamente `CI_GREEN`, merge documental, adaptação real e deploy produtivo.

## 8. Fontes e escopo canônico

- [AGENTS.md](../../AGENTS.md) — identidades, precedência e governança.
- [Manual Gemini no Dual Browser](MCF-GEMINI-COCKPIT-OPERATING-MANUAL.md) — outra superfície de navegação; não confundir com o broker do DSH.
- [DSH inline Browser — focus boundary](DSH-INLINE-BROWSER-FOCUS.md) — invariante de não roubar foco em atualização passiva.
- [Estado atual](../MCF-CURRENT-STATE.md) — classificações e obrigação de consultar GitHub/ambiente ao vivo.

**Conclusão:** uma comunicação restrita entre DSH/MESTRE e Gemini Web foi demonstrada em laboratório, inclusive recuperação posterior da resposta com recibo `REPLY_COMPLETE`. A integração do broker ao MissionRuntime central do MCF **não** foi implementada ou aprovada por este documento.
