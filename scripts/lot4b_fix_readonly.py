from pathlib import Path

branch_files = [
    'apps/rede-social-agentes/apps/server/src/mcf-runtime/chat-mission-planner.ts',
    'apps/rede-social-agentes/apps/server/src/mcf-runtime/skill-executor-lot4-evaluate-agents.test.ts',
    'apps/rede-social-agentes/apps/server/src/mcf-runtime/chat-mission-planner-lot4-evaluate-agents.test.ts',
    'apps/rede-social-agentes/apps/server/src/mcf-runtime/mission-runtime-lot4-evaluate-agents.integration.test.ts',
]

for file_name in branch_files:
    path = Path(file_name)
    text = path.read_text()
    if 'evaluate-agents' not in text:
        raise SystemExit(f'expected evaluate-agents in {file_name}')
    path.write_text(text.replace('evaluate-agents', 'inspect-agent-evaluation'))

core_test = Path(
    'apps/rede-social-agentes/apps/server/src/mcf-runtime/skill-executor-lot4-core.test.ts'
)
text = core_test.read_text()
old = ").rejects.toThrow(/governed internal provider/u);"
new = ").rejects.toThrow(/internal provider/u);"
if old not in text:
    raise SystemExit('expected Lot 4A provider message assertion')
core_test.write_text(text.replace(old, new, 1))
