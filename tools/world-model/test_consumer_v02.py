#!/usr/bin/env python3
import json
from pathlib import Path
from context_consumer_v02 import render, packet_entry_ids

ROOT=Path(__file__).resolve().parents[2]
bundle=json.loads((ROOT/"docs/examples/MCF-WORLD-CONSISTENCY-FIXTURE-v0.1.json").read_text())
sl=bundle["contextSlice"]
packet=bundle["agentContextPacket"]
page=render(bundle)

slice_by_id={x["id"]:x for x in sl["entries"]}
mapping={
 "objective":"GOAL",
 "constraints":"CONSTRAINT",
 "currentState":"STATE",
 "decisions":"DECISION",
 "blockers":"BLOCKER",
 "nextActions":"NEXT_ACTION",
 "openQuestions":"OPEN_QUESTION"
}
for packet_key,category in mapping.items():
    for item in packet[packet_key]:
        assert item["id"] in slice_by_id, (packet_key,item["id"])
        assert item == slice_by_id[item["id"]], f"{packet_key} diverged from ContextSlice"
        assert item["category"] == category

assert packet["diagnostics"] == sl["diagnostics"], "diagnostics diverged"
assert packet["attention"]["unknownRefs"] == sl["unknownRefs"], "UNKNOWN attention diverged"
assert packet["attention"]["staleRefs"] == sl["staleRefs"], "STALE attention diverged"
assert {x["id"] for x in sl["unknownRefs"]} <= {x["id"] for x in packet["relevantEvidence"]}, "UNKNOWN evidence missing from packet reachability"
assert {x["id"] for x in sl["staleRefs"]} <= {x["id"] for x in packet["relevantEvidence"]}, "STALE evidence missing from packet reachability"

for entry in sl["entries"]:
    if entry["category"] in {"STATE","GOAL","CONSTRAINT","DECISION","BLOCKER","EVIDENCE","NEXT_ACTION","OPEN_QUESTION"}:
        assert 'data-entry-id="'+entry["id"]+'"' in page, f"human view omitted {entry['id']}"
        assert entry["freshness"] in page
        assert entry["trust"]["class"] in page
        for sr in entry["provenance"]["sourceRefs"]:
            assert sr["ref"] in page

for d in sl["diagnostics"]:
    assert 'data-diagnostic-type="'+d["type"]+'"' in page
    assert d["message"] in page

assert "evidence:signature-s" in page
assert "evidence:runtime-snapshot-s" in page
assert "UNKNOWN" in page
assert "STALE" in page
assert "UNTRUSTED_EXTERNAL" in page
assert "SOURCE_CONFLICT" in page
assert "mcf-agent-context-packet/v1" in page
assert "fetch(" not in page
assert "WebSocket" not in page
assert "XMLHttpRequest" not in page
assert "localStorage" not in page

print("CONTEXT_CONSUMER_V02_CONSISTENCY PASS")
print("sliceEntries",len(sl["entries"]))
print("packetEntryIds",json.dumps(packet_entry_ids(packet),sort_keys=True))
print("diagnostics",len(sl["diagnostics"]))
