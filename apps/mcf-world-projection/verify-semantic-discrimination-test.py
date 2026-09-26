#!/usr/bin/env python3
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parent
html=(ROOT/"semantic-discrimination-test.html").read_text()
server=(ROOT/"semantic-discrimination-server.py").read_text()

assert 'schema:"mcf-world-semantic-discrimination/v1"' in html
assert 'fixtureId:"S"' in html
assert 'fixture:world-projection-semantic-visual-s:v1' in html
assert '34c68563907027b166543b9e7d296fd61a0094bd' in html
assert 'src="./semantic-visual-world-test-s.html"' in html
assert 'mcf-world-semantic-discrimination-s-result' in html
assert 'attachWorldInstrumentation()' in html

expected=[
("Qual item ainda não foi confirmado?","Signature receipt","evidence:rebuild"),
("Qual item precisa ser revalidado porque pode ter mudado?","Runtime snapshot","gate:future"),
("Qual objeto foi observado pelo provider, mas não é o receipt/evidence canônico?","Build #1142","effect:pr380"),
("Qual objeto é um Gate?","Approval Gate","gate:read-only"),
("Qual é o estado atual da missão?","BLOCKED","mission:world"),
("Abra Relações, selecione Rafael e observe o painel de detalhe. Qual rótulo confirma que ele está em foco?","Selecionado","agent:emily")
]
for q,a,eid in expected:
    assert q in html
    assert 'expected:"'+a+'"' in html
    assert 'expectedEntityId:"'+eid+'"' in html

for metric in ["firstTargetCorrect","wrongObjectOpens","surfaceSwitches","activeSurfaceAtAnswer","interactionCount","interactions"]:
    assert metric in html, metric

assert 'qualitative' in html
assert 'legend_helpful' in html
assert 'visual_language_easy_to_learn' in html
assert 'confusing_signals' in html
assert 'fetch("/result",{method:"POST"' in html

assert 'mcf-world-semantic-discrimination/v1' in server
assert '127.0.0.1' in server
assert 'EXPECTED_PROTOTYPE_REVISION' in server
assert 'EXPECTED_FIXTURE_REVISION' in server
assert '.replace(self.result_path)' in server
assert 'serve_forever' in server

print("SEMANTIC_DISCRIMINATION_TEST_STATIC PASS")
print("tasks",len(expected))

assert 'world.classList.remove("pending")' in html

assert 'startedAt=new Date().toISOString()' in html

assert 'const instrumentTimer=setInterval' in html

assert '__mcfRecordInteraction' in html



base=(ROOT/"semantic-visual-world.html").read_text()
instrumented=(ROOT/"semantic-visual-world-test-s.html").read_text()
start_marker="<!-- TEST-INSTRUMENTATION-START -->"
end_marker="<!-- TEST-INSTRUMENTATION-END -->"
assert start_marker in instrumented and end_marker in instrumented
a=instrumented.index(start_marker)
b=instrumented.index(end_marker)+len(end_marker)
if instrumented[b:b+1]=="\n":
    b+=1
stripped=instrumented[:a]+instrumented[b:]
assert stripped==base
assert "__mcfInstrumentationReady=true" in instrumented
