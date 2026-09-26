#!/usr/bin/env python3
import json
from pathlib import Path

from architecture_source_adapter_v01 import build_source_bundle
from context_consumer_v02 import render

ROOT=Path(__file__).resolve().parents[2]
src=json.loads((ROOT/"docs/examples/MCF-WORLD-ARCH-SOURCE-BUNDLE-v0.1.json").read_text())
bundle=build_source_bundle(src,"2026-09-26T11:30:00Z")
bundle2=build_source_bundle(json.loads(json.dumps(src)),"2026-09-26T11:30:00Z")
assert bundle == bundle2, "architecture source adapter rebuild is not deterministic"
page=render(bundle)
sl=bundle["contextSlice"]
packet=bundle["agentContextPacket"]

state=packet["currentState"][0]
assert state["content"]=="BLOCKED"
assert state["trust"]["class"]=="CANONICAL_SOURCE"

assert any(x["freshness"]=="UNKNOWN" and x["subject"]["canonicalRef"]=="mcf://evidence/ARCH-S-signature" for x in sl["entries"])
assert any(x["freshness"]=="STALE" and x["subject"]["canonicalRef"]=="provider://runtime/ARCH-S/snapshot" for x in sl["entries"])
assert any(x["trust"]["class"]=="UNTRUSTED_EXTERNAL" for x in sl["entries"])
assert any(d["type"]=="SOURCE_CONFLICT" for d in sl["diagnostics"])
assert any(d["type"]=="MISSING_CANONICAL_VALUE" for d in sl["diagnostics"])
assert any(x["trust"]["class"]=="PROJECTION_DERIVED" and x["category"]=="NEXT_ACTION" for x in sl["entries"])

# VERIFIED_EXTERNAL is not automatically domain-authoritative.
region = next(x for x in sl["entries"] if x["subject"]["canonicalRef"]=="mcf://evidence/ARCH-S-region")
assert region["content"].endswith("region-a"), region
assert region["freshness"]=="FRESH"
assert region["trust"]["class"]=="CANONICAL_SOURCE"
assert any("Deployment region" in d["message"] and d["type"]=="SOURCE_CONFLICT" for d in sl["diagnostics"])

# When two sources are explicitly declared co-authoritative, disagreement is UNKNOWN.
joint = next(x for x in sl["entries"] if x["subject"]["canonicalRef"]=="mcf://evidence/ARCH-S-joint-release")
assert joint["freshness"]=="UNKNOWN"
assert joint["trust"]["class"]=="PROJECTION_DERIVED"
assert any("co-authoritative" in d["message"] for d in sl["diagnostics"])

slice_by_id={x["id"]:x for x in sl["entries"]}
for key in ["objective","constraints","currentState","decisions","blockers","nextActions","openQuestions"]:
    for item in packet[key]:
        assert item == slice_by_id[item["id"]]
assert packet["diagnostics"]==sl["diagnostics"]

for marker in ["BLOCKED","UNKNOWN","STALE","UNTRUSTED_EXTERNAL","SOURCE_CONFLICT","MISSING_CANONICAL_VALUE","PROJECTION_DERIVED"]:
    assert marker in page, marker

print("FULL_PIPELINE_V01 PASS")
print("projectedObjects",len(bundle["projectedObjects"]))
print("entries",len(sl["entries"]))
print("relations",len(sl["relations"]))
print("diagnostics",[d["type"] for d in sl["diagnostics"]])
