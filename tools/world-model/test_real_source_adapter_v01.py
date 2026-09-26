#!/usr/bin/env python3
import copy
import json
from pathlib import Path
import yaml

from real_source_adapter_v01 import build_real_sources
from context_consumer_v02 import render

ROOT=Path(__file__).resolve().parents[2]
mission=json.loads((ROOT/"context/missions/mcf-world-projection-001.json").read_text())
project=yaml.safe_load((ROOT/"context/projects/multiagent-collaboration-framework.yaml").read_text())
snapshot=json.loads((ROOT/"docs/evidence/MCF-WORLD-REAL-PROVIDER-SNAPSHOT-20260926T094030Z.json").read_text())
ownership=json.loads((ROOT/"docs/contracts/MCF-WORLD-REAL-SOURCE-OWNERSHIP-v0.1.json").read_text())

a=build_real_sources(mission,project,snapshot,ownership)
b=build_real_sources(copy.deepcopy(mission),copy.deepcopy(project),copy.deepcopy(snapshot),copy.deepcopy(ownership))
assert a==b, "real-source rebuild is not deterministic"
sl=a["contextSlice"]; packet=a["agentContextPacket"]
assert packet["currentState"][0]["content"]==mission["current_state"]
assert any("Issue #379 state: open" in x["content"] for x in sl["entries"])
assert any("PR #380 state: open; draft=true; merged=false" in x["content"] for x in sl["entries"])
assert any("HEAD=075cd9b234eb70c2be8a8aeedbb7b4f44709dfa5" in x["content"] for x in sl["entries"])
assert not sl["diagnostics"], sl["diagnostics"]

# Owner unavailable: PR state must become UNKNOWN; local Git cannot substitute.
missing=copy.deepcopy(snapshot)
missing["github"].pop("pr380")
x=build_real_sources(mission,project,missing,ownership)
pr_entry=next(e for e in x["contextSlice"]["entries"] if e["id"]=="ctx:real-pr380")
assert pr_entry["freshness"]=="UNKNOWN"
assert any(d["type"]=="MISSING_CANONICAL_VALUE" and "local Git cannot substitute" in d["message"] for d in x["contextSlice"]["diagnostics"])

# Cross-source divergence remains explicit; neither source fact is overwritten.
drift=copy.deepcopy(snapshot)
drift["github"]["pr380"]["headSha"]="deadbeef"*5
y=build_real_sources(mission,project,drift,ownership)
assert any(d["type"]=="SOURCE_CONFLICT" and "Local Git HEAD differs" in d["message"] for d in y["contextSlice"]["diagnostics"])
local_entry=next(e for e in y["contextSlice"]["entries"] if e["id"]=="ctx:real-local-git")
pr_entry=next(e for e in y["contextSlice"]["entries"] if e["id"]=="ctx:real-pr380")
assert "075cd9b234eb70c2be8a8aeedbb7b4f44709dfa5" in local_entry["content"]
assert ("deadbeef"*5) in pr_entry["content"]

# Repository identity mismatch is diagnostic; project registry remains owner of project identity.
repo_drift=copy.deepcopy(snapshot)
repo_drift["repository"]="other/repository"
z=build_real_sources(mission,project,repo_drift,ownership)
assert z["contextSlice"]["scope"]["project"]["canonicalRef"]=="github://leon337/multiagent-collaboration-framework"
assert any(d["type"]=="SOURCE_CONFLICT" and "repository differs" in d["message"] for d in z["contextSlice"]["diagnostics"])

# Human and agent views still consume the same read model.
page=render(a)
for marker in [mission["current_state"],"Issue #379 state: open","PR #380 state: open","075cd9b234eb70c2be8a8aeedbb7b4f44709dfa5"]:
    assert marker in page

print("REAL_SOURCE_ADAPTER_V01 PASS")
print("entries",len(sl["entries"]))
print("projectedObjects",len(a["projectedObjects"]))
print("diagnostics",len(sl["diagnostics"]))
