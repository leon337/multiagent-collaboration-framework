#!/usr/bin/env python3
import copy
import json
from pathlib import Path
import yaml

from real_source_adapter_v01 import build_real_sources, sha256_file
from operational_context_adapter_v01 import build_operational_context
from source_preview_v01 import build_source_previews
from context_consumer_v04 import render

ROOT=Path(__file__).resolve().parents[2]
MISSION_PATH=ROOT/"context/missions/mcf-world-projection-001.json"
PROJECT_PATH=ROOT/"context/projects/multiagent-collaboration-framework.yaml"
SNAPSHOT_PATH=ROOT/"docs/evidence/MCF-WORLD-REAL-PROVIDER-SNAPSHOT-20260926T094030Z.json"
OWNERSHIP_PATH=ROOT/"docs/contracts/MCF-WORLD-REAL-SOURCE-OWNERSHIP-v0.1.json"

mission=json.loads(MISSION_PATH.read_text())
project=yaml.safe_load(PROJECT_PATH.read_text())
snapshot=json.loads(SNAPSHOT_PATH.read_text())
ownership=json.loads(OWNERSHIP_PATH.read_text())
revs={
 "missionRecord":sha256_file(MISSION_PATH),
 "projectRegistry":sha256_file(PROJECT_PATH),
 "providerSnapshot":sha256_file(SNAPSHOT_PATH),
}
base=build_real_sources(mission,project,snapshot,ownership,revs,"2026-09-26T09:44:30Z")
bundle=build_operational_context(base,mission,ROOT,"leon337/multiagent-collaboration-framework")
previews=build_source_previews(bundle,ROOT)
page=render(bundle,previews)

matched=[x for x in previews["previews"].values() if x["status"]=="MATCHED"]
assert len(matched)==5, len(matched)
assert not previews["errors"], previews["errors"]

objects={x["ref"]["id"]:x for x in bundle["projectedObjects"]}
for p in matched:
    obj=objects[p["evidenceId"]]
    assert p["observedRevision"]==obj["revision"]["value"]
    assert p["expectedRevision"]==obj["revision"]["value"]
    assert p["content"]
    assert p["lineStart"]>=1 and p["lineEnd"]>=p["lineStart"]
    assert 'data-source-preview="'+p["evidenceId"]+'"' in page
    assert 'data-source-preview-detail="'+p["evidenceId"]+'"' in page

for forbidden in ["fetch(", "XMLHttpRequest", "WebSocket", "localStorage"]:
    assert forbidden not in page

# Revision mismatch must fail closed: no source content exposed.
mismatch=copy.deepcopy(bundle)
target=next(x for x in mismatch["projectedObjects"] if x["ref"]["id"] in {p["evidenceId"] for p in matched})
target["revision"]["value"]="sha256:"+"0"*64
mp=build_source_previews(mismatch,ROOT)
x=mp["previews"][target["ref"]["id"]]
assert x["status"]=="REVISION_MISMATCH"
assert x["content"] is None

# Path traversal is rejected.
evil=copy.deepcopy(bundle)
target=next(x for x in evil["projectedObjects"] if x["ref"]["id"] in {p["evidenceId"] for p in matched})
target["sourceRefs"]=[{"source":"repo-file","ref":"../../etc/passwd"}]
ep=build_source_previews(evil,ROOT)
assert any(err["type"]=="PATH_OUTSIDE_REPO" and err["evidenceId"]==target["ref"]["id"] for err in ep["errors"])
assert target["ref"]["id"] not in ep["previews"]

# UNKNOWN / missing evidence never acquires a source preview.
bad=copy.deepcopy(mission)
bad["world_real_source_gate_doc"]="docs/reviews/DOES-NOT-EXIST.md"
missing_bundle=build_operational_context(base,bad,ROOT,"leon337/multiagent-collaboration-framework")
missing_ref=next(r for r in missing_bundle["contextSlice"]["unknownRefs"] if "DOES-NOT-EXIST" in r["canonicalRef"])
missing_previews=build_source_previews(missing_bundle,ROOT)
assert missing_ref["id"] not in missing_previews["previews"]

print("SOURCE_PREVIEW_V04 PASS")
print("matchedPreviews",len(matched))
