#!/usr/bin/env python3
import copy
import json
import os
import tempfile
from pathlib import Path

from operational_context_adapter_v01 import build_operational_context, GATES, digest_file
from context_consumer_v02 import render

ROOT=Path(__file__).resolve().parents[2]
BASE=Path(os.environ.get("MCF_WORLD_OPERATIONAL_BASE","/tmp/mcf-world-operational-base.json"))
if not BASE.exists():
    raise SystemExit("base bundle missing: "+str(BASE))
base=json.loads(BASE.read_text())
mission=json.loads((ROOT/"context/missions/mcf-world-projection-001.json").read_text())

a=build_operational_context(base,mission,ROOT,"leon337/multiagent-collaboration-framework")
b=build_operational_context(copy.deepcopy(base),copy.deepcopy(mission),ROOT,"leon337/multiagent-collaboration-framework")
assert a==b, "operational context rebuild not deterministic"

sl=a["contextSlice"]; packet=a["agentContextPacket"]
assert sl["scope"]["context"]["kind"]=="context"
assert packet["scope"]["context"]==sl["scope"]["context"]
assert sl["focus"]==[sl["scope"]["context"]]
assert any(x["category"]=="CONSTRAINT" and "NOT_STARTED_DEFERRED" in x["content"] for x in sl["entries"])
assert any(x["category"]=="NEXT_ACTION" and x["id"]=="ctx:operational-world-next" for x in sl["entries"])

for spec in GATES:
    dec=next(x for x in sl["entries"] if x["id"]=="ctx:gate:"+spec["name"])
    assert dec["content"].endswith("PASS"), dec
    doc=mission[spec["docField"]]
    ev_ref="repo-file://leon337/multiagent-collaboration-framework/"+doc
    ev_obj=next(x for x in a["projectedObjects"] if x["ref"]["canonicalRef"]==ev_ref)
    assert ev_obj["freshness"]=="FRESH"
    assert ev_obj["trust"]["class"]=="PROJECTION_DERIVED"
    assert ev_obj["revision"]["value"]==digest_file(ROOT/doc)
    support=next(r for r in sl["relations"] if r["type"]=="supported_by" and r["from"]==dec["subject"] and r["to"]==ev_obj["ref"])
    assert support["trust"]["class"]=="PROJECTION_DERIVED"
    assert ev_obj["ref"] in packet["relevantEvidence"]

assert packet["attention"]["unknownRefs"]==sl["unknownRefs"]
assert packet["attention"]["staleRefs"]==sl["staleRefs"]
assert packet["diagnostics"]==sl["diagnostics"]

# Missing gate evidence must not be silently substituted by another gate file.
bad=copy.deepcopy(mission)
bad["world_real_source_gate_doc"]="docs/reviews/DOES-NOT-EXIST.md"
x=build_operational_context(base,bad,ROOT,"leon337/multiagent-collaboration-framework")
assert any(d["type"]=="MISSING_CANONICAL_VALUE" and "DOES-NOT-EXIST" in d["message"] for d in x["contextSlice"]["diagnostics"])
missing_ref=next(r for r in x["contextSlice"]["unknownRefs"] if "DOES-NOT-EXIST" in r["canonicalRef"])
assert missing_ref in x["agentContextPacket"]["attention"]["unknownRefs"]
assert not any(
    r["type"]=="supported_by" and r["to"]==missing_ref
    for r in x["contextSlice"]["relations"]
), "UNKNOWN/missing evidence must not assert supported_by"

# Mixed revisions are preserved, not collapsed into one fake canonical revision.
repo_file_revs=[r for r in sl["revisionVector"] if r["source"].startswith("repo-file:")]
assert len(repo_file_revs)==len(GATES)
assert len({r["revision"] for r in repo_file_revs})>=3

page=render(a)
for spec in GATES:
    doc=mission[spec["docField"]]
    ev_ref="repo-file://leon337/multiagent-collaboration-framework/"+doc
    assert ev_ref in page, "human evidence reachability missing for "+spec["name"]
assert page.count("data-supported-by-ref=") >= len(GATES)

for marker in [
    mission["parallel_architecture_state"],
    "NOT_STARTED_DEFERRED",
    "world-model-contract gate: PASS",
    "real-source-v0.1 gate: PASS"
]:
    assert marker in page, marker

print("OPERATIONAL_CONTEXT_V01 PASS")
print("entries",len(sl["entries"]))
print("projectedObjects",len(a["projectedObjects"]))
print("relations",len(sl["relations"]))
print("evidenceRefs",len(packet["relevantEvidence"]))
print("revisionVector",len(sl["revisionVector"]))
