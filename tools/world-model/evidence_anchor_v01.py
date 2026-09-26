#!/usr/bin/env python3
import argparse
import hashlib
import json
from collections import defaultdict
from pathlib import Path

from source_preview_v01 import safe_repo_path

def digest_bytes(raw):
    return "sha256:" + hashlib.sha256(raw).hexdigest()

def supported_evidence(bundle):
    out=set()
    for r in bundle.get("contextSlice",{}).get("relations",[]):
        if r.get("type")=="supported_by":
            out.add(r["to"]["id"])
    return out

def build_anchors(bundle, metadata, repo_root, context_before=2, context_after=2):
    by_canonical={
        x["ref"]["canonicalRef"]:x
        for x in bundle.get("projectedObjects",[])
        if x["ref"]["kind"]=="evidence"
    }
    supported=supported_evidence(bundle)
    groups=defaultdict(list)
    for a in metadata.get("anchors",[]):
        groups[a["evidenceCanonicalRef"]].append(a)

    results={}
    diagnostics=[]

    for canonical_ref, anchors in groups.items():
        obj=by_canonical.get(canonical_ref)
        if not obj:
            diagnostics.append({"type":"EVIDENCE_NOT_MATERIALIZED","canonicalRef":canonical_ref})
            continue
        eid=obj["ref"]["id"]
        if eid not in supported or obj.get("freshness")=="UNKNOWN":
            diagnostics.append({"type":"EVIDENCE_NOT_ELIGIBLE","evidenceId":eid})
            continue
        if len(anchors)!=1:
            results[eid]={
                "status":"ANCHOR_CONFLICT",
                "evidenceId":eid,
                "anchorIds":[a.get("anchorId") for a in anchors],
                "content":None
            }
            continue

        a=anchors[0]
        src=a.get("sourceRef")
        evidence_repo_refs=[x for x in obj.get("sourceRefs",[]) if x.get("source")=="repo-file"]
        if len(evidence_repo_refs)!=1 or src != evidence_repo_refs[0]:
            results[eid]={"status":"SOURCE_MISMATCH","evidenceId":eid,"anchorId":a.get("anchorId"),"content":None}
            continue

        try:
            path=safe_repo_path(repo_root,src["ref"])
        except ValueError:
            results[eid]={"status":"PATH_OUTSIDE_REPO","evidenceId":eid,"anchorId":a.get("anchorId"),"content":None}
            continue
        if not path.is_file():
            results[eid]={"status":"SOURCE_MISSING","evidenceId":eid,"anchorId":a.get("anchorId"),"content":None}
            continue

        raw=path.read_bytes()
        observed=digest_bytes(raw)
        expected=obj.get("revision",{}).get("value")
        if observed != expected:
            results[eid]={
                "status":"REVISION_MISMATCH","evidenceId":eid,"anchorId":a.get("anchorId"),
                "expectedRevision":expected,"observedRevision":observed,"content":None
            }
            continue

        start=a.get("lineStart"); end=a.get("lineEnd")
        lines=raw.decode("utf-8",errors="replace").splitlines()
        valid=isinstance(start,int) and isinstance(end,int) and start>=1 and end>=start and end<=len(lines)
        if not valid:
            results[eid]={
                "status":"RANGE_INVALID","evidenceId":eid,"anchorId":a.get("anchorId"),
                "lineStart":start,"lineEnd":end,"lineCount":len(lines),"content":None
            }
            continue

        cstart=max(1,start-context_before)
        cend=min(len(lines),end+context_after)
        results[eid]={
            "status":"MATCHED",
            "evidenceId":eid,
            "anchorId":a["anchorId"],
            "sourceRef":src,
            "sourceRevision":observed,
            "metadataRevision":metadata.get("metadataRevision"),
            "declaredBy":a["declaredBy"],
            "lineStart":start,
            "lineEnd":end,
            "contextStart":cstart,
            "contextEnd":cend,
            "content":"\n".join(lines[start-1:end]),
            "context":"\n".join(lines[cstart-1:cend])
        }

    return {"schema":"world-evidence-anchor/v1","anchors":results,"diagnostics":diagnostics}

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--bundle",required=True)
    ap.add_argument("--metadata",required=True)
    ap.add_argument("--repo-root",required=True)
    ap.add_argument("--output",required=True)
    args=ap.parse_args()
    bundle=json.loads(Path(args.bundle).read_text())
    metadata=json.loads(Path(args.metadata).read_text())
    out=build_anchors(bundle,metadata,args.repo_root)
    Path(args.output).write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n")
    print(args.output)

if __name__=="__main__":
    main()
