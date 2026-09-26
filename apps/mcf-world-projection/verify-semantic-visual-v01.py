#!/usr/bin/env python3
from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parent
html=(ROOT/"semantic-visual-world.html").read_text()
data=json.loads((ROOT/"semantic-visual-fixture-s.json").read_text())
r=json.loads((ROOT/"findability-fixture-r.json").read_text())

assert data["experimentFixtureId"]=="S"
assert data["sourceRevision"]=="fixture:world-projection-semantic-visual-s:v1"
assert data["missionId"]=="NOVA-AUDIT-031"
assert r["experimentFixtureId"]=="R"
assert r["missionId"]=="ORION-TRACE-021"

for token in ["--fresh:","--stale:","--unknown:","--blocked:","--current:"]:
    assert token in html, token
for icon in ["◇","⬢","●","▣","⬡","◈"]:
    assert icon in html, icon
for phrase in ["FRESH · confirmado","STALE · revalidar","UNKNOWN · não confirmado","BLOCKED · bloqueado","Como ler esta interface"]:
    assert phrase in html, phrase
for fn in ["function cockpit()","function timeline()","function graph()"]:
    assert fn in html, fn
assert html.count("semanticFresh(")>=7
assert 'aria-hidden="true"' in html
assert "typeTag" in html and "typeIcon" in html
assert "● selecionado / foco" not in html
assert "Selecionado / foco" in html
assert "● FOCO" not in html
assert "semantic neutral" in html
assert '<span class="semantic current">Selecionado</span>' in html
for forbidden in ["localStorage","WebSocket","XMLHttpRequest","POST","PUT","PATCH"]:
    assert forbidden not in html, forbidden
assert html.count('fetch("./semantic-visual-fixture-s.json"')==1
print("SEMANTIC_VISUAL_V01_STATIC PASS")
print("entities",len(data["entities"]))
print("relations",len(data["relations"]))
print("events",len(data["events"]))
