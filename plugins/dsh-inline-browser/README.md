# MCF DSH Inline Browser

Renderiza o Browser compartilhado do DSH **dentro do card da conversa** quando o agente executa `browser_goto`.

O motor continua sendo `@try-works/dsh-browser-agent`. O plugin apenas reutiliza o feed SSE/CDP existente em `/browser-pane/stream` e o registra no slot `tool.call.toolview`.

## Resultado

```text
mensagem do agente
   ↓
browser_goto
   ↓
┌─────────────────────────────────┐
│ Browser ao vivo                 │
│ Executando no Browser           │
│ https://site...                 │
│                                 │
│      [ visão ao vivo ]          │
└─────────────────────────────────┘
```

Não é um segundo navegador e não duplica cookies/sessão.
