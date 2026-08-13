# MCF NextGen — Writer Reliability Note 001

Status: `EMPIRICAL_FINDING / UNDER_STUDY`.

Durante este discovery, operações de persistência solicitadas por LEANDRO foram algumas vezes bloqueadas pela camada intermediária de segurança do conector antes de chegarem ao GitHub, enquanto outras operações equivalentes foram aceitas e persistidas normalmente.

Isso não caracterizou falta de permissão do repositório: a branch `planning/mcf-nextgen-discovery` e os dois documentos principais foram posteriormente criados e verificados por read-back.

Finding para o NextGen: checkpoint durável não deve depender de um único writer síncrono. Estudar pipeline com estados `PENDING_PERSISTENCE`, `SAVED` e `FAILED`, read-back verificável, idempotência, retry controlado, reconciliação e fallback de writer/store, evitando perda silenciosa quando uma integração de escrita estiver temporariamente indisponível ou bloqueada.
