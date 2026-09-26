#!/usr/bin/env python3
import copy
import hashlib
import json
from pathlib import Path

from adapter_v01 import IdentityResolver, relation, source_ref
from source_preview_v01 import build_source_previews
from evidence_anchor_v01 import build_anchors
from context_consumer_v05 import render

ROOT=Path(__file__).resolve().parents[2]
SRC=ROOT/"docs/examples/MCF-WORLD-ANCHOR-SOURCE-v0.1.md"
META=ROOT/"docs/examples/MCF-WORLD-EVIDENCE-ANCHORS-v0.1.json"
repo="leon337/multiagent-collaboration-framework"
digest="sha256:"+hashlib.sha256(SRC.read_bytes()).hexdigest()
resolver=IdentityResolver()
mission=resolver.resolve("mission","mcf://mission/ANCHOR-FIXTURE")
decision=resolver.resolve("decision","mcf://mission/ANCHOR-FIXTURE#gate/demo")
evidence=resolver.resolve("evidence","repo-file://"+repo+"/docs/examples/MCF-WORLD-ANCHOR-SOURCE-v0.1.md")
agent=resolver.resolve("agent","mcf://agent/MESTRE")

entry={
 "id":"ctx:anchor-decision","subject":decision,"category":"DECISION","content":"demo gate: PASS",
 "provenance":{"mode":"EXPLICIT","sourceRefs":[{"source":"fixture","ref":"anchor/demo#status"}]},
 "freshness":"FRESH","trust":{"class":"REPRESENTATIVE_FIXTURE"},
 "revision":{"source":"fixture","value":"anchor-fixture-v1"}
}
bundle={
 "schema":"world-adapter-output/v1","sourceRevision":"anchor-fixture-v1","generatedAt":"2026-09-26T12:00:00Z",
 "projectedObjects":[
  {"ref":mission,"revision":{"source":"fixture","value":"anchor-fixture-v1"},"observedAt":"2026-09-26T12:00:00Z","freshness":"FRESH","trust":{"class":"REPRESENTATIVE_FIXTURE"},"payload":{"title":"Anchor Fixture","state":"WORKING","objective":"Test explicit anchors"},"sourceRefs":[{"source":"fixture","ref":"anchor/demo"}],"diagnostics":[]},
  {"ref":decision,"revision":{"source":"fixture","value":"anchor-fixture-v1"},"observedAt":"2026-09-26T12:00:00Z","freshness":"FRESH","trust":{"class":"REPRESENTATIVE_FIXTURE"},"payload":{"statement":"demo gate: PASS","status":"PASS","decidedAt":None},"sourceRefs":[{"source":"fixture","ref":"anchor/demo#status"}],"diagnostics":[]},
  {"ref":evidence,"revision":{"source":"repo-file","value":digest},"observedAt":"2026-09-26T12:00:00Z","freshness":"FRESH","trust":{"class":"PROJECTION_DERIVED","reason":"Representative evidence for anchor test."},"payload":{"evidenceType":"gate-review","summary":"Anchor fixture evidence"},"sourceRefs":[{"source":"repo-file","ref":"docs/examples/MCF-WORLD-ANCHOR-SOURCE-v0.1.md"}],"diagnostics":[]}
 ],
 "contextSlice":{
  "schema":"world-context-slice/v1","scope":{"mission":mission},"revisionVector":[{"source":"fixture","revision":"anchor-fixture-v1"}],"generatedAt":"2026-09-26T12:00:00Z","focus":[mission],"entries":[entry],
  "relations":[relation("rel:anchor-demo","supported_by",decision,evidence,"EXPLICIT",[source_ref("fixture","anchor/demo#evidence")],trust_class="PROJECTION_DERIVED",reason="Representative support relation.")],
  "unknownRefs":[],"staleRefs":[],"sourceRefs":[{"source":"fixture","ref":"anchor/demo"}],"diagnostics":[]
 },
 "agentContextPacket":{
  "schema":"mcf-agent-context-packet/v1","packetId":"context:anchor-fixture","generatedAt":"2026-09-26T12:00:00Z","recipient":agent,"scope":{"mission":mission},
  "objective":[],"constraints":[],"currentState":[],"decisions":[entry],"blockers":[],"nextActions":[],"relevantArtifacts":[],"relevantEvidence":[evidence],"openQuestions":[],
  "revisionVector":[{"source":"fixture","revision":"anchor-fixture-v1"}],"sourceRefs":[{"source":"fixture","ref":"anchor/demo"}],"diagnostics":[],"authorityRef":"mcf://authority/LEANDRO"
 }
}
metadata=json.loads(META.read_text())
previews=build_source_previews(bundle,ROOT)
anchors=build_anchors(bundle,metadata,ROOT)
page=render(bundle,previews,anchors)
a=anchors["anchors"][evidence["id"]]

assert a["status"]=="MATCHED"
assert a["lineStart"]==9 and a["lineEnd"]==11
assert a["content"]=="Verdict: PASS\nScope: read-only projection\nEvidence: source bytes must match the Evidence revision"
assert a["declaredBy"]["source"]=="fixture-anchor-metadata"
assert 'data-anchor-id="'+a["anchorId"]+'"' in page
assert 'data-anchor-detail="'+a["anchorId"]+'"' in page
for forbidden in ["fetch(", "XMLHttpRequest", "WebSocket", "localStorage"]:
    assert forbidden not in page

none=build_anchors(bundle,{"schema":"world-evidence-anchor-metadata/v1","metadataRevision":"x","anchors":[]},ROOT)
assert not none["anchors"]

conflict=copy.deepcopy(metadata)
conflict["anchors"].append(copy.deepcopy(conflict["anchors"][0]))
conflict["anchors"][1]["anchorId"]="anchor:conflict"
c=build_anchors(bundle,conflict,ROOT)["anchors"][evidence["id"]]
assert c["status"]=="ANCHOR_CONFLICT" and c["content"] is None

sm=copy.deepcopy(metadata)
sm["anchors"][0]["sourceRef"]={"source":"repo-file","ref":"docs/examples/other.md"}
assert build_anchors(bundle,sm,ROOT)["anchors"][evidence["id"]]["status"]=="SOURCE_MISMATCH"

bad=copy.deepcopy(metadata);bad["anchors"][0]["lineStart"]=999;bad["anchors"][0]["lineEnd"]=1000
r=build_anchors(bundle,bad,ROOT)["anchors"][evidence["id"]]
assert r["status"]=="RANGE_INVALID" and r["content"] is None

rb=copy.deepcopy(bundle)
next(x for x in rb["projectedObjects"] if x["ref"]["id"]==evidence["id"])["revision"]["value"]="sha256:"+"0"*64
rr=build_anchors(rb,metadata,ROOT)["anchors"][evidence["id"]]
assert rr["status"]=="REVISION_MISMATCH" and rr["content"] is None

print("EVIDENCE_ANCHOR_V05 PASS")
print("anchor",a["anchorId"],a["lineStart"],a["lineEnd"])
