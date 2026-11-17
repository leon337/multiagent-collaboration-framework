# Plano — MCF-PET-LIVE-BACKGROUND-001

Autoridade humana: LEANDRO. Orquestrador: MESTRE.
Fonte canônica: leon337/multiagent-collaboration-framework.
Branch isolada: fix/mcf-pet-live-background-tab-20261116.
Base: PR #534, SHA 9be5141034803bf7d976f39b8e31f24b005a98f5.

Causa: frontend pet-live.js executava end(false) em visibilitychange
quando a aba ficava oculta. WebSocket, microfone e áudio eram encerrados.

Objetivo: permitir alternar abas sem desconectar, mantendo controle
de privacidade e escopos atuais.
MVP: manter WebSocket, bloquear PCM em segundo plano por padrão, oferecer
opt-in explícito para áudio em segundo plano, restabelecer microfone
ao voltar, preservar Stop/pagehide e expiração de cinco minutos.
Teste: Python, Node, Gemini Live real, Chrome e Brave, painel móvel,
integridade, rollback e PR separado.
Fora: ferramentas adicionais, missão/merge/deploy, gravação em segundo
plano sem permissão, contornar suspensão do navegador ou do SO.
