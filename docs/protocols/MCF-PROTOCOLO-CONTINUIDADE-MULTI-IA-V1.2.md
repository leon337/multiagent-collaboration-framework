# MCF — Protocolo de Continuidade Multi-IA V1.2

**Classificação:** REGRA NORMATIVA
**Autoridade:** MCF-DEC-067
**Estado:** `CANONICALIZATION_PENDING`

## 1. Autoridade e objetos

Authority is resolved by domain. MCF owns universal continuity/governance/discovery; each registered project owns project-specific technical truth; runtime-live owns current operational observations; chat memory is non-authoritative.

Remote canonical and local/live snapshots are separate objects. Neither silently substitutes for the other. Afirmações operacionais correntes exigem re-observação live conforme a política de timing aplicável.

## 2. Estados exatos

Governança possui exatamente: `NOT_AUTHORIZED`, `AUTHORIZED`, `CANONICALIZATION_PENDING`, `CANONICAL`.

Evidência possui exatamente: `UNVERIFIED`, `IN_PROGRESS`, `PASS`, `FAIL`, `STALE`.

Human approval never implies evidence `PASS`. Approval without persisted and objectively verified state remains `CANONICALIZATION_PENDING`. `CANONICAL` is allowed only after persistence and objective verification of that persisted state.

## 3. Bootstrap e checkpoints

Fresh-client bootstrap possui exatamente esta ordem, sem permutação:

1. identify project
2. locate registry
3. read project capsule
4. read canonical entrypoints
5. inspect open work
6. re-observe live state when required
7. detect stale/conflict
8. open mission contract
9. continue from next executable gate

Checkpoints possuem exatamente estas sete classes: material decision; critical FAIL; direction change; gate; external dependency; conflict; mission close. Per-click persistence is excluded.

## 4. Identidade, fonte, timing e evidência

`observation_id` is immutable observation identity and `evaluation_id` is immutable evaluation identity. Timestamps are attributes only, never identity or join keys.

Every operand used by an evaluation is referenced by exact `observation_id`. Within one evaluation, every observation has a unique `observation_id`. Every derived result references exactly the complete unique set of its observations' IDs, one `evaluation_id`, and immutable/non-empty `evaluator_version`. Missing, extra, duplicate, wrong, cross-evaluation, or mixed-evaluation operand IDs are invalid.

Timing policy is separate from source kind. Source kind identifies remote Git, local repository, runtime probe, registry/document, or open-work source; timing policy independently states durability/freshness requirements. Um não pode ser derivado do outro.

Required evidence dimensions are explicit and non-empty. Their applicable bindings are explicit. A required dimension with zero applicable bindings cannot `PASS`; aggregate `PASS` requires all required dimensions represented, at least one applicable required binding overall and per required dimension, all bindings current for the same evaluation, and every required criterion passing.

## 5. Publicação

Each publication attempt freshly acquires exactly one remote-head and one open-work observation and binds both exact IDs to that publication's `evaluation_id`. The delivered `publication` object MUST contain `prior_publication_history = { complete: true, observation_ids: [...] }`. That history is populated only from the persisted publication-history authority for the active mission/project scope under the existing authority-by-domain rules; it is cumulative across all prior qualified publication attempts in that scope and is not caller-invented. The first attempt is represented by authoritative complete empty history. If authoritative history is unavailable, omitted, unknown, or cannot establish `complete=true`, publication fails closed. Neither current remote-head nor open-work `observation_id` may appear in `prior_publication_history.observation_ids`, regardless of `reused`. Each current operand requires exactly `timing_policy='FRESH_ON_ATTEMPT'`, `fresh=true`, and `reused=false`. Timestamps and wall-clock age do not determine publication freshness. Remote-head publication qualification is `EQUAL` only: observed remote canonical head must equal the expected/base canonical commit.

Publication fails closed on missing/incomplete operands, stale/reused remote-head or open-work observations, wrong operand IDs, cross-evaluation or mixed-evaluation operands, remote-head inequality, domain overlap, or normalized file overlap.

## 6. Normalização

Para path POSIX relativo ao repositório: a entrada deve ser string não vazia; rejeitar NUL/control characters, URI forms, absolute POSIX paths, Windows drive/UNC roots e escape da raiz. Converter `\` para `/`; colapsar `/` repetido; remover `.`; resolver `..` removendo um segmento ordinário anterior, rejeitando-o sem anterior. Rejeitar resultado sem segmentos. Preservar bytes e caixa; não consultar filesystem, resolver symlink, normalizar Unicode ou fazer case folding. A saída une segmentos com um `/`, sem `/` inicial ou final.

File identity comparison uses exact canonical-string equality. File overlap exists when normalized file sets intersect. Directory-prefix overlap is not inferred unless a concrete normalized file appears in both sets.

Domain identifier normalization: validar UTF-8; remover whitespace inicial/final; exigir resultado não vazio; preservar a sequência UTF-8 exata. Comparison is case-sensitive exact equality. No case folding or Unicode normalization is permitted. Domain overlap exists only on exact normalized-string intersection.

## 7. Delegação e limites

Cross-chat visual/window succession is delegated to `docs/protocols/MCF-PROTOCOLO-SUCESSAO-CROSS-CHAT-E-CONTROLE-DE-JANELAS.md`; do not duplicate it.

Task 2-V2 owns all protocol semantics and its executable qualification. Task 3 only wires the CLEAN protocol into bootstrap/registry documents; it must not redefine these semantics. Task 4 owns static integration plus formal cross-file conformance validation; it may detect drift, not relocate these semantics.

MCF não assume verdade técnica específica do projeto nem estado runtime. Projetos não redefinem governança universal. Runtime-live não estabelece canonicidade. Chat-client não estabelece persistência, evidência ou autoridade. Tag, release, deployment, merge, ação destrutiva e ampliação de escopo exigem seus próprios gates.
