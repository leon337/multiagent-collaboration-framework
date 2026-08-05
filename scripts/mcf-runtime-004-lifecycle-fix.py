from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected one match, found {count}: {old[:80]!r}")
    target.write_text(text.replace(old, new, 1))


planner = "apps/rede-social-agentes/apps/server/src/mcf-runtime/chat-mission-planner.ts"
replace_once(
    planner,
    "return unique(['MCF-START-MISSION', 'MCF-SELECT-AGENTS', ...request.requestedSkills]);",
    "return unique([\n      'MCF-START-MISSION',\n      'MCF-SELECT-AGENTS',\n      ...request.requestedSkills,\n      'MCF-TRACE-MISSION',\n    ]);",
)
replace_once(
    planner,
    "return ['MCF-START-MISSION', 'MCF-SELECT-AGENTS'];",
    "return ['MCF-START-MISSION', 'MCF-SELECT-AGENTS', 'MCF-TRACE-MISSION'];",
)

planner_test = "apps/rede-social-agentes/apps/server/src/mcf-runtime/chat-mission-planner.test.ts"
replace_once(
    planner_test,
    "expect(plan.contract.selectedSkills).toEqual(['MCF-START-MISSION', 'MCF-SELECT-AGENTS']);",
    "expect(plan.contract.selectedSkills).toEqual([\n      'MCF-START-MISSION',\n      'MCF-SELECT-AGENTS',\n      'MCF-TRACE-MISSION',\n    ]);",
)
replace_once(planner_test, "expect(plan.steps).toHaveLength(2);", "expect(plan.steps).toHaveLength(3);")
replace_once(
    planner_test,
    "      'MCF-GIT-PR-RELEASE',\n    ]);\n    expect(plan.steps[1]?.handoffTo).toBe('Vinicius');",
    "      'MCF-GIT-PR-RELEASE',\n      'MCF-TRACE-MISSION',\n    ]);\n    expect(plan.steps[1]?.handoffTo).toBe('Vinicius');",
)

bridge = "apps/rede-social-agentes/apps/server/src/mcf-runtime/chat-runtime-bridge.service.ts"
replace_once(
    bridge,
    "      return {\n        mission_execution: {",
    "      return {\n        final_checkpoint: true,\n        mission_execution: {",
)

executor = "apps/rede-social-agentes/apps/server/src/mcf-runtime/skill-executor.ts"
replace_once(
    executor,
    "missionState: skill.skillId === 'MCF-RUN-TESTS' ? 'COMPLETED' : 'EXECUTING',",
    "missionState: 'EXECUTING',",
)

service = "apps/rede-social-agentes/apps/server/src/mcf-runtime/mission-runtime.service.ts"
replace_once(
    service,
    "} from './mcf-runtime.errors.js';\nimport {",
    "} from './mcf-runtime.errors.js';\nimport { resolveMissionState } from './mission-completion-policy.js';\nimport {",
)
replace_once(
    service,
    "    const now = new Date();\n    const phaseId = request.phaseId ?? randomUUID();",
    "    const existingEvents =\n      outcome.skill.skillId === 'MCF-TRACE-MISSION' &&\n      request.inputs.final_checkpoint === true\n        ? await this.repository.listEvents(missionId)\n        : [];\n    const missionState = resolveMissionState({\n      selectedSkills: mission.contract.selectedSkills,\n      currentSkillId: outcome.skill.skillId,\n      currentPhaseCompleted: outcome.phaseState === 'COMPLETED',\n      finalCheckpointRequested: request.inputs.final_checkpoint === true,\n      defaultState: outcome.missionState,\n      existingEvents,\n    });\n\n    const now = new Date();\n    const phaseId = request.phaseId ?? randomUUID();",
)
text = Path(service).read_text()
count = text.count("missionState: outcome.missionState,")
if count != 2:
    raise SystemExit(f"{service}: expected two outcome mission state references, found {count}")
Path(service).write_text(text.replace("missionState: outcome.missionState,", "missionState,"))
replace_once(service, "if (outcome.missionState === 'COMPLETED')", "if (missionState === 'COMPLETED')")
replace_once(
    service,
    "const missionState = succeeded ? 'COMPLETED' : 'RECOVERING';",
    "const missionState = succeeded ? 'EXECUTING' : 'RECOVERING';",
)
replace_once(
    service,
    "          payload: { workflowRunId: request.workflowRunId },\n          idempotencyKey: `phase:${request.phaseId}:ci-completed:${request.workflowRunId}`,",
    "          payload: {\n            workflowRunId: request.workflowRunId,\n            skillId: phase.skillId,\n          },\n          idempotencyKey: `phase:${request.phaseId}:ci-completed:${request.workflowRunId}`,",
)

mission_completed_block = """        event({
          missionId: request.missionId,
          phaseId: request.phaseId,
          agentId: phase.agentId,
          eventType: 'MISSION_COMPLETED',
          payload: { workflowRunId: request.workflowRunId },
          idempotencyKey: `mission:${request.missionId}:ci-completed:${request.workflowRunId}`,
          occurredAt: now,
        }),
"""
replace_once(service, mission_completed_block, "")
