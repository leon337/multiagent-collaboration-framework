#!/usr/bin/env python3
import json, glob
from collections import Counter, defaultdict
from pathlib import Path
rows=[]
for f in glob.glob("jev-adversarial-state-machine-results/shards/*.ndjson"):
    rows += [json.loads(x) for x in open(f,encoding="utf-8") if x.strip()]
valid=[r for r in rows if not r.get("error")]
mismatch=[r for r in valid if not r.get("match")]
by=defaultdict(Counter)
for r in valid:
    by[r["family"]]["total"] += 1
    by[r["family"]]["match" if r["match"] else "mismatch"] += 1
summary={"benchmark":"MCF-JEV-ADVERSARIAL-STATE-MACHINE-5000","total":len(rows),"valid":len(valid),"errors":len(rows)-len(valid),"matches":len(valid)-len(mismatch),"mismatches":len(mismatch),"families":{k:dict(v) for k,v in sorted(by.items())}}
p=Path("jev-adversarial-state-machine-results")
(p/"summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding="utf-8")
(p/"mismatch-ledger.json").write_text(json.dumps(mismatch,ensure_ascii=False,indent=2),encoding="utf-8")
frontier=sorted(mismatch,key=lambda r:r.get("latencyMs",0),reverse=True)[:200]
(p/"frontier-200.json").write_text(json.dumps(frontier,ensure_ascii=False,indent=2),encoding="utf-8")
(p/"summary.md").write_text("# JEV Adversarial State Machine 5000\n\n```json\n"+json.dumps(summary,indent=2)+"\n```\n",encoding="utf-8")
print(json.dumps(summary,indent=2))
