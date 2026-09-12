# MCF-DEC-067 — Continuidade Multi-IA por Domínio

**Data:** 7 de setembro de 2026
**Autoridade humana:** Leandro
**Autoridade operacional delegada:** Léo
**Coordenação:** Mestre
**Estado de governança do documento:** `CANONICALIZATION_PENDING` — arquitetura aprovada por humana, mas este branch (`feat/gate-3-multi-ai-continuity-v1-2`) ainda não é `main` canônico; transiciona para `CANONICAL` somente após merge em `main` e verificação objetiva do estado persistido.
**Relacionadas:** MCF-DEC-016, MCF-DEC-053, MCF-PROTOCOLO-SUCESSAO-CROSS-CHAT-E-CONTROLE-DE-JANELAS

## 1. Escopo/Problema/Racional

O problema é a continuidade de estado em ambientes multi-IA onde diferentes domínios (registrado-projeto, runtime-live, chat-client) possuem fontes de verdade distintas e necessitam de regras claras para autoridade, governança, evidência e canonicidade sem conflitos ou redefinição de conceitos existentes (HUMANO NO CONTROLE, HDF, ESEV, CAF, precedência).

**Racional:** Garantir que cada domínio mantenha sua responsabilidade clara, evitando sobreposições autoritativas, preservando a independência entre snapshots remotos canônicos e estados locais/live, e estabelecendo eixos de governança e evidenciação independentes que se complementam ao protocolo de sucessão cross-chat existente.

**Escopo positivo (in-scope):** Este decision governa:
- Continuidade e descoberta para projetos registrados pela MCF.
- Resolução de autoridade por domínio (qual fonte de verdade prevalece para qual pergunta).
- Frescor entre snapshot remoto canônico e snapshot local/live.
- Estado de canonicalização (governança) e transições até `CANONICAL`.
- Guarda de concorrência e publicação (`base_sha`, head remoto, sobreposição de trabalho/domínio/arquivo).
- Governança de retomada por cliente novo (fresh-client resume) dentro deste framework de autoridade.

## 2. Divisão de Responsabilidade

- **MCF:** Dona da continuidade universal, governança e descoberta; não se torna dona do estado de runtime de projeto.
- **Projeto registrado:** Dono da verdade técnica específica do projeto; mantém documentos canônicos autoritativos para seu escopo.
- **Runtime-live:** Estado externo ao Git, observável e re-observável; fonte de verdade operacional momentânea.
- **Chat-client:** Fonte de memória transitória; nunca autoritativa para persistência ou canonicidade.

## 3. Resolução de Autoridade por Domínio

A autoridade depende da pergunta ou domínio, não de um arquivo universal:
- Perguntas sobre verdade técnica específica do projeto → projeto registrado.
- Perguntas sobre estado operacional atual observável → runtime-live.
- Perguntas sobre snapshots versionados, histórico, decisões MCF → MCF (canônico remoto).
- Perguntas sobre estado transitório de conversa → chat-client (não autoritativo).

## 4. Snapshot Canonical Remoto vs Snapshot Local/Live Distinto

- **Snapshot canônico remoto:** Estado versionado no repositório Git (branch/main), imutável até novo commit, representa verdade acordada e persistida.
- **Snapshot local/live:** Estado observado no ambiente de runtime (arquivos, processos, variáveis de ambiente), efêmero e sujeito a mudanças externas; deve ser re-observado antes de afirmar afirmações operacionais atuais.

## 5. Eixo de Governança (Estados Exatos)

Governança independe de evidência e possui quatro estados exatos:
1. `NOT_AUTHORIZED` – ação não autorizada para prosseguir.
2. `AUTHORIZED` – autorização humana concedida, permite prosseguir para canonicalização pendente.
3. `CANONICALIZATION_PENDING` – aguardando persistência após aprovação humana.
4. `CANONICAL` – estado persistido e verificado no repositório.

## 6. Eixo de Evidência (Estados Exatos)

Evidência independe de governança e possui cinco estados exatos:
1. `UNVERIFIED` – evidência ainda não coletada ou analisada.
2. `IN_PROGRESS` – coleta ou verificação em andamento.
3. `PASS` – evidência verificada e atendendo critérios.
4. `FAIL` – evidência verificada e não atendendo critérios.
5. `STALE` – evidência previamente válida mas expirada por tempo, versão, ambiente ou commit.

## 7. Regra: Autorização Humana Nunca Atualiza Evidência para PASS

Autorização humana (transição para `AUTHORIZED` ou `CANONICALIZATION_PENDING`) nunca muda o estado de evidência para `PASS`. A evidência só alcança `PASS` através de verificação objetiva independente da aprovação humana.

## 8. Fluxo de Canonicalização

1. Aprovação humana → transição para `CANONICALIZATION_PENDING` (governança).
2. Persistência no repositório (commit) → tentativa de canonicalização.
3. Verificação objetiva do estado persistido → se sucesso, evidência transiciona para `PASS`.
4. Governança transiciona para `CANONICAL` somente quando evidência está em `PASS`.
5. Falha na verificação → evidência vai para `FAIL`; governança permanece em `CANONICALIZATION_PENDING` até nova tentativa.

## 9. Guarda de Concorrência/Publicação

Antes de publicar (push/commit), verificar:
- `base_sha` (SHA do snapshot no qual o trabalho começou) vs HEAD remoto atual.
- Trabalho aberto sobreposto (mesmos arquivos/domínio) por outras IA ou processos.
- Sobreposição de domínio/arquivo (mesmo escopo de responsabilidade).
Se qualquer condição indicar conflito, bloquear publicação e exigir rebase/merge e nova observação do estado live.

## 10. Princípio de Frescor: LIVE_REQUIRED Re-observado

Qualquer afirmação sobre estado operacional corrente (`LIVE_REQUIRED`) deve ser baseada em re-observação direta do estado live imediatamente antes da afirmação. Estados observados anteriormente tornam-se `STALE` e não podem ser usados para claims atuais.

## 11. Validade da Evidência Vinculada

A validade de evidência está vinculada a:
- Commit/versão específica (snapshot remoto ao qual se refere).
- Environment (variáveis de ambiente, contexto de deploy).
- Tempo de observação (timestamp); expira após limite definido ou mudança detectada.
Quando qualquer um desses muda, evidência transiciona para `STALE`.

## 12. Relação com Protocolo de Sucessão Cross-Chat

Este documento é **complementar** ao `docs/protocols/MCF-PROTOCOLO-SUCESSAO-CROSS-CHAT-E-CONTROLE-DE-JANELAS.md`:
- O protocolo cross-chat trata de identidade de sessão, superfície de janela e mecanismos de input entre chats.
- Este documento trata de autoridade por domínio, eixos de governança/evidência, snapshots canônicos vs live e guarda de concorrência.
Não há sobreposição; ambos podem ser aplicados simultaneamente sem conflito.

## 13. Preservação de Conceitos Existentes

Este decision **não redefine** e **preserva explícita-mente**:
- `HUMANO NO CONTROLE` (gate soberano que interrompe imediatamente qualquer ação).
- HDF (hipótese, dados, falhas) – permanece como estrutura de raciocínio.
- ESEV (execução sequencial exposta e verificável) – continua obrigatória.
- CAF (continuidade automática de fluxo) – permanece como procedimento de recuperação.
- Precedência documental (ordem de aplicação de documentos).
- Semântica de projeto runtime (estado específico do projeto fora do escopo da MCF).
Nenhum desses termos é alterado ou sobreescrito.

## 14. Não-objetivos

Não se propõe a:
- Criar serviço de runtime, banco de dados persistente ou estado global gerenciado pela MCF.
- Implementar GUI persistente ou estado de janela além do já definido em protocolos.
- Persistir estado por clique ou por interação transitória de chat.
- Autorizar tags, releases, deployments em produção ou ações destrutivas.
- Substituir ou duplicar o protocolo de sucessão cross-chat; apenas complementa-o.

---
*Este decision permanece em `CANONICALIZATION_PENDING` até merge em `main` e verificação objetiva do estado persistido; após isso, governança transiciona para `CANONICAL`, sujeito ao gate humano de Léo e precedência documental vigente.*
