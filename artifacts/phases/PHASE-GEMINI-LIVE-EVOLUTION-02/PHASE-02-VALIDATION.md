# Matriz F2.1

| Requisito | Resultado |
|---|---|
| Consentimento por câmera e tela separados | PASS no navegador |
| Rejeição não solicita dispositivo | PASS |
| Ativação exige clique e mostra indicador | PASS |
| Alternância encerra track anterior | PASS |
| Evento de encerramento do SO revoga estado | PASS |
| Botão Parar cancela track e timer | PASS |
| Resolução tardia após desconexão é descartada | PASS |
| Reconexão não reativa mídia | PASS |
| Erros JS não tratados nos testes | 0 |
| Testes Node | 11/11 PASS |
| Testes Chrome (mídia simulada) | 11/11 PASS |
| Hardware real em uso humano | PENDENTE |
| Ingestão de imagem na API Google real | PENDENTE |

Evidências sanitizadas em EVIDENCE-F2-1-CHROME-CONSENT.json.

## F2.2/F2.3
| Teste | Resultado |
|---|---|
| Vision adapter Node | 13/13 PASS |
| Browser análise com provedor mock | 10/10 PASS |
| Google imagem sintética 64x64 | HTTP 200 |
| Google vídeo MP4 2 segundos / Files API | HTTP 200; exclusão confirmada |
| Modelos.list com esta chave | 37 modelos generateContent, suporte visual restante desconhecido |
| HTTP negativos | 403 / 415 / 400 |
| Testes Node F0 + F1 + F2 | 88/88 PASS |
| Vídeo maior que 24MiB, custo/cota por modelo | PENDENTE |

## Segurança F2.2 pós-auditoria
| Teste | Resultado |
|---|---|
| Node vision adaptador/roteador | 17/17 PASS |
| Chrome visão e isolamento de sessão | 14/14 PASS |
| Chrome F2.1 mídia visual | 11/11 PASS |
| Testes Node acumulados | 92/92 PASS |
| Google imagem/vídeo sintéticos no adaptador corrigido | HTTP 200 x2; DELETE video confirmado |
| Auditoria externa do SHA anterior | RETURN_FOR_CORRECTION, corrigido em novo candidato; novo gate pendente |

## QA LOW pós-revisão
| Validação | Estado |
|---|---|
| Node Vision | 18/18 PASS |
| Node acumulado F0/F1/F2 | 93/93 PASS |
| Browser F2.2 | 14/14 PASS anterior a LOW |
| Browser F2.1 | 11/11 PASS anterior a LOW |
| Codex externo SHA 7a11ad6 | PASS_WITH_RESERVATIONS, LOW pós-corrigido |
| Google real pós-LOW | NÃO REEXECUTADO |
