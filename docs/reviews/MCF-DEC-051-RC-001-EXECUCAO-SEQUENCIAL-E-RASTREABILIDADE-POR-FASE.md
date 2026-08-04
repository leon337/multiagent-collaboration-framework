# MCF-DEC-051 — RC-001 — Execução Sequencial e Rastreabilidade por Fase

**Data:** 4 de agosto de 2026  
**Revisora por papel:** Emily — Auditoria Independente  
**Natureza:** revisão documental e procedimental  
**Branch:** `docs/mcf-dec-051-execucao-sequencial-rastreabilidade-fases`  
**Estado:** concluída

## 1. Objeto

Auditar:

- correção do formato retrospectivo insuficiente;
- adoção da Execução Sequencial Exposta e Verificável — ESEV;
- passagens internas intercaladas;
- manutenção do loop orientado a objetivo;
- resposta única cronológica;
- Pacote de Rastreabilidade da Fase — PRF;
- checkpoint por fase;
- compatibilidade com MCF-DEC-050, CAF e delegação a Léo;
- atualização dos pontos de entrada e templates.

## 2. Evidências examinadas

- `docs/decisions/MCF-DEC-051-EXECUCAO-SEQUENCIAL-VISIVEL-E-RASTREABILIDADE-POR-FASE.md`;
- `docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md` versão 1.1;
- `docs/protocols/MCF-PROMPT-PORTATIL-INICIALIZACAO-NOVO-PROJETO.md`;
- `templates/MCF-UNIFIED-MISSION.yaml`;
- nove arquivos em `templates/phase-traceability/`;
- comparação da branch contra `main`.

## 3. Correção do problema apresentado por Leandro

A nova decisão distingue corretamente:

- **execução real visível:** blocos cronológicos, ações, evidências, decisões e handoffs no ponto da atuação;
- **síntese retrospectiva:** lista curta ao final dizendo o que cada agente fez.

A síntese retrospectiva passa a ser permitida somente como índice opcional, nunca como comprovação principal.

**Resultado:** PASS.

## 4. Ordem cronológica e passagem de bastão

O protocolo agora exige:

- título ligado à atividade atual;
- entrada recebida;
- ação executada;
- evidência observada;
- resultado e análise;
- decisão e entrega;
- passagem antes do bloco do destinatário;
- continuidade a partir do checkpoint;
- retorno obrigatório à missão-pai.

**Resultado:** PASS.

## 5. Loop e falhas

Falhas, classificações CAF, recuperações, validações e retorno ao fluxo devem aparecer como eventos cronológicos, em vez de serem condensados depois.

**Resultado:** PASS.

## 6. Rastreabilidade por fase

O PRF exige:

1. plano;
2. relatório;
3. validação resumida;
4. validação expandida;
5. smoke;
6. checkpoint;
7. decisões;
8. manifesto SHA-256;
9. README.

Documentos de domínio são condicionais e itens não aplicáveis devem possuir justificativa.

**Resultado:** PASS.

## 7. Retomada e continuidade

O checkpoint registra missão, fase, commits, critérios concluídos, lacunas, artefatos, decisões, bloqueios, próxima fase, próxima ação e destinatário.

Isso permite transferência entre fases e chats sem reiniciar a missão ou reconstruir conteúdo ausente.

**Resultado:** PASS.

## 8. Atualização dos pontos operacionais

- protocolo ativo atualizado para versão 1.1;
- prompt portátil atualizado;
- template unificado agora registra eventos cronológicos e estado do PRF;
- templates de arquivos da fase adicionados.

**Resultado:** PASS.

## 9. Compatibilidade com autoridade

A MCF-DEC-051 não altera a hierarquia:

- Leandro permanece autoridade humana final;
- Léo decide gates internos;
- Mestre coordena;
- Emily audita;
- agentes executam por competência.

O PRF vira entrada do gate de Léo, sem criar nova autoridade.

**Resultado:** PASS.

## 10. Ressalvas

### LOW-01 — Componentes visuais da interface não são controlados pelo protocolo

O protocolo exige registrar ação e resultado de ferramenta, mas não pode garantir que toda interface mostre chips ou indicadores visuais idênticos aos prints. O equivalente textual verificável é aceito quando o componente visual não existir.

### LOW-02 — Manifesto ainda depende de geração real

O template contém marcadores `PENDING`. Cada projeto ainda deve executar cálculo SHA-256 real antes do fechamento.

### LOW-03 — Validação estrutural ainda não automatizada

Não existe schema ou CI específico que bloqueie fase sem todos os arquivos do PRF, handoffs intercalados ou campos obrigatórios preenchidos.

### LOW-04 — Dependências externas assíncronas podem atravessar respostas

CI, deploy, propagação e processamento externo podem exigir estado `AGUARDANDO_DEPENDENCIA_EXTERNA`. Isso não autoriza pedir confirmação rotineira; exige checkpoint e retomada automática quando possível.

## 11. Não conformidades

```yaml
critical: 0
high: 0
medium: 0
low: 4
merge_blocked: false
```

## 12. Veredito

```text
PASS_WITH_MINOR_RESERVATIONS
```

A correção atende ao padrão demonstrado por Leandro: execução sequencial acompanhável, passagens intercaladas, ciclos visíveis e documentação por fase.

## 13. Recomendação ao Léo

```yaml
decision_recommended: APROVAR_COM_RESSALVAS
adocao_operacional: IMEDIATA
merge_reversivel: AUTORIZAR_APOS_CI
next_improvements:
  - criar_validador_automatizado_do_PRF
  - automatizar_manifesto_SHA256
  - testar_o_protocolo_em_uma_fase_real
human_gate_required: false
```