# Júlia — Governança Classe C

## Verificação

- `v1.0.0` é identidade pública imutável e deve permanecer separada do simples deploy produtivo;
- não existe Gate F canônico; a missão #131 formaliza somente o boundary necessário;
- RC1 e RC2 não podem ser movidas;
- mudanças materiais posteriores à RC2 impedem sua promoção direta;
- RC3 reduz ambiguidade ao congelar o estado efetivamente qualificado e produzido;
- autorização humana anterior cobre produção, mas a stable é milestone separado e recebe HUMAN_GATE próprio antes da publicação;
- migração de Render para outra infraestrutura não deve ser acoplada à stable sem necessidade, pois alteraria escopo e risco;
- plano pago continua proibido pela decisão vigente.

## Parecer

`APROVAR_CONTINUIDADE_DA_QUALIFICACAO`, mantendo `v1.0.0` bloqueada até os gates finais.
