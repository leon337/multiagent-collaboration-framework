# PHASE-CONTENT-STUDIO-N4-COURSE-SCALE-001 — PLAN

```yaml
mission_id: MCF-CONTENT-STUDIO-N4-COURSE-SCALE-001
parent_mission_id: MCF-CONTENT-STUDIO-N4-EVOLUTION-001
phase_id: PHASE-CONTENT-STUDIO-N4-COURSE-SCALE-001
tracker: 277
branch: planning/mcf-content-studio-n4-course-scale-20260919
base_branch: planning/mcf-content-studio-n4-evolution-20260919
base_commit: 012188ea5415500bf9ad67b3689ffbaf9cade522
risk_class: B
objective: "Produzir as aulas canônicas restantes com a engine N4 validada, narração, QA e Review Lab por aula."
```

## Gates

### C0 — Curriculum inventory
Resolve the canonical lesson list from Project sources.

### C1 — Lesson content packs
For each lesson: title, objectives, concepts, examples, active recall and source evidence.

### C2 — N4 authoring
Produce `TechnicalLessonSpec` payloads using registry/templates/components.

### C3 — Narration
Generate PT-BR narration and frame-aligned captions.

### C4 — Render
Render portrait lesson video through the generic N4 engine.

### C5 — Lesson Review Lab
Create assistible HTML review with video, narration/timeline, QA and source metadata.

### C6 — Lesson QA
Run preflight, visual/mobile QA, factual review and technical checks.

### C7 — Course gate
Reconcile all canonical lessons and decide whether each is ready, blocked or deferred.

## Hard rule

Do not start a lesson from memory when the canonical Project source can be resolved.
