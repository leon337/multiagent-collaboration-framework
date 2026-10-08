#!/usr/bin/env python3
import copy
import json
from pathlib import Path
import yaml

from real_source_adapter_v01 import build_real_sources, sha256_file
from operational_context_adapter_v01 import build_operational_context, GATES
from context_consumer_v03 import render

ROOT=Path(__file__).resolve().parents[2]
MISSION_PATH=ROOT/"context/missions/mcf-world-projection-001.json"
PROJECT_PATH=ROOT/"context/projects/multiagent-collaboration-framework.yaml"
SNAPSHOT_PATH=ROOT/"docs/evidence/MCF-WORLD-REAL-PROVIDER-SNAPSHOT-20260926T094030Z.json"
OWNERSHIP_PATH=ROOT/"docs/contracts/MCF-WORLD-REAL-SOURCE-OWNERSHIP-v0.1.json"

mission=json.loads(MISSION_PATH.read_text())
project=yaml.safe_load(PROJECT_PATH.read_text())
snapshot=json.loads(SNAPSHOT_PATH.read_text())
ownership=json.loads(OWNERSHIP_PATH.read_text())
source_revisions={
 "missionRecord":sha256_file(MISSION_PATH),
 "projectRegistry":sha256_file(PROJECT_PATH),
 "providerSnapshot":sha256_file(SNAPSHOT_PATH),
}
base=build_real_sources(
    mission,project,snapshot,ownership,source_revisions,
    "2026-09-26T09:44:30Z"
)
bundle=build_operational_context(base,mission,ROOT,"leon337/multiagent-collaboration-framework")
page=render(bundle)
sl=bundle["contextSlice"]
objects_by_id={x["ref"]["id"]:x for x in bundle["projectedObjects"]}

supported=[r for r in sl["relations"] if r["type"]=="supported_by"]
assert len(supported)==len(GATES), (len(supported),len(GATES))

for r in supported:
    target=r["to"]
    obj=objects_by_id[target["id"]]
    assert obj["freshness"]!="UNKNOWN"
    assert obj["trust"]["class"]=="PROJECTION_DERIVED"
    assert 'data-nav-evidence="'+target["id"]+'"' in page
    assert 'data-evidence-detail="'+target["id"]+'"' in page
    assert target["canonicalRef"] in page
    assert obj["revision"]["value"] in page
    assert r["trust"]["class"]=="PROJECTION_DERIVED"

# Presentation-only navigation: no network, local storage or mutation channel.
for forbidden in ["fetch(", "XMLHttpRequest", "WebSocket", "localStorage", "POST", "PUT", "PATCH"]:
    assert forbidden not in page, forbidden
assert "history.replaceState" in page
assert "URLSearchParams" in page

# Missing evidence remains reachable as expected evidence, but never as supported_by navigation.
bad=copy.deepcopy(mission)
bad["world_real_source_gate_doc"]="docs/reviews/DOES-NOT-EXIST.md"
missing_bundle=build_operational_context(base,bad,ROOT,"leon337/multiagent-collaboration-framework")
missing_page=render(missing_bundle)
missing_ref=next(r for r in missing_bundle["contextSlice"]["unknownRefs"] if "DOES-NOT-EXIST" in r["canonicalRef"])
assert missing_ref in missing_bundle["agentContextPacket"]["relevantEvidence"]
assert 'data-nav-evidence="'+missing_ref["id"]+'"' not in missing_page
assert not any(r["type"]=="supported_by" and r["to"]==missing_ref for r in missing_bundle["contextSlice"]["relations"])

print("CONTEXT_NAVIGATION_V03 PASS")
print("supportedEvidence",len(supported))
print("entries",len(sl["entries"]))
print("objects",len(bundle["projectedObjects"]))
