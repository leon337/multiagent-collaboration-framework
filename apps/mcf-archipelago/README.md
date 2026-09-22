# MCF Archipelago V1

Interface espacial para chats, projetos e agentes.

## Escopo V1

- grafo SVG com pan/zoom;
- ilhas arrastáveis;
- criação de chats e projetos;
- agrupamento por projeto e auto-layout;
- busca e foco;
- minimapa;
- painel de contexto com mensagens locais;
- renomear, conectar e excluir;
- persistência em localStorage;
- export/import JSON;
- fallback HTML acessível;
- zero dependências de runtime.

## Validação

```bash
npm run ci
```

## Limite intencional

A V1 não armazena chave OpenAI no browser. A integração ChatGPT/OpenAI entra por provider/backend separado após estabilização da experiência e do modelo de contexto.
