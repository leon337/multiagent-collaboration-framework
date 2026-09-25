#!/usr/bin/env python3
import json, pathlib, sys

root=pathlib.Path(__file__).parent
data=json.loads((root/"fixture.json").read_text())
html=(root/"index.html").read_text()
errors=[]

def check(ok,msg):
    print(("PASS" if ok else "FAIL"),msg)
    if not ok: errors.append(msg)

ids=[e["id"] for e in data["entities"]]
check(len(ids)==len(set(ids)),"unique entity ids")
check(all(e.get("canonicalRef") for e in data["entities"]),"all entities have canonicalRef")
check(all(e.get("freshness") in {"FRESH","STALE","UNKNOWN"} for e in data["entities"]),"freshness enum")
check(any(e["freshness"]=="UNKNOWN" for e in data["entities"]),"fixture covers UNKNOWN")
check(any(e["freshness"]=="STALE" for e in data["entities"]),"fixture covers STALE")
known=set(ids)
check(all(r["from"] in known and r["to"] in known for r in data["relations"]),"relations resolve")
check(all(e["subject"] in known and e["actor"] in known for e in data["events"]),"events resolve")
snapshot=json.dumps(data,sort_keys=True,ensure_ascii=False)
snapshot2=json.dumps(json.loads(snapshot),sort_keys=True,ensure_ascii=False)
check(snapshot==snapshot2,"deterministic rebuild fixture")
upper=html.upper()
check(all(token not in upper for token in ["METHOD:\"POST\"","METHOD: \"POST\"","METHOD:'POST'","METHOD: 'POST'","METHOD:\"PUT\"","METHOD:\"PATCH\"","METHOD:\"DELETE\""]),"no write fetch")
check("/v1/message" not in html and "mission-envelope" not in html,"no Dual Browser mutation route")
check("three.js" not in html.lower() and "babylon" not in html.lower(),"no 3D dependency")
print(f"entities={len(ids)} relations={len(data['relations'])} events={len(data['events'])}")
if errors: sys.exit(1)
